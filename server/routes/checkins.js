// Check-in routes: periodic actual-value updates against approved targets
const router = require('express').Router();
const { getDb, saveDb } = require('../db/database');
const requireAuth = require('../middleware/auth');

function rowsToObjects(result) {
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
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
// Returns the logged-in employee's targets that have no check-in this calendar
// month, in a cycle where check_in_allowed = 1 and status is active or review.
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

    // Targets that are numeric (not objective/folder) and have been approved
    const targets = rowsToObjects(db.exec(
      `SELECT t.id, t.title, t.framework_type, t.planned_target, t.unit,
              t.actual_value, t.measurement_type, t.status,
              (SELECT MAX(ci.created_at) FROM checkins ci WHERE ci.target_id = t.id) AS last_checkin_at,
              (SELECT COUNT(*) FROM checkins ci WHERE ci.target_id = t.id) AS checkin_count
       FROM targets t
       WHERE t.employee_id = ? AND t.org_id = ? AND t.cycle_id = ?
         AND t.status IN ('approved','active','locked')
         AND t.framework_type NOT IN ('okr_objective','kra')
         AND t.planned_target IS NOT NULL
       ORDER BY t.framework_type, t.id`,
      [req.user.id, req.user.org_id, cycle.id]
    ));

    // Flag as "needs check-in this month" if no check-in in the last 31 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 31);
    const cutoffStr = cutoff.toISOString();

    const pending = targets.filter(t =>
      !t.last_checkin_at || t.last_checkin_at < cutoffStr
    );

    res.json({ pending, cycle, all_targets: targets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /checkins ───────────────────────────────────────────────────────────
// Record a new check-in for a target.
router.post('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { target_id, period_type, period_label, actual_value, notes } = req.body;

    if (!target_id)           return res.status(400).json({ error: 'target_id required' });
    if (!period_type)         return res.status(400).json({ error: 'period_type required' });
    if (!period_label?.trim()) return res.status(400).json({ error: 'period_label required' });
    if (actual_value == null || actual_value === '') return res.status(400).json({ error: 'actual_value required' });

    const targets = rowsToObjects(db.exec(
      `SELECT id, employee_id, cycle_id, planned_target FROM targets WHERE id = ? AND org_id = ?`,
      [parseInt(target_id), req.user.org_id]
    ));
    if (!targets.length) return res.status(404).json({ error: 'Target not found' });
    const target = targets[0];
    if (target.employee_id !== req.user.id) return res.status(403).json({ error: 'Can only check in on your own targets' });

    const cycles = rowsToObjects(db.exec(
      `SELECT id, status, check_in_allowed FROM review_cycles WHERE id = ?`,
      [target.cycle_id]
    ));
    if (!cycles.length) return res.status(400).json({ error: 'Cycle not found' });
    const cycle = cycles[0];
    if (!cycle.check_in_allowed) return res.status(400).json({ error: 'Check-ins are not enabled for this cycle' });
    if (!['active', 'review', 'goal_setting'].includes(cycle.status)) {
      return res.status(400).json({ error: 'Check-ins are only allowed during active or review phase' });
    }

    const val = parseFloat(actual_value);
    const progress_pct = target.planned_target
      ? Math.round((val / parseFloat(target.planned_target)) * 1000) / 10
      : null;

    db.run(
      `INSERT INTO checkins
         (target_id, employee_id, cycle_id, period_type, period_label, actual_value, progress_pct, notes)
       VALUES (?,?,?,?,?,?,?,?)`,
      [parseInt(target_id), req.user.id, target.cycle_id,
       period_type, period_label.trim(), val, progress_pct,
       notes?.trim() || null]
    );
    const newId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];

    // Mirror latest actual onto the target itself so MyTargets shows live progress
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
