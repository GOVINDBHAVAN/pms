// Validation service — enforces business rules V1–V13 from BUSINESS_LOGIC.md
// All functions are pure: take data, return { valid: bool, errors: [], warnings: [] }

function result(errors = [], warnings = []) {
  return { valid: errors.length === 0, errors, warnings };
}

// V1: SUM(weight) per employee per cycle = 100% (separate for goals vs competency)
function validateWeightSum(targets) {
  const errors = [];
  const warnings = [];

  const goalTargets = targets.filter(t => t.framework_type !== 'competency' && t.status !== 'deleted');
  const compTargets = targets.filter(t => t.framework_type === 'competency' && t.status !== 'deleted');

  if (goalTargets.length) {
    const sum = goalTargets.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      errors.push(`Goal target weights sum to ${sum.toFixed(1)}% but must equal 100% (Rule V1).`);
    }
  }

  if (compTargets.length) {
    const sum = compTargets.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      errors.push(`Competency weights sum to ${sum.toFixed(1)}% but must equal 100% (Rule V1).`);
    }
  }

  return result(errors, warnings);
}

// V2/V3: Individual weight bounds (min 5%, max 50% by default)
function validateWeightBounds(target, minWeight = 5, maxWeight = 50) {
  const warnings = [];
  const w = parseFloat(target.weight) || 0;
  if (w < minWeight) warnings.push(`Weight ${w}% is below the recommended minimum of ${minWeight}% (Rule V2).`);
  if (w > maxWeight) warnings.push(`Weight ${w}% exceeds the recommended maximum of ${maxWeight}% (Rule V3).`);
  return result([], warnings);
}

// V4: parent_target_id must be set before approval (except root/L1 targets)
function validateParentLinkage(target, effectiveCascadeMode) {
  if (effectiveCascadeMode === 'bottom_up') return result(); // bottom-up: parent set at link time
  if (target.framework_type === 'competency') return result(); // competencies never link
  if (target.hierarchy_level <= 1) return result(); // root targets have no parent

  if (!target.parent_target_id) {
    return result([`Target "${target.title}" has no parent linkage. Link it to your manager's target before approving (Rule V4).`]);
  }
  return result();
}

// V5: Manager's targets must be approved before employee can submit (top-down / bidirectional)
function validateManagerApproved(managerApprovedCount, effectiveCascadeMode, hasManager) {
  if (!hasManager) return result(); // L1/CEO has no manager — no check
  if (effectiveCascadeMode === 'bottom_up') return result(); // bottom-up has no gate
  if (managerApprovedCount > 0) return result();

  return result([
    'Your manager\'s targets must be approved before you can submit (Rule V5). Please wait for your manager to complete goal-setting.',
  ]);
}

// V6: Over-planned target requires justification note
function validateOverPlanNote(target) {
  if (!target.is_over_planned) return result();
  if (!target.over_plan_note?.trim()) {
    return result([`"${target.title}" is over-planned. Provide a written justification before submitting (Rule V6).`]);
  }
  return result();
}

// V7: stretch_target > planned_target
function validateStretchTarget(target) {
  if (target.stretch_target == null || target.planned_target == null) return result();
  if (parseFloat(target.stretch_target) <= parseFloat(target.planned_target)) {
    return result([`Stretch target must be greater than planned target on "${target.title}" (Rule V7).`]);
  }
  return result();
}

// V8: planned_target > 0 for numeric metrics
function validatePlannedTarget(target) {
  if (target.framework_type === 'competency') return result();
  if (target.planned_target == null) return result();
  if (parseFloat(target.planned_target) <= 0) {
    return result([`Planned target must be greater than zero on "${target.title}" (Rule V8).`]);
  }
  return result();
}

// V9: Manager must have own approved targets before approving reportees'
function validateManagerHasOwnTargets(managerApprovedCount, isHrAdmin) {
  if (isHrAdmin) return result();
  if (managerApprovedCount > 0) return result();
  return result(['You must have your own approved targets before approving your reportees\' targets (Rule V9).']);
}

// V11: Competency cannot have parent_target_id
function validateCompetencyNoParent(target) {
  if (target.framework_type !== 'competency') return result();
  if (target.parent_target_id) {
    return result([`Competency "${target.title}" cannot be linked to a parent performance target (Rule V11).`]);
  }
  return result();
}

// V12: Cross-linkage matrix — child framework_type vs parent framework_type compatibility
// From BUSINESS_LOGIC.md Part 5.2
const CROSS_LINKAGE = {
  okr_objective: { okr_objective: 'valid', okr_kr: 'unusual', kra: 'invalid', kpi: 'invalid', goal: 'invalid', competency: 'invalid' },
  okr_kr:        { okr_objective: 'valid', okr_kr: 'valid',   kra: 'unusual', kpi: 'invalid', goal: 'invalid', competency: 'invalid' },
  kra:           { okr_objective: 'valid', okr_kr: 'valid',   kra: 'valid',   kpi: 'invalid', goal: 'invalid', competency: 'invalid' },
  kpi:           { okr_objective: 'valid', okr_kr: 'valid',   kra: 'valid',   kpi: 'valid',   goal: 'invalid', competency: 'invalid' },
  goal:          { okr_objective: 'valid', okr_kr: 'valid',   kra: 'valid',   kpi: 'valid',   goal: 'valid',   competency: 'invalid' },
  competency:    { okr_objective: 'invalid', okr_kr: 'invalid', kra: 'invalid', kpi: 'invalid', goal: 'invalid', competency: 'invalid' },
};

function validateCrossLinkage(childType, parentType) {
  if (!parentType) return result(); // no parent = no check needed here
  const row = CROSS_LINKAGE[childType];
  if (!row) return result();
  const verdict = row[parentType] || 'invalid';

  if (verdict === 'invalid') {
    return result([
      `A ${childType} cannot be linked to a ${parentType} parent. This combination is not allowed by the cascade compatibility rules (Rule V12).`,
    ]);
  }
  if (verdict === 'unusual') {
    return result([], [
      `Linking a ${childType} to a ${parentType} is unusual but logically valid. Please explain the contribution in the description field (Rule V12).`,
    ]);
  }
  return result();
}

// V13: Before cycle → active, all approved targets must have parent_target_id (except L1 root)
function validateAllLinked(targets) {
  const unlinked = targets.filter(
    t => t.status === 'approved' && !t.parent_target_id && (t.hierarchy_level || 1) > 1 && t.framework_type !== 'competency'
  );
  if (unlinked.length) {
    return result([
      `${unlinked.length} approved target(s) have no parent linkage. All targets must be linked before the cycle can advance to active (Rule V13): ${unlinked.map(t => t.title).join(', ')}`,
    ]);
  }
  return result();
}

// ── Composite validator: runs all applicable rules for a single target on save ──
function validateOnSave(target, orgSettings) {
  const errors = [];
  const warnings = [];

  function collect(r) {
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }

  const minWeight = orgSettings?.target_rules?.min_target_weight || 5;
  const maxWeight = orgSettings?.target_rules?.max_target_weight || 50;

  collect(validateWeightBounds(target, minWeight, maxWeight));
  collect(validateStretchTarget(target));
  collect(validatePlannedTarget(target));
  collect(validateCompetencyNoParent(target));

  return result(errors, warnings);
}

// ── Composite validator: runs all rules for submit-all ──────────────────────
function validateOnSubmit(targets, effectiveCascadeMode, managerApprovedCount, hasManager, orgSettings) {
  const errors = [];
  const warnings = [];

  function collect(r) {
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }

  collect(validateManagerApproved(managerApprovedCount, effectiveCascadeMode, hasManager));
  collect(validateWeightSum(targets));

  for (const t of targets) {
    collect(validateOverPlanNote(t));
    collect(validateStretchTarget(t));
    collect(validatePlannedTarget(t));
    collect(validateCompetencyNoParent(t));
  }

  return result(errors, warnings);
}

module.exports = {
  validate: { validateWeightSum, validateWeightBounds, validateParentLinkage, validateManagerApproved,
              validateOverPlanNote, validateStretchTarget, validatePlannedTarget, validateManagerHasOwnTargets,
              validateCompetencyNoParent, validateCrossLinkage, validateAllLinked,
              validateOnSave, validateOnSubmit },
};
