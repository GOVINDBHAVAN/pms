import { useState } from 'react';
import { Input } from '../ui/input';
import WizardNav from './WizardNav';

const DEFAULT_TERMS = [
  { key: 'kra',              label: 'KRA',              example: 'Area of Focus, Responsibility Area' },
  { key: 'kpi',              label: 'KPI',              example: 'Success Metric, Performance Indicator' },
  { key: 'objective',        label: 'Objective',        example: 'Company Direction, Strategic Goal' },
  { key: 'key_result',       label: 'Key Result',       example: 'Measurable Outcome, Success Criteria' },
  { key: 'goal',             label: 'Goal',             example: 'Individual Target, Programme Target' },
  { key: 'competency',       label: 'Competency',       example: 'Behavioral Skills, Core Capability' },
  { key: 'weight',           label: 'Weight',           example: 'Importance (%), Priority (%)' },
  { key: 'planned',          label: 'Planned Target',   example: 'Commitment, Committed Value' },
  { key: 'actual',           label: 'Actual Achievement', example: 'Result, Delivered Value' },
  { key: 'stretch',          label: 'Stretch Target',   example: 'Aspirational Goal, Bonus Target' },
  { key: 'performance_band', label: 'Performance Band', example: 'Impact Band, Rating Category' },
];

export default function StepTerminology({ initialData, onNext, onBack, saving }) {
  const [terms, setTerms] = useState(() => {
    const saved = initialData?.terminology || {};
    return DEFAULT_TERMS.reduce((acc, t) => {
      acc[t.key] = saved[t.key] || t.label;
      return acc;
    }, {});
  });

  function reset() {
    setTerms(DEFAULT_TERMS.reduce((acc, t) => { acc[t.key] = t.label; return acc; }, {}));
  }

  function handleNext() {
    onNext({ terminology: terms });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Customize Terminology</h2>
        <p className="text-slate-500 mt-1">
          Rename any system term to match your organization's language. Leave unchanged to use the defaults.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-slate-500 font-medium w-40">System Term</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Your Label</th>
              <th className="text-left px-4 py-3 text-slate-400 font-normal">Examples</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DEFAULT_TERMS.map(t => (
              <tr key={t.key} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-600 font-medium">{t.label}</td>
                <td className="px-4 py-2.5">
                  <Input
                    value={terms[t.key]}
                    onChange={e => setTerms(prev => ({ ...prev, [t.key]: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder={t.label}
                  />
                </td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{t.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={reset} className="text-sm text-slate-500 underline hover:text-slate-700">
          Reset to defaults
        </button>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-400">
          These labels will appear everywhere in the system for all employees.
        </span>
      </div>

      <WizardNav onBack={onBack} onNext={handleNext} saving={saving} />
    </div>
  );
}
