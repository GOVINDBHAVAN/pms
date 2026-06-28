/**
 * Measurement Types — defines HOW a target's value is entered and how achievement % is computed.
 *
 * Distinct from:
 *   - `scoring_direction` / `measurement_type` on targets (higher_better / lower_better)
 *   - `rating_scale` in org settings (how achievement % maps to a final review rating)
 *
 * These types are configured by HR in Org Settings → Rating Scale → Measurement Types,
 * and chosen by end-users when creating a KPI, Key Result, Goal, or BSC Metric.
 */

export const PREDEFINED_MEASUREMENT_TYPES = [
  {
    id: 'number',
    label: 'Number (Absolute)',
    icon: '#',
    unit_placeholder: 'e.g. ₹, units, kg, hrs',
    description: 'An absolute numeric value. Achievement is computed as (actual ÷ planned) × 100%.',
    formula: 'actual_over_planned',
    requires_planned: true,
    system: true,
  },
  {
    id: 'percentage',
    label: 'Percentage',
    icon: '%',
    unit_placeholder: '%',
    description: 'Target and actual are both percentages (0–100%). E.g. "95% defect-free rate".',
    formula: 'actual_over_planned',
    requires_planned: true,
    system: true,
  },
  {
    id: 'boolean',
    label: 'Yes / No (Completion)',
    icon: '✓',
    unit_placeholder: '',
    description: 'Binary outcome — either completed (100%) or not (0%). No numeric planned value needed.',
    formula: 'boolean',
    requires_planned: false,
    system: true,
  },
  {
    id: 'percentage_of_target',
    label: '% of Target (Self-Reported)',
    icon: '⊹',
    unit_placeholder: '%',
    description: 'Employee enters their achievement % directly. No formula — what they enter is the achievement.',
    formula: 'direct_percentage',
    requires_planned: false,
    system: true,
  },
  {
    id: 'bars',
    label: 'BARS (Behaviorally Anchored)',
    icon: '◈',
    unit_placeholder: '',
    description: 'Manager selects a behavioral anchor level at review time. Ideal for competency-style targets.',
    formula: 'rated_directly',
    requires_planned: false,
    system: true,
  },
  {
    id: 'rating',
    label: 'Direct Rating',
    icon: '★',
    unit_placeholder: '',
    description: 'Manager directly assigns a rating from the org\'s scoring scale. For subjective or qualitative targets.',
    formula: 'rated_directly',
    requires_planned: false,
    system: true,
  },
];

/**
 * Default measurement types stored in org.settings.measurement_types when not yet configured.
 */
export const DEFAULT_ORG_MEASUREMENT_TYPES = PREDEFINED_MEASUREMENT_TYPES.map(t => ({
  id: t.id,
  label: t.label,
  unit: t.id === 'percentage' || t.id === 'percentage_of_target' ? '%' : '',
  description: t.description,
  formula: t.formula,
  requires_planned: t.requires_planned,
  enabled: true,
  system: t.system,
}));

/** Returns all enabled measurement types for an org (falls back to defaults). */
export function getEnabledMeasurementTypes(orgMeasurementTypes) {
  const types = orgMeasurementTypes?.length ? orgMeasurementTypes : DEFAULT_ORG_MEASUREMENT_TYPES;
  return types.filter(t => t.enabled !== false);
}

/** Finds a single measurement type by id from org config or defaults. */
export function getMeasurementType(id, orgMeasurementTypes) {
  const types = orgMeasurementTypes?.length ? orgMeasurementTypes : DEFAULT_ORG_MEASUREMENT_TYPES;
  return types.find(t => t.id === id) ?? null;
}

/**
 * Computes achievement % from actual and planned values based on a measurement type.
 * Returns null when the type uses direct rating (no achievement % concept).
 *
 * @param {string} formula  - the formula field from a measurement type object
 * @param {number} actual
 * @param {number} planned
 * @returns {number|null}  achievement % or null
 */
export function computeAchievement(formula, actual, planned) {
  if (actual == null) return null;
  switch (formula) {
    case 'actual_over_planned':
      if (!planned) return null;
      return (actual / planned) * 100;
    case 'direct_percentage':
      return actual;
    case 'boolean':
      return actual ? 100 : 0;
    case 'rated_directly':
      return null;
    default:
      if (!planned) return null;
      return (actual / planned) * 100;
  }
}

/**
 * Returns a short human-readable description of what "planned target" means for a type,
 * used as placeholder text in the target creation form.
 */
export function plannedTargetPlaceholder(measurementType) {
  switch (measurementType?.id) {
    case 'number':            return `Enter value (${measurementType.unit || 'number'})`;
    case 'percentage':        return 'Enter target % (e.g. 95)';
    case 'percentage_of_target': return 'No planned value needed';
    case 'boolean':           return 'No planned value — outcome is done / not done';
    case 'bars':              return 'No planned value — manager rates at review';
    case 'rating':            return 'No planned value — manager rates at review';
    default:                  return 'Enter planned value';
  }
}
