import { useState, useEffect } from 'react';
import WizardNav from './WizardNav';

const FRAMEWORKS = [
  {
    key: 'okr',
    label: 'OKR',
    subtitle: 'Objectives & Key Results',
    description: 'Set inspiring company goals (Objectives) and track them with measurable results (Key Results). Popular in tech companies.',
    bestFor: 'IT, Startups, Product companies',
    industries: ['it'],
  },
  {
    key: 'kra_kpi',
    label: 'KRA / KPI',
    subtitle: 'Key Result Areas & Indicators',
    description: 'Define areas of responsibility (KRAs) and measure performance in each area using specific metrics (KPIs).',
    bestFor: 'Manufacturing, BFSI, Retail, Traditional orgs',
    industries: ['manufacturing','bfsi','hospitality','logistics'],
  },
  {
    key: 'goals',
    label: 'Goals',
    subtitle: 'Simple & Direct',
    description: 'Set plain targets for each person or team. No jargon — just clear, trackable goals.',
    bestFor: 'Small teams, Education, NGO, Service companies',
    industries: ['retail','education','ngo'],
  },
  {
    key: 'competency',
    label: 'Competency-Based',
    subtitle: 'Skills & Behaviors',
    description: 'Evaluate employees on skills and behaviors, not just numbers. Great for roles where attitude and skill matter most.',
    bestFor: 'Healthcare, Customer service, HR-heavy orgs',
    industries: ['healthcare'],
  },
  {
    key: 'balanced_scorecard',
    label: 'Balanced Scorecard',
    subtitle: 'Four Perspectives',
    description: 'Measure performance across four dimensions: Financial, Customer, Internal Process, and Learning & Growth.',
    bestFor: 'BFSI, Large enterprises, Regulated industries',
    industries: ['bfsi'],
  },
  {
    key: 'hybrid',
    label: 'Hybrid',
    subtitle: 'Mix & Match (Recommended)',
    description: 'Combine any of the above frameworks. E.g., 70% KPI-based + 30% Competency. Best for most organizations.',
    bestFor: 'Most mid-sized organizations',
    industries: [],
    recommended: true,
  },
];

export default function StepFramework({ initialData, allData, onNext, onBack, saving }) {
  const industryKey = allData?.industry?.industry || '';
  const [selected, setSelected] = useState(initialData?.framework || '');

  // Auto-select recommended based on industry
  useEffect(() => {
    if (!selected && industryKey) {
      const match = FRAMEWORKS.find(f => f.industries.includes(industryKey));
      if (match) setSelected(match.key);
      else setSelected('hybrid');
    }
  }, [industryKey]);

  function handleNext() {
    if (!selected) return;
    const fw = FRAMEWORKS.find(f => f.key === selected);
    onNext({ framework: selected, active_types: getActiveTypes(selected) });
  }

  function getActiveTypes(fw) {
    switch (fw) {
      case 'okr':              return ['okr_objective','okr_kr','competency'];
      case 'kra_kpi':          return ['kra','kpi'];
      case 'goals':            return ['goal','competency'];
      case 'competency':       return ['competency'];
      case 'balanced_scorecard': return ['bsc_metric','kpi','competency'];
      case 'hybrid':           return ['kra','kpi','competency'];
      default:                 return ['kra','kpi'];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Choose a Performance Framework</h2>
        <p className="text-slate-500 mt-1">
          This determines how goals are structured for your team. You can always change it later.
        </p>
      </div>

      <div className="space-y-3">
        {FRAMEWORKS.map(fw => (
          <button
            key={fw.key}
            onClick={() => setSelected(fw.key)}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
              selected === fw.key
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{fw.label}</span>
                  <span className="text-slate-400 text-sm">— {fw.subtitle}</span>
                  {fw.recommended && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Recommended</span>
                  )}
                  {fw.industries.includes(industryKey) && !fw.recommended && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Suggested for your industry</span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1">{fw.description}</p>
                <p className="text-xs text-slate-400 mt-1">Best for: {fw.bestFor}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                selected === fw.key ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
              }`}>
                {selected === fw.key && (
                  <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500 italic">
        Not sure? Choose <strong>Hybrid</strong> — you can always change it later from Org Settings.
      </p>

      <WizardNav onBack={onBack} onNext={handleNext} saving={saving} canNext={!!selected} />
    </div>
  );
}
