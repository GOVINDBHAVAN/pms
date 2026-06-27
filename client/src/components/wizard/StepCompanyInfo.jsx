import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import WizardNav from './WizardNav';

export default function StepCompanyInfo({ onNext, saving }) {
  const { employee } = useAuthStore();
  const [form, setForm] = useState({
    org_name: employee?.org_name || '',
    size: '',
    country: 'India',
  });

  function handleNext() {
    if (!form.org_name.trim()) return;
    onNext(form);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Company Information</h2>
        <p className="text-slate-500 mt-1">Let's start with the basics about your organization.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="org_name">Organization Name</Label>
          <Input
            id="org_name"
            placeholder="e.g., Acme Technologies Pvt Ltd"
            value={form.org_name}
            onChange={e => setForm(f => ({ ...f, org_name: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="size">Company Size</Label>
          <select
            id="size"
            value={form.size}
            onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select size range</option>
            <option value="1-50">1–50 employees</option>
            <option value="51-200">51–200 employees</option>
            <option value="201-500">201–500 employees</option>
            <option value="501-2000">501–2,000 employees</option>
            <option value="2001+">2,001+ employees</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country">Country / Region</Label>
          <Input
            id="country"
            placeholder="e.g., India"
            value={form.country}
            onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
          />
        </div>
      </div>

      <WizardNav onNext={handleNext} saving={saving} canNext={!!form.org_name.trim()} />
    </div>
  );
}
