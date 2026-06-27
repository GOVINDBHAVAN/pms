-- Targets, audit log, and performance summary

CREATE TABLE IF NOT EXISTS targets (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id             INTEGER REFERENCES organizations(id),
  cycle_id           INTEGER REFERENCES review_cycles(id),
  employee_id        INTEGER REFERENCES employees(id),
  parent_target_id   INTEGER REFERENCES targets(id),
  cascade_direction  TEXT DEFAULT 'top_down',
  framework_type     TEXT NOT NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  library_id         INTEGER REFERENCES performance_library(id),
  unit               TEXT,
  measurement_type   TEXT DEFAULT 'higher_better',
  company_target     REAL,
  planned_target     REAL,
  stretch_target     REAL,
  actual_value       REAL,
  is_over_planned    INTEGER DEFAULT 0,
  over_plan_ratio    REAL,
  over_plan_note     TEXT,
  over_plan_approved INTEGER DEFAULT 0,
  weight             REAL DEFAULT 0,
  hierarchy_level    INTEGER,
  status             TEXT DEFAULT 'draft',
  rejection_note     TEXT,
  self_rating        REAL,
  self_comment       TEXT,
  self_rated_at      TEXT,
  manager_rating     REAL,
  manager_comment    TEXT,
  manager_rated_at   TEXT,
  final_rating       REAL,
  submitted_at       TEXT,
  approved_at        TEXT,
  approved_by        INTEGER REFERENCES employees(id),
  created_at         TEXT DEFAULT (datetime('now')),
  updated_at         TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_targets_emp_cycle   ON targets(employee_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_targets_parent      ON targets(parent_target_id);
CREATE INDEX IF NOT EXISTS idx_targets_status      ON targets(status);
CREATE INDEX IF NOT EXISTS idx_targets_cascade_dir ON targets(cascade_direction);

CREATE TABLE IF NOT EXISTS target_audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  target_id    INTEGER REFERENCES targets(id),
  changed_by   INTEGER REFERENCES employees(id),
  action       TEXT NOT NULL,
  old_snapshot TEXT,
  new_snapshot TEXT,
  note         TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS performance_summary (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id         INTEGER REFERENCES review_cycles(id),
  employee_id      INTEGER REFERENCES employees(id),
  goal_score       REAL,
  competency_score REAL,
  final_score      REAL,
  performance_band TEXT,
  is_pip_triggered INTEGER DEFAULT 0,
  calibrated       INTEGER DEFAULT 0,
  calibrated_score REAL,
  calibration_note TEXT,
  computed_at      TEXT,
  UNIQUE(cycle_id, employee_id)
);
