import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { getPresets } from '../../api/wizardApi';
import WizardNav from './WizardNav';

const DEFAULT_GRADES = [
  { code: 'L1', label: 'Junior',   level: 1, can_manage: false },
  { code: 'L2', label: 'Mid',      level: 2, can_manage: false },
  { code: 'L3', label: 'Senior',   level: 3, can_manage: false },
  { code: 'L4', label: 'Manager',  level: 4, can_manage: true },
  { code: 'L5', label: 'Director', level: 5, can_manage: true },
];

export default function StepGrades({ initialData, allData, onNext, onBack, saving }) {
  const industryKey = allData?.industry?.industry;
  const [grades, setGrades] = useState(initialData?.grades || DEFAULT_GRADES);

  // Try to load industry-specific preset grades
  useEffect(() => {
    if (!initialData?.grades && industryKey) {
      getPresets().then(presets => {
        if (presets[industryKey]?.grades) {
          setGrades(presets[industryKey].grades.map(g => ({ ...g, can_manage: !!g.can_manage })));
        }
      }).catch(() => {});
    }
  }, [industryKey]);

  function addRow() {
    setGrades(prev => [
      ...prev,
      { code: '', label: '', level: prev.length + 1, can_manage: false },
    ]);
  }

  function removeRow(i) {
    setGrades(prev => prev.filter((_, idx) => idx !== i));
  }

  function update(i, field, value) {
    setGrades(prev => prev.map((g, idx) => idx === i ? { ...g, [field]: value } : g));
  }

  function handleNext() {
    const valid = grades.filter(g => g.code.trim() && g.label.trim());
    if (!valid.length) return;
    onNext({ grades: valid.map(g => ({ ...g, level: parseInt(g.level) || 1 })) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Define Grades / Levels</h2>
        <p className="text-slate-500 mt-1">
          These are the seniority levels in your organization. Grades determine who can approve whose targets.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-slate-500 font-medium w-24">Code</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Label / Title</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium w-20">Level</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium w-28">Can Manage?</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grades.map((g, i) => (
              <tr key={i}>
                <td className="px-4 py-2">
                  <Input
                    value={g.code}
                    onChange={e => update(i, 'code', e.target.value)}
                    placeholder="L1"
                    className="h-8 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={g.label}
                    onChange={e => update(i, 'label', e.target.value)}
                    placeholder="Junior Developer"
                    className="h-8 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    value={g.level}
                    onChange={e => update(i, 'level', e.target.value)}
                    className="h-8 text-sm"
                    min={1}
                  />
                </td>
                <td className="px-4 py-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!g.can_manage}
                      onChange={e => update(i, 'can_manage', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-slate-500">Yes</span>
                  </label>
                </td>
                <td className="px-2">
                  <button
                    onClick={() => removeRow(i)}
                    className="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={addRow}>
            + Add Grade
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Higher level numbers = more senior. Employees with "Can Manage" can approve reportees' targets.
      </p>

      <WizardNav
        onBack={onBack}
        onNext={handleNext}
        saving={saving}
        canNext={grades.some(g => g.code.trim() && g.label.trim())}
      />
    </div>
  );
}
