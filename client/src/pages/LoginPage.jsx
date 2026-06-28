import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { login, getDemoOrgs, getDemoEmployees, demoLogin } from '../api/authApi';
import { startWizard } from '../api/wizardApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

const INDUSTRY_META = {
  it:            { label: 'IT / Software',     icon: '💻', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  manufacturing: { label: 'Manufacturing',      icon: '🏭', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
  healthcare:    { label: 'Healthcare',         icon: '🏥', color: 'bg-green-50 border-green-200 hover:bg-green-100' },
  bfsi:          { label: 'BFSI',              icon: '🏦', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  retail:        { label: 'Retail / Sales',     icon: '🛒', color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
  education:     { label: 'Education',          icon: '🎓', color: 'bg-teal-50 border-teal-200 hover:bg-teal-100' },
};

const ROLE_BADGE = {
  admin:    'bg-red-100 text-red-700',
  hr:       'bg-purple-100 text-purple-700',
  manager:  'bg-blue-100 text-blue-700',
  employee: 'bg-slate-100 text-slate-600',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [tab, setTab] = useState('login'); // 'login' | 'new' | 'demo'
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [newForm, setNewForm] = useState({ org_name: '', admin_name: '', admin_email: '', admin_password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Demo state
  const [demoOrgs, setDemoOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [demoEmployees, setDemoEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(null); // employee_id being logged in

  useEffect(() => {
    if (tab === 'demo' && demoOrgs.length === 0) {
      getDemoOrgs()
        .then(setDemoOrgs)
        .catch(() => {});
    }
  }, [tab]);

  useEffect(() => {
    if (!selectedOrg) { setDemoEmployees([]); return; }
    setEmpLoading(true);
    getDemoEmployees(selectedOrg.id)
      .then(setDemoEmployees)
      .catch(() => setDemoEmployees([]))
      .finally(() => setEmpLoading(false));
  }, [selectedOrg]);

  function afterLogin(token, employee) {
    setAuth(token, employee);
    if (!employee.wizard_completed) navigate('/wizard');
    else navigate('/dashboard');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, employee } = await login(loginForm.email, loginForm.password);
      afterLogin(token, employee);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleNewOrg(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, employee } = await startWizard(newForm);
      setAuth(token, employee);
      navigate('/wizard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start setup');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(employeeId) {
    setLoginInProgress(employeeId);
    setError('');
    try {
      const { token, employee } = await demoLogin(employeeId);
      afterLogin(token, employee);
    } catch (err) {
      setError(err.response?.data?.error || 'Demo login failed');
      setLoginInProgress(null);
    }
  }

  function getOrgMeta(industry) {
    return INDUSTRY_META[industry] || { label: industry, icon: '🏢', color: 'bg-slate-50 border-slate-200 hover:bg-slate-100' };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        {/* Branding */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white text-xl font-bold mb-2">P</div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Management</h1>
          <p className="text-sm text-slate-500 italic">Performance management for humans, not HR consultants</p>
        </div>

        {/* Tab selector */}
        <div className="flex bg-slate-200 rounded-lg p-1 gap-1">
          {[
            { key: 'login', label: 'Sign In' },
            { key: 'demo',  label: 'Try Demo' },
            { key: 'new',   label: 'New Organization' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setError(''); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === key ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Sign In ── */}
        {tab === 'login' && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>Enter your credentials to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Try Demo ── */}
        {tab === 'demo' && (
          <Card>
            <CardHeader>
              <CardTitle>Try a Demo</CardTitle>
              <CardDescription>Pick an industry and click any employee to instantly explore the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              {/* Org picker */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Select Demo Company</p>
                <div className="grid grid-cols-1 gap-2">
                  {demoOrgs.length === 0 && (
                    <p className="text-sm text-slate-400 py-4 text-center">Loading demo companies…</p>
                  )}
                  {demoOrgs.map(org => {
                    const meta = getOrgMeta(org.industry);
                    const isSelected = selectedOrg?.id === org.id;
                    return (
                      <button
                        key={org.id}
                        onClick={() => setSelectedOrg(isSelected ? null : org)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400'
                            : meta.color + ' border'
                        }`}
                      >
                        <span className="text-2xl">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{org.name}</p>
                          <p className="text-xs text-slate-500">{meta.label} · {org.framework} · {org.cascade_mode} · {org.employee_count} employees</p>
                        </div>
                        {isSelected && <span className="text-blue-600 text-sm font-medium">Selected</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Employee list */}
              {selectedOrg && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Login as — {selectedOrg.name}
                  </p>
                  {empLoading ? (
                    <p className="text-sm text-slate-400 py-4 text-center">Loading employees…</p>
                  ) : (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {demoEmployees.map(emp => (
                        <button
                          key={emp.id}
                          onClick={() => handleDemoLogin(emp.id)}
                          disabled={loginInProgress !== null}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors text-left disabled:opacity-60"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {emp.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{emp.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {emp.dept_name} · {emp.grade_code} – {emp.grade_label}
                              {emp.manager_name ? ` · Reports to ${emp.manager_name}` : ''}
                            </p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_BADGE[emp.role] || ROLE_BADGE.employee}`}>
                            {emp.role}
                          </span>
                          {loginInProgress === emp.id ? (
                            <span className="text-xs text-blue-600 flex-shrink-0">Logging in…</span>
                          ) : (
                            <span className="text-xs text-slate-400 flex-shrink-0">Login</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── New Organization ── */}
        {tab === 'new' && (
          <Card>
            <CardHeader>
              <CardTitle>Set up your organization</CardTitle>
              <CardDescription>You'll be guided through an 11-step wizard to configure your PMS</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNewOrg} className="space-y-4">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-1">
                  <Label htmlFor="org_name">Organization Name</Label>
                  <Input id="org_name" placeholder="Acme Corp"
                    value={newForm.org_name}
                    onChange={e => setNewForm(f => ({ ...f, org_name: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admin_name">Your Name</Label>
                  <Input id="admin_name" placeholder="HR Manager"
                    value={newForm.admin_name}
                    onChange={e => setNewForm(f => ({ ...f, admin_name: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admin_email">Your Email</Label>
                  <Input id="admin_email" type="email" placeholder="hr@acmecorp.com"
                    value={newForm.admin_email}
                    onChange={e => setNewForm(f => ({ ...f, admin_email: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="admin_password">Password</Label>
                  <Input id="admin_password" type="password" placeholder="Create a password"
                    value={newForm.admin_password}
                    onChange={e => setNewForm(f => ({ ...f, admin_password: e.target.value }))} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Starting setup…' : 'Start Setup Wizard'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
