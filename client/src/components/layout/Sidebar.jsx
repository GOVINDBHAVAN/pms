import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { label: 'Dashboard',       to: '/dashboard',          roles: ['admin','hr','manager','employee'] },
  { label: 'My Targets',      to: '/my-targets',         roles: ['admin','hr','employee','manager'] },
  { label: 'Team Targets',    to: '/team-targets',       roles: ['manager','admin','hr'] },
  { label: 'Self Appraisal',  to: '/appraisal/self',     roles: ['employee','manager'] },
  { label: 'Team Appraisal',  to: '/appraisal/team',     roles: ['manager','admin','hr'] },
  { label: 'Cycles',          to: '/cycles',             roles: ['admin','hr'] },
  { label: 'Reports',         to: '/reports',            roles: ['admin','hr','manager'] },
  { label: 'Calibration',     to: '/calibration',        roles: ['admin','hr'] },
  { label: 'Employees',       to: '/org/employees',      roles: ['admin','hr'] },
  { label: 'Org Settings',    to: '/org/settings',       roles: ['admin'] },
];

export default function Sidebar() {
  const { employee, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = employee?.role || 'employee';

  const visible = NAV.filter(n => n.roles.includes(role));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0">
      {/* Org name */}
      <div className="px-4 py-4 border-b border-slate-700">
        <div className="text-xs text-slate-400 uppercase tracking-wide">Organization</div>
        <div className="font-semibold text-sm mt-0.5 truncate">{employee?.org_name || 'PMS'}</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {visible.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-700 px-4 py-3">
        <div className="text-xs text-slate-400 truncate">{employee?.name}</div>
        <div className="text-xs text-slate-500 capitalize">{role}</div>
        <button
          onClick={handleLogout}
          className="mt-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
