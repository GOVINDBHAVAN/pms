# PMS — Core Business Logic & Domain Rules
## Authoritative Reference for All Development Decisions
### This file defines WHAT the system must do and WHY. Not HOW.
### Claude Code must read and follow these rules before writing any feature.

---

## RULE ZERO — The Prime Directive

Every feature, validation, UI decision, and data model choice must be
traceable back to one of the rules in this file. If a rule here conflicts
with a technical convenience, the rule here wins. If a use case arises
that is not covered here, the nearest applicable rule governs until this
file is updated.

---

## PART 1 — THE PERFORMANCE MANAGEMENT UNIVERSE

### 1.1 The Five Building Blocks

There are exactly five types of performance items in this system.
Everything in the application is one of these five things or a
relationship between them. Nothing else exists.

```
BUILDING BLOCK    WHAT IT IS                        TIME-BOUND?   MEASURABLE?
────────────────────────────────────────────────────────────────────────────
KRA               A named area of responsibility.   NO            NO
                  A folder. A bucket. A domain.
                  "Revenue Growth", "Quality",
                  "Customer Success".

KPI               A measurement instrument           NO            YES (metric)
                  inside a KRA. A gauge on           (instrument   but no target
                  the dashboard. Always running.     is permanent) value attached

KPI Target        A KPI with a numeric goal          YES           YES
                  and a deadline attached            (per cycle)
                  for a specific appraisal period.

OKR Objective     An inspiring qualitative           YES           NO
                  direction statement.               (per cycle)   (qualitative)
                  "Become the most trusted
                  HR platform in India."

OKR Key Result    A specific measurable outcome      YES           YES
                  that proves an Objective           (per cycle)   (number +
                  was achieved. Always belongs                     deadline
                  to exactly one Objective.                        built in)

Competency        A behavioural or skill             NO            YES (rated
                  attribute assessed per             (definition   at review)
                  role or grade.                     is permanent)
```

### 1.2 The Three Permanent Things vs The Three Cycle-Bound Things

```
PERMANENT (no cycle needed — exist forever in the library):
  KRA               → defined once during org setup. Never deleted.
  KPI               → defined once. Assigned to roles. Runs forever.
  Competency        → defined per role/grade. Changes only when job changes.

CYCLE-BOUND (must belong to a review cycle — created and archived per cycle):
  KPI Target        → the numeric goal against a KPI for this cycle only.
  OKR Objective     → created at cycle start. Archived at cycle close.
  OKR Key Result    → created at cycle start. Archived at cycle close.
```

**Critical rule:** A KPI and a KRA can be created, viewed, and managed
without any review cycle existing. They belong to the organisation, not
to a cycle. A KPI Target, OKR Objective, and OKR Key Result cannot
exist without a cycle. They belong to the cycle.

### 1.3 What Is NOT a Performance Item

```
Initiative / Task / Project    → these are HOW someone achieves a Key Result.
                                  They live in project management tools.
                                  They do NOT belong in this PMS.
                                  They are NEVER scored or rated here.

Check-in / Progress Update     → these are observations of progress.
                                  They feed the trend chart.
                                  They do NOT directly determine the appraisal rating.

Calibration Adjustment         → this is an HR override of a rating.
                                  It modifies the final score.
                                  It is NOT a performance item itself.
```

---

## PART 2 — THE FOLDER RULE (Most Important Structural Rule)

### 2.1 Every Measurement Needs a Folder

A measurement without a folder is an orphan. The system must not allow
performance items to be created without their required parent container.

```
MEASUREMENT ITEM    REQUIRED FOLDER         RULE
────────────────────────────────────────────────────────────────────
KPI                 KRA                     A KPI MUST belong to a KRA.
                                            Creating a KPI without
                                            selecting a KRA is blocked.

KPI Target          KPI (which is in KRA)   A target MUST reference a KPI.
                                            A floating target number
                                            with no KPI is blocked.

OKR Key Result      OKR Objective           A Key Result MUST belong to
                                            exactly one Objective.
                                            A KR without an Objective
                                            is blocked. Always.

Competency Rating   Competency Definition   A rating MUST reference a
                                            defined competency.
                                            Ratings without a competency
                                            definition are blocked.
```

### 2.2 The One Exception — Goals

A Goal (simple target, no framework jargon) is the only performance item
that may exist without a folder. Goals are self-explanatory and
self-contained. They are used by organisations that do not use
KRA/KPI or OKR terminology.

```
Valid:   Goal: "Complete ISO certification by March"    ← no folder needed
Valid:   Goal: "Hire 3 engineers by Q2"                ← no folder needed
Invalid: KPI: "Revenue"  (no KRA selected)             ← blocked
Invalid: Key Result: "Sign 200 customers"  (no Obj)    ← blocked
```

---

## PART 3 — OKR DOMAIN RULES

### 3.1 Objective Rules

```
RULE O1:  An Objective is always qualitative. It never has a numeric
          target value. If someone tries to put a number in an
          Objective, they should be creating a Key Result instead.

RULE O2:  An Objective must be inspiring and directional.
          It answers: "What do we want to achieve?"
          It does NOT answer: "By how much?" or "By when exactly?"
          The Key Results answer those questions.

RULE O3:  An Objective must have at least ONE Key Result before it
          can be submitted. An Objective without Key Results is
          just a statement of intent — not a performance commitment.

RULE O4:  An Objective must have at most 5 Key Results.
          More than 5 KRs under one Objective means the Objective
          is too broad and should be split into two Objectives.

RULE O5:  An Objective belongs to exactly one cycle.
          When the cycle closes, the Objective is archived.
          It is never deleted — it becomes historical record.

RULE O6:  At the company level (CEO / top of hierarchy),
          Objectives have no parent. parent_target_id is NULL.
          At every other level, an Objective must link to
          a parent target (Objective or Key Result) above it.
```

### 3.2 Key Result Rules

```
RULE KR1: A Key Result is always quantitative. It always has:
            - A specific numeric target value
            - A unit of measurement
            - An implicit or explicit deadline (provided by the cycle)
          If any of these three are missing, it is not a Key Result.
          It may be a Goal or a task instead.

RULE KR2: A Key Result belongs to exactly one Objective.
          It cannot be shared between Objectives.
          It cannot exist without an Objective.

RULE KR3: Key Results are scored from 0.0 to 1.0 (or 0% to 100%).
          0.0 = no progress.
          0.7 = the target zone for ambitious goals (not failure).
          1.0 = fully achieved.
          Scoring above 1.0 is allowed when actual exceeds planned.
          The system should display > 1.0 as exceptional, not as error.

RULE KR4: An Objective's score is the weighted average of its KR scores.
          If KRs have no individual weights, simple average is used.

RULE KR5: A Key Result MUST be tied to a review cycle.
          There is no such thing as a Key Result without a cycle.
          This is non-negotiable. It is what distinguishes a KR
          from a KPI.

RULE KR6: The cascade from a parent Key Result to a child target
          is a contribution relationship, never a copy.
          The child's target explains HOW it causes the parent
          KR to be achieved. The numbers may differ.
          The context always differs.
```

### 3.3 OKR Level Rules

```
RULE OL1: OKRs are defined at EVERY level of the organisation.
          Company, Department, Manager, Individual — all levels
          define their own Objectives and Key Results.
          There is no level where OKR does not apply
          if the org has chosen OKR framework.

RULE OL2: At individual level, the recommended split is:
          60% of weight → OKRs aligned to manager's targets
          40% of weight → self-proposed OKRs (personal growth,
                          innovation, cross-functional)
          This ratio is configurable per org. It is a warning
          threshold, not a hard block.

RULE OL3: Company-level OKRs are set by the CEO and leadership.
          They are never proposed bottom-up.
          They are the root of all cascade.
          They have no parent target (parent_target_id = NULL).

RULE OL4: The system must NOT require every level to use OKR.
          A company can use OKR at the top two levels and
          KRA/KPI at manager and individual levels.
          This mixing is legitimate and common. Support it.
```

---

## PART 4 — KRA AND KPI DOMAIN RULES

### 4.1 KRA Rules

```
RULE KRA1: A KRA is permanent. It exists independent of any cycle.
           It is defined in the org library during setup.
           It is never deleted — only deactivated.

RULE KRA2: A KRA has no numeric value of its own.
           Its "performance" is derived from the KPIs under it.
           KRA score = weighted average of KPI scores under it.

RULE KRA3: A KRA can be defined at any level of the organisation.
           Company, Dept, Manager, Individual — all can have KRAs.
           The KRA NAME is the same at all levels.
           Only the KPI targets inside it change per level.

RULE KRA4: KRA cascade means the same KRA name is assigned
           to multiple levels. It does not mean numbers flow down.
           Numbers flow through the KPIs inside the KRA.

RULE KRA5: A KRA is a grouping mechanism. Its purpose is to make
           a scorecard readable by clustering related KPIs together.
           Without KRAs, a scorecard with 10 KPIs is an unreadable
           flat list. With KRAs, it becomes structured and clear.
```

### 4.2 KPI Rules

```
RULE KPI1: A KPI (the instrument) is permanent. It exists without
           a cycle. It lives in the performance library.
           Defined once, used across many cycles.

RULE KPI2: A KPI without a target value is just a measurement
           instrument. It has no appraisal significance on its own.
           Only when a target value is assigned for a cycle
           does it become appraisal-worthy.

RULE KPI3: The same KPI can appear at multiple hierarchy levels
           with different target values at each level.
           "Monthly Revenue" KPI:
             Company target:   ₹10 Cr
             Sales VP target:  ₹7 Cr
             Sales Mgr target: ₹2 Cr
             Sales Rep target: ₹50L
           Same instrument. Different targets. This is KPI cascade.

RULE KPI4: A KPI must always belong to a KRA.
           Creating a KPI without a KRA is blocked by the system.

RULE KPI5: A KPI has a measurement direction:
           higher_better (revenue, CSAT, throughput)
           lower_better  (defect rate, churn, cost)
           target_exact  (must hit exactly — compliance, SLA)
           This direction determines how achievement % is calculated.

RULE KPI6: KPI achievement % calculation:
           higher_better: (actual / target) × 100
           lower_better:  (target / actual) × 100  [if actual > 0]
           target_exact:  100 if actual = target, else proportional
```

---

## PART 5 — CASCADE DOMAIN RULES

### 5.1 What Cascades and How

```
THING              HOW IT CASCADES               WHAT CHANGES AT EACH LEVEL
───────────────────────────────────────────────────────────────────────────
OKR Objective      By INSPIRATION                Wording changes every level.
                   Lower level creates a new      Each Objective explains HOW
                   Objective that contributes     THIS level contributes to
                   to the one above.              the level above's direction.

OKR Key Result     By CONTRIBUTION               Numbers change. Context changes.
                   Lower level's KR explains      Child KR does not repeat
                   what they will DO to cause     parent KR — it contributes
                   the parent KR to succeed.      to causing it.

KRA                By INHERITANCE                 Name stays identical.
                   Same KRA name assigned         Scope narrows per level.
                   to lower levels.               KPI targets inside it change.

KPI                By ASSIGNMENT                  Name stays identical.
                   Same instrument assigned        Target value is different
                   to multiple levels.            and smaller at lower levels.

Goal               By DECOMPOSITION               Big goal broken into
                   Large goal at top split        smaller goals below.
                   into smaller contributing      No strict naming rule.
                   goals below.

Competency         NEVER cascades.               Defined per role/grade.
                   Assessed per individual.       Same competencies for
                   No parent-child relationship.  everyone at same grade
                                                 regardless of manager.
```

### 5.2 The Strategic-to-Operational Direction Rule

This is the most important cascade validation rule.

```
HIERARCHY OF ABSTRACTION (most strategic to most operational):

  Objective  →  Key Result  →  KRA  →  KPI/Goal  →  Competency
  [strategic]                                       [independent]

RULE CD1: A child target must be MORE OPERATIONAL than its parent.
          A child can link to a parent that is at the same level
          or more strategic than itself.
          A child CANNOT link to a parent more operational than itself.

CROSS-LINKAGE MATRIX (child → parent):
                   Parent:
                   Obj   KR    KRA   KPI   Goal   Comp
Child: Objective   ✅    ⚠️    ❌    ❌    ❌     ❌
       Key Result  ✅    ✅    ⚠️    ❌    ❌     ❌
       KRA         ✅    ✅    ✅    ❌    ❌     ❌
       KPI         ✅    ✅    ✅    ✅    ❌     ❌
       Goal        ✅    ✅    ✅    ✅    ✅     ❌
       Competency  ❌    ❌    ❌    ❌    ❌     ❌

✅ = Valid. Allow silently.
⚠️ = Unusual but logically valid. Allow with info message asking
     employee to explain the contribution in the description field.
❌ = Invalid. Block with a clear explanation of why.
```

### 5.3 Cascade Mode Rules

```
RULE CM1 — TOP-DOWN:
  Targets flow from senior to junior.
  Senior's targets must be APPROVED before junior's
  goal-setting window opens.
  Junior CANNOT submit targets if manager's targets
  are not yet approved.
  This is a hard block, not a warning.

RULE CM2 — BOTTOM-UP:
  All employees can propose targets from day one of goal-setting.
  Proposals have no parent_target_id at creation time.
  Manager must LINK each proposal to one of their own targets
  before they can approve it.
  An approved target without a parent link is not allowed.

RULE CM3 — BIDIRECTIONAL:
  Both top-down and bottom-up run simultaneously in the same cycle.
  An employee can have BOTH assigned targets (from manager)
  AND self-proposed targets (their own initiative).
  Both types must be approved.
  Both together must have weights summing to 100%.
  Before cycle advances to active, every approved target
  must have a parent_target_id. No orphan targets allowed.

RULE CM4 — CONTRIBUTION NOT COPY:
  At no level should a child target be an exact copy of its parent.
  The child must express WHAT THIS PERSON WILL DO to contribute
  to the parent target. The numbers and context must differ.
  If a child's title and target value are identical to the parent,
  the system should warn: "This looks like a copy. Describe your
  specific contribution."
```

### 5.4 The Coverage Check Rule

```
RULE CC1: The sum of all approved child targets under a parent
          should not EXCEED the parent target by more than the
          configured overplan multiplier (default: 1.15 = 115%).

          If SUM(children planned_targets) > parent.planned_target × 1.15
          → Warning shown to HR and the parent's manager.
          → Not a hard block (over-planning is allowed with approval).
          → Becomes a hard block only if org disables over-planning.

RULE CC2: The sum of all approved child targets under a parent
          should not FALL BELOW the parent target by more than
          an acceptable gap (default: no lower limit enforced).
          Under-coverage is visible to HR but not blocked.
          It is the manager's responsibility to ensure coverage.

RULE CC3: Coverage is calculated separately per unit type.
          Revenue coverage and headcount coverage are separate.
          Do not mix units in coverage calculations.
```

---

## PART 6 — OVER-PLANNING RULES

```
RULE OP1: Over-planning means an employee commits to MORE than
          what their parent committed. This is ALLOWED.
          It represents extra-mile effort and ambition.
          It must never be blocked — only flagged and approved.

RULE OP2: Over-planning is detected automatically by the system
          when: child.planned_target > parent.planned_target
          (for higher_better metrics)
          or: child.planned_target < parent.planned_target
          (for lower_better metrics like defect rate)

RULE OP3: When over-planning is detected, the employee MUST
          provide a written justification before submitting.
          The justification field is mandatory in this case.
          Blank justification with over-plan = blocked submission.

RULE OP4: The manager MUST explicitly acknowledge and approve
          the over-planned portion during their approval action.
          A generic approval is not sufficient.
          The system presents a specific checkbox or confirmation:
          "I acknowledge this target exceeds the planned level
          and approve the additional commitment."

RULE OP5: There is a hard cap on aggregate over-planning.
          The SUM of all child targets under a parent cannot exceed
          parent.planned_target × overplan_max_multiplier.
          Default multiplier: 1.15 (15% buffer).
          This is configurable per organisation.
          Beyond this multiplier, the system warns HR.

RULE OP6: Stretch targets are SEPARATE from over-planning.
          Stretch = aspirational goal above planned.
          Over-plan = committed delivery above parent's committed level.
          Both can coexist on the same target.
          Only over-plan requires manager's explicit approval.
          Stretch is informational only — not used in scoring.

RULE OP7: Achievement above planned but below stretch = exceptional.
          Achievement above stretch = outstanding.
          Both are positive outcomes and should be displayed
          as such in the system — never shown as errors or anomalies.
```

---

## PART 7 — WEIGHTING RULES

```
RULE W1:  The SUM of all active target weights for one employee
          in one cycle MUST equal exactly 100%.
          This is a hard block on submission. No exceptions.
          A submission with weights summing to 99% or 101% fails.

RULE W2:  Weights are assigned at the TARGET level, not at the
          KRA or Objective level.
          Exception: In OKR, Objectives have weights.
          KRs then inherit sub-weights within their Objective.
          KR weights must sum to their Objective's weight.

RULE W3:  No single target should have a weight below the
          organisation's configured minimum (default: 5%).
          A target worth less than 5% is trivial and should
          either be removed or merged with another target.
          This is a warning, not a hard block.

RULE W4:  No single target should have a weight above the
          organisation's configured maximum (default: 50%).
          A target worth more than 50% creates unhealthy
          single-point-of-failure in the scorecard.
          This is a warning, not a hard block.

RULE W5:  Competency weights are separate from goal weights.
          The org configures: goals_percent + competency_percent = 100%.
          Example: 70% goals, 30% competency.
          Within goals, individual target weights sum to 100%
          of the goals portion.
          Within competency, individual competency weights sum
          to 100% of the competency portion.
          The two groups are scored separately and blended at
          the final score calculation step.

RULE W6:  Weight is a business decision, not a system default.
          The system must NOT auto-assign weights.
          Every weight must be consciously set by the employee
          or manager. This forces prioritisation.
```

---

## PART 8 — PROGRESS TRACKING RULES

```
RULE PT1: Progress tracking (check-ins) is COMPLETELY SEPARATE
          from the formal appraisal review.
          Check-ins are always available during the active phase.
          HR does not open or close check-in windows.
          Employees update progress on their own schedule.

RULE PT2: Each target has a check-in frequency set by the employee
          at target creation time:
          daily | weekly | monthly | quarterly | semi-annually | annually
          The system sends reminders at this frequency.
          Reminders are advisory — not enforcement.
          Missing a check-in does not block any workflow.

RULE PT3: A check-in records:
          - The actual value at this point in time
          - A status flag: on_track | at_risk | blocked | completed
          - An optional note explaining progress or blockers
          Multiple check-ins per target build the trend line.
          Each check-in is a separate record — never overwrites.

RULE PT4: For OKR Key Results, a check-in also captures a
          CONFIDENCE SCORE (0.0 to 1.0):
          "How confident am I that I will achieve this KR by cycle end?"
          This is different from the % achieved so far.
          A target 40% achieved in June can still have 0.8 confidence
          if the employee knows Q3/Q4 are strong periods.
          Confidence score is displayed alongside raw % on dashboards.

RULE PT5: The last check-in's actual_value is AUTO-POPULATED
          into the formal appraisal's actual_value field when
          the review window opens.
          The employee can override this during formal review.
          This eliminates double entry and rewards consistent tracking.

RULE PT6: Check-in history is PERMANENT and IMMUTABLE.
          A check-in record cannot be edited or deleted after saving.
          Only new check-ins can be added.
          This preserves the honest progress trail.
          If an employee made an error, they add a correcting
          check-in with a note explaining the correction.

RULE PT7: KPI progress is tracked as the raw actual value.
          The system calculates % achievement automatically.
          OKR KR progress is tracked as actual value + confidence score.
          Goal progress is tracked as % complete or milestone status.
          Competency progress is NOT tracked mid-cycle.
          Competencies are only rated at formal review time.
```

---

## PART 9 — APPRAISAL AND SCORING RULES

### 9.1 Appraisal Phase Rules

```
RULE AP1: The formal appraisal review is a SEPARATE PHASE
          from progress tracking. HR must explicitly advance
          the cycle to 'review' status to open appraisal.
          Until then, only check-ins are possible.

RULE AP2: Self-appraisal comes BEFORE manager appraisal.
          The manager sees the employee's self-rating and
          self-comment before entering their own rating.
          The employee does NOT see the manager's rating
          until the cycle is fully closed.

RULE AP3: The manager's rating is the rating that counts.
          Self-rating is input for discussion — not the final score.
          Final rating = manager rating (unless calibrated by HR).

RULE AP4: During appraisal, the employee enters:
          - Actual value achieved (pre-filled from last check-in)
          - Self-rating (on org's configured scale)
          - Self-comment (what they did, evidence, context)
          During appraisal, the manager enters:
          - Manager rating (on same scale)
          - Manager comment (assessment, feedback, development notes)
          - Final rating (usually same as manager rating)
```

### 9.2 Scoring Calculation Rules

```
RULE SC1: KPI/Goal score per target:
          score = (actual_value / planned_target) × max_scale_value
          For lower_better: score = (planned_target / actual_value) × max_scale_value
          Capped at max_scale_value × 1.2 for over-achievement display.

RULE SC2: OKR Key Result score:
          score = actual_value / planned_target  (0.0 to 1.0+)
          Objective score = weighted average of its KR scores.
          If KRs have no individual weights: simple average.

RULE SC3: Employee goal score:
          = SUM(target_final_rating × target_weight) / SUM(target_weight)
          Calculated only across non-competency targets.

RULE SC4: Employee competency score:
          = SUM(competency_final_rating × competency_weight) / SUM(competency_weight)
          Calculated only across competency targets.

RULE SC5: Employee final score:
          = (goal_score × goals_percent/100) + (comp_score × comp_percent/100)
          goals_percent and comp_percent come from org settings.
          They must sum to 100.

RULE SC6: Performance band is assigned by mapping final_score
          to the org's configured band thresholds.
          Band thresholds are configured per org.
          Default 5-band system:
            Exceptional:         score ≥ 4.5
            Exceeds Expectation: score ≥ 3.5
            Meets Expectation:   score ≥ 2.5
            Below Expectation:   score ≥ 1.5
            Needs Improvement:   score < 1.5

RULE SC7: PIP (Performance Improvement Plan) is automatically
          flagged when an employee falls in the bottom band.
          This is a FLAG only — not an automatic action.
          HR must take the actual PIP decision.
```

### 9.3 Calibration Rules

```
RULE CAL1: Calibration is an HR-only function.
           It happens AFTER all manager ratings are complete.
           Its purpose is to normalise ratings across teams
           where different managers have different rating tendencies.

RULE CAL2: Calibration can ONLY modify the final_rating.
           It cannot change self_rating or manager_rating.
           The original ratings are preserved permanently.
           Only the calibrated_final_rating changes.

RULE CAL3: Every calibration adjustment requires a written reason.
           Adjustments without reasons are blocked.

RULE CAL4: Calibrated scores replace the manager's final rating
           for band calculation and compensation decisions.
           The manager's original rating remains visible
           but is marked as "pre-calibration".
```

---

## PART 10 — THE LIBRARY VS CYCLE DISTINCTION

This is the most important architectural boundary in the system.
Every feature must respect this boundary.

```
PERFORMANCE LIBRARY                   CYCLE TARGETS
(permanent, no cycle)                 (temporary, cycle-bound)
─────────────────────────────────────────────────────────────────────
KRA definitions                       KPI Targets (value + weight)
KPI definitions                       OKR Objectives
Competency definitions                OKR Key Results
OKR Objective templates (optional)    Goals
Industry template examples            Competency Ratings
Grade-competency mappings             Check-in records
                                      Appraisal ratings
                                      Performance summaries

RULES:
  Library items are NEVER deleted. Only deactivated.
  Cycle targets are NEVER modified after the cycle closes.
    They become immutable historical records.
  Cycle targets REFERENCE library items — they do not copy them.
    If a library item changes, existing cycle targets are unaffected.
  A new cycle does NOT automatically copy targets from the last cycle.
    Goal setting is a fresh exercise every cycle.
    (Optional: system can suggest last cycle's targets as a starting
     point, but employee must consciously accept each one.)

CONSEQUENCE FOR UI:
  Library management lives in Org Setup — separate from any cycle.
  Cycle target management lives under the active cycle.
  These are two distinct areas of the application.
  An HR admin working in the library is not in "appraisal mode".
  An employee setting targets is not in "library mode".
  The two must never be confused in the UI.
```

---

## PART 11 — HIERARCHY AND LEVELS

```
RULE HL1: The reporting structure (who reports to whom) is the
          SINGLE source of truth for all cascade paths.
          There is no separate "performance hierarchy" —
          the org chart IS the cascade chain.

RULE HL2: The hierarchy is unlimited in depth.
          L1 (company) → L2 → L3 → ... → Ln (leaf individual).
          The system must not assume any fixed depth.
          All hierarchy queries must use recursive traversal.

RULE HL3: Every employee except the CEO/top has exactly one
          direct manager (reporting_to).
          Matrix reporting (two managers) is NOT supported
          in this POC. One person, one manager, always.

RULE HL4: An employee at any level can see their FULL upward
          chain and that chain's approved targets.
          This is the context panel — always visible during
          goal setting. An employee must always know what
          their seniors have committed to.

RULE HL5: A manager can only approve targets of their
          DIRECT reportees. Not skip-level.
          Exception: If a manager is absent, HR can re-assign
          approval authority. This is an admin function.

RULE HL6: A manager's own targets MUST be approved before they
          can approve their reportees' targets.
          This enforces cascade order in top-down mode.
          In bottom-up mode, this rule is relaxed — manager
          can approve proposals before setting their own targets,
          but they MUST link proposals to their own targets
          before final cycle advancement.

RULE HL7: At the company level (root of hierarchy), targets
          have no parent_target_id. They are the origin point
          of all cascade. Their company_target field is set.
          All targets below must eventually trace back to
          a company-level root target through the parent chain.
```

---

## PART 12 — FRAMEWORK SELECTION RULES

```
RULE FS1: The organisation selects ONE primary framework during setup.
          But within that framework, mixing is allowed at different
          hierarchy levels. This is normal and expected.

RULE FS2: The most common legitimate pattern in Indian organisations:
          Company + Dept level: OKR (Objective + Key Results)
          Manager + Individual:  KRA/KPI (operational metrics)
          Competency:            At all individual/manager levels
          This mixing is fully supported. It is not a workaround.
          It is a first-class pattern.

RULE FS3: Framework selection affects:
          - Which target types appear in the "Add Target" form
          - Which fields are shown (numeric target, confidence score, etc.)
          - How the scorecard is displayed
          - Which terminology labels are used (Objective vs Goal etc.)
          It does NOT affect cascade logic, weighting rules,
          validation rules, or scoring calculation structure.

RULE FS4: Terminology is customisable per organisation.
          "Key Result Area" can be renamed "Focus Area".
          "Competency" can be renamed "Behavioural Attribute".
          The UNDERLYING DATA STRUCTURE does not change.
          Only the display labels change. Business logic is invariant.

RULE FS5: Balanced Scorecard is a framework that organises
          KPIs into exactly four perspectives:
          Financial | Customer | Internal Process | Learning & Growth
          These perspectives act as KRAs.
          KPIs sit under each perspective.
          Targets are set per KPI per cycle.
          The cascade behaviour is identical to KRA/KPI.

RULE FS6: Competency-only organisations (e.g. some healthcare roles)
          have NO numeric targets.
          Their entire scorecard is behavioural assessment.
          Weighting: goals_percent = 0, competency_percent = 100.
          The system must handle this without dividing by zero
          or showing empty goal sections.
```

---

## PART 13 — VALIDATION RULES (Business Layer)

These are business rules, not technical validations. Every one of these
must be enforced server-side regardless of what the UI does.

```
V1  Weight sum must equal 100% per employee per cycle before submission.
    Hard block.

V2  Every KPI target must reference a KPI from the library.
    Every KPI must belong to a KRA.
    Hard block on submission.

V3  Every Key Result must belong to an Objective.
    Hard block on creation.

V4  Every Objective must have at least one Key Result before submission.
    Hard block.

V5  An over-planned target (child > parent) requires a justification note.
    Hard block on submission without note.

V6  Manager's own targets must be approved before they can approve
    reportees' targets (top-down and bidirectional modes).
    Hard block.

V7  Stretch target must be numerically greater than planned target.
    Hard block.

V8  Planned target must be greater than zero for numeric metrics.
    Hard block.

V9  A manager approving an over-planned target must explicitly
    acknowledge the over-plan. Generic approval is insufficient.
    Hard block.

V10 Mandatory KRAs/KPIs (marked in library) must appear in every
    eligible employee's scorecard before submission.
    Hard block.

V11 Competency cannot be linked to any performance target as parent.
    Competencies have no parent_target_id. Hard block.

V12 A target's framework_type must be compatible with its parent's
    framework_type per the cross-linkage matrix (Part 5.2).
    Invalid combinations: Hard block.
    Unusual but valid combinations: Warning with explanation required.

V13 Before a cycle can advance from goal_setting to active,
    every employee must have at least one approved target,
    and every approved target must have a parent_target_id
    (except company-level root targets).
    Hard block on cycle status advancement.
```

---

## PART 14 — WHAT THE SYSTEM MUST NEVER DO

These are absolute prohibitions derived from the business domain.

```
NEVER auto-assign weights to targets.
  Weight is a human judgment about priority. The system suggests
  a split but never sets weights without explicit user action.

NEVER delete a target, KPI, KRA, or competency.
  Deactivate only. History is permanent.
  A deleted target breaks the audit trail and cascade history.

NEVER allow a Key Result to exist without an Objective.
  Even temporarily. Even in draft status.
  The Objective must be created first, then KRs added under it.

NEVER allow a KPI to exist without a KRA.
  Even in draft. KRA selection is step one of KPI creation.

NEVER carry over targets automatically to a new cycle.
  Goal setting is a conscious, fresh exercise every cycle.
  The system may SUGGEST last cycle's items but must not
  auto-populate them. Every target in a new cycle is a
  deliberate human decision.

NEVER use check-in data to automatically set the appraisal rating.
  Check-ins inform the conversation. The manager sets the rating.
  Auto-rating from check-in data removes human judgment
  which is the entire point of a manager's role.

NEVER allow the appraisal phase to modify target definitions.
  During review, only ratings and comments can be added.
  The target title, planned value, weight, and unit are frozen
  once the cycle moves to active status.

NEVER conflate KPI progress monitoring with formal appraisal.
  These are two separate concerns with separate purposes,
  separate timing, and separate data. They inform each other
  but are never the same thing.

NEVER score an Initiative or Task.
  Only Key Results, KPI Targets, Goals, and Competencies are scored.
  If someone asks "how do I track my tasks in the PMS" —
  the answer is: you do not. Tasks belong in a project tool.
```

---

## PART 15 — DOMAIN GLOSSARY

Use these definitions consistently everywhere in the application —
in UI labels, error messages, help text, and code comments.

```
TERM                  DEFINITION
──────────────────────────────────────────────────────────────────────
Performance Cycle     A defined time period for which targets are set,
                      tracked, and rated. Has distinct phases.
                      Also called: Review Cycle, Appraisal Cycle.

Appraisal Phase       The formal rating phase within a cycle.
                      Opens on HR's instruction. Has a deadline.

Check-in              An informal progress update by an employee.
                      Always available. Not part of formal appraisal.

Target                Generic term for any performance item in a cycle:
                      KPI Target, OKR KR, Goal, or Competency Rating.

Library               The permanent collection of KRAs, KPIs, and
                      Competencies that exist independent of cycles.

Cascade               The flow of targets from higher to lower levels
                      in the hierarchy, such that lower-level targets
                      contribute to higher-level targets.

Parent Target         The target at the level above that a child target
                      contributes to. Identified by parent_target_id.

Coverage              The degree to which children's planned targets
                      collectively account for the parent's planned target.

Over-plan             When an employee commits to more than their parent
                      committed. Allowed with justification and approval.

Stretch Target        An aspirational goal above the planned target.
                      Informational only. Not used in scoring.

Performance Band      The qualitative rating category derived from the
                      final score: Exceptional, Exceeds, Meets, Below,
                      Needs Improvement. Configured per organisation.

Calibration           HR's process of normalising manager ratings across
                      teams to ensure fairness and consistency.

Weight                The percentage importance of a target in an
                      employee's total scorecard. All weights sum to 100%.

Framework             The performance management methodology chosen by
                      the organisation: OKR, KRA/KPI, Goals, Competency,
                      Balanced Scorecard, Hybrid, or Custom.

Cascade Mode          The direction of target flow: Top-Down (senior sets
                      first), Bottom-Up (employee proposes first), or
                      Bidirectional (both simultaneously).
```

---

*BUSINESS_LOGIC.md — Version 1.0*
*This file defines the domain. The domain does not change based on technical constraints.*
*When in doubt about any feature decision, return to this file.*
