import { useState, useEffect } from 'react';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import WizardNav from './WizardNav';

export default function StepWeightage({ initialData, allData, onNext, onBack, saving }) {
  const framework = allData?.framework?.framework || 'hybrid';

  // Only show this step for frameworks that have both goals and competencies
  const isRelevant = ['hybrid', 'competency', 'goals', 'okr', 'balanced_scorecard'].includes(framework);
  const hasBSC = framework === 'balanced_scorecard';

  const [goalsWeight, setGoalsWeight]       = useState(initialData?.weightage?.goals_percent ?? 70);
  const [competencyWeight, setCompWeight]   = useState(initialData?.weightage?.competency_percent ?? 30);
  const [overplanMultiplier, setOverplan]   = useState(
    initialData?.target_rules?.overplan_max_multiplier ?? 1.15
  );

  // Keep them summing to 100
  function handleGoalsChange(val) {
    const g = Math.max(0, Math.min(100, val));
    setGoalsWeight(g);
    setCompWeight(100 - g);
  }
  function handleCompChange(val) {
    const c = Math.max(0, Math.min(100, val));
    setCompWeight(c);
    setGoalsWeight(100 - c);
  }

  function handleNext() {
    onNext({
      weightage: { goals_percent: goalsWeight, competency_percent: competencyWeight },
      target_rules: { overplan_max_multiplier: parseFloat(overplanMultiplier) || 1.15 },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Set Weightage Split</h2>
        <p className="text-slate-500 mt-1">
          Define how much each category contributes to the final performance score.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        {isRelevant && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-slate-700">Goals vs Competencies</div>

            {/* Visual split bar */}
            <div className="h-8 rounded-lg overflow-hidden flex">
              <div
                className="bg-blue-500 flex items-center justify-center text-white text-sm font-medium transition-all"
                style={{ width: `${goalsWeight}%` }}
              >
                {goalsWeight > 10 ? `${goalsWeight}%` : ''}
              </div>
              <div
                className="bg-purple-400 flex items-center justify-center text-white text-sm font-medium transition-all"
                style={{ width: `${competencyWeight}%` }}
              >
                {competencyWeight > 10 ? `${competencyWeight}%` : ''}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="text-sm text-slate-600">Goals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-purple-400" />
                <span className="text-sm text-slate-600">Competencies</span>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Goals Weight (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={goalsWeight}
                  onChange={e => handleGoalsChange(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Competency Weight (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={competencyWeight}
                  onChange={e => handleCompChange(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <p className="text-xs text-slate-400">These percentages apply to every employee's final score across all cycles.</p>
          </div>
        )}

        <div className="space-y-2 border-t border-slate-100 pt-4">
          <label className="text-sm font-medium text-slate-700">
            Over-plan Limit (multiplier)
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              step={0.01}
              min={1.0}
              max={2.0}
              value={overplanMultiplier}
              onChange={e => setOverplan(e.target.value)}
              className="w-28"
            />
            <span className="text-sm text-slate-500">
              = {Math.round((parseFloat(overplanMultiplier) - 1) * 100)}% above parent target allowed
            </span>
          </div>
          <p className="text-xs text-slate-400">
            E.g., 1.15 means a team can collectively commit up to 15% more than the company target.
          </p>
        </div>
      </div>

      <WizardNav onBack={onBack} onNext={handleNext} saving={saving} />
    </div>
  );
}
