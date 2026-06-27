import { useState } from 'react';
import WizardNav from './WizardNav';

const INDUSTRIES = [
  { key: 'it',            label: 'IT / Software',       icon: '💻', recommended: 'OKR' },
  { key: 'manufacturing', label: 'Manufacturing',        icon: '🏭', recommended: 'KRA / KPI' },
  { key: 'healthcare',    label: 'Healthcare',           icon: '🏥', recommended: 'Goals + Competency' },
  { key: 'bfsi',          label: 'BFSI',                icon: '🏦', recommended: 'Balanced Scorecard' },
  { key: 'retail',        label: 'Retail / Sales',      icon: '🛍️', recommended: 'Goals' },
  { key: 'education',     label: 'Education',           icon: '🎓', recommended: 'Goals + Competency' },
  { key: 'hospitality',   label: 'Hospitality',         icon: '🏨', recommended: 'KRA / KPI' },
  { key: 'logistics',     label: 'Logistics',           icon: '🚚', recommended: 'KRA / KPI' },
  { key: 'ngo',           label: 'NGO / Social Sector', icon: '🤝', recommended: 'Goals' },
  { key: 'custom',        label: 'Other / Custom',      icon: '⚙️',  recommended: 'Hybrid' },
];

export default function StepIndustry({ initialData, onNext, onBack, saving }) {
  const [selected, setSelected] = useState(initialData?.industry || '');

  function handleNext() {
    if (!selected) return;
    onNext({ industry: selected });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">What is your industry?</h2>
        <p className="text-slate-500 mt-1">
          We'll pre-fill the right performance framework and KPIs for your sector.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {INDUSTRIES.map(ind => (
          <button
            key={ind.key}
            onClick={() => setSelected(ind.key)}
            className={`relative flex flex-col items-center text-center gap-2 p-4 rounded-xl border-2 transition-all ${
              selected === ind.key
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {selected === ind.key && (
              <span className="absolute top-2 right-2 text-blue-500 text-sm font-bold">✓</span>
            )}
            <span className="text-3xl">{ind.icon}</span>
            <div>
              <div className="text-sm font-semibold text-slate-800">{ind.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">Commonly: {ind.recommended}</div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-4 py-2">
          Great choice! We'll configure the recommended settings for {INDUSTRIES.find(i => i.key === selected)?.label}.
          You can change any setting in the following steps.
        </p>
      )}

      <WizardNav onBack={onBack} onNext={handleNext} saving={saving} canNext={!!selected} />
    </div>
  );
}
