import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuthStore } from '../store/authStore';
import { getPendingCheckins, getRollup } from '../api/checkinsApi';

const FRAMEWORK_ICONS = {
  okr_kr:     '🔑',
  kpi:        '📊',
  goal:       '✅',
  competency: '⭐',
  bsc_metric: '📐',
};

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN');
}

function CheckinBanner({ pending, cycle, onViewAll }) {
  if (!pending?.length) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-500 text-xl mt-0.5">⏰</span>
          <div>
            <p className="font-semibold text-amber-900 text-sm">
              {pending.length} target{pending.length !== 1 ? 's' : ''} need{pending.length === 1 ? 's' : ''} a check-in
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              No progress update recorded in the last 31 days for {cycle?.name}.
            </p>
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="flex-shrink-0 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700"
        >
          Update Now
        </button>
      </div>

      <div className="mt-3 space-y-1">
        {pending.slice(0, 4).map(t => (
          <div key={t.id} className="flex items-center gap-2 text-xs text-amber-800">
            <span>{FRAMEWORK_ICONS[t.framework_type] || '📋'}</span>
            <span className="truncate">{t.title}</span>
            {t.planned_target != null && (
              <span className="ml-auto text-amber-600 font-medium flex-shrink-0">
                Target: {fmt(t.planned_target)} {t.unit || ''}
              </span>
            )}
          </div>
        ))}
        {pending.length > 4 && (
          <p className="text-xs text-amber-600">+ {pending.length - 4} more targets</p>
        )}
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  on_track:  { dot: 'bg-emerald-500', label: 'On Track',  bg: 'bg-emerald-50 text-emerald-700'  },
  at_risk:   { dot: 'bg-amber-400',   label: 'At Risk',   bg: 'bg-amber-50 text-amber-700'    },
  blocked:   { dot: 'bg-red-500',     label: 'Blocked',   bg: 'bg-red-50 text-red-700'        },
  completed: { dot: 'bg-blue-500',    label: 'Completed', bg: 'bg-blue-50 text-blue-700'      },
};

function daysSince(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function TeamRollup({ rollup }) {
  const { employees } = rollup;
  if (!employees?.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-2">Team Check-in Status</h2>
        <p className="text-sm text-slate-400">No reportees found in the current cycle.</p>
      </div>
    );
  }

  // Group by depth for the hierarchy view
  const byDepth = {};
  for (const emp of employees) {
    const d = emp.depth ?? 0;
    if (!byDepth[d]) byDepth[d] = [];
    byDepth[d].push(emp);
  }
  const depths = Object.keys(byDepth).map(Number).sort();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">Team Check-in Status</h2>
        <span className="text-xs text-slate-400">{employees.length} people across {depths.length} level{depths.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {depths.map(depth => (
          <div key={depth}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
              {depth === 0 ? 'Direct Reports' : `Level +${depth}`}
            </p>
            <div className="space-y-2">
              {byDepth[depth].map(emp => {
                const sc = emp.latest_status ? STATUS_COLORS[emp.latest_status] : null;
                const daysAgo = daysSince(emp.last_checkin_at);
                return (
                  <div
                    key={emp.id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sc ? sc.dot : 'bg-slate-200'}`} />

                    {/* Employee info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{emp.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {emp.grade_label || ''}{emp.dept_name ? ` · ${emp.dept_name}` : ''}
                      </p>
                    </div>

                    {/* Status pill */}
                    {sc && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${sc.bg}`}>
                        {sc.label}
                      </span>
                    )}
                    {!sc && emp.active_targets > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500 flex-shrink-0">
                        No check-in
                      </span>
                    )}

                    {/* At-risk indicators */}
                    {emp.at_risk_count > 0 && (
                      <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded flex-shrink-0">
                        {emp.at_risk_count} at risk
                      </span>
                    )}
                    {emp.blocked_count > 0 && (
                      <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded flex-shrink-0">
                        {emp.blocked_count} blocked
                      </span>
                    )}

                    {/* Last check-in */}
                    <span className="text-[10px] text-slate-300 flex-shrink-0 hidden sm:block">
                      {daysAgo == null
                        ? '—'
                        : daysAgo === 0
                          ? 'Today'
                          : `${daysAgo}d ago`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { employee } = useAuthStore();
  const navigate = useNavigate();

  const [checkinData, setCheckinData] = useState(null);
  const [rollup, setRollup] = useState(null);

  const isManager = ['admin', 'hr', 'manager'].includes(employee?.role);

  useEffect(() => {
    getPendingCheckins()
      .then(setCheckinData)
      .catch(() => {});

    if (isManager) {
      getRollup()
        .then(setRollup)
        .catch(() => {});
    }
  }, [isManager]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {employee?.name?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 mt-1">
            {employee?.org_name} · {employee?.grade_label || employee?.role}
          </p>
          <p className="text-xs text-slate-400 italic mt-1">
            Performance management for humans, not HR consultants
          </p>
        </div>

        {/* Pending check-in alert */}
        {checkinData?.pending?.length > 0 && (
          <CheckinBanner
            pending={checkinData.pending}
            cycle={checkinData.cycle}
            onViewAll={() => navigate('/my-targets')}
          />
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Role</div>
            <div className="text-2xl font-semibold text-slate-900 mt-1 capitalize">{employee?.role}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Department</div>
            <div className="text-2xl font-semibold text-slate-900 mt-1">{employee?.dept_name || '—'}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wide">Grade</div>
            <div className="text-2xl font-semibold text-slate-900 mt-1">{employee?.grade_code || '—'}</div>
          </div>
        </div>

        {/* Targets check-in summary */}
        {checkinData && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">My Targets Progress</h2>
              {checkinData.cycle && (
                <span className="text-xs text-slate-400">{checkinData.cycle.name}</span>
              )}
            </div>
            {!checkinData.all_targets?.length ? (
              <p className="text-sm text-slate-400">
                {checkinData.cycle
                  ? 'No approved targets yet for this cycle.'
                  : 'No active cycle with check-ins enabled.'}
              </p>
            ) : (
              <div className="space-y-2">
                {checkinData.all_targets.map(t => {
                  const hasPending = checkinData.pending?.some(p => p.id === t.id);
                  const progress = t.actual_value != null && t.planned_target != null
                    ? Math.round((t.actual_value / t.planned_target) * 100)
                    : null;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
                    >
                      <span className="text-base flex-shrink-0">{FRAMEWORK_ICONS[t.framework_type] || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{t.title}</p>
                        {t.planned_target != null && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${progress != null && progress >= 100 ? 'bg-emerald-400' : progress != null && progress >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${progress != null ? Math.min(progress, 100) : 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {t.actual_value != null
                                ? `${fmt(t.actual_value)} / ${fmt(t.planned_target)} ${t.unit || ''}`
                                : `Target: ${fmt(t.planned_target)} ${t.unit || ''}`}
                            </span>
                          </div>
                        )}
                      </div>
                      {hasPending && (
                        <span className="flex-shrink-0 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                          Update due
                        </span>
                      )}
                      {t.checkin_count > 0 && !hasPending && (
                        <span className="flex-shrink-0 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {t.checkin_count} check-in{t.checkin_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() => navigate('/my-targets')}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  Go to My Targets →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Team check-in rollup — managers, HODs, VPs, HR */}
        {isManager && rollup && (
          <TeamRollup rollup={rollup} />
        )}
        {isManager && !rollup && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Team Check-in Status</h2>
            <p className="text-sm text-slate-400">Loading team data…</p>
          </div>
        )}

        {/* Placeholder for future phases */}
        {!checkinData && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Quick Actions</h2>
            <p className="text-sm text-slate-500">
              Loading your performance data…
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
