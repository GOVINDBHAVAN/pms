import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { getOrgSettings, updateOrgSettings } from '../api/orgApi';
import InfoIcon from '../components/shared/InfoIcon';
import PerformanceTypeModal from '../components/shared/PerformanceTypeModal';
import SettingInfoModal from '../components/shared/SettingInfoModal';
import { HELP } from '../utils/helpContent';

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

const ACTIVE_TYPE_GROUPS = [
  {
    id: 'okr',
    label: 'OKR — Objective + Key Result',
    values: ['okr_objective', 'okr_kr'],
    paired: true,
    hint: 'Objectives set the direction; Key Results measure progress. These two are always used together — an Objective without Key Results has no measurable success criteria.',
    infoKey: 'okr_objective',
  },
  {
    id: 'kra_kpi',
    label: 'KRA + KPI',
    values: ['kra', 'kpi'],
    paired: true,
    hint: 'KPIs are metrics measured within the scope of a Key Result Area. A KPI always lives under a KRA parent, so they are always enabled as a pair.',
    infoKey: 'kra',
  },
  {
    id: 'goal',
    label: 'Goal (Simple Target)',
    values: ['goal'],
    paired: false,
    hint: 'A standalone output-based target — use when OKR or KRA/KPI structure is not needed.',
    infoKey: 'goal',
  },
  {
    id: 'competency',
    label: 'Competency',
    values: ['competency'],
    paired: false,
    hint: 'Behavioral and skills-based targets. Scored separately from goal-type targets and combined via the Weightage split.',
    infoKey: 'competency',
  },
  {
    id: 'bsc_metric',
    label: 'BSC Metric',
    values: ['bsc_metric'],
    paired: false,
    hint: 'Balanced Scorecard metric mapped to one of four strategic perspectives (Financial, Customer, Internal Process, Learning & Growth).',
    infoKey: 'bsc_metric',
    requiresFrameworks: ['balanced_scorecard', 'hybrid'],
  },
  {
    id: 'custom_metric',
    label: 'Custom Metric',
    values: ['custom_metric'],
    paired: false,
    hint: 'Define your own target type with a custom label for org-specific needs not covered by other types.',
    infoKey: 'custom_metric',
  },
];

const GOAL_TYPES = new Set(['okr_objective', 'okr_kr', 'kra', 'kpi', 'goal', 'bsc_metric', 'custom_metric']);

function getTypeStatus(active_types = []) {
  const hasGoals = active_types.some(t => GOAL_TYPES.has(t));
  const hasComp = active_types.includes('competency');
  return {
    hasGoals,
    hasComp,
    compOnly: !hasGoals && hasComp,
    goalsOnly: hasGoals && !hasComp,
    mixed: hasGoals && hasComp,
    empty: !hasGoals && !hasComp,
  };
}

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

const BASE_TABS = ['General', 'Rating Scale', 'Weightage', 'Terminology', 'Performance Bands', 'Target Rules'];

export default function OrgSettingsPage() {
  const [activeTab, setActiveTab] = useState('General');
  const [org, setOrg] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const tabs = settings?.ninebox_enabled
    ? [...BASE_TABS, 'Talent Grid']
    : BASE_TABS;
  const typeStatus = settings ? getTypeStatus(settings.active_types) : {};
  const isWeightageAuto = typeStatus.compOnly || typeStatus.goalsOnly;

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
            {tabs.map(tab => {
              const isAuto = tab === 'Weightage' && isWeightageAuto;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors inline-flex items-center gap-1.5 ${
                    activeTab === tab
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                  {isAuto && (
                    <span className="text-[10px] bg-amber-100 text-amber-600 rounded px-1.5 py-0.5 font-medium leading-none">Auto</span>
                  )}
                </button>
              );
            })}
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
          {activeTab === 'Talent Grid'     && <TalentGridTab settings={settings} onChange={updateSettings} />}
        </div>
      </div>
    </AppLayout>
  );
}

/* ── General Tab ─────────────────────────────────────────────────────────── */
function GeneralTab({ org, settings, onChange }) {
  const [typeModal, setTypeModal] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const openModal = (key) => setActiveModal(key);

  return (
    <div className="space-y-6">
      {typeModal && (
        <PerformanceTypeModal
          info={HELP.performanceTypes[typeModal]}
          onClose={() => setTypeModal(null)}
        />
      )}
      {activeModal && (
        <SettingInfoModal
          info={HELP.settingModals[activeModal]}
          onClose={() => setActiveModal(null)}
        />
      )}

      <div className="grid grid-cols-2 gap-6">
        <Field label="Framework" info={HELP.orgSettings.framework} onLearnMore={() => openModal('framework')}>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={settings.framework || ''}
            onChange={e => onChange({ framework: e.target.value })}
          >
            {FRAMEWORKS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>

        <Field label="Cascade Mode" info={HELP.orgSettings.cascadeMode} onLearnMore={() => openModal('cascade_mode')}>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={settings.cascade_mode || ''}
            onChange={e => onChange({ cascade_mode: e.target.value })}
          >
            {CASCADE_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Active Performance Types" hint="Select which types employees can use when setting targets. Paired types (marked below) are always enabled together." info={HELP.orgSettings.activeTypes}>
        <div className="space-y-2 mt-1">
          {ACTIVE_TYPE_GROUPS.map(group => {
            const activeTypes = settings.active_types || [];
            const allChecked = group.values.every(v => activeTypes.includes(v));
            const isBscWarning = group.requiresFrameworks && allChecked &&
              !group.requiresFrameworks.includes(settings.framework);

            const handleToggle = (checked) => {
              const cur = settings.active_types || [];
              const newTypes = checked
                ? [...new Set([...cur, ...group.values])]
                : cur.filter(v => !group.values.includes(v));
              onChange({ active_types: newTypes });
            };

            return (
              <label
                key={group.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isBscWarning
                    ? 'border-amber-300 bg-amber-50'
                    : allChecked
                      ? 'border-indigo-200 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="rounded mt-0.5 cursor-pointer flex-shrink-0"
                  checked={allChecked}
                  onChange={e => handleToggle(e.target.checked)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className={`text-sm font-medium ${allChecked ? 'text-slate-800' : 'text-slate-600'}`}>
                      {group.label}
                    </span>
                    {group.paired && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5 font-medium whitespace-nowrap">
                        always paired
                      </span>
                    )}
                    {HELP.performanceTypes[group.infoKey] && (
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); setTypeModal(group.infoKey); }}
                        title={`Learn about ${group.label}`}
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 text-[10px] font-bold leading-none transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 flex-shrink-0"
                      >i</button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{group.hint}</p>
                  {isBscWarning && (
                    <p className="text-xs text-amber-700 mt-1 font-medium">
                      ⚠ BSC Metric works best with the Balanced Scorecard or Hybrid framework. Current framework: <strong>{settings.framework || 'none'}</strong>.
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
        {(() => {
          const ts = getTypeStatus(settings.active_types);
          if (ts.empty) return (
            <p className="text-xs text-red-500 mt-2">⚠ No performance types selected — at least one type is required.</p>
          );
          if (ts.compOnly) return (
            <p className="text-xs text-amber-600 mt-2">
              Only Competency is active — the Weightage tab will auto-set to 0% Goals / 100% Competency.
            </p>
          );
          if (ts.goalsOnly) return (
            <p className="text-xs text-amber-600 mt-2">
              No Competency type active — the Weightage tab will auto-set to 100% Goals / 0% Competency.
            </p>
          );
          return null;
        })()}
      </Field>

      {(settings.framework === 'balanced_scorecard' || settings.active_types?.includes('bsc_metric')) && (
        <Field label="BSC Perspectives" hint="Names of the four strategic dimensions each BSC Metric will be tagged to" info={HELP.orgSettings.bscPerspectives} onLearnMore={() => openModal('bsc_perspectives')}>
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

      {(settings.framework === 'balanced_scorecard' || settings.active_types?.includes('bsc_metric')) && (
        <Field
          label="BSC Perspective Weights (%)"
          hint="Relative importance of each perspective in the final BSC score — must total 100%"
          info={HELP.orgSettings.bscPerspectiveWeights}
          onLearnMore={() => openModal('bsc_perspective_weights')}
        >
          {(() => {
            const perspectives = settings.bsc_perspectives?.length
              ? settings.bsc_perspectives
              : ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];
            const weights = settings.bsc_perspective_weights || {};
            const total = perspectives.reduce((s, p) => s + (weights[p] ?? 0), 0);
            return (
              <div className="space-y-2">
                {perspectives.map(p => (
                  <div key={p} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-44 truncate">{p}</span>
                    <input
                      type="number" min="0" max="100"
                      className="w-20 border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                      value={weights[p] ?? Math.round(100 / perspectives.length)}
                      onChange={e => onChange({
                        bsc_perspective_weights: { ...weights, [p]: +e.target.value },
                      })}
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                ))}
                <p className={`text-xs font-medium mt-1 ${total === 100 ? 'text-green-600' : 'text-red-500'}`}>
                  Total: {total}% {total === 100 ? '✓' : '— must equal 100%'}
                </p>
              </div>
            );
          })()}
        </Field>
      )}

      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <h4 className="font-medium text-slate-700">9-Box Talent Grid</h4>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="rounded mt-0.5"
            checked={settings.ninebox_enabled ?? false}
            onChange={e => onChange({ ninebox_enabled: e.target.checked })}
          />
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
              Enable 9-Box Talent Grid
              <InfoIcon title="9-Box Talent Grid" content={HELP.orgSettings.nineboxEnabled} />
              <button type="button" onClick={() => openModal('ninebox_enabled')} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 leading-none">Learn more</button>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Adds Performance × Potential matrix to calibration. Unlocks the Talent Grid settings tab.
            </div>
          </div>
        </label>
      </div>

      <Field label="Cycle Defaults" info="Default values pre-filled when HR creates a new review cycle. These save time but can be overridden per cycle.">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-0.5 text-xs text-slate-500 mb-1">
              Default Type
              <InfoIcon title="Default Cycle Type" content={HELP.orgSettings.cycleDefaultType} />
              <button type="button" onClick={() => openModal('cycle_default_type')} className="ml-1 text-[10px] text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 leading-none">Learn more</button>
            </div>
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
            <div className="flex items-center gap-0.5 text-xs text-slate-500 mb-1">
              Goal-Setting Days
              <InfoIcon title="Goal-Setting Days" content={HELP.orgSettings.goalSettingDays} />
              <button type="button" onClick={() => openModal('goal_setting_days')} className="ml-1 text-[10px] text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 leading-none">Learn more</button>
            </div>
            <input
              type="number" min="1"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={settings.cycle_defaults?.goal_setting_days || 30}
              onChange={e => onChange({ cycle_defaults: { ...settings.cycle_defaults, goal_setting_days: +e.target.value } })}
            />
          </div>
          <div>
            <div className="flex items-center gap-0.5 text-xs text-slate-500 mb-1">
              Review Days
              <InfoIcon title="Review Days" content={HELP.orgSettings.reviewDays} />
              <button type="button" onClick={() => openModal('review_days')} className="ml-1 text-[10px] text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 leading-none">Learn more</button>
            </div>
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
  const [activeModal, setActiveModal] = useState(null);
  const ratingScale = settings.rating_scale || {};
  const typeStatus = getTypeStatus(settings.active_types);

  const updateScale = (kind, patch) => {
    onChange({ rating_scale: { ...ratingScale, [kind]: { ...(ratingScale[kind] || {}), ...patch } } });
  };

  return (
    <div className="space-y-8">
      {activeModal && (
        <SettingInfoModal
          info={HELP.settingModals[activeModal]}
          onClose={() => setActiveModal(null)}
        />
      )}

      {typeStatus.hasGoals ? (
        <RatingScaleSection
          title="Goals / KRA / KPI Rating Scale"
          scale={ratingScale.goals || {}}
          onUpdate={patch => updateScale('goals', patch)}
          sectionHelp={HELP.ratingScale.goalsScaleSection}
          keyPrefix="goals"
          onOpenModal={setActiveModal}
        />
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-4">
          <p className="text-sm font-medium text-slate-500 mb-1">Goals / KRA / KPI Rating Scale</p>
          <p className="text-xs text-slate-400">
            No goal-type performance targets are active. Enable OKR, KRA/KPI, Goal, BSC Metric, or Custom Metric in the General tab to configure goal ratings.
          </p>
        </div>
      )}

      <div className="border-t border-slate-100 pt-6">
        {typeStatus.hasComp ? (
          <RatingScaleSection
            title="Competency Rating Scale"
            scale={ratingScale.competency || {}}
            onUpdate={patch => updateScale('competency', patch)}
            sectionHelp={HELP.ratingScale.competencyScaleSection}
            keyPrefix="comp"
            onOpenModal={setActiveModal}
          />
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-4">
            <p className="text-sm font-medium text-slate-500 mb-1">Competency Rating Scale</p>
            <p className="text-xs text-slate-400">
              Competency is not an active type. Enable it in the General tab to configure competency ratings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingScaleSection({ title, scale, onUpdate, sectionHelp, keyPrefix, onOpenModal }) {
  const labels = scale.labels || [];
  const values = scale.values || [];

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-1 font-semibold text-slate-800">
        {title}
        {sectionHelp && <InfoIcon title={title} content={sectionHelp} />}
      </h3>
      <Field label="Scale Type" info={HELP.ratingScale.scaleType} onLearnMore={() => onOpenModal(`${keyPrefix}_scale_type`)}>
        <select
          className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={scale.type || '5_point'}
          onChange={e => onUpdate({ type: e.target.value })}
        >
          {RATING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>

      <Field label="Scale Labels & Values" hint="One row per rating level, from lowest to highest" info={HELP.ratingScale.scaleLabelsValues} onLearnMore={() => onOpenModal(`${keyPrefix}_scale_labels`)}>
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
        <Field label="PIP Threshold" hint="Employees scoring at or below this value trigger a PIP flag" info={HELP.ratingScale.pipThreshold} onLearnMore={() => onOpenModal(`${keyPrefix}_pip`)}>
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
  const [activeModal, setActiveModal] = useState(null);
  const typeStatus = getTypeStatus(settings.active_types);
  const isLocked = typeStatus.compOnly || typeStatus.goalsOnly;

  useEffect(() => {
    if (typeStatus.compOnly) {
      onChange({ weightage: { goals_percent: 0, competency_percent: 100 } });
    } else if (typeStatus.goalsOnly) {
      onChange({ weightage: { goals_percent: 100, competency_percent: 0 } });
    }
  }, [settings.active_types, onChange]);

  const w = settings.weightage || { goals_percent: 70, competency_percent: 30 };
  const goalsVal = w.goals_percent ?? 70;

  const handleGoalsChange = (val) => {
    if (isLocked) return;
    const g = Math.min(100, Math.max(0, +val));
    onChange({ weightage: { goals_percent: g, competency_percent: 100 - g } });
  };

  return (
    <div className="space-y-6">
      {activeModal && (
        <SettingInfoModal
          info={HELP.settingModals[activeModal]}
          onClose={() => setActiveModal(null)}
        />
      )}
      <div>
        <h3 className="flex items-center gap-1 font-semibold text-slate-800 mb-1">
          Goals vs Competency Split
          <InfoIcon title="Weightage Split" content={HELP.weightage.split} />
          <button type="button" onClick={() => setActiveModal('weightage_split')} className="ml-1 text-[10px] text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 leading-none">Learn more</button>
        </h3>
        <p className="text-sm text-slate-500">
          Determines how much each category contributes to an employee's final performance score.
        </p>
      </div>

      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          {typeStatus.compOnly
            ? <>Only <strong>Competency</strong> is active. Goal weight is automatically <strong>0%</strong> and Competency is <strong>100%</strong>. Enable a goal-type (OKR, KRA/KPI, Goal, etc.) in the General tab to configure a custom split.</>
            : <>No <strong>Competency</strong> type is active. Goal weight is automatically <strong>100%</strong> and Competency is <strong>0%</strong>. Enable Competency in the General tab to configure a custom split.</>
          }
        </div>
      )}

      <div className={`bg-slate-50 rounded-xl p-6 space-y-5 ${isLocked ? 'opacity-60 pointer-events-none select-none' : ''}`}>
        <div className="flex gap-6 items-center">
          <div className="flex-1">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="flex items-center gap-1 text-indigo-700">
                Goals / KRA / KPI
                <InfoIcon title="Goals Weight" content={HELP.weightage.goalsPercent} />
              </span>
              <span className="text-indigo-700">{goalsVal}%</span>
            </div>
            <input
              type="range" min="0" max="100" step="5"
              value={goalsVal}
              onChange={e => handleGoalsChange(e.target.value)}
              className="w-full accent-indigo-600"
              disabled={isLocked}
            />
          </div>
          <div className="w-20">
            <input
              type="number" min="0" max="100"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-center"
              value={goalsVal}
              onChange={e => handleGoalsChange(e.target.value)}
              disabled={isLocked}
            />
          </div>
        </div>

        <div className="flex gap-6 items-center">
          <div className="flex-1">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="flex items-center gap-1 text-purple-700">
                Competency
                <InfoIcon title="Competency Weight" content={HELP.weightage.competencyPercent} />
              </span>
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
              disabled={isLocked}
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
  const [activeModal, setActiveModal] = useState(null);
  const terms = settings.terminology || {};

  const updateTerm = (key, value) => {
    onChange({ terminology: { ...terms, [key]: value } });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-1 font-semibold text-slate-800 mb-1">
          Custom Terminology
          <InfoIcon title="Custom Terminology" content={HELP.terminology.section} />
        </h3>
        <p className="text-sm text-slate-500">
          Rename system terms to match your organization's language. Changes apply org-wide.
        </p>
      </div>

      {activeModal && (
        <SettingInfoModal
          info={HELP.settingModals[activeModal]}
          onClose={() => setActiveModal(null)}
        />
      )}
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
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    {label}
                    {HELP.terminology[key] && (
                      <InfoIcon title={label} content={HELP.terminology[key]} />
                    )}
                    {HELP.settingModals[`term_${key}`] && (
                      <button type="button" onClick={() => setActiveModal(`term_${key}`)} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 leading-none">Learn more</button>
                    )}
                  </span>
                </td>
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
  const [activeModal, setActiveModal] = useState(null);
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
      {activeModal && (
        <SettingInfoModal
          info={HELP.settingModals[activeModal]}
          onClose={() => setActiveModal(null)}
        />
      )}
      <div>
        <h3 className="flex items-center gap-1 font-semibold text-slate-800 mb-1">
          Performance Bands
          <InfoIcon title="Performance Bands" content={HELP.bands.section} />
          <button type="button" onClick={() => setActiveModal('bands_overview')} className="ml-1 text-[10px] text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 leading-none">Learn more</button>
        </h3>
        <p className="text-sm text-slate-500">
          Map final scores to performance labels. Ranges should not overlap and collectively cover 0–5 (or 0–100% if using percentage scale).
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[2fr_1fr_1fr_80px_32px] gap-3 text-xs text-slate-400 px-1">
          <span className="flex items-center gap-1">Band Label <InfoIcon title="Band Label" content={HELP.bands.bandLabel} /><button type="button" onClick={() => setActiveModal('band_label')} className="text-[10px] text-indigo-500 hover:text-indigo-700 underline leading-none ml-0.5">?</button></span>
          <span className="flex items-center gap-1">Min Score <InfoIcon title="Min Score" content={HELP.bands.minScore} /><button type="button" onClick={() => setActiveModal('min_weight')} className="text-[10px] text-indigo-500 hover:text-indigo-700 underline leading-none ml-0.5">?</button></span>
          <span className="flex items-center gap-1">Max Score <InfoIcon title="Max Score" content={HELP.bands.maxScore} /><button type="button" onClick={() => setActiveModal('max_weight')} className="text-[10px] text-indigo-500 hover:text-indigo-700 underline leading-none ml-0.5">?</button></span>
          <span className="flex items-center gap-1">Color <InfoIcon title="Band Color" content={HELP.bands.color} /></span>
          <span></span>
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
  const [activeModal, setActiveModal] = useState(null);
  const rules = settings.target_rules || {};

  const update = (patch) => onChange({ target_rules: { ...rules, ...patch } });

  return (
    <div className="space-y-6">
      {activeModal && (
        <SettingInfoModal
          info={HELP.settingModals[activeModal]}
          onClose={() => setActiveModal(null)}
        />
      )}
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">Target Rules</h3>
        <p className="text-sm text-slate-500">
          Configure constraints on how employees can set and submit performance targets.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Field label="Minimum Target Weight (%)" hint="Warn when a single target has less than this weight" info={HELP.targetRules.minWeight} onLearnMore={() => setActiveModal('min_weight')}>
          <input
            type="number" min="1" max="100"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={rules.min_target_weight ?? 5}
            onChange={e => update({ min_target_weight: +e.target.value })}
          />
        </Field>

        <Field label="Maximum Target Weight (%)" hint="Warn when a single target has more than this weight" info={HELP.targetRules.maxWeight} onLearnMore={() => setActiveModal('max_weight')}>
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

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="rounded mt-0.5"
            checked={rules.overplan_allowed ?? true}
            onChange={e => update({ overplan_allowed: e.target.checked })}
          />
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
              Allow Over-Planning
              <InfoIcon title="Allow Over-Planning" content={HELP.targetRules.overplanAllowed} />
              <button type="button" onClick={() => setActiveModal('overplan_allowed')} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 leading-none">Learn more</button>
            </div>
            <div className="text-xs text-slate-400">
              Employees can commit to more than their manager's planned target (with justification)
            </div>
          </div>
        </label>

        {(rules.overplan_allowed ?? true) && (
          <Field
            label="Maximum Over-Plan Multiplier"
            hint="E.g. 1.15 means team total can be up to 15% above the manager's target before a warning"
            info={HELP.targetRules.overplanMultiplier}
            onLearnMore={() => setActiveModal('overplan_multiplier')}
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

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="rounded mt-0.5"
            checked={rules.require_parent_linkage ?? true}
            onChange={e => update({ require_parent_linkage: e.target.checked })}
          />
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
              Require Parent Linkage
              <InfoIcon title="Require Parent Linkage" content={HELP.targetRules.requireParentLinkage} />
              <button type="button" onClick={() => setActiveModal('require_parent_linkage')} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 leading-none">Learn more</button>
            </div>
            <div className="text-xs text-slate-400">
              Every approved target must be linked to a parent target in the hierarchy
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="rounded mt-0.5"
            checked={rules.allow_self_propose ?? true}
            onChange={e => update({ allow_self_propose: e.target.checked })}
          />
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
              Allow Self-Propose (Bottom-Up)
              <InfoIcon title="Allow Self-Propose" content={HELP.targetRules.allowSelfPropose} />
              <button type="button" onClick={() => setActiveModal('allow_self_propose')} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 leading-none">Learn more</button>
            </div>
            <div className="text-xs text-slate-400">
              Employees can propose their own targets for manager review
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}

/* ── Talent Grid Tab ─────────────────────────────────────────────────────── */
const DEFAULT_BOX_LABELS = {
  '1_1': 'Underperformer',    '1_2': 'Inconsistent Player', '1_3': 'Enigma',
  '2_1': 'Solid Contributor', '2_2': 'Core Player',         '2_3': 'High Potential',
  '3_1': 'Effective Performer','3_2': 'Strong Performer',   '3_3': 'Star / Future Leader',
};

const BOX_GRID_ORDER = [
  ['1_3','2_3','3_3'],
  ['1_2','2_2','3_2'],
  ['1_1','2_1','3_1'],
];

function TalentGridTab({ settings, onChange }) {
  const cfg = settings.ninebox_config || {};
  const update = (patch) => onChange({ ninebox_config: { ...cfg, ...patch } });

  const potentialLevels = cfg.potential_levels || ['Low', 'Medium', 'High'];
  const thresholds = cfg.performance_thresholds || { low_max: 2.49, medium_max: 3.99 };
  const boxLabels = cfg.box_labels || {};
  const whoRates = cfg.who_rates_potential || 'manager';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">9-Box Talent Grid Settings</h3>
        <p className="text-sm text-slate-500">
          Configure how the Performance × Potential matrix is displayed, labelled, and who enters potential ratings during calibration.
        </p>
      </div>

      {/* Potential level labels */}
      <Field label="Potential Level Labels" hint="Y-axis labels from Low → High (3 levels)" info={HELP.talentGrid.potentialLevels}>
        <div className="flex gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-1">
              <div className="text-xs text-slate-400 mb-1">Level {i + 1}</div>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={potentialLevels[i] ?? ''}
                onChange={e => {
                  const arr = [...potentialLevels];
                  arr[i] = e.target.value;
                  update({ potential_levels: arr });
                }}
              />
            </div>
          ))}
        </div>
      </Field>

      {/* Performance thresholds */}
      <Field
        label="Performance Thresholds (X-axis)"
        hint="Final score ≤ low_max → Low | ≤ medium_max → Medium | above → High"
        info={HELP.talentGrid.performanceThresholds}
      >
        <div className="flex gap-4 items-end">
          <div>
            <div className="text-xs text-slate-400 mb-1">Low max score</div>
            <input
              type="number" step="0.01" min="0" max="5"
              className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={thresholds.low_max}
              onChange={e => update({ performance_thresholds: { ...thresholds, low_max: parseFloat(e.target.value) } })}
            />
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Medium max score</div>
            <input
              type="number" step="0.01" min="0" max="5"
              className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={thresholds.medium_max}
              onChange={e => update({ performance_thresholds: { ...thresholds, medium_max: parseFloat(e.target.value) } })}
            />
          </div>
          <span className="text-xs text-slate-400 pb-2">High = above {thresholds.medium_max}</span>
        </div>
      </Field>

      {/* Who rates potential */}
      <Field label="Who Rates Potential" info={HELP.talentGrid.whoRatesPotential}>
        <select
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={whoRates}
          onChange={e => update({ who_rates_potential: e.target.value })}
        >
          <option value="manager">Direct Manager (during calibration)</option>
          <option value="hr">HR Only</option>
          <option value="committee">Calibration Committee</option>
        </select>
      </Field>

      {/* Optional fields */}
      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <h4 className="font-medium text-slate-700">Optional Talent Fields</h4>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="rounded mt-0.5"
            checked={cfg.show_succession_risk ?? false}
            onChange={e => update({ show_succession_risk: e.target.checked })}
          />
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
              Show Succession Risk
              <InfoIcon title="Succession Risk" content={HELP.talentGrid.showSuccessionRisk} />
            </div>
            <div className="text-xs text-slate-400">Flight Risk / Key Person Risk / Bench Strength</div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="rounded mt-0.5"
            checked={cfg.show_readiness ?? false}
            onChange={e => update({ show_readiness: e.target.checked })}
          />
          <div>
            <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
              Show Readiness Level
              <InfoIcon title="Readiness Level" content={HELP.talentGrid.showReadiness} />
            </div>
            <div className="text-xs text-slate-400">Ready Now / 1–2 Years / Long-Term</div>
          </div>
        </label>
      </div>

      {/* Box label editor */}
      <div>
        <div className="flex items-center gap-1 mb-3">
          <span className="text-sm font-medium text-slate-700">Box Labels</span>
          <InfoIcon title="Box Labels" content={HELP.talentGrid.boxLabels} />
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Preview of the 9-box grid. X-axis = Performance (Low→High left to right). Y-axis = Potential (Low→High bottom to top). Click any box to rename it.
        </p>
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 text-xs text-slate-400 bg-slate-50 border-b border-slate-200">
            <div className="p-2 border-r border-slate-200">Potential ↕ / Perf →</div>
            {['Low Perf', 'Mid Perf', 'High Perf'].map(h => (
              <div key={h} className="p-2 text-center border-r last:border-r-0 border-slate-200">{h}</div>
            ))}
          </div>
          {BOX_GRID_ORDER.map((row, ri) => (
            <div key={ri} className="grid grid-cols-4 border-b last:border-b-0 border-slate-200">
              <div className="p-2 text-xs text-slate-400 bg-slate-50 border-r border-slate-200 flex items-center">
                {potentialLevels[2 - ri] || `Level ${3 - ri}`} Pot.
              </div>
              {row.map(pos => (
                <div key={pos} className="p-1 border-r last:border-r-0 border-slate-200">
                  <input
                    className="w-full text-xs border border-slate-100 rounded px-2 py-1 text-slate-700 bg-white focus:border-indigo-400 focus:outline-none"
                    value={boxLabels[pos] ?? DEFAULT_BOX_LABELS[pos]}
                    onChange={e => update({ box_labels: { ...boxLabels, [pos]: e.target.value } })}
                    placeholder={DEFAULT_BOX_LABELS[pos]}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <button
          className="mt-2 text-xs text-slate-400 hover:text-slate-600"
          onClick={() => update({ box_labels: {} })}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function Field({ label, hint, info, infoTitle, onLearnMore, children }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-0.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {info && <InfoIcon title={infoTitle || label} content={info} />}
        {onLearnMore && (
          <button
            type="button"
            onClick={onLearnMore}
            className="ml-1 text-[10px] text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2 leading-none transition-colors focus:outline-none"
          >
            Learn more
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}
