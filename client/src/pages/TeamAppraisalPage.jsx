import { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '../components/layout/AppLayout';
import InfoIcon from '../components/shared/InfoIcon';
import { useAuthStore } from '../store/authStore';
import { getTeamAppraisal, managerRate } from '../api/appraisalApi';
import { getCycles } from '../api/cyclesApi';
import { FRAMEWORK_TYPE_META, FRAMEWORK_GROUP_ORDER } from '../utils/constants';

// ── Constants ─────────────────────────────────────────────────────────────────

const RATABLE_TYPES = ['okr_kr', 'kpi', 'goal', 'bsc_metric', 'competency'];
const FOLDER_TYPES  = ['okr_objective', 'kra'];

const DEFAULT_GOAL_SCALE = {
  type: '5_point',
  labels: ['Needs Improvement', 'Below Expectation', 'Meets Expectation', 'Exceeds Expectation', 'Exceptional'],
  values: [1, 2, 3, 4, 5],
};
const DEFAULT_COMP_SCALE = { ...DEFAULT_GOAL_SCALE };

const DEFAULT_BANDS = [
  { label: 'Exceptional',         min: 4.5,  max: 5.0,  color: '#16a34a' },
  { label: 'Exceeds Expectation', min: 3.5,  max: 4.49, color: '#2563eb' },
  { label: 'Meets Expectation',   min: 2.5,  max: 3.49, color: '#d97706' },
  { label: 'Below Expectation',   min: 1.5,  max: 2.49, color: '#dc2626' },
  { label: 'Needs Improvement',   min: 0,    max: 1.49, color: '#7f1d1d' },
];

const CYCLE_PHASE_MESSAGES = {
  draft:        'This cycle is in Draft. Appraisal opens when HR advances the cycle to Review.',
  goal_setting: 'Goal setting is active. Appraisal opens after the performance period ends.',
  active:       'Performance period is running. Appraisal opens when the cycle moves to Review.',
  calibration:  'Ratings are in calibration by HR. No further manager changes are allowed.',
  closed:       'This cycle is closed. All ratings are finalised and archived.',
};

const BAND_COLORS = {
  'Exceptional':         '#16a34a',
  'Exceeds Expectation': '#2563eb',
  'Meets Expectation':   '#d97706',
  'Below Expectation':   '#dc2626',
  'Needs Improvement':   '#7f1d1d',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null || n === '') return '—';
  return Number(n).toLocaleString('en-IN');
}

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getRatingScale(orgSettings, isCompetency) {
  const key = isCompetency ? 'competency' : 'goals';
  const s   = orgSettings?.rating_scale?.[key];
  const def = isCompetency ? DEFAULT_COMP_SCALE : DEFAULT_GOAL_SCALE;
  if (!s) return def;
  if (!s.values) s.values = s.type === '3_point' ? [1, 2, 3] : [1, 2, 3, 4, 5];
  return { ...def, ...s };
}

function getMaxScale(orgSettings) {
  const s = getRatingScale(orgSettings, false);
  return Math.max(...(s.values || [5]));
}

function calcAchievementPct(actual, planned, measureType) {
  if (actual == null || planned == null || parseFloat(planned) === 0) return null;
  if (measureType === 'lower_better') {
    return parseFloat(actual) === 0 ? null : (parseFloat(planned) / parseFloat(actual)) * 100;
  }
  return (parseFloat(actual) / parseFloat(planned)) * 100;
}

function achColor(pct) {
  if (pct == null) return 'bg-slate-200';
  if (pct >= 100) return 'bg-emerald-500';
  if (pct >= 70)  return 'bg-amber-400';
  return 'bg-red-400';
}

function achTextColor(pct) {
  if (pct == null) return 'text-slate-400';
  if (pct >= 100) return 'text-emerald-700';
  if (pct >= 70)  return 'text-amber-700';
  return 'text-red-600';
}

// Rating gap detection — compares self_rating to implied rating from achievement %
function getGapAlert(target, maxScale) {
  if (target.self_rating == null) return null;
  if (target.framework_type === 'competency') return null;
  if (FOLDER_TYPES.includes(target.framework_type)) return null;
  if (target.planned_target == null || target.actual_value == null) return null;

  const pct = calcAchievementPct(target.actual_value, target.planned_target, target.measurement_type);
  if (pct == null) return null;

  const implied = (pct / 100) * maxScale;
  const gap = parseFloat(target.self_rating) - implied;

  if (gap > 1.0) {
    return {
      type:  'inflated',
      msg:   `Self-rated ${target.self_rating}/${maxScale} but achievement is ${pct.toFixed(0)}% (implied ≈${implied.toFixed(1)}/${maxScale}). Consider whether quality, external factors, or effort justify the higher rating.`,
      color: 'bg-amber-50 border-amber-200 text-amber-800',
    };
  }
  if (gap < -1.0) {
    return {
      type:  'underrated',
      msg:   `Employee achieved ${pct.toFixed(0)}% (implied ≈${implied.toFixed(1)}/${maxScale}) but self-rated ${target.self_rating}/${maxScale}. This employee may have under-rated themselves.`,
      color: 'bg-blue-50 border-blue-200 text-blue-800',
    };
  }
  return null;
}

// Compute estimated score from manager's ratings (or self-ratings as baseline)
function computeScore(targets, ratingFn, orgSettings) {
  const GOAL_TYPES = ['okr_kr', 'kpi', 'goal', 'bsc_metric'];
  const goalTgts = targets.filter(t => GOAL_TYPES.includes(t.framework_type));
  const compTgts = targets.filter(t => t.framework_type === 'competency');

  const weightedScore = (items) => {
    const wt  = items.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);
    if (wt === 0) return null;
    const val = items.reduce((s, t) => {
      const r = ratingFn(t);
      return s + ((r ?? 0) * (parseFloat(t.weight) || 0));
    }, 0);
    return val / wt;
  };

  const goalScore = weightedScore(goalTgts);
  const compScore = weightedScore(compTgts);
  const gPct = orgSettings?.weightage?.goals_percent     ?? 70;
  const cPct = orgSettings?.weightage?.competency_percent ?? 30;

  const finalScore = (goalScore !== null || compScore !== null)
    ? ((goalScore ?? 0) * gPct / 100) + ((compScore ?? 0) * cPct / 100)
    : null;

  const bands = orgSettings?.performance_bands || DEFAULT_BANDS;
  const band  = finalScore !== null
    ? bands.find(b => finalScore >= b.min && finalScore <= b.max) || null
    : null;

  return { goalScore, compScore, finalScore, band, gPct, cPct };
}

// ── Small shared pieces ───────────────────────────────────────────────────────

function TypeChip({ type }) {
  const m = FRAMEWORK_TYPE_META[type];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${m.color}`}>
      {m.icon} {m.label}
    </span>
  );
}

function BandBadge({ band, color }) {
  if (!band) return null;
  const bg = color || BAND_COLORS[band] || '#64748b';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
      style={{ backgroundColor: bg }}>
      {band}
    </span>
  );
}

function RatingStars({ rating, maxScale, labels }) {
  if (rating == null) return <span className="text-xs text-slate-400 italic">Not rated</span>;
  const label = labels?.find ? labels[Math.round(rating) - 1] || '' : '';
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-slate-700 tabular-nums">{rating}</span>
      <span className="text-sm text-slate-400">/ {maxScale}</span>
      {label && <span className="text-xs text-slate-500">— {label}</span>}
    </div>
  );
}

// ── Rating Widget ─────────────────────────────────────────────────────────────
function RatingWidget({ scale, value, onChange, disabled }) {
  if (!scale) return null;

  if (scale.type === 'percentage') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number" min="0" max="120" step="1"
          value={value ?? ''}
          disabled={disabled}
          onChange={e => onChange(e.target.value !== '' ? parseFloat(e.target.value) : null)}
          className="w-24 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <span className="text-sm text-slate-500">%</span>
      </div>
    );
  }

  const vals   = scale.values   || [1, 2, 3, 4, 5];
  const labels = scale.labels   || vals.map(v => String(v));

  return (
    <div className="flex flex-wrap gap-2">
      {vals.map((v, i) => {
        const isSel = value === v;
        return (
          <button key={v} type="button" disabled={disabled}
            onClick={() => onChange(isSel ? null : v)}
            title={labels[i]}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              isSel
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : disabled
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <span className="font-bold">{v}</span>
            <span className="ml-1 text-[10px] opacity-75">{labels[i]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Achievement Widget ────────────────────────────────────────────────────────
function AchievementWidget({ target }) {
  const isCompetency = target.framework_type === 'competency';
  const hasNumeric   = target.planned_target != null && !isCompetency;
  if (!hasNumeric) return null;

  const pct = calcAchievementPct(target.actual_value, target.planned_target, target.measurement_type);
  const isLower = target.measurement_type === 'lower_better';
  const unit = target.unit ? ` ${target.unit}` : '';

  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <p className="text-slate-400">Planned Target</p>
            <p className="font-semibold text-slate-700 tabular-nums">{fmt(target.planned_target)}{unit}</p>
          </div>
          {target.stretch_target != null && (
            <div>
              <p className="text-slate-400">Stretch</p>
              <p className="font-semibold text-slate-400 tabular-nums">{fmt(target.stretch_target)}{unit}</p>
            </div>
          )}
          <div>
            <p className="text-slate-400">Actual Achieved</p>
            <p className={`font-bold tabular-nums ${achTextColor(pct)}`}>
              {target.actual_value != null ? `${fmt(target.actual_value)}${unit}` : <span className="text-slate-400 font-normal italic">Not entered</span>}
            </p>
          </div>
          {pct != null && (
            <div>
              <p className="text-slate-400">Achievement</p>
              <p className={`font-bold text-base tabular-nums ${achTextColor(pct)}`}>
                {pct.toFixed(1)}%{isLower ? ' ↓better' : ''}
              </p>
            </div>
          )}
        </div>
        {target.is_over_planned === 1 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
            ⬆ Over-planned
          </span>
        )}
      </div>

      {/* Progress bar */}
      {pct != null && (
        <div className="space-y-0.5">
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${achColor(pct)}`}
              style={{ width: `${Math.min(Math.abs(pct), 100)}%` }}
            />
          </div>
          {pct > 100 && (
            <p className="text-[10px] text-emerald-600 font-semibold">
              +{(pct - 100).toFixed(1)}% above target
              {target.over_plan_note ? ` — "${target.over_plan_note}"` : ''}
            </p>
          )}
        </div>
      )}

      {/* Over-plan context */}
      {target.is_over_planned === 1 && target.over_plan_note && (
        <div className="text-[11px] text-orange-700 bg-orange-50 rounded px-2 py-1 border border-orange-100">
          Employee over-committed: "{target.over_plan_note}"
          {target.parent_planned != null && (
            <span className="ml-1">(parent target: {fmt(target.parent_planned)}{unit})</span>
          )}
        </div>
      )}

      {/* Parent cascade context */}
      {target.parent_title && (
        <p className="text-[11px] text-slate-400">
          ↑ Contributes to: <span className="text-slate-600 font-medium">{target.parent_title}</span>
          {target.parent_planned != null && ` (${fmt(target.parent_planned)}${unit})`}
          {target.parent_planned != null && target.planned_target != null && parseFloat(target.parent_planned) > 0 && (
            <span className="ml-1 text-slate-400">
              = {((parseFloat(target.planned_target) / parseFloat(target.parent_planned)) * 100).toFixed(0)}% share
            </span>
          )}
        </p>
      )}
    </div>
  );
}

// ── Check-in Timeline ─────────────────────────────────────────────────────────
function CheckinTimeline({ checkins, planned_target, measurement_type, unit }) {
  const [expanded, setExpanded] = useState(false);

  if (!checkins?.length) {
    return (
      <div className="text-xs text-slate-400 italic flex items-center gap-1">
        <span>No check-ins recorded.</span>
        <InfoIcon
          title="No Check-in History"
          content="Employee did not record any periodic check-ins for this target. This means you cannot see their progress narrative. You should rely on their self-comment and actual value for context."
          side="right"
        />
      </div>
    );
  }

  const show = expanded ? checkins : checkins.slice(-5);
  const hidden = checkins.length - 5;

  return (
    <div className="space-y-2">
      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          ▶ Show all {checkins.length} check-ins (hiding {hidden} earlier)
        </button>
      )}

      <div className="space-y-1">
        {show.map((c, i) => {
          const pct = calcAchievementPct(c.actual_value, planned_target, measurement_type);
          const u   = unit ? ` ${unit}` : '';
          return (
            <div key={c.id || i} className="flex items-start gap-3 text-xs group">
              <span className="w-20 text-slate-400 flex-shrink-0 pt-0.5 tabular-nums">{c.period_label}</span>
              <div className="flex items-center gap-2 flex-shrink-0 w-32">
                <span className="font-semibold text-slate-700 tabular-nums">
                  {c.actual_value != null ? `${fmt(c.actual_value)}${u}` : '—'}
                </span>
                {pct != null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    pct >= 100 ? 'bg-emerald-100 text-emerald-700' :
                    pct >= 70  ? 'bg-amber-100 text-amber-700' :
                                 'bg-red-100 text-red-600'
                  }`}>
                    {pct.toFixed(0)}%
                  </span>
                )}
              </div>
              {c.notes && (
                <p className="text-slate-500 leading-snug flex-1">{c.notes}</p>
              )}
            </div>
          );
        })}
      </div>

      {expanded && checkins.length > 5 && (
        <button onClick={() => setExpanded(false)} className="text-xs text-blue-600 hover:text-blue-700">
          ▲ Show fewer
        </button>
      )}
    </div>
  );
}

// ── Self-Appraisal Readout (read-only panel for manager to see) ───────────────
function SelfAppraisalReadout({ target, maxScale, scaleLabels }) {
  const hasSelfRating = target.self_rating != null;
  const selfRatedDate = target.self_rated_at ? fmtDate(target.self_rated_at) : null;

  return (
    <div className={`rounded-lg border px-3 py-2.5 space-y-2 ${
      hasSelfRating ? 'bg-purple-50/30 border-purple-100' : 'bg-slate-50 border-slate-100'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">
          Employee Self-Assessment
        </span>
        <InfoIcon
          title="Employee Self-Assessment"
          content="This is the employee's own rating and explanation, entered before the review window. Rule AP2: you see this BEFORE entering your rating. Use it as context, not a constraint — your rating may agree or differ."
          side="left"
        />
        {selfRatedDate && (
          <span className="text-[10px] text-slate-400 ml-2">{selfRatedDate}</span>
        )}
      </div>

      {hasSelfRating ? (
        <>
          <RatingStars rating={target.self_rating} maxScale={maxScale} labels={scaleLabels} />
          {target.self_comment && (
            <p className="text-xs text-slate-600 bg-white rounded px-2 py-1.5 border border-purple-100 leading-relaxed">
              "{target.self_comment}"
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-slate-400 italic">Employee has not self-rated this target yet.</p>
      )}
    </div>
  );
}

// ── Rating Gap Alert ──────────────────────────────────────────────────────────
function RatingGapAlert({ alert }) {
  if (!alert) return null;
  return (
    <div className={`rounded-lg border px-3 py-2 flex items-start gap-2 text-xs ${alert.color}`}>
      <span className="flex-shrink-0 mt-0.5 text-sm">
        {alert.type === 'inflated' ? '⚠️' : 'ℹ️'}
      </span>
      <div>
        <p className="font-semibold mb-0.5">
          {alert.type === 'inflated' ? 'Possible Rating Inflation' : 'Possible Under-rating'}
        </p>
        <p className="leading-snug">{alert.msg}</p>
      </div>
    </div>
  );
}

// ── Manager Rating Panel ──────────────────────────────────────────────────────
function ManagerRatingPanel({
  target, orgSettings, formValues, onFieldChange, onSave, isSaving, wasSaved, saveError, isEditable
}) {
  const isCompetency = target.framework_type === 'competency';
  const scale        = getRatingScale(orgSettings, isCompetency);
  const { manager_rating, manager_comment } = formValues;
  const isRated = manager_rating != null;

  return (
    <div className={`rounded-lg border px-3 py-3 space-y-3 ${
      isRated ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
          Your Rating (Manager)
        </span>
        <InfoIcon
          title="Manager Rating"
          content="Your rating becomes the final rating (Rule AP3). Be specific in your comment — it will be shared with the employee during the closing discussion. Consider the employee's actual achievement, self-comment, check-in pattern, and any contextual factors."
          side="left"
        />
        {isRated && !isEditable && (
          <span className="text-[10px] text-slate-400 italic">
            Rated {target.manager_rated_at ? fmtDate(target.manager_rated_at) : ''}
          </span>
        )}
        {wasSaved && (
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
            ✓ Saved
          </span>
        )}
      </div>

      {isEditable ? (
        <>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Rating <span className="text-red-500">*</span>
            </label>
            <RatingWidget
              scale={scale}
              value={manager_rating}
              onChange={v => onFieldChange('manager_rating', v)}
              disabled={false}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Manager Comment
              <InfoIcon
                title="Manager Comment"
                content="Your feedback will be shared with the employee when the cycle closes. Include: what they did well, specific evidence you observed, one area for development if applicable. Keep it factual and forward-looking."
                side="left"
              />
            </label>
            <textarea
              rows={3}
              value={manager_comment ?? ''}
              onChange={e => onFieldChange('manager_comment', e.target.value || null)}
              placeholder="Describe your assessment of this target — evidence observed, context, and feedback…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {saveError && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{saveError}</p>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              {isRated ? `Previously rated: ${target.manager_rating}` : 'Rate to finalise this target (Rule AP3)'}
            </p>
            <button
              type="button"
              disabled={isSaving || manager_rating == null}
              onClick={onSave}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving…' : 'Save Rating'}
            </button>
          </div>
        </>
      ) : (
        isRated
          ? (
            <>
              <RatingStars
                rating={target.manager_rating}
                maxScale={getMaxScale(orgSettings)}
                labels={scale.labels}
              />
              {target.manager_comment && (
                <p className="text-xs text-slate-600 bg-white rounded px-2 py-1.5 border border-blue-100 leading-relaxed">
                  "{target.manager_comment}"
                </p>
              )}
            </>
          )
          : <p className="text-xs text-slate-400 italic">Not rated yet.</p>
      )}
    </div>
  );
}

// ── Folder Header ─────────────────────────────────────────────────────────────
function FolderHeader({ target }) {
  const meta = FRAMEWORK_TYPE_META[target.framework_type];
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${meta?.color || ''}`}>
        {meta?.icon} {meta?.label}
      </span>
      <p className="text-sm font-semibold text-slate-700 flex-1">{target.title}</p>
      {target.weight != null && (
        <span className="text-xs font-semibold text-slate-500">{Number(target.weight).toFixed(0)}%</span>
      )}
    </div>
  );
}

// ── Target Rating Card ────────────────────────────────────────────────────────
function TargetRatingCard({
  target, orgSettings, maxScale, localForm, onFieldChange, onSave, isSaving, wasSaved, saveError, isEditable
}) {
  const [checkinOpen, setCheckinOpen] = useState(false);
  const isCompetency = target.framework_type === 'competency';
  const scale = getRatingScale(orgSettings, isCompetency);
  const gapAlert = getGapAlert(target, maxScale);
  const effectiveManagerRating = localForm?.manager_rating ?? target.manager_rating;
  const isManagerRated = effectiveManagerRating != null;
  const isSelfRated = target.self_rating != null;

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${
      isManagerRated ? 'border-blue-200' : 'border-slate-200'
    }`}>
      {/* Card header */}
      <div className={`flex items-start gap-3 px-4 pt-4 pb-3 ${isManagerRated ? 'bg-blue-50/20' : 'bg-white'}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeChip type={target.framework_type} />
            {isManagerRated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                ✓ Manager rated: {effectiveManagerRating}
              </span>
            )}
            {!isSelfRated && isEditable && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                ⚠ Not self-rated
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-800 leading-snug">{target.title}</p>
          {target.description && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{target.description}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {target.weight != null && (
            <>
              <p className="text-lg font-bold text-slate-700 tabular-nums">{Number(target.weight).toFixed(0)}%</p>
              <p className="text-[10px] text-slate-400">weight</p>
            </>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3 bg-white">
        {/* 1. Achievement evidence */}
        <AchievementWidget target={target} />

        {/* 2. Check-in history — the "insight without calling" section */}
        <div>
          <button
            type="button"
            onClick={() => setCheckinOpen(v => !v)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 w-full text-left"
          >
            <span className={`transition-transform ${checkinOpen ? 'rotate-90' : ''}`}>▶</span>
            <span className="font-semibold">
              Check-in History
            </span>
            <span className="text-slate-400">
              ({target.checkins?.length || 0} update{(target.checkins?.length || 0) !== 1 ? 's' : ''})
            </span>
            <InfoIcon
              title="Check-in History"
              content="Month-by-month progress updates the employee recorded during the cycle. This is the MOST VALUABLE source for your rating — it shows if they were on-track, proactive in flagging risks, and what narrative they communicated throughout the year. Expand to see all updates."
            />
          </button>
          {checkinOpen && (
            <div className="mt-2 pl-3 border-l-2 border-slate-100">
              <CheckinTimeline
                checkins={target.checkins}
                planned_target={target.planned_target}
                measurement_type={target.measurement_type}
                unit={target.unit}
              />
            </div>
          )}
        </div>

        {/* 3. Employee self-assessment */}
        <SelfAppraisalReadout
          target={target}
          maxScale={maxScale}
          scaleLabels={scale.labels}
        />

        {/* 4. Gap alert (between self-assessment and manager section) */}
        <RatingGapAlert alert={gapAlert} />

        {/* 5. Manager rating */}
        <ManagerRatingPanel
          target={target}
          orgSettings={orgSettings}
          formValues={{
            manager_rating:  localForm?.manager_rating  ?? target.manager_rating  ?? null,
            manager_comment: localForm?.manager_comment ?? target.manager_comment ?? '',
          }}
          onFieldChange={onFieldChange}
          onSave={onSave}
          isSaving={isSaving}
          wasSaved={wasSaved}
          saveError={saveError}
          isEditable={isEditable}
        />
      </div>
    </div>
  );
}

// ── Target Group Section ──────────────────────────────────────────────────────
const GROUP_HELP = {
  OKR: {
    title: 'Rating OKR Targets',
    content: 'Objectives are folder items — do not rate them directly. Rate each Key Result below. Check the check-in history to see how the employee tracked progress against each KR throughout the cycle before entering your rating.',
  },
  'KRA/KPI': {
    title: 'Rating KRA/KPI Targets',
    content: 'KRAs are folder items — do not rate them directly. Rate each KPI below. KPI targets are numeric — compare actual value to planned and check the check-in history before rating.',
  },
  Goals: {
    title: 'Rating Goal Targets',
    content: 'Goals are standalone numeric targets. Rate each one based on actual achievement vs planned, the employee\'s self-comment, and the check-in trajectory. Your rating becomes the final rating.',
  },
  Competency: {
    title: 'Rating Competencies',
    content: 'Competencies are behavioural — there is no numeric target. Rate based on observable behaviours you witnessed during the cycle. Read the employee\'s self-comment for their perspective, then enter your assessment.',
  },
  'Balanced Scorecard': {
    title: 'Rating BSC Metrics',
    content: 'BSC metrics are KPIs grouped into four perspectives. Rate each metric based on actual achievement vs planned target and the employee\'s check-in history.',
  },
};

function TargetGroupSection({
  groupName, groupTargets, orgSettings, maxScale, localForms,
  onFieldChange, onSave, saving, savedFlash, saveErrors, isEditable
}) {
  const [collapsed, setCollapsed] = useState(false);
  const help = GROUP_HELP[groupName];

  const ratableInGroup = groupTargets.filter(t => RATABLE_TYPES.includes(t.framework_type));
  const ratedInGroup   = ratableInGroup.filter(t => {
    const r = localForms[t.id]?.manager_rating ?? t.manager_rating;
    return r != null;
  });
  const allDone = ratableInGroup.length > 0 && ratedInGroup.length === ratableInGroup.length;

  const isOKR    = groupName === 'OKR';
  const isKRAKPI = groupName === 'KRA/KPI';

  function renderCard(t) {
    return (
      <TargetRatingCard
        key={t.id}
        target={t}
        orgSettings={orgSettings}
        maxScale={maxScale}
        localForm={localForms[t.id] || {}}
        onFieldChange={(field, val) => onFieldChange(t.id, field, val)}
        onSave={() => onSave(t)}
        isSaving={!!saving[t.id]}
        wasSaved={!!savedFlash[t.id]}
        saveError={saveErrors[t.id] || null}
        isEditable={isEditable}
      />
    );
  }

  function renderOKR() {
    const objs = groupTargets.filter(t => t.framework_type === 'okr_objective');
    const krs  = groupTargets.filter(t => t.framework_type === 'okr_kr');
    return (
      <div className="space-y-3">
        {objs.map(obj => {
          const nested = krs.filter(kr => kr.parent_target_id === obj.id);
          return (
            <div key={obj.id} className="space-y-2">
              <FolderHeader target={obj} />
              {nested.map(kr => (
                <div key={kr.id} className="ml-4 border-l-2 border-purple-100 pl-3">
                  {renderCard(kr)}
                </div>
              ))}
            </div>
          );
        })}
        {krs.filter(kr => !objs.find(o => o.id === kr.parent_target_id)).map(kr => renderCard(kr))}
      </div>
    );
  }

  function renderKRAKPI() {
    const kras = groupTargets.filter(t => t.framework_type === 'kra');
    const kpis = groupTargets.filter(t => t.framework_type === 'kpi');
    return (
      <div className="space-y-3">
        {kras.map(kra => {
          const nested = kpis.filter(k => k.parent_target_id === kra.id);
          return (
            <div key={kra.id} className="space-y-2">
              <FolderHeader target={kra} />
              {nested.map(kpi => (
                <div key={kpi.id} className="ml-4 border-l-2 border-cyan-100 pl-3">
                  {renderCard(kpi)}
                </div>
              ))}
            </div>
          );
        })}
        {kpis.filter(k => !kras.find(kra => kra.id === k.parent_target_id)).map(k => renderCard(k))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
        <button
          className="flex items-center gap-2 flex-1 text-left"
          onClick={() => setCollapsed(v => !v)}
        >
          <span className="text-sm font-bold text-slate-700">{groupName}</span>
          <span className="text-xs text-slate-400">{ratableInGroup.length} item{ratableInGroup.length !== 1 ? 's' : ''}</span>
          {allDone && <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">✓ All rated</span>}
          <span className="text-slate-400 text-xs ml-auto">{collapsed ? '▼' : '▲'}</span>
        </button>
        {help && <InfoIcon title={help.title} content={help.content} side="left" />}
        <span className="text-xs text-slate-500 tabular-nums">{ratedInGroup.length}/{ratableInGroup.length} rated</span>
      </div>
      {!collapsed && (
        <div className="p-4 space-y-3">
          {isOKR    && renderOKR()}
          {isKRAKPI && renderKRAKPI()}
          {!isOKR && !isKRAKPI && ratableInGroup.map(t => renderCard(t))}
        </div>
      )}
    </div>
  );
}

// ── Score Preview Widget (workspace header) ───────────────────────────────────
function ScorePreviewWidget({ targets, localForms, orgSettings, priorSummary }) {
  const maxScale = getMaxScale(orgSettings);

  const getManagerRating = (t) => localForms[t.id]?.manager_rating ?? t.manager_rating ?? null;
  const getSelfRating    = (t) => t.self_rating ?? null;

  const mgrScore  = computeScore(targets, getManagerRating, orgSettings);
  const selfScore = computeScore(targets, getSelfRating, orgSettings);

  const ratableTargets = targets.filter(t => RATABLE_TYPES.includes(t.framework_type));
  const mgrRated = ratableTargets.filter(t => getManagerRating(t) != null).length;
  const selfRated = ratableTargets.filter(t => getSelfRating(t) != null).length;
  const totalRatable = ratableTargets.length;

  return (
    <div className="flex items-start gap-4 flex-wrap">
      {/* Progress chip */}
      <div className="text-center min-w-[80px]">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Your Progress</p>
        <p className="text-2xl font-bold text-blue-600 tabular-nums">{mgrRated}/{totalRatable}</p>
        <p className="text-[10px] text-slate-400">targets rated</p>
        <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${totalRatable > 0 ? (mgrRated / totalRatable) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Manager estimated score */}
      {mgrScore.finalScore !== null && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
            Est. Score (your ratings)
            <InfoIcon
              title="Estimated Score from Your Ratings"
              content="Calculated using your manager ratings entered so far. Unrated targets count as 0. This is an estimate — HR may calibrate scores after all manager ratings are complete (Rule CAL1)."
              side="bottom"
            />
          </p>
          <p className="text-2xl font-bold text-blue-700 tabular-nums">{mgrScore.finalScore.toFixed(2)}</p>
          {mgrScore.band && (
            <BandBadge band={mgrScore.band.label} color={mgrScore.band.color} />
          )}
        </div>
      )}

      {/* Self-rated score (baseline for comparison) */}
      {selfScore.finalScore !== null && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
            Employee Self-Score
            <InfoIcon
              title="Employee Self-Rated Score"
              content="The score if the employee's self-ratings were used as final. Compare this to your score — if they differ significantly, review which targets show the biggest gap."
              side="bottom"
            />
          </p>
          <p className="text-2xl font-bold text-purple-600 tabular-nums">{selfScore.finalScore.toFixed(2)}</p>
          {selfScore.band && (
            <BandBadge band={selfScore.band.label} color={selfScore.band.color} />
          )}
          {mgrScore.finalScore !== null && (
            <p className={`text-[10px] mt-0.5 font-semibold ${
              mgrScore.finalScore > selfScore.finalScore ? 'text-blue-600' :
              mgrScore.finalScore < selfScore.finalScore ? 'text-amber-600' :
              'text-slate-400'
            }`}>
              {mgrScore.finalScore > selfScore.finalScore
                ? `↑ ${(mgrScore.finalScore - selfScore.finalScore).toFixed(2)} above self`
                : mgrScore.finalScore < selfScore.finalScore
                  ? `↓ ${(selfScore.finalScore - mgrScore.finalScore).toFixed(2)} below self`
                  : 'Aligned with self'}
            </p>
          )}
        </div>
      )}

      {/* Prior cycle */}
      {priorSummary && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Last Cycle</p>
          <p className="text-xs text-slate-500">{priorSummary.cycle_name}</p>
          {priorSummary.final_score != null && (
            <p className="text-lg font-bold text-slate-600 tabular-nums">{Number(priorSummary.final_score).toFixed(2)}</p>
          )}
          {priorSummary.performance_band && (
            <BandBadge band={priorSummary.performance_band} color={BAND_COLORS[priorSummary.performance_band]} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Rating Workspace (right panel for selected reportee) ──────────────────────
function RatingWorkspace({
  reportee, orgSettings, localForms, onFieldChange, onSave,
  saving, savedFlash, saveErrors, isEditable
}) {
  const { employee, targets, priorSummary } = reportee;
  const headerRef = useRef(null);
  const maxScale = getMaxScale(orgSettings);

  const ratableTargets = targets.filter(t => RATABLE_TYPES.includes(t.framework_type));

  const groupNames = [...new Set(
    targets.map(t => FRAMEWORK_TYPE_META[t.framework_type]?.group).filter(Boolean)
  )].sort((a, b) => {
    const ia = FRAMEWORK_GROUP_ORDER.indexOf(a);
    const ib = FRAMEWORK_GROUP_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const selfRatedCount = ratableTargets.filter(t => t.self_rating != null).length;
  const selfRatedAll   = ratableTargets.length > 0 && selfRatedCount === ratableTargets.length;

  return (
    <div className="flex-1 min-w-0 space-y-4">
      {/* Sticky header */}
      <div ref={headerRef} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 sticky top-4 z-10">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Employee info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">{employee.name}</h2>
              {employee.emp_code && (
                <span className="text-xs text-slate-400">{employee.emp_code}</span>
              )}
              {employee.grade_label && (
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{employee.grade_label}</span>
              )}
              {employee.dept_name && (
                <span className="text-xs text-slate-500">{employee.dept_name}</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Self-appraisal: {selfRatedCount}/{ratableTargets.length} targets rated
              {selfRatedAll
                ? ' ✓'
                : selfRatedCount > 0
                  ? ' — some targets not yet self-rated'
                  : ' — employee has not started self-appraisal'}
            </p>
          </div>
        </div>

        {/* Score preview */}
        <div className="border-t border-slate-100 pt-3">
          <ScorePreviewWidget
            targets={targets}
            localForms={localForms}
            orgSettings={orgSettings}
            priorSummary={priorSummary}
          />
        </div>
      </div>

      {/* Instruction banner */}
      {isEditable && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
          <p>
            <strong>How to rate:</strong> For each target, expand the check-in history to see the full progress narrative.
            Read the employee's self-assessment. Check if their self-rating aligns with their actual achievement.
            Then enter your rating and a brief comment explaining your assessment.
          </p>
          <p className="text-blue-600">
            Your rating becomes the <strong>final rating</strong> (Rule AP3). HR may calibrate across teams in the next phase.
          </p>
        </div>
      )}

      {/* Target groups */}
      {targets.length === 0 && (
        <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
          <p className="text-slate-400 text-sm">No approved targets for this employee in this cycle.</p>
        </div>
      )}

      {groupNames.map(group => (
        <TargetGroupSection
          key={group}
          groupName={group}
          groupTargets={targets.filter(t => FRAMEWORK_TYPE_META[t.framework_type]?.group === group)}
          orgSettings={orgSettings}
          maxScale={maxScale}
          localForms={localForms}
          onFieldChange={onFieldChange}
          onSave={onSave}
          saving={saving}
          savedFlash={savedFlash}
          saveErrors={saveErrors}
          isEditable={isEditable}
        />
      ))}
    </div>
  );
}

// ── Reportee List Panel ───────────────────────────────────────────────────────
function ReporteeListPanel({ reportees, selectedEmpId, onSelect, orgSettings, localForms }) {
  const getManagerRating = (t, lf) => lf[t.id]?.manager_rating ?? t.manager_rating ?? null;

  const reporteeStats = reportees.map(r => {
    const ratable = r.targets.filter(t => RATABLE_TYPES.includes(t.framework_type));
    const mgrRated  = ratable.filter(t => getManagerRating(t, localForms) != null).length;
    const selfRated = ratable.filter(t => t.self_rating != null).length;
    const allDone   = ratable.length > 0 && mgrRated === ratable.length;
    const selfDone  = ratable.length > 0 && selfRated === ratable.length;

    const mgrScore = computeScore(r.targets, t => getManagerRating(t, localForms), orgSettings);

    return {
      ...r,
      ratable: ratable.length,
      mgrRated,
      selfRated,
      allDone,
      selfDone,
      mgrScore,
    };
  });

  const totalReportees = reportees.length;
  const fullyRated     = reporteeStats.filter(r => r.allDone).length;
  const pct = totalReportees > 0 ? Math.round((fullyRated / totalReportees) * 100) : 0;

  return (
    <div className="w-72 flex-shrink-0 space-y-3">
      {/* Team progress header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Team Progress</p>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-slate-600">{fullyRated} of {totalReportees} fully rated</p>
            <span className="text-xs font-bold text-slate-500">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {pct === 100 && (
          <p className="text-[11px] text-emerald-700 bg-emerald-50 rounded px-2 py-1">
            ✓ All reportees rated. HR can begin calibration.
          </p>
        )}
      </div>

      {/* Reportee list */}
      <div className="space-y-1.5">
        {reporteeStats.map(r => (
          <button
            key={r.employee.id}
            type="button"
            onClick={() => onSelect(r.employee.id)}
            className={`w-full text-left rounded-xl border p-3 transition-colors hover:border-blue-300 ${
              selectedEmpId === r.employee.id
                ? 'border-blue-400 bg-blue-50 shadow-sm'
                : r.allDone
                  ? 'border-blue-200 bg-blue-50/30'
                  : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {r.employee.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{r.employee.name}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {r.employee.grade_label && `${r.employee.grade_label} · `}{r.employee.dept_name || ''}
                </p>
              </div>
              {r.allDone && <span className="text-blue-600 text-sm flex-shrink-0">✓</span>}
            </div>

            <div className="mt-2 flex items-center gap-3 flex-wrap text-[10px]">
              <span className={`font-semibold ${r.allDone ? 'text-blue-700' : 'text-slate-500'}`}>
                You: {r.mgrRated}/{r.ratable}
              </span>
              <span className={r.selfDone ? 'text-purple-600 font-semibold' : 'text-slate-400'}>
                Self: {r.selfRated}/{r.ratable}
              </span>
              {r.mgrScore.finalScore !== null && (
                <span className="text-slate-500 tabular-nums ml-auto">
                  {r.mgrScore.finalScore.toFixed(2)}
                </span>
              )}
            </div>

            {/* Mini progress bar */}
            <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${r.allDone ? 'bg-blue-500' : 'bg-blue-400'}`}
                style={{ width: `${r.ratable > 0 ? (r.mgrRated / r.ratable) * 100 : 0}%` }}
              />
            </div>

            {/* Prior band if available */}
            {r.priorSummary?.performance_band && (
              <div className="mt-1.5">
                <span className="text-[10px] text-slate-400">Last cycle: </span>
                <span
                  className="text-[10px] font-semibold px-1 py-0.5 rounded text-white"
                  style={{ backgroundColor: BAND_COLORS[r.priorSummary.performance_band] || '#64748b' }}
                >
                  {r.priorSummary.performance_band}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Phase Gate ────────────────────────────────────────────────────────────────
function PhaseGateBanner({ cycle }) {
  const msg = CYCLE_PHASE_MESSAGES[cycle?.status] || 'Unknown cycle status.';
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-amber-500 text-xl">⏳</span>
        <p className="font-semibold text-amber-900 text-sm">Team Appraisal Not Open</p>
      </div>
      <p className="text-amber-800 text-sm">{msg}</p>
      <p className="text-amber-700 text-xs">
        Cycle: <strong>{cycle?.name}</strong>
        {' · '}Current phase: <strong className="capitalize">{cycle?.status?.replace('_', ' ')}</strong>
      </p>
      <div className="flex items-center gap-1 text-[11px] text-amber-700 flex-wrap pt-1">
        {['draft','goal_setting','active','review','calibration','closed'].map((s, i) => (
          <span key={s} className="flex items-center gap-1">
            {i > 0 && <span className="text-amber-400">→</span>}
            <span className={`px-1.5 py-0.5 rounded font-medium ${
              s === cycle?.status ? 'bg-amber-600 text-white' :
              s === 'review'     ? 'bg-amber-200 text-amber-800' :
              'text-amber-600'
            }`}>{s.replace('_', ' ')}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Team Overview Panel (no reportee selected) ────────────────────────────────
function TeamOverviewPanel({ reportees, orgSettings, localForms }) {
  const getManagerRating = (t, lf) => lf[t.id]?.manager_rating ?? t.manager_rating ?? null;

  const bands = orgSettings?.performance_bands || DEFAULT_BANDS;

  const stats = reportees.map(r => {
    const ratable  = r.targets.filter(t => RATABLE_TYPES.includes(t.framework_type));
    const mgrRated = ratable.filter(t => getManagerRating(t, localForms) != null).length;
    const score    = computeScore(r.targets, t => getManagerRating(t, localForms), orgSettings);
    return { name: r.employee.name, ratable: ratable.length, mgrRated, score };
  });

  // Band distribution from manager scores (for rated employees)
  const scored = stats.filter(s => s.score.band);
  const distrib = bands.map(b => ({
    ...b,
    count: scored.filter(s => s.score.band?.label === b.label).length,
  }));

  // Action needed list
  const notStarted = stats.filter(s => s.mgrRated === 0);
  const partial    = stats.filter(s => s.mgrRated > 0 && s.mgrRated < s.ratable);

  return (
    <div className="flex-1 space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <p className="text-sm font-bold text-slate-700 mb-3">
          Select a team member from the left panel to start rating their targets.
        </p>

        {/* Quick actions */}
        <div className="space-y-2">
          {notStarted.length > 0 && (
            <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <span className="text-amber-500 text-sm mt-0.5">○</span>
              <div>
                <p className="font-semibold text-amber-800">Not yet started ({notStarted.length})</p>
                <p className="text-amber-700">{notStarted.map(s => s.name).join(', ')}</p>
              </div>
            </div>
          )}
          {partial.length > 0 && (
            <div className="flex items-start gap-2 text-xs bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span className="text-blue-500 text-sm mt-0.5">◑</span>
              <div>
                <p className="font-semibold text-blue-800">Partially rated ({partial.length})</p>
                <p className="text-blue-700">{partial.map(s => `${s.name} (${s.mgrRated}/${s.ratable})`).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Score distribution */}
      {scored.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Score Distribution (based on your ratings so far)
            <InfoIcon
              title="Score Distribution"
              content="Shows how your team's estimated scores are distributed across performance bands. If scores cluster at one extreme, consider whether this reflects true performance or calibration bias. HR will review this distribution during calibration."
              side="left"
            />
          </p>
          {distrib.filter(b => b.count > 0).map(b => (
            <div key={b.label} className="flex items-center gap-3">
              <div className="w-36 text-xs text-slate-600 truncate">{b.label}</div>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(b.count / scored.length) * 100}%`, backgroundColor: b.color }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600 w-6 text-right">{b.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Guidance */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">How to use Team Appraisal</p>
        <ol className="text-xs text-slate-600 space-y-2 list-none">
          {[
            ['1', 'Click a team member on the left to open their rating workspace.'],
            ['2', 'For each target, expand the check-in history to understand the full performance story.'],
            ['3', 'Read the employee\'s self-rating and comment before entering your own.'],
            ['4', 'Check the rating gap alert — it shows if their self-rating aligns with their actual achievement.'],
            ['5', 'Enter your rating and a comment, then save each target individually.'],
            ['6', 'Once all targets are rated for all team members, HR can begin calibration.'],
          ].map(([n, text]) => (
            <li key={n} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">{n}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeamAppraisalPage() {
  const { employee } = useAuthStore();

  const [cycles,          setCycles]          = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [cycle,           setCycle]           = useState(null);
  const [orgSettings,     setOrgSettings]     = useState(null);
  const [reportees,       setReportees]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [selectedEmpId,   setSelectedEmpId]   = useState(null);

  // Per-target form state: { [targetId]: { manager_rating, manager_comment } }
  const [localForms,  setLocalForms]  = useState({});
  const [saving,      setSaving]      = useState({});
  const [savedFlash,  setSavedFlash]  = useState({});
  const [saveErrors,  setSaveErrors]  = useState({});

  // Only editable in 'review' phase; read-only for calibration/closed
  const isEditable = cycle?.status === 'review';
  const isReadable = ['review', 'calibration', 'closed'].includes(cycle?.status);

  // ── Load cycle list ──
  useEffect(() => {
    getCycles()
      .then(all => {
        const sorted = [...all].sort((a, b) => (b.period_start || '').localeCompare(a.period_start || ''));
        setCycles(sorted);
        const preferred =
          sorted.find(c => c.status === 'review') ||
          sorted.find(c => c.status === 'closed') ||
          sorted.find(c => !['draft'].includes(c.status)) ||
          sorted[0] || null;
        if (preferred) setSelectedCycleId(preferred.id);
        else setLoading(false);
      })
      .catch(e => {
        setError(e?.response?.data?.error || 'Failed to load cycles');
        setLoading(false);
      });
  }, []);

  // ── Load team appraisal data when cycle changes ──
  const load = useCallback(async () => {
    if (!selectedCycleId) return;
    setLoading(true);
    setError('');
    setLocalForms({});
    setSelectedEmpId(null);
    try {
      const { cycle: c, orgSettings: os, reportees: r } = await getTeamAppraisal(selectedCycleId);
      setCycle(c);
      setOrgSettings(os);
      setReportees(r);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load team appraisal data');
    } finally {
      setLoading(false);
    }
  }, [selectedCycleId]);

  useEffect(() => { load(); }, [load]);

  // ── Form field change ──
  function handleFieldChange(targetId, field, value) {
    setLocalForms(f => ({ ...f, [targetId]: { ...(f[targetId] || {}), [field]: value } }));
    setSaveErrors(e => { const n = { ...e }; delete n[targetId]; return n; });
  }

  // ── Save manager rating for one target ──
  async function handleSave(target, empId) {
    const form = localForms[target.id] || {};
    const payload = {
      manager_rating:  form.manager_rating  ?? target.manager_rating  ?? null,
      manager_comment: form.manager_comment ?? target.manager_comment ?? null,
    };
    if (payload.manager_rating == null) return;

    setSaving(s => ({ ...s, [target.id]: true }));
    setSaveErrors(e => { const n = { ...e }; delete n[target.id]; return n; });
    try {
      const updated = await managerRate(selectedCycleId, empId, target.id, payload);
      // Merge updated target back into reportees
      setReportees(prev => prev.map(r => {
        if (r.employee.id !== empId) return r;
        return {
          ...r,
          targets: r.targets.map(t => t.id === target.id ? { ...t, ...updated } : t),
        };
      }));
      // Clear local form for this target
      setLocalForms(f => { const n = { ...f }; delete n[target.id]; return n; });
      // Flash saved
      setSavedFlash(f => ({ ...f, [target.id]: true }));
      setTimeout(() => setSavedFlash(f => { const n = { ...f }; delete n[target.id]; return n; }), 2500);
    } catch (e) {
      setSaveErrors(s => ({ ...s, [target.id]: e?.response?.data?.error || 'Save failed' }));
    } finally {
      setSaving(s => { const n = { ...s }; delete n[target.id]; return n; });
    }
  }

  const selectedReportee = reportees.find(r => r.employee.id === selectedEmpId) || null;
  const reviewWindow = cycle?.review_open || cycle?.review_close
    ? `${fmtDate(cycle.review_open) || '?'} – ${fmtDate(cycle.review_close) || '?'}`
    : null;

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Team Appraisal</h1>
            <p className="text-slate-500 text-sm mt-1">
              {cycle
                ? `${cycle.name} · Review and rate your direct reports`
                : 'Review and rate your direct reports'}
            </p>
          </div>
          {isEditable && reviewWindow && (
            <div className="text-right flex-shrink-0">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Review Window</p>
              <p className="text-sm font-semibold text-slate-700">{reviewWindow}</p>
            </div>
          )}
        </div>

        {/* Cycle selector */}
        {cycles.length > 1 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cycle:</span>
            <select
              value={selectedCycleId || ''}
              onChange={e => { setSelectedCycleId(Number(e.target.value)); }}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {cycles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.status === 'review'       ? ' (Review — Appraisal Open)'  :
                   c.status === 'closed'       ? ' (Closed)'                   :
                   c.status === 'calibration'  ? ' (Calibration)'              :
                   c.status === 'active'       ? ' (Active)'                   :
                   c.status === 'goal_setting' ? ' (Goal Setting)'             :
                   ` (${c.status})`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-sm text-slate-400 py-20 text-center">Loading team appraisal data…</div>
        )}

        {/* No cycle */}
        {!loading && !cycle && (
          <div className="bg-white border border-slate-200 border-dashed rounded-xl py-16 text-center">
            <p className="text-slate-400 text-sm">No cycle found.</p>
          </div>
        )}

        {/* Phase gate — not a reviewable cycle */}
        {!loading && cycle && !isReadable && (
          <PhaseGateBanner cycle={cycle} />
        )}

        {/* No direct reports */}
        {!loading && cycle && isReadable && reportees.length === 0 && (
          <div className="bg-white border border-slate-200 border-dashed rounded-xl py-16 text-center">
            <p className="text-slate-500 text-sm font-medium">No direct reports found.</p>
            <p className="text-slate-400 text-xs mt-1">Only employees with direct reports (reporting_to = you) appear here.</p>
          </div>
        )}

        {/* Main 2-col layout */}
        {!loading && cycle && isReadable && reportees.length > 0 && (
          <div className="flex gap-5 items-start">
            {/* Left: reportee list */}
            <ReporteeListPanel
              reportees={reportees}
              selectedEmpId={selectedEmpId}
              onSelect={setSelectedEmpId}
              orgSettings={orgSettings}
              localForms={localForms}
            />

            {/* Right: workspace or overview */}
            {selectedReportee ? (
              <RatingWorkspace
                reportee={selectedReportee}
                orgSettings={orgSettings}
                localForms={localForms}
                onFieldChange={handleFieldChange}
                onSave={(target) => handleSave(target, selectedReportee.employee.id)}
                saving={saving}
                savedFlash={savedFlash}
                saveErrors={saveErrors}
                isEditable={isEditable}
              />
            ) : (
              <TeamOverviewPanel
                reportees={reportees}
                orgSettings={orgSettings}
                localForms={localForms}
              />
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
