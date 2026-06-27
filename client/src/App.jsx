import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Placeholder page component — will be replaced phase by phase
const Page = ({ title }) => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="text-muted-foreground mt-2">Coming soon — Phase build in progress</p>
    </div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect — will check wizard_completed in Phase 2 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Auth */}
        <Route path="/login" element={<Page title="Login" />} />

        {/* Setup Wizard — Phase 3 */}
        <Route path="/wizard" element={<Page title="Setup Wizard" />} />
        <Route path="/wizard/:step" element={<Page title="Wizard Step" />} />

        {/* Core App */}
        <Route path="/dashboard" element={<Page title="Dashboard" />} />

        {/* Org Management */}
        <Route path="/org/settings" element={<Page title="Org Settings" />} />
        <Route path="/org/employees" element={<Page title="Employee Management" />} />
        <Route path="/org/library" element={<Page title="Performance Library" />} />

        {/* Cycles */}
        <Route path="/cycles" element={<Page title="Review Cycles" />} />
        <Route path="/cycles/new" element={<Page title="Create Cycle" />} />
        <Route path="/cycles/:id" element={<Page title="Cycle Detail" />} />

        {/* My Targets — Employee */}
        <Route path="/my-targets" element={<Page title="My Targets" />} />
        <Route path="/my-targets/add" element={<Page title="Add Target" />} />
        <Route path="/my-targets/:id/edit" element={<Page title="Edit Target" />} />

        {/* Team Targets — Manager */}
        <Route path="/team-targets" element={<Page title="Team Targets" />} />
        <Route path="/team-targets/:employeeId" element={<Page title="Reportee Targets" />} />
        <Route path="/team-targets/proposed" element={<Page title="Proposed Targets Queue" />} />

        {/* Appraisal */}
        <Route path="/appraisal/self" element={<Page title="Self Appraisal" />} />
        <Route path="/appraisal/team" element={<Page title="Team Appraisal" />} />
        <Route path="/appraisal/team/:employeeId" element={<Page title="Rate Employee" />} />

        {/* HR */}
        <Route path="/calibration" element={<Page title="Calibration" />} />
        <Route path="/reports" element={<Page title="Reports" />} />
        <Route path="/reports/cascade-health" element={<Page title="Cascade Health" />} />
        <Route path="/reports/overplan" element={<Page title="Over-Plan Report" />} />

        {/* 404 fallback */}
        <Route path="*" element={<Page title="Page Not Found" />} />
      </Routes>
    </BrowserRouter>
  )
}
