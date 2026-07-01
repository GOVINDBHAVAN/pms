# InfoBuz Technologies — Comprehensive Demo Guide

**App:** `http://localhost:5173` | **Password (all accounts):** `password123`
**Framework:** Hybrid (OKR + KRA-KPI + Competency) | **Cascade:** Bidirectional
**Industry:** IT/B2B SaaS | **ARR Journey:** ₹50 Cr → ₹75 Cr → ₹100 Cr → ₹200 Cr (target)

---

## Org Structure & Grade Levels

InfoBuz uses **L1 → L6** grade codes (CEO = L1, frontline executive = L6).

> **Important:** Grade codes are L1 through L6. L1 is the CEO (most senior). The numeric `level`
> field in the database is an internal seniority score (L1 = 9, L6 = 3) used for hierarchy sorting —
> **the UI always displays grade codes (L1, L2…), not the numeric level.**

| Grade Code | Label | Hierarchy |
|---|---|---|
| L1 | CEO / Managing Director | Rahul Mehta — company-wide OKRs |
| L2 | Vice President / HOD | VP Sales, VP Product, VP CX |
| L3 | Regional Head / Director | North/South Sales, Engineering, CX, HR |
| L4 | Area Manager / Lead | Area Managers, Eng Lead, CX Lead |
| L5 | Senior Executive / Engineer | Team leads, Sr Engineers, Sr CX |
| L6 | Executive / Associate | Frontline sales executives (18 people) |

---

## Data Coverage — All 41 Employees (FY 2025-26)

Every InfoBuz employee has **OKR Key Results + KRA + KPI + Competencies** in FY 2025-26.
No employee is without OKR contributions. Company OKR maps through the hierarchy.

| Level | Employees | OKR KR | KRA | KPI | Competency |
|---|---|---|---|---|---|
| L1 CEO | Rahul Mehta | 6 KRs across 4 Objectives | Revenue Growth | — | Strategic Thinking, Leadership, Communication |
| L2 VP Sales | Vikram Joshi | Sales Revenue ₹150 Cr ← CEO ARR | Revenue + New Business | Monthly MRR | Leadership, Strategic Thinking, Communication |
| L2 VP Product | Karthik Menon | Uptime + Sprint Velocity ← CEO Obj2 | Product Quality | Bug Escape Rate | Technical Aptitude, Leadership, Strategic |
| L2 VP CX | Divya Subramaniam | NPS + Retention ← CEO Obj3 | Cust Satisfaction | CSAT Score | Customer Focus, Communication, Strategic |
| L3 Sales North | Amit Sharma | North Revenue ₹50 Cr ← VP Sales | Revenue Growth | Monthly MRR | Leadership, Sales Execution, Strategic |
| L3 Sales South | Priya Patel | South Revenue ₹90 Cr ← VP Sales | Revenue Growth | Monthly MRR | Leadership, Sales Execution, Strategic |
| L3 Engineering | Sneha Krishnan | Uptime + Velocity ← VP Product | Product Quality | Bug Escape Rate | Technical, Collaboration, Adaptability |
| L3 CX | Ganesh Iyer | NPS + Churn ← VP CX | Cust Satisfaction | Ticket Resolution | Customer Focus, Communication, Collaboration |
| L3 HR | Pooja Mehta | eNPS + Attrition ← CEO Obj4 | Team Development | — | Leadership, Communication, Adaptability |
| L4 Sales (×3) | Sanjay/Deepak/Sunita | Area Revenue ← L3 KR | Revenue Growth | Monthly MRR | Leadership, Sales Execution, Ownership |
| L4 Eng | Manish Verma | Uptime + Velocity ← L3 Eng | Product Quality | Bug Escape Rate | Technical, Collaboration, Ownership |
| L4 CX | Ritika Gupta | NPS ← L3 CX | Cust Satisfaction | Ticket Resolution | Customer Focus, Communication, Adaptability |
| L5 Sales (×6) | Rohit/Kavya/Arun/Neha/Ravi/Pooja | Team Revenue ← L4 KR | New Business | Monthly MRR | Sales Execution, Leadership/Ownership, Focus |
| L5 Eng (×2) | Zubair/Ankita | Velocity ← L4 Eng | Product Quality | Bug Escape Rate | Technical, Collaboration, Adaptability |
| L5 CX | Rishab Pillai | NPS ← L4 CX | Cust Satisfaction | CSAT Score | Customer Focus, Communication, Collaboration |
| L6 Sales (×18) | All 18 executives | My Revenue KR (proposed, bottom-up) | New Business | Monthly MRR | Sales Execution, Customer Focus, Adaptability |

**L6 status:** All 18 have OKR KR + KPI + KRA + Competency — all in `proposed` (unlinked) state.
V13 blocks cycle from advancing to `active` until managers link all proposals.

---

## Quick Login Reference

| Email | Name | Level | Role | Key Demo Point |
|---|---|---|---|---|
| `rahul.mehta@infobuz.in` | Rahul Mehta | L1 CEO | Admin | 4 OKR Objectives, full org drilldown |
| `vikram.joshi@infobuz.in` | Vikram Joshi | L2 VP Sales | Manager | ₹150 Cr KR; cascade to North/South |
| `karthik.menon@infobuz.in` | Karthik Menon | L2 VP Product | Manager | Uptime + Velocity OKRs |
| `divya.s@infobuz.in` | Divya Subramaniam | L2 VP CX | Manager | NPS + Retention OKRs |
| `amit.sharma@infobuz.in` | Amit Sharma | L3 North Director | Manager | ₹50 Cr KR; North team |
| `priya.patel@infobuz.in` | Priya Patel | L3 South Director | Manager | ₹90 Cr KR; South team |
| `sanjay.reddy@infobuz.in` | Sanjay Reddy | L4 Area Manager | Manager | ₹28 Cr KR; Rohit's manager |
| `rohit.verma@infobuz.in` | Rohit Verma | L5 Team Lead | Manager | Gap visible: ₹12 Cr vs ₹0.78 Cr |
| `ankit.joshi@infobuz.in` | Ankit Joshi | L6 Executive | Employee | Over-plan ₹0.30 Cr (25K MRR) |
| `karan.singh@infobuz.in` | Karan Singh | L6 Executive | Employee | Under-plan ₹0.18 Cr (15K MRR) |
| `arun.kumar@infobuz.in` | Arun Kumar | L5 Team Lead | Manager | Absorbs Karan's gap (+5K own) |
| `sneha.krishnan@infobuz.in` | Sneha Krishnan | L3 Eng Head | Manager | Product OKR chain |
| `pooja.mehta@infobuz.in` | Pooja Mehta | L3 HR Head | Manager | eNPS + Attrition OKRs |

---

## Company OKR Cascade Chain (FY 2025-26)

```
Rahul Mehta (L1 CEO)
  ├── Objective 1: "Scale InfoBuz to ₹200 Cr ARR"   [wt: 30%]
  │     ├── KR: Annual Recurring Revenue = ₹200 Cr    [wt: 20%] ← Vikram (₹150 Cr) → Amit (₹50 Cr) → Sanjay (₹28 Cr) → Rohit (₹12 Cr) → L6
  │     └── KR: New Customer Logos = 120              [wt: 10%]
  ├── Objective 2: "Zero-Defect Product, 30+ Features"  [wt: 20%]
  │     ├── KR: Platform Uptime = 99.9%               [wt: 12%] ← Karthik → Sneha → Manish → Zubair/Ankita
  │     └── KR: Sprint Velocity = 40 pts/sprint       [wt:  8%]
  ├── Objective 3: "NPS 85+ and Zero Churn Top 50"    [wt: 20%]
  │     ├── KR: Customer NPS = 85                     [wt: 12%] ← Divya → Ganesh → Ritika → Rishab
  │     └── KR: Churn Rate = 3%                       [wt:  8%]
  └── Objective 4: "High-Performance Culture"         [wt: 20%]
        ├── KR: Employee eNPS = 50                    [wt: 12%] ← Pooja Mehta (HR)
        └── KR: Annual Attrition = 10%                [wt:  8%]
```

---

## Demo Flow

### Part A — Top-Down OKR Cascade

**Step 1 — CEO sets the company OKR**
Login: `rahul.mehta@infobuz.in`
- My Targets → show 4 Objectives (ARR, Product, NPS, Culture) — all **Approved**
- Expand Objective 1: ARR ₹200 Cr (20% wt), New Logos 120 (10% wt)
- KRA: Revenue Growth (10% wt)
- Competencies: Strategic Thinking (40%), Leadership (35%), Communication (25%)
- Team Targets → Org Drilldown → full tree collapsed; expand VP Sales to begin cascade

> *"The CEO has set the north star across all four company pillars."*

---

**Step 2 — VP Sales owns his portion**
Login: `vikram.joshi@infobuz.in`
- My Targets → OKR: *"Sales Revenue Contribution FY26"* = **₹150 Cr** (wt: 40%)
  - Parent: CEO's ARR KR — the link is explicit
- KRA: Revenue Growth + New Business Acquisition
- KPI: Monthly New Business MRR = ₹9,50,000/mo
- Team Targets → Cascade Coverage → see ₹150 Cr broken into North + South

> *"The VP sees exactly who owns what portion of the CEO commitment."*

---

**Step 3 — Director takes the North Region slice**
Login: `amit.sharma@infobuz.in`
- My Targets → OKR KR: *"North Region Revenue"* = **₹50 Cr** (linked to Vikram's ₹150 Cr)
- KPI: Monthly MRR North = ₹2,85,000/mo
- KRA: Revenue Growth
- Team Targets → Sanjay Reddy holds ₹28 Cr of that ₹50 Cr

> *"Every level sees their own OKR target AND how it breaks down below."*

---

**Step 4 — Team Lead sees his assignment and the gap** ⭐
Login: `rohit.verma@infobuz.in`
- My Targets → OKR KR: *"L5.1 Team Revenue Contribution"* = **₹12 Cr** (linked to Sanjay's ₹28 Cr)
- Team Targets → Cascade Coverage tab
  - Team proposals total: **₹0.78 Cr** vs target **₹12 Cr** → coverage ~6.5% (red alert)

> *"The bidirectional gap is visible immediately — Rohit must act before the cycle closes."*

---

### Part B — Bottom-Up Proposals (Frontline Self-Proposes)

**Step 5 — Over-planning executive proposes above baseline**
Login: `ankit.joshi@infobuz.in`
- My Targets → **Proposed** targets (bottom-up):
  - OKR KR: *"My Annual Sales Revenue Contribution"* = ₹0.30 Cr | Proposed, unlinked
  - KRA: *"New Business Acquisition"* (30%)
  - KPI: *"My New Business MRR Target"* = ₹25,000/month (vs ₹20,000 baseline — **+25% over-plan**)
  - Competencies: Sales Execution (50%), Customer Focus (30%), Adaptability (20%)
  - Over-plan note: "BSNL Phase-2 ₹8K MRR ready Apr 15; HDFC Insurance pilot converting"

> *"Ankit committed more than the baseline because his pipeline supports it — BSNL Phase-2 is confirmed."*

---

**Step 6 — Under-planning executive explains the shortfall**
Login: `karan.singh@infobuz.in`
- My Targets → OKR KR ₹0.18 Cr, KPI ₹15,000/month (vs ₹20,000 baseline — **−25% under-plan**)
- Self-note: "Lost Infosys (₹8K MRR) in FY25. Rebuilt to 4 SMEs. Committing to realistic ₹15K; targeting ₹20K by Q2."

> *"Karan is being transparent: FY25 churn hurt him. The system captures this honest commitment."*

---

### Part C — Manager Reconciles Both Flows ⭐ Bidirectional in Action

**Step 7 — Rohit links bottom-up proposals to top-down plan**
Login: `rohit.verma@infobuz.in`
- Team Targets → Direct Reportees tab → see Ankit, Maya, Vikash with proposals
- Click Ankit's OKR KR → **"Link to My Target"** → select "L5.1 Team Revenue Contribution" (₹12 Cr)
- Status: Proposed → **Linked**
- Repeat for Maya (₹0.24 Cr) and Vikash (₹0.24 Cr)
- After linking: ₹0.78 Cr linked vs ₹12 Cr target → gap is still visible and honest

> *"The 'Link to My Target' action is the reconciliation moment. The gap is real — Rohit must either raise his own burden or escalate."*

---

**Step 8 — Under-planning on L5.3 Arun's team**
Login: `arun.kumar@infobuz.in`
- My Targets → KPI MRR: own target raised to **₹40,000/month** (from ₹35,000 baseline)
  - Description: "Karan 15K+Preethi 20K+Sujith 20K = 55K. Arun raises own by 5K to cover Karan gap."
- Team Targets → Cascade Coverage → shows ₹95,000 total MRR, but Karan's 15K is flagged below-baseline

> *"Arun absorbed Karan's 5K shortfall into his own target — this is the bidirectional adjustment in action."*

---

**Step 9 — Approve linked targets**
- Team Targets → Approve each linked target
- Status: Proposed → Linked → **Approved**
- Cascade Coverage updates with approved contributions

---

### Part D — CEO Sees the Full Picture

**Step 10 — Org drilldown from CEO**
Login: `rahul.mehta@infobuz.in`
- Team Targets → **Org Drilldown** tab → start collapsed at VP level
- Expand Vikram (₹150 Cr) → Amit (₹50 Cr) → Sanjay (₹28 Cr) → Rohit (₹12 Cr) → L6 executives
- Each node shows OKR / KRA-KPI / Competency status chips
- CEO verifies cascade reaches frontline: ₹0.78 Cr proposed at L6 under ₹12 Cr assignment

> *"From the CEO dashboard, every level is visible — nothing is hidden, gaps are surfaced."*

---

### Part E — Self Appraisal (Review Phase) 🆕

> **When to show:** Switch to **FY 2024-25 Annual** (cycle status: `closed`).
> Ankit Joshi and Karan Singh both have self-ratings + actuals + check-ins in this cycle.
> In a live scenario, the cycle status would be `review` to allow editing.

**Step 11 — Employee reviews own performance**
Login: `ankit.joshi@infobuz.in`
- Navigate to **Self Appraisal** (main menu)
- Select cycle: *"FY 2024-25 Annual"*
- Page shows all approved targets grouped by type: **OKR → KRA/KPI → Competency**

**What the Self Appraisal screen shows:**
- **OKR group:** KPI target (MRR 20K) nested under KRA folder; achievement bar shows 110% (green)
  - Actual value: ₹22,000 (pre-filled from last check-in — March 2025: "Year-end: 3 accounts active")
  - Self-rating: **5 / Exceptional** — pre-set from seed data
  - Self-comment: "22K avg — BSNL Phase-1 closed Sep; HDFC pilot converted in Mar"
- **KRA/KPI group:** New Business Acquisition — rated 5/Exceptional
- **Competency group:** Not available in FY24-25 seed (competencies seeded only in FY25-26)
- **Right panel:** Appraisal Progress (2/2 rated = 100%), Estimated Score preview

> *"Ankit's self-appraisal shows 110% achievement. The system pre-fills his last check-in value so he doesn't re-enter what he already tracked month by month."*

---

**Step 12 — Under-performer's self-appraisal**
Login: `karan.singh@infobuz.in`
- Self Appraisal → FY 2024-25
- KPI MRR: actual ₹15,000 vs planned ₹20,000 → achievement **75%** (red bar)
- Self-rating: **2 / Below Expectation**
- Self-comment: "Lost Infosys account in May (₹8K MRR). Took till Q3 to rebuild pipeline."
- Estimated score preview reflects low rating

> *"Karan's honest 2-rating vs 75% achievement is in the system. His comment explains the Infosys churn — the manager has full context before entering their rating."*

---

**Key Self Appraisal Features:**
| Feature | Description |
|---|---|
| Check-in pre-fill | Last monthly check-in value auto-populates actual value field |
| Achievement bar | Shows % attainment (green ≥100%, amber ≥70%, red <70%) |
| Per-target save | Each target saved independently — no bulk submit risk |
| OKR nesting | Key Results shown indented under their Objective |
| KRA nesting | KPIs shown indented under their KRA folder |
| Score preview | Live estimated score/band updates as employee rates |
| Progress tracker | X/Y targets rated with progress bar |
| Read-only mode | If cycle not in review, fields are read-only (view history) |

---

### Part F — Team Appraisal (Manager Rates Reportees) 🆕

> **When to show:** Stay on **FY 2024-25 Annual** (closed cycle with manager ratings seeded).
> Login as Rohit Verma (L5 manager) to see Ankit Joshi's appraisal with prior-cycle context.

**Step 13 — Manager opens Team Appraisal**
Login: `rohit.verma@infobuz.in`
- Navigate to **Team Appraisal** (main menu)
- Select cycle: *"FY 2024-25 Annual"*
- Left panel: list of all direct reportees with:
  - Name, grade (L6), department badge
  - Self-completion status: "2/2 rated" for Ankit, "2/2 rated" for Maya, Vikash
  - Estimated self-score indicator

---

**Step 14 — Rate Ankit Joshi (high performer)**
- Click **Ankit Joshi** → right panel opens (rating workspace)

**Sticky header shows:**
- Employee info: Ankit Joshi · IB-S13 · L6 Executive
- **Estimated score (your ratings so far):** 5.00 / 5.0 → *Exceptional* (updates live)
- **Employee self-score:** 5.00 / 5.0 → *Exceptional* (pre-existing from seed)
- "Aligned with self" indicator (no gap)
- **Last cycle (FY 2023-24):** 4.8 / Exceeds

**Rating workspace (for each target):**
- KPI: MRR target 20K → actual 22K → **110% achievement** (green bar)
  - Self-rating: 5 | Self-comment visible
  - Gap alert: None (achievement supports the self-rating)
  - Check-ins accordion: 12 monthly entries (Apr 2024 → Mar 2025) — "BSNL Phase-2 confirmed"
  - Manager rating: **5 / Exceptional** (pre-set from seed)
  - Manager comment: "Ankit is team standout. Closed 2 enterprise accounts. Earmarked for promotion."

> *"No gap between self-rating (5) and implied rating from 110% achievement. Check-in history gives the manager full context without needing a meeting."*

---

**Step 15 — Rate Karan Singh (under-performer)**
Login: `arun.kumar@infobuz.in` → Team Appraisal → FY 2024-25

**Karan's workspace:**
- KPI: MRR target 20K → actual 15K → **75% achievement** (red bar)
  - **Gap alert (amber):** "Self-rated 2/5 but achievement is 75% (implied ≈3.75/5). Self-rating below implied — employee may have under-rated themselves."
  - Self-rating: 2 | Self-comment: "Lost Infosys account May (₹8K). Q3-Q4 recovery in progress."
  - Check-ins: "May 2024: Infosys churned to competitor" → trajectory improving
  - Manager rating: **2 / Below Expectation** (seed; manager agreed with self-assessment context)
  - Manager comment: "Consistent under-delivery Q1-Q2. Q3 shows green shoots. PIP if FY26 starts weak."

> *"The gap alert flags that the math suggests a higher rating than Karan gave himself — but the manager has check-in context and agreed with 2. The system surfaces this for discussion."*

---

**Key Team Appraisal Features:**
| Feature | Description |
|---|---|
| Reportee list | All direct reports with self-completion %, estimated score preview |
| 2-panel layout | Left: employee list; right: full rating workspace |
| Score comparison | Manager score vs employee self-score side-by-side |
| Prior cycle context | Last cycle score + band shown for each reportee |
| Gap alert | Flags when self-rating significantly differs from achievement % |
| Check-in history | Monthly entries visible for numeric targets |
| OKR/KRA nesting | Same visual hierarchy as Self Appraisal |
| Live score update | Manager's estimated score recalculates as they rate |
| Per-target save | Independent saves — no risk of losing all ratings on error |
| Read-only view | Closed cycles are viewable but not editable |

---

## Historical Performance (Closed Cycles)

| Cycle | ARR | CEO | VP Sales | L3 North | L3 South | Ankit (L6) | Karan (L6) |
|---|---|---|---|---|---|---|---|
| FY 2022-23 | ₹48 Cr | Exceeds (4.1) | Meets (3.1) | — | — | — | — |
| FY 2023-24 | ₹74 Cr | Exceptional (5.0) | Exceeds (4.0) | Exceeds (4.8) | Meets (3.0) | — | — |
| FY 2024-25 | ₹99 Cr | Exceptional (5.0) | Exceptional (5.0) | Exceptional (5.0) | Exceeds (4.0) | Exceptional (5.0) | Below (2.0) |
| FY 2025-26 | Target ₹200 Cr | (goal-setting) | (goal-setting) | (goal-setting) | (goal-setting) | (proposed) | (proposed) |

---

## Key Talking Points

### Cascading
1. **Top-down is done** — L1 to L5 approved chain navigable in under 2 minutes
2. **Bottom-up is live** — L6 associates proposed without waiting; appear in manager's Team Targets immediately
3. **Gap tells a story** — ₹0.78 Cr proposed vs ₹12 Cr assigned; system surfaces the honest shortfall
4. **"Link to My Target"** is the bidirectional reconciliation moment — manager connects two flows in one action
5. **Org Drilldown** closes the loop — CEO verifies cascade reaches frontline, not just VPs

### Self Appraisal
6. **Check-in pre-fill** — no re-entry: monthly actuals auto-populate the appraisal form
7. **Score preview** — employee sees their estimated band before the manager rates
8. **Honest under-rating** — Karan rated himself 2; system records exactly that, with his reasoning

### Team Appraisal
9. **Gap alert** — manager instantly sees where self-rating diverges from achievement math
10. **Context without meetings** — 12 months of check-ins + self-comment tell the full story
11. **Prior cycle anchor** — FY24 performance shown alongside FY25 to identify trends

---

## Ankit Joshi — Complete Target Set (FY 2024-25, reference)

| Type | Title | Planned | Actual | Ach% | Self | Manager | Final |
|---|---|---|---|---|---|---|---|
| KPI | Monthly New Business MRR | ₹20,000 | ₹22,000 | 110% | 5 | 5 | 5 |
| KRA | New Business Acquisition | — | — | — | 5 | 5 | 5 |

**Check-in highlight:** September 2024 — "BSNL Phase-1 signed ₹6K MRR!" | March 2025 — "Tata Comm + BSNL Phase-2 live"

---

## Karan Singh — Complete Target Set (FY 2024-25, reference)

| Type | Title | Planned | Actual | Ach% | Self | Manager | Final |
|---|---|---|---|---|---|---|---|
| KPI | Monthly New Business MRR | ₹20,000 | ₹15,000 | 75% | 2 | 2 | 2 |
| KRA | New Business Acquisition | — | — | — | 2 | 2 | 2 |

**Trajectory:** May: Infosys churned (60%) → gradual recovery → March 2025: back to ₹20K, but annual avg = ₹15K

---

## Ankit Joshi — FY 2025-26 Bottom-Up Proposal (reference)

| Type | Title | Value | Weight | Status |
|---|---|---|---|---|
| OKR Key Result | My Annual Sales Revenue Contribution | ₹0.30 Cr | 20% | Proposed |
| KRA | New Business Acquisition | — | 30% | Proposed |
| KPI | My New Business MRR Target | ₹25,000/mo | 50% | Proposed |
| Competency | Sales Execution | — | 50% of comp | Proposed |
| Competency | Customer Focus | — | 30% of comp | Proposed |
| Competency | Adaptability & Learning | — | 20% of comp | Proposed |

*Over-plan note: +₹5K vs ₹20K baseline (+25%). BSNL Phase-2 ₹8K MRR contract ready Apr 15.*
