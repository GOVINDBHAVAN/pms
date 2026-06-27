# Performance Management System (PMS)
## Technical Specifications v2.0 — POC/Prototype
### Stack: React 18 + Vite + Node.js/Express + SQLite (sql.js — WebAssembly, no native build needed)

---

## QUICK REFERENCE — What This System Does

| Capability | Supported |
|-----------|-----------|
| Frameworks | OKR, KRA/KPI, Goals-only, Competency-only, Balanced Scorecard, Hybrid, Custom |
| Industries | IT, Manufacturing, Healthcare, BFSI, Retail, Education, Hospitality, Logistics, NGO, Custom |
| Cascading | Top-Down, Bottom-Up, Bidirectional (both simultaneously) |
| Hierarchy | Unlimited levels (L1 to Ln), multi-department, matrix org |
| Over-planning | Allowed with justification, capped at configurable multiplier |
| Validation | 100% system-enforced before any approval |
| Setup | Guided wizard — HR can configure without technical help |
| Rating Scales | 5-point, 3-point, percentage, BARS, binary, custom labels |
| Multi-tenant | One SQLite DB per org (POC), same codebase |

---

## 1. PROJECT STRUCTURE

```
pms-poc/
├── client/                          # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── wizard/              # Setup wizard step components
│   │   │   ├── targets/             # Target entry, cards, forms
│   │   │   ├── hierarchy/           # Chain panel, org tree
│   │   │   ├── appraisal/           # Rating widgets, review forms
│   │   │   ├── shared/              # Badges, meters, steppers
│   │   │   └── layout/              # Sidebar, header, nav
│   │   ├── pages/                   # Route-level page components
│   │   ├── store/                   # Zustand state stores
│   │   ├── hooks/                   # useCascade, useValidation, useHierarchy
│   │   ├── utils/
│   │   │   ├── frameworkConfig.js   # Industry presets registry
│   │   │   ├── validation.js        # Client-side validation helpers
│   │   │   └── cascadeUtils.js      # Cascade mode helpers
│   │   └── api/                     # Axios service modules
├── server/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── org.js
│   │   ├── wizard.js                # Setup wizard APIs
│   │   ├── employees.js
│   │   ├── cycles.js
│   │   ├── targets.js
│   │   ├── appraisal.js
│   │   └── reports.js
│   ├── services/
│   │   ├── cascadeService.js        # Top-down / bottom-up / bidirectional logic
│   │   ├── validationService.js     # All validation rules
│   │   ├── scoringService.js        # Final score computation
│   │   └── hierarchyService.js      # Recursive CTE queries
│   ├── db/
│   │   ├── database.js              # Connection singleton
│   │   ├── migrations/              # SQL migration files (run in order)
│   │   └── seeds/                   # Demo data per industry
│   └── middleware/
│       ├── auth.js                  # JWT verify
│       └── roleGuard.js             # Role-based route protection
├── specifications.md
└── package.json                     # Root with concurrently scripts
```

---

## 2. TECHNOLOGY STACK

| Layer | Package | Version | Purpose |
|-------|---------|---------|---------|
| Frontend | React | 18 | UI framework |
| Build | Vite | 5 | Fast dev server |
| UI Components | shadcn/ui | latest | Pre-built accessible components |
| Styling | Tailwind CSS | 3 | Utility CSS |
| State | Zustand | 4 | Lightweight global state |
| Routing | React Router | 6 | SPA navigation |
| HTTP Client | Axios | 1 | API calls |
| Charts | Recharts | 2 | Dashboards |
| Backend | Express | 4 | REST API server |
| Database | sql.js | 1 | SQLite via WebAssembly — no native compilation needed |
| Auth | jsonwebtoken + bcrypt | — | JWT sessions |
| Dev | nodemon + concurrently | — | Hot reload both servers |

---

## 3. DATABASE SCHEMA

### 3.1 Organizations

```sql
CREATE TABLE organizations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  industry      TEXT NOT NULL DEFAULT 'custom',
  -- 'it' | 'manufacturing' | 'healthcare' | 'bfsi' | 'retail'
  -- | 'education' | 'hospitality' | 'logistics' | 'ngo' | 'custom'

  framework     TEXT NOT NULL DEFAULT 'hybrid',
  -- 'okr' | 'kra_kpi' | 'goals' | 'competency' | 'hybrid'
  -- | 'balanced_scorecard' | 'custom'

  cascade_mode  TEXT NOT NULL DEFAULT 'top_down',
  -- 'top_down' | 'bottom_up' | 'bidirectional'

  settings      TEXT NOT NULL DEFAULT '{}',
  -- JSON blob — full org configuration. See Section 5 for schema.

  wizard_completed INTEGER DEFAULT 0,   -- 0 until setup wizard finished
  created_at    TEXT DEFAULT (datetime('now'))
);
```

### 3.2 Setup Wizard Progress

```sql
-- Tracks which wizard steps HR has completed
-- Allows resuming wizard across sessions
CREATE TABLE wizard_progress (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id     INTEGER REFERENCES organizations(id),
  step       TEXT NOT NULL,
  -- 'industry' | 'framework' | 'cascade' | 'rating' | 'weightage'
  -- | 'terminology' | 'grades' | 'departments' | 'employees' | 'cycle' | 'done'
  data       TEXT,           -- JSON: saved answers for this step
  completed  INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 3.3 Departments

```sql
CREATE TABLE departments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id     INTEGER REFERENCES organizations(id),
  name       TEXT NOT NULL,
  code       TEXT,
  parent_id  INTEGER REFERENCES departments(id),  -- Supports dept hierarchy
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 3.4 Grades / Levels

```sql
CREATE TABLE grades (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id       INTEGER REFERENCES organizations(id),
  code         TEXT NOT NULL,     -- 'L1', 'M2', 'VP', 'IC3'
  label        TEXT NOT NULL,     -- 'Junior Developer', 'Senior Manager'
  level        INTEGER NOT NULL,  -- 1 = most junior; higher = more senior
  can_manage   INTEGER DEFAULT 0, -- 1 = this grade can have reportees
  sort_order   INTEGER DEFAULT 0
);
```

### 3.5 Employees

```sql
CREATE TABLE employees (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id        INTEGER REFERENCES organizations(id),
  emp_code      TEXT,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  dept_id       INTEGER REFERENCES departments(id),
  grade_id      INTEGER REFERENCES grades(id),
  reporting_to  INTEGER REFERENCES employees(id),
  -- IMPORTANT: reporting_to drives the entire cascade chain
  role          TEXT DEFAULT 'employee',
  -- 'admin' | 'hr' | 'manager' | 'employee'
  -- Note: 'manager' role is auto-derived if employee has reportees,
  -- but can also be explicitly set for HR visibility
  is_active     INTEGER DEFAULT 1,
  joined_on     TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_emp_reporting ON employees(reporting_to);
CREATE INDEX idx_emp_org      ON employees(org_id);
```

### 3.6 KRA / KPI / Competency Library

```sql
-- Master library of performance items (org-level templates)
CREATE TABLE performance_library (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id           INTEGER REFERENCES organizations(id),
  code             TEXT,
  name             TEXT NOT NULL,
  description      TEXT,
  item_type        TEXT NOT NULL,
  -- 'kra' | 'kpi' | 'objective' | 'key_result' | 'goal'
  -- | 'competency' | 'bsc_perspective' | 'custom_metric'

  parent_id        INTEGER REFERENCES performance_library(id),
  -- KPIs link to their parent KRA; Key Results link to their Objective

  category         TEXT,
  -- 'financial' | 'customer' | 'process' | 'people' | 'learning' | 'safety'

  unit             TEXT,           -- '%', 'INR', 'count', 'days', 'score', 'text'
  measurement_type TEXT DEFAULT 'higher_better',
  -- 'higher_better' | 'lower_better' | 'target_exact' | 'qualitative'

  is_mandatory     INTEGER DEFAULT 0,   -- 1 = must appear in every employee's targets
  applicable_grades TEXT,               -- JSON: [1,2,3] grade IDs. NULL = all grades.
  default_weight   REAL DEFAULT 0,

  created_at       TEXT DEFAULT (datetime('now'))
);
```

### 3.7 Review Cycles

```sql
CREATE TABLE review_cycles (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id          INTEGER REFERENCES organizations(id),
  name            TEXT NOT NULL,           -- 'FY 2025-26 Annual'
  cycle_type      TEXT NOT NULL,
  -- 'annual' | 'half_yearly' | 'quarterly' | 'monthly' | 'custom'

  period_start    TEXT NOT NULL,           -- ISO date: cycle performance period starts
  period_end      TEXT NOT NULL,           -- ISO date: cycle performance period ends

  goal_set_open   TEXT,                    -- When employees can begin setting targets
  goal_set_close  TEXT,                    -- Deadline for submitting targets
  review_open     TEXT,                    -- When self-appraisal opens
  review_close    TEXT,                    -- Deadline for manager ratings

  cascade_mode    TEXT,
  -- Override org default for this cycle: 'top_down' | 'bottom_up' | 'bidirectional'
  -- NULL = use org default

  status          TEXT DEFAULT 'draft',
  -- 'draft' → 'goal_setting' → 'active' → 'review' → 'calibration' → 'closed'

  created_by      INTEGER REFERENCES employees(id),
  created_at      TEXT DEFAULT (datetime('now'))
);
```

### 3.8 Targets — Central Table

```sql
-- One row = one performance item for one employee in one cycle.
-- Works for all frameworks: OKR KRs, KPIs, Goals, Competencies, BSC metrics, custom.
CREATE TABLE targets (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id           INTEGER REFERENCES organizations(id),
  cycle_id         INTEGER REFERENCES review_cycles(id),
  employee_id      INTEGER REFERENCES employees(id),

  -- ── CASCADE LINKAGE ──────────────────────────────────────────
  parent_target_id INTEGER REFERENCES targets(id),
  -- Links this target to the parent employee's target above in hierarchy.
  -- For top_down: manager assigns this and sets parent_target_id.
  -- For bottom_up: employee proposes it; manager later links it.
  -- For bidirectional: either party can initiate; linking is required before approval.

  cascade_direction TEXT DEFAULT 'top_down',
  -- 'top_down'    = pushed down from manager/HR
  -- 'bottom_up'   = proposed by employee, pending manager linkage
  -- 'assigned'    = mandatory target pushed by HR (cannot be deleted by employee)

  -- ── FRAMEWORK FIELDS ─────────────────────────────────────────
  framework_type   TEXT NOT NULL,
  -- 'okr_objective' | 'okr_kr' | 'kra' | 'kpi' | 'goal'
  -- | 'competency' | 'bsc_metric' | 'custom_metric'

  title            TEXT NOT NULL,
  description      TEXT,
  library_id       INTEGER REFERENCES performance_library(id),
  -- Optional: links to org library item

  -- ── MEASUREMENT ──────────────────────────────────────────────
  unit             TEXT,
  measurement_type TEXT DEFAULT 'higher_better',

  -- ── TARGET VALUES (Over-plan logic lives here) ───────────────
  company_target   REAL,
  -- Set only at the topmost level target (CEO/company level).
  -- All child targets must be traceable to this root.

  planned_target   REAL,
  -- What THIS employee commits to deliver.
  -- CAN exceed the parent's planned_target (extra mile / over-plan).
  -- Cannot exceed company_target × overplan_max_multiplier at aggregate.

  stretch_target   REAL,
  -- Optional aspirational target above planned.
  -- Must be > planned_target if set.

  actual_value     REAL,
  -- Filled during review phase by employee then confirmed by manager.

  -- ── OVER-PLAN METADATA ───────────────────────────────────────
  is_over_planned    INTEGER DEFAULT 0,
  -- Auto-set to 1 by system when planned_target > parent.planned_target

  over_plan_ratio    REAL,
  -- planned_target / parent.planned_target (stored for display)

  over_plan_note     TEXT,
  -- Required justification when is_over_planned = 1

  over_plan_approved INTEGER DEFAULT 0,
  -- Manager must explicitly tick this during approval

  -- ── WEIGHTAGE ────────────────────────────────────────────────
  weight           REAL DEFAULT 0,
  -- % weight of this target in the employee's total scorecard.
  -- SUM of weights for all active targets per employee per cycle MUST = 100.

  -- ── HIERARCHY METADATA (stored for performance) ─────────────
  hierarchy_level  INTEGER,
  -- 1 = Company/CEO level, 2 = L2, 3 = L3... N = leaf employee

  -- ── STATUS FLOW ──────────────────────────────────────────────
  status TEXT DEFAULT 'draft',
  -- DRAFT:     Employee/manager is editing; not yet submitted.
  -- SUBMITTED: Employee submitted; awaiting manager approval.
  -- PROPOSED:  Bottom-up: employee proposed; manager has not yet linked or approved.
  -- LINKED:    Bottom-up: manager has linked it to their own target.
  -- APPROVED:  Manager approved; locked for the cycle.
  -- REJECTED:  Manager rejected; employee can revise and resubmit.
  -- ACTIVE:    Cycle moved to active phase; targets frozen.
  -- LOCKED:    Review phase; no further edits.

  rejection_note   TEXT,

  -- ── APPRAISAL FIELDS ─────────────────────────────────────────
  self_rating      REAL,
  self_comment     TEXT,
  self_rated_at    TEXT,

  manager_rating   REAL,
  manager_comment  TEXT,
  manager_rated_at TEXT,

  final_rating     REAL,
  -- Usually = manager_rating; may differ after calibration.

  -- ── AUDIT ────────────────────────────────────────────────────
  submitted_at  TEXT,
  approved_at   TEXT,
  approved_by   INTEGER REFERENCES employees(id),
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_targets_emp_cycle    ON targets(employee_id, cycle_id);
CREATE INDEX idx_targets_parent       ON targets(parent_target_id);
CREATE INDEX idx_targets_status       ON targets(status);
CREATE INDEX idx_targets_cascade_dir  ON targets(cascade_direction);
```

### 3.9 Target Audit Log

```sql
-- Immutable log of every state change on every target.
CREATE TABLE target_audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  target_id    INTEGER REFERENCES targets(id),
  changed_by   INTEGER REFERENCES employees(id),
  action       TEXT NOT NULL,
  -- 'created' | 'edited' | 'submitted' | 'proposed' | 'linked'
  -- | 'approved' | 'rejected' | 'self_rated' | 'manager_rated'
  -- | 'calibrated' | 'over_plan_approved'
  old_snapshot TEXT,    -- JSON of relevant fields before change
  new_snapshot TEXT,    -- JSON of relevant fields after change
  note         TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);
```

### 3.10 Performance Summary

```sql
CREATE TABLE performance_summary (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id         INTEGER REFERENCES review_cycles(id),
  employee_id      INTEGER REFERENCES employees(id),
  goal_score       REAL,         -- Weighted avg of all rated targets
  competency_score REAL,         -- Weighted avg of competency targets
  final_score      REAL,         -- goal_score × goal_wt% + competency_score × comp_wt%
  performance_band TEXT,
  -- 'exceptional' | 'exceeds' | 'meets' | 'below' | 'needs_improvement'
  is_pip_triggered INTEGER DEFAULT 0,
  calibrated       INTEGER DEFAULT 0,
  calibrated_score REAL,
  calibration_note TEXT,
  computed_at      TEXT,
  UNIQUE(cycle_id, employee_id)
);
```

### 3.11 360 Feedback (Optional in POC)

```sql
CREATE TABLE feedback_360 (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id     INTEGER REFERENCES review_cycles(id),
  subject_id   INTEGER REFERENCES employees(id),
  reviewer_id  INTEGER REFERENCES employees(id),
  relationship TEXT,  -- 'peer' | 'subordinate' | 'skip_level'
  responses    TEXT,  -- JSON: { competency_id: { rating, comment } }
  submitted_at TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);
```

---

## 4. SETUP WIZARD — DESIGN (Most Important UX Feature)

The Setup Wizard is the **first thing HR sees** after first login. It is a guided, step-by-step process that configures the entire system. An HR person with no technical knowledge must be able to complete it.

### 4.1 Wizard Flow (11 Steps)

```
STEP 1: Company Info
  → Org name, size (employee count range), country/region
  → Used to pre-fill defaults later

STEP 2: Industry Selection
  → Visual tile grid — HR clicks their industry
  → Each tile shows: icon, name, "Commonly used: OKR / KRA-KPI / Goals"
  → Industries: IT/Software, Manufacturing, Healthcare, BFSI, Retail/Sales,
                Education, Hospitality, Logistics, NGO/Social, Other

STEP 3: Framework Selection
  → Show 6 framework cards with plain-language descriptions:
  
  ┌─────────────────────────────────────────────────────────────────┐
  │  OKR (Objectives & Key Results)                                  │
  │  "Set inspiring company goals (Objectives) and track them with   │
  │   measurable results (Key Results). Popular in tech companies."  │
  │  Best for: IT, Startups, Product companies                       │
  └─────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────┐
  │  KRA / KPI (Key Result Areas & Indicators)                       │
  │  "Define areas of responsibility (KRAs) and measure performance  │
  │   in each area using specific metrics (KPIs)."                   │
  │  Best for: Manufacturing, BFSI, Retail, Traditional orgs         │
  └─────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────┐
  │  Goals (Simple & Direct)                                         │
  │  "Set plain targets for each person or team. No jargon."         │
  │  Best for: Small teams, Education, NGO, Service companies        │
  └─────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────┐
  │  Competency-Based                                                │
  │  "Evaluate employees on skills and behaviors, not just numbers." │
  │  Best for: Healthcare, Customer service, HR-heavy orgs           │
  └─────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────┐
  │  Balanced Scorecard                                              │
  │  "Measure performance across four dimensions: Financial,         │
  │   Customer, Internal Process, and Learning & Growth."            │
  │  Best for: BFSI, Large enterprises, Regulated industries         │
  └─────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────┐
  │  Hybrid (Recommended)                                            │
  │  "Mix any of the above. E.g., 70% KPI-based + 30% Competency."  │
  │  Best for: Most mid-sized organizations                          │
  └─────────────────────────────────────────────────────────────────┘

  → "Not sure? Choose Hybrid — you can always change it later."
  → Selecting an industry in Step 2 pre-selects the recommended framework.
  → HR can still override.

STEP 4: Cascading Mode
  → Three options with visual diagram for each:

  ┌─────────────────────────────────────────────────────────────────┐
  │  🔽 Top-Down (Most Common)                                        │
  │  "Leadership sets company targets → Managers break them down →   │
  │   Employees receive their targets."                              │
  │  Targets flow from senior to junior. Ensures alignment.          │
  └─────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────┐
  │  🔼 Bottom-Up                                                     │
  │  "Employees propose their own targets → Managers review and      │
  │   link them → Leadership sees aggregated commitments."           │
  │  Promotes ownership. Targets bubble up from individuals.         │
  └─────────────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────────────┐
  │  🔄 Bidirectional (Recommended for mature orgs)                  │
  │  "Both happen simultaneously. Leadership sets direction.         │
  │   Employees also propose. Manager reconciles both."              │
  │  Best balance of alignment and ownership.                        │
  └─────────────────────────────────────────────────────────────────┘

STEP 5: Rating Scale
  → Choose how performance is scored:

  Option A — 5-Point Scale (Exceptional / Exceeds / Meets / Below / Poor)
  Option B — 3-Point Scale (Above / Meets / Below)
  Option C — Percentage Achievement (0–120%)
  Option D — Behaviorally Anchored (BARS) — describe behaviors per level
  Option E — Custom Labels — HR types their own labels and numeric values

  → Live preview shows how a sample rating will look
  → "For hybrid: which scale for Goals? Which for Competencies?" (can differ)

STEP 6: Weightage Split
  → Only shown if framework includes both Goals and Competencies
  → Slider: Goals [70%] ←→ Competencies [30%]
  → Numeric input for exact values
  → Note: "These percentages apply to every employee's final score"
  → If framework = OKR: Objectives vs Key Results weighting shown
  → If framework = BSC: Four-quadrant weight slider shown

STEP 7: Terminology (Optional but powerful)
  → Show a table of default terms; HR can rename any of them:

  | System Term    | Your Label (editable)  | Example             |
  |---------------|------------------------|---------------------|
  | KRA           | [Key Result Area     ] | Area of Focus       |
  | KPI           | [Key Performance Ind.] | Success Metric      |
  | Objective     | [Objective           ] | Company Direction   |
  | Key Result    | [Key Result          ] | Measurable Outcome  |
  | Competency    | [Competency          ] | Behavioral Skills   |
  | Goal          | [Goal                ] | Individual Target   |
  | Weight        | [Weight              ] | Importance (%)      |
  | Performance...|                        |                     |

  → "Leave unchanged to use standard terms"
  → Applied org-wide; all employees see these custom labels

STEP 8: Grades / Levels
  → Import-style table: HR types or edits grade codes and labels
  → Pre-filled from industry preset (e.g., for IT: L1 to L6)
  → Each row: Code | Label | Level (number) | Can Manage (yes/no)
  → Add row / delete row / reorder
  → "Grades determine who can approve whose targets"

STEP 9: Departments
  → Visual tree builder:
  → Root = Company Name (auto)
  → Add departments as children; support nested sub-departments
  → Drag to reorder; click to rename; click + to add child dept

STEP 10: Employees
  → Two options:
  A. Manual entry — add one by one (name, email, dept, grade, reports to)
  B. CSV upload — template provided; system validates and previews before import
  → After upload, show org tree preview
  → "The reporting structure you set here drives all cascading"

STEP 11: Create First Review Cycle
  → Cycle name (pre-filled: "FY YYYY-YY Annual")
  → Cycle type: Annual / Half-Yearly / Quarterly / Monthly
  → Period start and end date
  → Goal-setting window: open and close dates
  → Review window: open and close dates
  → Cascade mode for this cycle (default = org setting, overridable)
  → Click "Launch Cycle" → wizard complete → redirected to Dashboard

  ✅ WIZARD COMPLETE — Dashboard shows cycle status stepper
```

### 4.2 Wizard Resume Logic

- Each step saves to `wizard_progress` table on "Next"
- HR can close browser and return; wizard resumes at last incomplete step
- Until wizard is complete, app shows only Wizard (no other pages accessible)
- After wizard, org settings can still be changed from Org Settings page

### 4.3 Wizard API Endpoints

```
POST  /api/v1/wizard/start              → Creates org + initial wizard_progress rows
GET   /api/v1/wizard/status             → { current_step, completed_steps[], org_id }
POST  /api/v1/wizard/step/:stepName     → Save step data + mark complete
GET   /api/v1/wizard/step/:stepName     → Get saved data for this step (for resume)
POST  /api/v1/wizard/complete           → Finalize; set wizard_completed=1 on org
POST  /api/v1/wizard/import-employees   → CSV parse + validate + bulk insert
```

---

## 5. ORG SETTINGS JSON SCHEMA

Stored in `organizations.settings`. Full schema:

```json
{
  "framework": "hybrid",
  "cascade_mode": "bidirectional",
  "industry": "it",

  "terminology": {
    "kra":         "Key Result Area",
    "kpi":         "Key Performance Indicator",
    "objective":   "Objective",
    "key_result":  "Key Result",
    "goal":        "Goal",
    "competency":  "Competency",
    "weight":      "Weight (%)",
    "planned":     "Planned Target",
    "actual":      "Actual Achievement",
    "stretch":     "Stretch Target",
    "performance_band": "Performance Band"
  },

  "active_types": ["kra", "kpi", "competency"],
  "primary_type": "kra_kpi",

  "rating_scale": {
    "goals": {
      "type": "5_point",
      "labels": ["Poor", "Below Expectation", "Meets Expectation", "Exceeds Expectation", "Exceptional"],
      "values": [1, 2, 3, 4, 5],
      "pip_below": 2
    },
    "competency": {
      "type": "5_point",
      "labels": ["Unacceptable", "Developing", "Proficient", "Advanced", "Expert"],
      "values": [1, 2, 3, 4, 5]
    }
  },

  "weightage": {
    "goals_percent": 70,
    "competency_percent": 30
  },

  "performance_bands": [
    { "label": "Exceptional",       "min": 4.5, "max": 5.0,  "color": "#16a34a" },
    { "label": "Exceeds",           "min": 3.5, "max": 4.49, "color": "#2563eb" },
    { "label": "Meets Expectation", "min": 2.5, "max": 3.49, "color": "#d97706" },
    { "label": "Below Expectation", "min": 1.5, "max": 2.49, "color": "#dc2626" },
    { "label": "Poor",              "min": 0,   "max": 1.49, "color": "#7f1d1d" }
  ],

  "target_rules": {
    "min_target_weight":      5,
    "max_target_weight":      50,
    "overplan_allowed":       true,
    "overplan_max_multiplier": 1.15,
    "require_parent_linkage": true,
    "allow_self_propose":     true,
    "mandatory_kras":         []
  },

  "bsc_perspectives": ["Financial", "Customer", "Internal Process", "Learning & Growth"],

  "cycle_defaults": {
    "type": "annual",
    "goal_setting_days": 30,
    "review_days": 21
  }
}
```

---

## 6. INDUSTRY PRESETS

These are loaded by the wizard in Step 2+3 to pre-fill all settings. HR can override any value.

### IT / Software
```json
{
  "framework": "okr",
  "cascade_mode": "bidirectional",
  "active_types": ["okr_objective", "okr_kr", "competency"],
  "rating_scale_type": "percentage",
  "weightage": { "goals_percent": 70, "competency_percent": 30 },
  "overplan_max_multiplier": 1.20,
  "starter_library": [
    { "type": "okr_objective", "name": "Deliver high-quality product", "category": "process" },
    { "type": "competency", "name": "Technical Problem Solving" },
    { "type": "competency", "name": "Collaboration" },
    { "type": "competency", "name": "Ownership & Accountability" }
  ]
}
```

### Manufacturing
```json
{
  "framework": "kra_kpi",
  "cascade_mode": "top_down",
  "active_types": ["kra", "kpi"],
  "rating_scale_type": "percentage_achievement",
  "overplan_max_multiplier": 1.10,
  "starter_library": [
    { "type": "kra", "name": "Production Output", "unit": "units/day" },
    { "type": "kra", "name": "Defect Rate", "unit": "ppm", "measurement_type": "lower_better" },
    { "type": "kra", "name": "Safety Compliance", "unit": "%" },
    { "type": "kra", "name": "Machine Uptime", "unit": "%" },
    { "type": "kra", "name": "Waste Reduction", "unit": "%", "measurement_type": "lower_better" }
  ]
}
```

### Healthcare
```json
{
  "framework": "hybrid",
  "cascade_mode": "top_down",
  "active_types": ["goal", "competency"],
  "weightage": { "goals_percent": 50, "competency_percent": 50 },
  "rating_scale": { "goals": { "type": "5_point" }, "competency": { "type": "bars" } },
  "starter_library": [
    { "type": "competency", "name": "Patient Safety Adherence" },
    { "type": "competency", "name": "Clinical Judgment" },
    { "type": "competency", "name": "Empathy & Communication" },
    { "type": "competency", "name": "Documentation Accuracy" },
    { "type": "goal", "name": "Patient Satisfaction Score", "unit": "score" }
  ]
}
```

### BFSI (Banking, Financial Services, Insurance)
```json
{
  "framework": "balanced_scorecard",
  "cascade_mode": "top_down",
  "active_types": ["bsc_metric", "kpi", "competency"],
  "bsc_perspectives": ["Financial", "Customer", "Compliance & Risk", "People & Learning"],
  "starter_library": [
    { "type": "kpi", "name": "AUM Growth", "category": "financial", "unit": "%" },
    { "type": "kpi", "name": "NPA Ratio", "category": "financial", "unit": "%", "measurement_type": "lower_better" },
    { "type": "kpi", "name": "Compliance Score", "category": "compliance", "unit": "score" },
    { "type": "competency", "name": "Risk Awareness" },
    { "type": "competency", "name": "Client Relationship Management" }
  ]
}
```

### Retail / Sales
```json
{
  "framework": "goals",
  "cascade_mode": "top_down",
  "active_types": ["goal", "kpi"],
  "rating_scale_type": "percentage_of_target",
  "overplan_max_multiplier": 1.30,
  "starter_library": [
    { "type": "kpi", "name": "Monthly Revenue", "unit": "INR" },
    { "type": "kpi", "name": "Conversion Rate", "unit": "%" },
    { "type": "kpi", "name": "Average Transaction Value", "unit": "INR" },
    { "type": "kpi", "name": "Customer Satisfaction (CSAT)", "unit": "score" }
  ]
}
```

### Education
```json
{
  "framework": "goals",
  "cascade_mode": "top_down",
  "active_types": ["goal", "competency"],
  "weightage": { "goals_percent": 60, "competency_percent": 40 },
  "starter_library": [
    { "type": "goal", "name": "Student Pass Rate", "unit": "%" },
    { "type": "goal", "name": "Curriculum Completion", "unit": "%" },
    { "type": "competency", "name": "Pedagogy Effectiveness" },
    { "type": "competency", "name": "Student Engagement" }
  ]
}
```

### Hospitality
```json
{
  "framework": "kra_kpi",
  "cascade_mode": "bidirectional",
  "active_types": ["kra", "kpi", "competency"],
  "starter_library": [
    { "type": "kra", "name": "Guest Satisfaction", "unit": "score" },
    { "type": "kra", "name": "Revenue per Available Room (RevPAR)", "unit": "INR" },
    { "type": "kra", "name": "Occupancy Rate", "unit": "%" },
    { "type": "competency", "name": "Service Excellence" }
  ]
}
```

### Logistics / Supply Chain
```json
{
  "framework": "kra_kpi",
  "cascade_mode": "top_down",
  "active_types": ["kra", "kpi"],
  "starter_library": [
    { "type": "kra", "name": "On-Time Delivery Rate", "unit": "%" },
    { "type": "kra", "name": "Order Accuracy", "unit": "%" },
    { "type": "kra", "name": "Inventory Shrinkage", "unit": "%", "measurement_type": "lower_better" },
    { "type": "kra", "name": "Fleet Utilization", "unit": "%" }
  ]
}
```

### NGO / Social Sector
```json
{
  "framework": "goals",
  "cascade_mode": "bottom_up",
  "active_types": ["goal", "competency"],
  "terminology_overrides": {
    "goal": "Programme Target",
    "performance_band": "Impact Band",
    "weight": "Priority (%)"
  },
  "starter_library": [
    { "type": "goal", "name": "Beneficiaries Reached", "unit": "count" },
    { "type": "goal", "name": "Programme Budget Utilisation", "unit": "%" },
    { "type": "competency", "name": "Community Engagement" }
  ]
}
```

---

## 7. CASCADING MODE — DETAILED LOGIC

### 7.1 Top-Down Flow

```
ORDER OF OPERATIONS:
1. HR/Admin creates review cycle; sets cycle status = 'goal_setting'
2. CEO / highest-level employee enters company-level targets FIRST
   → These targets have hierarchy_level = 1; parent_target_id = NULL; company_target set
   → Status: approved immediately (no approver above them) or HR approves
3. Each level can enter their targets ONLY after the level above has approved theirs
   → System enforces: employee's goal-setting window shows "locked" if manager's targets not approved
4. Employee selects parent_target_id from manager's approved targets (dropdown)
5. Employee submits → manager approves → locked

VALIDATION at each level:
  - planned_target vs parent planned_target: over-plan flag if exceeded
  - Weight sum = 100% across all targets for this employee
  - parent_target_id must be set
  - Manager's own targets must be in 'approved' state before they can approve others'
```

### 7.2 Bottom-Up Flow

```
ORDER OF OPERATIONS:
1. HR creates cycle; ALL employees can set targets from day 1 of goal_setting window
2. Employee creates targets with cascade_direction = 'bottom_up', status = 'proposed'
   → No parent_target_id required at creation time
   → Employee describes their intended contribution in description field
3. Employee submits → targets go to manager's queue as 'proposed'
4. Manager reviews proposed targets:
   → Links each to one of their own targets (sets parent_target_id)
   → Approves or rejects with note
5. Manager aggregates team's proposed targets → creates their own targets based on sum
6. Manager targets go up to their manager → repeat up the chain
7. CEO/top level sees aggregated commitments from the entire org

SYSTEM HELPS with aggregation:
  GET /cycles/:cycleId/aggregate/:employeeId
  → Returns sum of all approved reportee targets, grouped by linked parent
  → Manager can use this as basis for their own target entry

VALIDATION for bottom-up:
  - Manager cannot approve bottom-up targets until they have set and submitted their own
  - Approved bottom-up targets must be linked to a parent target
  - Over-plan check still applies once linked
```

### 7.3 Bidirectional Flow (Both Simultaneously)

```
This is the recommended mode for mature organizations.

SETUP:
  org.settings.cascade_mode = 'bidirectional'
  cycle.cascade_mode = 'bidirectional' (or null to inherit org default)

HOW IT WORKS:
  Phase A (runs simultaneously):
  ├── TOP-DOWN track: Leadership enters company OKRs/KRAs (cascade_direction='top_down')
  └── BOTTOM-UP track: All employees can propose targets (cascade_direction='bottom_up')

  Phase B (Reconciliation — Manager's job):
  ├── Manager has BOTH:
  │   ├── Top-down targets from their own manager (to cascade down)
  │   └── Bottom-up proposals from their reportees (to link and approve)
  ├── Manager assigns/pushes relevant top-down targets to reportees
  ├── Manager links and approves bottom-up proposals from reportees
  └── Manager ensures: reportee's approved targets collectively cover the cascaded targets

  Phase C (System Validation before cycle goes 'active'):
  ├── Every approved target must have a parent_target_id (linkage enforced)
  ├── Weight sum = 100% per employee
  ├── Coverage check: sum of reportees' planned_targets vs manager's planned_target
  └── HR sees coverage dashboard: which managers have unlinked bottom-up proposals

MERGE RULE:
  An employee CAN have both:
  - Assigned targets (cascade_direction='top_down') — manager pushed these
  - Self-proposed targets (cascade_direction='bottom_up') — employee created these
  Both together must have weight sum = 100%
  Both must be approved before cycle goes active

EXAMPLE:
  Manager has: "Team Revenue = ₹5 Cr" (top-down, from VP)
  Employee A proposes: "I'll bring ₹2 Cr from enterprise accounts" (bottom-up)
  Employee B proposes: "I'll bring ₹2 Cr from SMB accounts" (bottom-up)
  Manager assigns: "₹1 Cr from inside sales" (top-down push to Employee C)
  Coverage: ₹2 + ₹2 + ₹1 = ₹5 Cr ✓ (exactly matches; no over/under)
```

### 7.4 Cascade Mode Enforcement Table

| Action | Top-Down | Bottom-Up | Bidirectional |
|--------|----------|-----------|---------------|
| Senior must set targets first | ✅ Required | ❌ Not required | ⚠️ Required for top-down track |
| Employee can propose own targets | ❌ No | ✅ Yes | ✅ Yes |
| parent_target_id required at creation | ✅ Yes | ❌ No (set later) | ⚠️ No at creation; required before approval |
| Manager links bottom-up proposals | ❌ N/A | ✅ Yes | ✅ Yes |
| Coverage check (child sum vs parent) | ✅ Yes | ✅ Yes (after approval) | ✅ Yes |

---

## 8. OVER-PLANNING LOGIC

### 8.1 The Business Rule

An employee or team can commit to more than their parent committed — this is "going the extra mile." However, the system must ensure this extra effort is:
1. Visible (flagged and labelled clearly)
2. Justified (note required)
3. Approved (explicit manager action)
4. Bounded (aggregate cannot exceed company_target × multiplier)

### 8.2 Implementation

```
When employee saves/submits a target with planned_target set:

  1. Fetch parent target (via parent_target_id)
  2. Compare:
       IF planned_target > parent.planned_target:
         SET is_over_planned = 1
         SET over_plan_ratio = planned_target / parent.planned_target
         REQUIRE over_plan_note (cannot submit without it)
       ELSE:
         SET is_over_planned = 0

  3. Check aggregate at parent level:
       SUM all approved/submitted siblings' planned_targets under same parent
       IF SUM > parent.planned_target × org.overplan_max_multiplier:
         → Return WARNING to HR/manager (not a block; just visibility)
         → Stored in target_audit_log with action = 'overplan_warning'

  4. Stretch target (separate field):
       IF stretch_target is set:
         REQUIRE stretch_target > planned_target
       Stretch is purely aspirational; not used in over-plan calculation.
       Recognized in dashboard as "bonus achievement" if actual > planned but < stretch.

EXAMPLE NUMBERS:
  org.overplan_max_multiplier = 1.15 (15% buffer)
  Company Target: ₹10 Cr
  Team A planned: ₹4 Cr
  Team B planned: ₹4.5 Cr
  Team C planned: ₹2.5 Cr
  SUM = ₹11 Cr = 110% of ₹10 Cr → Within 1.15 multiplier → OK, no warning
  
  If Team C planned ₹4 Cr:
  SUM = ₹12.5 Cr = 125% → Exceeds 1.15 multiplier → Warning to HR
```

---

## 9. VALIDATION ENGINE

All validations run server-side. Client shows live feedback as user types but final gate is server.

### 9.1 All Validation Rules

```
RULE V1 — Weight Sum = 100
  Scope: All active targets for one employee in one cycle
  When: On submit-all
  Severity: ERROR (blocks submission)
  Message: "Total weight is {X}%. Adjust weights so they add up to 100%."

RULE V2 — Minimum Weight Per Target
  Scope: Individual target
  When: On save
  Threshold: org.settings.target_rules.min_target_weight (default 5)
  Severity: WARNING
  Message: "This target has only {X}% weight. Is this intentional?"

RULE V3 — Maximum Weight Per Target
  Scope: Individual target
  Threshold: org.settings.target_rules.max_target_weight (default 50)
  Severity: WARNING
  Message: "Single target exceeds {X}% weight. Consider splitting into sub-targets."

RULE V4 — Parent Linkage Required
  Scope: All targets; enforced before approval (not creation for bottom-up)
  When: On submit (top_down) / On approval (bottom_up)
  Severity: ERROR
  Message: "This target must be linked to a parent target in the hierarchy."

RULE V5 — Parent Must Be Approved
  Scope: Top-down cascade
  When: On submit
  Severity: ERROR
  Message: "Your manager's targets are not yet approved. Goal-setting window is locked."

RULE V6 — Over-Plan Note Required
  Scope: Targets where is_over_planned = 1
  When: On submit
  Severity: ERROR
  Message: "You are planning {X}% above your manager's target. Add a justification note."

RULE V7 — Stretch > Planned
  Scope: Targets where stretch_target is set
  When: On save
  Severity: ERROR
  Message: "Stretch target must be higher than your planned target."

RULE V8 — Planned > 0
  Scope: All numeric targets
  When: On save
  Severity: ERROR
  Message: "Planned target must be greater than zero."

RULE V9 — Manager's Targets Must Be Approved Before Approving Reportee's
  Scope: Manager approval action
  When: Manager clicks approve
  Severity: ERROR
  Message: "You must have approved targets yourself before approving your team's targets."

RULE V10 — Duplicate Target
  Scope: Same employee, same cycle
  When: On add
  Severity: WARNING
  Message: "A similar target already exists for this cycle."

RULE V11 — Mandatory KRAs/KPIs Not Added
  Scope: Targets marked is_mandatory = 1 in performance_library
  When: On submit-all
  Severity: ERROR
  Message: "Missing mandatory target: '{name}'. Add it before submitting."

RULE V12 — Org-Wide Over-Plan Aggregate Warning
  Scope: HR view
  When: At any point during goal_setting
  Severity: WARNING (visible to HR and affected manager only)
  Message: "Team under {manager} has committed {X}% above the company plan."

RULE V13 — Bottom-Up Targets Without Parent Linkage
  Scope: Bidirectional / bottom-up cycles
  When: Before cycle advances to 'active' status
  Severity: ERROR (blocks cycle advancement)
  Message: "{N} proposed targets are not yet linked by managers. Cycle cannot go active."
```

### 9.2 Validation API Response Shape

```json
POST /api/v1/cycles/:cycleId/validate/:employeeId

Response:
{
  "result": "fail",
  "errors": [
    {
      "rule": "V1",
      "message": "Total weight is 85%. Adjust weights so they add up to 100%.",
      "context": { "current_total": 85, "required": 100 }
    },
    {
      "rule": "V11",
      "message": "Missing mandatory target: 'Customer Satisfaction'. Add it before submitting.",
      "context": { "library_id": 12, "name": "Customer Satisfaction" }
    }
  ],
  "warnings": [
    {
      "rule": "V12",
      "message": "You are planning 18% above your manager's target for 'Revenue'.",
      "context": { "target_id": 45, "ratio": 1.18 }
    }
  ],
  "summary": {
    "weight_total": 85,
    "targets_count": 4,
    "linked_count": 3,
    "unlinked_count": 1,
    "overplan_count": 1,
    "mandatory_missing": 1
  }
}
```

---

## 10. API ENDPOINTS

### Base: `/api/v1`

### Auth
```
POST   /auth/login
POST   /auth/logout
GET    /auth/me
```

### Wizard
```
POST   /wizard/start
GET    /wizard/status
POST   /wizard/step/:stepName
GET    /wizard/step/:stepName
POST   /wizard/import-employees       (CSV upload)
POST   /wizard/complete
```

### Organization
```
GET    /org/settings
PUT    /org/settings
GET    /org/framework-presets         → All industry presets (used in wizard)
GET    /org/grades
POST   /org/grades
PUT    /org/grades/:id
DELETE /org/grades/:id
GET    /org/departments               → Full tree
POST   /org/departments
PUT    /org/departments/:id
DELETE /org/departments/:id
GET    /org/library                   → KRA/KPI/Competency library
POST   /org/library
PUT    /org/library/:id
DELETE /org/library/:id
```

### Employees
```
GET    /employees                         (admin/HR; paginated)
POST   /employees
GET    /employees/:id
PUT    /employees/:id
GET    /employees/:id/hierarchy-chain     → Upward chain, ordered senior→junior
GET    /employees/:id/reportees           → Full downward tree
GET    /employees/:id/direct-reportees    → Only direct reports
```

### Cycles
```
GET    /cycles
POST   /cycles
GET    /cycles/:id
PUT    /cycles/:id
PUT    /cycles/:id/status             → Advance to next status
GET    /cycles/:id/dashboard          → Completion stats for HR
```

### Targets
```
GET    /cycles/:cycleId/targets
       ?employee_id=&status=&cascade_direction=&framework_type=

POST   /cycles/:cycleId/targets

GET    /cycles/:cycleId/targets/:id
PUT    /cycles/:cycleId/targets/:id
DELETE /cycles/:cycleId/targets/:id   (only draft/proposed status)

POST   /cycles/:cycleId/targets/:id/submit
POST   /cycles/:cycleId/targets/submit-all   → batch submit for employee

POST   /cycles/:cycleId/targets/:id/approve
       body: { over_plan_approved, note }

POST   /cycles/:cycleId/targets/:id/reject
       body: { rejection_note }

POST   /cycles/:cycleId/targets/:id/link
       body: { parent_target_id }            → Bottom-up: manager links proposal

GET    /cycles/:cycleId/hierarchy-targets/:employeeId
       → Full upward chain WITH each person's targets; used for context panel

GET    /cycles/:cycleId/weight-check/:employeeId
       → { current_total, remaining, is_valid, targets_breakdown }

GET    /cycles/:cycleId/aggregate/:managerId
       → Sum of reportees' approved targets (for bottom-up aggregation)

GET    /cycles/:cycleId/coverage/:managerId
       → { manager_target, children_sum, covered_percent, gap }
```

### Validation
```
POST   /cycles/:cycleId/validate/:employeeId   → Full validation report
GET    /cycles/:cycleId/overplan-report        → HR: all over-planned targets in cycle
GET    /cycles/:cycleId/unlinked-report        → HR: all unlinked bottom-up proposals
```

### Appraisal
```
POST   /cycles/:cycleId/targets/:id/self-rate
       body: { self_rating, self_comment, actual_value }

POST   /cycles/:cycleId/targets/:id/manager-rate
       body: { manager_rating, manager_comment, final_rating }

GET    /cycles/:cycleId/summary/:employeeId
POST   /cycles/:cycleId/summary/:employeeId/compute

GET    /cycles/:cycleId/calibration            → HR: calibration view
POST   /cycles/:cycleId/calibration/adjust
       body: { employee_id, adjusted_score, reason }
```

### Reports
```
GET    /reports/cycle/:cycleId/completion      → Goal-setting completion rate
GET    /reports/cycle/:cycleId/distribution    → Rating distribution by dept
GET    /reports/cycle/:cycleId/overplan        → All over-planned targets
GET    /reports/cycle/:cycleId/bands           → Performance band distribution
GET    /reports/cycle/:cycleId/cascade-health  → Linkage and coverage stats
```

---

## 11. REACT PAGES AND ROUTES

```
/                              → Redirect to /wizard (if not completed) or /dashboard

/wizard                        → Setup Wizard (full-screen; blocks other routes)
/wizard/:step                  → Individual step (industry, framework, cascade, etc.)

/dashboard                     → Role-aware home (employee / manager / HR views)

/org/settings                  → Edit org settings (post-wizard)
/org/employees                 → Employee management + org tree
/org/library                   → KRA/KPI/Competency library management

/cycles                        → Cycle list
/cycles/new                    → Create cycle
/cycles/:id                    → Cycle detail + status stepper

/my-targets                    → Employee: own targets for active cycle
/my-targets/add                → Target entry form (with hierarchy context panel)
/my-targets/:id/edit           → Edit draft target

/team-targets                  → Manager: all reportees' targets
/team-targets/:employeeId      → Single reportee's targets + approve/reject
/team-targets/proposed         → Bottom-up proposals waiting for linking

/appraisal/self                → Employee: self-rating phase
/appraisal/team                → Manager: rate all reportees
/appraisal/team/:employeeId    → Rate single reportee

/calibration                   → HR: calibration dashboard

/reports                       → HR/Manager: dashboards and analytics
/reports/cascade-health        → Cascade coverage and linkage report
/reports/overplan              → All over-planned targets
```

---

## 12. KEY REACT COMPONENTS

### 12.1 Wizard Components

```
wizard/
├── WizardShell              → Full-screen wrapper with step progress bar at top
├── StepIndustry             → Tile grid: 9 industry cards
├── StepFramework            → 6 framework cards with plain-language descriptions
├── StepCascade              → 3 cascade mode cards with visual flow diagrams
├── StepRating               → Rating scale picker with live preview
├── StepWeightage            → Slider + numeric inputs for goal/competency split
├── StepTerminology          → Editable terminology table
├── StepGrades               → Editable grade table (add/remove/reorder)
├── StepDepartments          → Visual tree builder (add dept nodes)
├── StepEmployees            → Manual entry table + CSV upload
├── StepCycle                → First cycle creation form
└── WizardComplete           → Success screen + "Go to Dashboard" button
```

### 12.2 Target Components

```
targets/
├── MyTargetsPage            → Split layout: left=targets, right=HierarchyChainPanel
├── TargetForm               → Framework-aware form (shows OKR/KRA/Goal/Competency fields)
├── TargetCard               → Single target display; shows status, weight, over-plan badge
├── WeightMeter              → Circular gauge: X% of 100 used
├── OverplanBadge            → Red badge showing "↑ 18% over plan" with info tooltip
├── ValidationSummary        → Traffic light list: errors (red), warnings (yellow), pass (green)
└── SubmitAllButton          → Runs validation first, shows modal, then submits
```

### 12.3 Hierarchy Components

```
hierarchy/
├── HierarchyChainPanel      → Right panel showing upward chain with targets
│   Layout:
│   ┌─────────────────────────────────┐
│   │ 📊 Your Hierarchy Context        │
│   │ Cycle: FY 2025-26 Annual         │
│   ├─────────────────────────────────┤
│   │ 🏢 COMPANY                       │
│   │ Grow ARR: ₹10 Cr                 │
│   │ ● Approved                       │
│   ├─────────────────────────────────┤
│   │ 👤 Ramesh Kumar — VP (L5)        │
│   │ Engineering Revenue: ₹5 Cr       │
│   │ ● Approved  [▼ 2 more]           │
│   ├─────────────────────────────────┤
│   │ 👤 Priya Sharma — Manager (L4)   │
│   │ Team Output: 3 product releases  │
│   │ ● Approved  [▼ 3 more]           │
│   ├─────────────────────────────────┤
│   │ 👤 YOU — Senior Dev (L3)         │
│   │ [Adding your targets...]         │
│   └─────────────────────────────────┘
│   → Click any parent target to set it as parent_target_id for new target
│
└── OrgTreeView              → Full interactive org tree (admin/HR)
```

### 12.4 Approval Components

```
approval/
├── TeamTargetsPage          → Table of all reportees; filter by status/cascade_direction
├── ApprovalPanel            → Slide-in panel for one target:
│   ├── Target details (title, planned, weight, framework_type)
│   ├── Parent target context (what it links to above)
│   ├── Employee's over-plan note (if is_over_planned = 1)
│   ├── Checkbox: "I approve this stretch commitment" (if over-planned)
│   ├── Manager rating field (pre-fill from employee's self-rating)
│   ├── Approve button / Reject button + note field
│   └── Link button (for bottom-up: assign parent_target_id)
└── ProposedTargetsQueue     → Bottom-up proposals: list + bulk link + approve
```

### 12.5 Dashboard Components

```
dashboard/
├── EmployeeDashboard        → My score gauge, target list, weight breakdown
├── ManagerDashboard         → Team completion %, pending approvals, coverage meter
├── HRDashboard              → Org-wide stats, cascade health, overplan report
├── CascadeHealthCard        → Green/yellow/red: linkage %, unlinked count
├── RatingDistributionChart  → Bell curve / bar chart of final ratings
└── BandDistributionChart    → % of employees in each performance band
```

---

## 13. CRITICAL QUERIES (SQLite)

### Upward Hierarchy Chain
```sql
WITH RECURSIVE chain AS (
  SELECT id, name, reporting_to, grade_id, dept_id, 0 AS depth
  FROM employees WHERE id = ?

  UNION ALL

  SELECT e.id, e.name, e.reporting_to, e.grade_id, e.dept_id, c.depth + 1
  FROM employees e INNER JOIN chain c ON e.id = c.reporting_to
)
SELECT
  c.id, c.name, c.depth,
  g.code AS grade_code, g.label AS grade_label, g.level,
  d.name AS dept_name
FROM chain c
LEFT JOIN grades g ON g.id = c.grade_id
LEFT JOIN departments d ON d.id = c.dept_id
ORDER BY c.depth DESC;
```

### Hierarchy Chain WITH Targets (for Context Panel)
```sql
WITH RECURSIVE chain AS (
  SELECT id, reporting_to, 0 AS depth
  FROM employees WHERE id = ?

  UNION ALL

  SELECT e.id, e.reporting_to, c.depth + 1
  FROM employees e INNER JOIN chain c ON e.id = c.reporting_to
)
SELECT
  e.id AS emp_id, e.name AS emp_name,
  g.code AS grade_code, g.label AS grade_label,
  t.id AS target_id, t.title, t.framework_type,
  t.planned_target, t.stretch_target, t.unit, t.weight,
  t.status, t.is_over_planned, t.cascade_direction,
  chain.depth
FROM chain
JOIN employees e ON e.id = chain.id
LEFT JOIN targets t ON t.employee_id = chain.id
       AND t.cycle_id = ?
       AND t.status IN ('approved', 'active', 'locked')
LEFT JOIN grades g ON g.id = e.grade_id
WHERE chain.depth > 0
ORDER BY chain.depth DESC, t.weight DESC;
```

### Coverage Check (Children's Sum vs Parent's Planned)
```sql
SELECT
  p.id AS parent_target_id,
  p.title AS parent_title,
  p.planned_target AS parent_planned,
  SUM(c.planned_target) AS children_sum,
  ROUND(SUM(c.planned_target) / p.planned_target * 100, 1) AS coverage_pct,
  COUNT(c.id) AS children_count
FROM targets p
JOIN targets c ON c.parent_target_id = p.id
  AND c.status IN ('approved', 'submitted')
  AND c.cycle_id = ?
WHERE p.employee_id = ?
  AND p.cycle_id = ?
GROUP BY p.id;
```

### Weight Validation
```sql
SELECT
  SUM(weight) AS total_weight,
  COUNT(*) AS target_count,
  SUM(CASE WHEN weight < ? THEN 1 ELSE 0 END) AS below_min_count,
  SUM(CASE WHEN weight > ? THEN 1 ELSE 0 END) AS above_max_count
FROM targets
WHERE employee_id = ?
  AND cycle_id = ?
  AND status NOT IN ('rejected', 'draft');
-- Params: min_weight, max_weight, employee_id, cycle_id
```

### Downward Reportees Tree
```sql
WITH RECURSIVE tree AS (
  SELECT id, name, reporting_to, grade_id, dept_id, 0 AS depth
  FROM employees WHERE reporting_to = ?

  UNION ALL

  SELECT e.id, e.name, e.reporting_to, e.grade_id, e.dept_id, t.depth + 1
  FROM employees e INNER JOIN tree t ON e.reporting_to = t.id
)
SELECT tree.*, g.code, g.label
FROM tree
LEFT JOIN grades g ON g.id = tree.grade_id
ORDER BY depth, name;
```

---

## 14. DEVELOPMENT PHASES (Build Order for Claude Code)

Build each phase completely before starting the next. Each phase has a clear test you can verify.

---

### PHASE 1 — Project Scaffold + Database
**Deliverable:** Both servers start; DB created with all tables; seed data visible

```
Tasks:
1. Create pms-poc folder structure (Section 1)
2. Init server: npm init, install all server packages (Section 2)
3. Init client: npm create vite, install all client packages (Section 2)
4. Set up concurrently in root package.json
5. Write database.js (connection singleton with WAL mode + foreign keys ON)
6. Write all migrations in order (001_core → 002_targets → 003_appraisal)
7. Write seeds: 1 org (IT/OKR/bidirectional), 1 industry preset, grades, depts, 10 employees
   Seed hierarchy: CEO → VP Eng → Eng Manager → 2 Senior Devs → 2 Devs
                       → VP Sales → Sales Manager → 2 Sales Reps
8. Expose: GET /api/v1/health → { status:'ok', tables:[...], employee_count: N }

Test: npm run dev → both ports live; curl /health returns 200
```

---

### PHASE 2 — Auth + Hierarchy API
**Deliverable:** Login returns JWT; hierarchy chain API returns correct upward chain

```
Tasks:
1. POST /auth/login → validate email+password → return { token, employee }
2. GET /auth/me → return employee with grade, dept, manager name
3. Auth middleware → verify JWT on all protected routes
4. GET /employees/:id/hierarchy-chain → recursive CTE query (Section 13)
5. GET /employees/:id/direct-reportees

React:
1. Login page (email + password form)
2. Zustand: authStore (token, currentEmployee, setAuth, logout)
3. PrivateRoute wrapper
4. Basic sidebar layout with placeholder pages

Test: Login as junior employee → call hierarchy-chain → see 4-level chain in response
```

---

### PHASE 3 — Setup Wizard (Full 11 Steps)
**Deliverable:** HR can run the entire wizard; org configured; employees imported; first cycle created

```
Tasks:
Server:
1. All /wizard/* APIs (Section 10)
2. CSV parse + bulk employee insert with validation
3. Framework presets endpoint: GET /org/framework-presets

React:
1. WizardShell with progress bar (11 steps)
2. Each step component (Section 12.1)
3. Special attention:
   - StepFramework: 6 framework cards with industry recommendation auto-select
   - StepCascade: visual diagrams for each mode (simple SVG or CSS boxes)
   - StepEmployees: table + CSV upload with preview before import
4. Wizard guard: redirect to /wizard if wizard_completed = 0
5. On complete: redirect to /dashboard with success toast

Test: Fresh setup → complete all 11 steps → login as any employee → see correct org settings
```

---

### PHASE 4 — Cycle Management
**Deliverable:** HR can create, configure, and advance cycles

```
Tasks:
Server:
1. All /cycles/* APIs
2. Status state machine guard (can only advance in order; never skip)
3. Cycle cascade_mode override logic

React:
1. Cycles list page with status badges
2. Create cycle form (name, type, dates, cascade mode override)
3. CycleStatusStepper: draft → goal_setting → active → review → calibration → closed
4. Advance status button with confirmation modal
5. Cycle detail: dates, settings, completion stats (empty for now)

Test: Create annual cycle → advance to goal_setting → dates display correctly
```

---

### PHASE 5 — Target Entry + Hierarchy Context Panel
**Deliverable:** Employee can add targets; sees full upward chain in real time; weight meter updates live

```
Tasks:
Server:
1. GET /cycles/:cycleId/hierarchy-targets/:employeeId (Section 13 query)
2. GET /cycles/:cycleId/weight-check/:employeeId
3. POST /cycles/:cycleId/targets (create draft)
4. PUT /cycles/:cycleId/targets/:id (edit draft)
5. DELETE /cycles/:cycleId/targets/:id (delete draft)

React:
1. MyTargetsPage: split layout (65/35)
2. HierarchyChainPanel: collapsible levels, click to select as parent
3. TargetForm:
   - Framework-aware: shows correct fields based on org.framework
   - Uses org.terminology for all labels
   - Parent target dropdown: shows hierarchy panel items
   - Weight input with live meter update
   - Planned target, stretch target (optional), unit, measurement type
   - For bottom-up: shows "Propose to Manager" instead of "Link to Parent"
4. WeightMeter: circular/linear gauge showing X/100 used
5. TargetCard: displays framework_type tag, weight, status badge, over-plan badge
6. OverplanBadge: auto-appears when planned > parent's planned

Test: Login as junior dev → add 3 targets → see VP and Manager targets in right panel
       → over-plan one target → badge appears → weight meter hits 100%
```

---

### PHASE 6 — Validation Engine + Submission
**Deliverable:** All 13 validation rules enforced; submit flow shows clear pass/fail

```
Tasks:
Server:
1. POST /cycles/:cycleId/validate/:employeeId (Section 9.2 response shape)
2. POST /cycles/:cycleId/targets/submit-all
3. Validation service: all 13 rules (Section 9.1)
4. over_plan_ratio computed and stored on save
5. is_over_planned auto-flagged on save

React:
1. ValidationSummary component:
   - Green check rows for passing rules
   - Red ✗ rows for errors (with message and fix hint)
   - Yellow ⚠ rows for warnings
   - "N errors, M warnings" summary at top
2. Submit All button:
   Step 1: Run validation → show ValidationSummary in modal
   Step 2: If errors → cannot proceed; show fix hints
   Step 3: If only warnings → confirm button available
   Step 4: On confirm → submit-all API → success toast
3. Inline over-plan justification textarea (appears on TargetForm when over-plan detected)
4. Mandatory KRA missing → highlight in red with "Add this target" quick-action

Test: Submit with weight ≠ 100 → error; over-plan without note → error;
      add note → warning only → submit succeeds → status = 'submitted'
```

---

### PHASE 7 — Manager Approval Workflow
**Deliverable:** Managers can see submitted targets, link proposals, approve/reject

```
Tasks:
Server:
1. POST /cycles/:cycleId/targets/:id/approve (with all approval validations)
2. POST /cycles/:cycleId/targets/:id/reject
3. POST /cycles/:cycleId/targets/:id/link (for bottom-up linking)
4. GET /cycles/:cycleId/coverage/:managerId
5. GET /cycles/:cycleId/aggregate/:managerId

React:
1. TeamTargetsPage: table grouped by employee; filter tabs: All / Submitted / Proposed / Approved
2. ApprovalPanel (slide-in from right):
   - Target details
   - Parent context (manager's own target this links to)
   - Over-plan section: ratio badge + employee's justification note + approval checkbox
   - Approve / Reject buttons
   - For bottom-up: Link to Parent dropdown + Link button
3. ProposedTargetsQueue: dedicated page for bottom-up proposals
4. CoverageCard on manager dashboard: "Your team covers X% of your committed target"
5. Pending approvals count badge on sidebar nav

Test: Submit as IC → login as manager → see submitted target → approve with over-plan tick
       → login back as IC → target shows 'approved'
```

---

### PHASE 8 — Appraisal / Rating Phase
**Deliverable:** Self and manager rating; weighted score computed; performance band shown

```
Tasks:
Server:
1. POST /cycles/:cycleId/targets/:id/self-rate (with actual_value)
2. POST /cycles/:cycleId/targets/:id/manager-rate
3. POST /cycles/:cycleId/summary/:employeeId/compute
   Formula:
     goal_targets = targets where framework_type != 'competency'
     comp_targets = targets where framework_type = 'competency'
     goal_score = SUM(final_rating × weight) / SUM(weight) for goal_targets
     comp_score = SUM(final_rating × weight) / SUM(weight) for comp_targets
     final_score = (goal_score × goals_percent/100) + (comp_score × comp_percent/100)
     band = map final_score to org.settings.performance_bands

React:
1. Self-appraisal page:
   - One card per approved target
   - Actual achievement value input
   - Rating widget (based on org rating scale type)
   - Comments textarea
   - Save per target
2. Manager appraisal page:
   - Employee selector (from reportees)
   - Shows employee's self-rating + comment + actual
   - Manager override rating input
   - Manager comment
3. Performance summary card:
   - Circular score gauge
   - Performance band badge with color
   - Goals score vs competency score breakdown
   - PIP indicator if band = 'needs_improvement'

Test: Complete self-rating → manager rates → compute → see correct weighted score and band
```

---

### PHASE 9 — HR Dashboards & Reports
**Deliverable:** HR sees org-wide visibility; all reports usable

```
Tasks:
Server:
1. All /reports/* endpoints
2. GET /cycles/:id/dashboard (completion stats)

React:
1. HRDashboard:
   - Goal-setting completion ring (% employees with approved targets)
   - Cascade health card (% targets linked)
   - Over-plan targets count card
   - Unlinked proposals count card
2. RatingDistributionChart (Recharts BarChart by dept)
3. BandDistributionChart (Recharts PieChart)
4. OverplanReport table: employee, target, ratio, note, approval status
5. CascadeHealthReport: by manager — coverage %, gap amount
6. Manager dashboard: team completion, pending approvals, coverage meter

Test: Check all cards show correct numbers; clicking a card drills down to detail
```

---

### PHASE 10 — Multi-Industry Demo
**Deliverable:** System shown working with 3 different industries side by side

```
Tasks:
1. Seed 2 more orgs: Manufacturing (KRA/KPI/top-down) + Healthcare (Goals+Competency/top-down)
2. Demo org switcher in header (admin only, for demo mode)
3. Verify TargetForm shows correct fields for each framework
4. Verify all labels follow org terminology in all 3 orgs
5. Verify validation rules pick up org-specific settings (multiplier, min/max weight)
6. Verify cascade flow works correctly per org's cascade_mode
7. Write a DEMO_GUIDE.md explaining how to walk through each org for a client demo

Test: Switch to Manufacturing org → all labels change to KRA/KPI terms
      → targets show production unit fields → cascade is top-down only
```

---

## 15. ENVIRONMENT SETUP (One-Time Commands)

```bash
# 1. Create root
mkdir pms-poc && cd pms-poc

# 2. Server setup
mkdir server && cd server
npm init -y
npm install express sql.js bcrypt jsonwebtoken cors dotenv multer csv-parse
npm install -D nodemon
cd ..

# 3. Client setup
npm create vite@latest client -- --template react
cd client
npm install axios zustand react-router-dom recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card badge dialog form input label select tabs \
  table alert toast progress slider checkbox radio-group separator tooltip
cd ..

# 4. Root concurrently
npm init -y
npm install -D concurrently
# Add to root package.json:
# "scripts": {
#   "dev": "concurrently \"cd server && npm run dev\" \"cd client && npm run dev\"",
#   "server": "cd server && npm run dev",
#   "client": "cd client && npm run dev"
# }

# 5. Run
npm run dev
# Server: http://localhost:3001
# Client: http://localhost:5173
```

---

## 16. CLAUDE CODE PROMPTS (Sequential)

Use these prompts in Claude Code **in order**. Each builds on the previous.

```
════════════════════════════════════════════════════════
PROMPT 1 — Foundation
════════════════════════════════════════════════════════
"Read specifications.md fully. Then:
1. Create the folder structure from Section 1.
2. Set up the Express server with better-sqlite3 and the database.js singleton from Section 3.
3. Write migrations for all tables in Section 3 (001_core.sql, 002_targets.sql, 003_appraisal.sql).
4. Write seed scripts from Section 14 Phase 1:
   - 1 IT org (framework=hybrid, cascade_mode=bidirectional)
   - Grades: L1 to L5
   - 3 departments: Engineering, Sales, HR
   - 10 employees in the hierarchy described in Phase 1
   - 1 review cycle in goal_setting status
5. Expose GET /api/v1/health returning { status, tables, employee_count }.
6. Set up root package.json with concurrently scripts."

════════════════════════════════════════════════════════
PROMPT 2 — Auth + Hierarchy
════════════════════════════════════════════════════════
"Using specifications.md Section 13 for SQL queries:
1. Add POST /auth/login and GET /auth/me to the Express server.
2. Add auth middleware (JWT verify) protecting all routes except login.
3. Add GET /employees/:id/hierarchy-chain using the recursive CTE.
4. Add GET /employees/:id/direct-reportees.
5. Build the React Login page with email+password form.
6. Set up Zustand authStore (token, currentEmployee, setAuth, logout).
7. Build a sidebar layout with navigation placeholder items from Section 11.
8. Add a PrivateRoute that redirects to /login if not authenticated."

════════════════════════════════════════════════════════
PROMPT 3 — Setup Wizard
════════════════════════════════════════════════════════
"Build the full Setup Wizard from specifications.md Section 4.
1. Server: all /wizard/* endpoints including CSV employee import.
2. Server: GET /org/framework-presets returning all presets from Section 6.
3. React: WizardShell with 11-step progress bar at top.
4. React: All 11 step components (StepIndustry through WizardComplete).
   - StepIndustry: 9 industry tile cards with icons.
   - StepFramework: 6 framework cards with descriptions and industry recommendations.
   - StepCascade: 3 cascade mode options with visual flow diagram (use ASCII-style boxes in CSS).
   - StepRating: 5 scale options with live preview of a sample rating.
   - StepEmployees: manual table + CSV upload with row preview before import.
5. Wizard guard: if org.wizard_completed = 0, redirect all routes to /wizard.
6. On complete: set wizard_completed = 1, redirect to /dashboard with toast."

════════════════════════════════════════════════════════
PROMPT 4 — Cycle Management
════════════════════════════════════════════════════════
"Build cycle management from specifications.md Section 14 Phase 4.
1. Server: all /cycles/* endpoints with status state machine.
2. React: Cycles list page with CycleStatusStepper (6 stages).
3. React: Create cycle form (name, type, dates, cascade mode override).
4. Status advance: each advance requires confirmation modal; enforce order."

════════════════════════════════════════════════════════
PROMPT 5 — Target Entry + Hierarchy Panel
════════════════════════════════════════════════════════
"Build target entry from specifications.md Section 14 Phase 5.
1. Server: hierarchy-targets endpoint using the query in Section 13.
2. Server: weight-check endpoint.
3. Server: target CRUD (create, read, update, delete).
4. React: MyTargetsPage with 65/35 split layout.
5. React: HierarchyChainPanel — collapsible levels, click to select as parent.
   Show exactly the layout described in Section 12.3.
6. React: TargetForm that reads org.settings.framework and shows relevant fields.
   Use org.settings.terminology for all labels.
7. React: WeightMeter — circular gauge updating live as weight inputs change.
8. React: OverplanBadge — auto-appears comparing planned vs parent planned."

════════════════════════════════════════════════════════
PROMPT 6 — Validation + Submission
════════════════════════════════════════════════════════
"Build the validation engine from specifications.md Section 9.
1. Server: validationService.js implementing all 13 rules from Section 9.1.
2. Server: POST /validate/:employeeId returning the shape in Section 9.2.
3. Server: POST /targets/submit-all with validation gate.
4. React: ValidationSummary component (green/yellow/red rows per rule).
5. React: Submit All button — runs validation in modal, shows results,
   allows confirm only if no errors.
6. React: Over-plan justification textarea appears inline in TargetForm
   when is_over_planned is auto-detected."

════════════════════════════════════════════════════════
PROMPT 7 — Manager Approval + Cascade Linking
════════════════════════════════════════════════════════
"Build manager approval from specifications.md Section 14 Phase 7.
1. Server: approve, reject, and link endpoints with all approval validations.
2. Server: coverage endpoint (Section 13 query).
3. Server: aggregate endpoint for bottom-up flow.
4. React: TeamTargetsPage with filter tabs (All/Submitted/Proposed/Approved).
5. React: ApprovalPanel slide-in:
   - Target details + parent context
   - Over-plan section with approval checkbox
   - Approve/Reject buttons + note
   - Link to Parent for bottom-up proposals
6. React: CoverageCard on manager dashboard.
7. React: Pending count badge on sidebar nav item."

════════════════════════════════════════════════════════
PROMPT 8 — Appraisal + Scoring
════════════════════════════════════════════════════════
"Build the appraisal phase from specifications.md Section 14 Phase 8.
1. Server: self-rate and manager-rate endpoints.
2. Server: compute summary using the formula in Phase 8.
   Map final_score to org.settings.performance_bands.
3. React: Self-appraisal page — one card per approved target with:
   actual_value input, rating widget (use org rating_scale type), comments.
4. React: Manager appraisal page — shows employee self-rating for reference,
   manager rating override, comments.
5. React: Performance summary card — circular score gauge, band badge,
   goals vs competency breakdown."

════════════════════════════════════════════════════════
PROMPT 9 — HR Reports + Dashboards
════════════════════════════════════════════════════════
"Build all dashboards from specifications.md Section 14 Phase 9.
1. Server: all /reports/* endpoints.
2. React: HRDashboard with 4 stat cards + 2 Recharts charts.
3. React: OverplanReport table (employee, target, ratio, note, status).
4. React: CascadeHealthReport by manager (coverage%, gap).
5. React: Manager dashboard with team completion ring + pending approvals."

════════════════════════════════════════════════════════
PROMPT 10 — Multi-Industry Demo
════════════════════════════════════════════════════════
"Add multi-industry demo capability from specifications.md Section 14 Phase 10.
1. Seed 2 more orgs using presets from Section 6:
   - Manufacturing (KRA/KPI, top-down, production KRAs)
   - Healthcare (Goals+Competency, top-down, clinical competencies)
2. Admin-only org switcher dropdown in header (stores selected org_id in Zustand).
3. All APIs must scope to selected org_id.
4. Verify all 3 orgs show correct terminology, fields, and cascade behavior.
5. Write DEMO_GUIDE.md: 3-org walkthrough script for client demos."
```

---

## 17. SCORING FORMULA REFERENCE

```
For each employee in a cycle:

goal_targets     = approved targets where framework_type NOT IN ('competency')
competency_targets = approved targets where framework_type = 'competency'

-- Weighted average for goals
goal_weighted_sum   = SUM(final_rating × weight) WHERE framework_type != 'competency'
goal_weight_total   = SUM(weight)                WHERE framework_type != 'competency'
goal_score          = goal_weighted_sum / goal_weight_total

-- Weighted average for competencies
comp_weighted_sum   = SUM(final_rating × weight) WHERE framework_type = 'competency'
comp_weight_total   = SUM(weight)                WHERE framework_type = 'competency'
comp_score          = comp_weighted_sum / comp_weight_total

-- Final blended score
goals_pct      = org.settings.weightage.goals_percent / 100
comp_pct       = org.settings.weightage.competency_percent / 100
final_score    = (goal_score × goals_pct) + (comp_score × comp_pct)

-- Band mapping (from org.settings.performance_bands)
band = first band where final_score >= band.min AND final_score <= band.max
is_pip_triggered = (band.label IN ('Poor', 'Needs Improvement'))
```

---

## 18. FILE NAMING AND CONVENTIONS

```
Server files:
  routes/auth.js, routes/wizard.js, routes/targets.js   (one file per domain)
  services/validationService.js                          (camelCase service files)
  db/migrations/001_core.sql                             (numbered SQL files)
  db/seeds/01_org.js                                     (numbered seed files)

Client files:
  pages/MyTargetsPage.jsx                                (PascalCase pages)
  components/targets/TargetForm.jsx                      (PascalCase components)
  components/shared/WeightMeter.jsx
  store/authStore.js                                     (camelCase stores)
  store/cycleStore.js
  api/targetsApi.js                                      (camelCase API modules)
  utils/frameworkConfig.js

Constants (in client/src/utils/constants.js):
  FRAMEWORK_TYPES = ['okr', 'kra_kpi', 'goals', 'competency', 'hybrid', 'balanced_scorecard']
  CASCADE_MODES   = ['top_down', 'bottom_up', 'bidirectional']
  TARGET_STATUSES = ['draft','submitted','proposed','linked','approved','rejected','active','locked']
  INDUSTRIES      = ['it','manufacturing','healthcare','bfsi','retail','education','hospitality','logistics','ngo','custom']
```

---

## 19. CONTEXTUAL HELP SYSTEM

Every UI page, section, and form field must display a small **ⓘ** (info icon) that opens a contextual tooltip or popover explaining:
- What the element is
- Why it matters in a performance management context
- How to fill it in / use it correctly
- Any business rule the user should know

This serves two purposes: (1) HR/Managers can self-learn the system without training; (2) During demos, you can click any ⓘ to explain the concept to the client.

---

### 19.1 InfoIcon Component (Shared)

```
components/shared/InfoIcon.jsx

Props:
  content  : string | ReactNode   — the help text or JSX to display
  title    : string (optional)    — bold header inside the popover
  size     : 'sm' | 'md'          — default 'sm'
  placement: 'top'|'right'|'bottom'|'left'  — default 'right'

Behavior:
  - Renders a small circular ⓘ icon (shadcn Tooltip or Popover)
  - On hover (desktop) or tap (mobile): shows the help popover
  - Popover has a close (×) button
  - Max width: 320px; text is readable, not a wall of text
  - Icon color: text-muted-foreground; does NOT distract from the main UI
  - Placed immediately after the label it describes, inline

Usage example:
  <label>Planned Target <InfoIcon title="Planned Target" content={HELP.target.planned} /></label>
```

All help strings live in a single file:
```
client/src/utils/helpContent.js
export const HELP = { wizard: {...}, target: {...}, cycle: {...}, ... }
```

---

### 19.2 Help Content — Setup Wizard

#### STEP 1 — Company Info
```
Field: Organization Name
  "The legal or commonly used name of your company. This appears in all reports,
   email notifications, and the employee dashboard header. You can change it later
   from Org Settings."

Field: Employee Count Range
  "Approximate number of employees this system will cover. We use this to suggest
   sensible defaults for target limits, approval hierarchy depth, and report groupings.
   Choose the closest range — you don't need an exact number."

Field: Country / Region
  "Used to pre-fill terminology (e.g., 'Financial Year' vs 'Fiscal Year') and date
   format defaults. Does not affect business logic."
```

#### STEP 2 — Industry Selection
```
Section Header — "Select Your Industry"
  "Your industry determines the default performance framework, terminology, and
   starter KRA/KPI library we load for you. For example, selecting IT pre-loads
   OKR-style targets; Manufacturing pre-loads production KPIs. You can customize
   everything after — this just saves you setup time."

Each industry tile — shown on hover:
  IT / Software:
    "Recommended framework: OKR. Focuses on innovation velocity, product delivery,
     and engineering metrics. Works well with bidirectional cascading where developers
     propose their own sprint commitments."

  Manufacturing:
    "Recommended framework: KRA/KPI. Centers on production output, defect rates,
     machine uptime, and safety compliance. Top-down cascading ensures plant-level
     targets align to company production plans."

  Healthcare:
    "Recommended framework: Hybrid (Goals + Competency). Clinical roles need both
     measurable goals (patient satisfaction, compliance scores) and behavioral
     competency ratings (clinical judgment, empathy). Equal 50/50 weighting is common."

  BFSI:
    "Recommended framework: Balanced Scorecard. Regulatory requirements demand
     tracking across Financial, Customer, Compliance & Risk, and Learning dimensions
     simultaneously. AUM growth sits alongside NPA ratios."

  Retail / Sales:
    "Recommended framework: Goals. Simple revenue and conversion targets that reset
     monthly or quarterly. Over-planning is common and allowed (up to 130% of quota)."

  Education:
    "Recommended framework: Goals + Competency. Teachers are measured on student
     outcomes (pass rates, curriculum completion) and pedagogical skills. NGO-adjacent
     terminology like 'Programme Target' can be applied."

  Hospitality:
    "Recommended framework: KRA/KPI with competency overlay. Guest satisfaction scores,
     RevPAR, and occupancy are the primary metrics; service excellence competencies
     differentiate top performers."

  Logistics:
    "Recommended framework: KRA/KPI. On-time delivery, order accuracy, fleet utilization,
     and shrinkage are the standard KRAs. Top-down cascading from central ops to
     regional hubs to individual drivers."

  NGO / Social Sector:
    "Recommended framework: Goals (Bottom-Up). Field staff propose programme targets
     based on ground realities; leadership aggregates commitments. Terminology is
     customized: 'Programme Target' instead of 'Goal', 'Impact Band' instead of
     'Performance Band'."
```

#### STEP 3 — Framework Selection
```
Section Header — "Choose Your Performance Framework"
  "A framework is the structure you use to define and measure employee performance.
   Think of it as the 'language' of your appraisal process. Your industry pre-selected
   a recommendation, but you can choose any framework or mix them."

OKR Card:
  "OKR stands for Objectives and Key Results — popularized by Google and Intel.
   An Objective is an inspiring qualitative direction ('Build the best product in
   the market'). Key Results are 3-5 measurable outcomes that prove you reached it
   ('Ship 4 features with <1% bug rate', 'Achieve NPS of 60').
   Best for: tech companies, startups, product-led organizations."

KRA / KPI Card:
  "KRA (Key Result Area) is a broad responsibility domain — e.g., 'Customer Service'.
   KPIs (Key Performance Indicators) are the specific metrics within that domain —
   e.g., 'First Call Resolution Rate: 85%', 'Average Handle Time: <4 min'.
   Best for: manufacturing, banking, retail, traditional enterprises."

Goals Card:
  "Plain individual targets with no jargon. An employee just commits to outcomes:
   'Complete 3 certifications', 'Onboard 10 new clients'. Simple to understand
   and fast to set up. Best for: small teams, NGOs, education sector."

Competency-Based Card:
  "Evaluates employees on behaviors and skills rather than numbers. Examples:
   'Communication: Level 3 — Clearly articulates ideas to non-technical audiences'.
   Uses BARS (Behaviorally Anchored Rating Scales) or a 5-point proficiency scale.
   Best for: healthcare, customer service, HR-heavy organizations."

Balanced Scorecard Card:
  "Measures performance across four perspectives simultaneously: Financial, Customer,
   Internal Process, and Learning & Growth. Prevents over-focus on financial metrics
   alone. Each perspective gets a weight (e.g., Financial 40%, Customer 30%).
   Best for: BFSI, large enterprises, regulated industries."

Hybrid Card (Recommended badge):
  "Mix any of the above frameworks in one system. Most organizations use a hybrid:
   e.g., 70% KPI-based goals + 30% competency ratings. The system handles the
   blended final score automatically. Recommended for: mid-sized organizations
   that want both quantitative targets and behavioral evaluation."
```

#### STEP 4 — Cascading Mode
```
Section Header — "How Should Targets Flow Through Your Organization?"
  "Cascading is the process of connecting individual employee targets to company-level
   goals. It ensures that everyone's work is traceable back to the organization's
   strategy. Choose how targets will be initiated and linked in this system."

Top-Down Card:
  "The most common approach. The CEO or leadership team sets company targets first.
   Managers then break those down into team targets. Employees receive their targets
   from managers. No one can set targets until the level above them has finalized
   theirs. Ensures perfect strategic alignment but can feel top-heavy.
   Example: Company targets ₹100 Cr revenue → Sales VP targets ₹60 Cr → 
   Regional Manager targets ₹20 Cr → each rep commits to ₹5 Cr."

Bottom-Up Card:
  "Employees propose their own targets from day one. Managers review, link, and
   approve these proposals. Leadership sees what the team has collectively committed
   to. Promotes ownership and morale but requires managers to actively reconcile
   upward commitments. Best for mature teams or innovation-heavy roles."

Bidirectional Card (Recommended):
  "Both happen simultaneously. Leadership sets strategic direction (top-down track)
   while employees also propose targets (bottom-up track). The manager's job is
   to reconcile both: push down the strategic targets AND link/approve the bottom-up
   proposals. The system enforces that all approved targets are linked before the
   cycle goes active. Best balance of alignment and ownership."
```

#### STEP 5 — Rating Scale
```
Section Header — "How Will You Score Performance?"
  "The rating scale determines how a manager expresses how well an employee
   performed against their targets. Choose the scale that matches your existing
   culture or HR policy."

5-Point Scale:
  "The most widely used scale. Each level has a label and a numeric value (1-5).
   Default labels: Poor (1), Below Expectation (2), Meets Expectation (3),
   Exceeds Expectation (4), Exceptional (5). You can rename these labels in
   Step 7 (Terminology). The weighted average of all ratings becomes the
   employee's final score."

3-Point Scale:
  "Simpler scale for organizations that find 5-point scales create forced
   differentiation. Labels: Below (1), Meets (2), Above (3). Reduces rating
   bias and is faster for managers to complete."

Percentage Achievement:
  "Score is derived directly from how much of the target the employee achieved.
   100% = met target. 120% = exceeded by 20%. 80% = fell short. No manager
   subjectivity — the number speaks for itself. Common in sales organizations."

BARS (Behaviorally Anchored):
  "Each rating level is defined by a specific observable behavior, not just a label.
   Example for 'Communication' at Level 3: 'Explains technical concepts to
   non-technical stakeholders without jargon; presents data clearly in meetings.'
   Reduces subjectivity dramatically. More setup effort but highest consistency."

Custom Labels:
  "Define your own scale labels and numeric values. Useful if your HR policy
   already uses specific terms (e.g., 'Platinum / Gold / Silver / Bronze')
   or if you need a 10-point scale."

"For Goals vs. Competency" note:
  "In Hybrid frameworks, you can use different scales for goals (e.g., Percentage)
   and competencies (e.g., BARS). The system handles the blended final score."
```

#### STEP 6 — Weightage Split
```
Section Header — "How Much Should Goals vs. Competencies Count?"
  "When your framework includes both quantitative goals (KPIs, OKRs) and qualitative
   competency ratings, you need to decide their relative importance in the final score.
   This percentage applies to every employee's final performance score calculation."

Goals Weight Slider:
  "The percentage of the final score that comes from how well the employee met their
   measurable targets (KPIs, OKRs, Goals). A higher weight here means performance
   is driven primarily by hitting numbers. Typical range: 50-80%."

Competency Weight Slider:
  "The percentage of the final score that comes from behavioral and skill ratings.
   A higher weight here means HOW an employee works matters as much as WHAT they
   deliver. Typical range: 20-50%."

Sum = 100% note:
  "These two percentages must always add up to 100%. The slider enforces this
   automatically. Example: Goals 70% + Competency 30% = 100% final score."

OKR variant — Objectives vs Key Results weighting:
  "For OKR frameworks: Objectives are qualitative (rated by manager), Key Results
   are measurable. You can weight them differently — e.g., KRs 80% (what you
   delivered) + Objectives 20% (the quality of the goal itself)."

BSC variant — Four-quadrant weight:
  "For Balanced Scorecard: Assign a percentage to each of the four perspectives.
   Ensure all four sum to 100%. Example: Financial 40% + Customer 30% +
   Internal Process 20% + Learning 10%."
```

#### STEP 7 — Terminology
```
Section Header — "Customize the Language of Your System"
  "Different organizations use different words for the same concepts. Here you can
   rename any system term to match your company's existing vocabulary. All employees
   will see your custom labels everywhere in the system — forms, reports, emails."

KRA field:
  "Key Result Area — a broad domain of responsibility. If your company calls these
   'Focus Areas', 'Pillars', or 'Accountabilities', rename it here."

KPI field:
  "Key Performance Indicator — a specific measurable metric. Also called 'Metric',
   'Success Measure', or 'Indicator' in some organizations."

Objective field:
  "Used in OKR frameworks. The inspiring qualitative direction. Also called
   'Strategic Priority', 'Company Direction', or 'North Star'."

Key Result field:
  "Used in OKR frameworks. The measurable proof that the Objective was achieved.
   Also called 'Measurable Outcome', 'Success Metric', or 'Milestone'."

Goal field:
  "A plain individual target. NGOs often call these 'Programme Targets'. Sales
   organizations may call them 'Quotas'. Education calls them 'Learning Outcomes'."

Competency field:
  "A behavioral skill or capability. Also called 'Behavioral Indicator', 'Soft Skill',
   or 'Capability' depending on your HR system."

Weight field:
  "The importance percentage of a target in the employee's total scorecard.
   Some organizations call this 'Priority (%)', 'Importance', or 'Allocation'."

Performance Band field:
  "The label assigned to a final score range. NGOs use 'Impact Band'. Some orgs
   use 'Rating Category'. The default bands are Exceptional / Exceeds / Meets /
   Below / Poor — rename them to match your HR policy."
```

#### STEP 8 — Grades / Levels
```
Section Header — "Define Your Organization's Job Levels"
  "Grades represent seniority levels in your organization (e.g., L1 = Junior,
   L5 = Director). The system uses grades to determine who can approve whose
   targets and to filter the performance library by applicable grade."

Grade Code field:
  "A short alphanumeric code for the grade. Examples: L1, M2, VP, IC3, Band-A.
   Keep it short — it appears in org tree views and approval chains."

Grade Label field:
  "The full human-readable title for this grade. Examples: 'Junior Developer',
   'Senior Manager', 'Vice President', 'Individual Contributor Level 3'."

Level (number) field:
  "A numeric ranking where 1 = most junior and higher numbers = more senior.
   Used by the system to enforce that higher-level employees set targets first
   in top-down cascade. Two grades can share the same level number (peers)."

Can Manage toggle:
  "Mark 'Yes' if employees at this grade can have direct reportees. If 'No',
   employees at this grade are individual contributors with no team to manage.
   This controls which approval workflows are available to them."

Reorder note:
  "Drag rows to set the display order in org tree views. This does not affect
   the Level number — only visual presentation."
```

#### STEP 9 — Departments
```
Section Header — "Build Your Organization Structure"
  "Departments determine which team an employee belongs to and how performance
   data is grouped in reports (e.g., 'Engineering vs. Sales completion rate').
   Sub-departments allow you to model divisions, regions, or functions within
   a department."

Add Department button:
  "Click to add a top-level department (e.g., Engineering, Sales, Operations).
   The company name is always the root node."

Add Sub-Department:
  "Click the + next to any department to add a child department under it.
   Example: under 'Sales', add 'Inside Sales' and 'Field Sales'."

Drag to reorder:
  "Drag any department node to change its display order. This affects how
   departments appear in dropdown lists and reports — it does not affect
   the actual reporting structure (that comes from employees' 'Reports To' field)."

Department code field (optional):
  "A short code for the department used in reports and exports. Example:
   'ENG', 'SAL', 'OPS'. Leave blank if not used in your organization."
```

#### STEP 10 — Employees
```
Section Header — "Add Your Team"
  "Employee records drive everything: cascade chains, approval routing, target
   assignment, and reporting. The 'Reports To' field is the single most important
   setting — it determines who approves whose targets and how goals cascade."

Manual Entry table:
  "Add employees one at a time. Best for small teams (under 20 people)."

Employee Code field:
  "Your HR system's unique employee ID (e.g., EMP001, HR-045). Optional but
   useful for cross-referencing with your payroll or HRMS. Must be unique within
   the organization."

Reports To field:
  "Select the employee's direct manager. This field drives the entire cascade
   chain. If set incorrectly, targets will flow to the wrong approver. For the
   CEO / top-level person, leave this blank."

CSV Upload button:
  "Upload a CSV file with multiple employees at once. Download the template first —
   it shows the required columns and an example row. The system validates each row
   and shows errors before importing (e.g., missing email, unknown department name)."

Org Tree Preview:
  "After uploading, review the org tree to verify the reporting structure looks
   correct. Incorrect 'Reports To' assignments are the most common data error —
   catch them here before the cycle starts."
```

#### STEP 11 — Create First Review Cycle
```
Section Header — "Set Up Your First Performance Cycle"
  "A Review Cycle is the time period during which performance targets are set,
   tracked, and evaluated. Most organizations run one annual cycle, though
   quarterly check-ins are becoming common."

Cycle Name field:
  "A descriptive name for this cycle. Default suggestion: 'FY 2025-26 Annual'.
   This name appears in all employee dashboards, emails, and reports."

Cycle Type dropdown:
  "How often this cycle repeats. Annual = once per financial year. Half-Yearly =
   two appraisal rounds per year. Quarterly = four rounds. Monthly = rolling
   monthly targets (common in sales). Custom = you define the period dates."

Period Start / End dates:
  "The actual performance period — the months during which employees are working
   toward their targets. For an Indian FY, this is typically April 1 to March 31."

Goal-Setting Window (Open / Close dates):
  "The window during which employees can enter and submit their targets. Opens
   before or at the period start. Close date is the deadline — after this, no
   new targets can be added."

Review Window (Open / Close dates):
  "The window during which self-appraisals and manager ratings are entered.
   Opens after the performance period ends. Employees first rate themselves,
   then managers review and submit their ratings."

Cascade Mode Override:
  "By default, this cycle uses the organization's cascade mode (set in Step 4).
   Override here if this specific cycle should work differently — e.g., your
   normal mode is bidirectional but this first cycle should be top-down for
   simplicity."

Launch Cycle button:
  "Creates the cycle in 'goal_setting' status, completes the wizard, and takes
   you to the main dashboard. Employees can immediately begin entering targets."
```

---

### 19.3 Help Content — Dashboard

#### Employee Dashboard
```
Page Header — "Your Dashboard"
  "This is your personal performance home. It shows your progress in the current
   active cycle — how many targets you've set, their combined weight, and your
   preliminary score (once ratings are complete)."

My Targets Summary card:
  "A quick count of your targets in this cycle: how many are approved, submitted,
   in draft, or rejected. All targets must be approved before the review phase begins."

Weight Usage meter:
  "Shows what percentage of your 100% weight allocation you've used across all your
   targets. It must reach exactly 100% before you can submit. Each target carries a
   weight — the system ensures they always add up to 100%."

Score Gauge (post-review):
  "Your weighted performance score for this cycle, calculated after your manager
   completes ratings. Formula: weighted average of goal ratings × goals% + weighted
   average of competency ratings × competency%. Appears after manager rates you."

Performance Band badge:
  "The qualitative label corresponding to your score range. Defined by HR during
   setup. Example: score 4.2 out of 5 → 'Exceeds Expectation'. The band determines
   increment and promotion eligibility in most organizations."

Cycle Status stepper:
  "Shows which phase the current cycle is in: Goal Setting → Active → Review →
   Calibration → Closed. You can only take actions relevant to the current phase.
   During 'Goal Setting': add/submit targets. During 'Review': self-rate your targets."
```

#### Manager Dashboard
```
Team Completion ring:
  "Percentage of your direct reportees who have had their targets fully approved.
   A reportee is 'complete' when all their targets are in Approved status and
   weights sum to 100%. HR tracks this to ensure goal-setting is on schedule."

Pending Approvals count:
  "Number of targets submitted by your team that are waiting for your approval.
   Click to go directly to the approval queue. You cannot close the goal-setting
   phase until all your reportees' targets are approved."

Coverage Meter:
  "Shows whether your team's collective planned targets add up to cover what you
   yourself have committed to. Example: You committed ₹5 Cr revenue. Your 3 reps
   have committed ₹2 Cr + ₹2 Cr + ₹0.5 Cr = ₹4.5 Cr = 90% coverage. The gap
   must be assigned before the cycle goes active."

Unlinked Proposals count (bidirectional/bottom-up):
  "Number of bottom-up target proposals from your team that you haven't yet linked
   to one of your own targets. Unlinked proposals cannot be approved. The cycle
   cannot go active until all proposals are linked."
```

#### HR Dashboard
```
Org-Wide Completion card:
  "Percentage of all employees across the organization who have approved targets.
   Target: 100% before goal-setting window closes. Drill down by department to
   identify which managers are lagging."

Cascade Health card:
  "Measures how well individual targets are connected to company strategy. A target
   is 'linked' if it has a parent_target_id connecting it up the hierarchy.
   Green: >95% linked. Yellow: 80-95%. Red: <80%."

Over-Plan Targets count:
  "Number of targets where an employee has committed to more than their manager's
   target. Not a problem by itself — over-planning shows ambition. But requires
   manager approval and should be monitored to prevent aggregate over-commitment."

Unlinked Proposals count:
  "In bottom-up or bidirectional cycles: number of employee-proposed targets that
   managers haven't yet linked to their own targets. Blocks cycle advancement."
```

---

### 19.4 Help Content — Target Entry (My Targets Page)

#### Page Layout
```
Page Header — "My Targets"
  "This is where you define what you will deliver this cycle. Add targets for each
   area of your work, set their weight (importance), and submit for your manager's
   approval. The right panel shows your manager's targets so you can align yours."

Left Panel — "Your Targets":
  "Your list of performance targets for this cycle. Each target must have a title,
   planned value, unit, and weight. All weights must add up to exactly 100% before
   you can submit."

Right Panel — "Your Hierarchy Context":
  "Shows your manager's (and their manager's) approved targets for this cycle. Use
   this panel to understand what your team is trying to achieve and to select the
   correct parent target when you add a new target. Click any target here to link
   your new target to it."
```

#### Target Form Fields
```
Field: Framework Type dropdown
  "Select the type of target you're adding. Options depend on your organization's
   framework. In a KRA/KPI framework: choose KRA for a broad responsibility area
   or KPI for a specific metric under that KRA. In OKR: choose Objective or Key
   Result. In Hybrid: you can mix types."

Field: Title
  "A clear, action-oriented description of what you will achieve. Good examples:
   'Deliver 4 product features with < 1% post-release bugs', 'Achieve 90% customer
   satisfaction score', 'Complete AWS Solutions Architect certification'. Avoid vague
   titles like 'Do my best' or 'Support team'."

Field: Description (optional)
  "Additional context about this target — methodology, key assumptions, or
   dependencies. Managers read this during approval. For bottom-up proposals,
   explain how this target contributes to the team's goals."

Field: Parent Target
  "Link your target to one of your manager's targets. This is how the cascade chain
   is built — your target's outcome contributes to your manager's target. Required
   for top-down targets before submission. Click a target in the right panel to
   auto-fill this field."

Field: Unit
  "The unit of measurement for your planned and actual values. Examples: % (percentage),
   INR (Indian Rupees), count (number of items), days, score (e.g., NPS or CSAT),
   text (for qualitative targets with no numeric measure)."

Field: Measurement Type
  "How success is measured:
   Higher is Better — more is good (e.g., revenue, customer count, NPS score)
   Lower is Better — less is good (e.g., defect rate, customer complaints, downtime)
   Target Exact — hitting a precise number is the goal (e.g., specific headcount)
   Qualitative — no numeric measure; manager rates the quality of the outcome"

Field: Planned Target
  "The number you commit to achieve by the end of the cycle. This is your promise.
   If your planned value is higher than your manager's planned target for the linked
   parent, the system will flag it as 'over-planned' and ask for a justification.
   Must be greater than zero for numeric targets."

Field: Stretch Target (optional)
  "An aspirational target above your planned commitment. If you exceed your planned
   target but fall short of stretch, the dashboard shows 'On the way to stretch'.
   Stretch targets are not used in score calculation — only planned vs. actual matters.
   Must be higher than your planned target."

Field: Weight (%)
  "How important is this target relative to your other targets? The weights of all
   your targets must add up to exactly 100%. A target with 30% weight has three
   times more impact on your final score than a 10% target. Minimum weight is
   typically 5%; no single target should exceed 50% (configurable by HR)."

Field: Over-Plan Justification (appears automatically)
  "Your planned target exceeds your manager's planned target for the linked parent.
   This is allowed — it means you're committing to more than your share. But you
   must explain why: additional capacity, a new initiative, a stretch goal you've
   taken on. Managers will see this note during approval."
```

#### Weight Meter
```
WeightMeter gauge:
  "The circular gauge shows how much of your 100% weight allocation you've used
   across all your targets. As you add targets and set their weights, this updates
   live. You cannot submit until the gauge reaches exactly 100%. If it shows 85%,
   you have 15% unallocated — distribute it among your targets."
```

#### Target Status Badges
```
DRAFT:
  "You've saved this target but haven't submitted it yet. Only you can see and
   edit it. Your manager cannot approve it until you submit."

SUBMITTED:
  "You've submitted this target to your manager for approval. You can no longer
   edit it unless your manager rejects it back to you. Your manager will receive
   a notification."

PROPOSED (Bottom-Up):
  "You've proposed this target. Your manager needs to review it, link it to one
   of their own targets, and then approve or reject it. Status changes to LINKED
   once the manager connects it to a parent target."

LINKED (Bottom-Up):
  "Your manager has linked your proposal to their target. It's now pending approval.
   This is a positive sign — your manager has acknowledged the proposal is relevant."

APPROVED:
  "Your manager approved this target. It is now locked — no further changes during
   this cycle unless HR unlocks it. You'll rate yourself against this target during
   the review phase."

REJECTED:
  "Your manager rejected this target with a note explaining why. Review the rejection
   note, revise the target, and resubmit. Common reasons: unclear measurement,
   not aligned to team goals, or duplicate of another target."

ACTIVE:
  "The cycle has moved to the active (performance) phase. Targets are frozen —
   no edits allowed. You are now working toward these targets."

LOCKED:
  "The review phase has opened. You can now enter actual values and self-ratings,
   but you cannot change the target itself."
```

---

### 19.5 Help Content — Manager Approval Workflow

#### Team Targets Page
```
Page Header — "Team Targets"
  "Review and approve your team's performance targets. You must approve all submitted
   targets before the goal-setting phase can close. You can also reject targets with
   feedback for the employee to revise."

Filter Tabs:
  "All: See every target from all your direct reportees.
   Submitted: Targets waiting for your approval — action required here.
   Proposed: Bottom-up proposals that need to be linked to your targets first.
   Approved: Already approved targets — read-only reference.
   Rejected: Targets you've sent back; employee may resubmit after revision."

Employee grouping:
  "Targets are grouped by employee. The header row for each employee shows their
   completion percentage (how much of their 100% weight is in approved targets).
   An employee is fully complete when 100% weight is approved."
```

#### Approval Panel (Slide-In)
```
Panel Header:
  "Review this target before approving. Check that it is specific, measurable,
   aligned to your own targets, and realistic. An approved target becomes a binding
   commitment for the employee."

Parent Target Context section:
  "Shows which of your targets this employee's target is linked to. Verify the
   linkage makes sense — the employee's planned target should contribute to yours.
   If the wrong parent is selected, reject and ask the employee to re-link."

Over-Plan section (appears when is_over_planned = 1):
  "This employee is committing to MORE than their proportional share of your target.
   Their planned value is {X}% above yours. Read their justification note carefully.
   If you agree the extra effort is realistic, tick the approval checkbox. If you
   doubt their capacity, reject with feedback."

Over-Plan Approval checkbox:
  "By ticking this, you explicitly acknowledge and approve the employee's over-
   commitment. This is tracked in the audit log. Approving without reading the
   justification is a common mistake — it can lead to inflated expectations."

Link to Parent button (Bottom-Up):
  "This is a bottom-up proposal. Before you can approve it, you must link it to
   one of your own targets. Select the parent from the dropdown. This establishes
   the cascade chain and lets the system check coverage."

Approve button:
  "Approve this target. The employee is notified. The target moves to APPROVED
   status and counts toward their 100% weight total. You must have your own
   approved targets before you can approve your team's."

Reject button + note field:
  "Reject this target and send it back to the employee for revision. You must
   enter a reason — the employee will see it. Be specific: 'Planned target of 150
   units seems unrealistic given Q3 capacity constraints. Please revise to 120 or
   provide more justification.'"
```

#### Coverage Card
```
Coverage Meter:
  "Shows the total planned value your team has committed, compared to your own
   planned target. Example: you committed ₹10 Cr; your team collectively committed
   ₹9.5 Cr = 95% coverage. The gap (₹0.5 Cr) needs to be assigned to someone or
   explained to your manager. 100%+ coverage is fine — it means your team is
   over-committed (which may trigger an org-level over-plan warning)."
```

---

### 19.6 Help Content — Validation Summary

```
Validation Summary modal:
  "Before submitting all your targets, the system checks 13 validation rules.
   Errors (red) block submission — you must fix them first. Warnings (yellow)
   can be acknowledged and submitted through. Green rows are passing checks."

Error V1 — Weight Sum:
  "All your active targets must add up to exactly 100% in weight. Check the weight
   field on each target. Use the Weight Meter to track the running total."

Error V4 — Parent Linkage Required:
  "Every target must be linked to a parent target in the hierarchy. Open the target,
   click the hierarchy panel, and select a parent target."

Error V5 — Manager Targets Not Approved:
  "Your manager hasn't had their own targets approved yet. In top-down cascade,
   you can't submit until the level above you has finalized theirs. Contact your
   manager or wait for the notification."

Error V6 — Over-Plan Note Missing:
  "One or more of your targets exceeds your manager's planned value. This is allowed
   but requires a written justification. Open the target and fill in the
   'Over-Plan Justification' field."

Error V11 — Mandatory Target Missing:
  "HR has marked certain KRAs/KPIs as mandatory for your grade. These must appear
   in your targets. Click 'Add This Target' to quickly add it from the library."

Warning V12 — Aggregate Over-Plan:
  "The combined planned values of your team exceed the company target by more than
   the allowed buffer (typically 15%). This is visible to HR. Not a blocker,
   but managers may be asked to reconcile."
```

---

### 19.7 Help Content — Appraisal Phase

#### Self-Appraisal Page
```
Page Header — "Self-Appraisal"
  "The review phase is your chance to record what you actually achieved and rate
   your own performance. Be honest — inflated self-ratings that don't match actuals
   create credibility issues in the manager review. Your manager sees both your
   actual value and your self-rating."

Field: Actual Achievement value
  "Enter the actual number you achieved by the end of the cycle. Examples:
   If your target was '₹2 Cr revenue' and you delivered ₹2.3 Cr, enter 2.3.
   For qualitative targets (unit = 'text'), leave this blank and use your comment."

Field: Self-Rating
  "Rate your own performance on this target using the organization's scale.
   Be realistic: 'Meets Expectation' means you delivered what was committed.
   'Exceeds Expectation' should be backed by the actual value exceeding your
   planned target."

Field: Comments
  "Explain the context behind your numbers. What went well? What blocked you?
   For over-achievements: what did you do differently? For shortfalls: external
   factors, scope changes, or learnings. Managers weigh comments heavily."
```

#### Manager Appraisal Page
```
Page Header — "Rate Your Team"
  "Review each employee's self-assessment and enter your ratings. Your rating
   is the final rating (unless changed during calibration). The system computes
   a weighted final score automatically based on all rated targets."

Employee Self-Rating display:
  "What the employee rated themselves. Use this as a starting point — you may
   agree, rate higher, or rate lower based on your direct observation. If you
   differ significantly, a comment explaining why is best practice."

Field: Manager Rating
  "Your rating for this specific target. This becomes the 'final_rating' used
   in score computation. If the employee over-achieved vs. their plan, consider
   rating them higher than 'Meets Expectation' even if their self-rating was
   conservative."

Field: Manager Comment
  "Your qualitative feedback for this target. Be specific and actionable:
   'Delivered the integration 2 weeks ahead of schedule, enabling the sales
   team to demo to 3 enterprise clients. Excellent initiative.' Avoid generic
   comments like 'Good work'."
```

#### Performance Summary Card
```
Score Gauge:
  "The final weighted performance score for this employee/yourself this cycle.
   Computed as: (weighted avg of goal ratings × goals%) + (weighted avg of
   competency ratings × competency%). Range matches your rating scale (e.g., 1-5)."

Performance Band badge:
  "The qualitative category corresponding to the score. Determined by the
   band ranges HR configured during setup. Bands typically determine salary
   increment eligibility, promotion consideration, and PIP status."

Goals Score vs. Competency Score breakdown:
  "Shows the two components of the final score separately. Useful to see if
   an employee excels at delivering numbers (goals) but needs to develop
   behaviors (competency), or vice versa."

PIP Indicator:
  "PIP = Performance Improvement Plan. Automatically flagged when the final
   performance band falls in the lowest category (e.g., 'Poor' or 'Needs
   Improvement'). HR is notified; the employee will be enrolled in a PIP
   process per your HR policy."
```

---

### 19.8 Help Content — HR Reports

```
Completion Rate Report:
  "Percentage of employees who have fully approved targets (weight = 100% approved).
   Grouped by department and manager. Use this to identify which managers are
   behind on the goal-setting deadline and follow up with them."

Rating Distribution Chart:
  "Bar chart showing how manager ratings are distributed across the organization
   (or by department). A healthy distribution follows a bell curve. If everyone
   is rated 'Exceptional', ratings may be inflated. If a manager has everyone at
   'Below Expectation', investigate potential bias."

Performance Band Distribution chart:
  "Pie chart showing what percentage of employees fall into each performance band
   for this cycle. Used during calibration to ensure the distribution matches
   HR policy (e.g., 'No more than 15% can be Exceptional')."

Over-Plan Report table:
  "Every target where is_over_planned = 1, showing the employee, the target,
   the over-plan ratio, the justification note, and whether the manager approved
   the over-commitment. Use this to spot patterns (e.g., a department consistently
   over-commits)."

Cascade Health Report:
  "By manager: shows what percentage of their team's targets are properly linked
   to parent targets, and the coverage gap (how much of the manager's committed
   target is covered by their team's commitments). Green = well-linked. Red = gaps."

Calibration View:
  "HR can adjust an employee's final score after the manager rating phase.
   Used when there is evidence of rating bias, cross-department inconsistency,
   or extenuating circumstances. Every calibration requires a written reason
   and is logged in the audit trail."
```

---

### 19.9 Implementation Notes for InfoIcon

```
Placement rules:
  1. Immediately after the label text, inline: <label>Field Name <InfoIcon .../></label>
  2. For section headers: after the heading text, slightly smaller size
  3. For card headers: top-right corner of the card
  4. For table column headers: after the header text
  5. For buttons: do NOT put ⓘ on action buttons; add a tooltip on hover instead

Content writing rules:
  1. First sentence: what is this field? (the WHAT)
  2. Second sentence: why does it matter / what business rule applies? (the WHY)
  3. Third sentence (optional): example or how to fill it correctly (the HOW)
  4. Keep total content under 80 words per tooltip
  5. Use plain language — no jargon unless explaining the jargon itself

Don't add InfoIcon to:
  - Navigation menu items (too cluttered)
  - Obvious UI chrome (save button, cancel button, search box)
  - Table rows of data (only column headers)

Access helpContent.js centrally:
  import { HELP } from '@/utils/helpContent'
  <InfoIcon title="Planned Target" content={HELP.target.planned} />
  
  This ensures all help text is in one place, easy to update, and consistent.
```

---

*PMS POC Specifications — Version 2.0 — Complete and ready for Claude Code*
*Build sequence: Prompts 1 → 10, one at a time. Test each before proceeding.*
