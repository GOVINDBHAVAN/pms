import { Button } from '../ui/button';

export default function WizardNav({ onBack, onNext, saving, nextLabel = 'Next →', canNext = true }) {
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200">
      {onBack ? (
        <Button variant="outline" onClick={onBack} disabled={saving}>
          ← Back
        </Button>
      ) : (
        <div />
      )}
      <Button onClick={onNext} disabled={saving || !canNext}>
        {saving ? 'Saving…' : nextLabel}
      </Button>
    </div>
  );
}
