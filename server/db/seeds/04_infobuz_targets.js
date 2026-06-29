/**
 * 04_infobuz_targets.js — InfoBuz Technologies multi-year targets seed
 *
 * 4-year simulation:
 *   FY 2022-23  closed  ₹50 Cr ARR  — CEO + VP Sales only
 *   FY 2023-24  closed  ₹75 Cr ARR  — CEO + VP + L3 with actuals
 *   FY 2024-25  closed  ₹100 Cr ARR — full hierarchy CEO→L6 + monthly check-ins
 *   FY 2025-26  goal_setting ₹200 Cr — BIDIRECTIONAL LIVE (V13 blocking):
 *     Top-down:  CEO → VP → L3 → L4 → L5: ALL APPROVED (demo-ready)
 *     Bottom-up: ALL L6 proposed (unlinked, blocking cycle advance)
 *       L6.1 Ankit Joshi  OVER-PLANS  25,000 vs 20,000 (+5K) → L5.1 own burden -5K
 *       L6.7 Karan Singh  UNDER-PLANS 15,000 vs 20,000 (-5K) → L5.3 self-absorbs +5K
 *
 * Cascade math for FY 2025-26 MRR targets:
 *   L6 baseline:  20,000  |  L5 team: 95,000  |  L4.1: 240,000  |  L4.2: 430,000
 *   L3.1: 310,000          |  L3.2: 550,000    |  L2 VP Sales: 950,000
 *
 * POC screens:
 *   My Targets  → L6.1 sees 25K proposal with over-plan flag
 *               → L6.7 sees 15K proposal (under baseline)
 *   Team Targets → L5.1 Rohit sees Ankit's +5K; own contribution reduced to 30K
 *               → L5.3 Arun sees Karan's -5K; own contribution raised to 40K
 */

const { getDb, saveDb } = require('../database');

function rows(res) {
  if (!res.length || !res[0].values.length) return [];
  const cols = res[0].columns;
  return res[0].values.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]])));
}
function lastId(db) { return db.exec('SELECT last_insert_rowid()')[0].values[0][0]; }
function getOrg(db, name) {
  const r = db.exec(`SELECT id FROM organizations WHERE name = ?`, [name]);
  return r.length && r[0].values.length ? r[0].values[0][0] : null;
}
function getEmpMap(db, orgId) {
  const map = {};
  rows(db.exec(`SELECT id, emp_code FROM employees WHERE org_id = ?`, [orgId]))
    .forEach(e => { map[e.emp_code] = e.id; });
  return map;
}

function upsertCycle(db, orgId, c, createdBy) {
  const existing = db.exec(
    `SELECT id FROM review_cycles WHERE org_id = ? AND name = ?`, [orgId, c.name]
  );
  if (existing.length && existing[0].values.length) {
    const id = existing[0].values[0][0];
    db.run(`UPDATE review_cycles SET status = ? WHERE id = ?`, [c.status, id]);
    return id;
  }
  db.run(`
    INSERT INTO review_cycles
      (org_id, name, cycle_type, period_start, period_end,
       goal_set_open, goal_set_close, approval_open, approval_close,
       review_open, review_close, calibration_open, calibration_close,
       cascade_mode, status, check_in_allowed, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [orgId, c.name, 'annual', c.start, c.end,
     c.gsOpen, c.gsClose, c.apvOpen ?? null, c.apvClose ?? null,
     c.rvOpen, c.rvClose,
     c.calOpen ?? null, c.calClose ?? null,
     c.cascade, c.status, 1, createdBy]
  );
  return lastId(db);
}

function insertTarget(db, t) {
  db.run(`
    INSERT INTO targets
      (org_id, cycle_id, employee_id, parent_target_id, cascade_direction,
       framework_type, title, description, unit, measurement_type,
       company_target, planned_target, stretch_target, actual_value,
       is_over_planned, over_plan_ratio, over_plan_note, over_plan_approved,
       weight, hierarchy_level, status,
       self_rating, self_comment, self_rated_at,
       manager_rating, manager_comment, manager_rated_at, final_rating,
       submitted_at, approved_at, approved_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      t.orgId, t.cycleId, t.empId, t.parentId ?? null, t.dir ?? 'top_down',
      t.type, t.title, t.desc ?? null, t.unit ?? null, t.measure ?? 'higher_better',
      t.companyTarget ?? null, t.planned ?? null, t.stretch ?? null, t.actual ?? null,
      t.isOverPlanned ?? 0, t.overRatio ?? null, t.overNote ?? null, t.overApproved ?? 0,
      t.weight ?? 0, t.level ?? null, t.status ?? 'draft',
      t.selfRating ?? null, t.selfComment ?? null, t.selfRatedAt ?? null,
      t.managerRating ?? null, t.managerComment ?? null, t.managerRatedAt ?? null,
      t.finalRating ?? null,
      t.submittedAt ?? null, t.approvedAt ?? null, t.approvedBy ?? null,
    ]
  );
  return lastId(db);
}

function insertCheckin(db, c) {
  db.run(`
    INSERT INTO checkins
      (target_id, employee_id, cycle_id, period_type, period_label,
       actual_value, progress_pct, notes, acknowledged_by, acknowledged_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [c.targetId, c.empId, c.cycleId, c.periodType, c.label,
     c.actual ?? null, c.pct ?? null, c.notes ?? null,
     c.ackedBy ?? null, c.ackedAt ?? null]
  );
}

function perfSummary(db, cycleId, empId, goalScore, finalScore, band, date) {
  db.run(
    `INSERT OR IGNORE INTO performance_summary
       (cycle_id, employee_id, goal_score, competency_score, final_score,
        performance_band, is_pip_triggered, computed_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    [cycleId, empId, goalScore, null, finalScore, band, 0, date]
  );
}

function seedInfoBuzTargets(db) {
  const orgId = getOrg(db, 'InfoBuz Technologies');
  if (!orgId) { console.log('InfoBuz Technologies not found — skipping targets'); return; }

  const existing = db.exec(`SELECT COUNT(*) FROM targets WHERE org_id = ?`, [orgId]);
  if (existing[0].values[0][0] > 0) {
    console.log('InfoBuz targets already seeded — skipping');
    return;
  }

  const e = getEmpMap(db, orgId);
  const CEO  = e['IB-001'];
  const vpSal = e['IB-S01']; // Vikram Joshi, L2 VP Sales
  const l3n  = e['IB-S02']; // Amit Sharma, L3.1 North
  const l3s  = e['IB-S03']; // Priya Patel, L3.2 South
  const l41  = e['IB-S04']; // Sanjay Reddy, L4.1
  const l42  = e['IB-S05']; // Deepak Rao, L4.2
  const l43  = e['IB-S06']; // Sunita Iyer, L4.3
  const l51  = e['IB-S07']; // Rohit Verma, L5.1 (L6.1 over-plan relieves burden)
  const l52  = e['IB-S08']; // Kavya Nair, L5.2
  const l53  = e['IB-S09']; // Arun Kumar, L5.3 (absorbs L6.7 gap)
  const l54  = e['IB-S10']; // Neha Singh, L5.4
  const l55  = e['IB-S11']; // Ravi Joshi, L5.5
  const l56  = e['IB-S12']; // Pooja Bose, L5.6
  const l61  = e['IB-S13']; // Ankit Joshi  — OVER-PLANS 25K
  const l62  = e['IB-S14']; // Maya Sharma
  const l63  = e['IB-S15']; // Vikash Kumar
  const l64  = e['IB-S16']; // Swati Gupta
  const l65  = e['IB-S17']; // Mohit Rao
  const l66  = e['IB-S18']; // Divya Pillai
  const l67  = e['IB-S19']; // Karan Singh  — UNDER-PLANS 15K
  const l68  = e['IB-S20']; // Preethi Nair
  const l69  = e['IB-S21']; // Sujith Kumar
  const l610 = e['IB-S22']; // Ritu Verma
  const l611 = e['IB-S23']; // Akash Mehta
  const l612 = e['IB-S24']; // Sneha Rao
  const l613 = e['IB-S25']; // Rahul Patel
  const l614 = e['IB-S26']; // Ankita Dubey
  const l615 = e['IB-S27']; // Vishal Kumar
  const l616 = e['IB-S28']; // Meena Gupta
  const l617 = e['IB-S29']; // Sachin Nair
  const l618 = e['IB-S30']; // Tanvi Pillai

  console.log('Seeding InfoBuz 4-cycle targets (FY22-23 through FY25-26)...');

  // ═══════════════════════════════════════════════════════════════════════════
  // CYCLE 1 — FY 2022-23  (closed, ₹50 Cr ARR — Company's early growth year)
  // ═══════════════════════════════════════════════════════════════════════════
  const cy2223 = upsertCycle(db, orgId, {
    name: 'FY 2022-23 Annual', start: '2022-04-01', end: '2023-03-31',
    gsOpen: '2022-04-01', gsClose: '2022-05-15',
    apvOpen: '2022-05-16', apvClose: '2022-05-31',
    rvOpen: '2023-02-01', rvClose: '2023-03-15',
    calOpen: '2023-03-16', calClose: '2023-03-31',
    cascade: 'top_down', status: 'closed',
  }, CEO);

  // CEO
  const c1Obj = insertTarget(db, {
    orgId, cycleId: cy2223, empId: CEO, type: 'okr_objective', dir: 'top_down',
    title: 'Establish InfoBuz as ₹50 Cr ARR B2B SaaS Company',
    weight: 60, level: 1, status: 'approved',
    submittedAt: '2022-04-10', approvedAt: '2022-04-12', approvedBy: CEO,
    selfRating: 4, selfComment: 'Achieved ₹48 Cr ARR — strong foundation built', selfRatedAt: '2023-03-10',
    managerRating: 4, managerComment: 'On-track. ₹48 Cr vs ₹50 Cr — close enough.', managerRatedAt: '2023-03-20',
    finalRating: 4,
  });
  const c1ARR = insertTarget(db, {
    orgId, cycleId: cy2223, empId: CEO, parentId: c1Obj, type: 'okr_kr', dir: 'top_down',
    title: 'Annual Recurring Revenue (ARR)', unit: 'INR Cr',
    companyTarget: 50, planned: 50, stretch: 55, actual: 48,
    weight: 35, level: 1, status: 'approved',
    submittedAt: '2022-04-10', approvedAt: '2022-04-12', approvedBy: CEO,
    selfRating: 4, selfComment: '48 Cr — 96% of target', selfRatedAt: '2023-03-10',
    managerRating: 4, managerRatedAt: '2023-03-20', finalRating: 4,
  });
  insertTarget(db, {
    orgId, cycleId: cy2223, empId: CEO, parentId: c1Obj, type: 'okr_kr', dir: 'top_down',
    title: 'New Customer Logos', unit: 'count',
    companyTarget: 40, planned: 40, actual: 44,
    weight: 15, level: 1, status: 'approved',
    submittedAt: '2022-04-10', approvedAt: '2022-04-12', approvedBy: CEO,
    selfRating: 5, selfComment: '44 new logos — exceeded target', selfRatedAt: '2023-03-10',
    managerRating: 5, managerRatedAt: '2023-03-20', finalRating: 5,
  });
  const c1KRA = insertTarget(db, {
    orgId, cycleId: cy2223, empId: CEO, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth',
    weight: 40, level: 1, status: 'approved',
    submittedAt: '2022-04-10', approvedAt: '2022-04-12', approvedBy: CEO,
    selfRating: 4, selfRatedAt: '2023-03-10', managerRating: 4, managerRatedAt: '2023-03-20', finalRating: 4,
  });

  // VP Sales FY22-23
  insertTarget(db, {
    orgId, cycleId: cy2223, empId: vpSal, parentId: c1ARR, type: 'okr_kr', dir: 'top_down',
    title: 'Sales Revenue Contribution FY23', unit: 'INR Cr',
    companyTarget: 35, planned: 35, stretch: 38, actual: 33,
    weight: 40, level: 2, status: 'approved',
    submittedAt: '2022-04-15', approvedAt: '2022-04-22', approvedBy: CEO,
    selfRating: 3, selfComment: '33 Cr vs 35 Cr — market headwinds in H1', selfRatedAt: '2023-03-12',
    managerRating: 3, managerComment: 'Acceptable given market conditions; Q4 recovery was solid', managerRatedAt: '2023-03-22',
    finalRating: 3,
  });
  insertTarget(db, {
    orgId, cycleId: cy2223, empId: vpSal, parentId: c1KRA, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth', weight: 30, level: 2, status: 'approved',
    submittedAt: '2022-04-15', approvedAt: '2022-04-22', approvedBy: CEO,
    selfRating: 3, selfRatedAt: '2023-03-12', managerRating: 3, managerRatedAt: '2023-03-22', finalRating: 3,
  });
  insertTarget(db, {
    orgId, cycleId: cy2223, empId: vpSal, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR', unit: 'INR',
    companyTarget: 475000, planned: 475000, actual: 450000,
    weight: 30, level: 2, status: 'approved',
    submittedAt: '2022-04-15', approvedAt: '2022-04-22', approvedBy: CEO,
    selfRating: 3, selfRatedAt: '2023-03-12', managerRating: 3, managerRatedAt: '2023-03-22', finalRating: 3,
  });

  perfSummary(db, cy2223, CEO,   4.1, 4.1, 'Exceeds',           '2023-03-28');
  perfSummary(db, cy2223, vpSal, 3.1, 3.1, 'Meets Expectation', '2023-03-28');

  // ═══════════════════════════════════════════════════════════════════════════
  // CYCLE 2 — FY 2023-24  (closed, ₹75 Cr ARR — Scaling year)
  // ═══════════════════════════════════════════════════════════════════════════
  const cy2324 = upsertCycle(db, orgId, {
    name: 'FY 2023-24 Annual', start: '2023-04-01', end: '2024-03-31',
    gsOpen: '2023-04-01', gsClose: '2023-05-15',
    apvOpen: '2023-05-16', apvClose: '2023-05-31',
    rvOpen: '2024-02-01', rvClose: '2024-03-15',
    calOpen: '2024-03-16', calClose: '2024-03-31',
    cascade: 'top_down', status: 'closed',
  }, CEO);

  const c2Obj = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, type: 'okr_objective', dir: 'top_down',
    title: 'Scale InfoBuz to ₹75 Cr ARR — Doubling Growth Year',
    weight: 60, level: 1, status: 'approved',
    submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
    selfRating: 5, selfComment: '74 Cr achieved — essentially on target; strong Q4 close', selfRatedAt: '2024-03-10',
    managerRating: 5, managerRatedAt: '2024-03-20', finalRating: 5,
  });
  const c2ARR = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, parentId: c2Obj, type: 'okr_kr', dir: 'top_down',
    title: 'Annual Recurring Revenue (ARR)', unit: 'INR Cr',
    companyTarget: 75, planned: 75, stretch: 80, actual: 74,
    weight: 30, level: 1, status: 'approved',
    submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
    selfRating: 5, selfComment: '74 Cr — 98.7% achievement. Best year to date.', selfRatedAt: '2024-03-10',
    managerRating: 5, managerRatedAt: '2024-03-20', finalRating: 5,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, parentId: c2Obj, type: 'okr_kr', dir: 'top_down',
    title: 'New Customer Logos', unit: 'count',
    companyTarget: 60, planned: 60, actual: 68,
    weight: 15, level: 1, status: 'approved',
    submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
    selfRating: 5, selfRatedAt: '2024-03-10', managerRating: 5, managerRatedAt: '2024-03-20', finalRating: 5,
  });
  const c2KRA = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth', weight: 40, level: 1, status: 'approved',
    submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
    selfRating: 5, selfRatedAt: '2024-03-10', managerRating: 5, managerRatedAt: '2024-03-20', finalRating: 5,
  });

  // VP Sales
  const c2vpKR = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpSal, parentId: c2ARR, type: 'okr_kr', dir: 'top_down',
    title: 'Sales Revenue Contribution FY24', unit: 'INR Cr',
    companyTarget: 55, planned: 55, stretch: 60, actual: 53,
    weight: 40, level: 2, status: 'approved',
    submittedAt: '2023-04-15', approvedAt: '2023-04-22', approvedBy: CEO,
    selfRating: 4, selfComment: '53 Cr vs 55 Cr — 96%; great Q3. North team led by Amit was excellent.', selfRatedAt: '2024-03-12',
    managerRating: 4, managerComment: 'Strong year. North team carried Q2-Q3.', managerRatedAt: '2024-03-22',
    finalRating: 4,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpSal, parentId: c2KRA, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth', weight: 25, level: 2, status: 'approved',
    submittedAt: '2023-04-15', approvedAt: '2023-04-22', approvedBy: CEO,
    selfRating: 4, selfRatedAt: '2024-03-12', managerRating: 4, managerRatedAt: '2024-03-22', finalRating: 4,
  });
  const c2vpMRR = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpSal, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR', unit: 'INR',
    companyTarget: 650000, planned: 650000, actual: 625000,
    weight: 25, level: 2, status: 'approved',
    submittedAt: '2023-04-15', approvedAt: '2023-04-22', approvedBy: CEO,
    selfRating: 4, selfRatedAt: '2024-03-12', managerRating: 4, managerRatedAt: '2024-03-22', finalRating: 4,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpSal, type: 'kra', dir: 'top_down',
    title: 'New Business Acquisition', weight: 10, level: 2, status: 'approved',
    submittedAt: '2023-04-15', approvedAt: '2023-04-22', approvedBy: CEO,
    selfRating: 4, selfRatedAt: '2024-03-12', managerRating: 4, managerRatedAt: '2024-03-22', finalRating: 4,
  });

  // L3 FY23-24
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: l3n, parentId: c2vpMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — North Region', unit: 'INR',
    companyTarget: 240000, planned: 240000, actual: 238000,
    weight: 50, level: 3, status: 'approved',
    submittedAt: '2023-04-23', approvedAt: '2023-05-03', approvedBy: vpSal,
    selfRating: 5, selfComment: 'North region 238K avg; slight miss in June offset by strong Q3', selfRatedAt: '2024-03-13',
    managerRating: 5, managerRatedAt: '2024-03-23', finalRating: 5,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: l3n, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth', weight: 50, level: 3, status: 'approved',
    submittedAt: '2023-04-23', approvedAt: '2023-05-03', approvedBy: vpSal,
    selfRating: 5, selfRatedAt: '2024-03-13', managerRating: 5, managerRatedAt: '2024-03-23', finalRating: 5,
  });

  insertTarget(db, {
    orgId, cycleId: cy2324, empId: l3s, parentId: c2vpMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — South Region', unit: 'INR',
    companyTarget: 410000, planned: 410000, actual: 387000,
    weight: 50, level: 3, status: 'approved',
    submittedAt: '2023-04-23', approvedAt: '2023-05-03', approvedBy: vpSal,
    selfRating: 3, selfComment: 'South team had Q2 attrition; L4 vacancy created gap that lingered', selfRatedAt: '2024-03-13',
    managerRating: 3, managerRatedAt: '2024-03-23', finalRating: 3,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: l3s, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth', weight: 50, level: 3, status: 'approved',
    submittedAt: '2023-04-23', approvedAt: '2023-05-03', approvedBy: vpSal,
    selfRating: 3, selfRatedAt: '2024-03-13', managerRating: 3, managerRatedAt: '2024-03-23', finalRating: 3,
  });

  perfSummary(db, cy2324, CEO,   5.0, 5.0, 'Exceptional',       '2024-03-28');
  perfSummary(db, cy2324, vpSal, 4.0, 4.0, 'Exceeds',           '2024-03-28');
  perfSummary(db, cy2324, l3n,   4.8, 4.8, 'Exceeds',           '2024-03-28');
  perfSummary(db, cy2324, l3s,   3.0, 3.0, 'Meets Expectation', '2024-03-28');

  // ═══════════════════════════════════════════════════════════════════════════
  // CYCLE 3 — FY 2024-25  (closed, ₹100 Cr ARR — Full 6-level hierarchy + check-ins)
  // ═══════════════════════════════════════════════════════════════════════════
  const cy2425 = upsertCycle(db, orgId, {
    name: 'FY 2024-25 Annual', start: '2024-04-01', end: '2025-03-31',
    gsOpen: '2024-04-01', gsClose: '2024-05-15',
    apvOpen: '2024-05-16', apvClose: '2024-05-31',
    rvOpen: '2025-02-01', rvClose: '2025-03-15',
    calOpen: '2025-03-16', calClose: '2025-03-31',
    cascade: 'top_down', status: 'closed',
  }, CEO);

  // CEO FY24-25
  const c3Obj = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, type: 'okr_objective', dir: 'top_down',
    title: 'Break ₹100 Cr ARR — Become Market Leader in Indian B2B SaaS',
    weight: 60, level: 1, status: 'approved',
    submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
    selfRating: 5, selfComment: '₹99 Cr ARR — effectively at ₹100 Cr run-rate by March. Historic milestone.', selfRatedAt: '2025-03-10',
    managerRating: 5, managerRatedAt: '2025-03-20', finalRating: 5,
  });
  const c3ARR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, parentId: c3Obj, type: 'okr_kr', dir: 'top_down',
    title: 'Annual Recurring Revenue (ARR)', unit: 'INR Cr',
    companyTarget: 100, planned: 100, stretch: 110, actual: 99,
    weight: 30, level: 1, status: 'approved',
    submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
    selfRating: 5, selfComment: '99 Cr — ₹1 Cr short but ₹100 Cr run-rate achieved in March', selfRatedAt: '2025-03-10',
    managerRating: 5, managerRatedAt: '2025-03-20', finalRating: 5,
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, parentId: c3Obj, type: 'okr_kr', dir: 'top_down',
    title: 'New Customer Logos', unit: 'count',
    companyTarget: 80, planned: 80, actual: 91,
    weight: 15, level: 1, status: 'approved',
    submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
    selfRating: 5, selfRatedAt: '2025-03-10', managerRating: 5, managerRatedAt: '2025-03-20', finalRating: 5,
  });
  const c3KRA = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth', weight: 40, level: 1, status: 'approved',
    submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
    selfRating: 5, selfRatedAt: '2025-03-10', managerRating: 5, managerRatedAt: '2025-03-20', finalRating: 5,
  });

  // VP Sales FY24-25
  const c3vpKR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpSal, parentId: c3ARR, type: 'okr_kr', dir: 'top_down',
    title: 'Sales Revenue Contribution FY25', unit: 'INR Cr',
    companyTarget: 70, planned: 70, stretch: 75, actual: 69,
    weight: 35, level: 2, status: 'approved',
    submittedAt: '2024-04-16', approvedAt: '2024-04-23', approvedBy: CEO,
    selfRating: 5, selfComment: '69 Cr — exceptional. L6 hiring in FY25 began paying off in Q3.', selfRatedAt: '2025-03-12',
    managerRating: 5, managerComment: 'Best sales year in company history. All regions delivered.', managerRatedAt: '2025-03-22',
    finalRating: 5,
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpSal, parentId: c3KRA, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth', weight: 25, level: 2, status: 'approved',
    submittedAt: '2024-04-16', approvedAt: '2024-04-23', approvedBy: CEO,
    selfRating: 5, selfRatedAt: '2025-03-12', managerRating: 5, managerRatedAt: '2025-03-22', finalRating: 5,
  });
  const c3vpMRR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpSal, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR', unit: 'INR',
    companyTarget: 800000, planned: 800000, actual: 788000,
    weight: 25, level: 2, status: 'approved',
    submittedAt: '2024-04-16', approvedAt: '2024-04-23', approvedBy: CEO,
    selfRating: 5, selfRatedAt: '2025-03-12', managerRating: 5, managerRatedAt: '2025-03-22', finalRating: 5,
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpSal, type: 'kra', dir: 'top_down',
    title: 'New Business Acquisition', weight: 15, level: 2, status: 'approved',
    submittedAt: '2024-04-16', approvedAt: '2024-04-23', approvedBy: CEO,
    selfRating: 5, selfRatedAt: '2025-03-12', managerRating: 5, managerRatedAt: '2025-03-22', finalRating: 5,
  });

  // L3 FY24-25
  const c3l3nMRR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: l3n, parentId: c3vpMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — North Region', unit: 'INR',
    companyTarget: 310000, planned: 310000, actual: 308000,
    weight: 50, level: 3, status: 'approved',
    submittedAt: '2024-04-24', approvedAt: '2024-05-05', approvedBy: vpSal,
    selfRating: 5, selfComment: 'North 308K avg MRR — Ankit Joshi standout; L4.1 team consistent', selfRatedAt: '2025-03-13',
    managerRating: 5, managerRatedAt: '2025-03-23', finalRating: 5,
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: l3n, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth', weight: 50, level: 3, status: 'approved',
    submittedAt: '2024-04-24', approvedAt: '2024-05-05', approvedBy: vpSal,
    selfRating: 5, selfRatedAt: '2025-03-13', managerRating: 5, managerRatedAt: '2025-03-23', finalRating: 5,
  });

  const c3l3sMRR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: l3s, parentId: c3vpMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — South Region', unit: 'INR',
    companyTarget: 490000, planned: 490000, actual: 480000,
    weight: 50, level: 3, status: 'approved',
    submittedAt: '2024-04-24', approvedAt: '2024-05-05', approvedBy: vpSal,
    selfRating: 4, selfComment: 'South 480K avg; Karan Singh team had weak Q2 but recovered well', selfRatedAt: '2025-03-13',
    managerRating: 4, managerRatedAt: '2025-03-23', finalRating: 4,
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: l3s, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth', weight: 50, level: 3, status: 'approved',
    submittedAt: '2024-04-24', approvedAt: '2024-05-05', approvedBy: vpSal,
    selfRating: 4, selfRatedAt: '2025-03-13', managerRating: 4, managerRatedAt: '2025-03-23', finalRating: 4,
  });

  // L4 FY24-25
  const c3l41MRR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: l41, parentId: c3l3nMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — North Area 1', unit: 'INR',
    companyTarget: 240000, planned: 240000, actual: 238000,
    weight: 60, level: 4, status: 'approved',
    submittedAt: '2024-05-07', approvedAt: '2024-05-16', approvedBy: l3n,
    selfRating: 5, selfComment: '238K; L5.1 Rohit team over-achieved; Ankit Joshi added BSNL in Feb', selfRatedAt: '2025-03-14',
    managerRating: 5, managerRatedAt: '2025-03-24', finalRating: 5,
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: l41, type: 'kra', dir: 'top_down', title: 'Revenue Growth',
    weight: 40, level: 4, status: 'approved', submittedAt: '2024-05-07', approvedAt: '2024-05-16', approvedBy: l3n,
    selfRating: 5, selfRatedAt: '2025-03-14', managerRating: 5, managerRatedAt: '2025-03-24', finalRating: 5,
  });

  const c3l42MRR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: l42, parentId: c3l3sMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — South Area 2', unit: 'INR',
    companyTarget: 380000, planned: 380000, actual: 370000,
    weight: 50, level: 4, status: 'approved',
    submittedAt: '2024-05-07', approvedAt: '2024-05-16', approvedBy: l3s,
    selfRating: 4, selfComment: '370K vs 380K; Karan Singh (L5.3 team) shortfall offset by Neha and Ravi teams', selfRatedAt: '2025-03-14',
    managerRating: 4, managerRatedAt: '2025-03-24', finalRating: 4,
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: l42, type: 'kra', dir: 'top_down', title: 'Revenue Growth',
    weight: 50, level: 4, status: 'approved', submittedAt: '2024-05-07', approvedAt: '2024-05-16', approvedBy: l3s,
    selfRating: 4, selfRatedAt: '2025-03-14', managerRating: 4, managerRatedAt: '2025-03-24', finalRating: 4,
  });

  insertTarget(db, {
    orgId, cycleId: cy2425, empId: l43, parentId: c3l3sMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — South Area 3 (Solo)', unit: 'INR',
    companyTarget: 50000, planned: 50000, actual: 52000,
    weight: 60, level: 4, status: 'approved',
    submittedAt: '2024-05-07', approvedAt: '2024-05-16', approvedBy: l3s,
    selfRating: 5, selfComment: '52K vs 50K — solo territory over-achieved', selfRatedAt: '2025-03-14',
    managerRating: 5, managerRatedAt: '2025-03-24', finalRating: 5,
  });

  // L5 FY24-25
  const c3l51MRR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: l51, parentId: c3l41MRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — L5.1 Team', unit: 'INR',
    companyTarget: 95000, planned: 95000, actual: 94000,
    weight: 60, level: 5, status: 'approved',
    submittedAt: '2024-05-17', approvedAt: '2024-05-26', approvedBy: l41,
    selfRating: 5, selfComment: '94K — Ankit had stellar Q3/Q4; BSNL deal pushed team above target in Feb-Mar', selfRatedAt: '2025-03-14',
    managerRating: 5, managerRatedAt: '2025-03-24', finalRating: 5,
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: l51, type: 'kra', dir: 'top_down', title: 'Revenue Growth',
    weight: 40, level: 5, status: 'approved', submittedAt: '2024-05-17', approvedAt: '2024-05-26', approvedBy: l41,
    selfRating: 5, selfRatedAt: '2025-03-14', managerRating: 5, managerRatedAt: '2025-03-24', finalRating: 5,
  });

  const c3l52MRR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: l52, parentId: c3l41MRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — L5.2 Team', unit: 'INR',
    companyTarget: 95000, planned: 95000, actual: 93000,
    weight: 60, level: 5, status: 'approved',
    submittedAt: '2024-05-17', approvedAt: '2024-05-26', approvedBy: l41,
    selfRating: 4, selfRatedAt: '2025-03-14', managerRating: 4, managerRatedAt: '2025-03-24', finalRating: 4,
  });

  const c3l53MRR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: l53, parentId: c3l42MRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — L5.3 Team', unit: 'INR',
    companyTarget: 95000, planned: 95000, actual: 87000,
    weight: 60, level: 5, status: 'approved',
    submittedAt: '2024-05-17', approvedAt: '2024-05-26', approvedBy: l42,
    selfRating: 3, selfComment: 'Q2 hurt badly by Karan Singh losing Infosys account (₹8K MRR). Q3-Q4 recovery helped but annual avg dragged down.', selfRatedAt: '2025-03-14',
    managerRating: 3, managerComment: 'Under-performance in Q2 cost the team. Karan needs closer coaching in FY26.', managerRatedAt: '2025-03-24',
    finalRating: 3,
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: l53, type: 'kra', dir: 'top_down', title: 'Revenue Growth',
    weight: 40, level: 5, status: 'approved', submittedAt: '2024-05-17', approvedAt: '2024-05-26', approvedBy: l42,
    selfRating: 3, selfRatedAt: '2025-03-14', managerRating: 3, managerRatedAt: '2025-03-24', finalRating: 3,
  });

  for (const [empId, actual, rating] of [
    [l54, 95000, 5], [l55, 92000, 4], [l56, 90000, 4],
  ]) {
    insertTarget(db, {
      orgId, cycleId: cy2425, empId, parentId: c3l42MRR, type: 'kpi', dir: 'top_down',
      title: 'Monthly New Business MRR', unit: 'INR',
      companyTarget: 95000, planned: 95000, actual,
      weight: 60, level: 5, status: 'approved',
      submittedAt: '2024-05-17', approvedAt: '2024-05-26', approvedBy: l42,
      selfRating: rating, selfRatedAt: '2025-03-14', managerRating: rating, managerRatedAt: '2025-03-24', finalRating: rating,
    });
  }

  // L6 FY24-25 — Ankit Joshi (over-achiever) and Karan Singh (under-performer)
  const c3l61MRR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: l61, parentId: c3l51MRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR', unit: 'INR',
    companyTarget: 20000, planned: 20000, actual: 22000,
    weight: 70, level: 6, status: 'approved',
    submittedAt: '2024-05-28', approvedAt: '2024-06-05', approvedBy: l51,
    selfRating: 5, selfComment: '22K avg — closed BSNL Phase-1 (₹6K MRR) in Sep; HDFC pilot in Mar', selfRatedAt: '2025-03-15',
    managerRating: 5, managerComment: 'Ankit is team standout. Closed 2 enterprise accounts. Earmarked for promotion.', managerRatedAt: '2025-03-25',
    finalRating: 5,
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: l61, type: 'kra', dir: 'top_down', title: 'New Business Acquisition',
    weight: 30, level: 6, status: 'approved', submittedAt: '2024-05-28', approvedAt: '2024-06-05', approvedBy: l51,
    selfRating: 5, selfRatedAt: '2025-03-15', managerRating: 5, managerRatedAt: '2025-03-25', finalRating: 5,
  });

  const c3l67MRR = insertTarget(db, {
    orgId, cycleId: cy2425, empId: l67, parentId: c3l53MRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR', unit: 'INR',
    companyTarget: 20000, planned: 20000, actual: 15000,
    weight: 70, level: 6, status: 'approved',
    submittedAt: '2024-05-28', approvedAt: '2024-06-05', approvedBy: l53,
    selfRating: 2, selfComment: 'Lost Infosys account in May (₹8K MRR) due to competitor pricing. Took till Q3 to rebuild pipeline.', selfRatedAt: '2025-03-15',
    managerRating: 2, managerComment: 'Consistent under-delivery Q1-Q2. Q3 shows green shoots. Needs structured PIP if FY26 starts weak.', managerRatedAt: '2025-03-25',
    finalRating: 2,
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: l67, type: 'kra', dir: 'top_down', title: 'New Business Acquisition',
    weight: 30, level: 6, status: 'approved', submittedAt: '2024-05-28', approvedAt: '2024-06-05', approvedBy: l53,
    selfRating: 2, selfRatedAt: '2025-03-15', managerRating: 2, managerRatedAt: '2025-03-25', finalRating: 2,
  });

  // Monthly check-ins for Ankit Joshi (L6.1) — the over-performer
  for (const [label, actual, pct, notes] of [
    ['April 2024',     18000, 90,  'Pipeline established: HDFC branch demo scheduled'],
    ['May 2024',       20000, 100, 'HDFC pilot converted (₹4K MRR); Tata Comm RFI submitted'],
    ['June 2024',      19000, 95,  'One deal slipped to July; overall pipeline healthy'],
    ['July 2024',      21000, 105, 'Slipped deal closed; BSNL discovery call done'],
    ['August 2024',    22000, 110, 'BSNL demo positive; 2 new SME accounts activated (₹2K each)'],
    ['September 2024', 23000, 115, 'Q2 close: BSNL Phase-1 contract signed ₹6K MRR!'],
    ['October 2024',   24000, 120, 'BSNL fully deployed; expanding relationship to Phase-2'],
    ['November 2024',  22000, 110, 'Tata Comm proposal under review; BSNL stable'],
    ['December 2024',  21000, 105, 'Tata contract delayed to Jan; Q3 closed well overall'],
    ['January 2025',   23000, 115, 'Tata Comm signed (₹4K MRR from Feb); HDFC upsell in progress'],
    ['February 2025',  25000, 125, 'Tata fully onboarded — new personal best month'],
    ['March 2025',     26000, 130, 'Year-end: 3 accounts fully active; BSNL Phase-2 (₹2K uplift) live'],
  ]) {
    insertCheckin(db, { targetId: c3l61MRR, empId: l61, cycleId: cy2425, periodType: 'monthly', label, actual, pct, notes, ackedBy: l51, ackedAt: null });
  }

  // Monthly check-ins for Karan Singh (L6.7) — the under-performer
  for (const [label, actual, pct, notes] of [
    ['April 2024',     20000, 100, 'Good start; Infosys account still active and healthy'],
    ['May 2024',       12000, 60,  'CRITICAL: Infosys (₹8K MRR) churned to competitor due to pricing mismatch'],
    ['June 2024',      11000, 55,  'Pipeline thin post-Infosys exit; working 3 replacement prospects'],
    ['July 2024',      12000, 60,  'Added 1 SME account (₹2K MRR); still rebuilding'],
    ['August 2024',    14000, 70,  '2 prospects in final stage negotiations'],
    ['September 2024', 15000, 75,  'Q2 close: gradual recovery. Arun Kumar (L5.3) covering gap.'],
    ['October 2024',   16000, 80,  'New account onboarded (₹3K MRR); pipeline improving'],
    ['November 2024',  17000, 85,  'Another SME activated; cadence improving'],
    ['December 2024',  18000, 90,  'Q3 close — positive trajectory; year-end push planned'],
    ['January 2025',   18000, 90,  'Working 2 mid-market deals (₹3K+ MRR each)'],
    ['February 2025',  19000, 95,  'Mid-market deal signed — ₹3K MRR from March'],
    ['March 2025',     20000, 100, 'Year-end: full recovery to ₹20K baseline — annual avg still 15K'],
  ]) {
    insertCheckin(db, { targetId: c3l67MRR, empId: l67, cycleId: cy2425, periodType: 'monthly', label, actual, pct, notes, ackedBy: l53, ackedAt: null });
  }

  perfSummary(db, cy2425, CEO,   5.0, 5.0, 'Exceptional',       '2025-03-28');
  perfSummary(db, cy2425, vpSal, 5.0, 5.0, 'Exceptional',       '2025-03-28');
  perfSummary(db, cy2425, l3n,   5.0, 5.0, 'Exceptional',       '2025-03-28');
  perfSummary(db, cy2425, l3s,   4.0, 4.0, 'Exceeds',           '2025-03-28');
  perfSummary(db, cy2425, l41,   5.0, 5.0, 'Exceptional',       '2025-03-28');
  perfSummary(db, cy2425, l42,   4.0, 4.0, 'Exceeds',           '2025-03-28');
  perfSummary(db, cy2425, l51,   5.0, 5.0, 'Exceptional',       '2025-03-28');
  perfSummary(db, cy2425, l53,   3.0, 3.0, 'Meets Expectation', '2025-03-28');
  perfSummary(db, cy2425, l61,   5.0, 5.0, 'Exceptional',       '2025-03-28');
  perfSummary(db, cy2425, l67,   2.0, 2.0, 'Below Expectation', '2025-03-28');

  // ═══════════════════════════════════════════════════════════════════════════
  // CYCLE 4 — FY 2025-26  (goal_setting, ₹200 Cr ARR — BIDIRECTIONAL LIVE)
  // V13 BLOCKED: 18 L6 bottom-up proposals unlinked → cycle cannot go 'active'
  // ═══════════════════════════════════════════════════════════════════════════
  const cy2526 = upsertCycle(db, orgId, {
    name: 'FY 2025-26 Annual', start: '2025-04-01', end: '2026-03-31',
    gsOpen: '2025-04-01', gsClose: '2025-05-31',
    apvOpen: null, apvClose: null,
    rvOpen: '2026-02-01', rvClose: '2026-03-15',
    cascade: 'bidirectional', status: 'goal_setting',
  }, CEO);

  // ── TOP-DOWN TRACK ────────────────────────────────────────────────────────

  // CEO — APPROVED
  const c4Obj = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, type: 'okr_objective', dir: 'top_down',
    title: 'Scale InfoBuz to ₹200 Cr ARR — India\'s #1 B2B SaaS Platform',
    desc: 'Double ARR from ₹99 Cr to ₹200 Cr. Three pillars: (1) Sales acceleration with 6-level cascade, (2) Product NPS 85+, (3) Zero churn in top 50 accounts.',
    weight: 70, level: 1, status: 'approved',
    submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
  });
  const c4ARR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, parentId: c4Obj, type: 'okr_kr', dir: 'top_down',
    title: 'Annual Recurring Revenue (ARR)', unit: 'INR Cr',
    companyTarget: 200, planned: 200, stretch: 220,
    weight: 35, level: 1, status: 'approved',
    submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, parentId: c4Obj, type: 'okr_kr', dir: 'top_down',
    title: 'New Customer Logos', unit: 'count',
    companyTarget: 120, planned: 120, stretch: 150,
    weight: 20, level: 1, status: 'approved',
    submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, parentId: c4Obj, type: 'okr_kr', dir: 'top_down',
    title: 'Customer NPS', unit: 'score',
    companyTarget: 85, planned: 85, stretch: 92,
    weight: 15, level: 1, status: 'approved',
    submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
  });
  const c4KRA = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth',
    desc: 'Continuing KRA from FY22. FY26 target: double ARR via 6-level bidirectional sales cascade.',
    weight: 30, level: 1, status: 'approved',
    submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
  });

  // VP Sales — APPROVED (demo: full chain approved so L5 managers can approve their teams)
  const c4vpARR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSal, parentId: c4ARR, type: 'okr_kr', dir: 'top_down',
    title: 'Sales Revenue Contribution FY26', unit: 'INR Cr',
    companyTarget: 150, planned: 150, stretch: 170,
    desc: 'Sales team commits to ₹150 Cr (75% of ₹200 Cr ARR target). Remaining from renewals, expansion, product-led growth.',
    weight: 40, level: 2, status: 'approved',
    submittedAt: '2025-04-14', approvedAt: '2025-04-16', approvedBy: CEO,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSal, parentId: c4KRA, type: 'kra', dir: 'top_down',
    title: 'Revenue Growth',
    weight: 20, level: 2, status: 'approved',
    submittedAt: '2025-04-14', approvedAt: '2025-04-16', approvedBy: CEO,
  });
  const c4vpMRR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSal, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR', unit: 'INR',
    companyTarget: 950000, planned: 950000, stretch: 1100000,
    desc: 'VP Sales team MRR = entire sales org salary pool (₹9.5L/month). Bidirectional: L6 self-propose their MRR; L5/L4/L3 reconcile upward. Company ambition: ₹12L (1.26× salary pool).',
    weight: 25, level: 2, status: 'approved',
    submittedAt: '2025-04-14', approvedAt: '2025-04-16', approvedBy: CEO,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSal, type: 'kra', dir: 'top_down',
    title: 'New Business Acquisition',
    weight: 15, level: 2, status: 'approved',
    submittedAt: '2025-04-14', approvedAt: '2025-04-16', approvedBy: CEO,
  });

  // L3.1 Amit North — APPROVED
  const c4l3nMRR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: l3n, parentId: c4vpMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — North Region', unit: 'INR',
    companyTarget: 310000, planned: 310000, stretch: 345000,
    desc: 'North: L4.1 (240K) = 70K (L3.1 own) + 240K (L4.1 team). Net after bottom-up: Ankit Joshi +₹5K over-plan → North total bumps to ₹315K vs ₹310K company target.',
    weight: 50, level: 3, status: 'approved',
    submittedAt: '2025-04-18', approvedAt: '2025-04-20', approvedBy: vpSal,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l3n, type: 'kra', dir: 'top_down', title: 'Revenue Growth',
    weight: 50, level: 3, status: 'approved',
    submittedAt: '2025-04-18', approvedAt: '2025-04-20', approvedBy: vpSal,
  });

  // L3.2 Priya South — APPROVED
  const c4l3sMRR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: l3s, parentId: c4vpMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — South Region', unit: 'INR',
    companyTarget: 550000, planned: 550000, stretch: 610000,
    desc: 'South: L4.2 (430K) + L4.3 solo (50K) + L3.2 own (70K) = 550K. Note: L6.7 Karan Singh under-planned -₹5K → L5.3 Arun Kumar self-absorbs gap by raising own contribution to 40K.',
    weight: 50, level: 3, status: 'approved',
    submittedAt: '2025-04-18', approvedAt: '2025-04-20', approvedBy: vpSal,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l3s, type: 'kra', dir: 'top_down', title: 'Revenue Growth',
    weight: 50, level: 3, status: 'approved',
    submittedAt: '2025-04-18', approvedAt: '2025-04-20', approvedBy: vpSal,
  });

  // L4.1 Sanjay — APPROVED
  const c4l41MRR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: l41, parentId: c4l3nMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — North Area 1', unit: 'INR',
    companyTarget: 240000, planned: 240000, stretch: 265000,
    desc: 'Team = 50K own + L5.1 (95K) + L5.2 (95K) = 240K. Bottom-up net: Ankit Joshi (L6.1) +5K → team overachieves to 245K.',
    weight: 60, level: 4, status: 'approved',
    submittedAt: '2025-04-21', approvedAt: '2025-04-23', approvedBy: l3n,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l41, type: 'kra', dir: 'top_down', title: 'Revenue Growth',
    weight: 40, level: 4, status: 'approved',
    submittedAt: '2025-04-21', approvedAt: '2025-04-23', approvedBy: l3n,
  });

  // L4.2 Deepak — APPROVED
  const c4l42MRR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: l42, parentId: c4l3sMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — South Area 2', unit: 'INR',
    companyTarget: 430000, planned: 430000, stretch: 475000,
    desc: 'Team = 50K + 4×95K = 430K. Bottom-up: L6.7 Karan -5K → L5.3 Arun self-compensates to 40K own. Team net = 430K (unchanged — Arun covers the gap internally).',
    weight: 50, level: 4, status: 'approved',
    submittedAt: '2025-04-21', approvedAt: '2025-04-23', approvedBy: l3s,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l42, type: 'kra', dir: 'top_down', title: 'Revenue Growth',
    weight: 50, level: 4, status: 'approved',
    submittedAt: '2025-04-21', approvedAt: '2025-04-23', approvedBy: l3s,
  });

  // L4.3 Sunita Solo — APPROVED
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l43, parentId: c4l3sMRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — South Area 3 (Solo)', unit: 'INR',
    companyTarget: 50000, planned: 50000, stretch: 58000,
    desc: 'Sunita Iyer — individual quota, no L5/L6. Over-achieved 52K in FY25; FY26 target raised to 50K baseline.',
    weight: 60, level: 4, status: 'approved',
    submittedAt: '2025-04-21', approvedAt: '2025-04-23', approvedBy: l3s,
  });

  // L5.1 Rohit — APPROVED; own contribution REDUCED to 30K (L6.1 over-plan relieves 5K burden)
  const c4l51MRR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: l51, parentId: c4l41MRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — L5.1 Team (Rohit Verma)', unit: 'INR',
    companyTarget: 95000, planned: 95000, stretch: 105000,
    desc: 'Team company_target = 95K. L6 bottom-up: Ankit 25K + Maya 20K + Vikash 20K = 65K. Rohit own = 30K (reduced from 35K salary baseline: Ankit over-committed +5K, so Rohit burden drops by 5K). Team total = 30K + 65K = 95K exactly.',
    weight: 70, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l41,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l51, type: 'kra', dir: 'top_down', title: 'New Business Acquisition',
    weight: 30, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l41,
  });

  // L5.2 Kavya — APPROVED standard
  const c4l52MRR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: l52, parentId: c4l41MRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — L5.2 Team (Kavya Nair)', unit: 'INR',
    companyTarget: 95000, planned: 95000, stretch: 105000,
    desc: 'L6 team: Swati 20K + Mohit 20K + Divya 20K = 60K. Kavya own = 35K. Net = 95K.',
    weight: 70, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l41,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l52, type: 'kra', dir: 'top_down', title: 'New Business Acquisition',
    weight: 30, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l41,
  });

  // L5.3 Arun — APPROVED; own contribution RAISED to 40K (absorbs L6.7 Karan's gap)
  const c4l53MRR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: l53, parentId: c4l42MRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — L5.3 Team (Arun Kumar)', unit: 'INR',
    companyTarget: 95000, planned: 95000, stretch: 105000,
    desc: 'Team company_target = 95K. L6 bottom-up: Karan 15K + Preethi 20K + Sujith 20K = 55K (short by 5K — Karan under-planned). Arun raises own to 40K (from 35K) to close gap. Net = 40K + 55K = 95K exactly.',
    weight: 70, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l42,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l53, type: 'kra', dir: 'top_down', title: 'New Business Acquisition',
    weight: 30, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l42,
  });

  // L5.4, L5.5, L5.6 — APPROVED standard
  const c4l54MRR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: l54, parentId: c4l42MRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — L5.4 Team (Neha Singh)', unit: 'INR',
    companyTarget: 95000, planned: 95000, weight: 70, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l42,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l54, type: 'kra', dir: 'top_down', title: 'New Business Acquisition',
    weight: 30, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l42,
  });
  const c4l55MRR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: l55, parentId: c4l42MRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — L5.5 Team (Ravi Joshi)', unit: 'INR',
    companyTarget: 95000, planned: 95000, weight: 70, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l42,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l55, type: 'kra', dir: 'top_down', title: 'New Business Acquisition',
    weight: 30, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l42,
  });
  const c4l56MRR = insertTarget(db, {
    orgId, cycleId: cy2526, empId: l56, parentId: c4l42MRR, type: 'kpi', dir: 'top_down',
    title: 'Monthly New Business MRR — L5.6 Team (Pooja Bose)', unit: 'INR',
    companyTarget: 95000, planned: 95000, weight: 70, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l42,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l56, type: 'kra', dir: 'top_down', title: 'New Business Acquisition',
    weight: 30, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l42,
  });

  // ── BOTTOM-UP TRACK: L6 Proposals (ALL unlinked — V13 blocks cycle advance) ──
  // Weight = 100% since MRR is each L6 executive's sole goal target.
  // Competency targets are tracked separately (100% in competency bucket).

  // L6.1 ANKIT JOSHI — OVER-PLANS 25,000 (baseline 20,000, over_plan_ratio = 1.25)
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l61, type: 'kpi', dir: 'bottom_up',
    title: 'My New Business MRR Target', unit: 'INR',
    companyTarget: 20000, planned: 25000, stretch: 28000,
    desc: 'Self-proposed MRR for FY26. Over-planning by ₹5K vs ₹20K salary-based baseline. 3 corporate accounts in advanced pipeline: BSNL Phase-2 (₹8K MRR, contract ready), HDFC Insurance (₹5K MRR, pilot converting), Tata Comm (₹4K MRR, proposal stage). Committed with high confidence.',
    isOverPlanned: 1, overRatio: 1.25,
    overNote: 'Over-plan by ₹5,000 vs ₹20,000 baseline. Evidence: (1) BSNL Phase-2 ₹8K MRR contract ready for sign-off by Apr 15. (2) HDFC Insurance pilot converting — decision expected Apr 20. I am willing to forfeit Q1 incentive if target is missed.',
    overApproved: 0,
    weight: 100, level: 6, status: 'proposed', submittedAt: '2025-04-18',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l61, type: 'competency', dir: 'bottom_up',
    title: 'Sales Execution',
    desc: 'Consistent pipeline discipline, deal velocity, and CRM hygiene. FY26 focus: enterprise deal closures.',
    weight: 50, level: 6, status: 'proposed', submittedAt: '2025-04-18',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l61, type: 'competency', dir: 'bottom_up',
    title: 'Ownership & Accountability',
    desc: 'Proactive communication on deal slippages; takes full ownership of pipeline health.',
    weight: 50, level: 6, status: 'proposed', submittedAt: '2025-04-18',
  });

  // L6.2 Maya Sharma — Standard 20K
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l62, type: 'kpi', dir: 'bottom_up',
    title: 'My New Business MRR Target', unit: 'INR',
    companyTarget: 20000, planned: 20000,
    weight: 100, level: 6, status: 'proposed', submittedAt: '2025-04-18',
  });

  // L6.3 Vikash Kumar — Standard 20K
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l63, type: 'kpi', dir: 'bottom_up',
    title: 'My New Business MRR Target', unit: 'INR',
    companyTarget: 20000, planned: 20000,
    weight: 100, level: 6, status: 'proposed', submittedAt: '2025-04-18',
  });

  // L6.4–6.6 under L5.2 Kavya — Standard 20K each
  for (const empId of [l64, l65, l66]) {
    insertTarget(db, {
      orgId, cycleId: cy2526, empId, type: 'kpi', dir: 'bottom_up',
      title: 'My New Business MRR Target', unit: 'INR',
      companyTarget: 20000, planned: 20000,
      weight: 100, level: 6, status: 'proposed', submittedAt: '2025-04-18',
    });
  }

  // L6.7 KARAN SINGH — UNDER-PLANS 15,000 (baseline 20,000, gap = -5K)
  // This is the key demo: Karan commits ₹5K less than baseline → Arun must cover the shortfall
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l67, type: 'kpi', dir: 'bottom_up',
    title: 'My New Business MRR Target', unit: 'INR',
    companyTarget: 20000, planned: 15000, stretch: 22000,
    desc: 'Self-proposed MRR for FY26. Under-planning vs ₹20K baseline by ₹5K. Context: In FY25 I lost Infosys account (₹8K MRR) in May to a competitor on pricing — annual avg was only ₹15K. FY26: rebuilt pipeline to 4 new SMEs but none above ₹3K MRR yet. Committing to ₹15K realistic baseline; plan to reach ₹20K by Q2 once 2 pending deals close.',
    isOverPlanned: 0,
    weight: 100, level: 6, status: 'proposed', submittedAt: '2025-04-18',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l67, type: 'competency', dir: 'bottom_up',
    title: 'Customer Focus',
    desc: 'Rebuilding client relationships after FY25 churn. Focus: retention-first selling and needs-based demos.',
    weight: 60, level: 6, status: 'proposed', submittedAt: '2025-04-18',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l67, type: 'competency', dir: 'bottom_up',
    title: 'Adaptability & Learning',
    desc: 'Pivoting from SME-only to targeting mid-market accounts; learning enterprise sales methodology.',
    weight: 40, level: 6, status: 'proposed', submittedAt: '2025-04-18',
  });

  // L6.8–6.9 under L5.3 Arun — Standard 20K each
  for (const empId of [l68, l69]) {
    insertTarget(db, {
      orgId, cycleId: cy2526, empId, type: 'kpi', dir: 'bottom_up',
      title: 'My New Business MRR Target', unit: 'INR',
      companyTarget: 20000, planned: 20000,
      weight: 100, level: 6, status: 'proposed', submittedAt: '2025-04-19',
    });
  }

  // L6.10–6.12 under L5.4 Neha — Standard 20K each
  for (const empId of [l610, l611, l612]) {
    insertTarget(db, {
      orgId, cycleId: cy2526, empId, type: 'kpi', dir: 'bottom_up',
      title: 'My New Business MRR Target', unit: 'INR',
      companyTarget: 20000, planned: 20000,
      weight: 100, level: 6, status: 'proposed', submittedAt: '2025-04-19',
    });
  }

  // L6.13–6.15 under L5.5 Ravi — Standard 20K each
  for (const empId of [l613, l614, l615]) {
    insertTarget(db, {
      orgId, cycleId: cy2526, empId, type: 'kpi', dir: 'bottom_up',
      title: 'My New Business MRR Target', unit: 'INR',
      companyTarget: 20000, planned: 20000,
      weight: 100, level: 6, status: 'proposed', submittedAt: '2025-04-19',
    });
  }

  // L6.16–6.18 under L5.6 Pooja — Standard 20K each
  for (const empId of [l616, l617, l618]) {
    insertTarget(db, {
      orgId, cycleId: cy2526, empId, type: 'kpi', dir: 'bottom_up',
      title: 'My New Business MRR Target', unit: 'INR',
      companyTarget: 20000, planned: 20000,
      weight: 100, level: 6, status: 'proposed', submittedAt: '2025-04-20',
    });
  }

  // Competency targets for L5.3 Arun Kumar (demo login for Team Targets)
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l53, type: 'competency', dir: 'top_down',
    title: 'Leadership & Coaching',
    desc: 'Developing L6 team capacity; addressing Karan Singh performance gap with structured coaching plan.',
    weight: 40, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l42,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l53, type: 'competency', dir: 'top_down',
    title: 'Ownership & Accountability',
    desc: 'Self-absorbing team shortfall (raising own MRR from ₹35K to ₹40K) demonstrates accountability.',
    weight: 35, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l42,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: l53, type: 'competency', dir: 'top_down',
    title: 'Strategic Thinking',
    desc: 'Identifying mid-market opportunities to diversify from SME-heavy portfolio in South territory.',
    weight: 25, level: 5, status: 'approved',
    submittedAt: '2025-04-24', approvedAt: '2025-04-26', approvedBy: l42,
  });

  console.log('InfoBuz 4-cycle targets seeded. FY25-26 bidirectional demo:');
  console.log('  Chain L1→L5: all APPROVED (demo-ready for L5 managers to approve team)');
  console.log('  L6: 18 bottom-up proposals (weight=100%/goal) + competencies for key employees');
  console.log('  Over-plan: IB-S13 Ankit Joshi 25K vs 20K baseline → L5.1 Rohit burden -5K');
  console.log('  Under-plan: IB-S19 Karan Singh 15K vs 20K baseline → L5.3 Arun self-absorbs +5K');
  console.log('  V13 BLOCKED: 18 proposals unlinked → cycle cannot advance to active');
}

module.exports = { seedTargets: seedInfoBuzTargets };
