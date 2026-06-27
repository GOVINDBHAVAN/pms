/**
 * Scoring pipeline — computes goal_score, competency_score, final_score,
 * per-perspective BSC scores, performance band, and 9-box position.
 *
 * Call order:
 *   1. computeGoalScore(targets, settings)
 *   2. computeCompetencyScore(targets, settings)
 *   3. computeFinalScore(goalScore, compScore, settings)
 *   4. assignBand(finalScore, settings.performance_bands)
 *   5. computeBscPerspectiveScores(targets, settings)   [if BSC active]
 *   6. computeNineBoxPosition(finalScore, potentialRating, settings)  [if 9-box enabled]
 */

/**
 * Weighted average of all non-competency approved targets.
 * Returns null if there are no goal targets.
 */
function computeGoalScore(targets) {
  const goalTargets = targets.filter(t =>
    t.framework_type !== 'competency' &&
    t.final_rating != null &&
    t.weight > 0
  );
  if (goalTargets.length === 0) return null;

  const weightSum = goalTargets.reduce((s, t) => s + t.weight, 0);
  const weightedSum = goalTargets.reduce((s, t) => s + (t.final_rating * t.weight), 0);
  return weightedSum / weightSum;
}

/**
 * Weighted average of competency targets only.
 * Returns null if there are no competency targets.
 */
function computeCompetencyScore(targets) {
  const compTargets = targets.filter(t =>
    t.framework_type === 'competency' &&
    t.final_rating != null &&
    t.weight > 0
  );
  if (compTargets.length === 0) return null;

  const weightSum = compTargets.reduce((s, t) => s + t.weight, 0);
  const weightedSum = compTargets.reduce((s, t) => s + (t.final_rating * t.weight), 0);
  return weightedSum / weightSum;
}

/**
 * Combines goal and competency scores per the org's weightage split.
 * If either score is null (no targets of that type), the other score
 * carries 100% of the final score.
 */
function computeFinalScore(goalScore, compScore, settings) {
  const gPct = (settings.weightage?.goals_percent ?? 70) / 100;
  const cPct = (settings.weightage?.competency_percent ?? 30) / 100;

  if (goalScore == null && compScore == null) return null;
  if (goalScore == null) return compScore;
  if (compScore == null) return goalScore;

  return (goalScore * gPct) + (compScore * cPct);
}

/**
 * Maps a final_score to a performance band label.
 * Returns the first band whose min <= score <= max.
 */
function assignBand(finalScore, bands) {
  if (finalScore == null || !bands?.length) return null;
  const match = bands.find(b => finalScore >= b.min && finalScore <= b.max);
  return match ? { label: match.label, color: match.color } : null;
}

/**
 * BSC only: computes a weighted average score per perspective.
 * Uses bsc_perspective_weights from settings if provided; otherwise equal weight.
 *
 * Returns an object like: { "Financial": 3.8, "Customer": 4.2, ... }
 * Only includes perspectives that have at least one rated target.
 */
function computeBscPerspectiveScores(targets, settings) {
  const bscTargets = targets.filter(t =>
    t.framework_type === 'bsc_metric' &&
    t.final_rating != null &&
    t.bsc_perspective
  );
  if (bscTargets.length === 0) return {};

  // Group by perspective
  const groups = {};
  for (const t of bscTargets) {
    if (!groups[t.bsc_perspective]) groups[t.bsc_perspective] = [];
    groups[t.bsc_perspective].push(t);
  }

  // Weighted average within each perspective
  const scores = {};
  for (const [perspective, pts] of Object.entries(groups)) {
    const weightSum = pts.reduce((s, t) => s + t.weight, 0);
    if (weightSum === 0) continue;
    scores[perspective] = pts.reduce((s, t) => s + (t.final_rating * t.weight), 0) / weightSum;
  }

  return scores;
}

/**
 * 9-Box: maps (finalScore, potentialRating) to a grid position string "X_Y"
 * where X = performance bucket (1=Low, 2=Medium, 3=High)
 * and   Y = potential bucket (1=Low, 2=Medium, 3=High).
 *
 * "3_3" = High Performance + High Potential = Star / Future Leader
 * "1_1" = Low Performance + Low Potential = Underperformer
 *
 * Performance thresholds come from settings.ninebox_config.performance_thresholds:
 *   { low_max: 2.49, medium_max: 3.99 }
 *
 * Potential rating is an integer 1–3 entered by manager/HR during calibration.
 */
function computeNineBoxPosition(finalScore, potentialRating, settings) {
  if (finalScore == null || potentialRating == null) return null;

  const thresholds = settings.ninebox_config?.performance_thresholds ?? {
    low_max: 2.49,
    medium_max: 3.99,
  };

  let perfBucket;
  if (finalScore <= thresholds.low_max) perfBucket = 1;
  else if (finalScore <= thresholds.medium_max) perfBucket = 2;
  else perfBucket = 3;

  const potBucket = Math.max(1, Math.min(3, Math.round(potentialRating)));

  return `${perfBucket}_${potBucket}`;
}

/**
 * Looks up the configured label for a 9-box position from org settings.
 * Falls back to built-in defaults if no custom label is set.
 */
const DEFAULT_BOX_LABELS = {
  '1_1': 'Underperformer',
  '1_2': 'Inconsistent Player',
  '1_3': 'Enigma',
  '2_1': 'Solid Contributor',
  '2_2': 'Core Player',
  '2_3': 'High Potential',
  '3_1': 'Effective Performer',
  '3_2': 'Strong Performer',
  '3_3': 'Star / Future Leader',
};

function getNineBoxLabel(position, settings) {
  if (!position) return null;
  const custom = settings.ninebox_config?.box_labels?.[position];
  return custom || DEFAULT_BOX_LABELS[position] || position;
}

/**
 * Master entry point — computes and returns the full performance summary
 * for one employee in one cycle. Caller passes approved+locked targets.
 */
function computePerformanceSummary(targets, potentialRating, settings) {
  const goalScore  = computeGoalScore(targets);
  const compScore  = computeCompetencyScore(targets);
  const finalScore = computeFinalScore(goalScore, compScore, settings);
  const band       = assignBand(finalScore, settings.performance_bands);
  const isPipTriggered = band
    ? (settings.performance_bands ?? [])
        .slice()
        .sort((a, b) => a.min - b.min)
        .findIndex(b2 => b2.label === band.label) === 0
    : false;

  const bscPerspectiveScores =
    (settings.active_types ?? []).includes('bsc_metric')
      ? computeBscPerspectiveScores(targets, settings)
      : {};

  const nineboxPosition = settings.ninebox_enabled
    ? computeNineBoxPosition(finalScore, potentialRating, settings)
    : null;

  const nineboxLabel = settings.ninebox_enabled
    ? getNineBoxLabel(nineboxPosition, settings)
    : null;

  return {
    goal_score: goalScore ? Math.round(goalScore * 100) / 100 : null,
    competency_score: compScore ? Math.round(compScore * 100) / 100 : null,
    final_score: finalScore ? Math.round(finalScore * 100) / 100 : null,
    performance_band: band?.label ?? null,
    is_pip_triggered: isPipTriggered ? 1 : 0,
    bsc_perspective_scores: Object.keys(bscPerspectiveScores).length
      ? JSON.stringify(bscPerspectiveScores)
      : null,
    ninebox_position: nineboxPosition,
    ninebox_label: nineboxLabel,
  };
}

module.exports = {
  computeGoalScore,
  computeCompetencyScore,
  computeFinalScore,
  assignBand,
  computeBscPerspectiveScores,
  computeNineBoxPosition,
  getNineBoxLabel,
  computePerformanceSummary,
  DEFAULT_BOX_LABELS,
};
