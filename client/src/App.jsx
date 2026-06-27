import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import LoginPage       from './pages/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import PrivateRoute    from './components/layout/PrivateRoute';
import WizardShell     from './components/wizard/WizardShell';
import AppLayout       from './components/layout/AppLayout';

// Placeholder for pages built in future phases
const Placeholder = ({ title }) => (
  <AppLayout>
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
        <p className="text-slate-400 text-sm mt-1">Coming in the next phase</p>
      </div>
    </div>
  </AppLayout>
);

// Root redirect: check wizard_completed to decide where to send the user
function RootRedirect() {
  const { token, employee } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (employee && !employee.wizard_completed) return <Navigate to="/wizard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Setup Wizard — requires auth but NOT wizard_completed */}
        <Route
          path="/wizard"
          element={
            <PrivateRoute requireWizardDone={false}>
              <WizardShell />
            </PrivateRoute>
          }
        />
        <Route
          path="/wizard/:step"
          element={
            <PrivateRoute requireWizardDone={false}>
              <WizardShell />
            </PrivateRoute>
          }
        />

        {/* Core app — requires auth AND wizard_completed */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />

        <Route path="/org/settings"  element={<PrivateRoute><Placeholder title="Org Settings" /></PrivateRoute>} />
        <Route path="/org/employees" element={<PrivateRoute><Placeholder title="Employee Management" /></PrivateRoute>} />
        <Route path="/org/library"   element={<PrivateRoute><Placeholder title="Performance Library" /></PrivateRoute>} />

        <Route path="/cycles"        element={<PrivateRoute><Placeholder title="Review Cycles" /></PrivateRoute>} />
        <Route path="/cycles/new"    element={<PrivateRoute><Placeholder title="Create Cycle" /></PrivateRoute>} />
        <Route path="/cycles/:id"    element={<PrivateRoute><Placeholder title="Cycle Detail" /></PrivateRoute>} />

        <Route path="/my-targets"         element={<PrivateRoute><Placeholder title="My Targets" /></PrivateRoute>} />
        <Route path="/my-targets/add"     element={<PrivateRoute><Placeholder title="Add Target" /></PrivateRoute>} />
        <Route path="/my-targets/:id/edit"element={<PrivateRoute><Placeholder title="Edit Target" /></PrivateRoute>} />

        <Route path="/team-targets"              element={<PrivateRoute><Placeholder title="Team Targets" /></PrivateRoute>} />
        <Route path="/team-targets/proposed"     element={<PrivateRoute><Placeholder title="Proposed Targets" /></PrivateRoute>} />
        <Route path="/team-targets/:employeeId"  element={<PrivateRoute><Placeholder title="Reportee Targets" /></PrivateRoute>} />

        <Route path="/appraisal/self"            element={<PrivateRoute><Placeholder title="Self Appraisal" /></PrivateRoute>} />
        <Route path="/appraisal/team"            element={<PrivateRoute><Placeholder title="Team Appraisal" /></PrivateRoute>} />
        <Route path="/appraisal/team/:employeeId"element={<PrivateRoute><Placeholder title="Rate Employee" /></PrivateRoute>} />

        <Route path="/calibration"       element={<PrivateRoute><Placeholder title="Calibration" /></PrivateRoute>} />
        <Route path="/reports"           element={<PrivateRoute><Placeholder title="Reports" /></PrivateRoute>} />
        <Route path="/reports/cascade-health" element={<PrivateRoute><Placeholder title="Cascade Health" /></PrivateRoute>} />
        <Route path="/reports/overplan"  element={<PrivateRoute><Placeholder title="Over-Plan Report" /></PrivateRoute>} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
