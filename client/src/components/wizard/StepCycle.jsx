import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import WizardNav from './WizardNav';

const currentYear = new Date().getFullYear();

function defaultCycleName() {
  const fy = `FY ${currentYear}-${String(currentYear + 1).slice(2)}`;
  return `${fy} Annual`;
}

export default function StepCycle({ initialData, allData, onNext, onBack, saving }) {
  const cascadeDefault = allData?.cascade?.cascade_mode || 'top_down';

  const [form, setForm] = useState({
    name:          initialData?.name          || defaultCycleName(),
    cycle_type:    initialData?.cycle_type    || 'annual',
    period_start:  initialData?.period_start  || `${currentYear}-04-01`,
    period_end:    initialData?.period_end    || `${currentYear + 1}-03-31`,
    goal_set_open: initialData?.goal_set_open || `${currentYear}-04-01`,
    goal_set_close:initialData?.goal_set_close|| `${currentYear}-04-30`,
    review_open:   initialData?.review_open   || `${currentYear + 1}-02-01`,
    review_close:  initialData?.review_close  || `${currentYear + 1}-02-28`,
    cascade_mode:  initialData?.cascade_mode  || cascadeDefault,
  });

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function isValid() {
    return form.name && form.period_start && form.period_end;
  }

  function handleNext() {
    if (!isValid()) return;
    onNext(form);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Create Your First Review Cycle</h2>
        <p className="text-slate-500 mt-1">
          This is the performance cycle employees will use. You can create additional cycles from the Cycles menu.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Cycle Name</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="FY 2025-26 Annual" />
          </div>

          <div className="space-y-1.5">
            <Label>Cycle Type</Label>
            <select
              value={form.cycle_type}
              onChange={e => set('cycle_type', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="annual">Annual</option>
              <option value="half_yearly">Half-Yearly</option>
              <option value="quarterly">Quarterly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Cascade Mode</Label>
            <select
              value={form.cascade_mode}
              onChange={e => set('cascade_mode', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="top_down">Top-Down (default)</option>
              <option value="bottom_up">Bottom-Up</option>
              <option value="bidirectional">Bidirectional</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div className="text-sm font-medium text-slate-700">Performance Period</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Period Start</Label>
              <Input type="date" value={form.period_start} onChange={e => set('period_start', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Period End</Label>
              <Input type="date" value={form.period_end} onChange={e => set('period_end', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div className="text-sm font-medium text-slate-700">Goal-Setting Window</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Opens On</Label>
              <Input type="date" value={form.goal_set_open} onChange={e => set('goal_set_open', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Closes On</Label>
              <Input type="date" value={form.goal_set_close} onChange={e => set('goal_set_close', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div className="text-sm font-medium text-slate-700">Review Window</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Opens On</Label>
              <Input type="date" value={form.review_open} onChange={e => set('review_open', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Closes On</Label>
              <Input type="date" value={form.review_close} onChange={e => set('review_close', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <WizardNav
        onBack={onBack}
        onNext={handleNext}
        saving={saving}
        nextLabel="Launch Cycle →"
        canNext={isValid()}
      />
    </div>
  );
}
