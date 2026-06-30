# Create demo company with bidirectional cascade OKRs

NexaFlow Technologies — new demo company with a textbook bidirectional cascade.

Org profile: Pure OKR framework, cascade_mode: bidirectional, 24 employees across Revenue & Growth, Product & Platform, Customer Experience, and People & Ops.

3-cycle story:

Cycle	Status	Cascade
FY 2023-24	Closed	Pure top-down — NexaFlow's first year
FY 2024-25	Review	Bidirectional resolved — Head Platform and Head Onboarding both had self-proposed OKRs that VP linked mid-cycle; now both tracks are active with ratings underway
FY 2025-26	Goal Setting	Bidirectional live/in-progress
FY 2025-26 bidirectional state (the main showcase):

VP Revenue → Heads of Enterprise/SMB: Pure top-down quota allocation — no bottom-up here, intentional contrast
VP Product ← Head Platform (Divya, NX-008): Has a top_down draft KR AND a bottom_up proposed OKR ("Sub-5min CI/CD + self-healing infra") with parentId=null — VP must link it before cycle goes active
VP Product ← Head PM (Aditya, NX-009): proposed OKR "Ship 3 customer-requested feature clusters" — data-driven from NPS verbatims
VP CX ← Head Onboarding (Sunita, NX-010): Top-down TTV KR + proposed activation OKR grounded in FY24-25 churn analysis
VP CX ← Head Support (Ganesh, NX-011): Entire OKR set is proposed — no top-down assignment yet; two objectives covering SLA excellence and knowledge-base building
Head Platform ← Sr Backend Eng (Sneha, NX-014): proposed quality OKR ("Zero P0 bugs") rooted in a real FY24-25 incident
This creates a V13-blocked cycle — 5 unlinked bottom-up proposals mean the cycle cannot advance to active until each VP links them. 





# Create demo company with bidirectional cascade OKRs

What was built
New files:

server/db/seeds/04_infobuz_targets.js — 4-cycle targets for InfoBuz
server/db/seeds/03_infobuz.js — export fix (seed wrapper, not raw function)
server/index.js — wired both InfoBuz seeds
4 cycles seeded:

Cycle	Status	ARR	Cascade
FY 2022-23	closed	₹50 Cr	top_down — CEO + VP only
FY 2023-24	closed	₹75 Cr	top_down — CEO + VP + L3
FY 2024-25	closed	₹100 Cr	top_down — full L1→L6 + monthly check-ins
FY 2025-26	goal_setting	₹200 Cr	bidirectional LIVE
How to test the cascade POC (FY 2025-26)
Screen: My Targets

Login as	What you see
ankit.joshi@infobuz.in	KPI: 25,000 MRR proposed, is_over_planned=1, ratio 1.25, over-plan note with BSNL/HDFC pipeline evidence
karan.singh@infobuz.in	KPI: 15,000 MRR proposed (5K below 20K baseline), description explains Infosys churn
Screen: Team Targets

Login as	What you see
rohit.verma@infobuz.in (L5.1)	3 reportee proposals: Ankit 25K (+5K) + Maya 20K + Vikash 20K = 65K team; Rohit's own contribution shows 30K (reduced by 5K — burden relieved by Ankit's over-plan)
arun.kumar@infobuz.in (L5.3)	Karan 15K (-5K) + Preethi 20K + Sujith 20K = 55K (5K short); Arun's own shows 40K (raised by 5K to absorb Karan's gap)
vikram.joshi@infobuz.in (VP Sales L2)	Full team rollup: North 315K (+5K from Ankit) vs South 550K, total 950K exactly — over/under net-cancel
V13 block: All 18 L6 proposals have parentId=null → cycle cannot advance to active until a manager links each proposal to a top-down target.





# Explain Link to My Target button in goal approval

How the flow works (bidirectional cascade)
Why there's no Approve button for proposed targets:

In bidirectional cascade, employees can self-propose targets without waiting for the manager. But the cascade chain rule requires every target to have a parent_target_id before it can be approved — otherwise the cascade tree is broken and the cycle can't advance (Rule V13).

So the flow is forced to be two steps:

Step	Action	Status change
1	Manager clicks "Link to My Target" → selects which of their own approved targets this contributes to	proposed → linked
2	Approve button appears → manager reviews and approves	linked → approved
What I added to the UI:

A teal explanatory banner appears on proposed targets: "STEP 1 OF 2 — Link this proposal to your target. This is a bottom-up proposal… An Approve button will appear after you link it."
For linked targets (after step 1 is done), a label shows "Step 2 of 2: approve or reject" next to the Approve button
The V9 blocker (no approved targets yet) is a separate issue — Rohit Verma needs to get his own targets approved before he can approve anyone else's, regardless of the link/propose f



# Improve Team Targets screen visibility for managers

Everything looks correct:

Arun Kumar (L5.3) goal targets: KPI weight: 70 + KRA weight: 30 = 100%
Arun Kumar competency targets: Leadership 40 + Ownership 35 + Strategic 25 = 100%
L6.1 Ankit goal: weight: 100 ✓ | L6.1 competencies: 50 + 50 = 100%
L6.7 Karan goal: weight: 100 ✓ | L6.7 competencies: 60 + 40 = 100%
All other L6 employees: single goal at weight: 100 ✓
To apply all seed data changes, run these commands:


# 1. Reset the database
.\reset-db.ps1

# 2. Start the server (it will reseed automatically)
.\dev.ps1
Here's a summary of everything that's now demo-ready:

Seed data (04_infobuz_targets.js)

L1 CEO → L2 VP → L3 Regionals → L4 Area Managers → L5 Sr Executives: all approved — no more V9 block for Arun Kumar
L6 (18 employees): bottom-up MRR proposals at weight: 100% (was 80, which violated V1)
Ankit Joshi (L6.1): commits ₹25,000 vs ₹20,000 baseline (over-plan +25%), plus 2 competencies
Karan Singh (L6.7): commits ₹15,000 vs ₹20,000 baseline (under by ₹5K), plus 2 competencies — this is the key demo story where Arun must personally absorb the gap
Arun Kumar (L5.3): 3 competency targets (Leadership/Ownership/Strategic, summing 100%) — now has a full performance profile for the demo
Frontend (from previous session)

TeamTargetsPage: TeamCoverageWidget shows the cascade math — team total vs Arun's own target, with per-person breakdown and the gap callout
MyTargetsPage: ContextPanel redesigned to show allocation baseline vs committed amount comparison; over/under delta badge on each target row



# Verify InfoBuz OKR and KRA-KPI mapping for all employees

Summary of what was fixed:

Every InfoBuz employee now has in FY 2025-26:

## Layer	OKR KR	KRA	KPI	Competencies
CEO (L1)	4 Objectives × KRs	Revenue Growth	—	3
VP Sales (L2)	✅ linked to CEO ARR KR	2 KRAs	MRR KPI	3
VP Product (L2)	✅ Uptime + Velocity	Quality	Bug Escape Rate	3
VP CX (L2)	✅ NPS + Churn	Retention	CSAT	3
L3 HR (reports CEO)	✅ eNPS + Attrition	People Dev	—	3
L3 Sales ×2	✅ linked to VP Sales KR	Revenue Growth	MRR KPI	3
L3 Eng / CX	✅ linked to VP Product/CX KRs	Quality/CX	Bug Rate/Tickets	3
L4 Sales ×3	✅ cascade chain	Revenue/NBA	MRR	3
L4 Eng / CX	✅ cascade chain	Quality/CX	Bug Rate/Tickets	3
L5 Sales ×6	✅ cascade chain	NBA	MRR	3
L5 Eng ×2 / CX	✅ cascade chain	Quality/CX	Bug Rate/CSAT	3
L6 Sales ×18	✅ proposed (unlinked — V13 demo)	NBA	MRR	3

Zero employees without OKR contribution, KRA, or competency. The V13 block is preserved (18 L6 OKR KRs unlinked, blocking cycle advance). Ankit Joshi's over-plan and Karan Singh's under-plan narratives are intact.


## InfoBuz Employee Directory by Level
## L1 — CEO
Name	Email	Role
Rahul Mehta	rahul.mehta@infobuz.in	admin

## L2 — VPs
Name	Email	Dept	Notes
Vikram Joshi	vikram.joshi@infobuz.in	Sales	VP Sales
Karthik Menon	karthik.menon@infobuz.in	Engineering	VP Product
Divya Subramaniam	divya.s@infobuz.in	CX	VP CX

## L3 — Heads
Name	Email	Dept	Notes
Amit Sharma	amit.sharma@infobuz.in	Sales	North Region Head
Priya Patel	priya.patel@infobuz.in	Sales	South Region Head
Sneha Krishnan	sneha.krishnan@infobuz.in	Engineering	Eng Head
Ganesh Iyer	ganesh.iyer@infobuz.in	CX	CX Head
Pooja Mehta	pooja.mehta@infobuz.in	HR	HR Head (reports to CEO)

## L4 — Area Managers
Name	Email	Dept	Notes
Sanjay Reddy	sanjay.reddy@infobuz.in	Sales	North Area 1 → under Amit
Deepak Rao	deepak.rao@infobuz.in	Sales	South Area 2 → under Priya
Sunita Iyer	sunita.iyer@infobuz.in	Sales	Solo quota → under Priya
Manish Verma	manish.verma@infobuz.in	Engineering	L4 Eng
Ritika Gupta	ritika.gupta@infobuz.in	CX	L4 CX

## L5 — Senior Executives
Name	Email	Dept	Notes
Rohit Verma	rohit.verma@infobuz.in	Sales	★ Own burden -5K (Ankit over-committed)
Kavya Nair	kavya.nair@infobuz.in	Sales	Standard L5
Arun Kumar	arun.kumar@infobuz.in	Sales	★ Own burden +5K (absorbs Karan's gap)
Neha Singh	neha.singh@infobuz.in	Sales	Standard L5
Ravi Joshi	ravi.joshi@infobuz.in	Sales	Standard L5
Pooja Bose	pooja.bose@infobuz.in	Sales	Standard L5
Zubair Ahmed	zubair.ahmed@infobuz.in	Engineering	L5 Eng
Ankita Rao	ankita.rao@infobuz.in	Engineering	L5 Eng
Rishab Pillai	rishab.pillai@infobuz.in	CX	L5 CX

## L6 — Executives (all bottom-up proposals)
Name	Email	MRR Target	Notes
Ankit Joshi	ankit.joshi@infobuz.in	25,000	★ OVER-PLAN (+5K vs 20K baseline)
Maya Sharma	maya.sharma@infobuz.in	20,000	Standard, under Rohit
Vikash Kumar	vikash.kumar@infobuz.in	20,000	Standard, under Rohit
Swati Gupta	swati.gupta@infobuz.in	20,000	Standard, under Kavya
Mohit Rao	mohit.rao@infobuz.in	20,000	Standard, under Kavya
Divya Pillai	divya.pillai@infobuz.in	20,000	Standard, under Kavya
Karan Singh	karan.singh@infobuz.in	15,000	★ UNDER-PLAN (-5K, FY25 PIP narrative)
Preethi Nair	preethi.nair@infobuz.in	20,000	Standard, under Arun
Sujith Kumar	sujith.kumar@infobuz.in	20,000	Standard, under Arun
Ritu Verma	ritu.verma@infobuz.in	20,000	Standard, under Neha
Akash Mehta	akash.mehta@infobuz.in	20,000	Standard, under Neha
Sneha Rao	sneha.rao@infobuz.in	20,000	Standard, under Neha
Rahul Patel	rahul.patel@infobuz.in	20,000	Standard, under Ravi
Ankita Dubey	ankita.dubey@infobuz.in	20,000	Standard, under Ravi
Vishal Kumar	vishal.kumar@infobuz.in	20,000	Standard, under Ravi
Meena Gupta	meena.gupta@infobuz.in	20,000	Standard, under Pooja B
Sachin Nair	sachin.nair@infobuz.in	20,000	Standard, under Pooja B
Tanvi Pillai	tanvi.pillai@infobuz.in	20,000	Standard, under Pooja B

## Key test scenarios:

Cascade demo: 
Login as Rahul Mehta (CEO) → Vikram Joshi (VP) → Amit/Priya → Sanjay/Deepak → Rohit/Arun → Ankit/Karan
Over-plan bubble-up: Ankit Joshi → his manager Rohit Verma (burden reduced)
Under-plan gap absorption: Karan Singh → his manager Arun Kumar (burden raised)
Non-sales OKR cascade: Karthik Menon → Sneha Krishnan → Manish Verma → Zubair/Ankita
V13 block demo: Any admin login → cycle cannot advance to active because L6 OKR KRs are unlinked
