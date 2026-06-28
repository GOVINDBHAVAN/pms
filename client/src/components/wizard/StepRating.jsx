import { useState } from 'react';
import WizardNav from './WizardNav';

const SCALES = [
  {
    key: '5_point',
    label: '5-Point Scale',
    description: 'Five levels from Poor to Exceptional. Most common in corporate environments.',
    preview: {
      labels: ['Poor', 'Below Expectation', 'Meets Expectation', 'Exceeds Expectation', 'Exceptional'],
      values: [1, 2, 3, 4, 5],
      colors: ['bg-red-100 text-red-700','bg-orange-100 text-orange-700','bg-yellow-100 text-yellow-700','bg-blue-100 text-blue-700','bg-green-100 text-green-700'],
    },
  },
  {
    key: '3_point',
    label: '3-Point Scale',
    description: 'Simpler: Above / Meets / Below. Good for orgs new to performance management.',
    preview: {
      labels: ['Below Expectation', 'Meets Expectation', 'Above Expectation'],
      values: [1, 2, 3],
      colors: ['bg-red-100 text-red-700','bg-yellow-100 text-yellow-700','bg-green-100 text-green-700'],
    },
  },
  {
    key: 'percentage',
    label: 'Percentage Achievement',
    description: 'Rate by % of target achieved (0–120%). Common in sales and KPI-driven roles.',
    preview: null,
    customPreview: (
      <div className="space-y-1 text-sm">
        <div className="flex gap-2 items-center">
          <div className="w-24 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">120% +</div>
          <span className="text-slate-500 text-xs">Outstanding — exceeded stretch</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-24 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">100–119%</div>
          <span className="text-slate-500 text-xs">Exceeds target</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-24 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">80–99%</div>
          <span className="text-slate-500 text-xs">Meets target</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-24 bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Below 80%</div>
          <span className="text-slate-500 text-xs">Below target</span>
        </div>
      </div>
    ),
  },
  {
    key: 'bars',
    label: 'Behaviorally Anchored (BARS)',
    description: 'Describe specific behaviors at each rating level. Most rigorous — great for healthcare and compliance.',
    preview: null,
    customPreview: (
      <div className="space-y-1 text-sm">
        {[
          ['5 — Expert',    'Consistently demonstrates mastery; coaches others'],
          ['4 — Advanced',  'Applies skills independently in complex situations'],
          ['3 — Proficient','Meets all requirements with minimal guidance'],
          ['2 — Developing','Meets some requirements; needs support'],
          ['1 — Novice',    'Learning; requires significant guidance'],
        ].map(([lvl, desc]) => (
          <div key={lvl} className="flex gap-2 text-xs">
            <span className="font-medium text-slate-700 w-28 flex-shrink-0">{lvl}</span>
            <span className="text-slate-500">{desc}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: 'custom',
    label: 'Custom Labels',
    description: 'Define your own rating labels and numeric values to match your org\'s existing language.',
    preview: null,
    customPreview: (
      <div className="text-xs text-slate-500 italic">
        You will customize the labels after selecting this option.
      </div>
    ),
  },
];

const DEFAULT_SCALE = {
  '5_point': {
    type: '5_point',
    labels: ['Poor', 'Below Expectation', 'Meets Expectation', 'Exceeds Expectation', 'Exceptional'],
    values: [1, 2, 3, 4, 5],
    pip_below: 2,
  },
  '3_point': {
    type: '3_point',
    labels: ['Below Expectation', 'Meets Expectation', 'Above Expectation'],
    values: [1, 2, 3],
    pip_below: 1,
  },
  percentage: { type: 'percentage', pip_below: 80 },
  bars:       { type: 'bars', labels: ['Novice','Developing','Proficient','Advanced','Expert'], values: [1,2,3,4,5], pip_below: 2 },
  custom:     { type: 'custom', labels: ['Level 1','Level 2','Level 3','Level 4','Level 5'], values: [1,2,3,4,5], pip_below: 2 },
};

export default function StepRating({ initialData, onNext, onBack, saving }) {
  const [selected, setSelected] = useState(initialData?.rating_scale?.goals?.type || '5_point');

  function handleNext() {
    const scale = DEFAULT_SCALE[selected];
    onNext({
      rating_scale: {
        goals:      { ...scale },
        competency: { ...scale },
      },
    });
  }

  const selectedScale = SCALES.find(s => s.key === selected);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Choose a Review Scoring Scale</h2>
        <p className="text-slate-500 mt-1">
          This is the scale managers use to rate performance at review time — e.g., a 5-point scale from Poor to Exceptional.
          It applies to both goals and competencies by default.
        </p>
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-xs text-blue-700">
          <strong>Note:</strong> This is separate from <em>measurement types</em> (how each KPI or Key Result's value is entered — number, %, Yes/No, BARS, etc.).
          Measurement types are configured per-target and can be managed in <strong>Org Settings → Rating Scale</strong> after setup.
        </div>
      </div>

      <div className="space-y-3">
        {SCALES.map(scale => (
          <button
            key={scale.key}
            onClick={() => setSelected(scale.key)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selected === scale.key
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                selected === scale.key ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
              }`} />
              <div className="flex-1">
                <div className="font-medium text-slate-900">{scale.label}</div>
                <div className="text-sm text-slate-500 mt-0.5">{scale.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Live preview */}
      {selectedScale && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Preview — how a rating looks</div>
          {selectedScale.preview ? (
            <div className="flex flex-wrap gap-2">
              {selectedScale.preview.labels.map((label, i) => (
                <div key={i} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${selectedScale.preview.colors[i]}`}>
                  {selectedScale.preview.values[i]} — {label}
                </div>
              ))}
            </div>
          ) : (
            selectedScale.customPreview
          )}
        </div>
      )}

      <WizardNav onBack={onBack} onNext={handleNext} saving={saving} canNext={!!selected} />
    </div>
  );
}
