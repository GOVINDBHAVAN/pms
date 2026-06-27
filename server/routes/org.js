const router = require('express').Router();
const { getDb, saveDb } = require('../db/database');
const requireAuth = require('../middleware/auth');
const { INDUSTRY_PRESETS } = require('./wizard');

function rowsToObjects(result) {
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

// GET /org/settings
router.get('/settings', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `SELECT id, name, industry, framework, cascade_mode, settings, wizard_completed, created_at
       FROM organizations WHERE id = ?`,
      [req.user.org_id]
    );
    const rows = rowsToObjects(result);
    if (!rows.length) return res.status(404).json({ error: 'Organization not found' });

    const org = rows[0];
    try { org.settings = JSON.parse(org.settings); } catch { org.settings = {}; }
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /org/settings
router.put('/settings', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { name, industry, framework, cascade_mode, settings } = req.body;

    db.run(
      `UPDATE organizations SET name = COALESCE(?, name), industry = COALESCE(?, industry),
              framework = COALESCE(?, framework), cascade_mode = COALESCE(?, cascade_mode),
              settings = COALESCE(?, settings)
       WHERE id = ?`,
      [name || null, industry || null, framework || null, cascade_mode || null,
       settings ? JSON.stringify(settings) : null, req.user.org_id]
    );
    saveDb();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /org/framework-presets
router.get('/framework-presets', (_req, res) => {
  res.json(INDUSTRY_PRESETS);
});

// ── Grades ─────────────────────────────────────────────────────────────────

router.get('/grades', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `SELECT * FROM grades WHERE org_id = ? ORDER BY sort_order, level`,
      [req.user.org_id]
    );
    res.json(rowsToObjects(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/grades', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { code, label, level, can_manage, sort_order } = req.body;
    db.run(
      `INSERT INTO grades (org_id, code, label, level, can_manage, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.org_id, code, label, level, can_manage ? 1 : 0, sort_order || 0]
    );
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDb();
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/grades/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { code, label, level, can_manage, sort_order } = req.body;
    db.run(
      `UPDATE grades SET code = COALESCE(?, code), label = COALESCE(?, label),
              level = COALESCE(?, level), can_manage = COALESCE(?, can_manage),
              sort_order = COALESCE(?, sort_order)
       WHERE id = ? AND org_id = ?`,
      [code || null, label || null, level || null, can_manage != null ? (can_manage ? 1 : 0) : null,
       sort_order || null, req.params.id, req.user.org_id]
    );
    saveDb();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/grades/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    db.run(`DELETE FROM grades WHERE id = ? AND org_id = ?`, [req.params.id, req.user.org_id]);
    saveDb();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Departments ────────────────────────────────────────────────────────────

router.get('/departments', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `SELECT id, name, code, parent_id FROM departments WHERE org_id = ? ORDER BY parent_id NULLS FIRST, name`,
      [req.user.org_id]
    );
    const flat = rowsToObjects(result);

    // Build tree
    const map = {};
    flat.forEach(d => { map[d.id] = { ...d, children: [] }; });
    const roots = [];
    flat.forEach(d => {
      if (d.parent_id) map[d.parent_id]?.children.push(map[d.id]);
      else roots.push(map[d.id]);
    });
    res.json(roots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/departments', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { name, code, parent_id } = req.body;
    db.run(
      `INSERT INTO departments (org_id, name, code, parent_id) VALUES (?, ?, ?, ?)`,
      [req.user.org_id, name, code || null, parent_id || null]
    );
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDb();
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/departments/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { name, code, parent_id } = req.body;
    db.run(
      `UPDATE departments SET name = COALESCE(?, name), code = COALESCE(?, code),
              parent_id = ?
       WHERE id = ? AND org_id = ?`,
      [name || null, code || null, parent_id || null, req.params.id, req.user.org_id]
    );
    saveDb();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/departments/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    db.run(`DELETE FROM departments WHERE id = ? AND org_id = ?`, [req.params.id, req.user.org_id]);
    saveDb();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Performance Library ────────────────────────────────────────────────────

router.get('/library', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `SELECT * FROM performance_library WHERE org_id = ? ORDER BY item_type, name`,
      [req.user.org_id]
    );
    res.json(rowsToObjects(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/library', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { code, name, description, item_type, parent_id, category, unit, measurement_type, is_mandatory, applicable_grades, default_weight } = req.body;
    db.run(
      `INSERT INTO performance_library (org_id, code, name, description, item_type, parent_id, category, unit, measurement_type, is_mandatory, applicable_grades, default_weight)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.org_id, code || null, name, description || null, item_type, parent_id || null,
       category || null, unit || null, measurement_type || 'higher_better', is_mandatory ? 1 : 0,
       applicable_grades ? JSON.stringify(applicable_grades) : null, default_weight || 0]
    );
    const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    saveDb();
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/library/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const { name, description, is_mandatory, default_weight } = req.body;
    db.run(
      `UPDATE performance_library SET name = COALESCE(?, name), description = COALESCE(?, description),
              is_mandatory = COALESCE(?, is_mandatory), default_weight = COALESCE(?, default_weight)
       WHERE id = ? AND org_id = ?`,
      [name || null, description || null, is_mandatory != null ? (is_mandatory ? 1 : 0) : null,
       default_weight || null, req.params.id, req.user.org_id]
    );
    saveDb();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/library/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    db.run(`DELETE FROM performance_library WHERE id = ? AND org_id = ?`, [req.params.id, req.user.org_id]);
    saveDb();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
