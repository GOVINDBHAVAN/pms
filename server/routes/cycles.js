// Cycle routes: CRUD, status advance, active-cycle lookup
const router = require('express').Router();
const { getDb, saveDb } = require('../db/database');
const requireAuth = require('../middleware/auth');

const CYCLE_STATUSES = ['draft', 'goal_setting', 'active', 'review', 'calibration', 'closed'];

function rowsToObjects(result) {
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

// ── GET /cycles ─────────────────────────────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const rows = rowsToObjects(db.exec(
      `SELECT rc.*, e.name AS created_by_name
       FROM review_cycles rc
       LEFT JOIN employees e ON e.id = rc.created_by
       WHERE rc.org_id = ?
       ORDER BY rc.period_start DESC`,
      [req.user.org_id]
    ));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /cycles/active ───────────────────────────────────────────────────────
// Returns the latest non-closed cycle (for use in target entry etc.)
router.get('/active', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const rows = rowsToObjects(db.exec(
      `SELECT * FROM review_cycles
       WHERE org_id = ? AND status NOT IN ('closed','draft')
       ORDER BY period_start DESC LIMIT 1`,
      [req.user.org_id]
    ));
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /cycles/:id ──────────────────────────────────────────────────────────
router.get('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const rows = rowsToObjects(db.exec(
      `SELECT rc.*, e.name AS created_by_name
       FROM review_cycles rc
       LEFT JOIN employees e ON e.id = rc.created_by
       WHERE rc.id = ? AND rc.org_id = ?`,
      [req.params.id, req.user.org_id]
    ));
    if (!rows.length) return res.status(404).json({ error: 'Cycle not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /cycles ─────────────────────────────────────────────────────────────
router.post('/', requireAuth, (req, res) => {
  const {
    name, cycle_type,
    period_start, period_end,
    goal_set_open, goal_set_close,
    approval_open, approval_close,
    review_open, review_close,
    calibration_open, calibration_close,
    cascade_mode,
    check_in_allowed = 1,
  } = req.body;

  if (!name || !cycle_type || !period_start || !period_end) {
    return res.status(400).json({ error: 'name, cycle_type, period_start, period_end are required' });
  }
  if (period_end <= period_start) {
    return res.status(400).json({ error: 'period_end must be after period_start' });
  }

  try {
    const db = getDb();
    db.run(
      `INSERT INTO review_cycles
         (org_id, name, cycle_type, period_start, period_end,
          goal_set_open, goal_set_close,
          approval_open, approval_close,
          review_open, review_close,
          calibration_open, calibration_close,
          cascade_mode, check_in_allowed,
          status, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'draft',?)`,
      [
        req.user.org_id, name, cycle_type,
        period_start, period_end,
        goal_set_open || null, goal_set_close || null,
        approval_open || null, approval_close || null,
        review_open || null, review_close || null,
        calibration_open || null, calibration_close || null,
        cascade_mode || null, check_in_allowed,
        req.user.id,
      ]
    );
    saveDb();

    const newId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    const rows = rowsToObjects(db.exec(
      `SELECT * FROM review_cycles WHERE id = ?`, [newId]
    ));
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /cycles/:id ──────────────────────────────────────────────────────────
// Only allowed when cycle is in 'draft' status
router.put('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const rows = rowsToObjects(db.exec(
      `SELECT * FROM review_cycles WHERE id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    ));
    if (!rows.length) return res.status(404).json({ error: 'Cycle not found' });

    const cycle = rows[0];
    if (cycle.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft cycles can be edited' });
    }

    const {
      name, cycle_type,
      period_start, period_end,
      goal_set_open, goal_set_close,
      approval_open, approval_close,
      review_open, review_close,
      calibration_open, calibration_close,
      cascade_mode, check_in_allowed,
    } = req.body;

    db.run(
      `UPDATE review_cycles SET
         name            = COALESCE(?, name),
         cycle_type      = COALESCE(?, cycle_type),
         period_start    = COALESCE(?, period_start),
         period_end      = COALESCE(?, period_end),
         goal_set_open   = ?,
         goal_set_close  = ?,
         approval_open   = ?,
         approval_close  = ?,
         review_open     = ?,
         review_close    = ?,
         calibration_open  = ?,
         calibration_close = ?,
         cascade_mode    = COALESCE(?, cascade_mode),
         check_in_allowed = COALESCE(?, check_in_allowed)
       WHERE id = ? AND org_id = ?`,
      [
        name || null, cycle_type || null,
        period_start || null, period_end || null,
        goal_set_open || null, goal_set_close || null,
        approval_open || null, approval_close || null,
        review_open || null, review_close || null,
        calibration_open || null, calibration_close || null,
        cascade_mode || null,
        check_in_allowed !== undefined ? check_in_allowed : null,
        req.params.id, req.user.org_id,
      ]
    );
    saveDb();

    const updated = rowsToObjects(db.exec(
      `SELECT * FROM review_cycles WHERE id = ?`, [req.params.id]
    ));
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /cycles/:id/advance ─────────────────────────────────────────────────
// Advance cycle through: draft → goal_setting → active → review → calibration → closed
// Each transition checks preconditions per business rules.
router.post('/:id/advance', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const rows = rowsToObjects(db.exec(
      `SELECT * FROM review_cycles WHERE id = ? AND org_id = ?`,
      [req.params.id, req.user.org_id]
    ));
    if (!rows.length) return res.status(404).json({ error: 'Cycle not found' });

    const cycle = rows[0];
    const currentIdx = CYCLE_STATUSES.indexOf(cycle.status);
    if (currentIdx === -1 || currentIdx === CYCLE_STATUSES.length - 1) {
      return res.status(400).json({ error: 'Cycle is already closed or in an unknown state' });
    }

    const nextStatus = CYCLE_STATUSES[currentIdx + 1];

    // V13 check: before advancing to 'active', every approved target must have parent_target_id
    // (except company-level root targets). For now we check the rule exists as a warning
    // and will enforce fully when validationService is implemented.
    if (nextStatus === 'active') {
      const unlinked = rowsToObjects(db.exec(
        `SELECT COUNT(*) AS cnt FROM targets
         WHERE cycle_id = ? AND status = 'approved'
           AND parent_target_id IS NULL
           AND hierarchy_level > 1`,
        [cycle.id]
      ));
      const cnt = unlinked[0]?.cnt || 0;
      if (cnt > 0) {
        return res.status(400).json({
          error: `Cannot advance to active: ${cnt} approved target(s) have no parent linkage (V13).`,
        });
      }
    }

    db.run(
      `UPDATE review_cycles SET status = ? WHERE id = ? AND org_id = ?`,
      [nextStatus, req.params.id, req.user.org_id]
    );
    saveDb();

    const updated = rowsToObjects(db.exec(
      `SELECT * FROM review_cycles WHERE id = ?`, [req.params.id]
    ));
    res.json({ cycle: updated[0], advanced_to: nextStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
