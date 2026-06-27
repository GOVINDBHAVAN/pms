const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, '../../data/pms.db');
const DATA_DIR = path.dirname(DB_PATH);

let db = null;

async function initDatabase() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log('Loaded existing database from', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('Created new in-memory database');
  }

  db.run('PRAGMA foreign_keys = ON');
  _runMigrations();
  saveDb();

  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

function saveDb() {
  if (!db) return;
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function _runMigrations() {
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_versions (
      version    TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const migrDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = file.replace('.sql', '');
    const rows = db.exec(
      `SELECT 1 FROM schema_versions WHERE version = '${version}'`
    );

    if (rows.length === 0 || rows[0].values.length === 0) {
      const sql = fs.readFileSync(path.join(migrDir, file), 'utf8');
      db.exec(sql);
      db.run(`INSERT INTO schema_versions (version) VALUES ('${version}')`);
      console.log(`Migration applied: ${file}`);
    }
  }
}

module.exports = { initDatabase, getDb, saveDb };
