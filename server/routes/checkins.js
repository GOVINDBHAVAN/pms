// Check-in routes: periodic actual-value updates against approved targets
const router = require('express').Router();
const { getDb, saveDb } = require('../db/database');
const requireAuth = require('../middleware/auth');

function rowsToObjects(result) {
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

// How many days back to look for a "recent" check-in per frequency type.
// If the last check-in is older than this threshold, the target is "pending".
const FREQUENCY_DAYS = {
  daily:        1,
  weekly:       7,
  bi_weekly:    14,
  monthly:      31,
  quarterly:    92,
  semi_annual:  183,
  annual:       366,
};

function daysSince(isoStr) {
  if (!isoStr) return Infinity;
  return (Date.now() - new Date(isoStr).getTime()) / 86400000;
}

// ── GET /checkins?target_id= ─────────────────────────────────────────────────
// List all check-ins for a given target. Own targets or manager/HR.
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { target_id } = req.query;
    if (!target_id) return res.status(400).json({ error: 'target_id required' });

    const targets = rowsToObjects(db.exec(
      `SELECT id, employee_id FROM targets WHERE id = ? AND org_id = ?`,
      [parseInt(target_id), req.user.org_id]
    ));
    if (!targets.length) return res.status(404).json({ error: 'Target not found' });

    const target = targets[0];
    const isOwner = target.employee_id === req.user.id;
    const isPrivileged = ['admin', 'hr', 'manager'].includes(req.user.role);
    if (!isOwner && !isPrivileged) return res.status(403).json({ error: 'Access denied' });

    const rows = rowsToObjects(db.exec(
      `SELECT c.*, e.name AS acknowledged_by_name
       FROM checkins c
       LEFT JOIN employees e ON e.id = c.acknowledged_by
       WHERE c.target_id = ?
       ORDER BY c.created_at DESC`,
      [parseInt(target_id)]
    ));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /checkins/pending ────────────────────────────────────────────────────
// Returns the logged-in employee's targets that are overdue for a check-in
// based on each target's own checkin_frequency (Rule PT2).
router.get('/pending', requireAuth, (req, res) => {
  try {
    const db = getDb();

    const cycles = rowsToObjects(db.exec(
      `SELECT id, name, status, check_in_allowed
       FROM review_cycles
       WHERE org_id = ? AND status IN ('active','review') AND check_in_allowed = 1
       ORDER BY period_start DESC LIMIT 1`,
      [req.user.org_id]
    ));
    if (!cycles.length) return res.json({ pending: [], cycle: null });
    const cycle = cycles[0];

    // Fetch numeric, approved targets with last check-in date and frequency
    const targets = rowsToObjects(db.exec(
      `SELECT t.id, t.title, t.framework_type, t.planned_target, t.unit,
              t.actual_value, t.measurement_type, t.status,
              t.checkin_frequency,
              (SELECT MAX(ci.created_at) FROM checkins ci WHERE ci.target_id = t.id) AS last_checkin_at,
              (SELECT COUNT(*) FROM checkins ci WHERE ci.target_id = t.id) AS checkin_count,
              (SELECT ci.status_flag FROM checkins ci WHERE ci.target_id = t.id
               ORDER BY ci.created_at DESC LIMIT 1) AS last_status_flag
       FROM targets t
       WHERE t.employee_id = ? AND t.org_id = ? AND t.cycle_id = ?
         AND t.status IN ('approved','active','locked')
         AND t.framework_type NOT IN ('okr_objective','kra')
         AND t.planned_target IS NOT NULL
       ORDER BY t.framework_type, t.id`,
      [req.user.id, req.user.org_id, cycle.id]
    ));

    // Flag as pending if last check-in is older than the target's frequency window
    const pending = targets.filter(t => {
      const windowDays = FREQUENCY_DAYS[t.checkin_frequency] ?? 31;
      return daysSince(t.last_checkin_at) > windowDays;
    });

    res.json({ pending, cycle, all_targets: targets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /checkins/rollup?cycle_id= ──────────────────────────────────────────
// Leadership / manager rollup: shows check-in status across the full
// downward tree so CEO/VP/HOD can see how each level is progressing
// without waiting for formal review.
// Returns a flat list of employees in the subtree with their latest
// check-in status_flag distribution and last check-in date.
router.get('/rollup', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { cycle_id } = req.query;

    if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Manager or HR access required' });
    }

    // Resolve the full downward subtree under the requesting user
    const subtreeRows = rowsToObjects(db.exec(
      `WITH RECURSIVE tree(id, name, reporting_to, dept_id, grade_id, depth) AS (
         SELECT id, name, reporting_to, dept_id, grade_id, 0
         FROM employees WHERE reporting_to = ? AND org_id = ?
         UNION ALL
         SELECT e.id, e.name, e.reporting_to, e.dept_id, e.grade_id, t.depth + 1
         FROM employees e JOIN tree t ON e.reporting_to = t.id
         WHERE t.depth < 10
       )
       SELECT tree.id, tree.name, tree.depth,
              g.label AS grade_label, g.level AS grade_level,
              d.name  AS dept_name
       FROM tree
       LEFT JOIN grades      g ON g.id = tree.grade_id
       LEFT JOIN departments d ON d.id = tree.dept_id
       ORDER BY tree.depth, tree.name`,
      [req.user.id, req.user.org_id]
    ));

    if (!subtreeRows.length) return res.json({ employees: [], cycle_id });

    const empIds = subtreeRows.map(r => r.id);
    const ph = empIds.map(() => '?').join(',');

    // Resolve active cycle if not provided
    let activeCycleId = cycle_id ? parseInt(cycle_id) : null;
    if (!activeCycleId) {
      const cycleRows = rowsToObjects(db.exec(
        `SELECT id FROM review_cycles
         WHERE org_id = ? AND status IN ('active','review','goal_setting')
         ORDER BY period_start DESC LIMIT 1`,
        [req.user.org_id]
      ));
      activeCycleId = cycleRows[0]?.id ?? null;
    }

    if (!activeCycleId) return res.json({ employees: [], cycle_id: null });

    // For each employee: count of targets, latest check-in, status distribution
    const checkinStats = rowsToObjects(db.exec(
      `SELECT
         t.employee_id,
         COUNT(DISTINCT t.id) AS target_count,
         SUM(CASE WHEN t.status IN ('approved','active','locked') THEN 1 ELSE 0 END) AS active_targets,
         MAX(ci.created_at) AS last_checkin_at,
         COUNT(ci.id) AS total_checkins,
         SUM(CASE WHEN ci.status_flag = 'on_track'  THEN 1 ELSE 0 END) AS on_track_count,
         SUM(CASE WHEN ci.status_flag = 'at_risk'   THEN 1 ELSE 0 END) AS at_risk_count,
         SUM(CASE WHEN ci.status_flag = 'blocked'   THEN 1 ELSE 0 END) AS blocked_count,
         SUM(CASE WHEN ci.status_flag = 'completed' THEN 1 ELSE 0 END) AS completed_count
       FROM targets t
       LEFT JOIN checkins ci ON ci.target_id = t.id
       WHERE t.employee_id IN (${ph}) AND t.org_id = ? AND t.cycle_id = ?
         AND t.framework_type NOT IN ('okr_objective','kra')
       GROUP BY t.employee_id`,
      [...empIds, req.user.org_id, activeCycleId]
    ));

    const statsById = {};
    for (const s of checkinStats) statsById[s.employee_id] = s;

    // Derive overall health per employee from latest check-in status_flag
    const latestStatusRows = rowsToObjects(db.exec(
      `SELECT ci.employee_id, ci.status_flag, ci.confidence_score, ci.created_at
       FROM checkins ci
       WHERE ci.employee_id IN (${ph}) AND ci.cycle_id = ?
         AND ci.created_at = (
           SELECT MAX(ci2.created_at) FROM checkins ci2
           WHERE ci2.employee_id = ci.employee_id AND ci2.cycle_id = ci.cycle_id
         )`,
      [...empIds, activeCycleId]
    ));
    const latestById = {};
    for (const r of latestStatusRows) latestById[r.employee_id] = r;

    const employees = subtreeRows.map(emp => {
      const stats = statsById[emp.id] || {};
      const latest = latestById[emp.id] || {};
      return {
        ...emp,
        target_count:    stats.target_count    ?? 0,
        active_targets:  stats.active_targets  ?? 0,
        total_checkins:  stats.total_checkins  ?? 0,
        last_checkin_at: stats.last_checkin_at ?? null,
        latest_status:   latest.status_flag    ?? null,
        latest_confidence: latest.confidence_score ?? null,
        on_track_count:  stats.on_track_count  ?? 0,
        at_risk_count:   stats.at_risk_count   ?? 0,
        blocked_count:   stats.blocked_count   ?? 0,
        completed_count: stats.completed_count ?? 0,
      };
    });

    res.json({ employees, cycle_id: activeCycleId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /checkins ───────────────────────────────────────────────────────────
// Record a new check-in for a target. Immutable — no edits allowed (Rule PT6).
router.post('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const {
      target_id, period_type, period_label,
      actual_value, notes,
      status_flag, confidence_score,
    } = req.body;

    if (!target_id)            return res.status(400).json({ error: 'target_id required' });
    if (!period_type)          return res.status(400).json({ error: 'period_type required' });
    if (!period_label?.trim()) return res.status(400).json({ error: 'period_label required' });
    if (actual_value == null || actual_value === '') return res.status(400).json({ error: 'actual_value required' });

    const VALID_FLAGS = ['on_track', 'at_risk', 'blocked', 'completed'];
    const flag = VALID_FLAGS.includes(status_flag) ? status_flag : 'on_track';

    const targets = rowsToObjects(db.exec(
      `SELECT id, employee_id, cycle_id, planned_target, framework_type
       FROM targets WHERE id = ? AND org_id = ?`,
      [parseInt(target_id), req.user.org_id]
    ));
    if (!targets.length) return res.status(404).json({ error: 'Target not found' });
    const target = targets[0];
    if (target.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Can only check in on your own targets' });
    }

    const cycles = rowsToObjects(db.exec(
      `SELECT id, status, check_in_allowed FROM review_cycles WHERE id = ?`,
      [target.cycle_id]
    ));
    if (!cycles.length) return res.status(400).json({ error: 'Cycle not found' });
    const cycle = cycles[0];
    if (!cycle.check_in_allowed) {
      return res.status(400).json({ error: 'Check-ins are not enabled for this cycle' });
    }
    if (!['active', 'review', 'goal_setting'].includes(cycle.status)) {
      return res.status(400).json({ error: 'Check-ins are only allowed during active or review phase' });
    }

    // confidence_score only relevant for OKR Key Results (Rule PT4)
    const isOkrKr = target.framework_type === 'okr_kr';
    const confScore = isOkrKr && confidence_score != null
      ? Math.min(1.0, Math.max(0.0, parseFloat(confidence_score)))
      : null;

    const val = parseFloat(actual_value);
    const progress_pct = target.planned_target
      ? Math.round((val / parseFloat(target.planned_target)) * 1000) / 10
      : null;

    db.run(
      `INSERT INTO checkins
         (target_id, employee_id, cycle_id, period_type, period_label,
          actual_value, progress_pct, notes, status_flag, confidence_score)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        parseInt(target_id), req.user.id, target.cycle_id,
        period_type, period_label.trim(),
        val, progress_pct,
        notes?.trim() || null,
        flag, confScore,
      ]
    );
    const newId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];

    // Mirror latest actual onto the target so MyTargets shows live progress (Rule PT5)
    db.run(`UPDATE targets SET actual_value = ? WHERE id = ?`, [val, parseInt(target_id)]);
    saveDb();

    const created = rowsToObjects(db.exec(`SELECT * FROM checkins WHERE id = ?`, [newId]))[0];
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /checkins/:id/acknowledge ─────────────────────────────────────────
// Manager marks a check-in as seen.
router.patch('/:id/acknowledge', requireAuth, (req, res) => {
  try {
    const db = getDb();
    if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only managers can acknowledge check-ins' });
    }
    db.run(
      `UPDATE checkins SET acknowledged_by = ?, acknowledged_at = datetime('now') WHERE id = ?`,
      [req.user.id, parseInt(req.params.id)]
    );
    saveDb();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
