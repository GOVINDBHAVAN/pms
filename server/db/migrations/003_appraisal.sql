-- 360-degree feedback (optional in POC)

CREATE TABLE IF NOT EXISTS feedback_360 (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id     INTEGER REFERENCES review_cycles(id),
  subject_id   INTEGER REFERENCES employees(id),
  reviewer_id  INTEGER REFERENCES employees(id),
  relationship TEXT,
  responses    TEXT,
  submitted_at TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);
