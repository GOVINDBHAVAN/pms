-- Progress check-ins: periodic actual-value updates against a target

CREATE TABLE IF NOT EXISTS checkins (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  target_id       INTEGER REFERENCES targets(id),
  employee_id     INTEGER REFERENCES employees(id),
  cycle_id        INTEGER REFERENCES review_cycles(id),
  period_type     TEXT NOT NULL,   -- 'weekly' | 'monthly' | 'quarterly'
  period_label    TEXT NOT NULL,   -- 'Apr 2024', 'Q1 FY24-25', 'Week 12'
  actual_value    REAL,
  progress_pct    REAL,
  notes           TEXT,
  acknowledged_by INTEGER REFERENCES employees(id),
  acknowledged_at TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_checkins_target   ON checkins(target_id);
CREATE INDEX IF NOT EXISTS idx_checkins_employee ON checkins(employee_id, cycle_id);
