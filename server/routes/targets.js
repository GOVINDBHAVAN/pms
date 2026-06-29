// Target routes: CRUD, submit, approve, reject, link, cascade-context
const router = require('express').Router();
const { getDb, saveDb } = require('../db/database');
const requireAuth = require('../middleware/auth');

function rowsToObjects(result) {
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

function auditLog(db, targetId, changedBy, action, oldSnap, newSnap, note) {
  db.run(
    `INSERT INTO target_audit_log (target_id, changed_by, action, old_snapshot, new_snapshot, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [targetId, changedBy, action, JSON.stringify(oldSnap), JSON.stringify(newSnap), note || null]
  );
}

// ── GET /targets?cycle_id= ────────────────────────────────────────────────────
// Employee: own targets for a cycle. Manager: can pass ?employee_id= to see reportee.
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { cycle_id, employee_id } = req.query;

    // Determine whose targets to fetch
    let targetEmployeeId = req.user.id;
    if (employee_id && ['admin', 'hr', 'manager'].includes(req.user.role)) {
      // Manager can view a direct reportee's targets
      const reportees = rowsToObjects(db.exec(
        `SELECT id FROM employees WHERE reporting_to = ? AND org_id = ?`,
        [req.user.id, req.user.org_id]
      ));
      const isHrAdmin = ['admin', 'hr'].includes(req.user.role);
      const isDirectReportee = reportees.some(r => r.id == employee_id);
      if (!isHrAdmin && !isDirectReportee) {
        return res.status(403).json({ error: 'Can only view direct reportees\' targets' });
      }
      targetEmployeeId = parseInt(employee_id);
    }

    let query = `
      SELECT t.*,
             p.title   AS parent_title,
             p.planned_target AS parent_planned,
             pe.name   AS parent_employee_name,
             lb.name   AS library_name,
             lb.unit   AS library_unit
      FROM targets t
      LEFT JOIN targets p  ON p.id = t.parent_target_id
      LEFT JOIN employees pe ON pe.id = p.employee_id
      LEFT JOIN performance_library lb ON lb.id = t.library_id
      WHERE t.employee_id = ? AND t.org_id = ?
    `;
    const params = [targetEmployeeId, req.user.org_id];

    if (cycle_id) {
      query += ` AND t.cycle_id = ?`;
      params.push(parseInt(cycle_id));
    }
    query += ` ORDER BY t.framework_type, t.created_at`;

    const rows = rowsToObjects(db.exec(query, params));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /targets/cascade-context?cycle_id= ───────────────────────────────────
// Returns the full upward chain of approved targets visible to the logged-in employee.
// Used as the context panel during goal setting.
router.get('/cascade-context', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { cycle_id } = req.query;

    // Get employee's manager chain via recursive CTE
    const chainRows = rowsToObjects(db.exec(
      `WITH RECURSIVE chain(id, name, reporting_to, depth) AS (
         SELECT id, name, reporting_to, 0 FROM employees WHERE id = ?
         UNION ALL
         SELECT e.id, e.name, e.reporting_to, c.depth + 1
         FROM employees e JOIN chain c ON e.id = c.reporting_to
         WHERE c.depth < 10
       )
       SELECT id, name, depth FROM chain WHERE id != ? ORDER BY depth`,
      [req.user.id, req.user.id]
    ));

    if (!chainRows.length) return res.json({ chain: [], targets: [] });

    const ancestorIds = chainRows.map(r => r.id);
    const placeholders = ancestorIds.map(() => '?').join(',');

    // Build targets query - for the given cycle OR (for KRA/KPI which are permanent)
    let targetsQuery = `
      SELECT t.id, t.employee_id, t.framework_type, t.title, t.description,
             t.planned_target, t.stretch_target, t.unit, t.weight, t.status,
             t.parent_target_id, t.cycle_id, t.cascade_direction,
             e.name AS employee_name, g.label AS employee_grade, d.name AS dept_name
      FROM targets t
      JOIN employees e ON e.id = t.employee_id
      LEFT JOIN grades g ON g.id = e.grade_id
      LEFT JOIN departments d ON d.id = e.dept_id
      WHERE t.employee_id IN (${placeholders})
        AND t.org_id = ?
        AND t.status IN ('approved','active')
    `;
    const params = [...ancestorIds, req.user.org_id];

    if (cycle_id) {
      targetsQuery += ` AND t.cycle_id = ?`;
      params.push(parseInt(cycle_id));
    }
    targetsQuery += ` ORDER BY t.hierarchy_level, t.framework_type`;

    const targets = rowsToObjects(db.exec(targetsQuery, params));

    // Get cascade gate status: is the direct manager's targets approved?
    const directManagerId = chainRows.find(r => r.depth === 1)?.id;
    let cascadeGate = { open: true, manager: null, reason: null };

    if (directManagerId) {
      const mgr = rowsToObjects(db.exec(
        `SELECT e.id, e.name, COUNT(t.id) AS approved_count
         FROM employees e
         LEFT JOIN targets t ON t.employee_id = e.id AND t.status = 'approved'
           AND (? IS NULL OR t.cycle_id = ?)
         WHERE e.id = ?
         GROUP BY e.id`,
        [cycle_id || null, cycle_id || null, directManagerId]
      ))[0];

      if (mgr && mgr.approved_count === 0) {
        cascadeGate = {
          open: false,
          manager: mgr,
          reason: `${mgr.name} has not yet had targets approved. In Top-Down mode, you cannot submit until your manager's targets are approved (Rule V5).`,
        };
      } else {
        cascadeGate.manager = mgr;
      }
    }

    res.json({
      chain: chainRows,
      targets,
      cascadeGate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /targets/manager-view?cycle_id= ──────────────────────────────────────
// Manager sees all direct reportees with their submission status + targets.
router.get('/manager-view', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { cycle_id } = req.query;

    if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Manager access required' });
    }

    // Get direct reportees
    const reportees = rowsToObjects(db.exec(
      `SELECT e.id, e.name, e.email, g.label AS grade, d.name AS dept
       FROM employees e
       LEFT JOIN grades g ON g.id = e.grade_id
       LEFT JOIN departments d ON d.id = e.dept_id
       WHERE e.reporting_to = ? AND e.org_id = ? AND e.is_active = 1`,
      [req.user.id, req.user.org_id]
    ));

    if (!reportees.length) return res.json([]);

    const reporteeIds = reportees.map(r => r.id);
    const placeholders = reporteeIds.map(() => '?').join(',');

    let targetsQuery = `
      SELECT t.*, e.name AS employee_name
      FROM targets t
      JOIN employees e ON e.id = t.employee_id
      WHERE t.employee_id IN (${placeholders}) AND t.org_id = ?
    `;
    const params = [...reporteeIds, req.user.org_id];

    if (cycle_id) {
      targetsQuery += ` AND t.cycle_id = ?`;
      params.push(parseInt(cycle_id));
    }
    targetsQuery += ` ORDER BY t.employee_id, t.framework_type`;

    const allTargets = rowsToObjects(db.exec(targetsQuery, params));

    // Group targets by employee
    const byEmployee = {};
    for (const r of reportees) {
      byEmployee[r.id] = { ...r, targets: [], submittedCount: 0, approvedCount: 0 };
    }
    for (const t of allTargets) {
      if (byEmployee[t.employee_id]) {
        byEmployee[t.employee_id].targets.push(t);
        if (['submitted', 'proposed'].includes(t.status)) byEmployee[t.employee_id].submittedCount++;
        if (t.status === 'approved') byEmployee[t.employee_id].approvedCount++;
      }
    }

    res.json(Object.values(byEmployee));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /targets/library?type= ────────────────────────────────────────────────
// Returns library items (KRAs, KPIs, Competencies) for the add-target form.
router.get('/library', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { type } = req.query; // 'kra', 'kpi', 'competency', or omit for all

    let query = `
      SELECT l.*, p.name AS parent_name
      FROM performance_library l
      LEFT JOIN performance_library p ON p.id = l.parent_id
      WHERE l.org_id = ? AND l.is_active = 1
    `;
    const params = [req.user.org_id];

    if (type) {
      const types = type.split(',').map(t => t.trim());
      const ph = types.map(() => '?').join(',');
      query += ` AND l.item_type IN (${ph})`;
      params.push(...types);
    }

    query += ` ORDER BY l.item_type, l.parent_id, l.name`;
    const rows = rowsToObjects(db.exec(query, params));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /targets ─────────────────────────────────────────────────────────────
// Create a target. Status = 'draft' (top-down) or 'proposed' (bottom-up).
router.post('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const {
      cycle_id, framework_type, title, description,
      library_id, unit, measurement_type,
      planned_target, stretch_target, company_target,
      weight, parent_target_id, cascade_direction,
      checkin_frequency,
    } = req.body;

    if (!cycle_id) return res.status(400).json({ error: 'cycle_id is required' });
    if (!framework_type) return res.status(400).json({ error: 'framework_type is required' });
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });

    // Verify cycle is in goal_setting status
    const cycles = rowsToObjects(db.exec(
      `SELECT * FROM review_cycles WHERE id = ? AND org_id = ?`,
      [cycle_id, req.user.org_id]
    ));
    if (!cycles.length) return res.status(404).json({ error: 'Cycle not found' });
    const cycle = cycles[0];
    if (cycle.status !== 'goal_setting') {
      return res.status(400).json({ error: `Targets can only be added during goal_setting phase (current: ${cycle.status})` });
    }

    // Rule V11: Competency cannot have parent_target_id
    if (framework_type === 'competency' && parent_target_id) {
      return res.status(400).json({ error: 'Competency targets cannot be linked to a parent target (Rule V11)' });
    }

    // Rule V7: stretch > planned
    if (stretch_target != null && planned_target != null && parseFloat(stretch_target) <= parseFloat(planned_target)) {
      return res.status(400).json({ error: 'Stretch target must be greater than planned target (Rule V7)' });
    }

    // Rule V8: planned > 0 for numeric types
    if (!['competency'].includes(framework_type) && planned_target != null && parseFloat(planned_target) <= 0) {
      return res.status(400).json({ error: 'Planned target must be greater than zero (Rule V8)' });
    }

    // Rule KR2: Key result must belong to an objective (parent must be okr_objective type)
    if (framework_type === 'okr_kr') {
      if (!parent_target_id) {
        return res.status(400).json({ error: 'A Key Result must belong to an Objective. Please select a parent Objective (Rule KR2).' });
      }
      const parentRows = rowsToObjects(db.exec(
        `SELECT framework_type FROM targets WHERE id = ? AND org_id = ?`,
        [parent_target_id, req.user.org_id]
      ));
      if (!parentRows.length || parentRows[0].framework_type !== 'okr_objective') {
        return res.status(400).json({ error: 'A Key Result\'s parent must be an OKR Objective (Rule KR2).' });
      }
    }

    // Rule KPI4: KPI must belong to a KRA (via library or parent)
    if (framework_type === 'kpi' && !library_id && !parent_target_id) {
      return res.status(400).json({ error: 'A KPI target must reference a KRA from the library (Rule KPI4).' });
    }

    // Determine cascade_direction based on cycle's effective cascade mode
    const effectiveCascade = cycle.cascade_mode || 'top_down';
    const targetCascadeDir = cascade_direction || effectiveCascade;
    const targetStatus = (targetCascadeDir === 'bottom_up' || effectiveCascade === 'bottom_up') ? 'proposed' : 'draft';

    // Determine hierarchy level from employee
    const empRows = rowsToObjects(db.exec(
      `SELECT e.*, g.level AS grade_level FROM employees e
       LEFT JOIN grades g ON g.id = e.grade_id
       WHERE e.id = ? AND e.org_id = ?`,
      [req.user.id, req.user.org_id]
    ));
    const hierarchyLevel = empRows[0]?.grade_level || 5;

    // Over-plan detection
    let isOverPlanned = 0;
    let overPlanRatio = null;
    if (parent_target_id && planned_target != null) {
      const parentRows = rowsToObjects(db.exec(
        `SELECT planned_target, measurement_type FROM targets WHERE id = ?`,
        [parent_target_id]
      ));
      if (parentRows.length && parentRows[0].planned_target) {
        const parentPlan = parseFloat(parentRows[0].planned_target);
        const childPlan = parseFloat(planned_target);
        const mType = measurement_type || parentRows[0].measurement_type || 'higher_better';
        if (mType === 'lower_better') {
          if (childPlan < parentPlan) { isOverPlanned = 1; overPlanRatio = parentPlan / childPlan; }
        } else {
          if (childPlan > parentPlan) { isOverPlanned = 1; overPlanRatio = childPlan / parentPlan; }
        }
      }
    }

    const VALID_FREQUENCIES = ['daily','weekly','bi_weekly','monthly','quarterly','semi_annual','annual'];
    const frequency = VALID_FREQUENCIES.includes(checkin_frequency) ? checkin_frequency : 'monthly';

    db.run(
      `INSERT INTO targets
         (org_id, cycle_id, employee_id, parent_target_id, cascade_direction,
          framework_type, title, description, library_id, unit, measurement_type,
          company_target, planned_target, stretch_target, weight,
          is_over_planned, over_plan_ratio, hierarchy_level, status, checkin_frequency)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.org_id, cycle_id, req.user.id,
        parent_target_id || null, targetCascadeDir,
        framework_type, title.trim(), description || null,
        library_id || null, unit || null, measurement_type || 'higher_better',
        company_target || null, planned_target || null, stretch_target || null,
        weight || 0,
        isOverPlanned, overPlanRatio,
        hierarchyLevel, targetStatus, frequency,
      ]
    );
    saveDb();

    const newId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    const rows = rowsToObjects(db.exec(`SELECT * FROM targets WHERE id = ?`, [newId]));
    auditLog(db, newId, req.user.id, 'created', null, rows[0]);
    saveDb();

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /targets/:id ──────────────────────────────────────────────────────────
// Update a target — only allowed when status is draft or rejected.
router.put('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const rows = rowsToObjects(db.exec(
      `SELECT * FROM targets WHERE id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    ));
    if (!rows.length) return res.status(404).json({ error: 'Target not found' });
    const target = rows[0];

    if (target.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Can only edit your own targets' });
    }
    if (!['draft', 'rejected'].includes(target.status)) {
      return res.status(400).json({ error: `Cannot edit a target with status '${target.status}'` });
    }

    const {
      title, description, library_id, unit, measurement_type,
      planned_target, stretch_target, company_target, weight,
      parent_target_id, over_plan_note, checkin_frequency,
    } = req.body;

    // Rule V7: stretch > planned
    const newPlanned = planned_target != null ? parseFloat(planned_target) : target.planned_target;
    const newStretch = stretch_target != null ? parseFloat(stretch_target) : target.stretch_target;
    if (newStretch != null && newPlanned != null && newStretch <= newPlanned) {
      return res.status(400).json({ error: 'Stretch target must be greater than planned target (Rule V7)' });
    }

    // Rule V8: planned > 0
    if (newPlanned != null && newPlanned <= 0 && target.framework_type !== 'competency') {
      return res.status(400).json({ error: 'Planned target must be greater than zero (Rule V8)' });
    }

    // Re-check over-plan
    let isOverPlanned = target.is_over_planned;
    let overPlanRatio = target.over_plan_ratio;
    const newParentId = parent_target_id !== undefined ? parent_target_id : target.parent_target_id;
    if (newParentId && newPlanned != null) {
      const parentRows = rowsToObjects(db.exec(
        `SELECT planned_target, measurement_type FROM targets WHERE id = ?`, [newParentId]
      ));
      if (parentRows.length && parentRows[0].planned_target) {
        const parentPlan = parseFloat(parentRows[0].planned_target);
        const mType = measurement_type || parentRows[0].measurement_type || 'higher_better';
        if (mType === 'lower_better') {
          isOverPlanned = newPlanned < parentPlan ? 1 : 0;
          overPlanRatio = isOverPlanned ? parentPlan / newPlanned : null;
        } else {
          isOverPlanned = newPlanned > parentPlan ? 1 : 0;
          overPlanRatio = isOverPlanned ? newPlanned / parentPlan : null;
        }
      }
    }

    const VALID_FREQUENCIES = ['daily','weekly','bi_weekly','monthly','quarterly','semi_annual','annual'];
    const newFrequency = VALID_FREQUENCIES.includes(checkin_frequency)
      ? checkin_frequency
      : target.checkin_frequency || 'monthly';

    const oldSnap = { ...target };
    db.run(
      `UPDATE targets SET
         title             = COALESCE(?, title),
         description       = COALESCE(?, description),
         library_id        = ?,
         unit              = COALESCE(?, unit),
         measurement_type  = COALESCE(?, measurement_type),
         company_target    = ?,
         planned_target    = ?,
         stretch_target    = ?,
         weight            = COALESCE(?, weight),
         parent_target_id  = ?,
         over_plan_note    = COALESCE(?, over_plan_note),
         is_over_planned   = ?,
         over_plan_ratio   = ?,
         checkin_frequency = ?,
         updated_at        = datetime('now')
       WHERE id = ? AND org_id = ?`,
      [
        title?.trim() || null, description || null,
        library_id !== undefined ? (library_id || null) : target.library_id,
        unit || null, measurement_type || null,
        company_target !== undefined ? (company_target || null) : target.company_target,
        planned_target !== undefined ? (planned_target || null) : target.planned_target,
        stretch_target !== undefined ? (stretch_target || null) : target.stretch_target,
        weight !== undefined ? weight : null,
        newParentId || null,
        over_plan_note || null,
        isOverPlanned, overPlanRatio,
        newFrequency,
        req.params.id, req.user.org_id,
      ]
    );
    saveDb();

    const updated = rowsToObjects(db.exec(`SELECT * FROM targets WHERE id = ?`, [req.params.id]));
    auditLog(db, req.params.id, req.user.id, 'updated', oldSnap, updated[0]);
    saveDb();

    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /targets/:id ───────────────────────────────────────────────────────
// Soft-delete (deactivate) — only for draft or rejected targets.
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const rows = rowsToObjects(db.exec(
      `SELECT * FROM targets WHERE id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    ));
    if (!rows.length) return res.status(404).json({ error: 'Target not found' });
    const target = rows[0];

    if (target.employee_id !== req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Can only delete your own targets' });
    }
    if (!['draft', 'rejected'].includes(target.status)) {
      return res.status(400).json({ error: 'Only draft or rejected targets can be deleted' });
    }

    // Soft-delete via status change (NEVER hard delete per BUSINESS_LOGIC §14)
    db.run(
      `UPDATE targets SET status = 'deleted', updated_at = datetime('now') WHERE id = ?`,
      [req.params.id]
    );
    auditLog(db, req.params.id, req.user.id, 'deleted', target, null);
    saveDb();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /targets/:id/submit ──────────────────────────────────────────────────
// Employee submits all their targets. Runs V1 (weight sum), V5 (manager approved), V6 (over-plan note).
router.post('/:id/submit', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const rows = rowsToObjects(db.exec(
      `SELECT * FROM targets WHERE id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    ));
    if (!rows.length) return res.status(404).json({ error: 'Target not found' });
    const target = rows[0];

    if (target.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Can only submit your own targets' });
    }
    if (!['draft', 'rejected'].includes(target.status)) {
      return res.status(400).json({ error: `Cannot submit a target with status '${target.status}'` });
    }

    // Rule V6: Over-planned target requires over_plan_note
    if (target.is_over_planned && !target.over_plan_note?.trim()) {
      return res.status(400).json({
        error: 'This target is over-planned. You must provide a justification note before submitting (Rule V6).',
      });
    }

    // Rule V7/V8 recheck on submit
    if (target.stretch_target != null && target.planned_target != null &&
        parseFloat(target.stretch_target) <= parseFloat(target.planned_target)) {
      return res.status(400).json({ error: 'Stretch target must be greater than planned target (Rule V7)' });
    }

    const cycle = rowsToObjects(db.exec(
      `SELECT * FROM review_cycles WHERE id = ? AND org_id = ?`,
      [target.cycle_id, req.user.org_id]
    ))[0];
    if (!cycle) return res.status(404).json({ error: 'Cycle not found' });

    const effectiveCascade = cycle.cascade_mode || 'top_down';

    // Rule V5 (top-down): Manager must have approved targets before employee can submit
    if (effectiveCascade === 'top_down' || effectiveCascade === 'bidirectional') {
      const emp = rowsToObjects(db.exec(
        `SELECT reporting_to FROM employees WHERE id = ?`, [req.user.id]
      ))[0];

      if (emp?.reporting_to) {
        const managerApproved = rowsToObjects(db.exec(
          `SELECT COUNT(*) AS cnt FROM targets
           WHERE employee_id = ? AND cycle_id = ? AND status = 'approved'`,
          [emp.reporting_to, target.cycle_id]
        ))[0];

        if (!managerApproved || managerApproved.cnt === 0) {
          return res.status(400).json({
            error: 'Your manager\'s targets must be approved before you can submit (Rule V5). Please wait for your manager to complete and have their targets approved.',
          });
        }
      }
    }

    const newStatus = effectiveCascade === 'bottom_up' ? 'proposed' : 'submitted';
    const oldSnap = { ...target };

    db.run(
      `UPDATE targets SET status = ?, submitted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [newStatus, req.params.id]
    );
    auditLog(db, req.params.id, req.user.id, 'submitted', oldSnap, { ...target, status: newStatus });
    saveDb();

    res.json({ ok: true, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /targets/submit-all ──────────────────────────────────────────────────
// Submit ALL draft targets for the employee in a cycle. Runs V1 weight-sum check first.
router.post('/submit-all', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { cycle_id } = req.body;
    if (!cycle_id) return res.status(400).json({ error: 'cycle_id required' });

    const cycle = rowsToObjects(db.exec(
      `SELECT * FROM review_cycles WHERE id = ? AND org_id = ?`,
      [cycle_id, req.user.org_id]
    ))[0];
    if (!cycle) return res.status(404).json({ error: 'Cycle not found' });
    if (cycle.status !== 'goal_setting') {
      return res.status(400).json({ error: 'Targets can only be submitted during goal_setting phase' });
    }

    const effectiveCascade = cycle.cascade_mode || 'top_down';

    // Rule V5 check
    if (effectiveCascade === 'top_down' || effectiveCascade === 'bidirectional') {
      const emp = rowsToObjects(db.exec(
        `SELECT reporting_to FROM employees WHERE id = ?`, [req.user.id]
      ))[0];
      if (emp?.reporting_to) {
        const managerApproved = rowsToObjects(db.exec(
          `SELECT COUNT(*) AS cnt FROM targets
           WHERE employee_id = ? AND cycle_id = ? AND status = 'approved'`,
          [emp.reporting_to, cycle_id]
        ))[0];
        if (!managerApproved || managerApproved.cnt === 0) {
          return res.status(400).json({
            error: 'Your manager\'s targets must be approved before you can submit (Rule V5).',
          });
        }
      }
    }

    // Fetch all submittable targets
    const draftTargets = rowsToObjects(db.exec(
      `SELECT * FROM targets
       WHERE employee_id = ? AND cycle_id = ? AND status IN ('draft','rejected') AND org_id = ?`,
      [req.user.id, cycle_id, req.user.org_id]
    ));

    if (!draftTargets.length) {
      return res.status(400).json({ error: 'No draft targets to submit' });
    }

    // Rule V6: any over-planned without note?
    const missingNote = draftTargets.filter(t => t.is_over_planned && !t.over_plan_note?.trim());
    if (missingNote.length) {
      return res.status(400).json({
        error: `${missingNote.length} over-planned target(s) are missing justification notes (Rule V6): ${missingNote.map(t => t.title).join(', ')}`,
      });
    }

    // Rule V1: weight sum of non-competency targets must = 100%
    const goalTargets = draftTargets.filter(t => t.framework_type !== 'competency');
    const compTargets = draftTargets.filter(t => t.framework_type === 'competency');

    if (goalTargets.length) {
      const goalWeightSum = goalTargets.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);
      if (Math.abs(goalWeightSum - 100) > 0.01) {
        return res.status(400).json({
          error: `Goal target weights must sum to 100% before submitting. Current sum: ${goalWeightSum.toFixed(1)}% (Rule V1).`,
        });
      }
    }

    if (compTargets.length) {
      const compWeightSum = compTargets.reduce((s, t) => s + (parseFloat(t.weight) || 0), 0);
      if (Math.abs(compWeightSum - 100) > 0.01) {
        return res.status(400).json({
          error: `Competency weights must sum to 100% before submitting. Current sum: ${compWeightSum.toFixed(1)}% (Rule V1).`,
        });
      }
    }

    const newStatus = effectiveCascade === 'bottom_up' ? 'proposed' : 'submitted';
    const now = new Date().toISOString();

    for (const t of draftTargets) {
      db.run(
        `UPDATE targets SET status = ?, submitted_at = ?, updated_at = ? WHERE id = ?`,
        [newStatus, now, now, t.id]
      );
      auditLog(db, t.id, req.user.id, 'submitted', t, { ...t, status: newStatus });
    }
    saveDb();

    res.json({ ok: true, submitted: draftTargets.length, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /targets/:id/approve ─────────────────────────────────────────────────
// Manager approves a submitted or proposed target.
router.post('/:id/approve', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { over_plan_approved, manager_note } = req.body;

    if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Manager role required to approve targets' });
    }

    const rows = rowsToObjects(db.exec(
      `SELECT * FROM targets WHERE id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    ));
    if (!rows.length) return res.status(404).json({ error: 'Target not found' });
    const target = rows[0];

    // Verify this is a direct reportee
    const isHrAdmin = ['admin', 'hr'].includes(req.user.role);
    if (!isHrAdmin) {
      const isDirectReportee = rowsToObjects(db.exec(
        `SELECT 1 FROM employees WHERE id = ? AND reporting_to = ?`,
        [target.employee_id, req.user.id]
      )).length > 0;
      if (!isDirectReportee) {
        return res.status(403).json({ error: 'Can only approve targets of your direct reportees (Rule HL5)' });
      }
    }

    if (!['submitted', 'proposed', 'linked'].includes(target.status)) {
      return res.status(400).json({ error: `Cannot approve a target with status '${target.status}'` });
    }

    // Rule V9: Manager must have their own approved targets before approving reportees'
    if (!isHrAdmin) {
      const myApproved = rowsToObjects(db.exec(
        `SELECT COUNT(*) AS cnt FROM targets
         WHERE employee_id = ? AND cycle_id = ? AND status = 'approved'`,
        [req.user.id, target.cycle_id]
      ))[0];
      if (!myApproved || myApproved.cnt === 0) {
        return res.status(400).json({
          error: 'You must have your own approved targets before approving your reportees\' targets (Rule V9).',
        });
      }
    }

    // Rule V4: parent_target_id must be set before approval (except root / bottom-up linked)
    const cycle = rowsToObjects(db.exec(
      `SELECT cascade_mode FROM review_cycles WHERE id = ?`, [target.cycle_id]
    ))[0];
    const effectiveCascade = cycle?.cascade_mode || 'top_down';

    if (effectiveCascade !== 'bottom_up' && !target.parent_target_id && target.hierarchy_level > 1 && target.framework_type !== 'competency') {
      return res.status(400).json({
        error: 'This target has no parent linkage. Set a parent target before approving (Rule V4).',
      });
    }

    // Rule OP4: over-plan requires explicit acknowledgment
    if (target.is_over_planned && !over_plan_approved) {
      return res.status(400).json({
        error: 'This target is over-planned. You must explicitly acknowledge the over-plan before approving (Rule OP4). Set over_plan_approved: true.',
      });
    }

    const oldSnap = { ...target };
    db.run(
      `UPDATE targets SET
         status = 'approved',
         over_plan_approved = ?,
         approved_at = datetime('now'),
         approved_by = ?,
         updated_at  = datetime('now')
       WHERE id = ?`,
      [over_plan_approved ? 1 : 0, req.user.id, req.params.id]
    );
    auditLog(db, req.params.id, req.user.id, 'approved', oldSnap, { ...target, status: 'approved' }, manager_note);
    saveDb();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /targets/:id/reject ──────────────────────────────────────────────────
router.post('/:id/reject', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { rejection_note } = req.body;

    if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Manager role required to reject targets' });
    }
    if (!rejection_note?.trim()) {
      return res.status(400).json({ error: 'A rejection note is required to explain why the target is rejected' });
    }

    const rows = rowsToObjects(db.exec(
      `SELECT * FROM targets WHERE id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    ));
    if (!rows.length) return res.status(404).json({ error: 'Target not found' });
    const target = rows[0];

    if (!['submitted', 'proposed', 'linked'].includes(target.status)) {
      return res.status(400).json({ error: `Cannot reject a target with status '${target.status}'` });
    }

    const oldSnap = { ...target };
    db.run(
      `UPDATE targets SET status = 'rejected', rejection_note = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [rejection_note.trim(), req.params.id]
    );
    auditLog(db, req.params.id, req.user.id, 'rejected', oldSnap, { ...target, status: 'rejected' }, rejection_note);
    saveDb();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /targets/:id/link ────────────────────────────────────────────────────
// Manager links a bottom-up proposed target to one of their own targets.
router.post('/:id/link', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { parent_target_id } = req.body;

    if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Manager role required to link targets' });
    }
    if (!parent_target_id) {
      return res.status(400).json({ error: 'parent_target_id is required' });
    }

    const rows = rowsToObjects(db.exec(
      `SELECT * FROM targets WHERE id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    ));
    if (!rows.length) return res.status(404).json({ error: 'Target not found' });
    const target = rows[0];

    if (!['proposed'].includes(target.status)) {
      return res.status(400).json({ error: 'Only proposed targets can be linked' });
    }

    // Verify parent belongs to this manager
    const parentRows = rowsToObjects(db.exec(
      `SELECT * FROM targets WHERE id = ? AND employee_id = ? AND org_id = ?`,
      [parent_target_id, req.user.id, req.user.org_id]
    ));
    if (!parentRows.length) {
      return res.status(400).json({ error: 'Parent target must belong to you (the manager)' });
    }

    const oldSnap = { ...target };
    db.run(
      `UPDATE targets SET parent_target_id = ?, status = 'linked', updated_at = datetime('now')
       WHERE id = ?`,
      [parent_target_id, req.params.id]
    );
    auditLog(db, req.params.id, req.user.id, 'linked', oldSnap, { ...target, parent_target_id, status: 'linked' });
    saveDb();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /targets/:id ──────────────────────────────────────────────────────────
router.get('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const rows = rowsToObjects(db.exec(
      `SELECT t.*, p.title AS parent_title, p.planned_target AS parent_planned,
              pe.name AS parent_employee_name
       FROM targets t
       LEFT JOIN targets p ON p.id = t.parent_target_id
       LEFT JOIN employees pe ON pe.id = p.employee_id
       WHERE t.id = ? AND t.org_id = ?`,
      [req.params.id, req.user.org_id]
    ));
    if (!rows.length) return res.status(404).json({ error: 'Target not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
