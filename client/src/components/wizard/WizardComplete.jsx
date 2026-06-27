import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useAuthStore } from '../../store/authStore';

export default function WizardComplete({ allData }) {
  const navigate = useNavigate();
  const { employee } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 space-y-6">
      {/* Success animation */}
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-5xl">
        🎉
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Setup Complete!</h2>
        <p className="text-slate-500 max-w-md">
          Your organization is configured and ready. Your first review cycle has been created.
          Employees can now log in and start setting their targets.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md text-left space-y-3">
        <div className="text-sm font-medium text-slate-700">What was configured:</div>
        {[
          ['Industry',    allData?.industry?.industry?.toUpperCase()                      || '—'],
          ['Framework',   allData?.framework?.framework?.replace('_',' ').toUpperCase()   || '—'],
          ['Cascade Mode',allData?.cascade?.cascade_mode?.replace('_',' ')                || '—'],
          ['Rating Scale',allData?.rating?.rating_scale?.goals?.type?.replace('_',' ')   || '—'],
          ['Goal Weight', allData?.weightage ? `${allData.weightage.weightage?.goals_percent ?? 70}%` : '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-800 capitalize">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button size="lg" onClick={() => navigate('/dashboard')}>
          Go to Dashboard →
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate('/cycles')}>
          View Cycles
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        You can change any setting from <strong>Org Settings</strong> at any time.
      </p>
    </div>
  );
}
