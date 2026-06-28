const router = require('express').Router();
const { getDb } = require('../db/database');
const requireAuth = require('../middleware/auth');

function rowsToObjects(result) {
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

// GET /employees — paginated list (admin/HR)
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 50, dept_id, role } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = `e.org_id = ${req.user.org_id}`;
    if (dept_id) where += ` AND e.dept_id = ${parseInt(dept_id)}`;
    if (role)    where += ` AND e.role = '${role}'`;

    const result = db.exec(
      `SELECT e.id, e.org_id, e.emp_code, e.name, e.email, e.role, e.is_active,
              e.dept_id, e.grade_id, e.reporting_to, e.joined_on,
              g.code AS grade_code, g.label AS grade_label,
              d.name AS dept_name,
              m.name AS manager_name
       FROM employees e
       LEFT JOIN grades g ON g.id = e.grade_id
       LEFT JOIN departments d ON d.id = e.dept_id
       LEFT JOIN employees m ON m.id = e.reporting_to
       WHERE ${where}
       ORDER BY e.name
       LIMIT ${parseInt(limit)} OFFSET ${offset}`
    );

    const countResult = db.exec(`SELECT COUNT(*) FROM employees e WHERE ${where}`);
    const total = countResult[0]?.values[0][0] ?? 0;

    res.json({ data: rowsToObjects(result), total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /employees
router.post('/', requireAuth, async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const { getDb: _getDb, saveDb } = require('../db/database');
    const db = _getDb();
    const { emp_code, name, email, password, dept_id, grade_id, reporting_to, role } = req.body;

    const hash = await bcrypt.hash(password || 'Welcome@123', 10);
    db.run(
      `INSERT INTO employees (org_id, emp_code, name, email, password_hash, dept_id, grade_id, reporting_to, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.org_id, emp_code || null, name, email, hash,
       dept_id || null, grade_id || null, reporting_to || null, role || 'employee']
    );
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDb();
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /employees/:id
router.get('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `SELECT e.id, e.org_id, e.emp_code, e.name, e.email, e.role, e.is_active,
              e.dept_id, e.grade_id, e.reporting_to, e.joined_on,
              g.code AS grade_code, g.label AS grade_label, g.level AS grade_level,
              d.name AS dept_name,
              m.name AS manager_name
       FROM employees e
       LEFT JOIN grades g ON g.id = e.grade_id
       LEFT JOIN departments d ON d.id = e.dept_id
       LEFT JOIN employees m ON m.id = e.reporting_to
       WHERE e.id = ? AND e.org_id = ?`,
      [req.params.id, req.user.org_id]
    );
    const rows = rowsToObjects(result);
    if (!rows.length) return res.status(404).json({ error: 'Employee not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /employees/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const { getDb: _db, saveDb } = require('../db/database');
    const db = _db();
    const { name, emp_code, dept_id, grade_id, role, is_active } = req.body;

    // reporting_to can be explicitly set to null (to make someone a root-level employee)
    const rtProvided = Object.prototype.hasOwnProperty.call(req.body, 'reporting_to');
    const rtVal = rtProvided ? (req.body.reporting_to || null) : undefined;

    db.run(
      `UPDATE employees SET
         name         = COALESCE(?, name),
         emp_code     = COALESCE(?, emp_code),
         dept_id      = COALESCE(?, dept_id),
         grade_id     = COALESCE(?, grade_id),
         reporting_to = CASE WHEN ? = 1 THEN ? ELSE reporting_to END,
         role         = COALESCE(?, role),
         is_active    = COALESCE(?, is_active)
       WHERE id = ? AND org_id = ?`,
      [
        name || null, emp_code || null, dept_id || null, grade_id || null,
        rtProvided ? 1 : 0, rtVal,
        role || null, is_active != null ? is_active : null,
        req.params.id, req.user.org_id,
      ]
    );
    saveDb();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /employees/:id/hierarchy-chain — upward chain (senior → junior)
router.get('/:id/hierarchy-chain', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `WITH RECURSIVE chain AS (
         SELECT id, name, reporting_to, grade_id, dept_id, 0 AS depth
         FROM employees WHERE id = ? AND org_id = ?

         UNION ALL

         SELECT e.id, e.name, e.reporting_to, e.grade_id, e.dept_id, c.depth + 1
         FROM employees e
         INNER JOIN chain c ON e.id = c.reporting_to
         WHERE e.org_id = ?
       )
       SELECT
         c.id, c.name, c.depth,
         g.code AS grade_code, g.label AS grade_label, g.level,
         d.name AS dept_name
       FROM chain c
       LEFT JOIN grades g ON g.id = c.grade_id
       LEFT JOIN departments d ON d.id = c.dept_id
       ORDER BY c.depth DESC`,
      [req.params.id, req.user.org_id, req.user.org_id]
    );
    res.json(rowsToObjects(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /employees/:id/direct-reportees
router.get('/:id/direct-reportees', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `SELECT e.id, e.name, e.email, e.role,
              g.code AS grade_code, g.label AS grade_label,
              d.name AS dept_name
       FROM employees e
       LEFT JOIN grades g ON g.id = e.grade_id
       LEFT JOIN departments d ON d.id = e.dept_id
       WHERE e.reporting_to = ? AND e.org_id = ? AND e.is_active = 1
       ORDER BY e.name`,
      [req.params.id, req.user.org_id]
    );
    res.json(rowsToObjects(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /employees/:id/reportees — full downward tree
router.get('/:id/reportees', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `WITH RECURSIVE tree AS (
         SELECT id, name, reporting_to, grade_id, dept_id, 0 AS depth
         FROM employees WHERE reporting_to = ? AND org_id = ?

         UNION ALL

         SELECT e.id, e.name, e.reporting_to, e.grade_id, e.dept_id, t.depth + 1
         FROM employees e
         INNER JOIN tree t ON e.reporting_to = t.id
         WHERE e.org_id = ?
       )
       SELECT tree.id, tree.name, tree.reporting_to, tree.depth,
              g.code AS grade_code, g.label AS grade_label,
              d.name AS dept_name
       FROM tree
       LEFT JOIN grades g ON g.id = tree.grade_id
       LEFT JOIN departments d ON d.id = tree.dept_id
       ORDER BY tree.depth, tree.name`,
      [req.params.id, req.user.org_id, req.user.org_id]
    );
    res.json(rowsToObjects(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
