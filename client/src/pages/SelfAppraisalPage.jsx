import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import InfoIcon from '../components/shared/InfoIcon';
import { useAuthStore } from '../store/authStore';
import { getSelfAppraisal, selfRate } from '../api/appraisalApi';
import { getCycles } from '../api/cyclesApi';
import { FRAMEWORK_TYPE_META, FRAMEWORK_GROUP_ORDER } from '../utils/constants';

// ── Constants ─────────────────────────────────────────────────────────────────

// Types that carry a formal rating input.
const RATABLE_TYPES = ['okr_kr', 'kpi', 'goal', 'bsc_metric', 'competency'];
// Types that are folder/container items — shown as headers, not rated directly.
const FOLDER_TYPES = ['okr_objective', 'kra'];

const DEFAULT_GOAL_SCALE = {
  type: '5_point',
  labels: ['Needs Improvement', 'Below Expectation', 'Meets Expectation', 'Exceeds Expectation', 'Exceptional'],
  values: [1, 2, 3, 4, 5],
};
const DEFAULT_COMP_SCALE = {
  type: '5_point',
  labels: ['Needs Improvement', 'Below Expectation', 'Meets Expectation', 'Exceeds Expectation', 'Exceptional'],
  values: [1, 2, 3, 4, 5],
};
const DEFAULT_BANDS = [
  { label: 'Exceptional',         min: 4.5,  max: 5.0,  color: '#16a34a' },
  { label: 'Exceeds Expectation', min: 3.5,  max: 4.49, color: '#2563eb' },
  { label: 'Meets Expectation',   min: 2.5,  max: 3.49, color: '#d97706' },
  { label: 'Below Expectation',   min: 1.5,  max: 2.49, color: '#dc2626' },
  { label: 'Needs Improvement',   min: 0,    max: 1.49, color: '#7f1d1d' },
];

const CYCLE_PHASE_MESSAGES = {
  draft:        'This cycle is still in Draft — HR has not opened goal-setting yet.',
  goal_setting: 'Goal setting is in progress. Self-appraisal opens after the performance period ends.',
  active:       'Performance period is active. Keep recording check-ins — appraisal opens at cycle end.',
  calibration:  'Ratings are in calibration by HR. Self-appraisal is closed.',
  closed:       'This cycle is closed. Appraisal records are archived.',
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
  const key   = isCompetency ? 'competency' : 'goals';
  const scale = orgSettings?.rating_scale?.[key];
  const def   = isCompetency ? DEFAULT_COMP_SCALE : DEFAULT_GOAL_SCALE;
  if (!scale) return def;
  // Patch missing values array
  if (!scale.values) {
    if (scale.type === '3_point') scale.values = [1, 2, 3];
    else scale.values = [1, 2, 3, 4, 5];
  }
  return { ...def, ...scale };
}

function computeScorePreview(targets, localForms, orgSettings) {
  const GOAL_TYPES = ['okr_kr', 'kpi', 'goal', 'bsc_metric'];

  function effectiveRating(t) {
    const r = localForms[t.id]?.self_rating ?? t.self_rating;
    return r != null ? parseFloat(r) : null;
  }

  const goalTargets = targets.filter(t => GOAL_TYPES.includes(t.framework_type));
  const compTargets = targets.filter(t => t.framework_type === 'competency');

  const goalWtSum = goalTargets.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);
  const compWtSum = compTargets.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);

  // Use 0 for unrated targets so the preview shows the score impact of incomplete rating.
  const goalScore = goalWtSum > 0
    ? goalTargets.reduce((s, t) => s + ((effectiveRating(t) ?? 0) * (parseFloat(t.weight) || 0)), 0) / goalWtSum
    : null;
  const compScore = compWtSum > 0
    ? compTargets.reduce((s, t) => s + ((effectiveRating(t) ?? 0) * (parseFloat(t.weight) || 0)), 0) / compWtSum
    : null;

  const goalsPct = orgSettings?.weightage?.goals_percent     ?? 70;
  const compPct  = orgSettings?.weightage?.competency_percent ?? 30;

  let finalScore = null;
  if (goalScore !== null || compScore !== null) {
    finalScore = ((goalScore ?? 0) * goalsPct / 100) + ((compScore ?? 0) * compPct / 100);
  }

  const bands = orgSettings?.performance_bands || DEFAULT_BANDS;
  const band  = finalScore !== null
    ? bands.find(b => finalScore >= b.min && finalScore <= b.max) || null
    : null;

  return { goalScore, compScore, finalScore, band, goalsPct, compPct };
}

// ── Small components ──────────────────────────────────────────────────────────

function TypeChip({ type }) {
  const m = FRAMEWORK_TYPE_META[type];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${m.color}`}>
      {m.icon} {m.label}
    </span>
  );
}

function RatedBadge({ rated }) {
  if (!rated) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
      Not rated
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
      ✓ Rated
    </span>
  );
}

// ── Rating Widget ─────────────────────────────────────────────────────────────
// Renders buttons for n-point scales or a number input for percentage type.
function RatingWidget({ scale, value, onChange, disabled }) {
  if (!scale) return null;

  if (scale.type === 'percentage') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0" max="120" step="1"
          value={value ?? ''}
          disabled={disabled}
          onChange={e => onChange(e.target.value !== '' ? parseFloat(e.target.value) : null)}
          className="w-24 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <span className="text-sm text-slate-500">% achievement (0–120)</span>
      </div>
    );
  }

  // n-point / custom / BARS — render clickable buttons
  const vals   = scale.values   || [1, 2, 3, 4, 5];
  const labels = scale.labels   || vals.map(v => String(v));

  return (
    <div className="flex flex-wrap gap-2">
      {vals.map((v, i) => {
        const isSelected = value === v;
        return (
          <button
            key={v}
            type="button"
            disabled={disabled}
            onClick={() => onChange(isSelected ? null : v)}
            title={labels[i] || String(v)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              isSelected
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : disabled
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <span className="font-bold">{v}</span>
            <span className="ml-1 text-[10px] opacity-80">{labels[i]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Actual Value Pre-fill Note ────────────────────────────────────────────────
function CheckinPrefillNote({ target }) {
  if (!target.last_checkin_value || target.actual_value != null) return null;
  return (
    <p className="text-[11px] text-blue-600 mt-0.5">
      Pre-filled from your last check-in
      {target.last_checkin_label ? ` (${target.last_checkin_label})` : ''}.
      You can edit this.
    </p>
  );
}

// ── Target Appraisal Card ─────────────────────────────────────────────────────
function TargetAppraisalCard({ target, orgSettings, formValues, onFieldChange, onSave, isSaving, wasSaved, isReviewOpen }) {
  const isCompetency  = target.framework_type === 'competency';
  const hasNumericTgt = target.planned_target != null && !isCompetency;
  const scale         = getRatingScale(orgSettings, isCompetency);

  const { actual_value, self_rating, self_comment } = formValues;

  // Achievement % for numeric targets
  const achievementPct = hasNumericTgt && actual_value != null && parseFloat(target.planned_target) > 0
    ? (parseFloat(actual_value) / parseFloat(target.planned_target)) * 100
    : null;
  const isLower = target.measurement_type === 'lower_better';
  const adjustedPct = isLower && achievementPct != null
    ? (parseFloat(target.planned_target) / parseFloat(actual_value)) * 100
    : achievementPct;

  const isRated = self_rating != null;
  const isDirty = true; // always show save (save is idempotent)

  function barColor(pct) {
    if (pct == null) return 'bg-slate-200';
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 70) return 'bg-amber-400';
    return 'bg-red-400';
  }

  return (
    <div className={`border rounded-xl p-4 space-y-4 transition-colors ${
      isRated ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-white'
    }`}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeChip type={target.framework_type} />
            <RatedBadge rated={isRated} />
            {wasSaved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 animate-pulse">
                ✓ Saved
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

      {/* Planned target + parent context */}
      {(hasNumericTgt || target.parent_title) && (
        <div className="flex items-center gap-4 text-xs bg-slate-50 rounded-lg px-3 py-2 flex-wrap">
          {hasNumericTgt && (
            <div>
              <p className="text-slate-400">Planned Target</p>
              <p className="font-semibold text-slate-700">
                {fmt(target.planned_target)}{target.unit ? ` ${target.unit}` : ''}
              </p>
            </div>
          )}
          {target.stretch_target != null && (
            <div>
              <p className="text-slate-400">Stretch</p>
              <p className="font-semibold text-slate-500">
                {fmt(target.stretch_target)}{target.unit ? ` ${target.unit}` : ''}
              </p>
            </div>
          )}
          {target.parent_title && (
            <div className="ml-auto max-w-xs">
              <p className="text-slate-400">Contributes to</p>
              <p className="font-medium text-slate-600 truncate">↑ {target.parent_title}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Actual Value ── (numeric targets only, not competency) */}
      {hasNumericTgt && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Actual Achievement
            {target.unit && <span className="text-slate-400 font-normal ml-1">({target.unit})</span>}
            <InfoIcon
              title="Actual Achievement"
              content={`Enter what you actually delivered this cycle. Pre-filled from your last check-in if available (Rule PT5). Your manager will see this alongside your self-rating. This does not change your planned target.`}
            />
          </label>
          <input
            type="number"
            step="any"
            value={actual_value ?? ''}
            disabled={!isReviewOpen}
            onChange={e => onFieldChange('actual_value', e.target.value !== '' ? e.target.value : null)}
            placeholder={`Target was ${fmt(target.planned_target)}${target.unit ? ` ${target.unit}` : ''}`}
            className="w-48 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <CheckinPrefillNote target={target} />

          {/* Achievement progress bar */}
          {actual_value != null && parseFloat(actual_value) > 0 && (
            <div className="mt-2 flex items-center gap-3">
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor(adjustedPct)}`}
                  style={{ width: `${Math.min(Math.abs(adjustedPct ?? 0), 100)}%` }}
                />
              </div>
              <span className={`text-xs font-semibold ${
                (adjustedPct ?? 0) >= 100 ? 'text-emerald-600'
                : (adjustedPct ?? 0) >= 70 ? 'text-amber-600'
                : 'text-red-500'
              }`}>
                {(adjustedPct ?? 0).toFixed(1)}% of target
                {isLower ? ' (lower is better)' : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Self Rating ── */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">
          Self Rating
          <span className="text-red-500 ml-0.5">*</span>
          <InfoIcon
            title="Self Rating"
            content={`Rate your performance on this target using the ${scale.values?.length || 5}-point scale. Your manager will see your rating and may agree or override it. The manager's rating becomes the final rating (Rule AP3). Be honest — calibration helps correct any systematic bias.`}
          />
        </label>
        {isReviewOpen ? (
          <RatingWidget
            scale={scale}
            value={self_rating}
            onChange={v => onFieldChange('self_rating', v)}
            disabled={false}
          />
        ) : (
          self_rating != null
            ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-700">{self_rating}</span>
                <span className="text-sm text-slate-500">/ {scale.values?.[scale.values.length - 1] || 5}</span>
                <span className="text-xs text-slate-400 ml-1">
                  {scale.labels?.[scale.values?.indexOf(self_rating)] || ''}
                </span>
              </div>
            )
            : <p className="text-sm text-slate-400 italic">Not yet rated</p>
        )}
      </div>

      {/* ── Self Comment ── */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Self-Assessment Comment
          <InfoIcon
            title="Self-Assessment Comment"
            content={`Describe what you did to achieve this target, key accomplishments, evidence of delivery, and any context or challenges. Your manager reads this before entering their rating. Keep it factual and specific.`}
          />
        </label>
        {isReviewOpen ? (
          <textarea
            rows={3}
            value={self_comment ?? ''}
            onChange={e => onFieldChange('self_comment', e.target.value || null)}
            placeholder="Describe your key achievements, evidence of delivery, and any relevant context…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        ) : (
          <p className={`text-sm ${self_comment ? 'text-slate-700' : 'text-slate-400 italic'}`}>
            {self_comment || 'No comment entered'}
          </p>
        )}
      </div>

      {/* Save button */}
      {isReviewOpen && (
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            {isRated ? `Previously rated: ${self_rating}` : 'Rate this target and save'}
          </p>
          <button
            type="button"
            disabled={isSaving || self_rating == null}
            onClick={onSave}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save Rating'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Folder Header ─────────────────────────────────────────────────────────────
// OKR Objective and KRA — shown as section sub-headers, not rated directly.
function FolderHeader({ target }) {
  const meta = FRAMEWORK_TYPE_META[target.framework_type];
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${meta?.color || 'bg-slate-100 text-slate-600'}`}>
        {meta?.icon} {meta?.label}
      </span>
      <p className="text-sm font-semibold text-slate-700">{target.title}</p>
      {target.weight != null && (
        <span className="ml-auto text-xs font-semibold text-slate-500">{Number(target.weight).toFixed(0)}%</span>
      )}
      <InfoIcon
        title={`${meta?.label} (Folder)`}
        content={`${meta?.label === 'OKR Objective' ? 'An Objective is a qualitative direction statement.' : 'A KRA is a named area of responsibility (a folder).'}
It is not rated directly. Its score is derived from the ${meta?.label === 'OKR Objective' ? 'Key Results' : 'KPIs'} inside it.
Rate the individual items below to contribute to this group's performance.`}
        side="left"
      />
    </div>
  );
}

// ── Target Group Section ──────────────────────────────────────────────────────
const GROUP_HELP = {
  'OKR': {
    title: 'OKR — Objectives & Key Results',
    content: `An Objective is a qualitative direction statement. Key Results are measurable outcomes that prove the Objective was achieved.
Rate each Key Result by entering your actual value and choosing a rating from the scale.
The Objective itself is not rated — its score is derived from its Key Results (Rule KR4).`,
  },
  'KRA/KPI': {
    title: 'KRA/KPI — Key Result Areas & KPIs',
    content: `A KRA is a named area of responsibility (e.g. "Revenue Growth"). It groups related KPIs.
A KPI is a measurement instrument with a numeric target. Rate each KPI by entering what you actually achieved and choosing a rating.
The KRA is not rated directly — its score comes from the KPIs inside it (Rule KRA2).`,
  },
  'Goals': {
    title: 'Goals — Outcome Targets',
    content: `Goals are self-contained targets without OKR/KPI framework structure.
Enter your actual achievement and choose a rating on the scale.
Goals are scored directly by weight — they are the simplest performance item to rate.`,
  },
  'Competency': {
    title: 'Competencies — Behavioural Attributes',
    content: `Competencies describe HOW you work, not just what you deliver. They are rated behaviourally, not numerically.
Choose a rating that reflects how consistently you demonstrated this behaviour during the cycle.
No actual value is needed — just your honest self-assessment and a supporting comment (Rule PT7).`,
  },
  'Balanced Scorecard': {
    title: 'Balanced Scorecard Metrics',
    content: `BSC metrics are KPIs organised into four perspectives: Financial, Customer, Internal Process, and Learning & Growth.
Rate each metric by entering your actual achievement and selecting a rating from the scale.`,
  },
};

function TargetGroupSection({ groupName, groupTargets, orgSettings, localForms, onFieldChange, onSave, saving, savedFlash, isReviewOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const help = GROUP_HELP[groupName];

  const ratableInGroup = groupTargets.filter(t => RATABLE_TYPES.includes(t.framework_type));
  const ratedInGroup   = ratableInGroup.filter(t => {
    const r = localForms[t.id]?.self_rating ?? t.self_rating;
    return r != null;
  });
  const allRated = ratableInGroup.length > 0 && ratedInGroup.length === ratableInGroup.length;

  // For OKR: nest KRs under Objectives
  const isOKR   = groupName === 'OKR';
  const isKRAKPI = groupName === 'KRA/KPI';

  function renderOKRGroup() {
    const objectives = groupTargets.filter(t => t.framework_type === 'okr_objective');
    const krs        = groupTargets.filter(t => t.framework_type === 'okr_kr');
    const standaloneKRs = krs.filter(kr => !objectives.find(o => o.id === kr.parent_target_id));

    return (
      <div className="space-y-3">
        {objectives.map(obj => {
          const nestedKRs = krs.filter(kr => kr.parent_target_id === obj.id);
          return (
            <div key={obj.id} className="space-y-2">
              <FolderHeader target={obj} />
              {nestedKRs.length === 0 && (
                <p className="text-xs text-slate-400 ml-4 italic">No Key Results under this Objective.</p>
              )}
              {nestedKRs.map(kr => (
                <div key={kr.id} className="ml-4 border-l-2 border-purple-100 pl-3">
                  <TargetAppraisalCard
                    target={kr}
                    orgSettings={orgSettings}
                    formValues={{
                      actual_value:  localForms[kr.id]?.actual_value  ?? kr.actual_value  ?? kr.last_checkin_value ?? null,
                      self_rating:   localForms[kr.id]?.self_rating   ?? kr.self_rating   ?? null,
                      self_comment:  localForms[kr.id]?.self_comment  ?? kr.self_comment  ?? '',
                    }}
                    onFieldChange={(field, val) => onFieldChange(kr.id, field, val)}
                    onSave={() => onSave(kr)}
                    isSaving={!!saving[kr.id]}
                    wasSaved={!!savedFlash[kr.id]}
                    isReviewOpen={isReviewOpen}
                  />
                </div>
              ))}
            </div>
          );
        })}
        {standaloneKRs.map(kr => (
          <TargetAppraisalCard
            key={kr.id}
            target={kr}
            orgSettings={orgSettings}
            formValues={{
              actual_value:  localForms[kr.id]?.actual_value  ?? kr.actual_value  ?? kr.last_checkin_value ?? null,
              self_rating:   localForms[kr.id]?.self_rating   ?? kr.self_rating   ?? null,
              self_comment:  localForms[kr.id]?.self_comment  ?? kr.self_comment  ?? '',
            }}
            onFieldChange={(field, val) => onFieldChange(kr.id, field, val)}
            onSave={() => onSave(kr)}
            isSaving={!!saving[kr.id]}
            wasSaved={!!savedFlash[kr.id]}
            isReviewOpen={isReviewOpen}
          />
        ))}
      </div>
    );
  }

  function renderKRAKPIGroup() {
    const kras          = groupTargets.filter(t => t.framework_type === 'kra');
    const kpis          = groupTargets.filter(t => t.framework_type === 'kpi');
    const standaloneKPIs = kpis.filter(k => !kras.find(kra => kra.id === k.parent_target_id));

    return (
      <div className="space-y-3">
        {kras.map(kra => {
          const nestedKPIs = kpis.filter(k => k.parent_target_id === kra.id);
          return (
            <div key={kra.id} className="space-y-2">
              <FolderHeader target={kra} />
              {nestedKPIs.map(kpi => (
                <div key={kpi.id} className="ml-4 border-l-2 border-cyan-100 pl-3">
                  <TargetAppraisalCard
                    target={kpi}
                    orgSettings={orgSettings}
                    formValues={{
                      actual_value:  localForms[kpi.id]?.actual_value  ?? kpi.actual_value  ?? kpi.last_checkin_value ?? null,
                      self_rating:   localForms[kpi.id]?.self_rating   ?? kpi.self_rating   ?? null,
                      self_comment:  localForms[kpi.id]?.self_comment  ?? kpi.self_comment  ?? '',
                    }}
                    onFieldChange={(field, val) => onFieldChange(kpi.id, field, val)}
                    onSave={() => onSave(kpi)}
                    isSaving={!!saving[kpi.id]}
                    wasSaved={!!savedFlash[kpi.id]}
                    isReviewOpen={isReviewOpen}
                  />
                </div>
              ))}
            </div>
          );
        })}
        {standaloneKPIs.map(kpi => (
          <TargetAppraisalCard
            key={kpi.id}
            target={kpi}
            orgSettings={orgSettings}
            formValues={{
              actual_value:  localForms[kpi.id]?.actual_value  ?? kpi.actual_value  ?? kpi.last_checkin_value ?? null,
              self_rating:   localForms[kpi.id]?.self_rating   ?? kpi.self_rating   ?? null,
              self_comment:  localForms[kpi.id]?.self_comment  ?? kpi.self_comment  ?? '',
            }}
            onFieldChange={(field, val) => onFieldChange(kpi.id, field, val)}
            onSave={() => onSave(kpi)}
            isSaving={!!saving[kpi.id]}
            wasSaved={!!savedFlash[kpi.id]}
            isReviewOpen={isReviewOpen}
          />
        ))}
      </div>
    );
  }

  function renderFlatGroup() {
    return (
      <div className="space-y-3">
        {groupTargets.map(t => (
          <TargetAppraisalCard
            key={t.id}
            target={t}
            orgSettings={orgSettings}
            formValues={{
              actual_value:  localForms[t.id]?.actual_value  ?? t.actual_value  ?? t.last_checkin_value ?? null,
              self_rating:   localForms[t.id]?.self_rating   ?? t.self_rating   ?? null,
              self_comment:  localForms[t.id]?.self_comment  ?? t.self_comment  ?? '',
            }}
            onFieldChange={(field, val) => onFieldChange(t.id, field, val)}
            onSave={() => onSave(t)}
            isSaving={!!saving[t.id]}
            wasSaved={!!savedFlash[t.id]}
            isReviewOpen={isReviewOpen}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Group Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
        <button
          className="flex items-center gap-2 flex-1 text-left"
          onClick={() => setCollapsed(v => !v)}
        >
          <span className="text-sm font-bold text-slate-700">{groupName}</span>
          <span className="text-xs text-slate-400">
            {ratableInGroup.length} target{ratableInGroup.length !== 1 ? 's' : ''}
          </span>
          {allRated && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">✓ Complete</span>}
          <span className="text-slate-400 text-xs ml-auto">{collapsed ? '▼' : '▲'}</span>
        </button>
        {help && <InfoIcon title={help.title} content={help.content} side="left" />}
        <span className="text-xs text-slate-500 tabular-nums">{ratedInGroup.length}/{ratableInGroup.length} rated</span>
      </div>

      {!collapsed && (
        <div className="p-4">
          {isOKR    && renderOKRGroup()}
          {isKRAKPI && renderKRAKPIGroup()}
          {!isOKR && !isKRAKPI && renderFlatGroup()}
        </div>
      )}
    </div>
  );
}

// ── Score Preview Panel ───────────────────────────────────────────────────────
function ScorePreviewPanel({ targets, localForms, orgSettings, ratableCount, ratedCount }) {
  const { goalScore, compScore, finalScore, band, goalsPct, compPct } = computeScorePreview(targets, localForms, orgSettings);

  const ratingScale    = getRatingScale(orgSettings, false);
  const maxScale       = ratingScale.values?.[ratingScale.values.length - 1] || 5;
  const hasCompetency  = targets.some(t => t.framework_type === 'competency');
  const progressPct    = ratableCount > 0 ? Math.round((ratedCount / ratableCount) * 100) : 0;
  const allDone        = ratedCount === ratableCount && ratableCount > 0;

  return (
    <div className="space-y-4">
      {/* Appraisal progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Appraisal Progress
          </span>
          <InfoIcon
            title="Appraisal Progress"
            content={`Rate all ${ratableCount} ratable targets to complete your self-appraisal. Folder items (Objectives, KRAs) are not rated directly. Your manager can only see your self-appraisal once all targets are rated.`}
            side="left"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">{ratedCount} of {ratableCount} targets rated</span>
            <span className={`text-xs font-bold ${allDone ? 'text-emerald-600' : 'text-slate-500'}`}>
              {progressPct}%
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {allDone && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800">
            <span>✓</span>
            <span>All targets rated. Your manager can now review and rate your performance.</span>
          </div>
        )}
        {!allDone && ratedCount > 0 && (
          <p className="text-[11px] text-slate-400">
            {ratableCount - ratedCount} target{ratableCount - ratedCount !== 1 ? 's' : ''} still need a rating.
          </p>
        )}
      </div>

      {/* Estimated score */}
      {ratedCount > 0 && finalScore !== null && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Estimated Score
            </span>
            <InfoIcon
              title="Estimated Score (Preview)"
              content={`This is a preview based on your self-ratings only. Unrated targets are treated as 0 in this estimate.
Your FINAL score is calculated using your manager's ratings (Rule AP3), which may differ from your self-ratings.
HR may also adjust scores during calibration (Rule CAL1).
Use this as a rough guide — not a guarantee.`}
              side="left"
            />
          </div>

          {/* Score breakdown */}
          <div className="space-y-2">
            {goalScore !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 text-xs">Goals ({goalsPct}%)</span>
                <span className="font-semibold text-slate-700 tabular-nums">
                  {goalScore.toFixed(2)} / {maxScale}
                </span>
              </div>
            )}
            {hasCompetency && compScore !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 text-xs">Competencies ({compPct}%)</span>
                <span className="font-semibold text-slate-700 tabular-nums">
                  {compScore.toFixed(2)} / {maxScale}
                </span>
              </div>
            )}
            <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Overall (Est.)</span>
              <span className="text-xl font-bold text-slate-800 tabular-nums">
                {finalScore.toFixed(2)}
                <span className="text-sm font-normal text-slate-400 ml-1">/ {maxScale}</span>
              </span>
            </div>
          </div>

          {/* Band badge */}
          {band && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: band.color }}
            >
              <span>Performance Band (Est.):</span>
              <span>{band.label}</span>
            </div>
          )}

          {ratedCount < ratableCount && (
            <p className="text-[10px] text-slate-400">
              * Unrated targets count as 0 in this estimate. Rate all targets for an accurate preview.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Phase Gate Banner ─────────────────────────────────────────────────────────
function PhaseGateBanner({ cycle }) {
  const msg = CYCLE_PHASE_MESSAGES[cycle?.status] || 'Unknown cycle status.';
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-amber-500 text-xl">⏳</span>
        <p className="font-semibold text-amber-900 text-sm">Self-Appraisal Not Open</p>
      </div>
      <p className="text-amber-800 text-sm">{msg}</p>
      <p className="text-amber-700 text-xs">
        Cycle: <strong>{cycle?.name}</strong>
        {' · '}Current phase: <strong className="capitalize">{cycle?.status?.replace('_', ' ')}</strong>
      </p>
      <div className="pt-1">
        <div className="flex items-center gap-1 text-[11px] text-amber-700">
          {['draft','goal_setting','active','review','calibration','closed'].map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              {i > 0 && <span className="text-amber-400">→</span>}
              <span className={`px-1.5 py-0.5 rounded font-medium ${
                s === cycle?.status
                  ? 'bg-amber-600 text-white'
                  : s === 'review'
                  ? 'bg-amber-200 text-amber-800'
                  : 'text-amber-600'
              }`}>
                {s.replace('_', ' ')}
              </span>
            </span>
          ))}
        </div>
      </div>
      {/* Still show targets read-only so employees can see what they'll need to rate */}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SelfAppraisalPage() {
  const { employee } = useAuthStore();

  const [cycles,          setCycles]         = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [cycle,           setCycle]           = useState(null);
  const [targets,         setTargets]         = useState([]);
  const [orgSettings,     setOrgSettings]     = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');

  // Per-target form state: { [targetId]: { actual_value, self_rating, self_comment } }
  const [localForms,  setLocalForms]  = useState({});
  // Per-target save state
  const [saving,      setSaving]      = useState({});
  const [savedFlash,  setSavedFlash]  = useState({});
  const [saveErrors,  setSaveErrors]  = useState({});

  const isReviewOpen = cycle?.status === 'review';

  // ── Load cycle list once ──
  useEffect(() => {
    getCycles()
      .then(all => {
        const sorted = [...all].sort((a, b) => (b.period_start || '').localeCompare(a.period_start || ''));
        setCycles(sorted);
        // Prefer a cycle in 'review', then any non-closed cycle, then the first
        const preferred =
          sorted.find(c => c.status === 'review') ||
          sorted.find(c => !['closed', 'draft'].includes(c.status)) ||
          sorted[0] || null;
        if (preferred) setSelectedCycleId(preferred.id);
        else setLoading(false);
      })
      .catch(e => {
        setError(e?.response?.data?.error || 'Failed to load cycles');
        setLoading(false);
      });
  }, []);

  // ── Load self-appraisal data when cycle changes ──
  const load = useCallback(async () => {
    if (!selectedCycleId) return;
    setLoading(true);
    setError('');
    setLocalForms({});
    try {
      const { cycle: c, targets: t, orgSettings: os } = await getSelfAppraisal(selectedCycleId);
      setCycle(c);
      setTargets(t);
      setOrgSettings(os);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load self-appraisal data');
    } finally {
      setLoading(false);
    }
  }, [selectedCycleId]);

  useEffect(() => { load(); }, [load]);

  // ── Form field change ──
  function handleFieldChange(targetId, field, value) {
    setLocalForms(f => ({
      ...f,
      [targetId]: { ...(f[targetId] || {}), [field]: value },
    }));
    // Clear any previous save error when user makes a change
    setSaveErrors(e => { const n = { ...e }; delete n[targetId]; return n; });
  }

  // ── Save one target's rating ──
  async function handleSave(target) {
    const form = localForms[target.id] || {};
    const payload = {
      self_rating:  form.self_rating  ?? target.self_rating  ?? null,
      self_comment: form.self_comment ?? target.self_comment ?? null,
    };

    const actualVal = form.actual_value !== undefined ? form.actual_value : target.actual_value;
    if (actualVal !== undefined) payload.actual_value = actualVal;

    if (payload.self_rating == null) return; // guard — save button is disabled but just in case

    setSaving(s  => ({ ...s, [target.id]: true }));
    setSaveErrors(e => { const n = { ...e }; delete n[target.id]; return n; });
    try {
      const updated = await selfRate(selectedCycleId, target.id, payload);
      // Merge server response back into targets list
      setTargets(prev => prev.map(t => t.id === target.id ? { ...t, ...updated } : t));
      // Clear local form for this target (now server matches)
      setLocalForms(f => { const n = { ...f }; delete n[target.id]; return n; });
      // Flash "Saved" badge briefly
      setSavedFlash(f => ({ ...f, [target.id]: true }));
      setTimeout(() => setSavedFlash(f => { const n = { ...f }; delete n[target.id]; return n; }), 2500);
    } catch (e) {
      setSaveErrors(s => ({ ...s, [target.id]: e?.response?.data?.error || 'Save failed' }));
    } finally {
      setSaving(s => { const n = { ...s }; delete n[target.id]; return n; });
    }
  }

  // ── Derived: groups ──
  const activeTypes = orgSettings?.active_types || RATABLE_TYPES;
  const groupNames  = [...new Set(
    targets
      .map(t => FRAMEWORK_TYPE_META[t.framework_type]?.group)
      .filter(Boolean)
  )].sort((a, b) => {
    const ia = FRAMEWORK_GROUP_ORDER.indexOf(a);
    const ib = FRAMEWORK_GROUP_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const ratableTargets = targets.filter(t => RATABLE_TYPES.includes(t.framework_type));
  const ratedCount     = ratableTargets.filter(t => {
    const r = localForms[t.id]?.self_rating ?? t.self_rating;
    return r != null;
  }).length;

  // ── Any save errors to surface? ──
  const anyErrors = Object.values(saveErrors);

  // ── Review window dates ──
  const reviewWindow = cycle?.review_open || cycle?.review_close
    ? `${fmtDate(cycle.review_open) || '?'} – ${fmtDate(cycle.review_close) || '?'}`
    : null;

  return (
    <AppLayout>
      <div className="max-w-5xl space-y-5">

        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Self Appraisal</h1>
            <p className="text-slate-500 text-sm mt-1">
              {cycle
                ? `${cycle.name} · Rate your own performance for each approved target`
                : 'Rate your own performance for each approved target'}
            </p>
          </div>
          {isReviewOpen && reviewWindow && (
            <div className="text-right flex-shrink-0">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold">Review Window</p>
              <p className="text-sm font-semibold text-slate-700">{reviewWindow}</p>
            </div>
          )}
        </div>

        {/* Cycle Selector */}
        {cycles.length > 1 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cycle:</span>
            <select
              value={selectedCycleId || ''}
              onChange={e => { setSelectedCycleId(Number(e.target.value)); setTargets([]); }}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {cycles.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.status === 'review'       ? ' (Review — Appraisal Open)'  :
                   c.status === 'active'       ? ' (Active)'                   :
                   c.status === 'goal_setting' ? ' (Goal Setting)'             :
                   c.status === 'closed'       ? ' (Closed)'                   :
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

        {/* Save errors */}
        {anyErrors.map((e, i) => (
          <div key={i} className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-xs text-red-700">{e}</div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="text-sm text-slate-400 py-20 text-center">Loading appraisal data…</div>
        )}

        {/* No cycle */}
        {!loading && !cycle && (
          <div className="bg-white border border-slate-200 border-dashed rounded-xl py-16 text-center">
            <p className="text-slate-400 text-sm">No review cycle found.</p>
            <p className="text-slate-400 text-xs mt-1">Ask your HR admin to create a cycle.</p>
          </div>
        )}

        {/* Phase gate — cycle not in review */}
        {!loading && cycle && !isReviewOpen && (
          <PhaseGateBanner cycle={cycle} />
        )}

        {/* Main content — targets */}
        {!loading && cycle && targets.length === 0 && (
          <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
            <p className="text-slate-400 text-sm">No approved targets found for this cycle.</p>
            <p className="text-slate-400 text-xs mt-1">Targets must be approved by your manager before they appear here for rating.</p>
          </div>
        )}

        {!loading && cycle && targets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Target groups */}
            <div className="lg:col-span-2 space-y-4">
              {/* Instruction banner */}
              {isReviewOpen && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 space-y-1">
                  <p>
                    <strong>Review Phase Open.</strong> Rate each of your approved targets below.
                    Enter your actual achievement, select a rating on the scale, and add a brief comment
                    explaining your performance. Your manager will read your self-assessment before entering
                    their rating.
                  </p>
                  <p className="text-blue-600">
                    <strong>Remember:</strong> Folder items (Objectives, KRAs) are not rated directly —
                    rate the Key Results and KPIs inside them. Competency ratings need no actual value.
                  </p>
                </div>
              )}
              {!isReviewOpen && targets.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600">
                  Showing your targets in read-only mode. Rating inputs will be enabled when HR advances this cycle to the <strong>Review</strong> phase.
                </div>
              )}

              {groupNames.map(group => {
                const groupTargets = targets.filter(t => FRAMEWORK_TYPE_META[t.framework_type]?.group === group);
                return (
                  <TargetGroupSection
                    key={group}
                    groupName={group}
                    groupTargets={groupTargets}
                    orgSettings={orgSettings}
                    localForms={localForms}
                    onFieldChange={handleFieldChange}
                    onSave={handleSave}
                    saving={saving}
                    savedFlash={savedFlash}
                    isReviewOpen={isReviewOpen}
                  />
                );
              })}
            </div>

            {/* Right: Progress + Score preview */}
            <div className="space-y-4">
              <ScorePreviewPanel
                targets={targets}
                localForms={localForms}
                orgSettings={orgSettings}
                ratableCount={ratableTargets.length}
                ratedCount={ratedCount}
              />

              {/* Help panel */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">How It Works</p>
                <ol className="text-xs text-slate-600 space-y-2 list-none">
                  {[
                    ['1', 'Rate each target below — enter actual value and choose a rating.'],
                    ['2', 'Add a comment explaining what you achieved and any context.'],
                    ['3', 'Save each target individually — you can come back and update.'],
                    ['4', 'Your manager reviews your self-ratings and enters their own ratings.'],
                    ['5', "Manager's rating becomes the final rating (Rule AP3). HR may calibrate."],
                  ].map(([n, text]) => (
                    <li key={n} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">{n}</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
