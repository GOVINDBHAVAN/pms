import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { getOrgSettings, updateOrgSettings } from '../api/orgApi';

const FRAMEWORKS = [
  { value: 'okr',               label: 'OKR (Objectives & Key Results)' },
  { value: 'kra_kpi',           label: 'KRA / KPI' },
  { value: 'goals',             label: 'Goals (Simple & Direct)' },
  { value: 'competency',        label: 'Competency-Based' },
  { value: 'balanced_scorecard',label: 'Balanced Scorecard' },
  { value: 'hybrid',            label: 'Hybrid (Recommended)' },
  { value: 'custom',            label: 'Custom' },
];

const CASCADE_MODES = [
  { value: 'top_down',      label: 'Top-Down' },
  { value: 'bottom_up',     label: 'Bottom-Up' },
  { value: 'bidirectional', label: 'Bidirectional' },
];

const RATING_TYPES = [
  { value: '5_point',              label: '5-Point Scale' },
  { value: '3_point',              label: '3-Point Scale' },
  { value: 'percentage',           label: 'Percentage (0–100%)' },
  { value: 'percentage_achievement',label: 'Percentage Achievement' },
  { value: 'percentage_of_target', label: 'Percentage of Target' },
  { value: 'bars',                 label: 'BARS (Behaviorally Anchored)' },
  { value: 'custom',               label: 'Custom Labels' },
];

const ALL_ACTIVE_TYPES = [
  { value: 'okr_objective', label: 'OKR Objective' },
  { value: 'okr_kr',        label: 'OKR Key Result' },
  { value: 'kra',           label: 'KRA' },
  { value: 'kpi',           label: 'KPI' },
  { value: 'goal',          label: 'Goal' },
  { value: 'competency',    label: 'Competency' },
  { value: 'bsc_metric',    label: 'BSC Metric' },
  { value: 'custom_metric', label: 'Custom Metric' },
];

const TERMINOLOGY_KEYS = [
  { key: 'kra',              label: 'KRA' },
  { key: 'kpi',              label: 'KPI' },
  { key: 'objective',        label: 'Objective' },
  { key: 'key_result',       label: 'Key Result' },
  { key: 'goal',             label: 'Goal' },
  { key: 'competency',       label: 'Competency' },
  { key: 'weight',           label: 'Weight' },
  { key: 'planned',          label: 'Planned Target' },
  { key: 'actual',           label: 'Actual Achievement' },
  { key: 'stretch',          label: 'Stretch Target' },
  { key: 'performance_band', label: 'Performance Band' },
];

const BAND_COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626', '#7f1d1d', '#7c3aed', '#0891b2'];

const TABS = ['General', 'Rating Scale', 'Weightage', 'Terminology', 'Performance Bands', 'Target Rules'];

export default function OrgSettingsPage() {
  const [activeTab, setActiveTab] = useState('General');
  const [org, setOrg] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrgSettings()
      .then(data => {
        setOrg(data);
        setSettings(data.settings || {});
      })
      .catch(e => setError(e?.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateOrgSettings({
        name: org.name,
        industry: settings.industry || org.industry,
        framework: settings.framework || org.framework,
        cascade_mode: settings.cascade_mode || org.cascade_mode,
        settings,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppLayout><div className="text-slate-400 p-8">Loading settings…</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Org Settings</h1>
            <p className="text-slate-500 text-sm mt-0.5">{org?.name}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {activeTab === 'General'         && <GeneralTab org={org} settings={settings} onChange={updateSettings} />}
          {activeTab === 'Rating Scale'    && <RatingScaleTab settings={settings} onChange={updateSettings} />}
          {activeTab === 'Weightage'       && <WeightageTab settings={settings} onChange={updateSettings} />}
          {activeTab === 'Terminology'     && <TerminologyTab settings={settings} onChange={updateSettings} />}
          {activeTab === 'Performance Bands' && <BandsTab settings={settings} onChange={updateSettings} />}
          {activeTab === 'Target Rules'    && <TargetRulesTab settings={settings} onChange={updateSettings} />}
        </div>
      </div>
    </AppLayout>
  );
}

/* ── General Tab ─────────────────────────────────────────────────────────── */
function GeneralTab({ org, settings, onChange }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Field label="Framework">
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={settings.framework || ''}
            onChange={e => onChange({ framework: e.target.value })}
          >
            {FRAMEWORKS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>

        <Field label="Cascade Mode">
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={settings.cascade_mode || ''}
            onChange={e => onChange({ cascade_mode: e.target.value })}
          >
            {CASCADE_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Active Performance Types" hint="Select which types employees can use when setting targets">
        <div className="grid grid-cols-2 gap-2 mt-1">
          {ALL_ACTIVE_TYPES.map(t => (
            <label key={t.value} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                className="rounded"
                checked={(settings.active_types || []).includes(t.value)}
                onChange={e => {
                  const cur = settings.active_types || [];
                  onChange({
                    active_types: e.target.checked
                      ? [...cur, t.value]
                      : cur.filter(v => v !== t.value),
                  });
                }}
              />
              {t.label}
            </label>
          ))}
        </div>
      </Field>

      {(settings.framework === 'balanced_scorecard' || settings.active_types?.includes('bsc_metric')) && (
        <Field label="BSC Perspectives" hint="Comma-separated list of BSC perspective names">
          <div className="space-y-2">
            {(settings.bsc_perspectives || ['Financial', 'Customer', 'Internal Process', 'Learning & Growth']).map((p, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={p}
                  onChange={e => {
                    const arr = [...(settings.bsc_perspectives || [])];
                    arr[i] = e.target.value;
                    onChange({ bsc_perspectives: arr });
                  }}
                />
                <button
                  className="text-red-400 hover:text-red-600 px-2"
                  onClick={() => {
                    const arr = (settings.bsc_perspectives || []).filter((_, idx) => idx !== i);
                    onChange({ bsc_perspectives: arr });
                  }}
                >✕</button>
              </div>
            ))}
            <button
              className="text-indigo-600 text-sm hover:underline"
              onClick={() => onChange({ bsc_perspectives: [...(settings.bsc_perspectives || []), ''] })}
            >
              + Add Perspective
            </button>
          </div>
        </Field>
      )}

      <Field label="Cycle Defaults">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Default Type</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={settings.cycle_defaults?.type || 'annual'}
              onChange={e => onChange({ cycle_defaults: { ...settings.cycle_defaults, type: e.target.value } })}
            >
              {['annual','half_yearly','quarterly','monthly','custom'].map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Goal-Setting Days</label>
            <input
              type="number" min="1"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={settings.cycle_defaults?.goal_setting_days || 30}
              onChange={e => onChange({ cycle_defaults: { ...settings.cycle_defaults, goal_setting_days: +e.target.value } })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Review Days</label>
            <input
              type="number" min="1"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={settings.cycle_defaults?.review_days || 21}
              onChange={e => onChange({ cycle_defaults: { ...settings.cycle_defaults, review_days: +e.target.value } })}
            />
          </div>
        </div>
      </Field>
    </div>
  );
}

/* ── Rating Scale Tab ────────────────────────────────────────────────────── */
function RatingScaleTab({ settings, onChange }) {
  const ratingScale = settings.rating_scale || {};

  const updateScale = (kind, patch) => {
    onChange({ rating_scale: { ...ratingScale, [kind]: { ...(ratingScale[kind] || {}), ...patch } } });
  };

  return (
    <div className="space-y-8">
      <RatingScaleSection
        title="Goals / KRA / KPI Rating Scale"
        scale={ratingScale.goals || {}}
        onUpdate={patch => updateScale('goals', patch)}
      />
      <div className="border-t border-slate-100 pt-6">
        <RatingScaleSection
          title="Competency Rating Scale"
          scale={ratingScale.competency || {}}
          onUpdate={patch => updateScale('competency', patch)}
        />
      </div>
    </div>
  );
}

function RatingScaleSection({ title, scale, onUpdate }) {
  const labels = scale.labels || [];
  const values = scale.values || [];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <Field label="Scale Type">
        <select
          className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={scale.type || '5_point'}
          onChange={e => onUpdate({ type: e.target.value })}
        >
          {RATING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>

      <Field label="Scale Labels & Values" hint="One row per rating level, from lowest to highest">
        <div className="space-y-2 mt-1">
          <div className="grid grid-cols-[1fr_80px_32px] gap-2 text-xs text-slate-400 px-1">
            <span>Label</span><span>Value</span><span></span>
          </div>
          {labels.map((lbl, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_32px] gap-2 items-center">
              <input
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                value={lbl}
                onChange={e => {
                  const arr = [...labels]; arr[i] = e.target.value;
                  onUpdate({ labels: arr });
                }}
              />
              <input
                type="number" step="0.1"
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                value={values[i] ?? ''}
                onChange={e => {
                  const arr = [...values]; arr[i] = parseFloat(e.target.value);
                  onUpdate({ values: arr });
                }}
              />
              <button
                className="text-red-400 hover:text-red-600 text-sm"
                onClick={() => {
                  onUpdate({
                    labels: labels.filter((_, idx) => idx !== i),
                    values: values.filter((_, idx) => idx !== i),
                  });
                }}
              >✕</button>
            </div>
          ))}
          <button
            className="text-indigo-600 text-sm hover:underline"
            onClick={() => onUpdate({ labels: [...labels, ''], values: [...values, labels.length + 1] })}
          >
            + Add Level
          </button>
        </div>
      </Field>

      {scale.type?.includes('point') && (
        <Field label="PIP Threshold" hint="Employees scoring at or below this value trigger a PIP flag">
          <input
            type="number" step="0.5" min="0"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-24"
            value={scale.pip_below ?? ''}
            onChange={e => onUpdate({ pip_below: parseFloat(e.target.value) })}
          />
        </Field>
      )}
    </div>
  );
}

/* ── Weightage Tab ───────────────────────────────────────────────────────── */
function WeightageTab({ settings, onChange }) {
  const w = settings.weightage || { goals_percent: 70, competency_percent: 30 };
  const goalsVal = w.goals_percent ?? 70;

  const handleGoalsChange = (val) => {
    const g = Math.min(100, Math.max(0, +val));
    onChange({ weightage: { goals_percent: g, competency_percent: 100 - g } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">Goals vs Competency Split</h3>
        <p className="text-sm text-slate-500">
          Determines how much each category contributes to an employee's final performance score.
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-6 space-y-5">
        <div className="flex gap-6 items-center">
          <div className="flex-1">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-indigo-700">Goals / KRA / KPI</span>
              <span className="text-indigo-700">{goalsVal}%</span>
            </div>
            <input
              type="range" min="0" max="100" step="5"
              value={goalsVal}
              onChange={e => handleGoalsChange(e.target.value)}
              className="w-full accent-indigo-600"
            />
          </div>
          <div className="w-20">
            <input
              type="number" min="0" max="100"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-center"
              value={goalsVal}
              onChange={e => handleGoalsChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-6 items-center">
          <div className="flex-1">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-purple-700">Competency</span>
              <span className="text-purple-700">{w.competency_percent ?? 30}%</span>
            </div>
            <div className="w-full h-2 bg-purple-200 rounded-full">
              <div
                className="h-2 bg-purple-500 rounded-full transition-all"
                style={{ width: `${w.competency_percent ?? 30}%` }}
              />
            </div>
          </div>
          <div className="w-20">
            <input
              type="number" min="0" max="100"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-center"
              value={w.competency_percent ?? 30}
              onChange={e => handleGoalsChange(100 - +e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-indigo-100 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-indigo-700">{goalsVal}%</div>
            <div className="text-xs text-indigo-600">Goals</div>
          </div>
          <div className="flex items-center text-slate-400 font-bold">+</div>
          <div className="flex-1 bg-purple-100 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{w.competency_percent ?? 30}%</div>
            <div className="text-xs text-purple-600">Competency</div>
          </div>
          <div className="flex items-center text-slate-400 font-bold">=</div>
          <div className="flex-1 bg-slate-200 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-700">100%</div>
            <div className="text-xs text-slate-500">Final Score</div>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Note: These percentages apply to every employee's final score across all cycles.
        You can update them for individual cycles from the Cycle Settings page.
      </p>
    </div>
  );
}

/* ── Terminology Tab ─────────────────────────────────────────────────────── */
function TerminologyTab({ settings, onChange }) {
  const terms = settings.terminology || {};

  const updateTerm = (key, value) => {
    onChange({ terminology: { ...terms, [key]: value } });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">Custom Terminology</h3>
        <p className="text-sm text-slate-500">
          Rename system terms to match your organization's language. Changes apply org-wide.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">System Term</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Your Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TERMINOLOGY_KEYS.map(({ key, label }) => (
              <tr key={key} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600 font-medium">{label}</td>
                <td className="px-4 py-3">
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder={`Leave blank to use "${label}"`}
                    value={terms[key] || ''}
                    onChange={e => updateTerm(key, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Performance Bands Tab ───────────────────────────────────────────────── */
function BandsTab({ settings, onChange }) {
  const bands = settings.performance_bands || [];

  const updateBand = (i, patch) => {
    const arr = bands.map((b, idx) => idx === i ? { ...b, ...patch } : b);
    onChange({ performance_bands: arr });
  };

  const addBand = () => {
    onChange({
      performance_bands: [...bands, { label: 'New Band', min: 0, max: 1, color: '#6b7280' }],
    });
  };

  const removeBand = (i) => {
    onChange({ performance_bands: bands.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">Performance Bands</h3>
        <p className="text-sm text-slate-500">
          Map final scores to performance labels. Ranges should not overlap and collectively cover 0–5 (or 0–100% if using percentage scale).
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[2fr_1fr_1fr_80px_32px] gap-3 text-xs text-slate-400 px-1">
          <span>Band Label</span><span>Min Score</span><span>Max Score</span><span>Color</span><span></span>
        </div>
        {bands.map((band, i) => (
          <div key={i} className="grid grid-cols-[2fr_1fr_1fr_80px_32px] gap-3 items-center">
            <input
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={band.label}
              onChange={e => updateBand(i, { label: e.target.value })}
            />
            <input
              type="number" step="0.01" min="0"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={band.min}
              onChange={e => updateBand(i, { min: parseFloat(e.target.value) })}
            />
            <input
              type="number" step="0.01" min="0"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={band.max}
              onChange={e => updateBand(i, { max: parseFloat(e.target.value) })}
            />
            <div className="flex items-center gap-1">
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                value={band.color}
                onChange={e => updateBand(i, { color: e.target.value })}
              />
              <span
                className="text-xs px-2 py-0.5 rounded-full text-white font-medium truncate"
                style={{ background: band.color }}
              >
                {band.label.slice(0, 8)}
              </span>
            </div>
            <button
              className="text-red-400 hover:text-red-600 text-sm"
              onClick={() => removeBand(i)}
            >✕</button>
          </div>
        ))}
      </div>

      <button onClick={addBand} className="text-indigo-600 text-sm hover:underline">
        + Add Band
      </button>

      {/* Preview */}
      {bands.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-2">Preview</p>
          <div className="flex gap-2 flex-wrap">
            {bands.map((b, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-white text-xs font-medium"
                style={{ background: b.color }}
              >
                {b.label} ({b.min}–{b.max})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Target Rules Tab ────────────────────────────────────────────────────── */
function TargetRulesTab({ settings, onChange }) {
  const rules = settings.target_rules || {};

  const update = (patch) => onChange({ target_rules: { ...rules, ...patch } });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">Target Rules</h3>
        <p className="text-sm text-slate-500">
          Configure constraints on how employees can set and submit performance targets.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Field label="Minimum Target Weight (%)" hint="Warn when a single target has less than this weight">
          <input
            type="number" min="1" max="100"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={rules.min_target_weight ?? 5}
            onChange={e => update({ min_target_weight: +e.target.value })}
          />
        </Field>

        <Field label="Maximum Target Weight (%)" hint="Warn when a single target has more than this weight">
          <input
            type="number" min="1" max="100"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={rules.max_target_weight ?? 50}
            onChange={e => update({ max_target_weight: +e.target.value })}
          />
        </Field>
      </div>

      <div className="border border-slate-200 rounded-xl p-4 space-y-4">
        <h4 className="font-medium text-slate-700">Over-Planning Rules</h4>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="rounded"
            checked={rules.overplan_allowed ?? true}
            onChange={e => update({ overplan_allowed: e.target.checked })}
          />
          <div>
            <div className="text-sm font-medium text-slate-700">Allow Over-Planning</div>
            <div className="text-xs text-slate-400">
              Employees can commit to more than their manager's planned target (with justification)
            </div>
          </div>
        </label>

        {(rules.overplan_allowed ?? true) && (
          <Field
            label="Maximum Over-Plan Multiplier"
            hint="E.g. 1.15 means team total can be up to 15% above the manager's target before a warning"
          >
            <div className="flex items-center gap-3">
              <input
                type="number" min="1.0" max="2.0" step="0.05"
                className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={rules.overplan_max_multiplier ?? 1.15}
                onChange={e => update({ overplan_max_multiplier: parseFloat(e.target.value) })}
              />
              <span className="text-sm text-slate-500">
                = {(((rules.overplan_max_multiplier ?? 1.15) - 1) * 100).toFixed(0)}% above parent target
              </span>
            </div>
          </Field>
        )}
      </div>

      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <h4 className="font-medium text-slate-700">Linkage & Proposal Rules</h4>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="rounded"
            checked={rules.require_parent_linkage ?? true}
            onChange={e => update({ require_parent_linkage: e.target.checked })}
          />
          <div>
            <div className="text-sm font-medium text-slate-700">Require Parent Linkage</div>
            <div className="text-xs text-slate-400">
              Every approved target must be linked to a parent target in the hierarchy
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="rounded"
            checked={rules.allow_self_propose ?? true}
            onChange={e => update({ allow_self_propose: e.target.checked })}
          />
          <div>
            <div className="text-sm font-medium text-slate-700">Allow Self-Propose (Bottom-Up)</div>
            <div className="text-xs text-slate-400">
              Employees can propose their own targets for manager review
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function Field({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}
