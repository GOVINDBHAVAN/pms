import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getWizardStatus, saveStep, completeWizard } from '../../api/wizardApi';

import StepCompanyInfo from './StepCompanyInfo';
import StepIndustry from './StepIndustry';
import StepFramework from './StepFramework';
import StepCascade from './StepCascade';
import StepRating from './StepRating';
import StepWeightage from './StepWeightage';
import StepTerminology from './StepTerminology';
import StepGrades from './StepGrades';
import StepDepartments from './StepDepartments';
import StepEmployees from './StepEmployees';
import StepCycle from './StepCycle';
import WizardComplete from './WizardComplete';

const STEPS = [
  { key: 'company_info',  label: 'Company',       component: StepCompanyInfo },
  { key: 'industry',      label: 'Industry',      component: StepIndustry },
  { key: 'framework',     label: 'Framework',     component: StepFramework },
  { key: 'cascade',       label: 'Cascade',       component: StepCascade },
  { key: 'rating',        label: 'Rating Scale',  component: StepRating },
  { key: 'weightage',     label: 'Weightage',     component: StepWeightage },
  { key: 'terminology',   label: 'Terminology',   component: StepTerminology },
  { key: 'grades',        label: 'Grades',        component: StepGrades },
  { key: 'departments',   label: 'Departments',   component: StepDepartments },
  { key: 'employees',     label: 'Employees',     component: StepEmployees },
  { key: 'cycle',         label: 'First Cycle',   component: StepCycle },
  { key: 'done',          label: 'Done',          component: WizardComplete },
];

// Steps that need a server save (company_info is saved at wizard/start, done is complete)
const SERVER_STEPS = ['industry','framework','cascade','rating','weightage','terminology','grades','departments','employees','cycle'];

export default function WizardShell() {
  const navigate = useNavigate();
  const { step: urlStep } = useParams();
  const { employee, updateToken } = useAuthStore();

  const [status, setStatus]           = useState(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [savedData, setSavedData]     = useState({});
  const [error, setError]             = useState('');
  const [saving, setSaving]           = useState(false);

  // Determine current step index from URL or server status
  useEffect(() => {
    async function init() {
      try {
        const s = await getWizardStatus();
        setStatus(s);

        // Decide which step to show
        if (urlStep) {
          const idx = STEPS.findIndex(step => step.key === urlStep);
          if (idx !== -1) setCurrentStepIdx(idx);
        } else {
          // Auto-navigate to first incomplete step
          const currentKey = s.current_step;
          const idx = STEPS.findIndex(step => step.key === currentKey);
          setCurrentStepIdx(idx !== -1 ? idx : 0);
        }
      } catch {
        // wizard not started yet — show first step
        setCurrentStepIdx(0);
      }
    }
    init();
  }, [urlStep]);

  const currentStep = STEPS[currentStepIdx];

  function updateUrl(stepKey) {
    navigate(`/wizard/${stepKey}`, { replace: true });
  }

  const handleNext = useCallback(async (data) => {
    setError('');
    const stepKey = currentStep.key;

    // Save to server for backend-tracked steps
    if (SERVER_STEPS.includes(stepKey)) {
      setSaving(true);
      try {
        await saveStep(stepKey, data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to save. Please try again.');
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    setSavedData(prev => ({ ...prev, [stepKey]: data }));

    if (currentStepIdx < STEPS.length - 2) {
      // Move to next step
      const nextStep = STEPS[currentStepIdx + 1];
      setCurrentStepIdx(currentStepIdx + 1);
      updateUrl(nextStep.key);
    } else if (currentStep.key === 'cycle') {
      // All steps done — call complete
      setSaving(true);
      try {
        const result = await completeWizard();
        if (result.token) updateToken(result.token);
        setCurrentStepIdx(STEPS.length - 1);
        updateUrl('done');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to complete setup.');
      }
      setSaving(false);
    }
  }, [currentStep, currentStepIdx, navigate, updateToken]);

  const handleBack = useCallback(() => {
    if (currentStepIdx > 0) {
      const prevStep = STEPS[currentStepIdx - 1];
      setCurrentStepIdx(currentStepIdx - 1);
      updateUrl(prevStep.key);
    }
  }, [currentStepIdx, navigate]);

  const StepComponent = currentStep?.component;

  // Percentage complete (excluding 'done' step)
  const totalSteps = STEPS.length - 1;
  const pct = Math.round((currentStepIdx / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top progress bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">P</div>
              <span className="font-semibold text-slate-800">Organization Setup</span>
            </div>
            <span className="text-sm text-slate-500">
              {currentStep.key === 'done' ? 'Complete!' : `Step ${currentStepIdx + 1} of ${totalSteps}`}
            </span>
          </div>

          {/* Step pills */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {STEPS.slice(0, -1).map((step, idx) => {
              const isDone      = status?.completed_steps?.includes(step.key);
              const isCurrent   = idx === currentStepIdx;
              const isAccessible = idx <= currentStepIdx || isDone;

              return (
                <button
                  key={step.key}
                  onClick={() => isAccessible && (setCurrentStepIdx(idx), updateUrl(step.key))}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isDone
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-400'
                  } ${isAccessible ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed'}`}
                >
                  {isDone && !isCurrent ? '✓ ' : `${idx + 1}. `}{step.label}
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      {/* Step content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {StepComponent && (
          <StepComponent
            initialData={savedData[currentStep?.key]}
            allData={savedData}
            onNext={handleNext}
            onBack={currentStepIdx > 0 ? handleBack : null}
            saving={saving}
            orgId={employee?.org_id}
          />
        )}
      </main>
    </div>
  );
}
