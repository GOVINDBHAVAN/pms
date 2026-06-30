import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuthStore } from '../store/authStore';
import {
  getTargets, getManagerView, getOrgTree,
  approveTarget as apiApprove,
  rejectTarget as apiReject,
  linkTarget as apiLink,
} from '../api/targetsApi';
import { getCycles } from '../api/cyclesApi';
import { getOrgSettings } from '../api/orgApi';
import { FRAMEWORK_TYPE_META as FW_META, FRAMEWORK_TYPE_ORDER } from '../utils/constants';

// ── Constants ─────────────────────────────────────────────────────────────────

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
function TargetApprovalCard({ target, myApprovedCount, isHrAdmin, onApprove, onReject, onLink, cycleStatus, readOnly = false }) {
  const canAct = cycleStatus === 'goal_setting' && !readOnly;
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
        <div className="flex flex-col gap-2 pt-1">
          {/* Two-step explanation for bottom-up proposed targets */}
          {target.status === 'proposed' && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2.5 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  STEP 1 OF 2
                </span>
                <span className="font-semibold text-teal-800">Link this proposal to your target</span>
              </div>
              <p className="text-teal-700 leading-snug">
                This is a <strong>bottom-up proposal</strong> — the employee set this target independently.
                You must connect it to one of your approved targets to establish the cascade chain.
                An <strong>Approve button</strong> will appear after you link it.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
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
            {target.status === 'linked' && (
              <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded">
                Step 2 of 2: approve or reject
              </span>
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
// ── Team Coverage Widget ──────────────────────────────────────────────────────
// Shows manager's numeric targets vs sum of team proposals — the cascade math.
function TeamCoverageWidget({ myApprovedTargets, allReportees, currentEmployeeId, cycle }) {
  const NUMERIC_TYPES = ['kpi', 'goal', 'okr_kr', 'bsc_metric'];

  const coverageItems = myApprovedTargets
    .filter(t => NUMERIC_TYPES.includes(t.framework_type) && t.planned_target != null)
    .map(managerTarget => {
      const contributions = allReportees.map(r => {
        const matching = (r.targets || []).filter(t =>
          t.framework_type === managerTarget.framework_type &&
          t.parent_target_id === managerTarget.id &&
          t.planned_target != null &&
          !['rejected', 'deleted'].includes(t.status)
        );
        const sum = matching.reduce((s, t) => s + (parseFloat(t.planned_target) || 0), 0);
        return { id: r.id, name: r.name, sum, isCurrent: r.id === currentEmployeeId };
      }).filter(c => c.sum > 0);

      const teamTotal = contributions.reduce((s, c) => s + c.sum, 0);
      const gap = parseFloat(managerTarget.planned_target) - teamTotal;
      const pct = managerTarget.planned_target > 0
        ? Math.round((teamTotal / managerTarget.planned_target) * 100) : 0;

      return { managerTarget, contributions, teamTotal, gap, pct };
    })
    .filter(item => item.contributions.length > 0);

  if (!coverageItems.length) return null;

  function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  const cycleRange = cycle?.period_start && cycle?.period_end
    ? `${fmtDate(cycle.period_start)} – ${fmtDate(cycle.period_end)}`
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Widget header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700">Cascade Coverage</span>
          <span className="text-xs text-slate-400">— team commitment vs your target</span>
        </div>
        {cycleRange && (
          <span className="text-[11px] text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap">
            {cycle.name} · {cycleRange}
          </span>
        )}
      </div>

      {/* Group items by framework type */}
      {(() => {
        const groups = {};
        for (const item of coverageItems) {
          const t = item.managerTarget.framework_type;
          if (!groups[t]) groups[t] = [];
          groups[t].push(item);
        }
        const sortedTypes = Object.keys(groups).sort(
          (a, b) => (FRAMEWORK_TYPE_ORDER.indexOf(a) + 1 || 99) - (FRAMEWORK_TYPE_ORDER.indexOf(b) + 1 || 99)
        );

        return sortedTypes.map((type, groupIdx) => {
          const items = groups[type];
          const groupMeta = FW_META[type] || { label: type, color: 'bg-slate-100 text-slate-600' };
          const shortCount = items.filter(i => i.gap > 0).length;
          const overCount  = items.filter(i => i.gap < 0).length;

          return (
            <div key={type} className={groupIdx > 0 ? 'border-t-2 border-slate-200' : ''}>

              {/* ── Group header ── */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${groupMeta.color}`}>
                  {groupMeta.label}
                </span>
                <span className="text-xs text-slate-400">
                  {items.length} target{items.length !== 1 ? 's' : ''}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  {shortCount > 0 && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      ⚠ {shortCount} short
                    </span>
                  )}
                  {overCount > 0 && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      ↑ {overCount} over
                    </span>
                  )}
                  {shortCount === 0 && overCount === 0 && (
                    <span className="text-[10px] font-semibold text-emerald-600">✓ All covered</span>
                  )}
                </div>
              </div>

              {/* ── Items ── */}
              {items.map(({ managerTarget, contributions, teamTotal, gap, pct }, idx) => {
                const isHigherBetter = (managerTarget.measurement_type || 'higher_better') === 'higher_better';
                const unit = managerTarget.unit || '';
                const managerPlan = parseFloat(managerTarget.planned_target);
                const isShort = gap > 0;
                const isOver  = gap < 0;

                return (
                  <div
                    key={managerTarget.id}
                    className={`p-4 space-y-3 ${idx < items.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    {/* Item header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Number + direction + unit badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0 ${groupMeta.color}`}>
                            {idx + 1}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isHigherBetter ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {isHigherBetter ? '↑ Higher is better' : '↓ Lower is better'}
                          </span>
                          {unit && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              unit: {unit}
                            </span>
                          )}
                        </div>
                        {/* Title */}
                        <p className="text-sm font-semibold text-slate-800 leading-snug">
                          {managerTarget.title.replace(/— L[0-9]\.[0-9] Team.*$/, '').trim()}
                        </p>
                      </div>

                      {/* Target context box */}
                      <div className="flex-shrink-0 w-56 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden text-xs">
                        {managerTarget.company_target != null && (() => {
                          const orgVal = parseFloat(managerTarget.company_target);
                          const delta = managerPlan - orgVal;
                          const deltaPct = orgVal > 0 ? Math.abs(Math.round((delta / orgVal) * 100)) : 0;
                          return (
                            <>
                              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                                <span className="flex items-center gap-1 text-slate-500 font-medium">
                                  Org. allocated
                                  <InfoIcon
                                    title="Org. Allocated Target"
                                    body="The target amount cascaded down to your team from the organisation above — set by your manager or senior leadership. This is what management expects your team to collectively deliver this cycle. It is NOT the company's total target; it is the specific share assigned to your level."
                                  />
                                </span>
                                <span className="font-semibold text-slate-700 tabular-nums">
                                  {Number(orgVal).toLocaleString('en-IN')}{unit ? ` ${unit}` : ''}
                                </span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                                <span className="flex items-center gap-1 text-slate-500 font-medium">
                                  Your commitment
                                  <InfoIcon
                                    title="Your Commitment"
                                    body="The target you personally committed to in your approved plan. Your team's contributions are compared against this figure — not against the org. allocation. If you committed less than the allocation, your team must still cover your commitment; the gap to allocation is your responsibility to flag upward."
                                  />
                                </span>
                                <span className="font-bold text-slate-900 tabular-nums">
                                  {Number(managerPlan).toLocaleString('en-IN')}{unit ? ` ${unit}` : ''}
                                </span>
                              </div>
                              <div className={`px-3 py-1.5 text-[10px] font-semibold text-center ${
                                Math.abs(delta) < 0.01 ? 'bg-emerald-50 text-emerald-700'
                                  : delta > 0 ? 'bg-orange-50 text-orange-700'
                                  : 'bg-red-50 text-red-700'
                              }`}>
                                {Math.abs(delta) < 0.01
                                  ? '✓ Commitment matches org. allocation'
                                  : delta > 0
                                  ? `↑ Over-committed by ${Number(delta).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''} (+${deltaPct}%)`
                                  : `↓ Under-committed by ${Number(Math.abs(delta)).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''} (−${deltaPct}%)`
                                }
                              </div>
                            </>
                          );
                        })()}
                        {managerTarget.company_target == null && (
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="flex items-center gap-1 text-slate-500 font-medium">
                              Your commitment
                              <InfoIcon
                                title="Your Commitment"
                                body="The target you personally committed to in your approved plan. Your team's contributions are compared against this figure."
                              />
                            </span>
                            <span className="font-bold text-slate-900 tabular-nums">
                              {Number(managerPlan).toLocaleString('en-IN')}{unit ? ` ${unit}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500">
                          Team total: <strong>{Number(teamTotal).toLocaleString('en-IN')}{unit ? ` ${unit}` : ''}</strong>
                        </span>
                        <span className={`text-xs font-bold ${
                          pct >= 100 ? 'text-emerald-600' : pct >= 70 ? 'text-blue-600' : 'text-amber-600'
                        }`}>
                          {pct}% covered
                        </span>
                      </div>
                    </div>

                    {/* Per-person breakdown */}
                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                      <div className="bg-slate-50 px-3 py-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Per-person breakdown
                        </span>
                      </div>
                      {contributions.map(c => {
                        const sharePct = managerPlan > 0 ? Math.round((c.sum / managerPlan) * 100) : 0;
                        return (
                          <div key={c.id} className={`px-3 py-2.5 border-t border-slate-100 ${c.isCurrent ? 'bg-blue-50' : 'bg-white'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs ${c.isCurrent ? 'font-semibold text-blue-800' : 'text-slate-700'}`}>
                                {c.name}
                                {c.isCurrent && <span className="ml-1.5 text-[10px] text-blue-500 font-normal">(viewing)</span>}
                              </span>
                              <span className="text-xs tabular-nums text-right">
                                <strong className="text-slate-800">{Number(c.sum).toLocaleString('en-IN')}</strong>
                                {unit && <span className="text-slate-400"> {unit}</span>}
                                <span className="text-slate-400 ml-1">· {sharePct}%</span>
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${c.isCurrent ? 'bg-blue-400' : 'bg-slate-400'}`}
                                style={{ width: `${Math.min(sharePct, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-600">Team Total</span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">
                          {Number(teamTotal).toLocaleString('en-IN')}{unit ? ` ${unit}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Gap callout */}
                    {isShort && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                        <span className="font-bold mt-0.5">⚠</span>
                        <span>
                          Short by <strong>{Number(gap).toLocaleString('en-IN')}{unit ? ` ${unit}` : ''}</strong> ({100 - pct}% uncovered) —
                          reject and push for higher commitments, or cover the gap yourself.
                        </span>
                      </div>
                    )}
                    {isOver && (
                      <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800">
                        <span className="font-bold mt-0.5">↑</span>
                        <span>
                          Over-committed by <strong>{Number(Math.abs(gap)).toLocaleString('en-IN')}{unit ? ` ${unit}` : ''}</strong> —
                          team exceeds your target by {Math.abs(pct - 100)}%.
                        </span>
                      </div>
                    )}
                    {gap === 0 && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                        <span>✓</span>
                        <span>Team commitment exactly matches your target — cascade fully covered.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        });
      })()}
    </div>
  );
}

// ── Reportee Detail View ──────────────────────────────────────────────────────
function ReporteeView({ employeeId, cycle, myApprovedCount, isHrAdmin, onBack, readOnly = false }) {
  const [reportee, setReportee] = useState(null);
  const [targets, setTargets] = useState([]);
  const [myTargets, setMyTargets] = useState([]);
  const [allReportees, setAllReportees] = useState([]);
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
      setAllReportees(managerView);
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
          ← Overview
        </button>
        <span className="text-slate-300">/</span>
        {reportee && (
          <div>
            <span className="font-semibold text-slate-800">{reportee.name}</span>
            {reportee.grade_code && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                {reportee.grade_code}
              </span>
            )}
            {reportee.grade && <span className="text-xs text-slate-500 ml-1">{reportee.grade}</span>}
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

      {/* Cascade coverage — shows team total vs manager's own target */}
      {!loading && myTargets.length > 0 && allReportees.length > 0 && (
        <TeamCoverageWidget
          myApprovedTargets={myTargets}
          allReportees={allReportees}
          currentEmployeeId={parseInt(employeeId)}
          cycle={cycle}
        />
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
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Modals — suppressed in read-only mode */}
      {!readOnly && approveTarget && (
        <ApproveModal
          target={approveTarget}
          onConfirm={payload => handleApprove(approveTarget, payload)}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {!readOnly && rejectTarget && (
        <RejectModal
          target={rejectTarget}
          onConfirm={note => handleReject(rejectTarget, note)}
          onClose={() => setRejectTarget(null)}
        />
      )}
      {!readOnly && linkTarget && (
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

// ── Per-reportee computed metrics ─────────────────────────────────────────────
function computeReporteeMetrics(reportee) {
  const targets = reportee.targets || [];
  const active = targets.filter(t => !['rejected', 'deleted'].includes(t.status));
  const weightSum = active.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);
  const weightOk = active.length === 0 || Math.abs(weightSum - 100) <= 0.5;
  const overPlannedCount = active.filter(t =>
    t.is_over_planned === 1 && ['submitted', 'proposed', 'linked'].includes(t.status)
  ).length;
  const unlinkedCount = active.filter(t =>
    !t.parent_target_id && t.framework_type !== 'competency' &&
    ['submitted', 'proposed'].includes(t.status)
  ).length;
  return { weightSum, weightOk, overPlannedCount, unlinkedCount };
}

// ── Team Health Panel ─────────────────────────────────────────────────────────
function TeamHealthPanel({ reportees }) {
  if (!reportees.length) return null;

  const total = reportees.length;
  const allApproved = reportees.filter(r => {
    const t = r.targets?.length || 0;
    return t > 0 && r.approvedCount === t;
  }).length;
  const hasSubmitted = reportees.filter(r => r.submittedCount > 0).length;
  const notStarted = reportees.filter(r => (r.targets?.length || 0) === 0).length;
  const approvalPct = total > 0 ? Math.round((allApproved / total) * 100) : 0;

  let totalOverPlanned = 0;
  let totalUnlinked = 0;
  let weightIssues = 0;
  for (const r of reportees) {
    const m = computeReporteeMetrics(r);
    totalOverPlanned += m.overPlannedCount;
    totalUnlinked += m.unlinkedCount;
    if ((r.targets?.length || 0) > 0 && !m.weightOk) weightIssues++;
  }

  const stats = [
    {
      label: 'Fully Approved',
      value: `${allApproved}/${total}`,
      sub: allApproved === total ? 'Team ready' : `${approvalPct}% done`,
      ok: allApproved === total && total > 0,
      urgent: false,
    },
    {
      label: 'Awaiting Review',
      value: hasSubmitted,
      sub: hasSubmitted === 0 ? 'Nothing pending' : `member${hasSubmitted !== 1 ? 's' : ''} to action`,
      ok: hasSubmitted === 0,
      urgent: hasSubmitted > 0,
    },
    {
      label: 'Over-Planned',
      value: totalOverPlanned,
      sub: totalOverPlanned === 0 ? 'None flagged' : 'need acknowledgment',
      ok: totalOverPlanned === 0,
      urgent: totalOverPlanned > 0,
    },
    {
      label: 'Unlinked',
      value: totalUnlinked,
      sub: totalUnlinked === 0 ? 'All linked' : 'blocking cycle advance',
      ok: totalUnlinked === 0,
      urgent: totalUnlinked > 0,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Readiness</span>
        <span className="text-xs text-slate-400">{total} direct report{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">{allApproved} of {total} members fully approved</span>
          <span className={`text-xs font-semibold ${allApproved === total && total > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {approvalPct}%
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allApproved === total && total > 0 ? 'bg-emerald-500' : 'bg-blue-500'}`}
            style={{ width: `${approvalPct}%` }}
          />
        </div>
      </div>

      {/* 4-stat grid */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map(s => (
          <div
            key={s.label}
            className={`rounded-lg px-3 py-2.5 text-center ${
              s.urgent ? 'bg-amber-50 border border-amber-200' :
              s.ok ? 'bg-emerald-50 border border-emerald-100' :
              'bg-slate-50 border border-slate-100'
            }`}
          >
            <p className={`text-xl font-bold tabular-nums leading-none ${
              s.urgent ? 'text-amber-700' :
              s.ok ? 'text-emerald-700' :
              'text-slate-400'
            }`}>
              {s.value}
            </p>
            <p className={`text-[10px] font-semibold uppercase tracking-wide mt-1 ${
              s.urgent ? 'text-amber-600' :
              s.ok ? 'text-emerald-600' :
              'text-slate-400'
            }`}>{s.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Secondary alerts */}
      {weightIssues > 0 && (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-800">
          <span className="font-bold">⚠</span>
          <span>
            <strong>{weightIssues} member{weightIssues !== 1 ? 's' : ''}</strong> have targets whose weights don't sum to 100% — check before approving.
          </span>
        </div>
      )}
      {notStarted > 0 && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
          <span>○</span>
          <span>
            <strong>{notStarted} member{notStarted !== 1 ? 's' : ''}</strong> have not submitted any targets yet.
          </span>
        </div>
      )}
    </div>
  );
}

// ── Reportee Card (team list view) ────────────────────────────────────────────
function ReporteeCard({ reportee, selected, onReview }) {
  const total = reportee.targets?.length || 0;
  const submitted = reportee.submittedCount || 0;
  const approved = reportee.approvedCount || 0;
  const draft = total - submitted - approved;

  const { weightSum, weightOk, overPlannedCount, unlinkedCount } = computeReporteeMetrics(reportee);

  const status = total === 0 ? 'none'
    : approved === total ? 'all_approved'
    : submitted > 0 ? 'needs_review'
    : 'draft_only';

  const statusInfo = {
    none:         { label: 'No targets yet',    color: 'text-slate-400',   dot: 'bg-slate-300' },
    all_approved: { label: 'All approved',      color: 'text-emerald-600', dot: 'bg-emerald-500' },
    needs_review: { label: 'Needs review',      color: 'text-yellow-700',  dot: 'bg-yellow-500' },
    draft_only:   { label: 'Not submitted yet', color: 'text-slate-500',   dot: 'bg-slate-400' },
  }[status];

  return (
    <div
      onClick={() => onReview(reportee.id)}
      className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all ${
        selected
          ? 'border-blue-400 bg-blue-50 shadow-sm ring-1 ring-blue-300'
          : 'border-slate-200 bg-white hover:shadow-sm hover:border-slate-300'
      }`}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
        selected ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'
      }`}>
        {reportee.name?.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">{reportee.name}</p>
        {/* Grade badge + designation + department */}
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {reportee.grade_code && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 flex-shrink-0">
              {reportee.grade_code}
            </span>
          )}
          {reportee.grade && (
            <span className="text-xs text-slate-600 font-medium truncate">{reportee.grade}</span>
          )}
        </div>
        {reportee.dept && (
          <p className="text-[11px] text-slate-400 mt-0.5">{reportee.dept}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.dot}`} />
          <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          {total > 0 && (
            <span className="text-xs text-slate-400">
              · {approved} approved, {submitted} awaiting, {draft} draft
            </span>
          )}
        </div>
        {/* Per-person health flags */}
        {total > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              weightOk ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-100 text-orange-700'
            }`}>
              ∑ {weightSum.toFixed(0)}%{weightOk ? ' ✓' : ' ≠ 100'}
            </span>
            {overPlannedCount > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                ⚠ {overPlannedCount} over-planned
              </span>
            )}
            {unlinkedCount > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                ○ {unlinkedCount} unlinked
              </span>
            )}
          </div>
        )}
      </div>

      {/* Status indicator / action */}
      <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${
        selected
          ? 'bg-blue-600 text-white'
          : status === 'needs_review'
          ? 'bg-yellow-500 text-white'
          : status === 'all_approved'
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}>
        {selected ? 'Viewing' : status === 'needs_review' ? 'Review →' : 'View →'}
      </div>
    </div>
  );
}

// ── Org Drilldown: Tree Node ──────────────────────────────────────────────────
const TYPE_GROUPS = [
  { key: 'okr',  label: 'OKR',     approvedKey: 'okr_approved',  pendingKey: 'okr_pending',  dot: 'bg-purple-400' },
  { key: 'kpi',  label: 'KRA/KPI', approvedKey: 'kpi_approved',  pendingKey: 'kpi_pending',  dot: 'bg-blue-400' },
  { key: 'goal', label: 'Goals',   approvedKey: 'goal_approved', pendingKey: 'goal_pending', dot: 'bg-green-400' },
  { key: 'comp', label: 'Comp',    approvedKey: 'comp_approved', pendingKey: 'comp_pending', dot: 'bg-orange-400' },
  { key: 'bsc',  label: 'BSC',     approvedKey: 'bsc_approved',  pendingKey: 'bsc_pending',  dot: 'bg-teal-400' },
];

function OrgTreeNode({ node, directReporteeIds, contribution, onViewEmployee }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;
  const isDirect = directReporteeIds.includes(node.id);

  const allApproved = node.total > 0 && node.approved === node.total;
  const hasPending = (node.submitted + node.proposed) > 0;
  const noTargets = node.total === 0;

  const activeGroups = TYPE_GROUPS.filter(g => (node[g.approvedKey] || 0) + (node[g.pendingKey] || 0) > 0);

  return (
    <div className={`border rounded-xl overflow-hidden ${
      noTargets ? 'border-slate-200' : allApproved ? 'border-emerald-200' : hasPending ? 'border-yellow-200' : 'border-slate-200'
    }`}>
      <div className={`p-3 ${
        noTargets ? 'bg-white' : allApproved ? 'bg-emerald-50/30' : hasPending ? 'bg-yellow-50/30' : 'bg-white'
      }`}>
        <div className="flex items-start gap-3">
          {/* Expand toggle */}
          <button
            onClick={() => hasChildren && setExpanded(!expanded)}
            className={`mt-0.5 w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold flex-shrink-0 ${
              hasChildren
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer'
                : 'text-slate-200 cursor-default'
            }`}
          >
            {hasChildren ? (expanded ? '▼' : '▶') : '·'}
          </button>

          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
            isDirect ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {node.name?.charAt(0).toUpperCase()}
          </div>

          {/* Info block */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Name + grade + chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-800 text-sm">{node.name}</span>
              {node.grade_code && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                  {node.grade_code}
                </span>
              )}
              {isDirect && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                  Direct
                </span>
              )}
              {hasChildren && (
                <span className="text-[10px] text-slate-400">
                  · {node.children.length} report{node.children.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {node.dept && <p className="text-[11px] text-slate-400">{node.dept}</p>}

            {/* Framework-type breakdown chips */}
            {noTargets ? (
              <span className="text-[10px] text-slate-400 italic">No targets submitted yet</span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeGroups.map(g => {
                  const a = node[g.approvedKey] || 0;
                  const p = node[g.pendingKey] || 0;
                  const allOk = a > 0 && p === 0;
                  return (
                    <span
                      key={g.key}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        allOk ? 'bg-emerald-100 text-emerald-700'
                              : p > 0 ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${g.dot}`} />
                      {g.label}
                      {a > 0 && <span className="ml-0.5">{a}✓</span>}
                      {p > 0 && <span className={a > 0 ? 'ml-0.5' : ''}>{p}●</span>}
                    </span>
                  );
                })}
                {node.rejected > 0 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600">
                    {node.rejected} rejected
                  </span>
                )}
              </div>
            )}

            {/* Contribution bars (only for direct reportees of current user) */}
            {contribution && contribution.length > 0 && (
              <div className="mt-1 space-y-1 pt-1 border-t border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Contribution to your targets</p>
                {contribution.slice(0, 3).map(item => (
                  <div key={item.title} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 truncate" style={{ minWidth: '90px', maxWidth: '140px' }}>
                      {item.title.length > 22 ? item.title.slice(0, 22) + '…' : item.title}
                    </span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.pct >= 100 ? 'bg-emerald-500' : item.pct >= 70 ? 'bg-blue-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${Math.min(item.pct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums w-8 text-right ${
                      item.pct >= 100 ? 'text-emerald-600' : item.pct >= 70 ? 'text-blue-600' : 'text-amber-600'
                    }`}>{item.pct}%</span>
                  </div>
                ))}
                {contribution.length > 3 && (
                  <p className="text-[10px] text-slate-400">+{contribution.length - 3} more targets</p>
                )}
              </div>
            )}
          </div>

          {/* Review / View button */}
          <button
            onClick={() => onViewEmployee(node.id)}
            className={`flex-shrink-0 mt-0.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isDirect
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isDirect ? 'Review →' : 'View →'}
          </button>
        </div>
      </div>

      {/* Expanded children */}
      {expanded && hasChildren && (
        <div className="border-t border-slate-100 pl-7 pr-3 py-2 space-y-2 bg-slate-50/30">
          {node.children.map(child => (
            <OrgTreeNode
              key={child.id}
              node={child}
              directReporteeIds={directReporteeIds}
              contribution={null}
              onViewEmployee={onViewEmployee}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Org Drilldown Tab ─────────────────────────────────────────────────────────
const NUMERIC_TARGET_TYPES = ['kpi', 'goal', 'okr_kr', 'bsc_metric'];

function computeContributions(myTargets, reporteeTargets) {
  return myTargets
    .filter(mt => NUMERIC_TARGET_TYPES.includes(mt.framework_type) && mt.planned_target != null)
    .map(mt => {
      const matching = (reporteeTargets || []).filter(t =>
        t.framework_type === mt.framework_type &&
        t.parent_target_id === mt.id &&
        t.planned_target != null &&
        !['rejected', 'deleted'].includes(t.status)
      );
      const sum = matching.reduce((s, t) => s + (parseFloat(t.planned_target) || 0), 0);
      if (sum === 0) return null;
      const pct = parseFloat(mt.planned_target) > 0
        ? Math.round((sum / parseFloat(mt.planned_target)) * 100) : 0;
      return { title: mt.title, sum, pct, unit: mt.unit || '', type: mt.framework_type };
    })
    .filter(Boolean);
}

function OrgDrilldownTab({ cycle, isHrAdmin, myApprovedCount, directReporteeIds, currentUserId, myTargets, reportees }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    if (!cycle?.id || loaded) return;
    setLoaded(true);
    setLoading(true);
    getOrgTree(cycle.id)
      .then(setNodes)
      .catch(e => setError(e?.response?.data?.error || 'Failed to load org tree'))
      .finally(() => setLoading(false));
  }, [cycle?.id, loaded]);

  function buildTree(list, parentId) {
    return list
      .filter(n => n.reporting_to === parentId)
      .map(n => ({ ...n, children: buildTree(list, n.id) }));
  }

  // Pre-compute contribution from each direct reportee into manager's numeric targets
  const contributionByEmployee = {};
  if (myTargets.length > 0) {
    for (const r of reportees) {
      const items = computeContributions(myTargets, r.targets);
      if (items.length > 0) contributionByEmployee[r.id] = items;
    }
  }

  if (selectedNodeId) {
    const isDirectReport = directReporteeIds.includes(selectedNodeId);
    return (
      <ReporteeView
        employeeId={selectedNodeId}
        cycle={cycle}
        myApprovedCount={myApprovedCount}
        isHrAdmin={isHrAdmin}
        onBack={() => setSelectedNodeId(null)}
        readOnly={!isHrAdmin && !isDirectReport}
      />
    );
  }

  const rootNodes = buildTree(nodes, currentUserId);

  const totalPeople = nodes.length;
  const totalApprovedAll = nodes.filter(n => n.total > 0 && n.approved === n.total).length;
  const totalPending = nodes.filter(n => (n.submitted + n.proposed) > 0).length;
  const totalNotStarted = nodes.filter(n => n.total === 0).length;

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 leading-relaxed">
        <strong>Org Drilldown</strong> — full reporting hierarchy, direct and indirect.
        {isHrAdmin
          ? ' As admin/HR you can view and action targets at any level.'
          : ' Approval actions are available only for your direct reportees; all others are read-only.'}
        {' '}Use ▶ to expand any manager node.
      </div>

      {/* Subtree summary strip */}
      {!loading && totalPeople > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'People in subtree', value: totalPeople,      color: 'bg-slate-50 border-slate-200 text-slate-700' },
            { label: 'Fully approved',    value: totalApprovedAll, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { label: 'Pending review',    value: totalPending,     color: totalPending > 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-slate-50 border-slate-200 text-slate-400' },
            { label: 'Not started',       value: totalNotStarted,  color: totalNotStarted > 0 ? 'bg-slate-50 border-slate-300 text-slate-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl px-3 py-2.5 text-center ${s.color}`}>
              <p className="text-xl font-bold tabular-nums leading-none">{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide mt-1 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading && (
        <div className="text-sm text-slate-400 py-12 text-center">Loading org tree…</div>
      )}

      {!loading && rootNodes.length === 0 && !error && (
        <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
          <p className="text-slate-400 text-sm">No subordinates found in the hierarchy.</p>
          <p className="text-slate-400 text-xs mt-1">Check that employees have reporting_to set correctly.</p>
        </div>
      )}

      {!loading && rootNodes.map(node => (
        <OrgTreeNode
          key={node.id}
          node={node}
          directReporteeIds={directReporteeIds}
          contribution={contributionByEmployee[node.id] || null}
          onViewEmployee={setSelectedNodeId}
        />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeamTargetsPage() {
  const { employee } = useAuthStore();
  const { employeeId: urlEmployeeId } = useParams();

  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [orgSettings, setOrgSettings] = useState(null);
  const [myTargets, setMyTargets] = useState([]);
  const [reportees, setReportees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    urlEmployeeId ? parseInt(urlEmployeeId) : null
  );
  const [activeTab, setActiveTab] = useState(urlEmployeeId ? 'team' : 'coverage');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isHrAdmin = ['admin', 'hr'].includes(employee?.role);
  const effectiveCascade = cycle?.cascade_mode || orgSettings?.cascade_mode || 'top_down';
  const myApprovedCount = myTargets.length;

  // Load cycles + org settings on mount
  useEffect(() => {
    async function fetchInitial() {
      setLoading(true);
      setError('');
      try {
        const [allCycles, orgData] = await Promise.all([getCycles(), getOrgSettings()]);
        const sorted = [...allCycles].sort((a, b) =>
          (b.period_start || '').localeCompare(a.period_start || '')
        );
        setCycles(sorted);
        setOrgSettings(orgData);
        const active = sorted.find(c => !['closed', 'draft'].includes(c.status));
        const def = active || sorted[0] || null;
        setCycle(def);
        setSelectedCycleId(def?.id || null);
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchInitial();
  }, []);

  // Fetch team list + own approved targets whenever cycle changes
  useEffect(() => {
    if (!cycle?.id) return;
    async function fetchTeamData() {
      try {
        const [teamData, ownTargets] = await Promise.all([
          getManagerView(cycle.id),
          getTargets({ cycle_id: cycle.id }),
        ]);
        setReportees(teamData);
        setMyTargets(ownTargets.filter(t => t.status === 'approved'));
      } catch (_) {}
    }
    fetchTeamData();
  }, [cycle?.id]);

  // Sync cycle selector to cycle state
  useEffect(() => {
    if (!selectedCycleId || cycles.length === 0) return;
    const selected = cycles.find(c => c.id === selectedCycleId) || null;
    if (!selected || selected?.id === cycle?.id) return;
    setCycle(selected);
    setReportees([]);
    setMyTargets([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCycleId]);

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
                : "Review and approve your direct reportees' targets"}
            </p>
          </div>
        </div>

        {/* Cycle Selector */}
        {cycles.length > 1 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Review Cycle:</span>
            <select
              value={selectedCycleId || ''}
              onChange={e => setSelectedCycleId(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {cycles.map(c => {
                const isActive = !['closed', 'draft'].includes(c.status);
                return (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {isActive ? ' (Current)' : c.status === 'closed' ? ' (Closed)' : ' (Draft)'}
                  </option>
                );
              })}
            </select>
            {cycle?.status === 'closed' && (
              <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                Historical view — read only
              </span>
            )}
          </div>
        )}

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

        {!loading && cycle && (() => {
          const pendingCount = reportees.reduce((s, r) => s + (r.submittedCount || 0), 0);

          function switchTab(tab) {
            setActiveTab(tab);
            setSelectedEmployeeId(null);
          }

          return (
            <>
              <V9StatusBar myApprovedCount={myApprovedCount} isHrAdmin={isHrAdmin} />

              {/* Tab bar */}
              <div className="border-b border-slate-200">
                <div className="flex">
                  {[
                    { key: 'coverage',   label: 'Coverage Overview' },
                    { key: 'readiness',  label: 'Team Readiness' },
                    { key: 'team',       label: 'Direct Reportees' },
                    { key: 'org',        label: 'Org Drilldown' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => switchTab(tab.key)}
                      className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === tab.key
                          ? 'border-blue-600 text-blue-700'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {tab.label}
                      {tab.key === 'team' && pendingCount > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Tab 1: Coverage Overview ── */}
              {activeTab === 'coverage' && (
                <div className="space-y-4">
                  {/* Cascade mode explanation */}
                  {effectiveCascade === 'top_down' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-blue-800">How Top-Down Cascading Works</p>
                      <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside leading-relaxed">
                        <li>You set and get your own targets approved first.</li>
                        <li>Each of your direct reportees then enters their targets, linked to yours.</li>
                        <li>Their targets cannot be submitted until your targets are approved (Rule V9).</li>
                        <li>Coverage below shows how much of your committed target your team has collectively taken on.</li>
                        <li>A shortfall means team members planned less than your total — you must personally cover the gap or push members to revise upward.</li>
                      </ol>
                    </div>
                  )}
                  {effectiveCascade === 'bottom_up' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-blue-800">How Bottom-Up Cascading Works</p>
                      <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside leading-relaxed">
                        <li>Your team members propose their own targets independently — no waiting for yours.</li>
                        <li>You review each proposal in the <strong>Review Team</strong> tab and link it to one of your approved targets.</li>
                        <li>Linking creates the cascade chain; approval locks the commitment.</li>
                        <li>Coverage here aggregates all approved proposals vs your own committed target.</li>
                        <li>Unlinked proposals block the cycle from advancing to Active — all must be linked first.</li>
                      </ol>
                    </div>
                  )}
                  {effectiveCascade === 'bidirectional' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-blue-800">How Bidirectional Cascading Works</p>
                      <ol className="text-xs text-blue-700 space-y-1.5 list-decimal list-inside leading-relaxed">
                        <li>Two tracks run simultaneously: you push targets down (top-down), and your team proposes targets up (bottom-up).</li>
                        <li><strong>Top-down assigned targets</strong> appear on employees automatically once you approve them downward.</li>
                        <li><strong>Bottom-up proposed targets</strong> are entered by employees independently — you link them to your targets in the Review Team tab.</li>
                        <li>An employee can have both kinds. Together they must sum to 100% weight.</li>
                        <li>Coverage shows the combined committed total vs your planned target. A gap here means either no one absorbed that portion top-down, or proposals don't cover it bottom-up.</li>
                        <li>Peer redistribution: if one reportee (e.g. L6.1) plans less, you can reject and ask L6.2 / L6.3 to absorb the difference via over-planning (which requires their justification and your explicit acknowledgement).</li>
                      </ol>
                    </div>
                  )}

                  {/* Coverage widget */}
                  {myTargets.length > 0 && reportees.length > 0 ? (
                    <TeamCoverageWidget
                      myApprovedTargets={myTargets}
                      allReportees={reportees}
                      currentEmployeeId={null}
                      cycle={cycle}
                    />
                  ) : (
                    <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
                      <p className="text-slate-400 text-sm">Coverage will appear once your targets are approved.</p>
                      <p className="text-slate-400 text-xs mt-1">Your approved targets form the baseline; team commitments are compared against them.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 2: Team Readiness ── */}
              {activeTab === 'readiness' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 leading-relaxed">
                    <strong>Team Readiness</strong> shows the goal-setting completion state across your direct reports —
                    how many have submitted, how many are fully approved, and who has issues (unlinked targets, weight
                    mismatches, over-plans needing acknowledgement). Use this to decide who to prioritise in the{' '}
                    <button
                      onClick={() => switchTab('team')}
                      className="text-blue-600 underline underline-offset-2 hover:text-blue-800"
                    >
                      Direct Reportees
                    </button>{' '}
                    tab.
                  </div>
                  {reportees.length > 0 ? (
                    <TeamHealthPanel reportees={reportees} />
                  ) : (
                    <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
                      <p className="text-slate-400 text-sm">No direct reportees assigned yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 3: Direct Reportees ── */}
              {activeTab === 'team' && (
                <div className="space-y-4">
                  {/* Condensed cascade hint for context while reviewing */}
                  {!selectedEmployeeId && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600">
                      {effectiveCascade === 'top_down' && (
                        <><strong>Top-Down mode:</strong> Review each submission for alignment to your approved targets. Reject with a note if the commitment is too low.</>
                      )}
                      {effectiveCascade === 'bottom_up' && (
                        <><strong>Bottom-Up mode:</strong> Link each proposal to one of your targets (Step 1), then approve (Step 2). Unlinked proposals block cycle advancement.</>
                      )}
                      {effectiveCascade === 'bidirectional' && (
                        <><strong>Bidirectional mode:</strong> Employees may have both assigned and proposed targets. Proposed targets need linking before approval. Both must together sum to 100% weight.</>
                      )}
                    </div>
                  )}

                  {!selectedEmployeeId ? (
                    <>
                      {reportees.length === 0 && (
                        <div className="bg-white border border-slate-200 border-dashed rounded-xl py-12 text-center">
                          <p className="text-slate-400 text-sm">No direct reportees assigned.</p>
                          <p className="text-slate-400 text-xs mt-1">Check that employees have reporting_to set correctly in the Employees page.</p>
                        </div>
                      )}
                      {reportees.map(r => (
                        <ReporteeCard
                          key={r.id}
                          reportee={r}
                          selected={false}
                          onReview={setSelectedEmployeeId}
                        />
                      ))}
                    </>
                  ) : (
                    <ReporteeView
                      employeeId={selectedEmployeeId}
                      cycle={cycle}
                      myApprovedCount={myApprovedCount}
                      isHrAdmin={isHrAdmin}
                      onBack={() => setSelectedEmployeeId(null)}
                    />
                  )}
                </div>
              )}

              {/* ── Tab 4: Org Drilldown ── */}
              {activeTab === 'org' && (
                <OrgDrilldownTab
                  cycle={cycle}
                  isHrAdmin={isHrAdmin}
                  myApprovedCount={myApprovedCount}
                  directReporteeIds={reportees.map(r => r.id)}
                  currentUserId={employee.id}
                  myTargets={myTargets}
                  reportees={reportees}
                />
              )}
            </>
          );
        })()}
      </div>
    </AppLayout>
  );
}
