# InfoBuz Cascading Demo — Reference Guide

**App:** `http://localhost:5173` | **Password (all accounts):** `password123`
**Cycle:** FY 2025-26 Annual | **Mode:** Bidirectional | **Framework:** Hybrid (OKR + KRA-KPI + Competency)

---

## The Story

> The CEO sets ₹200 Cr ARR. It cascades down through VP → Director → Area Manager → Team Lead.
> At the frontline, junior executives don't wait — they propose their own bottom-up targets.
> The manager reconciles both: links proposals to the top-down plan, checks for gaps, and approves.

---

## Quick Login Reference

| Login Email | Name | Level | Role | Key Target |
|---|---|---|---|---|
| `rahul.mehta@infobuz.in` | Rahul Mehta | L1 CEO | Admin | OKR Obj: Scale to ₹200 Cr ARR |
| `vikram.joshi@infobuz.in` | Vikram Joshi | L2 VP Sales | Manager | KR: Sales Revenue = ₹150 Cr |
| `amit.sharma@infobuz.in` | Amit Sharma | L3 Director (North) | Manager | KR: North Region Revenue = ₹50 Cr |
| `sanjay.reddy@infobuz.in` | Sanjay Reddy | L4 Area Manager | Manager | KR: North Area 1 = ₹28 Cr |
| `rohit.verma@infobuz.in` | Rohit Verma | L5 Team Lead | Manager | KR: Team Revenue = ₹12 Cr (top-down) |
| `ankit.joshi@infobuz.in` | Ankit Joshi | L6 Executive | Employee | KR: ₹0.30 Cr (bottom-up, proposed) |
| `maya.sharma@infobuz.in` | Maya Sharma | L6 Executive | Employee | KR: ₹0.24 Cr (bottom-up, proposed) |
| `vikash.kumar@infobuz.in` | Vikash Kumar | L6 Executive | Employee | KR: ₹0.24 Cr (bottom-up, proposed) |

---

## Revenue OKR Cascade Chain

```
Rahul Mehta (CEO · L1)       OKR: "Scale InfoBuz to ₹200 Cr ARR"
                               KR: Annual Recurring Revenue = ₹200 Cr ✓ Approved
                                ↓
Vikram Joshi (VP · L2)         KR: Sales Revenue Contribution = ₹150 Cr ✓ Approved
                                ↓
Amit Sharma (Director · L3)    KR: North Region Revenue = ₹50 Cr ✓ Approved
                                ↓
Sanjay Reddy (Area Mgr · L4)   KR: North Area 1 Revenue = ₹28 Cr ✓ Approved
                                ↓
Rohit Verma (Team Lead · L5)   KR: L5.1 Team Revenue = ₹12 Cr ✓ Approved
                                ↓ (gap here — only ₹0.78 Cr proposed so far)
Ankit Joshi  (Executive · L6)  KR: My Revenue Contribution = ₹0.30 Cr ⏳ Proposed
Maya Sharma  (Executive · L6)  KR: My Revenue Contribution = ₹0.24 Cr ⏳ Proposed
Vikash Kumar (Executive · L6)  KR: My Revenue Contribution = ₹0.24 Cr ⏳ Proposed
```

**Gap to show:** ₹0.78 Cr team proposals vs ₹12 Cr Rohit's assignment (~6.5% coverage)

---

## Demo Flow

### Part A — Top-Down OKR Cascade

**Step 1 — CEO sets the company OKR**
Login: `rahul.mehta@infobuz.in`
- My Targets → show Objective: *"Scale InfoBuz to ₹200 Cr ARR"*
- Expand KRs: ARR ₹200 Cr (20% wt), New Customer Logos 120 (10% wt) — both **Approved**
- Show all 4 Objectives (ARR, Product, NPS, Culture) — CEO owns all pillars
- Team Targets → Org Drilldown → full tree collapsed; expand VP Sales to begin the cascade

> *"The CEO has set the north star. Every person below sees exactly what the company needs."*

---

**Step 2 — VP Sales owns his portion**
Login: `vikram.joshi@infobuz.in`
- My Targets → KR: *"Sales Revenue Contribution FY26"* = **₹150 Cr** (wt: 40%)
  - Parent: CEO's ARR KR — the link is explicit
- Team Targets → Cascade Coverage → see ₹150 Cr broken into Amit Sharma (North) + Priya Patel (South)

> *"The VP sees exactly who owns what portion of his commitment to the CEO."*

---

**Step 3 — Director takes the North Region slice**
Login: `amit.sharma@infobuz.in`
- My Targets → KR: *"North Region Revenue"* = **₹50 Cr** (linked to Vikram's ₹150 Cr)
- Team Targets → Sanjay Reddy holds ₹28 Cr of that ₹50 Cr

> *"Every level sees their own target AND how it breaks down into the team below."*

---

**Step 4 — Team Lead sees his assignment and the gap** ⭐ Key moment
Login: `rohit.verma@infobuz.in`
- My Targets → KR: *"L5.1 Team Revenue Contribution"* = **₹12 Cr** (linked to Sanjay's ₹28 Cr)
- Team Targets → Cascade Coverage tab
  - Team proposals total: **₹0.78 Cr** vs target **₹12 Cr** → coverage ~6.5% (red alert)

> *"This is where bidirectional mode shows its power — Rohit sees the gap before the cycle closes. He must act."*

---

### Part B — Bottom-Up Proposals (Frontline Self-Proposes)

**Step 5 — Junior executive proposes his own targets**
Login: `ankit.joshi@infobuz.in`
- My Targets → show all **Proposed** (bottom-up) targets:
  - OKR KR: *"My Annual Sales Revenue Contribution"* = ₹0.30 Cr | **Proposed**, no parent link yet
  - KRA: *"New Business Acquisition"*
  - KPI: *"My New Business MRR Target"* = ₹25,000/month
  - Competencies: Sales Execution (50%), Customer Focus (30%), Adaptability (20%)
- Note the "Proposed" status badge — Ankit can still edit

> *"Ankit didn't wait for instructions. He knew his territory and proposed what he can deliver."*

---

**Step 6 — Another team member proposes independently**
Login: `maya.sharma@infobuz.in`
- Same structure: OKR KR ₹0.24 Cr proposed, KPI ₹20,000 MRR, KRA, 3 Competencies
- Status: Proposed, no parent link

> *"Every junior executive on Rohit's team has independently proposed targets. Now the manager reconciles."*

---

### Part C — Manager Reconciles Both Flows ⭐ Bidirectional in Action

**Step 7 — Rohit reviews proposals and links them**
Login: `rohit.verma@infobuz.in`
- Team Targets → Direct Reportees tab → see Ankit, Maya, Vikash with their proposals
- Click Ankit's OKR KR → **"Link to My Target"** button
  - Select: *"L5.1 Team Revenue Contribution"* (₹12 Cr) as parent
  - Status: Proposed → **Linked**
- Repeat for Maya (₹0.24 Cr) and Vikash (₹0.24 Cr)

> *"'Link to My Target' is the reconciliation moment — the manager connects bottom-up proposals to the top-down plan."*

---

**Step 8 — The gap is still visible and honest**
- After linking all three: ₹0.30 + ₹0.24 + ₹0.24 = **₹0.78 Cr linked vs ₹12 Cr target**
- Cascade Coverage still shows ~6.5% coverage
- Point: the system surfaces reality — Rohit must either revise targets upward or escalate to Sanjay

> *"The system doesn't hide the gap. Now Rohit has a conversation to have with his manager."*

---

**Step 9 — Approve the linked targets**
- Team Targets → Approve each linked target
- Status: Proposed → Linked → **Approved**
- Targets are frozen; employees can no longer edit
- Cascade Coverage updates to show ₹0.78 Cr approved under ₹12 Cr

---

### Part D — CEO Sees the Full Picture

**Step 10 — CEO drills down to the frontline**
Login: `rahul.mehta@infobuz.in`
- Team Targets → **Org Drilldown** tab → start collapsed at VP level
- Expand Vikram Joshi (₹150 Cr) → Amit Sharma (₹50 Cr) → Sanjay Reddy (₹28 Cr) → Rohit Verma (₹12 Cr) → Ankit / Maya / Vikash
- Each node shows OKR / KRA-KPI / Competency status indicators
- One view from CEO to frontline associate

> *"The CEO can verify the cascade reaches the frontline — not just his VPs. Nothing is hidden."*

---

## Key Talking Points

1. **Top-down is done** — L1 to L5 chain fully approved; navigate it in under 2 minutes
2. **Bottom-up is live** — L6 associates proposed targets without waiting; appear in manager's Team Targets immediately
3. **The gap tells a real story** — ₹0.78 Cr proposed vs ₹12 Cr assigned; system surfaces reality
4. **"Link to My Target"** is the unique bidirectional moment — manager connects the two flows with one action
5. **Org Drilldown** closes the loop — CEO verifies cascade reaches the frontline, not just VPs

---

## Ankit Joshi's Full Target Set (for reference)

| Type | Title | Value | Weight | Status |
|---|---|---|---|---|
| OKR Key Result | My Annual Sales Revenue Contribution | ₹0.30 Cr | 20% | Proposed |
| KRA | New Business Acquisition | — | 30% | Proposed |
| KPI | My New Business MRR Target | ₹25,000/mo | 50% | Proposed |
| Competency | Sales Execution | — | 50% of comp | Proposed |
| Competency | Customer Focus | — | 30% of comp | Proposed |
| Competency | Adaptability & Learning | — | 20% of comp | Proposed |
