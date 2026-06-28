import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuthStore } from '../store/authStore';
import {
  getTargets, getManagerView,
  approveTarget as apiApprove,
  rejectTarget as apiReject,
  linkTarget as apiLink,
} from '../api/targetsApi';
import { getActiveCycle } from '../api/cyclesApi';
import { getOrgSettings } from '../api/orgApi';

// ── Constants ─────────────────────────────────────────────────────────────────

const FW_META = {
  okr_objective: { label: 'OKR Objective',  color: 'bg-violet-100 text-violet-700', group: 'OKR' },
  okr_kr:        { label: 'Key Result',      color: 'bg-purple-100 text-purple-700', group: 'OKR' },
  kra:           { label: 'KRA',             color: 'bg-blue-100 text-blue-700',     group: 'KRA/KPI' },
  kpi:           { label: 'KPI',             color: 'bg-cyan-100 text-cyan-700',     group: 'KRA/KPI' },
  goal:          { label: 'Goal',            color: 'bg-emerald-100 text-emerald-700', group: 'Goals' },
  competency:    { label: 'Competency',      color: 'bg-amber-100 text-amber-700',   group: 'Competency' },
  bsc_metric:    { label: 'BSC Metric',      color: 'bg-slate-100 text-slate-700',   group: 'BSC' },
};

const STATUS_META = {
  draft:     { label: 'Draft',     color: 'bg-slate-100 text-slate-500',    icon: '○' },
  proposed:  { label: 'Proposed',  color: 'bg-blue-100 text-blue-700',      icon: '◈' },
  submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800',  icon: '◉' },
  linked:    { label: 'Linked',    color: 'bg-teal-100 text-teal-700',      icon: '⬡' },
  approved:  { label: 'Approved',  color: 'bg-green-100 text-green-700',    icon: '✓' },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-700',        icon: '✗' },
  active:    { label: 'Active',    color: 'bg-green-200 text-green-800',    icon: '▶' },
};

const GROUP_HELP = {
  OKR: {
    title: 'OKR — Objectives & Key Results',
    body: `Objectives set directional ambition; Key Results prove achievement with numbers. Review each KR for: clear numeric target, appropriate weight, realistic but ambitious commitment, and contribution logic to the parent Objective or company OKR.`,
  },
  'KRA/KPI': {
    title: 'KRA/KPI — Key Result Areas & KPIs',
    body: `KRAs are responsibility folders; KPIs are the measurement instruments inside them. When approving, check that each KPI target value is achievable given this employee's scope, and that parent linkage is set correctly.`,
  },
  Goals: {
    title: 'Goals — Outcome Targets',
    body: `Simple targets without OKR/KPI framework structure. Review for clarity, measurability, and appropriate weight. The planned value is the employee's commitment for this cycle.`,
  },
  Competency: {
    title: 'Competencies — Behavioural Attributes',
    body: `Competencies are rated at formal review time, not measured numerically. Approving here means you acknowledge these are the right competencies for this role and grade. Weight should sum to 100% within the competency group.`,
  },
  BSC: {
    title: 'Balanced Scorecard Metrics',
    body: `BSC metrics are KPIs organised into four perspectives: Financial, Customer, Internal Process, and Learning & Growth. Approve the same way as KPIs — check target value, weight, and parent linkage.`,
  },
};

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null || n === '') return '—';
  return Number(n).toLocaleString('en-IN');
}

// ── Small shared components ───────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${m.color}`}>
      <span className="text-[10px]">{m.icon}</span>
      {m.label}
    </span>
  );
}

function TypeChip({ type }) {
  const m = FW_META[type];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${m.color}`}>
      {m.label}
    </span>
  );
}

function InfoPopup({ title, body, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-3" onClick={e => e.stopPropagation()}>
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
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold hover:bg-blue-100 hover:text-blue-600 ml-1"
      >i</button>
      {open && <InfoPopup title={title} body={body} onClose={() => setOpen(false)} />}
    </>
  );
}

// ── V9 Status Banner ──────────────────────────────────────────────────────────
function V9StatusBar({ myApprovedCount, isHrAdmin }) {
  if (isHrAdmin) return null;
  const ok = myApprovedCount > 0;
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${
      ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
    }`}>
      <span className={`text-lg ${ok ? 'text-emerald-500' : 'text-red-400'}`}>{ok ? '✓' : '✗'}</span>
      <div>
        <span className={`font-semibold ${ok ? 'text-emerald-800' : 'text-red-800'}`}>
          {ok ? `Your targets: ${myApprovedCount} approved` : 'You have no approved targets yet'}
        </span>
        <span className={`ml-2 text-xs ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {ok
            ? '— You can approve your team\'s targets (Rule V9 ✓)'
            : '— You must have approved targets before you can approve your team\'s targets (Rule V9)'}
        </span>
      </div>
    </div>
  );
}

// ── Approve Modal ─────────────────────────────────────────────────────────────
function ApproveModal({ target, onConfirm, onClose }) {
  const [note, setNote] = useState('');
  const [overPlanAck, setOverPlanAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const isOverPlanned = target.is_over_planned === 1;

  async function handleConfirm() {
    if (isOverPlanned && !overPlanAck) {
      return setErr('You must explicitly acknowledge the over-planned commitment before approving (Rule OP4).');
    }
    setErr('');
    setLoading(true);
    try {
      await onConfirm({ over_plan_approved: overPlanAck ? 1 : 0, manager_note: note });
    } catch (e) {
      setErr(e?.response?.data?.error || 'Approval failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Approve Target</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          {/* Target summary */}
          <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <TypeChip type={target.framework_type} />
              <span className="font-semibold text-slate-800 text-sm">{target.title}</span>
            </div>
            {target.planned_target != null && (
              <p className="text-xs text-slate-500">
                Target: <strong>{fmt(target.planned_target)}</strong>{target.unit ? ` ${target.unit}` : ''}
                {target.weight != null ? ` · Weight: ${target.weight}%` : ''}
              </p>
            )}
            {target.parent_title && (
              <p className="text-xs text-slate-400 italic">↑ Contributes to: {target.parent_title}</p>
            )}
            {target.description && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{target.description}</p>
            )}
          </div>

          {/* Over-plan section */}
          {isOverPlanned && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-orange-600 font-bold text-sm">⚠ Over-planned</span>
                <span className="text-xs text-orange-700 font-medium">
                  ×{target.over_plan_ratio ? Number(target.over_plan_ratio).toFixed(2) : '?'}
                </span>
              </div>
              {target.parent_planned != null && (
                <p className="text-xs text-orange-700">
                  Parent target: {fmt(target.parent_planned)}{target.unit ? ` ${target.unit}` : ''} ·
                  Employee committed: {fmt(target.planned_target)}{target.unit ? ` ${target.unit}` : ''}
                </p>
              )}
              {target.over_plan_note && (
                <div className="bg-white rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Employee justification</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{target.over_plan_note}</p>
                </div>
              )}
              <label className="flex items-start gap-2.5 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overPlanAck}
                  onChange={e => setOverPlanAck(e.target.checked)}
                  className="mt-0.5 accent-orange-600"
                />
                <span className="text-xs text-orange-800 leading-snug">
                  I acknowledge that this target exceeds the planned level and explicitly approve the additional commitment (Rule OP4).
                </span>
              </label>
            </div>
          )}

          {/* Manager note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Manager Note <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Feedback or guidance for the employee…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (isOverPlanned && !overPlanAck)}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Approving…' : '✓ Approve Target'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ target, onConfirm, onClose }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleConfirm() {
    if (!note.trim()) return setErr('A rejection note is required to explain why the target is being rejected.');
    setErr('');
    setLoading(true);
    try {
      await onConfirm(note.trim());
    } catch (e) {
      setErr(e?.response?.data?.error || 'Rejection failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Reject Target</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-sm font-medium text-slate-700">{target.title}</p>
            {target.planned_target != null && (
              <p className="text-xs text-slate-400 mt-0.5">
                {fmt(target.planned_target)}{target.unit ? ` ${target.unit}` : ''} · {target.weight}%
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Explain clearly why this target is being rejected and what the employee should change…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              The employee will see this note and can revise and resubmit.
            </p>
          </div>
          {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Rejecting…' : '✗ Reject Target'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Link Modal (for bottom-up proposed targets) ───────────────────────────────
function LinkModal({ target, myApprovedTargets, onConfirm, onClose }) {
  const [parentId, setParentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // Filter to compatible parent types per cross-linkage matrix
  const compatible = myApprovedTargets.filter(p => {
    if (target.framework_type === 'competency') return false;
    if (target.framework_type === 'okr_kr') return p.framework_type === 'okr_objective';
    if (target.framework_type === 'kpi') return ['kra', 'okr_kr', 'okr_objective'].includes(p.framework_type);
    return true;
  });

  async function handleConfirm() {
    if (!parentId) return setErr('Please select a parent target to link to.');
    setErr('');
    setLoading(true);
    try {
      await onConfirm(parseInt(parentId));
    } catch (e) {
      setErr(e?.response?.data?.error || 'Link failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Link Proposed Target</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg px-3 py-2.5">
            <p className="text-xs font-semibold text-blue-800 mb-1">Employee's proposed target</p>
            <p className="text-sm font-medium text-blue-900">{target.title}</p>
            {target.planned_target != null && (
              <p className="text-xs text-blue-700 mt-0.5">
                {fmt(target.planned_target)}{target.unit ? ` ${target.unit}` : ''} · {target.weight}%
              </p>
            )}
            {target.description && (
              <p className="text-xs text-blue-700 mt-1 italic">{target.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Link to your target <span className="text-red-500">*</span>
              <InfoIcon
                title="Parent Linkage"
                body="Select one of your own approved targets that this employee's proposal contributes to. This is how bottom-up cascade works — the employee's proposal gets connected to your strategic commitment. After linking, you can then approve the target."
              />
            </label>
            {compatible.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
                No compatible parent targets found. You need approved targets of a compatible type before you can link this proposal.
                {target.framework_type === 'okr_kr' && ' An OKR Key Result can only be linked to an OKR Objective.'}
              </div>
            ) : (
              <select
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select your target to link to —</option>
                {compatible.map(p => (
                  <option key={p.id} value={p.id}>
                    [{FW_META[p.framework_type]?.label || p.framework_type}] {p.title}
                    {p.planned_target != null ? ` (${fmt(p.planned_target)} ${p.unit || ''})` : ''}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              After linking you can approve or reject. The employee will not be notified of the linkage until you approve.
            </p>
          </div>

          {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !parentId}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Linking…' : '⬡ Link Target'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Target Approval Card ──────────────────────────────────────────────────────
function TargetApprovalCard({ target, myApprovedCount, isHrAdmin, onApprove, onReject, onLink, cycleStatus }) {
  const canAct = cycleStatus === 'goal_setting';
  const needsAction = ['submitted', 'proposed', 'linked'].includes(target.status);
  const canApproveNow = isHrAdmin || myApprovedCount > 0;

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${
      target.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30' :
      target.status === 'rejected' ? 'border-red-200 bg-red-50/20' :
      target.status === 'proposed' ? 'border-blue-200 bg-blue-50/20' :
      'border-slate-200 bg-white'
    }`}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeChip type={target.framework_type} />
            <StatusBadge status={target.status} />
            {target.is_over_planned === 1 && (
              <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                ⚠ Over-planned ×{target.over_plan_ratio ? Number(target.over_plan_ratio).toFixed(2) : '?'}
              </span>
            )}
          </div>
          <p className="mt-1.5 font-semibold text-slate-800 text-sm leading-snug">{target.title}</p>
          {target.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{target.description}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {target.weight != null && (
            <p className="text-lg font-bold text-slate-700 tabular-nums">{Number(target.weight).toFixed(0)}%</p>
          )}
          <p className="text-[10px] text-slate-400">weight</p>
        </div>
      </div>

      {/* Metrics row */}
      {target.planned_target != null && (
        <div className="flex items-center gap-4 text-xs bg-slate-50 rounded-lg px-3 py-2">
          <div>
            <p className="text-slate-400">Planned Target</p>
            <p className="font-semibold text-slate-700">
              {fmt(target.planned_target)}{target.unit ? ` ${target.unit}` : ''}
            </p>
          </div>
          {target.stretch_target != null && (
            <div>
              <p className="text-slate-400">Stretch</p>
              <p className="font-semibold text-slate-500">
                {fmt(target.stretch_target)}{target.unit ? ` ${target.unit}` : ''}
              </p>
            </div>
          )}
          {target.parent_title && (
            <div className="ml-auto max-w-[200px]">
              <p className="text-slate-400">Linked to</p>
              <p className="font-medium text-slate-600 truncate">{target.parent_title}</p>
            </div>
          )}
          {!target.parent_title && target.framework_type !== 'competency' && (
            <div className="ml-auto">
              <p className="text-slate-400">Linked to</p>
              <p className="font-medium text-amber-600">— Not yet linked</p>
            </div>
          )}
        </div>
      )}

      {/* Over-plan justification */}
      {target.is_over_planned === 1 && target.over_plan_note && (
        <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
          <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide mb-1">Employee justification for over-plan</p>
          <p className="text-xs text-orange-800 leading-relaxed">{target.over_plan_note}</p>
        </div>
      )}

      {/* Rejection note */}
      {target.status === 'rejected' && target.rejection_note && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide mb-1">Rejected — reason given</p>
          <p className="text-xs text-red-700">{target.rejection_note}</p>
        </div>
      )}

      {/* Action buttons */}
      {canAct && needsAction && (
        <div className="flex items-center gap-2 pt-1">
          {/* Proposed targets need linking first (unless already linked) */}
          {target.status === 'proposed' && (
            <button
              onClick={() => onLink(target)}
              className="px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              ⬡ Link to My Target
            </button>
          )}

          {/* Can approve if: submitted, or linked (already has parent) */}
          {['submitted', 'linked'].includes(target.status) && (
            <button
              onClick={() => onApprove(target)}
              disabled={!canApproveNow}
              title={!canApproveNow ? 'You need approved targets before you can approve (Rule V9)' : ''}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ✓ Approve
            </button>
          )}

          <button
            onClick={() => onReject(target)}
            className="px-3 py-1.5 text-xs font-semibold border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            ✗ Reject
          </button>

          {!canApproveNow && !isHrAdmin && (
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded">
              You need approved targets first (Rule V9)
            </span>
          )}
        </div>
      )}

      {/* Already approved indicator */}
      {target.status === 'approved' && (
        <p className="text-xs text-emerald-600">
          ✓ Approved{target.approved_at ? ` on ${new Date(target.approved_at).toLocaleDateString('en-IN')}` : ''}
        </p>
      )}
    </div>
  );
}

// ── Reportee Detail View ──────────────────────────────────────────────────────
function ReporteeView({ employeeId, cycle, myApprovedCount, isHrAdmin, onBack }) {
  const [reportee, setReportee] = useState(null);
  const [targets, setTargets] = useState([]);
  const [myTargets, setMyTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [linkTarget, setLinkTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reporteeTargets, managerView, ownTargets] = await Promise.all([
        getTargets({ cycle_id: cycle?.id, employee_id: employeeId }),
        getManagerView(cycle?.id),
        getTargets({ cycle_id: cycle?.id }),
      ]);
      const emp = managerView.find(r => r.id == employeeId);
      setReportee(emp);
      setTargets(reporteeTargets.filter(t => t.status !== 'deleted'));
      setMyTargets(ownTargets.filter(t => t.status === 'approved'));
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load reportee targets');
    } finally {
      setLoading(false);
    }
  }, [employeeId, cycle?.id]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(target, payload) {
    await apiApprove(target.id, payload);
    setApproveTarget(null);
    await load();
  }

  async function handleReject(target, note) {
    await apiReject(target.id, note);
    setRejectTarget(null);
    await load();
  }

  async function handleLink(target, parentId) {
    await apiLink(target.id, parentId);
    setLinkTarget(null);
    await load();
  }

  // Group targets by framework group
  const groups = [...new Set(targets.map(t => FW_META[t.framework_type]?.group).filter(Boolean))];
  const actionableCount = targets.filter(t => ['submitted', 'proposed', 'linked'].includes(t.status)).length;
  const approvedCount = targets.filter(t => t.status === 'approved').length;

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          ← Team
        </button>
        <span className="text-slate-300">/</span>
        {reportee && (
          <div>
            <span className="font-semibold text-slate-800">{reportee.name}</span>
            {reportee.grade && <span className="text-xs text-slate-400 ml-2">{reportee.grade}</span>}
            {reportee.dept && <span className="text-xs text-slate-400 ml-1">· {reportee.dept}</span>}
          </div>
        )}
      </div>

      {/* Status summary */}
      {!loading && (
        <div className="flex items-center gap-3 flex-wrap">
          {actionableCount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
              {actionableCount} awaiting review
            </span>
          )}
          {approvedCount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              {approvedCount} approved
            </span>
          )}
          {targets.length === 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
              No targets submitted yet
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading && (
        <div className="text-sm text-slate-400 py-12 text-center">Loading targets…</div>
      )}

      {!loading && targets.length === 0 && (
        <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
          <p className="text-slate-400 text-sm">{reportee?.name || 'This employee'} has not submitted any targets yet.</p>
        </div>
      )}

      {/* Target groups */}
      {!loading && groups.map(group => {
        const groupTargets = targets.filter(t => FW_META[t.framework_type]?.group === group);
        const help = GROUP_HELP[group];
        return (
          <div key={group} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Group header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-700">{group}</span>
              <span className="text-xs text-slate-400">{groupTargets.length} target{groupTargets.length !== 1 ? 's' : ''}</span>
              {help && <InfoIcon title={help.title} body={help.body} />}
              {/* Weight sum for this group */}
              {(() => {
                const sum = groupTargets.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);
                const ok = Math.abs(sum - 100) <= 0.01;
                return (
                  <span className={`ml-auto text-xs font-semibold ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ∑ {sum.toFixed(1)}% {ok ? '✓' : '≠ 100%'}
                  </span>
                );
              })()}
            </div>

            <div className="p-3 space-y-3">
              {groupTargets.map(t => (
                <TargetApprovalCard
                  key={t.id}
                  target={t}
                  myApprovedCount={myApprovedCount}
                  isHrAdmin={isHrAdmin}
                  onApprove={t => setApproveTarget(t)}
                  onReject={t => setRejectTarget(t)}
                  onLink={t => setLinkTarget(t)}
                  cycleStatus={cycle?.status}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Modals */}
      {approveTarget && (
        <ApproveModal
          target={approveTarget}
          onConfirm={payload => handleApprove(approveTarget, payload)}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {rejectTarget && (
        <RejectModal
          target={rejectTarget}
          onConfirm={note => handleReject(rejectTarget, note)}
          onClose={() => setRejectTarget(null)}
        />
      )}
      {linkTarget && (
        <LinkModal
          target={linkTarget}
          myApprovedTargets={myTargets}
          onConfirm={parentId => handleLink(linkTarget, parentId)}
          onClose={() => setLinkTarget(null)}
        />
      )}
    </div>
  );
}

// ── Reportee Card (team list view) ────────────────────────────────────────────
function ReporteeCard({ reportee, onReview }) {
  const total = reportee.targets?.length || 0;
  const submitted = reportee.submittedCount || 0;
  const approved = reportee.approvedCount || 0;
  const draft = total - submitted - approved;

  const status = total === 0 ? 'none'
    : approved === total ? 'all_approved'
    : submitted > 0 ? 'needs_review'
    : 'draft_only';

  const statusInfo = {
    none:         { label: 'No targets yet',   color: 'text-slate-400',    dot: 'bg-slate-300' },
    all_approved: { label: 'All approved',     color: 'text-emerald-600',  dot: 'bg-emerald-500' },
    needs_review: { label: 'Needs review',     color: 'text-yellow-700',   dot: 'bg-yellow-500' },
    draft_only:   { label: 'Not submitted yet',color: 'text-slate-500',    dot: 'bg-slate-400' },
  }[status];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm flex-shrink-0">
        {reportee.name?.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">{reportee.name}</p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {reportee.grade && <span className="text-xs text-slate-400">{reportee.grade}</span>}
          {reportee.dept && <span className="text-xs text-slate-400">· {reportee.dept}</span>}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.dot}`} />
          <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          {total > 0 && (
            <span className="text-xs text-slate-400">
              · {approved} approved, {submitted} awaiting, {draft} draft
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => onReview(reportee.id)}
        className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
          status === 'needs_review'
            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
            : status === 'all_approved'
            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {status === 'needs_review' ? 'Review →' : 'View →'}
      </button>
    </div>
  );
}

// ── Team List View ────────────────────────────────────────────────────────────
function TeamView({ cycle, onReview }) {
  const [reportees, setReportees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getManagerView(cycle?.id);
      setReportees(data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, [cycle?.id]);

  useEffect(() => { load(); }, [load]);

  const needsReviewCount = reportees.filter(r => r.submittedCount > 0).length;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading && (
        <div className="text-sm text-slate-400 py-12 text-center">Loading team…</div>
      )}

      {!loading && reportees.length === 0 && (
        <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
          <p className="text-slate-400 text-sm">You have no direct reportees assigned.</p>
          <p className="text-slate-400 text-xs mt-1">Check that employees have reporting_to set correctly in the Employees page.</p>
        </div>
      )}

      {!loading && needsReviewCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          <strong>{needsReviewCount} team member{needsReviewCount !== 1 ? 's' : ''}</strong> have submitted targets awaiting your review.
        </div>
      )}

      {reportees.map(r => (
        <ReporteeCard key={r.id} reportee={r} onReview={onReview} />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeamTargetsPage() {
  const { employee } = useAuthStore();
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [cycle, setCycle] = useState(null);
  const [orgSettings, setOrgSettings] = useState(null);
  const [myApprovedCount, setMyApprovedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isHrAdmin = ['admin', 'hr'].includes(employee?.role);
  const effectiveCascade = cycle?.cascade_mode || orgSettings?.cascade_mode || 'top_down';

  useEffect(() => {
    async function init() {
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
          const ownTargets = await getTargets({ cycle_id: activeCycle.id });
          setMyApprovedCount(ownTargets.filter(t => t.status === 'approved').length);
        }
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  function handleReview(empId) {
    navigate(`/team-targets/${empId}`);
  }

  function handleBack() {
    navigate('/team-targets');
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-5">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Team Targets</h1>
            <p className="text-slate-500 text-sm mt-1">
              {cycle
                ? `${cycle.name} · ${effectiveCascade.replace('_', '-')} cascade · Review and approve your team's targets`
                : 'Review and approve your direct reportees\' targets'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading && (
          <div className="text-sm text-slate-400 py-16 text-center">Loading…</div>
        )}

        {!loading && !cycle && (
          <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
            <p className="text-slate-400 text-sm">No active review cycle.</p>
            <p className="text-slate-400 text-xs mt-1">Ask your HR admin to open a goal-setting cycle.</p>
          </div>
        )}

        {!loading && cycle && (
          <>
            {/* V9 status — manager's own approval state */}
            <V9StatusBar myApprovedCount={myApprovedCount} isHrAdmin={isHrAdmin} />

            {/* Cascade mode hint */}
            {!employeeId && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600">
                {effectiveCascade === 'top_down' && (
                  <><strong>Top-Down mode:</strong> Targets were submitted by your team after your own targets were approved. Review each submission for alignment to your targets.</>
                )}
                {effectiveCascade === 'bottom_up' && (
                  <><strong>Bottom-Up mode:</strong> Your team proposed their own targets. Link each proposal to one of your targets, then approve.</>
                )}
                {effectiveCascade === 'bidirectional' && (
                  <><strong>Bidirectional mode:</strong> Your team has both assigned and proposed targets. Proposed targets need linking before approval.</>
                )}
              </div>
            )}

            {/* Conditional view: list or detail */}
            {!employeeId ? (
              <TeamView cycle={cycle} onReview={handleReview} />
            ) : (
              <ReporteeView
                employeeId={parseInt(employeeId)}
                cycle={cycle}
                myApprovedCount={myApprovedCount}
                isHrAdmin={isHrAdmin}
                onBack={handleBack}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
