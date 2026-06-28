require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, getDb } = require('./db/database');
const { seed } = require('./db/seeds/01_demo');
const { seedTargets } = require('./db/seeds/02_demo_targets');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  try {
    const db = getDb();
    const tableRows = db.exec(
      `SELECT name FROM sqlite_master
       WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'schema_versions'
       ORDER BY name`
    );
    const tables = tableRows.length > 0 ? tableRows[0].values.map(r => r[0]) : [];
    const empRows = db.exec('SELECT COUNT(*) FROM employees');
    const employee_count = empRows[0]?.values[0][0] ?? 0;
    res.json({ status: 'ok', tables, employee_count });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',      require('./routes/auth'));
app.use('/api/v1/wizard',    require('./routes/wizard'));
app.use('/api/v1/org',       require('./routes/org'));
app.use('/api/v1/employees', require('./routes/employees'));
app.use('/api/v1/cycles',    require('./routes/cycles'));
app.use('/api/v1/targets',   require('./routes/targets'));
app.use('/api/v1/reports',   require('./routes/reports'));

// ── Start ──────────────────────────────────────────────────────────────────
async function start() {
  try {
    await initDatabase();
    await seed();
    await seedTargets();
    app.listen(PORT, () => {
      console.log(`PMS Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
