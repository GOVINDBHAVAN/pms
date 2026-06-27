import { useState } from 'react';
import WizardNav from './WizardNav';

const MODES = [
  {
    key: 'top_down',
    label: 'Top-Down',
    emoji: '🔽',
    subtitle: 'Most Common',
    description: 'Leadership sets company targets → Managers break them down → Employees receive their targets.',
    detail: 'Ensures alignment across the entire organization. Clear direction from top to bottom.',
    diagram: [
      { label: 'CEO / Leadership', color: 'bg-blue-100 border-blue-300 text-blue-800' },
      { label: '↓ cascade down', color: 'text-slate-400 text-center text-xs', arrow: true },
      { label: 'Managers',        color: 'bg-blue-50 border-blue-200 text-blue-700' },
      { label: '↓ cascade down', color: 'text-slate-400 text-center text-xs', arrow: true },
      { label: 'Employees',       color: 'bg-slate-100 border-slate-300 text-slate-700' },
    ],
  },
  {
    key: 'bottom_up',
    label: 'Bottom-Up',
    emoji: '🔼',
    subtitle: 'Employee-Driven',
    description: 'Employees propose their own targets → Managers review and link them → Leadership sees aggregated commitments.',
    detail: 'Promotes ownership and motivation. Targets bubble up from individuals.',
    diagram: [
      { label: 'Employees propose', color: 'bg-green-100 border-green-300 text-green-800' },
      { label: '↑ bubble up',       color: 'text-slate-400 text-center text-xs', arrow: true },
      { label: 'Manager reviews & links', color: 'bg-green-50 border-green-200 text-green-700' },
      { label: '↑ aggregated',      color: 'text-slate-400 text-center text-xs', arrow: true },
      { label: 'Leadership sees total', color: 'bg-slate-100 border-slate-300 text-slate-700' },
    ],
  },
  {
    key: 'bidirectional',
    label: 'Bidirectional',
    emoji: '🔄',
    subtitle: 'Recommended for mature orgs',
    description: 'Both happen simultaneously. Leadership sets direction. Employees also propose. Manager reconciles both.',
    detail: 'Best balance of alignment and ownership. Requires more manager coordination.',
    diagram: [
      { label: 'Leadership (top-down targets)', color: 'bg-purple-100 border-purple-300 text-purple-800' },
      { label: '↕ both directions',             color: 'text-slate-400 text-center text-xs', arrow: true },
      { label: 'Manager (reconciles both)',      color: 'bg-purple-50 border-purple-200 text-purple-700' },
      { label: '↕ both directions',             color: 'text-slate-400 text-center text-xs', arrow: true },
      { label: 'Employees (can also propose)',   color: 'bg-slate-100 border-slate-300 text-slate-700' },
    ],
  },
];

export default function StepCascade({ initialData, onNext, onBack, saving }) {
  const [selected, setSelected] = useState(initialData?.cascade_mode || '');

  function handleNext() {
    if (!selected) return;
    onNext({ cascade_mode: selected });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">How should targets cascade?</h2>
        <p className="text-slate-500 mt-1">
          This defines the direction in which performance targets flow through your organization hierarchy.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {MODES.map(mode => (
          <button
            key={mode.key}
            onClick={() => setSelected(mode.key)}
            className={`text-left p-5 rounded-xl border-2 transition-all flex flex-col gap-3 ${
              selected === mode.key
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{mode.emoji}</span>
                <span className="font-semibold text-slate-900">{mode.label}</span>
              </div>
              <span className="text-xs text-slate-400">{mode.subtitle}</span>
            </div>

            {/* Diagram */}
            <div className="space-y-1">
              {mode.diagram.map((row, i) => (
                row.arrow
                  ? <div key={i} className="text-center text-slate-400 text-xs">{row.label}</div>
                  : <div key={i} className={`px-2 py-1.5 rounded border text-xs font-medium text-center ${row.color}`}>
                      {row.label}
                    </div>
              ))}
            </div>

            {/* Description */}
            <div className="text-xs text-slate-600">{mode.description}</div>

            {/* Selected indicator */}
            {selected === mode.key && (
              <div className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                <span>✓</span> Selected
              </div>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <strong>{MODES.find(m => m.key === selected)?.label}:</strong>{' '}
          {MODES.find(m => m.key === selected)?.detail}
        </div>
      )}

      <WizardNav onBack={onBack} onNext={handleNext} saving={saving} canNext={!!selected} />
    </div>
  );
}
