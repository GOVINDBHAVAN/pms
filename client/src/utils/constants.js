// Canonical framework-type metadata and display ordering.
// Import from here — never redefine locally in pages.

export const FRAMEWORK_TYPE_META = {
  okr_objective: { label: 'OKR Objective', color: 'bg-violet-100 text-violet-700', icon: '🎯', group: 'OKR',                order: 1 },
  okr_kr:        { label: 'Key Result',     color: 'bg-purple-100 text-purple-700', icon: '🔑', group: 'OKR',                order: 2 },
  kra:           { label: 'KRA',            color: 'bg-blue-100 text-blue-700',     icon: '📁', group: 'KRA/KPI',            order: 3 },
  kpi:           { label: 'KPI',            color: 'bg-cyan-100 text-cyan-700',     icon: '📊', group: 'KRA/KPI',            order: 4 },
  goal:          { label: 'Goal',           color: 'bg-emerald-100 text-emerald-700', icon: '✅', group: 'Goals',            order: 5 },
  bsc_metric:    { label: 'BSC Metric',     color: 'bg-slate-100 text-slate-700',   icon: '📐', group: 'Balanced Scorecard', order: 6 },
  competency:    { label: 'Competency',     color: 'bg-amber-100 text-amber-700',   icon: '⭐', group: 'Competency',         order: 7 },
};

// Canonical type key order: OKR → KRA/KPI → Goals → BSC → Competency
export const FRAMEWORK_TYPE_ORDER = [
  'okr_objective',
  'okr_kr',
  'kra',
  'kpi',
  'goal',
  'bsc_metric',
  'competency',
];

// Canonical group order (for sorting TargetGroup sections)
export const FRAMEWORK_GROUP_ORDER = [
  'OKR',
  'KRA/KPI',
  'Goals',
  'Balanced Scorecard',
  'Competency',
];

// Sort comparator — pass to .sort()
// Usage: items.sort((a, b) => compareFrameworkType(a.framework_type, b.framework_type))
export function compareFrameworkType(typeA, typeB) {
  const ia = FRAMEWORK_TYPE_ORDER.indexOf(typeA);
  const ib = FRAMEWORK_TYPE_ORDER.indexOf(typeB);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
}
