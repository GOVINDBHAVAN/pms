import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { login } from '../api/authApi';
import { startWizard } from '../api/wizardApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [tab, setTab] = useState('login'); // 'login' | 'new'
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [newForm, setNewForm]     = useState({ org_name: '', admin_name: '', admin_email: '', admin_password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, employee } = await login(loginForm.email, loginForm.password);
      setAuth(token, employee);
      if (!employee.wizard_completed) {
        navigate('/wizard');
      } else {
        navigate('/dashboard');
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Logo / branding */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white text-xl font-bold mb-2">P</div>
          <h1 className="text-2xl font-bold text-slate-900">Performance Management</h1>
          <p className="text-sm text-slate-500 italic">Performance management for humans, not HR consultants</p>
        </div>

        {/* Tab selector */}
        <div className="flex bg-slate-200 rounded-lg p-1">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === 'login' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('new')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === 'new' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Organization
          </button>
        </div>

        <Card>
          {tab === 'login' ? (
            <>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Enter your credentials to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={loginForm.email}
                      onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In'}
                  </Button>
                  <p className="text-xs text-center text-slate-500 mt-2">
                    Demo: arjun.mehta@techcorp.com / password123
                  </p>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Set up your organization</CardTitle>
                <CardDescription>You'll be guided through an 11-step wizard to configure your PMS</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNewOrg} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="org_name">Organization Name</Label>
                    <Input
                      id="org_name"
                      placeholder="Acme Corp"
                      value={newForm.org_name}
                      onChange={e => setNewForm(f => ({ ...f, org_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="admin_name">Your Name</Label>
                    <Input
                      id="admin_name"
                      placeholder="HR Manager"
                      value={newForm.admin_name}
                      onChange={e => setNewForm(f => ({ ...f, admin_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="admin_email">Your Email</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      placeholder="hr@acmecorp.com"
                      value={newForm.admin_email}
                      onChange={e => setNewForm(f => ({ ...f, admin_email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="admin_password">Password</Label>
                    <Input
                      id="admin_password"
                      type="password"
                      placeholder="Create a password"
                      value={newForm.admin_password}
                      onChange={e => setNewForm(f => ({ ...f, admin_password: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Starting setup…' : 'Start Setup Wizard'}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
