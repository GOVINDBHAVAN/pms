import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getMe } from '../../api/authApi';

export default function PrivateRoute({ children, requireWizardDone = true }) {
  const { token, employee, setEmployee } = useAuthStore();
  const [checking, setChecking] = useState(!employee && !!token);

  useEffect(() => {
    if (token && !employee) {
      getMe()
        .then(setEmployee)
        .catch(() => {}) // token invalid — navigate to login handled below
        .finally(() => setChecking(false));
    }
  }, [token, employee, setEmployee]);

  if (!token) return <Navigate to="/login" replace />;
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    );
  }
  if (!employee) return <Navigate to="/login" replace />;

  // If wizard not done, only allow /wizard routes
  if (requireWizardDone && !employee.wizard_completed) {
    return <Navigate to="/wizard" replace />;
  }

  return children;
}
