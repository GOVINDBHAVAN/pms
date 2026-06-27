const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const requireAuth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'pms-dev-secret-key';

function buildToken(employee) {
  return jwt.sign(
    {
      id: employee.id,
      org_id: employee.org_id,
      role: employee.role,
      wizard_completed: employee.wizard_completed,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function rowsToObjects(result) {
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const db = getDb();
    const result = db.exec(
      `SELECT e.id, e.org_id, e.emp_code, e.name, e.email, e.password_hash,
              e.role, e.is_active, e.dept_id, e.grade_id, e.reporting_to,
              g.code AS grade_code, g.label AS grade_label,
              d.name AS dept_name,
              o.name AS org_name, o.wizard_completed, o.framework, o.cascade_mode, o.industry
       FROM employees e
       LEFT JOIN grades g ON g.id = e.grade_id
       LEFT JOIN departments d ON d.id = e.dept_id
       JOIN organizations o ON o.id = e.org_id
       WHERE e.email = ? AND e.is_active = 1
       LIMIT 1`,
      [email]
    );

    const employees = rowsToObjects(result);
    if (!employees.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const employee = employees[0];

    const valid = await bcrypt.compare(password, employee.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    delete employee.password_hash;
    const token = buildToken(employee);
    res.json({ token, employee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/logout
router.post('/logout', (_req, res) => res.json({ ok: true }));

// GET /auth/me
router.get('/me', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `SELECT e.id, e.org_id, e.emp_code, e.name, e.email,
              e.role, e.is_active, e.dept_id, e.grade_id, e.reporting_to,
              g.code AS grade_code, g.label AS grade_label,
              d.name AS dept_name,
              o.name AS org_name, o.wizard_completed, o.framework, o.cascade_mode, o.industry,
              o.settings
       FROM employees e
       LEFT JOIN grades g ON g.id = e.grade_id
       LEFT JOIN departments d ON d.id = e.dept_id
       JOIN organizations o ON o.id = e.org_id
       WHERE e.id = ?`,
      [req.user.id]
    );

    const rows = rowsToObjects(result);
    if (!rows.length) return res.status(404).json({ error: 'Employee not found' });

    const employee = rows[0];
    if (employee.settings) {
      try { employee.org_settings = JSON.parse(employee.settings); } catch {}
      delete employee.settings;
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
