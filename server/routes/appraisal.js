// Appraisal routes: self-rate, manager-rate, summary computation, calibration
const router = require('express').Router();
const { getDb, saveDb } = require('../db/database');
const requireAuth = require('../middleware/auth');

// Types that are folder items — never directly rated; score derived from sub-items.
const FOLDER_TYPES = ['okr_objective', 'kra'];

// Types that carry a formal self/manager rating.
const RATABLE_TYPES = ['okr_kr', 'kpi', 'goal', 'bsc_metric', 'competency'];

function rowsToObjects(result) {
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

function auditLog(db, targetId, changedBy, action, oldSnap, newSnap, note) {
  db.run(
    `INSERT INTO target_audit_log
       (target_id, changed_by, action, old_snapshot, new_snapshot, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [targetId, changedBy, action,
     JSON.stringify(oldSnap), JSON.stringify(newSnap), note || null]
  );
}

// ── GET /appraisal/cycles/:cycleId/self ──────────────────────────────────────
// Returns all approved/active/locked targets for the logged-in employee in this
// cycle, plus org settings (rating scale) and cycle metadata.
// Pre-fills each target with the latest check-in actual_value (Rule PT5) so the
// employee doesn't have to re-enter what they already tracked.
router.get('/cycles/:cycleId/self', requireAuth, (req, res) => {
  try {
    const db    = getDb();
    const cycleId    = parseInt(req.params.cycleId);
    const employeeId = req.user.id;

    // Cycle
    const cycles = rowsToObjects(db.exec(
      `SELECT id, name, status, cycle_type,
              period_start, period_end,
              review_open, review_close
       FROM review_cycles
       WHERE id = ? AND org_id = ?`,
      [cycleId, req.user.org_id]
    ));
    if (!cycles.length) return res.status(404).json({ error: 'Cycle not found' });
    const cycle = cycles[0];

    // Org settings (rating scale, weightage, performance bands, terminology)
    const orgs = rowsToObjects(db.exec(
      `SELECT settings FROM organizations WHERE id = ?`,
      [req.user.org_id]
    ));
    let orgSettings = {};
    if (orgs.length) {
      try { orgSettings = JSON.parse(orgs[0].settings); } catch {}
    }

    // Approved/active/locked targets for this employee in this cycle.
    // Sub-query pulls the latest check-in actual_value for pre-fill (Rule PT5).
    const targets = rowsToObjects(db.exec(
      `SELECT
         t.*,
         p.title            AS parent_title,
         p.planned_target   AS parent_planned,
         pe.name            AS parent_employee_name,
         (SELECT c.actual_value
          FROM checkins c
          WHERE c.target_id = t.id
          ORDER BY c.created_at DESC LIMIT 1) AS last_checkin_value,
         (SELECT c.period_label
          FROM checkins c
          WHERE c.target_id = t.id
          ORDER BY c.created_at DESC LIMIT 1) AS last_checkin_label
       FROM targets t
       LEFT JOIN targets  p  ON p.id  = t.parent_target_id
       LEFT JOIN employees pe ON pe.id = p.employee_id
       WHERE t.employee_id = ?
         AND t.org_id      = ?
         AND t.cycle_id    = ?
         AND t.status IN ('approved', 'active', 'locked')
       ORDER BY t.framework_type, t.created_at`,
      [employeeId, req.user.org_id, cycleId]
    ));

    res.json({ cycle, targets, orgSettings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /appraisal/cycles/:cycleId/targets/:id/self-rate ────────────────────
// Save self_rating, self_comment, and (optionally) actual_value for one target.
// Cycle must be in 'review' status; target must belong to the calling employee.
router.post('/cycles/:cycleId/targets/:id/self-rate', requireAuth, (req, res) => {
  try {
    const db      = getDb();
    const cycleId  = parseInt(req.params.cycleId);
    const targetId = parseInt(req.params.id);

    // ── Validate cycle is in review status ──
    const cycles = rowsToObjects(db.exec(
      `SELECT status FROM review_cycles WHERE id = ? AND org_id = ?`,
      [cycleId, req.user.org_id]
    ));
    if (!cycles.length) return res.status(404).json({ error: 'Cycle not found' });
    if (cycles[0].status !== 'review') {
      return res.status(400).json({
        error: `Self-appraisal is not open. Cycle is currently in '${cycles[0].status}' status. HR must advance the cycle to 'review' to open appraisal.`,
      });
    }

    // ── Validate target ownership and cycle membership ──
    const rows = rowsToObjects(db.exec(
      `SELECT * FROM targets
       WHERE id = ? AND employee_id = ? AND cycle_id = ? AND org_id = ?`,
      [targetId, req.user.id, cycleId, req.user.org_id]
    ));
    if (!rows.length) {
      return res.status(404).json({ error: 'Target not found or access denied' });
    }
    const target = rows[0];

    // ── Block folder types ──
    if (FOLDER_TYPES.includes(target.framework_type)) {
      return res.status(400).json({
        error: `'${target.framework_type}' is a folder item and cannot be rated directly. Rate the items inside it.`,
      });
    }

    // ── Target must be in a rateable status ──
    if (!['approved', 'active', 'locked'].includes(target.status)) {
      return res.status(400).json({
        error: `Target is in '${target.status}' status and cannot be rated.`,
      });
    }

    const { self_rating, self_comment } = req.body;
    // actual_value: only update if the key was explicitly sent in the body
    const hasActual = Object.prototype.hasOwnProperty.call(req.body, 'actual_value');
    const actual_value = hasActual ? req.body.actual_value : undefined;

    // ── Validate self_rating ──
    if (self_rating !== undefined && self_rating !== null) {
      const r = parseFloat(self_rating);
      if (isNaN(r) || r < 0) {
        return res.status(400).json({ error: 'self_rating must be a non-negative number' });
      }
    }

    const oldSnap = {
      self_rating:   target.self_rating,
      self_comment:  target.self_comment,
      actual_value:  target.actual_value,
    };

    if (hasActual) {
      db.run(
        `UPDATE targets
         SET self_rating   = COALESCE(?, self_rating),
             self_comment  = COALESCE(?, self_comment),
             actual_value  = ?,
             self_rated_at = datetime('now'),
             updated_at    = datetime('now')
         WHERE id = ?`,
        [
          self_rating != null ? parseFloat(self_rating) : null,
          self_comment != null ? self_comment : null,
          actual_value != null ? parseFloat(actual_value) : null,
          targetId,
        ]
      );
    } else {
      db.run(
        `UPDATE targets
         SET self_rating   = COALESCE(?, self_rating),
             self_comment  = COALESCE(?, self_comment),
             self_rated_at = datetime('now'),
             updated_at    = datetime('now')
         WHERE id = ?`,
        [
          self_rating != null ? parseFloat(self_rating) : null,
          self_comment != null ? self_comment : null,
          targetId,
        ]
      );
    }

    auditLog(db, targetId, req.user.id, 'self_rated', oldSnap,
      { self_rating, self_comment, actual_value }, null);
    saveDb();

    const updated = rowsToObjects(db.exec(`SELECT * FROM targets WHERE id = ?`, [targetId]))[0];
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /appraisal/cycles/:cycleId/team ─────────────────────────────────────
// Returns all direct reportees with their approved targets and check-in history
// for the calling manager. Check-ins provide the "insight without calling them"
// data — month-by-month progress notes tell the performance story.
router.get('/cycles/:cycleId/team', requireAuth, (req, res) => {
  try {
    const db        = getDb();
    const cycleId   = parseInt(req.params.cycleId);
    const managerId = req.user.id;
    const orgId     = req.user.org_id;

    // Cycle
    const cycles = rowsToObjects(db.exec(
      `SELECT id, name, status, cycle_type,
              period_start, period_end,
              review_open, review_close
       FROM review_cycles
       WHERE id = ? AND org_id = ?`,
      [cycleId, orgId]
    ));
    if (!cycles.length) return res.status(404).json({ error: 'Cycle not found' });
    const cycle = cycles[0];

    // Org settings
    const orgs = rowsToObjects(db.exec(
      `SELECT settings FROM organizations WHERE id = ?`, [orgId]
    ));
    let orgSettings = {};
    if (orgs.length) { try { orgSettings = JSON.parse(orgs[0].settings); } catch {} }

    // Direct reportees
    const reporteeRows = rowsToObjects(db.exec(
      `SELECT e.id, e.name, e.emp_code, e.email,
              d.name  AS dept_name,
              g.label AS grade_label, g.code AS grade_code
       FROM employees e
       LEFT JOIN departments d ON d.id = e.dept_id
       LEFT JOIN grades      g ON g.id = e.grade_id
       WHERE e.reporting_to = ? AND e.org_id = ? AND e.is_active = 1
       ORDER BY e.name`,
      [managerId, orgId]
    ));

    if (!reporteeRows.length) {
      return res.json({ cycle, orgSettings, reportees: [] });
    }

    // All their targets in this cycle (one query — subquery IN)
    const targetRows = rowsToObjects(db.exec(
      `SELECT t.*,
              p.title          AS parent_title,
              p.planned_target AS parent_planned,
              p.actual_value   AS parent_actual,
              pe.name          AS parent_employee_name
       FROM targets t
       LEFT JOIN targets   p  ON p.id  = t.parent_target_id
       LEFT JOIN employees pe ON pe.id = p.employee_id
       WHERE t.employee_id IN
             (SELECT id FROM employees WHERE reporting_to = ? AND org_id = ?)
         AND t.org_id   = ?
         AND t.cycle_id = ?
         AND t.status IN ('approved', 'active', 'locked')
       ORDER BY t.employee_id, t.framework_type, t.created_at`,
      [managerId, orgId, orgId, cycleId]
    ));

    // All check-ins for those employees in this cycle (chronological — last ~12 per target)
    const checkinRows = rowsToObjects(db.exec(
      `SELECT c.id, c.target_id, c.employee_id, c.period_type, c.period_label,
              c.actual_value, c.progress_pct, c.notes, c.created_at
       FROM checkins c
       WHERE c.cycle_id     = ?
         AND c.employee_id IN
             (SELECT id FROM employees WHERE reporting_to = ? AND org_id = ?)
       ORDER BY c.target_id, c.created_at ASC`,
      [cycleId, managerId, orgId]
    ));

    // Most recent prior-cycle performance summary per reportee (historical context)
    const priorRows = rowsToObjects(db.exec(
      `SELECT ps.employee_id, ps.final_score, ps.performance_band,
              rc.name AS cycle_name
       FROM performance_summary ps
       JOIN review_cycles rc ON rc.id = ps.cycle_id
       WHERE ps.cycle_id != ?
         AND rc.org_id   = ?
         AND ps.employee_id IN
             (SELECT id FROM employees WHERE reporting_to = ? AND org_id = ?)
       ORDER BY ps.employee_id, rc.period_start DESC`,
      [cycleId, orgId, managerId, orgId]
    ));

    // ── Compose on JS side ──────────────────────────────────────────────────
    // Group check-ins by target_id
    const checkinsByTarget = {};
    for (const c of checkinRows) {
      if (!checkinsByTarget[c.target_id]) checkinsByTarget[c.target_id] = [];
      checkinsByTarget[c.target_id].push(c);
    }

    // Most-recent prior summary per employee (rows are sorted DESC already)
    const priorByEmployee = {};
    for (const s of priorRows) {
      if (!priorByEmployee[s.employee_id]) priorByEmployee[s.employee_id] = s;
    }

    // Group targets by employee_id, attach check-ins
    const targetsByEmployee = {};
    for (const t of targetRows) {
      if (!targetsByEmployee[t.employee_id]) targetsByEmployee[t.employee_id] = [];
      t.checkins = checkinsByTarget[t.id] || [];
      targetsByEmployee[t.employee_id].push(t);
    }

    const reportees = reporteeRows.map(emp => ({
      employee:     emp,
      targets:      targetsByEmployee[emp.id] || [],
      priorSummary: priorByEmployee[emp.id]   || null,
    }));

    res.json({ cycle, orgSettings, reportees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /appraisal/cycles/:cycleId/employees/:empId/targets/:id/manager-rate ──
// Save manager_rating and manager_comment for one of a direct report's targets.
// Per Rule AP3, final_rating = manager_rating (HR may calibrate later via CAL2).
// Cycle must be in 'review'; manager must be the direct reporting_to of empId.
router.post(
  '/cycles/:cycleId/employees/:empId/targets/:id/manager-rate',
  requireAuth,
  (req, res) => {
    try {
      const db        = getDb();
      const cycleId   = parseInt(req.params.cycleId);
      const empId     = parseInt(req.params.empId);
      const targetId  = parseInt(req.params.id);
      const managerId = req.user.id;
      const orgId     = req.user.org_id;

      // ── Cycle must be in 'review' ──
      const cycles = rowsToObjects(db.exec(
        `SELECT status FROM review_cycles WHERE id = ? AND org_id = ?`,
        [cycleId, orgId]
      ));
      if (!cycles.length) return res.status(404).json({ error: 'Cycle not found' });
      if (cycles[0].status !== 'review') {
        return res.status(400).json({
          error: `Manager appraisal is not open. Cycle is in '${cycles[0].status}' status. HR must set the cycle to 'review'.`,
        });
      }

      // ── empId must be a direct reportee of this manager ──
      const empRows = rowsToObjects(db.exec(
        `SELECT id, name FROM employees
         WHERE id = ? AND reporting_to = ? AND org_id = ? AND is_active = 1`,
        [empId, managerId, orgId]
      ));
      if (!empRows.length) {
        return res.status(403).json({
          error: 'Access denied. You can only rate your direct reportees.',
        });
      }

      // ── Target must belong to empId in this cycle ──
      const tRows = rowsToObjects(db.exec(
        `SELECT * FROM targets
         WHERE id = ? AND employee_id = ? AND cycle_id = ? AND org_id = ?`,
        [targetId, empId, cycleId, orgId]
      ));
      if (!tRows.length) {
        return res.status(404).json({ error: 'Target not found or access denied' });
      }
      const target = tRows[0];

      // ── Folder types cannot be rated directly ──
      if (FOLDER_TYPES.includes(target.framework_type)) {
        return res.status(400).json({
          error: `'${target.framework_type}' is a folder item. Rate the items inside it.`,
        });
      }

      // ── Target must be in a rateable status ──
      if (!['approved', 'active', 'locked'].includes(target.status)) {
        return res.status(400).json({
          error: `Target is in '${target.status}' status and cannot be rated.`,
        });
      }

      const { manager_rating, manager_comment } = req.body;

      // ── manager_rating is required ──
      if (manager_rating == null) {
        return res.status(400).json({ error: 'manager_rating is required' });
      }
      const r = parseFloat(manager_rating);
      if (isNaN(r) || r < 0) {
        return res.status(400).json({ error: 'manager_rating must be a non-negative number' });
      }

      const oldSnap = {
        manager_rating:  target.manager_rating,
        manager_comment: target.manager_comment,
        final_rating:    target.final_rating,
      };

      // Rule AP3: final_rating = manager_rating (HR calibration may change it later via CAL2)
      db.run(
        `UPDATE targets
         SET manager_rating   = ?,
             manager_comment  = ?,
             final_rating     = ?,
             manager_rated_at = datetime('now'),
             updated_at       = datetime('now')
         WHERE id = ?`,
        [r, manager_comment ?? null, r, targetId]
      );

      auditLog(db, targetId, managerId, 'manager_rated', oldSnap,
        { manager_rating: r, manager_comment: manager_comment ?? null, final_rating: r }, null);
      saveDb();

      const updated = rowsToObjects(db.exec(`SELECT * FROM targets WHERE id = ?`, [targetId]))[0];
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
