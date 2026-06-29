import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuthStore } from '../store/authStore';
import {
  getTargets, createTarget, updateTarget, deleteTarget,
  submitAllTargets, getCascadeContext, getLibrary,
} from '../api/targetsApi';
import { getActiveCycle } from '../api/cyclesApi';
import { getOrgSettings } from '../api/orgApi';
import CheckinModal from '../components/targets/CheckinModal';

// ── Constants ─────────────────────────────────────────────────────────────────

const FRAMEWORK_TYPE_META = {
  okr_objective: { label: 'OKR Objective', color: 'bg-violet-100 text-violet-700', icon: '🎯', group: 'OKR', order: 1 },
  okr_kr:        { label: 'Key Result',     color: 'bg-purple-100 text-purple-700', icon: '🔑', group: 'OKR', order: 2 },
  kra:           { label: 'KRA',            color: 'bg-blue-100 text-blue-700',     icon: '📁', group: 'KRA/KPI', order: 3 },
  kpi:           { label: 'KPI',            color: 'bg-cyan-100 text-cyan-700',     icon: '📊', group: 'KRA/KPI', order: 4 },
  goal:          { label: 'Goal',           color: 'bg-emerald-100 text-emerald-700', icon: '✅', group: 'Goals', order: 5 },
  competency:    { label: 'Competency',     color: 'bg-amber-100 text-amber-700',   icon: '⭐', group: 'Competency', order: 6 },
  bsc_metric:    { label: 'BSC Metric',     color: 'bg-slate-100 text-slate-700',   icon: '📐', group: 'Balanced Scorecard', order: 7 },
};

const STATUS_META = {
  draft:     { label: 'Draft',     color: 'bg-slate-100 text-slate-500' },
  proposed:  { label: 'Proposed',  color: 'bg-blue-100 text-blue-600' },
  submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-700' },
  approved:  { label: 'Approved',  color: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700' },
  linked:    { label: 'Linked',    color: 'bg-teal-100 text-teal-700' },
  active:    { label: 'Active',    color: 'bg-green-200 text-green-800' },
  locked:    { label: 'Locked',    color: 'bg-slate-200 text-slate-600' },
};

const MEASUREMENT_TYPES = [
  { value: 'higher_better', label: 'Higher is better (e.g. Revenue, CSAT)' },
  { value: 'lower_better',  label: 'Lower is better (e.g. Defect rate, Churn)' },
  { value: 'target_exact',  label: 'Exact target (e.g. Compliance, SLA)' },
];

// ── Help content for group InfoIcons ──────────────────────────────────────────
const GROUP_HELP = {
  OKR: {
    title: 'OKR — Objectives & Key Results',
    body: `An Objective is an inspiring direction statement ("What do we want to achieve?"). A Key Result is a measurable outcome that proves the Objective was achieved. Key Results always have a numeric target. You must create an Objective first, then add Key Results under it. Each Objective should have 1–5 Key Results.`,
  },
  'KRA/KPI': {
    title: 'KRA/KPI — Key Result Areas & Performance Indicators',
    body: `A KRA is a named area of responsibility (e.g. "Revenue Growth", "Customer Success"). It is a folder that groups related KPIs. A KPI is a numeric measurement instrument — you set a target value for this cycle against it. KPIs always live inside a KRA. Your scorecard should cover your main areas of accountability.`,
  },
  Goals: {
    title: 'Goals — Simple Outcome Targets',
    body: `A Goal is a straightforward target without the OKR or KPI framework structure. It has a title, a planned value, and a unit. Goals are self-contained — no folder needed. Use Goals for specific deliverables or milestones that are important for this cycle.`,
  },
  Competency: {
    title: 'Competencies — Behavioural & Skill Attributes',
    body: `Competencies describe how you work, not just what you deliver. They are rated at formal review time by your manager on a behavioural scale. Competency weights are tracked separately from goal weights. They are assessed once per cycle at the review stage, not continuously tracked.`,
  },
  'Balanced Scorecard': {
    title: 'Balanced Scorecard Metrics',
    body: `BSC metrics are KPIs organised into four perspectives: Financial, Customer, Internal Process, and Learning & Growth. Each metric belongs to one perspective (which acts as the KRA folder). Set your planned target value for this cycle.`,
  },
};

// ── Utility helpers ───────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN');
}

function pct(n) {
  if (n == null) return '—';
  return `${Number(n).toFixed(1)}%`;
}

// ── Components ────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${m.color}`}>
      {m.label}
    </span>
  );
}

function InfoPopup({ title, body, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function InfoIcon({ title, body }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold hover:bg-blue-100 hover:text-blue-600 transition-colors ml-1"
        title={title}
      >
        i
      </button>
      {open && <InfoPopup title={title} body={body} onClose={() => setOpen(false)} />}
    </>
  );
}

// ── Weight Bar ────────────────────────────────────────────────────────────────
function WeightBar({ targets, label, filterFn }) {
  const filtered = targets.filter(filterFn);
  if (!filtered.length) return null;
  const sum = filtered.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);
  const pctFill = Math.min(sum, 100);
  const ok = Math.abs(sum - 100) <= 0.01;
  const over = sum > 100;

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-slate-500 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-500' : over ? 'bg-red-500' : 'bg-blue-400'}`}
          style={{ width: `${pctFill}%` }}
        />
      </div>
      <span className={`font-semibold tabular-nums w-14 text-right ${ok ? 'text-emerald-600' : over ? 'text-red-600' : 'text-slate-500'}`}>
        {sum.toFixed(1)}%
      </span>
      {ok && <span className="text-emerald-500">✓</span>}
      {!ok && <span className="text-slate-400">/ 100%</span>}
    </div>
  );
}

// ── Cascade Gate Banner ───────────────────────────────────────────────────────
function CascadeGateBanner({ gate, cascadeMode }) {
  if (gate.open) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
      <span className="text-amber-500 text-xl mt-0.5">⏳</span>
      <div>
        <p className="font-semibold text-amber-900 text-sm">Waiting for your manager</p>
        <p className="text-amber-800 text-sm mt-1">{gate.reason}</p>
        <p className="text-amber-700 text-xs mt-2">
          You can prepare your targets as drafts now — you just cannot submit until your manager's targets are approved.
        </p>
      </div>
    </div>
  );
}

// ── Context Panel ─────────────────────────────────────────────────────────────
function ContextPanel({ context, cycle }) {
  const [collapsed, setCollapsed] = useState(false);
  if (!context) return null;

  const { chain, targets } = context;
  if (!chain?.length) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setCollapsed(v => !v)}
      >
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          Your Manager Chain &amp; Their Targets
        </span>
        <span className="text-slate-400 text-xs">{collapsed ? '▼ Show' : '▲ Hide'}</span>
      </button>
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {chain.slice(1).map(person => {
            const personTargets = targets.filter(t => t.employee_id === person.id);
            return (
              <div key={person.id} className="border-l-2 border-slate-300 pl-3">
                <p className="text-xs font-semibold text-slate-600">
                  {person.name}
                  <span className="text-slate-400 font-normal ml-1">(depth {person.depth})</span>
                </p>
                {personTargets.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">No approved targets yet</p>
                )}
                {personTargets.map(t => (
                  <div key={t.id} className="mt-1.5 flex items-start gap-2">
                    <span className="text-[10px] font-medium text-slate-400 pt-0.5 w-16 flex-shrink-0">
                      {FRAMEWORK_TYPE_META[t.framework_type]?.label || t.framework_type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-700 truncate">{t.title}</p>
                      {t.planned_target != null && (
                        <p className="text-[10px] text-slate-400">
                          Target: {fmt(t.planned_target)} {t.unit || ''}
                          {t.weight ? ` · ${t.weight}%` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Mini progress bar used inside TargetRow ───────────────────────────────────
function MiniProgress({ actual, planned, measurementType }) {
  if (actual == null || planned == null) return null;
  const pct = (parseFloat(actual) / parseFloat(planned)) * 100;
  const isLower = measurementType === 'lower_better';
  const onTrack = isLower ? actual <= planned : pct >= 100;
  const barColor = onTrack ? 'bg-emerald-400' : pct >= 70 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(Math.abs(pct), 100)}%` }} />
      </div>
      <span className={`text-[10px] font-medium ${onTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
        {fmt(actual)} ({pct.toFixed(0)}%)
      </span>
    </div>
  );
}

// ── Target Row ────────────────────────────────────────────────────────────────
function TargetRow({ target, onEdit, onDelete, onCheckin, canEdit, canCheckin }) {
  const meta = FRAMEWORK_TYPE_META[target.framework_type] || FRAMEWORK_TYPE_META.goal;
  const showCheckin = canCheckin &&
    ['approved', 'active', 'locked'].includes(target.status) &&
    !['okr_objective', 'kra'].includes(target.framework_type) &&
    target.planned_target != null;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-800 truncate max-w-xs">{target.title}</span>
          <StatusBadge status={target.status} />
          {target.is_over_planned === 1 && (
            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
              Over-planned {target.over_plan_ratio ? `×${Number(target.over_plan_ratio).toFixed(2)}` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {target.planned_target != null && (
            <span className="text-xs text-slate-500">
              Target: <strong>{fmt(target.planned_target)}</strong>{target.unit ? ` ${target.unit}` : ''}
            </span>
          )}
          {target.stretch_target != null && (
            <span className="text-xs text-slate-400">
              Stretch: {fmt(target.stretch_target)}{target.unit ? ` ${target.unit}` : ''}
            </span>
          )}
          {target.parent_title && (
            <span className="text-xs text-slate-400 italic truncate max-w-[180px]">
              ↑ {target.parent_title}
            </span>
          )}
          {target.rejection_note && (
            <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded max-w-xs truncate">
              Rejected: {target.rejection_note}
            </span>
          )}
          {/* Check-in frequency badge */}
          {target.checkin_frequency && !['okr_objective','kra'].includes(target.framework_type) && (
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
              🔁 {CHECKIN_FREQUENCIES.find(f => f.value === target.checkin_frequency)?.label || target.checkin_frequency}
            </span>
          )}
          {/* Actual progress (visible once check-ins are recorded) */}
          {target.actual_value != null && target.planned_target != null &&
           !['okr_objective', 'kra'].includes(target.framework_type) && (
            <MiniProgress
              actual={target.actual_value}
              planned={target.planned_target}
              measurementType={target.measurement_type}
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-700 tabular-nums w-12 text-right">
          {target.weight != null ? `${Number(target.weight).toFixed(0)}%` : '—'}
        </span>
        {showCheckin && (
          <button
            onClick={() => onCheckin(target)}
            className="text-xs text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 border border-emerald-200 font-medium"
            title="Record actual progress for this period"
          >
            Check-in
          </button>
        )}
        {canEdit && ['draft', 'rejected'].includes(target.status) && (
          <>
            <button
              onClick={() => onEdit(target)}
              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(target)}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Target Group Section ──────────────────────────────────────────────────────
function TargetGroup({ groupName, targets, onEdit, onDelete, onAdd, onCheckin, canEdit, canCheckin, activeTypes }) {
  const [collapsed, setCollapsed] = useState(false);
  const help = GROUP_HELP[groupName];
  const groupTargets = targets.filter(t => {
    const meta = FRAMEWORK_TYPE_META[t.framework_type];
    return meta?.group === groupName;
  });

  // For OKR: nest KRs under their Objective
  const isOKR = groupName === 'OKR';
  let displayTargets = groupTargets;
  let objectives = [];
  let standaloneKRs = [];

  if (isOKR) {
    objectives = groupTargets.filter(t => t.framework_type === 'okr_objective');
    standaloneKRs = groupTargets.filter(
      t => t.framework_type === 'okr_kr' && !objectives.find(o => o.id === t.parent_target_id)
    );
    displayTargets = [];
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
          <span className="text-xs text-slate-400">{groupTargets.length} item{groupTargets.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-400 text-xs ml-auto">{collapsed ? '▼' : '▲'}</span>
        </button>
        {help && <InfoIcon title={help.title} body={help.body} />}
        {canEdit && (
          <button
            onClick={onAdd}
            className="ml-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add
          </button>
        )}
      </div>

      {/* Group Body */}
      {!collapsed && (
        <div className="px-4">
          {groupTargets.length === 0 && (
            <p className="text-sm text-slate-400 py-4 text-center">
              No {groupName} targets yet.
              {canEdit && <button onClick={onAdd} className="ml-1 text-blue-500 hover:underline">Add one</button>}
            </p>
          )}

          {isOKR && (
            <>
              {objectives.map(obj => {
                const krs = groupTargets.filter(
                  t => t.framework_type === 'okr_kr' && t.parent_target_id === obj.id
                );
                return (
                  <div key={obj.id} className="py-2">
                    <TargetRow target={obj} onEdit={onEdit} onDelete={onDelete} onCheckin={onCheckin} canEdit={canEdit} canCheckin={canCheckin} />
                    {krs.map(kr => (
                      <div key={kr.id} className="ml-6 border-l-2 border-purple-100 pl-3">
                        <TargetRow target={kr} onEdit={onEdit} onDelete={onDelete} onCheckin={onCheckin} canEdit={canEdit} canCheckin={canCheckin} />
                      </div>
                    ))}
                    {canEdit && (
                      <button
                        onClick={() => onAdd({ prefill: { framework_type: 'okr_kr', parent_target_id: obj.id } })}
                        className="ml-6 mt-1 text-xs text-purple-600 hover:text-purple-700 hover:underline"
                      >
                        + Add Key Result under this Objective
                      </button>
                    )}
                  </div>
                );
              })}
              {standaloneKRs.map(kr => (
                <TargetRow key={kr.id} target={kr} onEdit={onEdit} onDelete={onDelete} onCheckin={onCheckin} canEdit={canEdit} canCheckin={canCheckin} />
              ))}
            </>
          )}

          {groupName === 'KRA/KPI' && (() => {
            const kras = groupTargets.filter(t => t.framework_type === 'kra');
            const kpis = groupTargets.filter(t => t.framework_type === 'kpi');
            const standaloneKpis = kpis.filter(k => !kras.find(kra => kra.id === k.parent_target_id));
            return (
              <>
                {kras.map(kra => {
                  const underKra = kpis.filter(k => k.parent_target_id === kra.id);
                  return (
                    <div key={kra.id} className="py-1">
                      <TargetRow target={kra} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} />
                      {underKra.map(kpi => (
                        <div key={kpi.id} className="ml-6 border-l-2 border-cyan-100 pl-3">
                          <TargetRow target={kpi} onEdit={onEdit} onDelete={onDelete} onCheckin={onCheckin} canEdit={canEdit} canCheckin={canCheckin} />
                        </div>
                      ))}
                    </div>
                  );
                })}
                {standaloneKpis.map(kpi => (
                  <TargetRow key={kpi.id} target={kpi} onEdit={onEdit} onDelete={onDelete} onCheckin={onCheckin} canEdit={canEdit} canCheckin={canCheckin} />
                ))}
              </>
            );
          })()}

          {(groupName === 'Goals' || groupName === 'Competency' || groupName === 'Balanced Scorecard') &&
            groupTargets.map(t => (
              <TargetRow key={t.id} target={t} onEdit={onEdit} onDelete={onDelete} onCheckin={onCheckin} canEdit={canEdit} canCheckin={canCheckin} />
            ))
          }
        </div>
      )}
    </div>
  );
}

// ── Add / Edit Target Modal ───────────────────────────────────────────────────
const CHECKIN_FREQUENCIES = [
  { value: 'daily',       label: 'Daily'            },
  { value: 'weekly',      label: 'Weekly'           },
  { value: 'bi_weekly',   label: 'Bi-Weekly'        },
  { value: 'monthly',     label: 'Monthly'          },
  { value: 'quarterly',   label: 'Quarterly'        },
  { value: 'semi_annual', label: 'Semi-Annual'      },
  { value: 'annual',      label: 'Annual'           },
];

const EMPTY_FORM = {
  framework_type: 'goal',
  title: '',
  description: '',
  library_id: '',
  unit: '',
  measurement_type: 'higher_better',
  planned_target: '',
  stretch_target: '',
  weight: '',
  parent_target_id: '',
  over_plan_note: '',
  checkin_frequency: 'monthly',
};

function TargetModal({ initial, cycle, cascadeContext, orgSettings, activeTypes, onSave, onClose }) {
  const isEdit = !!initial?.id;
  const prefill = initial?.prefill || {};
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...prefill,
    ...(isEdit ? {
      framework_type: initial.framework_type || 'goal',
      title: initial.title || '',
      description: initial.description || '',
      library_id: initial.library_id || '',
      unit: initial.unit || '',
      measurement_type: initial.measurement_type || 'higher_better',
      planned_target: initial.planned_target ?? '',
      stretch_target: initial.stretch_target ?? '',
      weight: initial.weight ?? '',
      parent_target_id: initial.parent_target_id || '',
      over_plan_note: initial.over_plan_note || '',
      checkin_frequency: initial.checkin_frequency || 'monthly',
    } : {}),
  }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [library, setLibrary] = useState([]);

  // Load library items when type changes to kpi/competency
  useEffect(() => {
    if (['kpi', 'kra', 'competency'].includes(form.framework_type)) {
      getLibrary(form.framework_type).then(setLibrary).catch(() => {});
    }
  }, [form.framework_type]);

  // Eligible types based on active_types from org settings
  const enabledTypes = activeTypes || ['goal', 'competency'];

  // Parent target options from cascade context
  const parentOptions = (cascadeContext?.targets || []).filter(t => {
    // Cross-linkage filter (simplified: competency cannot link anything)
    if (form.framework_type === 'competency') return false;
    if (form.framework_type === 'okr_kr') return t.framework_type === 'okr_objective';
    if (form.framework_type === 'kpi') return ['kra', 'okr_kr', 'okr_objective'].includes(t.framework_type);
    return true;
  });

  // Also include current employee's own OKR objectives as parent options for okr_kr
  const [myObjectives, setMyObjectives] = useState([]);
  useEffect(() => {
    if (form.framework_type === 'okr_kr' && cycle?.id) {
      getTargets({ cycle_id: cycle.id })
        .then(all => setMyObjectives(all.filter(t => t.framework_type === 'okr_objective')))
        .catch(() => {});
    }
  }, [form.framework_type, cycle?.id]);

  const allParentOptions = form.framework_type === 'okr_kr'
    ? [...myObjectives, ...parentOptions.filter(p => p.framework_type === 'okr_objective')]
    : parentOptions;

  // Uniquify by id
  const uniqueParents = allParentOptions.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setErr('');
  }

  // Check over-plan in real time
  const selectedParent = uniqueParents.find(p => p.id == form.parent_target_id);
  const isOverPlanned = selectedParent && form.planned_target &&
    parseFloat(form.planned_target) > parseFloat(selectedParent.planned_target || 0);

  // Live warnings
  useEffect(() => {
    const w = [];
    const weight = parseFloat(form.weight) || 0;
    const minW = orgSettings?.settings?.target_rules?.min_target_weight || 5;
    const maxW = orgSettings?.settings?.target_rules?.max_target_weight || 50;
    if (form.weight && weight < minW) w.push(`Weight ${weight}% is below the recommended minimum of ${minW}%.`);
    if (form.weight && weight > maxW) w.push(`Weight ${weight}% exceeds the recommended maximum of ${maxW}%.`);
    if (form.stretch_target && form.planned_target &&
        parseFloat(form.stretch_target) <= parseFloat(form.planned_target)) {
      w.push('Stretch target must be greater than planned target.');
    }
    setWarnings(w);
  }, [form.weight, form.stretch_target, form.planned_target, orgSettings]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');

    if (!form.title.trim()) return setErr('Title is required');
    if (!form.framework_type) return setErr('Type is required');

    // Client-side quick checks
    if (form.framework_type === 'okr_kr' && !form.parent_target_id) {
      return setErr('A Key Result must be placed under an Objective. Select a parent Objective.');
    }
    if (isOverPlanned && !form.over_plan_note?.trim()) {
      return setErr('This target exceeds your manager\'s planned value (over-planned). You must provide a written justification before saving.');
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        cycle_id: cycle.id,
        parent_target_id: form.parent_target_id || null,
        library_id: form.library_id || null,
        planned_target: form.planned_target !== '' ? parseFloat(form.planned_target) : null,
        stretch_target: form.stretch_target !== '' ? parseFloat(form.stretch_target) : null,
        weight: form.weight !== '' ? parseFloat(form.weight) : 0,
      };

      if (isEdit) {
        await updateTarget(initial.id, payload);
      } else {
        await createTarget(payload);
      }
      onSave();
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Save failed. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  }

  const needsNumericTarget = !['okr_objective', 'competency'].includes(form.framework_type);
  const needsParent = form.framework_type === 'okr_kr'; // KR always needs parent
  const showLibraryPicker = ['kpi', 'kra', 'competency'].includes(form.framework_type);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Target' : 'Add Target'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type selector */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Target Type
                <InfoIcon
                  title="Target Type"
                  body="Choose the type that matches your organisation's framework and what you want to measure. OKR Key Results and KPIs must be measurable with numbers. Objectives and Goals can be descriptive. Competencies are rated at review time."
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {enabledTypes.map(type => {
                  const meta = FRAMEWORK_TYPE_META[type];
                  if (!meta) return null;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => set('framework_type', type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.framework_type === type
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {meta.icon} {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Library picker for KPI/KRA/Competency */}
          {showLibraryPicker && library.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Select from Library
                <InfoIcon
                  title="Library Item"
                  body="KRAs, KPIs, and Competencies are defined in your organisation's performance library. Select the one that applies to your role. The title will be pre-filled from the library."
                />
              </label>
              <select
                value={form.library_id}
                onChange={e => {
                  const item = library.find(l => l.id == e.target.value);
                  set('library_id', e.target.value);
                  if (item) {
                    set('title', item.name);
                    if (item.unit) set('unit', item.unit);
                    if (item.measurement_type) set('measurement_type', item.measurement_type);
                  }
                }}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Browse library (optional) —</option>
                {library.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.parent_name ? `${l.parent_name} › ` : ''}{l.name}
                    {l.is_mandatory ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {form.framework_type === 'okr_objective' ? 'Objective Statement' :
               form.framework_type === 'okr_kr' ? 'Key Result' : 'Title'}
              <span className="text-red-500 ml-0.5">*</span>
              <InfoIcon
                title="Target Title"
                body={
                  form.framework_type === 'okr_objective'
                    ? 'Write an inspiring, qualitative direction. "Become the most trusted platform" — not a number. Key Results capture the numbers.'
                    : form.framework_type === 'okr_kr'
                    ? 'Write a specific measurable outcome: what will you achieve and by how much? e.g. "Sign 50 new enterprise accounts".'
                    : 'Give this target a clear, descriptive name that explains what will be measured or achieved.'
                }
              />
            </label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={
                form.framework_type === 'okr_objective' ? 'e.g. Become the market leader in customer satisfaction'
                : form.framework_type === 'okr_kr' ? 'e.g. Achieve NPS score of 65'
                : form.framework_type === 'kpi' ? 'e.g. Monthly Revenue'
                : form.framework_type === 'goal' ? 'e.g. Complete ISO certification'
                : form.framework_type === 'competency' ? 'e.g. Leadership & Communication'
                : 'Target title'
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Description / Contribution Note
              <InfoIcon
                title="Description"
                body="Explain HOW you will achieve this target and how it contributes to your manager's goals. If linking to an unusual parent type, this explanation is required."
              />
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              placeholder="Explain your approach and how this contributes to team/org goals…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Parent target linkage */}
          {(needsParent || uniqueParents.length > 0) && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {needsParent ? 'Parent Objective' : 'Link to Parent Target'}
                {needsParent && <span className="text-red-500 ml-0.5">*</span>}
                <InfoIcon
                  title="Parent Target"
                  body="Select the target from your manager or company that this target contributes to. This is how cascade works — your target explains your contribution to the level above. In top-down mode, this is required."
                />
              </label>
              <select
                value={form.parent_target_id}
                onChange={e => set('parent_target_id', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— {needsParent ? 'Select an Objective (required)' : 'Select parent (recommended)'} —</option>
                {uniqueParents.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.employee_name ? `${p.employee_name}: ` : ''}
                    {p.title}
                    {p.planned_target != null ? ` (${fmt(p.planned_target)} ${p.unit || ''})` : ''}
                  </option>
                ))}
              </select>

              {/* Over-plan alert */}
              {isOverPlanned && (
                <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5">
                  <p className="text-xs font-semibold text-orange-800">⚠ Over-planned</p>
                  <p className="text-xs text-orange-700 mt-0.5">
                    Your target ({fmt(form.planned_target)}) exceeds your manager's planned value ({fmt(selectedParent?.planned_target)}).
                    Over-planning is allowed but requires written justification below (Rule OP3).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Numeric target fields */}
          {needsNumericTarget && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Planned Target
                  <InfoIcon
                    title="Planned Target"
                    body="The numeric value you commit to achieve this cycle. Must be greater than zero. This is what your manager will hold you accountable to."
                  />
                </label>
                <input
                  type="number"
                  value={form.planned_target}
                  onChange={e => set('planned_target', e.target.value)}
                  placeholder="e.g. 100"
                  min="0.01"
                  step="any"
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Unit
                  <InfoIcon
                    title="Unit of Measurement"
                    body="The unit for your target — e.g. ₹ Cr, %, count, NPS score, hours. Keeps the number interpretable."
                  />
                </label>
                <input
                  value={form.unit}
                  onChange={e => set('unit', e.target.value)}
                  placeholder="e.g. ₹ Lakhs, %, count"
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Stretch Target <span className="text-slate-400 font-normal">(optional)</span>
                  <InfoIcon
                    title="Stretch Target"
                    body="An aspirational goal above your planned target. If you achieve this, you go above-and-beyond. Must be greater than planned target. Not used in scoring — informational only."
                  />
                </label>
                <input
                  type="number"
                  value={form.stretch_target}
                  onChange={e => set('stretch_target', e.target.value)}
                  placeholder="Aspirational (optional)"
                  step="any"
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Measurement Direction
                  <InfoIcon
                    title="Measurement Direction"
                    body="Higher is better: revenue, CSAT, throughput. Lower is better: defect rate, churn, cost. Exact: must hit exactly — SLA compliance."
                  />
                </label>
                <select
                  value={form.measurement_type}
                  onChange={e => set('measurement_type', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MEASUREMENT_TYPES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Weight */}
          {form.framework_type !== 'okr_objective' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Weight (%)
                <span className="text-red-500 ml-0.5">*</span>
                <InfoIcon
                  title="Target Weight"
                  body="The importance of this target relative to all your other targets in this cycle. All goal target weights must sum to exactly 100%. Competency weights sum separately to 100%. Weight is your conscious prioritisation — the system does not set this for you."
                />
              </label>
              <input
                type="number"
                value={form.weight}
                onChange={e => set('weight', e.target.value)}
                placeholder="e.g. 20"
                min="0.01"
                max="100"
                step="0.5"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Check-in frequency — skip for OKR Objectives and KRAs (folders only) */}
          {!['okr_objective', 'kra'].includes(form.framework_type) && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Check-in Frequency
                <InfoIcon
                  title="Check-in Frequency"
                  body="How often you plan to update progress on this target. The system will remind you and flag this target as overdue if no check-in is recorded within this window. Company OKRs are typically quarterly; HOD targets monthly; employee targets weekly or monthly."
                />
              </label>
              <select
                value={form.checkin_frequency}
                onChange={e => set('checkin_frequency', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CHECKIN_FREQUENCIES.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Over-plan justification */}
          {isOverPlanned && (
            <div>
              <label className="block text-xs font-semibold text-orange-700 mb-1">
                Over-plan Justification <span className="text-red-500">*</span>
                <InfoIcon
                  title="Over-plan Justification"
                  body="Your target exceeds your manager's planned value. Explain why you believe you can over-deliver and what additional effort you will put in. Your manager must explicitly approve this commitment."
                />
              </label>
              <textarea
                value={form.over_plan_note}
                onChange={e => set('over_plan_note', e.target.value)}
                rows={3}
                placeholder="Explain why you can commit to more than your manager's planned value…"
                className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-1.5">⚠ {w}</p>
              ))}
            </div>
          )}

          {/* Error */}
          {err && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Submit Confirmation Modal ─────────────────────────────────────────────────
function SubmitConfirmModal({ targets, cycle, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const draftCount = targets.filter(t => ['draft', 'rejected'].includes(t.status)).length;
  const goalSum = targets
    .filter(t => t.framework_type !== 'competency' && ['draft', 'rejected'].includes(t.status))
    .reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);
  const compSum = targets
    .filter(t => t.framework_type === 'competency' && ['draft', 'rejected'].includes(t.status))
    .reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);

  const goalOk = goalSum === 0 || Math.abs(goalSum - 100) <= 0.01;
  const compOk = compSum === 0 || Math.abs(compSum - 100) <= 0.01;

  async function handleConfirm() {
    setErr('');
    setLoading(true);
    try {
      await onConfirm();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Submit Targets for Approval</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            You are about to submit <strong>{draftCount} target(s)</strong> to your manager for approval.
            Once submitted, you cannot edit them until your manager reviews.
          </p>
          <div className="bg-slate-50 rounded-lg px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Goal targets weight sum</span>
              <span className={`font-semibold ${goalOk ? 'text-emerald-600' : 'text-red-600'}`}>
                {goalSum.toFixed(1)}% {goalOk ? '✓' : '✗ must be 100%'}
              </span>
            </div>
            {compSum > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Competency weight sum</span>
                <span className={`font-semibold ${compOk ? 'text-emerald-600' : 'text-red-600'}`}>
                  {compSum.toFixed(1)}% {compOk ? '✓' : '✗ must be 100%'}
                </span>
              </div>
            )}
          </div>
          {(!goalOk || !compOk) && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              Fix the weight sums before submitting. They must total 100%.
            </div>
          )}
          {err && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{err}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !goalOk || !compOk}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyTargetsPage() {
  const { employee } = useAuthStore();

  const [cycle, setCycle] = useState(null);
  const [targets, setTargets] = useState([]);
  const [context, setContext] = useState(null);
  const [orgSettings, setOrgSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [addPrefill, setAddPrefill] = useState(null);
  const [checkinTarget, setCheckinTarget] = useState(null);

  // Derive effective cascade mode
  const effectiveCascade = cycle?.cascade_mode || orgSettings?.cascade_mode || 'top_down';

  // Derive active types from org settings
  const activeTypes = orgSettings?.settings?.active_types ||
    ['okr_objective', 'okr_kr', 'kra', 'kpi', 'goal', 'competency'];

  // Determine if the employee can edit (goal_setting phase only)
  const canEdit = cycle?.status === 'goal_setting';

  // Check-ins available during active and review phases when the cycle flag is set
  const canCheckin = !!(cycle?.check_in_allowed === 1 && ['active', 'review'].includes(cycle?.status));

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [activeCycle, orgData] = await Promise.all([
        getActiveCycle(),
        getOrgSettings(),
      ]);

      setCycle(activeCycle);
      setOrgSettings(orgData);

      if (activeCycle) {
        const [myTargets, cascadeCtx] = await Promise.all([
          getTargets({ cycle_id: activeCycle.id }),
          getCascadeContext(activeCycle.id),
        ]);
        setTargets(myTargets);
        setContext(cascadeCtx);
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load targets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleAdd(prefill = null) {
    setAddPrefill(prefill);
    setShowAdd(true);
  }

  async function handleSave() {
    setShowAdd(false);
    setEditTarget(null);
    setAddPrefill(null);
    await load();
  }

  async function handleDelete(target) {
    if (!window.confirm(`Delete "${target.title}"?`)) return;
    try {
      await deleteTarget(target.id);
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || 'Delete failed');
    }
  }

  async function handleSubmitAll() {
    await submitAllTargets(cycle.id);
    setShowSubmit(false);
    await load();
  }

  // Group targets by framework group for display
  const activeGroups = [...new Set(
    activeTypes
      .map(t => FRAMEWORK_TYPE_META[t]?.group)
      .filter(Boolean)
  )];

  // Count submittable targets
  const submittableCount = targets.filter(t => ['draft', 'rejected'].includes(t.status)).length;
  const approvedCount = targets.filter(t => t.status === 'approved').length;
  const submittedCount = targets.filter(t => ['submitted', 'proposed'].includes(t.status)).length;

  return (
    <AppLayout>
      <div className="max-w-5xl space-y-5">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Targets</h1>
            <p className="text-slate-500 text-sm mt-1">
              {cycle
                ? `${cycle.name} · ${effectiveCascade.replace('_', '-')} cascade`
                : 'Set and manage your performance targets for this cycle'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && submittableCount > 0 && (
              <button
                onClick={() => setShowSubmit(true)}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm"
              >
                Submit {submittableCount} Target{submittableCount !== 1 ? 's' : ''} →
              </button>
            )}
          </div>
        </div>

        {/* Status summary pills */}
        {!loading && cycle && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              cycle.status === 'goal_setting' ? 'bg-blue-100 text-blue-700' :
              cycle.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              Cycle: {cycle.status.replace('_', ' ')}
            </span>
            {approvedCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                {approvedCount} Approved
              </span>
            )}
            {submittedCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                {submittedCount} Awaiting Approval
              </span>
            )}
            {submittableCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                {submittableCount} Draft
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-sm text-slate-400 py-16 text-center">Loading your targets…</div>
        )}

        {/* No active cycle */}
        {!loading && !cycle && (
          <div className="bg-white border border-slate-200 border-dashed rounded-xl py-16 text-center">
            <p className="text-slate-400 text-sm">No active review cycle.</p>
            <p className="text-slate-400 text-xs mt-1">Ask your HR admin to open a goal-setting cycle.</p>
          </div>
        )}

        {/* Cycle not in goal-setting */}
        {!loading && cycle && !canEdit && cycle.status !== 'active' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <p className="text-amber-800 text-sm font-semibold">
              {cycle.status === 'draft' ? 'This cycle is still in Draft — HR needs to open Goal Setting.' :
               cycle.status === 'review' ? 'This cycle is in the Review phase. Target editing is closed.' :
               cycle.status === 'calibration' ? 'This cycle is in Calibration. Target editing is closed.' :
               cycle.status === 'closed' ? 'This cycle is closed. Targets are archived.' :
               'Target entry is not open in the current cycle phase.'}
            </p>
          </div>
        )}

        {!loading && cycle && (
          <>
            {/* Cascade gate banner (top-down: manager must approve first) */}
            {context?.cascadeGate && effectiveCascade !== 'bottom_up' && (
              <CascadeGateBanner gate={context.cascadeGate} cascadeMode={effectiveCascade} />
            )}

            {/* Cascade mode explanation */}
            {canEdit && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                {effectiveCascade === 'top_down' && (
                  <><strong>Top-Down mode:</strong> Targets flow from leadership down. Your targets must link to your manager's approved targets and be approved before the cycle activates.</>
                )}
                {effectiveCascade === 'bottom_up' && (
                  <><strong>Bottom-Up mode:</strong> Propose your own targets freely. Your manager will link and approve them. Targets start as "Proposed".</>
                )}
                {effectiveCascade === 'bidirectional' && (
                  <><strong>Bidirectional mode:</strong> Both tracks run simultaneously. You can have manager-assigned targets and your own proposals. Both must sum to 100% weight and be approved before the cycle activates.</>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Main column: target groups */}
              <div className="lg:col-span-2 space-y-4">
                {activeGroups.map(group => (
                  <TargetGroup
                    key={group}
                    groupName={group}
                    targets={targets}
                    onEdit={t => { setEditTarget(t); setShowAdd(true); }}
                    onDelete={handleDelete}
                    onAdd={prefill => handleAdd(typeof prefill === 'object' ? prefill : null)}
                    onCheckin={t => setCheckinTarget(t)}
                    canEdit={canEdit}
                    canCheckin={canCheckin}
                    activeTypes={activeTypes}
                  />
                ))}

                {activeGroups.length === 0 && (
                  <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
                    <p className="text-slate-400 text-sm">No performance types configured yet.</p>
                    <p className="text-slate-400 text-xs mt-1">Ask your admin to configure Active Performance Types in Org Settings.</p>
                  </div>
                )}
              </div>

              {/* Right column: weight tracker + context */}
              <div className="space-y-4">
                {/* Weight Tracker */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Weight Tracker
                    <InfoIcon
                      title="Weight Tracker"
                      body="All goal target weights must sum to exactly 100% before submission (Rule V1). Competency weights are tracked separately and must also sum to 100%. The system enforces this as a hard block on submission."
                    />
                  </h3>
                  <WeightBar
                    targets={targets}
                    label="Goals"
                    filterFn={t => t.framework_type !== 'competency' && !['deleted'].includes(t.status)}
                  />
                  <WeightBar
                    targets={targets}
                    label="Competencies"
                    filterFn={t => t.framework_type === 'competency'}
                  />

                  {canEdit && (
                    <button
                      onClick={() => handleAdd()}
                      className="w-full px-3 py-2 border border-dashed border-blue-300 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-50 mt-2"
                    >
                      + Add Target
                    </button>
                  )}
                </div>

                {/* Cascade Context */}
                <ContextPanel context={context} cycle={cycle} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editTarget) && cycle && (
        <TargetModal
          initial={editTarget || (addPrefill ? { prefill: addPrefill } : null)}
          cycle={cycle}
          cascadeContext={context}
          orgSettings={orgSettings}
          activeTypes={activeTypes}
          onSave={handleSave}
          onClose={() => { setShowAdd(false); setEditTarget(null); setAddPrefill(null); }}
        />
      )}

      {/* Submit Confirm */}
      {showSubmit && cycle && (
        <SubmitConfirmModal
          targets={targets}
          cycle={cycle}
          onConfirm={handleSubmitAll}
          onClose={() => setShowSubmit(false)}
        />
      )}

      {/* Check-in Modal */}
      {checkinTarget && cycle && (
        <CheckinModal
          target={checkinTarget}
          cycleId={cycle.id}
          onClose={() => setCheckinTarget(null)}
          onCheckinAdded={load}
        />
      )}
    </AppLayout>
  );
}
