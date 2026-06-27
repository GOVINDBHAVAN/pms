// Industry presets registry — maps industry → default framework, cascade mode, starter library
// ninebox_enabled: true  = suggest enabling 9-box for succession planning at this industry
// bsc_perspective_weights: present only when balanced_scorecard is in active_types

export const INDUSTRY_PRESETS = {
  it: {
    label: 'IT / Software',
    framework: 'okr',
    cascade_mode: 'bidirectional',
    active_types: ['okr_objective', 'okr_kr', 'competency'],
    overplan_max_multiplier: 1.20,
    weightage: { goals_percent: 70, competency_percent: 30 },
    ninebox_enabled: true,
    ninebox_config: {
      potential_levels: ['Developing', 'Growth', 'Ready Now'],
      performance_thresholds: { low_max: 2.49, medium_max: 3.99 },
      who_rates_potential: 'committee',
      show_succession_risk: true,
      show_readiness: true,
    },
  },

  manufacturing: {
    label: 'Manufacturing',
    framework: 'kra_kpi',
    cascade_mode: 'top_down',
    active_types: ['kra', 'kpi'],
    overplan_max_multiplier: 1.10,
    weightage: { goals_percent: 80, competency_percent: 20 },
    ninebox_enabled: false,
  },

  healthcare: {
    label: 'Healthcare',
    framework: 'hybrid',
    cascade_mode: 'top_down',
    active_types: ['goal', 'competency'],
    overplan_max_multiplier: 1.15,
    weightage: { goals_percent: 50, competency_percent: 50 },
    ninebox_enabled: false,
  },

  bfsi: {
    label: 'BFSI',
    framework: 'balanced_scorecard',
    cascade_mode: 'top_down',
    active_types: ['bsc_metric', 'kpi', 'competency'],
    overplan_max_multiplier: 1.15,
    weightage: { goals_percent: 70, competency_percent: 30 },
    bsc_perspectives: ['Financial', 'Customer', 'Compliance & Risk', 'People & Learning'],
    bsc_perspective_weights: { Financial: 35, Customer: 30, 'Compliance & Risk': 20, 'People & Learning': 15 },
    ninebox_enabled: true,
    ninebox_config: {
      potential_levels: ['Low', 'Medium', 'High'],
      performance_thresholds: { low_max: 2.49, medium_max: 3.99 },
      who_rates_potential: 'hr',
      show_succession_risk: true,
      show_readiness: true,
    },
  },

  retail: {
    label: 'Retail / Sales',
    framework: 'goals',
    cascade_mode: 'top_down',
    active_types: ['goal', 'kpi'],
    overplan_max_multiplier: 1.30,
    weightage: { goals_percent: 80, competency_percent: 20 },
    ninebox_enabled: false,
  },

  education: {
    label: 'Education',
    framework: 'goals',
    cascade_mode: 'top_down',
    active_types: ['goal', 'competency'],
    overplan_max_multiplier: 1.15,
    weightage: { goals_percent: 60, competency_percent: 40 },
    ninebox_enabled: false,
  },

  hospitality: {
    label: 'Hospitality',
    framework: 'kra_kpi',
    cascade_mode: 'bidirectional',
    active_types: ['kra', 'kpi', 'competency'],
    overplan_max_multiplier: 1.15,
    weightage: { goals_percent: 60, competency_percent: 40 },
    ninebox_enabled: false,
  },

  logistics: {
    label: 'Logistics',
    framework: 'kra_kpi',
    cascade_mode: 'top_down',
    active_types: ['kra', 'kpi'],
    overplan_max_multiplier: 1.15,
    weightage: { goals_percent: 80, competency_percent: 20 },
    ninebox_enabled: false,
  },

  ngo: {
    label: 'NGO / Social Sector',
    framework: 'goals',
    cascade_mode: 'bottom_up',
    active_types: ['goal', 'competency'],
    overplan_max_multiplier: 1.15,
    weightage: { goals_percent: 60, competency_percent: 40 },
    ninebox_enabled: false,
  },
};

/**
 * Returns the default org settings patch for a given industry key.
 * Caller merges this into the existing settings object.
 */
export function getIndustryDefaults(industryKey) {
  return INDUSTRY_PRESETS[industryKey] ?? null;
}

/**
 * True if the industry preset includes BSC as the primary framework
 * or has bsc_metric in active_types.
 */
export function industryUsesBsc(industryKey) {
  const preset = INDUSTRY_PRESETS[industryKey];
  if (!preset) return false;
  return (
    preset.framework === 'balanced_scorecard' ||
    (preset.active_types ?? []).includes('bsc_metric')
  );
}

/**
 * True if the industry preset has 9-box enabled by default.
 */
export function industryUsesNineBox(industryKey) {
  return INDUSTRY_PRESETS[industryKey]?.ninebox_enabled === true;
}
