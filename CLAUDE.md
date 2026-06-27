# Performance Management System (PMS) — Claude Code Guide

**Tagline:** "Performance management for humans, not HR consultants"
Must appear on the login page and home page header.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18 + Vite + shadcn/ui + Tailwind CSS | |
| State | Zustand 4 | authStore, cycleStore |
| Routing | React Router 6 | |
| Charts | Recharts 2 | |
| Backend | Node.js + Express 4 | Port 3001 |
| Database | **sql.js** (SQLite via WebAssembly) | NOT better-sqlite3 or sqlite3 — native addons fail on Windows |
| Auth | JWT + bcrypt | |
| Dev | concurrently + nodemon | `./dev.ps1` starts both servers |

Client runs on port 5173. Server on 3001.

---

## Project Structure

```
pms/
├── client/src/
│   ├── components/{wizard,targets,hierarchy,appraisal,shared,layout}/
│   ├── pages/          # Route-level pages (PascalCase .jsx)
│   ├── store/          # Zustand stores (camelCase .js)
│   ├── hooks/          # useCascade, useValidation, useHierarchy
│   ├── api/            # Axios modules (camelCase .js)
│   └── utils/
│       ├── frameworkConfig.js    # Industry preset registry
│       ├── validation.js         # Client-side validation helpers
│       ├── cascadeUtils.js       # Cascade mode helpers
│       ├── helpContent.js        # All InfoIcon tooltip text (HELP.wizard, HELP.target, ...)
│       └── constants.js          # FRAMEWORK_TYPES, CASCADE_MODES, TARGET_STATUSES, INDUSTRIES
├── server/
│   ├── routes/{auth,org,wizard,employees,cycles,targets,appraisal,reports}.js
│   ├── services/{cascadeService,validationService,scoringService,hierarchyService}.js
│   ├── db/{database.js, migrations/, seeds/}
│   └── middleware/{auth.js, roleGuard.js}
├── specifications.md   # Full technical spec — source of truth for schema and API
├── steps.md            # Dev log and TODOs
└── CLAUDE.md           # This file
```

---

## Business Rules

### 1. Performance Frameworks

Stored in `organizations.framework`:

| Value | Framework | Best For |
|---|---|---|
| `okr` | Objectives & Key Results | IT, Startups |
| `kra_kpi` | KRA + KPI | Manufacturing, BFSI, Retail |
| `goals` | Simple targets | Small teams, Education, NGO |
| `competency` | Skills/behavior only | Healthcare, HR-heavy |
| `balanced_scorecard` | 4-perspective BSC | BFSI, Large enterprises |
| `hybrid` | Mix of above (Recommended) | Most mid-size orgs |

`org.settings.active_types` controls which item types are enabled:
`okr_objective`, `okr_kr`, `kra`, `kpi`, `goal`, `competency`, `bsc_metric`, `custom_metric`

**Interdependency rules (enforce in Org Settings UI):**
- `okr_objective` and `okr_kr` always go together — selecting one should auto-select the other
- `kra` and `kpi` are typically paired (KPI lives under a KRA parent)
- `bsc_metric` requires BSC framework
- If only `competency` is active, hide/disable the Weightage and Goal Rating Scale tabs

**Scoring split:**
- Goal targets = all `framework_type` except `competency`
- Competency targets = `framework_type = 'competency'`
- `final_score = (goal_score × goals_pct) + (comp_score × comp_pct)`

### 2. Industry Presets

| Industry | Framework | Cascade | Active Types | Over-plan Max |
|---|---|---|---|---|
| IT/Software | okr | bidirectional | okr_objective, okr_kr, competency | 1.20 |
| Manufacturing | kra_kpi | top_down | kra, kpi | 1.10 |
| Healthcare | hybrid | top_down | goal, competency (50/50) | 1.15 |
| BFSI | balanced_scorecard | top_down | bsc_metric, kpi, competency | 1.15 |
| Retail/Sales | goals | top_down | goal, kpi | 1.30 |
| Education | goals | top_down | goal, competency (60/40) | 1.15 |
| Hospitality | kra_kpi | bidirectional | kra, kpi, competency | 1.15 |
| Logistics | kra_kpi | top_down | kra, kpi | 1.15 |
| NGO | goals | bottom_up | goal, competency | 1.15 |

### 3. Cascading Logic

Three modes in `organizations.cascade_mode` (overridable per cycle):

**Top-Down** (most common)
- Leadership sets targets FIRST; each level below can only enter after the level above approves
- `parent_target_id` REQUIRED at creation time
- Employee cannot submit until manager's targets are 'approved' (enforces RULE V5)

**Bottom-Up**
- All employees set targets from Day 1; no waiting
- `cascade_direction = 'bottom_up'`, status = 'proposed'
- `parent_target_id` NOT required at creation; manager sets it during approval (linking)
- Manager aggregates team proposals to build their own targets upward

**Bidirectional** (recommended for mature orgs)
- Both tracks run simultaneously
- Manager reconciles: pushes top-down targets down AND links/approves bottom-up proposals
- `parent_target_id` not required at creation but REQUIRED before approval
- Cycle CANNOT advance to 'active' until ALL proposals are linked (RULE V13)

**Critical invariant:** `employees.reporting_to` is the single field that drives the ENTIRE cascade chain. Every cascade query is a recursive CTE from this field.

**An employee in bidirectional mode can have BOTH:**
- Assigned targets (`cascade_direction = 'top_down'`)
- Self-proposed targets (`cascade_direction = 'bottom_up'`)
- Both together must have `SUM(weight) = 100%`

### 4. Validation Rules (V1–V13)

All run server-side in `server/services/validationService.js`. Client shows live feedback but server is the final gate.

| Rule | Severity | When | Rule |
|---|---|---|---|
| V1 | ERROR | On submit-all | `SUM(weight)` for employee's active targets in cycle must = 100% |
| V2 | WARNING | On save | Single target weight < `min_target_weight` (default 5%) |
| V3 | WARNING | On save | Single target weight > `max_target_weight` (default 50%) |
| V4 | ERROR | On submit/approval | `parent_target_id` must be set |
| V5 | ERROR | On submit | Manager's targets must be 'approved' before employee can submit (top-down) |
| V6 | ERROR | On submit | `is_over_planned=1` requires `over_plan_note` (cannot submit blank) |
| V7 | ERROR | On save | `stretch_target` must be > `planned_target` if set |
| V8 | ERROR | On save | `planned_target` must be > 0 for numeric targets |
| V9 | ERROR | On manager approve | Manager must have their OWN approved targets before approving reportees' |
| V10 | WARNING | On add | Duplicate target detected (same employee, same cycle) |
| V11 | ERROR | On submit-all | Mandatory library items (`is_mandatory=1`) must be present |
| V12 | WARNING | HR view | `SUM(children.planned)` > `parent.planned × overplan_max_multiplier` |
| V13 | ERROR | Before cycle → 'active' | All bottom-up proposals must be linked; blocks cycle advancement |

**Over-planning logic:**
- Over-plan = `planned_target > parent.planned_target`
- System auto-sets `is_over_planned = 1` and `over_plan_ratio = planned/parent.planned`
- `over_plan_note` is REQUIRED to submit (V6)
- Manager must explicitly tick `over_plan_approved` checkbox (audit-logged)
- V12 aggregate warning: `SUM(siblings.planned) > parent.planned × overplan_max_multiplier`
- Stretch target is purely aspirational; NOT used in over-plan calculation; must be > planned (V7)

### 5. Scoring Formula

```
goal_targets       = approved targets WHERE framework_type != 'competency'
competency_targets = approved targets WHERE framework_type  = 'competency'

goal_score  = SUM(final_rating × weight) / SUM(weight)   [goal_targets]
comp_score  = SUM(final_rating × weight) / SUM(weight)   [competency_targets]

final_score = (goal_score × goals_percent/100) + (comp_score × comp_percent/100)

band = first performance_band WHERE final_score >= band.min AND final_score <= band.max
is_pip_triggered = band.label in lowest band(s)
```

Default performance bands (configurable per org):

| Band | Min | Max | Color |
|---|---|---|---|
| Exceptional | 4.5 | 5.0 | #16a34a |
| Exceeds | 3.5 | 4.49 | #2563eb |
| Meets Expectation | 2.5 | 3.49 | #d97706 |
| Below Expectation | 1.5 | 2.49 | #dc2626 |
| Poor | 0 | 1.49 | #7f1d1d |

### 6. Target Status State Machine

```
DRAFT → SUBMITTED → APPROVED → ACTIVE → LOCKED
      ↘ PROPOSED  → LINKED → APPROVED   (bottom-up path)
      ← REJECTED  (from SUBMITTED or PROPOSED; employee revises + resubmits)
```

| Status | Who Can Edit | Description |
|---|---|---|
| DRAFT | Employee | Saved, not yet submitted; invisible to manager |
| SUBMITTED | None | Awaiting manager approval |
| PROPOSED | None | Bottom-up: awaiting manager to link + approve |
| LINKED | None | Manager linked to parent; pending approval |
| APPROVED | None (HR can unlock) | Frozen for cycle |
| REJECTED | Employee | Sent back; employee revises and resubmits |
| ACTIVE | None | Cycle in performance phase; no edits |
| LOCKED | Employee (actual + rating only) | Review phase open |

Only `draft` and `rejected` targets can be deleted.

### 7. Cycle Status State Machine (strict order, cannot skip)

```
draft → goal_setting → active → review → calibration → closed
```

Each advance requires a confirmation modal.
Cycle CANNOT go to `active` until RULE V13 passes (all proposals linked).

### 8. Roles & Who Can Enter What

System roles (`employees.role`): `admin` | `hr` | `manager` | `employee`
- `manager` is auto-derived when employee has reportees, but can also be explicitly set

Hierarchy levels and typical entry rights (configurable in Org Settings, with these as defaults):

| Level | Typical Role | Can Define |
|---|---|---|
| L1 | CEO/MD | Company OKR Objectives |
| L2 | VP/Director | Dept OKRs or Key Results against company OKRs |
| L3 | HOD/Dept Head | Key Results, KPIs, Dept-level KRAs |
| L4–L9 | Managers/Employees | KPIs, Goals, Competencies |

**Manager approval constraints:**
- Manager CANNOT approve reportees' targets until their OWN targets are approved (V9)
- When approving, manager sees: target details, parent context, over-plan ratio + employee justification
- Over-plan approval requires explicit checkbox tick (tracked in audit log)

### 9. Org Settings JSON Schema

Key fields in `organizations.settings` (full schema in `specifications.md` §5):

```json
{
  "framework": "hybrid",
  "cascade_mode": "bidirectional",
  "industry": "it",
  "terminology": { "kra": "Key Result Area", "kpi": "KPI", ... },
  "active_types": ["kra", "kpi", "competency"],
  "rating_scale": {
    "goals":      { "type": "5_point", "labels": [...], "values": [1,2,3,4,5] },
    "competency": { "type": "5_point", ... }
  },
  "weightage": { "goals_percent": 70, "competency_percent": 30 },
  "performance_bands": [{ "label": "Exceptional", "min": 4.5, "max": 5.0, "color": "..." }],
  "target_rules": {
    "min_target_weight": 5,
    "max_target_weight": 50,
    "overplan_allowed": true,
    "overplan_max_multiplier": 1.15,
    "require_parent_linkage": true,
    "allow_self_propose": true,
    "mandatory_kras": []
  },
  "bsc_perspectives": ["Financial", "Customer", "Internal Process", "Learning & Growth"],
  "cycle_defaults": { "type": "annual", "goal_setting_days": 30, "review_days": 21 }
}
```

Terminology is fully customizable per org. All UI labels must read from `org.settings.terminology`.

### 10. Setup Wizard (11 Steps — blocks all other pages until complete)

1. Company Info | 2. Industry | 3. Framework | 4. Cascade Mode | 5. Rating Scale
6. Weightage Split | 7. Terminology | 8. Grades/Levels | 9. Departments | 10. Employees | 11. First Cycle

- `wizard_completed = 0` → ALL routes redirect to `/wizard`
- Progress persists in `wizard_progress` table (resume across sessions)
- On complete: `wizard_completed = 1`, redirect to `/dashboard`

### 11. Help Content System (InfoIcon — Required on Every Page)

Every label, section header, and form field must have an **ⓘ** info icon.
All help strings live in `client/src/utils/helpContent.js` as `export const HELP = { wizard, target, cycle, ... }`.

```jsx
<label>Planned Target <InfoIcon title="Planned Target" content={HELP.target.planned} /></label>
```

**Content format:** What it is (1 sentence) + Why / business rule (1 sentence) + How to fill (optional).
**Max 80 words per tooltip.** Do NOT add to: nav items, save/cancel buttons, table data rows.

### 12. Critical Database Rules

- `employees.reporting_to` → drives entire cascade; incorrect value = wrong approver routing
- `targets.parent_target_id` → must be set before approval; NULL = unlinked = blocks cycle
- `targets.weight` → SUM per employee per cycle per non-rejected target must = 100% (V1)
- `target_audit_log` → immutable; every state change logged with `old_snapshot` / `new_snapshot`
- `performance_summary` → computed after manager rating; stores `final_score`, `performance_band`, `is_pip_triggered`

---

## Cascading is a Cross-Cutting Concern

**When adding any new feature** (OKR input, KPI templates, 9-box, BSC, review cycles, dashboards):
1. Check if `cascade_mode` is enabled
2. Implement `parent_target_id` linkage at each step
3. Ensure the hierarchy chain panel shows correct context
4. Validate coverage (children's sum vs parent's planned)

Missing cascade linkage in a new feature breaks the entire chain integrity.

---

## Pending / Planned Features (from steps.md)

High priority items not yet implemented:
- **9-box grid**: Check co-existence with BSC; lay foundation in system when either is enabled
- **Org Settings improvements**: Active types mutual exclusivity; tabs disable when not applicable; Framework vs Active Types deduplication
- **Role-based entry config**: Who (L1/L2/HOD/Manager/Employee) can define what type (OKR/KR/KPI/Goal) — configurable in Org Settings with industry-correct defaults
- **Missed cycle restriction**: If employee missed previous cycle entry, system blocks current cycle entry until backfill
- **Demo login page**: Select demo org type (IT/Manufacturing/Pharma) and employee without credentials
- **50-employee sample data**: Full L1→L9 hierarchy across departments for POC demo
- **OKR + KPI co-existence**: How Key Results and KPIs work in the same cycle; combined scoring
- **Target revision history**: Mid-year revisions with approval workflow and history log
- **Cumulative ratings**: Show running avg (April–May) when entering June monthly review
- **Continuous feedback module**: Positive/negative feedback; visible to employees and managers during review
- **Industry templates**: Ready-to-use OKR/KR/KPI/Competency templates selectable by employees
- **AI insights**: Based on accumulated comments and feedback (later)
