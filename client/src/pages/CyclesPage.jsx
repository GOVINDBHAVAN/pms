import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuthStore } from '../store/authStore';
import { getCycles, createCycle, updateCycle, advanceCycle } from '../api/cyclesApi';

// ── Constants ─────────────────────────────────────────────────────────────────

const CYCLE_TYPES = [
  { value: 'annual',       label: 'Annual',        months: 12 },
  { value: 'half_yearly',  label: 'Half-Yearly',   months: 6  },
  { value: 'quarterly',    label: 'Quarterly',     months: 3  },
  { value: 'monthly',      label: 'Monthly',       months: 1  },
  { value: 'bi_weekly',    label: 'Bi-Weekly',     weeks: 2   },
  { value: 'weekly',       label: 'Weekly',        weeks: 1   },
  { value: 'custom',       label: 'Custom',                   },
];

const STATUS_META = {
  draft:        { label: 'Draft',        color: 'bg-slate-100 text-slate-600',   next: 'Open Goal-Setting',    icon: '○' },
  goal_setting: { label: 'Goal Setting', color: 'bg-blue-100 text-blue-700',     next: 'Activate (Lock Targets)', icon: '◉' },
  active:       { label: 'Active',       color: 'bg-emerald-100 text-emerald-700', next: 'Open Review / Appraisal', icon: '▶' },
  review:       { label: 'Review',       color: 'bg-amber-100 text-amber-700',   next: 'Open Calibration',     icon: '★' },
  calibration:  { label: 'Calibration',  color: 'bg-violet-100 text-violet-700', next: 'Close Cycle',          icon: '⊙' },
  closed:       { label: 'Closed',       color: 'bg-red-100 text-red-700',       next: null,                   icon: '✓' },
};

// State machine order for progress bar
const STATUS_ORDER = ['draft', 'goal_setting', 'active', 'review', 'calibration', 'closed'];

// Industry-aware smart defaults for date windows (in days from period_start / period_end)
const DATE_DEFAULTS = {
  annual:      { gsOpen: 0, gsClose: 30, apprOpen: 25, apprClose: 45, revOpen: -30, revClose: 15, calOpen: 16, calClose: 30 },
  half_yearly: { gsOpen: 0, gsClose: 15, apprOpen: 12, apprClose: 20, revOpen: -15, revClose: 7,  calOpen: 8,  calClose: 14 },
  quarterly:   { gsOpen: 0, gsClose: 10, apprOpen: 8,  apprClose: 14, revOpen: -10, revClose: 5,  calOpen: 6,  calClose: 10 },
  monthly:     { gsOpen: 0, gsClose: 3,  apprOpen: 2,  apprClose: 5,  revOpen: -3,  revClose: 2,  calOpen: 3,  calClose: 5  },
  bi_weekly:   { gsOpen: 0, gsClose: 2,  apprOpen: 1,  apprClose: 3,  revOpen: -2,  revClose: 1,  calOpen: 2,  calClose: 3  },
  weekly:      { gsOpen: 0, gsClose: 1,  apprOpen: 1,  apprClose: 2,  revOpen: -1,  revClose: 1,  calOpen: 1,  calClose: 2  },
  custom:      { gsOpen: 0, gsClose: 14, apprOpen: 10, apprClose: 21, revOpen: -14, revClose: 7,  calOpen: 8,  calClose: 14 },
};

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function computeSmartDates(cycleType, periodStart, periodEnd) {
  if (!periodStart || !periodEnd) return {};
  const d = DATE_DEFAULTS[cycleType] || DATE_DEFAULTS.custom;
  return {
    goal_set_open:     addDays(periodStart, d.gsOpen),
    goal_set_close:    addDays(periodStart, d.gsClose),
    approval_open:     addDays(periodStart, d.apprOpen),
    approval_close:    addDays(periodStart, d.apprClose),
    review_open:       addDays(periodEnd,   d.revOpen),
    review_close:      addDays(periodEnd,   d.revClose),
    calibration_open:  addDays(periodEnd,   d.calOpen),
    calibration_close: addDays(periodEnd,   d.calClose),
  };
}

// For annual Indian FY: suggest Apr 1 – Mar 31 of next year
function suggestAnnualPeriod() {
  const today = new Date();
  const yr = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return { start: `${yr}-04-01`, end: `${yr + 1}-03-31` };
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.color}`}>
      <span className="text-[10px]">{m.icon}</span>
      {m.label}
    </span>
  );
}

// ── Progress bar showing the 6-phase pipeline ─────────────────────────────────
function StatusPipeline({ status }) {
  const cur = STATUS_ORDER.indexOf(status);
  return (
    <div className="flex items-center gap-0 mt-2">
      {STATUS_ORDER.map((s, i) => {
        const m = STATUS_META[s];
        const past = i < cur;
        const active = i === cur;
        return (
          <div key={s} className="flex items-center flex-1 min-w-0">
            <div
              className={`flex-1 h-1 ${i === 0 ? 'rounded-l-full' : ''} ${i === STATUS_ORDER.length - 1 ? 'rounded-r-full' : ''}
                ${past ? 'bg-blue-500' : active ? 'bg-blue-400' : 'bg-slate-200'}`}
            />
            {i < STATUS_ORDER.length - 1 && (
              <div className={`w-2 h-2 rounded-full border-2 flex-shrink-0 -mx-0.5 z-10
                ${past ? 'bg-blue-500 border-blue-500' : active ? 'bg-white border-blue-500' : 'bg-white border-slate-300'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Phase row for date display ────────────────────────────────────────────────
function PhaseRow({ label, open, close, info }) {
  if (!open && !close) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
      <div className="w-36 text-xs font-medium text-slate-500">{label}</div>
      <div className="flex-1 text-xs text-slate-700">
        {open ? <span>{fmt(open)}</span> : <span className="text-slate-300">—</span>}
        {(open && close) && <span className="text-slate-400 mx-1">→</span>}
        {close ? <span>{fmt(close)}</span> : null}
      </div>
      {info && <div className="text-[10px] text-slate-400 max-w-[160px]">{info}</div>}
    </div>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function DateInput({ value, onChange, min, max }) {
  return (
    <input
      type="date"
      value={value || ''}
      min={min}
      max={max}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

// ── Create / Edit Modal ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '',
  cycle_type: 'annual',
  period_start: '',
  period_end: '',
  goal_set_open: '',
  goal_set_close: '',
  approval_open: '',
  approval_close: '',
  review_open: '',
  review_close: '',
  calibration_open: '',
  calibration_close: '',
  cascade_mode: '',
  check_in_allowed: 1,
};

function CycleModal({ initial, orgCascadeMode, onSave, onClose }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(() => initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Suggest annual FY dates when type is set to annual and no dates chosen yet
  useEffect(() => {
    if (!isEdit && form.cycle_type === 'annual' && !form.period_start) {
      const { start, end } = suggestAnnualPeriod();
      const name = `FY ${start.slice(0, 4)}-${end.slice(2, 4)} Annual`;
      const smart = computeSmartDates('annual', start, end);
      setForm(f => ({ ...f, name, period_start: start, period_end: end, ...smart }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function handleTypeChange(type) {
    set('cycle_type', type);
    if (form.period_start && form.period_end) {
      const smart = computeSmartDates(type, form.period_start, form.period_end);
      setForm(f => ({ ...f, cycle_type: type, ...smart }));
    }
  }

  function handlePeriodChange(key, val) {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (next.period_start && next.period_end && next.period_end > next.period_start) {
        const smart = computeSmartDates(f.cycle_type, next.period_start, next.period_end);
        return { ...next, ...smart };
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (!form.name.trim()) return setErr('Name is required');
    if (!form.period_start || !form.period_end) return setErr('Period start and end are required');
    if (form.period_end <= form.period_start) return setErr('Period end must be after period start');

    setSaving(true);
    try {
      const payload = {
        ...form,
        cascade_mode: form.cascade_mode || null,
        check_in_allowed: form.check_in_allowed ? 1 : 0,
      };
      await onSave(payload);
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const cascadeOptions = [
    { value: '', label: `Use org default (${orgCascadeMode || 'top_down'})` },
    { value: 'top_down', label: 'Top-Down — Leadership sets first' },
    { value: 'bottom_up', label: 'Bottom-Up — Employees propose first' },
    { value: 'bidirectional', label: 'Bidirectional — Both simultaneously' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 pb-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Cycle' : 'New Review Cycle'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Cycle Name" hint="E.g. FY 2025-26 Annual, Q1 2026">
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="FY 2025-26 Annual"
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>

            <Field label="Cycle Type">
              <select
                value={form.cycle_type}
                onChange={e => handleTypeChange(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CYCLE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Cascade Mode for this Cycle">
              <select
                value={form.cascade_mode}
                onChange={e => set('cascade_mode', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {cascadeOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Performance period */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Performance Period</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Period Start" hint="First day of this cycle's coverage">
                <DateInput value={form.period_start} onChange={v => handlePeriodChange('period_start', v)} />
              </Field>
              <Field label="Period End" hint="Last day of this cycle's coverage">
                <DateInput value={form.period_end} onChange={v => handlePeriodChange('period_end', v)} min={form.period_start} />
              </Field>
            </div>
            <p className="text-[11px] text-blue-600 mt-2 bg-blue-50 rounded px-3 py-1.5">
              Phase dates below are auto-suggested based on industry norms. Adjust as needed.
            </p>
          </div>

          {/* Goal-setting phase */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
              Phase 1 — Goal Setting
              <span className="ml-2 font-normal normal-case text-slate-400">Employees enter targets; managers approve</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Goal Setting Opens" hint="When employees can begin entering targets">
                <DateInput value={form.goal_set_open} onChange={v => set('goal_set_open', v)} min={form.period_start} max={form.period_end} />
              </Field>
              <Field label="Submission Deadline" hint="Last day for employees to submit targets">
                <DateInput value={form.goal_set_close} onChange={v => set('goal_set_close', v)} min={form.goal_set_open} max={form.period_end} />
              </Field>
              <Field label="Manager Approval Opens" hint="When managers can begin approving submitted targets">
                <DateInput value={form.approval_open} onChange={v => set('approval_open', v)} min={form.goal_set_open} max={form.period_end} />
              </Field>
              <Field label="Approval Deadline" hint="Last day for manager approvals before cycle is activated">
                <DateInput value={form.approval_close} onChange={v => set('approval_close', v)} min={form.approval_open} max={form.period_end} />
              </Field>
            </div>
          </div>

          {/* Review / appraisal phase */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
              Phase 2 — Self-Appraisal &amp; Manager Review
              <span className="ml-2 font-normal normal-case text-slate-400">Employee self-assesses; manager rates</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Self-Appraisal Opens" hint="Employees can enter actuals and self-rating from this date">
                <DateInput value={form.review_open} onChange={v => set('review_open', v)} min={form.period_start} />
              </Field>
              <Field label="Manager Rating Deadline" hint="All manager ratings must be done by this date">
                <DateInput value={form.review_close} onChange={v => set('review_close', v)} min={form.review_open} />
              </Field>
            </div>
          </div>

          {/* Calibration phase */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
              Phase 3 — HR Calibration
              <span className="ml-2 font-normal normal-case text-slate-400">HR normalises ratings; final scores computed</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Calibration Opens" hint="HR can begin adjusting ratings from this date">
                <DateInput value={form.calibration_open} onChange={v => set('calibration_open', v)} min={form.review_open} />
              </Field>
              <Field label="Calibration Deadline" hint="Final scores are computed after this date; cycle closes">
                <DateInput value={form.calibration_close} onChange={v => set('calibration_close', v)} min={form.calibration_open} />
              </Field>
            </div>
          </div>

          {/* Check-in toggle */}
          <div className="flex items-start gap-3 bg-slate-50 rounded-lg px-4 py-3">
            <input
              id="check-in"
              type="checkbox"
              checked={!!form.check_in_allowed}
              onChange={e => set('check_in_allowed', e.target.checked ? 1 : 0)}
              className="mt-0.5 accent-blue-600"
            />
            <label htmlFor="check-in" className="text-sm text-slate-700 cursor-pointer">
              Allow progress check-ins at any time during active phase
              <span className="block text-xs text-slate-400 mt-0.5">
                Employees can update actual values and add progress notes without HR opening a window. Recommended.
              </span>
            </label>
          </div>

          {err && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{err}</p>
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
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Advance Confirmation Modal ─────────────────────────────────────────────────
function AdvanceModal({ cycle, onConfirm, onClose }) {
  const m = STATUS_META[cycle.status] || {};
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleConfirm() {
    setErr('');
    setLoading(true);
    try {
      await onConfirm();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Could not advance cycle');
    } finally {
      setLoading(false);
    }
  }

  const warnings = {
    goal_setting: 'Goal setting will open. Employees will be able to enter and submit targets.',
    active: 'Targets will be FROZEN. No further edits to targets or weights are allowed after this point. All approved targets must have a parent linkage (V13).',
    review: 'Self-appraisal and manager rating windows will open. Employees can enter actuals and self-ratings.',
    calibration: 'HR calibration will open. Manager ratings are complete and HR can adjust final scores.',
    closed: 'The cycle will be PERMANENTLY CLOSED. Final scores are computed. This cannot be reversed.',
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Advance Cycle Status</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <StatusBadge status={cycle.status} />
            <span className="text-slate-400">→</span>
            <StatusBadge status={STATUS_ORDER[STATUS_ORDER.indexOf(cycle.status) + 1] || 'closed'} />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            {warnings[STATUS_ORDER[STATUS_ORDER.indexOf(cycle.status) + 1]] || 'Cycle will advance to the next phase.'}
          </div>
          <p className="text-sm text-slate-600">
            Advancing <strong>{cycle.name}</strong> to <strong>{STATUS_META[STATUS_ORDER[STATUS_ORDER.indexOf(cycle.status) + 1]]?.label}</strong>.
            This action cannot be reversed without manual intervention.
          </p>
          {err && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{err}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Advancing…' : 'Yes, Advance'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cycle Card ────────────────────────────────────────────────────────────────
function CycleCard({ cycle, orgCascadeMode, onEdit, onAdvance }) {
  const m = STATUS_META[cycle.status] || STATUS_META.draft;
  const effectiveCascade = cycle.cascade_mode || orgCascadeMode || 'top_down';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 hover:shadow-sm transition-shadow">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 text-base truncate">{cycle.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {fmt(cycle.period_start)} — {fmt(cycle.period_end)}
            &nbsp;·&nbsp;
            <span className="capitalize">{CYCLE_TYPES.find(t => t.value === cycle.cycle_type)?.label || cycle.cycle_type}</span>
            &nbsp;·&nbsp;
            <span className="capitalize">{effectiveCascade.replace('_', '-')}</span>
          </p>
        </div>
        <div className="flex-shrink-0">
          <StatusBadge status={cycle.status} />
        </div>
      </div>

      {/* Pipeline progress */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          {STATUS_ORDER.map(s => (
            <span key={s} className={s === cycle.status ? 'text-blue-600 font-semibold' : ''}>
              {STATUS_META[s].label}
            </span>
          ))}
        </div>
        <StatusPipeline status={cycle.status} />
      </div>

      {/* Phase dates summary */}
      <div className="bg-slate-50 rounded-lg px-3 py-2 space-y-0.5">
        <PhaseRow
          label="Goal Setting"
          open={cycle.goal_set_open}
          close={cycle.goal_set_close}
          info="Employees enter targets"
        />
        <PhaseRow
          label="Mgr Approval"
          open={cycle.approval_open}
          close={cycle.approval_close}
          info="Managers approve targets"
        />
        <PhaseRow
          label="Self Appraisal"
          open={cycle.review_open}
          close={cycle.review_close}
          info="Employees rate themselves"
        />
        <PhaseRow
          label="Calibration"
          open={cycle.calibration_open}
          close={cycle.calibration_close}
          info="HR final adjustment"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {cycle.status === 'draft' && (
          <button
            onClick={() => onEdit(cycle)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Edit
          </button>
        )}
        {m.next && (
          <button
            onClick={() => onAdvance(cycle)}
            className="px-4 py-1.5 text-xs rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            {m.next} →
          </button>
        )}
        {cycle.status === 'closed' && (
          <span className="text-xs text-slate-400 italic">Cycle closed — view-only</span>
        )}
        {cycle.check_in_allowed ? (
          <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Check-ins enabled
          </span>
        ) : (
          <span className="ml-auto text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            Check-ins off
          </span>
        )}
      </div>
    </div>
  );
}

// ── Industry Norms Reference Panel ────────────────────────────────────────────
const INDUSTRY_NORMS = [
  { industry: 'IT / SaaS', fy: 'April–March', goalSetting: 'Apr 1–30', approval: 'Apr 25–May 10', selfAppraisal: 'Feb 15–Mar 15', managerRating: 'Mar 1–31', calibration: 'Apr 1–15 (next FY)' },
  { industry: 'Manufacturing / BFSI', fy: 'April–March', goalSetting: 'Apr 1–30', approval: 'May 1–15', selfAppraisal: 'Jan 15–Feb 15', managerRating: 'Feb 1–Mar 15', calibration: 'Mar 16–31' },
  { industry: 'Healthcare / Education', fy: 'April–March', goalSetting: 'Apr 1–May 15', approval: 'May 10–31', selfAppraisal: 'Feb 1–Mar 1', managerRating: 'Mar 1–25', calibration: 'Mar 26–Apr 10' },
  { industry: 'Retail / Sales', fy: 'Calendar (Jan–Dec)', goalSetting: 'Jan 1–15', approval: 'Jan 10–25', selfAppraisal: 'Nov 15–Dec 10', managerRating: 'Dec 1–25', calibration: 'Dec 26–31' },
];

function IndustryNormsPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      >
        <span>Industry Norms — Recommended Date Windows</span>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2 text-slate-500 font-semibold">Industry</th>
                <th className="text-left px-4 py-2 text-slate-500 font-semibold">Financial Year</th>
                <th className="text-left px-4 py-2 text-slate-500 font-semibold">Goal Setting</th>
                <th className="text-left px-4 py-2 text-slate-500 font-semibold">Manager Approval</th>
                <th className="text-left px-4 py-2 text-slate-500 font-semibold">Self Appraisal</th>
                <th className="text-left px-4 py-2 text-slate-500 font-semibold">Manager Rating</th>
                <th className="text-left px-4 py-2 text-slate-500 font-semibold">Calibration</th>
              </tr>
            </thead>
            <tbody>
              {INDUSTRY_NORMS.map(n => (
                <tr key={n.industry} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{n.industry}</td>
                  <td className="px-4 py-2.5 text-slate-500">{n.fy}</td>
                  <td className="px-4 py-2.5 text-slate-600">{n.goalSetting}</td>
                  <td className="px-4 py-2.5 text-slate-600">{n.approval}</td>
                  <td className="px-4 py-2.5 text-slate-600">{n.selfAppraisal}</td>
                  <td className="px-4 py-2.5 text-slate-600">{n.managerRating}</td>
                  <td className="px-4 py-2.5 text-slate-600">{n.calibration}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-[11px] text-slate-400 bg-slate-50 border-t border-slate-100">
            Norms based on common Indian corporate practice. KRA/KPI libraries carry forward automatically — only OKR Objectives need to be redefined each cycle.
            Check-ins are always available once the cycle is active (BUSINESS_LOGIC.md Rule PT1).
          </p>
        </div>
      )}
    </div>
  );
}

// ── KRA/KPI Continuity Note ───────────────────────────────────────────────────
function ContinuityNote() {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 text-sm text-blue-800">
      <strong>KRA/KPI Continuity across cycles:</strong> KRAs and KPIs are permanent library items — they are not tied to any cycle and automatically remain available in every new cycle.
      OKR Objectives and Key Results are cycle-bound and must be defined fresh each cycle. The system will offer last cycle's OKR Objectives as suggestions, but each one must be consciously accepted.
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CyclesPage() {
  const { employee } = useAuthStore();
  const isHR = ['admin', 'hr'].includes(employee?.role);

  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgSettings, setOrgSettings] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editCycle, setEditCycle] = useState(null);
  const [advanceCycleTarget, setAdvanceCycleTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Load cycles
      const data = await getCycles();
      setCycles(data);
      // Load org settings for cascade_mode default
      const orgRes = await fetch('/api/v1/org/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('pms_token')}` },
      });
      if (orgRes.ok) setOrgSettings(await orgRes.json());
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load cycles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(payload) {
    await createCycle(payload);
    setShowCreate(false);
    load();
  }

  async function handleEdit(payload) {
    await updateCycle(editCycle.id, payload);
    setEditCycle(null);
    load();
  }

  async function handleAdvance() {
    await advanceCycle(advanceCycleTarget.id);
    setAdvanceCycleTarget(null);
    load();
  }

  const orgCascadeMode = orgSettings?.cascade_mode || 'top_down';

  const active = cycles.filter(c => !['draft', 'closed'].includes(c.status));
  const drafts  = cycles.filter(c => c.status === 'draft');
  const closed  = cycles.filter(c => c.status === 'closed');

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Review Cycles</h1>
            <p className="text-slate-500 text-sm mt-1">
              Define appraisal periods, phase windows, and cascade mode for each cycle.
            </p>
          </div>
          {isHR && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm"
            >
              + New Cycle
            </button>
          )}
        </div>

        {/* Continuity note */}
        <ContinuityNote />

        {/* Industry norms reference */}
        <IndustryNormsPanel />

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-sm text-slate-400 py-8 text-center">Loading cycles…</div>
        )}

        {/* Active / in-progress cycles */}
        {!loading && active.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">In Progress</h2>
            <div className="grid gap-4">
              {active.map(c => (
                <CycleCard
                  key={c.id}
                  cycle={c}
                  orgCascadeMode={orgCascadeMode}
                  onEdit={setEditCycle}
                  onAdvance={setAdvanceCycleTarget}
                />
              ))}
            </div>
          </div>
        )}

        {/* Draft cycles */}
        {!loading && drafts.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Draft</h2>
            <div className="grid gap-4">
              {drafts.map(c => (
                <CycleCard
                  key={c.id}
                  cycle={c}
                  orgCascadeMode={orgCascadeMode}
                  onEdit={setEditCycle}
                  onAdvance={setAdvanceCycleTarget}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && cycles.length === 0 && (
          <div className="bg-white border border-slate-200 border-dashed rounded-xl py-16 text-center">
            <p className="text-slate-400 text-sm">No review cycles yet.</p>
            {isHR && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
              >
                Create your first cycle
              </button>
            )}
          </div>
        )}

        {/* Closed cycles (collapsed) */}
        {!loading && closed.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs font-bold text-slate-400 uppercase tracking-wide select-none list-none flex items-center gap-2">
              <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
              Closed Cycles ({closed.length})
            </summary>
            <div className="grid gap-4 mt-3">
              {closed.map(c => (
                <CycleCard
                  key={c.id}
                  cycle={c}
                  orgCascadeMode={orgCascadeMode}
                  onEdit={setEditCycle}
                  onAdvance={setAdvanceCycleTarget}
                />
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CycleModal
          orgCascadeMode={orgCascadeMode}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editCycle && (
        <CycleModal
          initial={editCycle}
          orgCascadeMode={orgCascadeMode}
          onSave={handleEdit}
          onClose={() => setEditCycle(null)}
        />
      )}
      {advanceCycleTarget && (
        <AdvanceModal
          cycle={advanceCycleTarget}
          onConfirm={handleAdvance}
          onClose={() => setAdvanceCycleTarget(null)}
        />
      )}
    </AppLayout>
  );
}
