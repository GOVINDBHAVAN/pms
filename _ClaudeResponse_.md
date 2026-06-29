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