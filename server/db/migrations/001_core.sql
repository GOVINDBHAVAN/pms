-- Core tables: organizations, wizard, departments, grades, employees, library, cycles

CREATE TABLE IF NOT EXISTS organizations (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  industry         TEXT NOT NULL DEFAULT 'custom',
  framework        TEXT NOT NULL DEFAULT 'hybrid',
  cascade_mode     TEXT NOT NULL DEFAULT 'top_down',
  settings         TEXT NOT NULL DEFAULT '{}',
  wizard_completed INTEGER DEFAULT 0,
  created_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wizard_progress (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id     INTEGER REFERENCES organizations(id),
  step       TEXT NOT NULL,
  data       TEXT,
  completed  INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS departments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id     INTEGER REFERENCES organizations(id),
  name       TEXT NOT NULL,
  code       TEXT,
  parent_id  INTEGER REFERENCES departments(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS grades (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id     INTEGER REFERENCES organizations(id),
  code       TEXT NOT NULL,
  label      TEXT NOT NULL,
  level      INTEGER NOT NULL,
  can_manage INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS employees (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id        INTEGER REFERENCES organizations(id),
  emp_code      TEXT,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  dept_id       INTEGER REFERENCES departments(id),
  grade_id      INTEGER REFERENCES grades(id),
  reporting_to  INTEGER REFERENCES employees(id),
  role          TEXT DEFAULT 'employee',
  is_active     INTEGER DEFAULT 1,
  joined_on     TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_emp_reporting ON employees(reporting_to);
CREATE INDEX IF NOT EXISTS idx_emp_org       ON employees(org_id);

CREATE TABLE IF NOT EXISTS performance_library (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id            INTEGER REFERENCES organizations(id),
  code              TEXT,
  name              TEXT NOT NULL,
  description       TEXT,
  item_type         TEXT NOT NULL,
  parent_id         INTEGER REFERENCES performance_library(id),
  category          TEXT,
  unit              TEXT,
  measurement_type  TEXT DEFAULT 'higher_better',
  is_mandatory      INTEGER DEFAULT 0,
  applicable_grades TEXT,
  default_weight    REAL DEFAULT 0,
  created_at        TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS review_cycles (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id         INTEGER REFERENCES organizations(id),
  name           TEXT NOT NULL,
  cycle_type     TEXT NOT NULL,
  period_start   TEXT NOT NULL,
  period_end     TEXT NOT NULL,
  goal_set_open  TEXT,
  goal_set_close TEXT,
  review_open    TEXT,
  review_close   TEXT,
  cascade_mode   TEXT,
  status         TEXT DEFAULT 'draft',
  created_by     INTEGER REFERENCES employees(id),
  created_at     TEXT DEFAULT (datetime('now'))
);
