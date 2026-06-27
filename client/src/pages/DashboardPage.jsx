import { useAuthStore } from '../store/authStore';
import AppLayout from '../components/layout/AppLayout';

export default function DashboardPage() {
  const { employee } = useAuthStore();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {employee?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {employee?.org_name} · {employee?.grade_label || employee?.role}
          </p>
          <p className="text-xs text-slate-400 italic mt-1">Performance management for humans, not HR consultants</p>
        </div>

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

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-2">Quick Actions</h2>
          <p className="text-sm text-slate-500">
            Phases 4–9 will populate this dashboard with your performance data, pending approvals, and cycle status.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
