/**
 * 02_demo_targets.js
 *
 * Seeds multi-year targets, check-ins, and performance summaries for the demo orgs.
 *
 * Design intent:
 *  - KRA / KPI targets reuse the same titles across cycles (continuing, evergreen)
 *    but planned_target values grow each year — models KRA-KPI continuity.
 *  - OKR Objectives & Key Results are distinct per cycle — models strategic rotation.
 *  - Top-down cascade: CEO OKR → VP OKR (KR linked to company OKR) → GM KR → SM KPI
 *  - FY 2023-24: closed  — full actuals, manager ratings, performance summaries
 *  - FY 2024-25: review  — self-ratings done, manager rating in progress, check-ins
 *  - FY 2025-26: goal_setting — top levels approved, lower levels submitted/draft
 */

const { getDb, saveDb } = require('../database');

function rows(res) {
  if (!res.length || !res[0].values.length) return [];
  const cols = res[0].columns;
  return res[0].values.map(r => Object.fromEntries(cols.map((c, i) => [c, r[i]])));
}
function lastId(db) { return db.exec('SELECT last_insert_rowid()')[0].values[0][0]; }

// ─── helpers ────────────────────────────────────────────────────────────────

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
       review_open, review_close,
       calibration_open, calibration_close,
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

// ─── TechCorp IT company ─────────────────────────────────────────────────────

function seedTechCorpTargets(db) {
  const orgId = getOrg(db, 'TechCorp Demo');
  if (!orgId) { console.log('TechCorp Demo not found — skipping targets'); return; }

  // Idempotency: skip if targets already exist
  const existing = db.exec(`SELECT COUNT(*) FROM targets WHERE org_id = ?`, [orgId]);
  if (existing[0].values[0][0] > 0) {
    console.log('TechCorp targets already seeded — skipping');
    return;
  }

  const e = getEmpMap(db, orgId);
  const CEO = e['IT-001'];
  const vpSal = e['IT-002'], vpEng = e['IT-003'], vpSup = e['IT-004'], vpHR = e['IT-005'];
  const gmEntSal = e['IT-006'], gmSmbSal = e['IT-007'];
  const gmBackEng = e['IT-008'], gmQA = e['IT-009'];
  const smNorth = e['IT-014'], smSouth = e['IT-015'];
  const smBE = e['IT-018'];
  const mAmit = e['IT-026'];

  console.log('Seeding TechCorp targets (3 cycles)...');

  // ── Cycles ──────────────────────────────────────────────────────────────────
  const cy2324 = upsertCycle(db, orgId, {
    name: 'FY 2023-24 Annual', start: '2023-04-01', end: '2024-03-31',
    gsOpen: '2023-04-01', gsClose: '2023-05-15',
    apvOpen: '2023-05-16', apvClose: '2023-05-31',
    rvOpen: '2024-02-01', rvClose: '2024-03-15',
    calOpen: '2024-03-16', calClose: '2024-03-31',
    cascade: 'top_down', status: 'closed',
  }, CEO);

  const cy2425 = upsertCycle(db, orgId, {
    name: 'FY 2024-25 Annual', start: '2024-04-01', end: '2025-03-31',
    gsOpen: '2024-04-01', gsClose: '2024-05-15',
    apvOpen: '2024-05-16', apvClose: '2024-05-31',
    rvOpen: '2025-02-01', rvClose: '2025-03-15',
    calOpen: '2025-03-16', calClose: '2025-03-31',
    cascade: 'top_down', status: 'review',
  }, CEO);

  // FY 2025-26 created by existing seed — just fetch it
  const cy2526Res = db.exec(`SELECT id FROM review_cycles WHERE org_id = ? AND name = 'FY 2025-26 Annual'`, [orgId]);
  const cy2526 = cy2526Res[0].values[0][0];

  // ══════════════════════════════════════════════════════════════════════════
  //  FY 2023-24  (CLOSED — full actuals, ratings, summaries)
  // ══════════════════════════════════════════════════════════════════════════

  // ── CEO L1: OKR Objective ─────────────────────────────────────────────────
  const obj2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, level: 1,
    type: 'okr_objective', dir: 'top_down',
    title: 'Scale TechCorp to ₹50 Cr ARR and 120 Enterprise Clients',
    desc: 'Company-wide strategic objective for FY 2023-24',
    weight: 60, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
    selfRating: 3.9, selfComment: 'Strong progress on ARR; missed client count by a margin.',
    selfRatedAt: '2024-02-05',
    managerRating: 4.0, managerComment: 'Good year overall. Revenue target nearly met.', managerRatedAt: '2024-02-20',
    finalRating: 4.0,
  });

  // CEO OKR Key Results for FY23-24
  const kr2324 = {
    arr: insertTarget(db, {
      orgId, cycleId: cy2324, empId: CEO, parentId: obj2324, level: 1,
      type: 'okr_kr', dir: 'top_down',
      title: 'New Annual Recurring Revenue (ARR)', unit: 'INR Cr',
      companyTarget: 15, planned: 15, stretch: 17, actual: 13.8,
      weight: 30, status: 'locked',
      submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
      selfRating: 3.6, selfComment: 'Achieved ₹13.8 Cr vs ₹15 Cr target. Strong Q3 but Q4 slowed.',
      selfRatedAt: '2024-02-05',
      managerRating: 3.7, managerComment: '92% achievement — solid despite market headwinds.', managerRatedAt: '2024-02-20',
      finalRating: 3.7,
    }),
    clients: insertTarget(db, {
      orgId, cycleId: cy2324, empId: CEO, parentId: obj2324, level: 1,
      type: 'okr_kr', dir: 'top_down',
      title: 'Enterprise Client Acquisitions', unit: 'clients',
      companyTarget: 120, planned: 120, stretch: 135, actual: 118,
      weight: 15, status: 'locked',
      submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
      selfRating: 3.8, selfComment: 'Close to target; 2 deals slipped to Q1 next year.', selfRatedAt: '2024-02-05',
      managerRating: 3.8, managerComment: 'Good client additions. Focus on retention next year.', managerRatedAt: '2024-02-20',
      finalRating: 3.8,
    }),
    uptime: insertTarget(db, {
      orgId, cycleId: cy2324, empId: CEO, parentId: obj2324, level: 1,
      type: 'okr_kr', dir: 'top_down',
      title: 'Platform Uptime (SLA)', unit: '%',
      companyTarget: 99.8, planned: 99.8, stretch: 99.9, actual: 99.85,
      weight: 5, status: 'locked',
      submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
      selfRating: 4.2, selfComment: 'Exceeded planned SLA. Engineering did well.', selfRatedAt: '2024-02-05',
      managerRating: 4.3, managerComment: 'Excellent reliability track record.', managerRatedAt: '2024-02-20',
      finalRating: 4.3,
    }),
    nps: insertTarget(db, {
      orgId, cycleId: cy2324, empId: CEO, parentId: obj2324, level: 1,
      type: 'okr_kr', dir: 'top_down',
      title: 'Net Promoter Score (NPS)', unit: 'score',
      companyTarget: 60, planned: 60, stretch: 65, actual: 62,
      weight: 5, status: 'locked',
      submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
      selfRating: 4.3, selfComment: 'Beat NPS target. Customer centricity initiatives worked.', selfRatedAt: '2024-02-05',
      managerRating: 4.2, managerComment: 'NPS above target — great team effort.', managerRatedAt: '2024-02-20',
      finalRating: 4.2,
    }),
    enps: insertTarget(db, {
      orgId, cycleId: cy2324, empId: CEO, parentId: obj2324, level: 1,
      type: 'okr_kr', dir: 'top_down',
      title: 'Employee Net Promoter Score (eNPS)', unit: 'score',
      companyTarget: 55, planned: 55, stretch: 60, actual: 53,
      weight: 5, status: 'locked',
      submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
      selfRating: 3.8, selfComment: 'Slight miss. Mid-year layoffs in Q2 impacted morale.', selfRatedAt: '2024-02-05',
      managerRating: 3.7, managerComment: 'Understandable given org changes. Improving trend.', managerRatedAt: '2024-02-20',
      finalRating: 3.7,
    }),
  };

  // CEO KRA (continuing — same KRA every year, only planned_target changes)
  const kraRev2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, level: 1,
    type: 'kra', title: 'Revenue Growth', weight: 20, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
    selfRating: 3.8, selfComment: 'Good revenue growth trajectory.', selfRatedAt: '2024-02-05',
    managerRating: 3.8, managerRatedAt: '2024-02-20', finalRating: 3.8,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, parentId: kraRev2324, level: 1,
    type: 'kpi', title: 'Annual Revenue Growth Rate', unit: '%',
    planned: 40, stretch: 45, actual: 38, weight: 15, status: 'locked',
    measure: 'higher_better',
    submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
    selfRating: 3.7, selfComment: '38% vs 40% target. Still strong growth.', selfRatedAt: '2024-02-05',
    managerRating: 3.7, managerRatedAt: '2024-02-20', finalRating: 3.7,
  });

  const kraTal2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, level: 1,
    type: 'kra', title: 'Talent Acquisition & Retention', weight: 20, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
    selfRating: 4.0, selfComment: 'Attrition under control this year.', selfRatedAt: '2024-02-05',
    managerRating: 4.0, managerRatedAt: '2024-02-20', finalRating: 4.0,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, parentId: kraTal2324, level: 1,
    type: 'kpi', title: 'Annual Attrition Rate', unit: '%',
    planned: 15, stretch: 12, actual: 14.2, weight: 5, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
    selfRating: 4.0, selfComment: '14.2% — below planned max of 15%.', selfRatedAt: '2024-02-05',
    managerRating: 4.0, managerRatedAt: '2024-02-20', finalRating: 4.0,
  });

  // CEO Competencies FY23-24
  ['Strategic Thinking', 'Leadership & People Dev.', 'Customer Centricity'].forEach((comp, i) => {
    const ratings = [4.5, 4.3, 4.2];
    insertTarget(db, {
      orgId, cycleId: cy2324, empId: CEO, level: 1,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'locked',
      submittedAt: '2023-04-10', approvedAt: '2023-04-12', approvedBy: CEO,
      selfRating: ratings[i], selfRatedAt: '2024-02-05',
      managerRating: ratings[i], managerRatedAt: '2024-02-20', finalRating: ratings[i],
    });
  });

  // ── VP Sales L2 — cascade from CEO OKR ───────────────────────────────────
  const vpSalObj2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpSal, parentId: obj2324, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Drive ₹11 Cr New ARR through Enterprise & SMB Channels',
    weight: 55, status: 'locked',
    submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
    selfRating: 3.6, selfComment: 'Good performance across both segments.', selfRatedAt: '2024-02-06',
    managerRating: 3.7, managerComment: 'Suresh delivered despite tough market.', managerRatedAt: '2024-02-22',
    finalRating: 3.7,
  });
  const vpSalKR_arr = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpSal, parentId: kr2324.arr, level: 2,
    type: 'okr_kr', title: 'New ARR — Sales Contribution', unit: 'INR Cr',
    companyTarget: 15, planned: 11, stretch: 12.5, actual: 10.2,
    weight: 30, status: 'locked',
    submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
    selfRating: 3.5, selfComment: '₹10.2 Cr — 93% of target.', selfRatedAt: '2024-02-06',
    managerRating: 3.6, managerRatedAt: '2024-02-22', finalRating: 3.6,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpSal, parentId: kr2324.clients, level: 2,
    type: 'okr_kr', title: 'Enterprise Clients Won', unit: 'clients',
    companyTarget: 120, planned: 88, stretch: 100, actual: 86,
    weight: 15, status: 'locked',
    submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
    selfRating: 3.8, selfComment: '86 out of 88 — 2 deals pushed.', selfRatedAt: '2024-02-06',
    managerRating: 3.8, managerRatedAt: '2024-02-22', finalRating: 3.8,
  });
  // VP Sales KRA (continuing)
  const kraRevSal2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpSal, level: 2,
    type: 'kra', title: 'Revenue Growth', weight: 25, status: 'locked',
    submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
    selfRating: 3.7, selfRatedAt: '2024-02-06',
    managerRating: 3.7, managerRatedAt: '2024-02-22', finalRating: 3.7,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpSal, parentId: kraRevSal2324, level: 2,
    type: 'kpi', title: 'Monthly New Bookings Revenue', unit: 'INR Lakh',
    planned: 90, stretch: 104, actual: 85, weight: 10, status: 'locked',
    submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
    selfRating: 3.6, selfRatedAt: '2024-02-06',
    managerRating: 3.7, managerRatedAt: '2024-02-22', finalRating: 3.7,
  });
  // VP Sales competencies
  ['Leadership & People Dev.', 'Customer Centricity', 'Communication & Influence'].forEach((comp, i) => {
    const r = [4.2, 4.0, 4.3][i];
    insertTarget(db, {
      orgId, cycleId: cy2324, empId: vpSal, level: 2,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'locked',
      submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
      selfRating: r, selfRatedAt: '2024-02-06',
      managerRating: r, managerRatedAt: '2024-02-22', finalRating: r,
    });
  });

  // ── VP Engineering L2 ─────────────────────────────────────────────────────
  const vpEngObj2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpEng, parentId: obj2324, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Deliver a Reliable, High-Velocity Product Platform',
    weight: 55, status: 'locked',
    submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
    selfRating: 4.2, selfComment: 'Strong delivery year with uptime above target.', selfRatedAt: '2024-02-06',
    managerRating: 4.3, managerComment: 'Ramesh led engineering excellently.', managerRatedAt: '2024-02-22',
    finalRating: 4.3,
  });
  const vpEngKR_uptime = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpEng, parentId: kr2324.uptime, level: 2,
    type: 'okr_kr', title: 'Platform Uptime (SLA)', unit: '%',
    companyTarget: 99.8, planned: 99.8, stretch: 99.9, actual: 99.85,
    weight: 20, status: 'locked',
    submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
    selfRating: 4.3, selfComment: 'Maintained above SLA consistently.', selfRatedAt: '2024-02-06',
    managerRating: 4.4, managerRatedAt: '2024-02-22', finalRating: 4.4,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpEng, parentId: vpEngObj2324, level: 2,
    type: 'okr_kr', title: 'Feature Release Velocity', unit: 'features',
    planned: 18, stretch: 22, actual: 20,
    weight: 20, status: 'locked',
    submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
    selfRating: 4.4, selfComment: '20 features shipped — beat target.', selfRatedAt: '2024-02-06',
    managerRating: 4.4, managerRatedAt: '2024-02-22', finalRating: 4.4,
  });
  // VP Eng KRA (continuing)
  const kraProd2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpEng, level: 2,
    type: 'kra', title: 'Product Quality & Reliability', weight: 25, status: 'locked',
    submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
    selfRating: 4.3, selfRatedAt: '2024-02-06',
    managerRating: 4.3, managerRatedAt: '2024-02-22', finalRating: 4.3,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpEng, parentId: kraProd2324, level: 2,
    type: 'kpi', title: 'Bug Escape Rate', unit: '%',
    planned: 2, stretch: 1.5, actual: 1.8, weight: 10, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2024-02-06',
    managerRating: 4.2, managerRatedAt: '2024-02-22', finalRating: 4.2,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpEng, parentId: kraProd2324, level: 2,
    type: 'kpi', title: 'Sprint Velocity', unit: 'points',
    planned: 36, stretch: 42, actual: 38, weight: 10, status: 'locked',
    submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2024-02-06',
    managerRating: 4.1, managerRatedAt: '2024-02-22', finalRating: 4.1,
  });
  // VP Eng competencies
  ['Technical Problem Solving', 'Leadership & People Dev.', 'Ownership & Accountability'].forEach((comp, i) => {
    const r = [4.5, 4.2, 4.4][i];
    insertTarget(db, {
      orgId, cycleId: cy2324, empId: vpEng, level: 2,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'locked',
      submittedAt: '2023-04-14', approvedAt: '2023-04-18', approvedBy: CEO,
      selfRating: r, selfRatedAt: '2024-02-06',
      managerRating: r, managerRatedAt: '2024-02-22', finalRating: r,
    });
  });

  // ── GM Enterprise Sales L3 (Raj Kapoor IT-006) ───────────────────────────
  const gmEntObj2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: gmEntSal, parentId: vpSalObj2324, level: 3,
    type: 'okr_objective', dir: 'top_down',
    title: 'Win ₹7 Cr from Enterprise Segment (6+ months deals)',
    weight: 55, status: 'locked',
    submittedAt: '2023-04-18', approvedAt: '2023-04-22', approvedBy: vpSal,
    selfRating: 3.5, selfRatedAt: '2024-02-07',
    managerRating: 3.6, managerRatedAt: '2024-02-23', finalRating: 3.6,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: gmEntSal, parentId: vpSalKR_arr, level: 3,
    type: 'okr_kr', title: 'Enterprise ARR Won', unit: 'INR Cr',
    companyTarget: 11, planned: 7, stretch: 8, actual: 6.5,
    weight: 30, status: 'locked',
    submittedAt: '2023-04-18', approvedAt: '2023-04-22', approvedBy: vpSal,
    selfRating: 3.5, selfComment: '₹6.5 Cr — 93% achievement. Lost 1 large deal.', selfRatedAt: '2024-02-07',
    managerRating: 3.6, managerRatedAt: '2024-02-23', finalRating: 3.6,
  });
  // GM Ent KRA (continuing)
  const kraRevEnt2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: gmEntSal, level: 3,
    type: 'kra', title: 'Revenue Growth', weight: 30, status: 'locked',
    submittedAt: '2023-04-18', approvedAt: '2023-04-22', approvedBy: vpSal,
    selfRating: 3.6, selfRatedAt: '2024-02-07',
    managerRating: 3.6, managerRatedAt: '2024-02-23', finalRating: 3.6,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: gmEntSal, parentId: kraRevEnt2324, level: 3,
    type: 'kpi', title: 'Avg Deal Size (Enterprise)', unit: 'INR Lakh',
    planned: 25, stretch: 30, actual: 23, weight: 15, status: 'locked',
    submittedAt: '2023-04-18', approvedAt: '2023-04-22', approvedBy: vpSal,
    selfRating: 3.5, selfRatedAt: '2024-02-07',
    managerRating: 3.5, managerRatedAt: '2024-02-23', finalRating: 3.5,
  });
  ['Customer Centricity', 'Communication & Influence', 'Ownership & Accountability'].forEach((comp, i) => {
    const r = [4.0, 4.2, 3.9][i];
    insertTarget(db, {
      orgId, cycleId: cy2324, empId: gmEntSal, level: 3,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'locked',
      submittedAt: '2023-04-18', approvedAt: '2023-04-22', approvedBy: vpSal,
      selfRating: r, selfRatedAt: '2024-02-07',
      managerRating: r, managerRatedAt: '2024-02-23', finalRating: r,
    });
  });

  // ── GM Backend Engineering L3 (Kiran Patel IT-008) ───────────────────────
  const gmBackObj2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: gmBackEng, parentId: vpEngObj2324, level: 3,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build a Scalable, Zero-Downtime Backend Platform',
    weight: 50, status: 'locked',
    submittedAt: '2023-04-18', approvedAt: '2023-04-22', approvedBy: vpEng,
    selfRating: 4.3, selfRatedAt: '2024-02-07',
    managerRating: 4.4, managerRatedAt: '2024-02-23', finalRating: 4.4,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: gmBackEng, parentId: vpEngKR_uptime, level: 3,
    type: 'okr_kr', title: 'API Uptime', unit: '%',
    companyTarget: 99.8, planned: 99.85, stretch: 99.95, actual: 99.88,
    weight: 25, status: 'locked',
    submittedAt: '2023-04-18', approvedAt: '2023-04-22', approvedBy: vpEng,
    selfRating: 4.4, selfComment: 'All critical APIs maintained above SLA.', selfRatedAt: '2024-02-07',
    managerRating: 4.5, managerRatedAt: '2024-02-23', finalRating: 4.5,
  });
  // GM Backend KRA (continuing)
  const kraProdBack2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: gmBackEng, level: 3,
    type: 'kra', title: 'Product Quality & Reliability', weight: 30, status: 'locked',
    submittedAt: '2023-04-18', approvedAt: '2023-04-22', approvedBy: vpEng,
    selfRating: 4.3, selfRatedAt: '2024-02-07',
    managerRating: 4.3, managerRatedAt: '2024-02-23', finalRating: 4.3,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: gmBackEng, parentId: kraProdBack2324, level: 3,
    type: 'kpi', title: 'Sprint Velocity', unit: 'points',
    planned: 38, stretch: 44, actual: 40, weight: 10, status: 'locked',
    submittedAt: '2023-04-18', approvedAt: '2023-04-22', approvedBy: vpEng,
    selfRating: 4.2, selfRatedAt: '2024-02-07',
    managerRating: 4.2, managerRatedAt: '2024-02-23', finalRating: 4.2,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: gmBackEng, parentId: kraProdBack2324, level: 3,
    type: 'kpi', title: 'Bug Escape Rate', unit: '%',
    planned: 2, stretch: 1, actual: 1.6, weight: 10, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-18', approvedAt: '2023-04-22', approvedBy: vpEng,
    selfRating: 4.3, selfRatedAt: '2024-02-07',
    managerRating: 4.3, managerRatedAt: '2024-02-23', finalRating: 4.3,
  });
  ['Technical Problem Solving', 'Ownership & Accountability', 'Collaboration & Teamwork'].forEach((comp, i) => {
    const r = [4.5, 4.4, 4.1][i];
    insertTarget(db, {
      orgId, cycleId: cy2324, empId: gmBackEng, level: 3,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'locked',
      submittedAt: '2023-04-18', approvedAt: '2023-04-22', approvedBy: vpEng,
      selfRating: r, selfRatedAt: '2024-02-07',
      managerRating: r, managerRatedAt: '2024-02-23', finalRating: r,
    });
  });

  // ── SM North Enterprise Sales L4 (Vikas Gupta IT-014) ────────────────────
  const smNorthKR_arr = insertTarget(db, {
    orgId, cycleId: cy2324, empId: smNorth, parentId: vpSalKR_arr, level: 4,
    type: 'okr_kr', title: 'North Region Enterprise ARR', unit: 'INR Cr',
    companyTarget: 11, planned: 4, stretch: 4.5, actual: 3.7,
    weight: 35, status: 'locked',
    submittedAt: '2023-04-22', approvedAt: '2023-04-26', approvedBy: gmEntSal,
    selfRating: 3.4, selfComment: '₹3.7 Cr — 92.5% of target. North deals have longer cycles.', selfRatedAt: '2024-02-07',
    managerRating: 3.5, managerRatedAt: '2024-02-24', finalRating: 3.5,
  });
  const kraRevNorth2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: smNorth, level: 4,
    type: 'kra', title: 'Revenue Growth', weight: 35, status: 'locked',
    submittedAt: '2023-04-22', approvedAt: '2023-04-26', approvedBy: gmEntSal,
    selfRating: 3.6, selfRatedAt: '2024-02-07',
    managerRating: 3.6, managerRatedAt: '2024-02-24', finalRating: 3.6,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: smNorth, parentId: kraRevNorth2324, level: 4,
    type: 'kpi', title: 'Monthly Pipeline Generated', unit: 'INR Lakh',
    planned: 60, stretch: 70, actual: 55, weight: 15, status: 'locked',
    submittedAt: '2023-04-22', approvedAt: '2023-04-26', approvedBy: gmEntSal,
    selfRating: 3.5, selfRatedAt: '2024-02-07',
    managerRating: 3.5, managerRatedAt: '2024-02-24', finalRating: 3.5,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: smNorth, level: 4,
    type: 'kpi', title: 'Win Rate', unit: '%',
    planned: 30, stretch: 35, actual: 28, weight: 15, status: 'locked',
    submittedAt: '2023-04-22', approvedAt: '2023-04-26', approvedBy: gmEntSal,
    selfRating: 3.5, selfRatedAt: '2024-02-07',
    managerRating: 3.5, managerRatedAt: '2024-02-24', finalRating: 3.5,
  });
  ['Customer Centricity', 'Ownership & Accountability'].forEach((comp, i) => {
    const r = [3.8, 3.9][i];
    insertTarget(db, {
      orgId, cycleId: cy2324, empId: smNorth, level: 4,
      type: 'competency', title: comp, weight: [55, 45][i], status: 'locked',
      submittedAt: '2023-04-22', approvedAt: '2023-04-26', approvedBy: gmEntSal,
      selfRating: r, selfRatedAt: '2024-02-07',
      managerRating: r, managerRatedAt: '2024-02-24', finalRating: r,
    });
  });

  // ── SM Backend Engineering L4 (Aryan Bose IT-018) ────────────────────────
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: smBE, parentId: vpEngKR_uptime, level: 4,
    type: 'okr_kr', title: 'Core API P99 Latency', unit: 'ms',
    planned: 200, stretch: 150, actual: 185, weight: 30, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-22', approvedAt: '2023-04-26', approvedBy: gmBackEng,
    selfRating: 4.1, selfComment: 'Latency reduced significantly. Room for more.', selfRatedAt: '2024-02-07',
    managerRating: 4.2, managerRatedAt: '2024-02-24', finalRating: 4.2,
  });
  const kraProdBE2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: smBE, level: 4,
    type: 'kra', title: 'Product Quality & Reliability', weight: 30, status: 'locked',
    submittedAt: '2023-04-22', approvedAt: '2023-04-26', approvedBy: gmBackEng,
    selfRating: 4.3, selfRatedAt: '2024-02-07',
    managerRating: 4.3, managerRatedAt: '2024-02-24', finalRating: 4.3,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: smBE, parentId: kraProdBE2324, level: 4,
    type: 'kpi', title: 'Sprint Velocity', unit: 'points',
    planned: 40, stretch: 46, actual: 42, weight: 15, status: 'locked',
    submittedAt: '2023-04-22', approvedAt: '2023-04-26', approvedBy: gmBackEng,
    selfRating: 4.2, selfRatedAt: '2024-02-07',
    managerRating: 4.2, managerRatedAt: '2024-02-24', finalRating: 4.2,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: smBE, parentId: kraProdBE2324, level: 4,
    type: 'kpi', title: 'Bug Escape Rate', unit: '%',
    planned: 1.5, stretch: 1, actual: 1.2, weight: 15, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-22', approvedAt: '2023-04-26', approvedBy: gmBackEng,
    selfRating: 4.4, selfRatedAt: '2024-02-07',
    managerRating: 4.4, managerRatedAt: '2024-02-24', finalRating: 4.4,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: smBE, level: 4,
    type: 'kpi', title: 'Code Review Coverage', unit: '%',
    planned: 85, stretch: 95, actual: 90, weight: 10, status: 'locked',
    submittedAt: '2023-04-22', approvedAt: '2023-04-26', approvedBy: gmBackEng,
    selfRating: 4.3, selfRatedAt: '2024-02-07',
    managerRating: 4.3, managerRatedAt: '2024-02-24', finalRating: 4.3,
  });
  ['Technical Problem Solving', 'Collaboration & Teamwork'].forEach((comp, i) => {
    const r = [4.5, 4.2][i];
    insertTarget(db, {
      orgId, cycleId: cy2324, empId: smBE, level: 4,
      type: 'competency', title: comp, weight: [60, 40][i], status: 'locked',
      submittedAt: '2023-04-22', approvedAt: '2023-04-26', approvedBy: gmBackEng,
      selfRating: r, selfRatedAt: '2024-02-07',
      managerRating: r, managerRatedAt: '2024-02-24', finalRating: r,
    });
  });

  // ── FY23-24 Performance Summaries ─────────────────────────────────────────
  // goal_score = weighted avg of non-competency final_ratings
  // comp_score = weighted avg of competency final_ratings
  // final_score = goal_score * 0.7 + comp_score * 0.3
  const summaries2324 = [
    // [empId, goal_score, comp_score, final_score, band]
    [CEO,       3.88, 4.33, 4.02, 'Exceeds'],
    [vpSal,     3.68, 4.17, 3.83, 'Exceeds'],
    [vpEng,     4.26, 4.37, 4.29, 'Exceeds'],
    [gmEntSal,  3.55, 4.03, 3.70, 'Exceeds'],
    [gmBackEng, 4.33, 4.33, 4.33, 'Exceeds'],
    [smNorth,   3.50, 3.85, 3.61, 'Exceeds'],
    [smBE,      4.24, 4.37, 4.28, 'Exceeds'],
  ];
  summaries2324.forEach(([empId, gs, cs, fs, band]) => {
    db.run(`
      INSERT OR IGNORE INTO performance_summary
        (cycle_id, employee_id, goal_score, competency_score, final_score, performance_band, is_pip_triggered, calibrated, computed_at)
      VALUES (?,?,?,?,?,?,0,1,?)`,
      [cy2324, empId, gs, cs, fs, band, '2024-03-20']
    );
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  FY 2024-25  (REVIEW — self-ratings done, manager review in progress)
  //  Uses 'active' status (cycle in review, targets locked for review)
  // ══════════════════════════════════════════════════════════════════════════

  // ── CEO OKR FY24-25 ───────────────────────────────────────────────────────
  const obj2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, level: 1,
    type: 'okr_objective', dir: 'top_down',
    title: 'Drive TechCorp to ₹75 Cr ARR and 160 Enterprise Clients',
    weight: 60, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
    selfRating: 4.1, selfComment: 'Excellent year — ARR tracking well, NPS hit a new high.', selfRatedAt: '2025-02-05',
  });
  const kr2425 = {
    arr: insertTarget(db, {
      orgId, cycleId: cy2425, empId: CEO, parentId: obj2425, level: 1,
      type: 'okr_kr', title: 'New Annual Recurring Revenue (ARR)', unit: 'INR Cr',
      companyTarget: 25, planned: 25, stretch: 28, actual: 23.4,
      weight: 30, status: 'active',
      submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
      selfRating: 4.0, selfComment: '₹23.4 Cr of ₹25 Cr — 94%. Strong H2.', selfRatedAt: '2025-02-05',
    }),
    clients: insertTarget(db, {
      orgId, cycleId: cy2425, empId: CEO, parentId: obj2425, level: 1,
      type: 'okr_kr', title: 'Enterprise Client Acquisitions', unit: 'clients',
      companyTarget: 160, planned: 160, stretch: 175, actual: 155,
      weight: 15, status: 'active',
      submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
      selfRating: 3.9, selfComment: '155 of 160 — 97%. Great retention + acquisition combo.', selfRatedAt: '2025-02-05',
    }),
    uptime: insertTarget(db, {
      orgId, cycleId: cy2425, empId: CEO, parentId: obj2425, level: 1,
      type: 'okr_kr', title: 'Platform Uptime (SLA)', unit: '%',
      companyTarget: 99.9, planned: 99.9, stretch: 99.95, actual: 99.87,
      weight: 5, status: 'active',
      submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
      selfRating: 3.8, selfComment: 'Slightly below 99.9% — one major incident in Aug 2024.', selfRatedAt: '2025-02-05',
    }),
    nps: insertTarget(db, {
      orgId, cycleId: cy2425, empId: CEO, parentId: obj2425, level: 1,
      type: 'okr_kr', title: 'Net Promoter Score (NPS)', unit: 'score',
      companyTarget: 65, planned: 65, stretch: 70, actual: 68,
      weight: 5, status: 'active',
      submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
      selfRating: 4.5, selfComment: 'Beat NPS target — best ever score!', selfRatedAt: '2025-02-05',
    }),
    enps: insertTarget(db, {
      orgId, cycleId: cy2425, empId: CEO, parentId: obj2425, level: 1,
      type: 'okr_kr', title: 'Employee Net Promoter Score (eNPS)', unit: 'score',
      companyTarget: 60, planned: 60, stretch: 65, actual: 58,
      weight: 5, status: 'active',
      submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
      selfRating: 3.8, selfComment: 'Slight miss — talent market competitive this year.', selfRatedAt: '2025-02-05',
    }),
  };
  // CEO KRA FY24-25 (same KRA titles, updated targets)
  const kraRev2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, level: 1,
    type: 'kra', title: 'Revenue Growth', weight: 20, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
    selfRating: 4.0, selfRatedAt: '2025-02-05',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, parentId: kraRev2425, level: 1,
    type: 'kpi', title: 'Annual Revenue Growth Rate', unit: '%',
    planned: 50, stretch: 55, actual: 47, weight: 15, status: 'active',
    measure: 'higher_better',
    submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
    selfRating: 4.0, selfComment: '47% growth vs 50% target.', selfRatedAt: '2025-02-05',
  });
  const kraTal2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, level: 1,
    type: 'kra', title: 'Talent Acquisition & Retention', weight: 20, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
    selfRating: 3.7, selfRatedAt: '2025-02-05',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, parentId: kraTal2425, level: 1,
    type: 'kpi', title: 'Annual Attrition Rate', unit: '%',
    planned: 12, stretch: 10, actual: 13, weight: 5, status: 'active',
    measure: 'lower_better',
    submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
    selfRating: 3.5, selfComment: '13% vs 12% target — slightly above plan.', selfRatedAt: '2025-02-05',
  });
  // CEO competencies FY24-25
  ['Strategic Thinking', 'Leadership & People Dev.', 'Customer Centricity'].forEach((comp, i) => {
    const r = [4.6, 4.4, 4.3][i];
    insertTarget(db, {
      orgId, cycleId: cy2425, empId: CEO, level: 1,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'active',
      submittedAt: '2024-04-10', approvedAt: '2024-04-12', approvedBy: CEO,
      selfRating: r, selfRatedAt: '2025-02-05',
    });
  });

  // ── VP Sales FY24-25 ──────────────────────────────────────────────────────
  const vpSalObj2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpSal, parentId: obj2425, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Deliver ₹18 Cr New ARR through Scaled Enterprise & SMB Motion',
    weight: 55, status: 'active',
    submittedAt: '2024-04-14', approvedAt: '2024-04-18', approvedBy: CEO,
    selfRating: 4.0, selfRatedAt: '2025-02-06',
  });
  const vpSalKR_arr2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpSal, parentId: kr2425.arr, level: 2,
    type: 'okr_kr', title: 'New ARR — Sales Contribution', unit: 'INR Cr',
    companyTarget: 25, planned: 18, stretch: 21, actual: 16.8,
    weight: 30, status: 'active',
    submittedAt: '2024-04-14', approvedAt: '2024-04-18', approvedBy: CEO,
    selfRating: 4.0, selfComment: '₹16.8 Cr — 93%. Strong close in Q4.', selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpSal, parentId: kr2425.clients, level: 2,
    type: 'okr_kr', title: 'Enterprise Clients Won', unit: 'clients',
    companyTarget: 160, planned: 120, stretch: 135, actual: 116,
    weight: 15, status: 'active',
    submittedAt: '2024-04-14', approvedAt: '2024-04-18', approvedBy: CEO,
    selfRating: 3.9, selfComment: '116 of 120 — strong growth over prior year.', selfRatedAt: '2025-02-06',
  });
  // KRA (continuing)
  const kraRevSal2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpSal, level: 2,
    type: 'kra', title: 'Revenue Growth', weight: 25, status: 'active',
    submittedAt: '2024-04-14', approvedAt: '2024-04-18', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpSal, parentId: kraRevSal2425, level: 2,
    type: 'kpi', title: 'Monthly New Bookings Revenue', unit: 'INR Lakh',
    planned: 150, stretch: 175, actual: 140, weight: 10, status: 'active',
    submittedAt: '2024-04-14', approvedAt: '2024-04-18', approvedBy: CEO,
    selfRating: 3.9, selfRatedAt: '2025-02-06',
  });

  // ── VP Engineering FY24-25 ────────────────────────────────────────────────
  const vpEngObj2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpEng, parentId: obj2425, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Achieve 99.9% Uptime and 24-Feature Annual Release Cadence',
    weight: 55, status: 'active',
    submittedAt: '2024-04-14', approvedAt: '2024-04-18', approvedBy: CEO,
    selfRating: 3.9, selfRatedAt: '2025-02-06',
  });
  const vpEngKR_uptime2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpEng, parentId: kr2425.uptime, level: 2,
    type: 'okr_kr', title: 'Platform Uptime (SLA)', unit: '%',
    companyTarget: 99.9, planned: 99.9, stretch: 99.95, actual: 99.87,
    weight: 20, status: 'active',
    submittedAt: '2024-04-14', approvedAt: '2024-04-18', approvedBy: CEO,
    selfRating: 3.8, selfComment: 'Aug 2024 incident pulled us below target. RCA done.', selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpEng, parentId: vpEngObj2425, level: 2,
    type: 'okr_kr', title: 'Feature Release Velocity', unit: 'features',
    planned: 24, stretch: 28, actual: 26,
    weight: 20, status: 'active',
    submittedAt: '2024-04-14', approvedAt: '2024-04-18', approvedBy: CEO,
    selfRating: 4.4, selfComment: 'Beat feature target — team shipped 26 features.', selfRatedAt: '2025-02-06',
  });
  const kraProd2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpEng, level: 2,
    type: 'kra', title: 'Product Quality & Reliability', weight: 25, status: 'active',
    submittedAt: '2024-04-14', approvedAt: '2024-04-18', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpEng, parentId: kraProd2425, level: 2,
    type: 'kpi', title: 'Bug Escape Rate', unit: '%',
    planned: 1.5, stretch: 1, actual: 1.4, weight: 10, status: 'active',
    measure: 'lower_better',
    submittedAt: '2024-04-14', approvedAt: '2024-04-18', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpEng, parentId: kraProd2425, level: 2,
    type: 'kpi', title: 'Sprint Velocity', unit: 'points',
    planned: 40, stretch: 46, actual: 42, weight: 10, status: 'active',
    submittedAt: '2024-04-14', approvedAt: '2024-04-18', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2025-02-06',
  });

  // ── GM Enterprise Sales L3 FY24-25 ───────────────────────────────────────
  const gmEntObj2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: gmEntSal, parentId: vpSalObj2425, level: 3,
    type: 'okr_objective', dir: 'top_down',
    title: 'Win ₹10 Cr from Enterprise Segment (6-month deal cycles)',
    weight: 55, status: 'active',
    submittedAt: '2024-04-18', approvedAt: '2024-04-22', approvedBy: vpSal,
    selfRating: 3.9, selfRatedAt: '2025-02-07',
  });
  const gmEntKR_arr2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: gmEntSal, parentId: vpSalKR_arr2425, level: 3,
    type: 'okr_kr', title: 'Enterprise ARR Won', unit: 'INR Cr',
    companyTarget: 18, planned: 10, stretch: 11.5, actual: 9.6,
    weight: 30, status: 'active',
    submittedAt: '2024-04-18', approvedAt: '2024-04-22', approvedBy: vpSal,
    selfRating: 3.9, selfComment: '₹9.6 Cr — 96% of target. Lost 1 renewal at end of year.', selfRatedAt: '2025-02-07',
  });
  const kraRevEnt2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: gmEntSal, level: 3,
    type: 'kra', title: 'Revenue Growth', weight: 30, status: 'active',
    submittedAt: '2024-04-18', approvedAt: '2024-04-22', approvedBy: vpSal,
    selfRating: 3.9, selfRatedAt: '2025-02-07',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: gmEntSal, parentId: kraRevEnt2425, level: 3,
    type: 'kpi', title: 'Avg Deal Size (Enterprise)', unit: 'INR Lakh',
    planned: 28, stretch: 33, actual: 27, weight: 15, status: 'active',
    submittedAt: '2024-04-18', approvedAt: '2024-04-22', approvedBy: vpSal,
    selfRating: 3.8, selfRatedAt: '2025-02-07',
  });

  // ── SM North L4 FY24-25 ───────────────────────────────────────────────────
  const smNorthKR_arr2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: smNorth, parentId: gmEntKR_arr2425, level: 4,
    type: 'okr_kr', title: 'North Region Enterprise ARR', unit: 'INR Cr',
    companyTarget: 18, planned: 5.5, stretch: 6.2, actual: 5.3,
    weight: 35, status: 'active',
    submittedAt: '2024-04-22', approvedAt: '2024-04-26', approvedBy: gmEntSal,
    selfRating: 4.0, selfComment: '₹5.3 Cr — 96% of target. Best year for North region.', selfRatedAt: '2025-02-07',
  });
  const kraRevNorth2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: smNorth, level: 4,
    type: 'kra', title: 'Revenue Growth', weight: 35, status: 'active',
    submittedAt: '2024-04-22', approvedAt: '2024-04-26', approvedBy: gmEntSal,
    selfRating: 4.0, selfRatedAt: '2025-02-07',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: smNorth, parentId: kraRevNorth2425, level: 4,
    type: 'kpi', title: 'Monthly Pipeline Generated', unit: 'INR Lakh',
    planned: 70, stretch: 80, actual: 68, weight: 15, status: 'active',
    submittedAt: '2024-04-22', approvedAt: '2024-04-26', approvedBy: gmEntSal,
    selfRating: 3.9, selfRatedAt: '2025-02-07',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: smNorth, level: 4,
    type: 'kpi', title: 'Win Rate', unit: '%',
    planned: 32, stretch: 38, actual: 34, weight: 15, status: 'active',
    submittedAt: '2024-04-22', approvedAt: '2024-04-26', approvedBy: gmEntSal,
    selfRating: 4.1, selfRatedAt: '2025-02-07',
  });

  // ── Check-ins: FY24-25 quarterly updates for CEO KR — New ARR ────────────
  const ceoArrTarget = kr2425.arr;
  [
    { label: 'Q1 Apr–Jun 2024', actual: 4.8, pct: 19.2,
      notes: 'Slow start to year. Pipeline strong but deals not closed. On track.', ackedBy: CEO, ackedAt: '2024-07-05' },
    { label: 'Q2 Jul–Sep 2024', actual: 10.9, pct: 43.6,
      notes: 'Strong Q2. 3 large enterprise deals closed. Uptime incident contained.', ackedBy: CEO, ackedAt: '2024-10-07' },
    { label: 'Q3 Oct–Dec 2024', actual: 17.8, pct: 71.2,
      notes: 'On track. 7.4 Cr added in Q3. Holiday slowdown expected in Dec.', ackedBy: CEO, ackedAt: '2025-01-06' },
    { label: 'Q4 Jan–Mar 2025', actual: 23.4, pct: 93.6,
      notes: 'Year-end push got us to ₹23.4 Cr. Minor miss vs ₹25 Cr target.', ackedBy: CEO, ackedAt: '2025-04-02' },
  ].forEach(c => insertCheckin(db, {
    targetId: ceoArrTarget, empId: CEO, cycleId: cy2425,
    periodType: 'quarterly', label: c.label,
    actual: c.actual, pct: c.pct, notes: c.notes,
    ackedBy: c.ackedBy, ackedAt: c.ackedAt,
  }));

  // Monthly check-ins for VP Sales ARR (FY24-25)
  const vpSalArrT = vpSalKR_arr2425;
  [
    ['Apr 2024', 1.1, 6.1,  'April soft — season start. Pipeline building.'],
    ['May 2024', 2.5, 13.9, 'Good progress. 2 SMB deals closed.'],
    ['Jun 2024', 3.7, 20.6, 'Q1 close — ₹1.2 Cr added. Moderate.'],
    ['Jul 2024', 5.3, 29.4, 'Big enterprise deal signed. Q2 momentum.'],
    ['Aug 2024', 7.1, 39.4, 'Uptime incident created client hesitation. Still progressing.'],
    ['Sep 2024', 8.9, 49.4, 'Q2 close strong. Recovered from Aug.'],
    ['Oct 2024', 10.8, 60,  'Q3 started well. 2 new enterprise logos.'],
    ['Nov 2024', 12.6, 70,  'On track. Key deals in negotiation.'],
    ['Dec 2024', 14.0, 77.8,'Holiday slowdown. Some deals pushed.'],
    ['Jan 2025', 15.5, 86.1,'Q4 kickoff. Deal velocity improved.'],
    ['Feb 2025', 16.1, 89.4,'Negotiation delays. Pushing for Q4 close.'],
    ['Mar 2025', 16.8, 93.3,'Year close. ₹16.8 Cr — strong growth YoY.'],
  ].forEach(([label, actual, pct, notes]) => insertCheckin(db, {
    targetId: vpSalArrT, empId: vpSal, cycleId: cy2425,
    periodType: 'monthly', label, actual, pct, notes,
    ackedBy: CEO, ackedAt: label.includes('Mar') ? '2025-04-05' : null,
  }));

  // Monthly check-ins for VP Eng Uptime (FY24-25)
  const vpEngUptimeT = vpEngKR_uptime2425;
  [
    ['Apr 2024', 99.97, 100,  'Excellent uptime. Zero incidents.'],
    ['May 2024', 99.95, 100,  'Stable. Minor maintenance windows.'],
    ['Jun 2024', 99.92, 100,  'Q1 close. SLA met comfortably.'],
    ['Jul 2024', 99.96, 100,  'Strong. New infra upgrades deployed.'],
    ['Aug 2024', 99.74, 77.8, 'CRITICAL: 6-hour outage Aug 14. RCA completed. Database failover failure.'],
    ['Sep 2024', 99.91, 91.1, 'Recovery. New DR procedures live.'],
    ['Oct 2024', 99.95, 100,  'Back to target levels.'],
    ['Nov 2024', 99.97, 100,  'Zero incidents. Holiday prep done.'],
    ['Dec 2024', 99.93, 93,   'Minor degradation during peak traffic.'],
    ['Jan 2025', 99.96, 100,  'Stable. Zero incidents.'],
    ['Feb 2025', 99.94, 100,  'Good. Load testing completed.'],
    ['Mar 2025', 99.87, 87,   'Year-end average: 99.87% (slightly below 99.9% target).'],
  ].forEach(([label, actual, pct, notes]) => insertCheckin(db, {
    targetId: vpEngUptimeT, empId: vpEng, cycleId: cy2425,
    periodType: 'monthly', label, actual, pct, notes,
    ackedBy: CEO, ackedAt: null,
  }));

  // Quarterly check-ins for North SM ARR (FY24-25)
  [
    ['Q1 Apr–Jun 2024', 0.9, 16.4, 'Slow start. Two large deals in proposal stage.'],
    ['Q2 Jul–Sep 2024', 2.4, 43.6, 'Closed 3 deals including one large account.'],
    ['Q3 Oct–Dec 2024', 4.1, 74.5, 'Strong Q3. North region gaining momentum.'],
    ['Q4 Jan–Mar 2025', 5.3, 96.4, 'Year-end close. Best north region performance.'],
  ].forEach(([label, actual, pct, notes]) => insertCheckin(db, {
    targetId: smNorthKR_arr2425, empId: smNorth, cycleId: cy2425,
    periodType: 'quarterly', label, actual, pct, notes,
    ackedBy: gmEntSal, ackedAt: null,
  }));

  // ══════════════════════════════════════════════════════════════════════════
  //  FY 2025-26  (GOAL_SETTING — CEO approved, VPs submitted, GMs draft)
  // ══════════════════════════════════════════════════════════════════════════

  // ── CEO OKR FY25-26 (approved) ───────────────────────────────────────────
  const obj2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, level: 1,
    type: 'okr_objective', dir: 'top_down',
    title: 'Achieve ₹100 Cr ARR Milestone and 200 Enterprise Clients',
    desc: 'Landmark year — cross ₹100 Cr ARR and double our enterprise base to 200+.',
    weight: 60, status: 'approved',
    submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
  });
  const kr2526 = {
    arr: insertTarget(db, {
      orgId, cycleId: cy2526, empId: CEO, parentId: obj2526, level: 1,
      type: 'okr_kr', title: 'New Annual Recurring Revenue (ARR)', unit: 'INR Cr',
      companyTarget: 35, planned: 35, stretch: 40,
      weight: 30, status: 'approved',
      submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
    }),
    clients: insertTarget(db, {
      orgId, cycleId: cy2526, empId: CEO, parentId: obj2526, level: 1,
      type: 'okr_kr', title: 'Enterprise Client Acquisitions', unit: 'clients',
      companyTarget: 200, planned: 200, stretch: 220,
      weight: 15, status: 'approved',
      submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
    }),
    uptime: insertTarget(db, {
      orgId, cycleId: cy2526, empId: CEO, parentId: obj2526, level: 1,
      type: 'okr_kr', title: 'Platform Uptime (SLA)', unit: '%',
      companyTarget: 99.95, planned: 99.95, stretch: 99.99,
      weight: 5, status: 'approved',
      submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
    }),
    nps: insertTarget(db, {
      orgId, cycleId: cy2526, empId: CEO, parentId: obj2526, level: 1,
      type: 'okr_kr', title: 'Net Promoter Score (NPS)', unit: 'score',
      companyTarget: 70, planned: 70, stretch: 75,
      weight: 5, status: 'approved',
      submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
    }),
    enps: insertTarget(db, {
      orgId, cycleId: cy2526, empId: CEO, parentId: obj2526, level: 1,
      type: 'okr_kr', title: 'Employee Net Promoter Score (eNPS)', unit: 'score',
      companyTarget: 65, planned: 65, stretch: 70,
      weight: 5, status: 'approved',
      submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
    }),
  };
  // CEO KRA FY25-26 (continuing — updated targets)
  const kraRev2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, level: 1,
    type: 'kra', title: 'Revenue Growth', weight: 20, status: 'approved',
    submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, parentId: kraRev2526, level: 1,
    type: 'kpi', title: 'Annual Revenue Growth Rate', unit: '%',
    planned: 60, stretch: 70, weight: 15, status: 'approved',
    submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
  });
  const kraTal2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, level: 1,
    type: 'kra', title: 'Talent Acquisition & Retention', weight: 20, status: 'approved',
    submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, parentId: kraTal2526, level: 1,
    type: 'kpi', title: 'Annual Attrition Rate', unit: '%',
    planned: 10, stretch: 8, weight: 5, status: 'approved',
    measure: 'lower_better',
    submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
  });
  // CEO competencies FY25-26
  ['Strategic Thinking', 'Leadership & People Dev.', 'Customer Centricity'].forEach((comp, i) => {
    insertTarget(db, {
      orgId, cycleId: cy2526, empId: CEO, level: 1,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'approved',
      submittedAt: '2025-04-08', approvedAt: '2025-04-10', approvedBy: CEO,
    });
  });

  // ── VP Sales FY25-26 (submitted — awaiting CEO approval) ─────────────────
  const vpSalObj2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSal, parentId: obj2526, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Drive ₹28 Cr New ARR through Enterprise & SMB Channels',
    weight: 55, status: 'submitted',
    submittedAt: '2025-04-14',
  });
  const vpSalKR_arr2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSal, parentId: kr2526.arr, level: 2,
    type: 'okr_kr', title: 'New ARR — Sales Contribution', unit: 'INR Cr',
    companyTarget: 35, planned: 28, stretch: 32,
    weight: 30, status: 'submitted',
    submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSal, parentId: kr2526.clients, level: 2,
    type: 'okr_kr', title: 'Enterprise Clients Won', unit: 'clients',
    companyTarget: 200, planned: 150, stretch: 165,
    weight: 15, status: 'submitted',
    submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSal, parentId: kr2526.nps, level: 2,
    type: 'okr_kr', title: 'Sales NPS (post-sale survey)', unit: 'score',
    companyTarget: 70, planned: 72, stretch: 78,
    weight: 10, status: 'submitted',
    submittedAt: '2025-04-14',
  });
  // VP Sales KRA FY25-26 (continuing)
  const kraRevSal2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSal, level: 2,
    type: 'kra', title: 'Revenue Growth', weight: 25, status: 'submitted',
    submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSal, parentId: kraRevSal2526, level: 2,
    type: 'kpi', title: 'Monthly New Bookings Revenue', unit: 'INR Lakh',
    planned: 235, stretch: 270, weight: 10, status: 'submitted',
    submittedAt: '2025-04-14',
  });

  // ── VP Engineering FY25-26 (submitted) ───────────────────────────────────
  const vpEngObj2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpEng, parentId: obj2526, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Deliver Zero-Downtime Platform with 24+ Feature Releases',
    weight: 55, status: 'submitted',
    submittedAt: '2025-04-14',
  });
  const vpEngKR_up2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpEng, parentId: kr2526.uptime, level: 2,
    type: 'okr_kr', title: 'Platform Uptime (SLA)', unit: '%',
    companyTarget: 99.95, planned: 99.95, stretch: 99.99,
    weight: 20, status: 'submitted',
    submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpEng, parentId: vpEngObj2526, level: 2,
    type: 'okr_kr', title: 'Feature Release Velocity', unit: 'features',
    planned: 28, stretch: 32,
    weight: 20, status: 'submitted',
    submittedAt: '2025-04-14',
  });
  // VP Eng KRA FY25-26 (continuing)
  const kraProd2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpEng, level: 2,
    type: 'kra', title: 'Product Quality & Reliability', weight: 25, status: 'submitted',
    submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpEng, parentId: kraProd2526, level: 2,
    type: 'kpi', title: 'Bug Escape Rate', unit: '%',
    planned: 1, stretch: 0.7, weight: 10, status: 'submitted',
    measure: 'lower_better',
    submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpEng, parentId: kraProd2526, level: 2,
    type: 'kpi', title: 'Sprint Velocity', unit: 'points',
    planned: 44, stretch: 50, weight: 10, status: 'submitted',
    submittedAt: '2025-04-14',
  });

  // ── VP Support & VP HR FY25-26 (submitted) ────────────────────────────────
  const vpSupObj2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSup, parentId: obj2526, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Create Raving Fans — 70+ NPS and 4.8 CSAT',
    weight: 55, status: 'submitted', submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSup, parentId: kr2526.nps, level: 2,
    type: 'okr_kr', title: 'Net Promoter Score (NPS)', unit: 'score',
    companyTarget: 70, planned: 70, stretch: 75,
    weight: 25, status: 'submitted', submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSup, parentId: vpSupObj2526, level: 2,
    type: 'okr_kr', title: 'Customer Satisfaction Score (CSAT)', unit: 'score',
    planned: 4.8, stretch: 5.0,
    weight: 20, status: 'submitted', submittedAt: '2025-04-14',
  });
  const kraCS2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSup, level: 2,
    type: 'kra', title: 'Customer Satisfaction', weight: 25, status: 'submitted',
    submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpSup, parentId: kraCS2526, level: 2,
    type: 'kpi', title: 'Ticket Resolution Time', unit: 'hours',
    planned: 4, stretch: 3, weight: 10, status: 'submitted',
    measure: 'lower_better', submittedAt: '2025-04-14',
  });

  const vpHRObj2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpHR, parentId: obj2526, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build World-Class Talent & Culture (eNPS 65+, Attrition <10%)',
    weight: 55, status: 'submitted', submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpHR, parentId: kr2526.enps, level: 2,
    type: 'okr_kr', title: 'Employee Net Promoter Score (eNPS)', unit: 'score',
    companyTarget: 65, planned: 65, stretch: 70,
    weight: 25, status: 'submitted', submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpHR, parentId: vpHRObj2526, level: 2,
    type: 'okr_kr', title: 'Annual Attrition Rate', unit: '%',
    planned: 10, stretch: 8, weight: 15, status: 'submitted',
    measure: 'lower_better', submittedAt: '2025-04-14',
  });
  const kraTal2526hr = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpHR, level: 2,
    type: 'kra', title: 'Talent Acquisition & Retention', weight: 25, status: 'submitted',
    submittedAt: '2025-04-14',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpHR, parentId: kraTal2526hr, level: 2,
    type: 'kpi', title: 'Time to Hire', unit: 'days',
    planned: 30, stretch: 22, weight: 10, status: 'submitted',
    measure: 'lower_better', submittedAt: '2025-04-14',
  });

  // ── GM Enterprise Sales FY25-26 (draft — waiting for VP Sales approval) ──
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: gmEntSal, parentId: vpSalObj2526, level: 3,
    type: 'okr_objective', dir: 'top_down',
    title: 'Win ₹16 Cr from Enterprise Segment',
    weight: 55, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: gmEntSal, parentId: vpSalKR_arr2526, level: 3,
    type: 'okr_kr', title: 'Enterprise ARR Won', unit: 'INR Cr',
    companyTarget: 35, planned: 16, stretch: 18.5,
    weight: 30, status: 'draft',
  });
  const kraRevEnt2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: gmEntSal, level: 3,
    type: 'kra', title: 'Revenue Growth', weight: 30, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: gmEntSal, parentId: kraRevEnt2526, level: 3,
    type: 'kpi', title: 'Avg Deal Size (Enterprise)', unit: 'INR Lakh',
    planned: 32, stretch: 38, weight: 15, status: 'draft',
  });

  // ── GM Backend Engineering FY25-26 (draft) ───────────────────────────────
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: gmBackEng, parentId: vpEngObj2526, level: 3,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build a 5-nines Backend (99.999%) with Automated Failover',
    weight: 50, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: gmBackEng, parentId: vpEngKR_up2526, level: 3,
    type: 'okr_kr', title: 'API Uptime', unit: '%',
    companyTarget: 99.95, planned: 99.97, stretch: 99.999,
    weight: 25, status: 'draft',
  });
  const kraProdBack2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: gmBackEng, level: 3,
    type: 'kra', title: 'Product Quality & Reliability', weight: 30, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: gmBackEng, parentId: kraProdBack2526, level: 3,
    type: 'kpi', title: 'Sprint Velocity', unit: 'points',
    planned: 44, stretch: 52, weight: 10, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: gmBackEng, parentId: kraProdBack2526, level: 3,
    type: 'kpi', title: 'Bug Escape Rate', unit: '%',
    planned: 0.8, stretch: 0.5, weight: 10, status: 'draft',
    measure: 'lower_better',
  });

  // ── SM North FY25-26 (draft) ──────────────────────────────────────────────
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: smNorth, parentId: vpSalKR_arr2526, level: 4,
    type: 'okr_kr', title: 'North Region Enterprise ARR', unit: 'INR Cr',
    companyTarget: 35, planned: 7.5, stretch: 8.5,
    weight: 35, status: 'draft',
  });
  const kraRevNorth2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: smNorth, level: 4,
    type: 'kra', title: 'Revenue Growth', weight: 35, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: smNorth, parentId: kraRevNorth2526, level: 4,
    type: 'kpi', title: 'Monthly Pipeline Generated', unit: 'INR Lakh',
    planned: 80, stretch: 95, weight: 15, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: smNorth, level: 4,
    type: 'kpi', title: 'Win Rate', unit: '%',
    planned: 35, stretch: 42, weight: 15, status: 'draft',
  });

  console.log('TechCorp targets seeded: 3 cycles, L1→L4 cascade, check-ins, performance summaries.');
}

// ─── Manufacturing company targets ──────────────────────────────────────────

function seedManufacturingTargets(db) {
  const orgId = getOrg(db, 'Precision Manufacturing Ltd');
  if (!orgId) { console.log('Precision Manufacturing Ltd not found — skipping'); return; }

  const existing = db.exec(`SELECT COUNT(*) FROM targets WHERE org_id = ?`, [orgId]);
  if (existing[0].values[0][0] > 0) {
    console.log('Precision Manufacturing targets already seeded — skipping');
    return;
  }

  const e = getEmpMap(db, orgId);
  const MD = e['M001'], vpOps = e['M002'];
  const hodP = e['M003'], hodQ = e['M004'];
  const sup1 = e['M005'];
  const op1 = e['M006'], op2 = e['M007'];

  console.log('Seeding Precision Manufacturing targets (2 cycles)...');

  // Cycles
  const cy2324m = upsertCycle(db, orgId, {
    name: 'FY 2023-24 Annual', start: '2023-04-01', end: '2024-03-31',
    gsOpen: '2023-04-01', gsClose: '2023-04-20',
    rvOpen: '2024-02-01', rvClose: '2024-03-31',
    cascade: 'top_down', status: 'closed',
  }, MD);
  // FY 2025-26 already created by existing seed
  const cy2526mRes = db.exec(`SELECT id FROM review_cycles WHERE org_id = ? AND name = 'FY 2025-26 Annual'`, [orgId]);
  const cy2526m = cy2526mRes[0].values[0][0];

  // ── MD FY23-24 KRA targets (continuing — KRA/KPI same every year) ─────────
  const kraOut2324 = insertTarget(db, {
    orgId, cycleId: cy2324m, empId: MD, level: 1,
    type: 'kra', title: 'Production Output & Efficiency', weight: 40, status: 'locked',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: MD,
    selfRating: 4.0, selfRatedAt: '2024-02-10',
    managerRating: 4.0, managerRatedAt: '2024-02-25', finalRating: 4.0,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: MD, parentId: kraOut2324, level: 1,
    type: 'kpi', title: 'Units Produced Per Day', unit: 'units',
    planned: 2400, stretch: 2700, actual: 2350, weight: 20, status: 'locked',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: MD,
    selfRating: 3.9, selfRatedAt: '2024-02-10',
    managerRating: 3.9, managerRatedAt: '2024-02-25', finalRating: 3.9,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: MD, parentId: kraOut2324, level: 1,
    type: 'kpi', title: 'On-Time Delivery Rate', unit: '%',
    planned: 96, stretch: 98, actual: 95, weight: 10, status: 'locked',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: MD,
    selfRating: 3.8, selfRatedAt: '2024-02-10',
    managerRating: 3.8, managerRatedAt: '2024-02-25', finalRating: 3.8,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: MD, parentId: kraOut2324, level: 1,
    type: 'kpi', title: 'Machine Downtime', unit: 'hours/month',
    planned: 12, stretch: 8, actual: 14, weight: 10, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: MD,
    selfRating: 3.5, selfComment: 'Line 3 had unplanned downtime. Fixed.', selfRatedAt: '2024-02-10',
    managerRating: 3.5, managerRatedAt: '2024-02-25', finalRating: 3.5,
  });

  const kraQual2324 = insertTarget(db, {
    orgId, cycleId: cy2324m, empId: MD, level: 1,
    type: 'kra', title: 'Quality & Defect Reduction', weight: 35, status: 'locked',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: MD,
    selfRating: 4.3, selfRatedAt: '2024-02-10',
    managerRating: 4.3, managerRatedAt: '2024-02-25', finalRating: 4.3,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: MD, parentId: kraQual2324, level: 1,
    type: 'kpi', title: 'Defect Rate (PPM)', unit: 'PPM',
    planned: 500, stretch: 300, actual: 420, weight: 20, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: MD,
    selfRating: 4.2, selfRatedAt: '2024-02-10',
    managerRating: 4.2, managerRatedAt: '2024-02-25', finalRating: 4.2,
  });

  const kraSafe2324 = insertTarget(db, {
    orgId, cycleId: cy2324m, empId: MD, level: 1,
    type: 'kra', title: 'Safety & Compliance', weight: 25, status: 'locked',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: MD,
    selfRating: 4.5, selfRatedAt: '2024-02-10',
    managerRating: 4.5, managerRatedAt: '2024-02-25', finalRating: 4.5,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: MD, parentId: kraSafe2324, level: 1,
    type: 'kpi', title: 'Safety Incidents', unit: 'count',
    planned: 3, stretch: 0, actual: 1, weight: 15, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: MD,
    selfRating: 4.5, selfComment: 'Only 1 minor incident vs 3 allowed. Great safety record.', selfRatedAt: '2024-02-10',
    managerRating: 4.5, managerRatedAt: '2024-02-25', finalRating: 4.5,
  });

  // VP Ops FY23-24 (cascaded from MD)
  const kraOutVP2324 = insertTarget(db, {
    orgId, cycleId: cy2324m, empId: vpOps, level: 2,
    type: 'kra', title: 'Production Output & Efficiency', weight: 50, status: 'locked',
    submittedAt: '2023-04-08', approvedAt: '2023-04-10', approvedBy: MD,
    selfRating: 4.0, selfRatedAt: '2024-02-11',
    managerRating: 4.0, managerRatedAt: '2024-02-26', finalRating: 4.0,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: vpOps, parentId: kraOutVP2324, level: 2,
    type: 'kpi', title: 'Units Produced Per Day', unit: 'units',
    planned: 2400, stretch: 2700, actual: 2350, weight: 25, status: 'locked',
    submittedAt: '2023-04-08', approvedAt: '2023-04-10', approvedBy: MD,
    selfRating: 3.9, selfRatedAt: '2024-02-11',
    managerRating: 3.9, managerRatedAt: '2024-02-26', finalRating: 3.9,
  });
  const kraQualVP2324 = insertTarget(db, {
    orgId, cycleId: cy2324m, empId: vpOps, level: 2,
    type: 'kra', title: 'Quality & Defect Reduction', weight: 35, status: 'locked',
    submittedAt: '2023-04-08', approvedAt: '2023-04-10', approvedBy: MD,
    selfRating: 4.2, selfRatedAt: '2024-02-11',
    managerRating: 4.2, managerRatedAt: '2024-02-26', finalRating: 4.2,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: vpOps, parentId: kraQualVP2324, level: 2,
    type: 'kpi', title: 'Defect Rate (PPM)', unit: 'PPM',
    planned: 500, stretch: 300, actual: 420, weight: 20, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-08', approvedAt: '2023-04-10', approvedBy: MD,
    selfRating: 4.2, selfRatedAt: '2024-02-11',
    managerRating: 4.2, managerRatedAt: '2024-02-26', finalRating: 4.2,
  });

  // HOD Production FY23-24
  const kraOutHOD2324 = insertTarget(db, {
    orgId, cycleId: cy2324m, empId: hodP, level: 3,
    type: 'kra', title: 'Production Output & Efficiency', weight: 60, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-13', approvedBy: vpOps,
    selfRating: 3.9, selfRatedAt: '2024-02-11',
    managerRating: 4.0, managerRatedAt: '2024-02-26', finalRating: 4.0,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: hodP, parentId: kraOutHOD2324, level: 3,
    type: 'kpi', title: 'Units Produced Per Day', unit: 'units',
    planned: 2400, stretch: 2700, actual: 2350, weight: 30, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-13', approvedBy: vpOps,
    selfRating: 3.9, selfRatedAt: '2024-02-11',
    managerRating: 4.0, managerRatedAt: '2024-02-26', finalRating: 4.0,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: hodP, parentId: kraOutHOD2324, level: 3,
    type: 'kpi', title: 'Machine Downtime', unit: 'hours/month',
    planned: 12, stretch: 8, actual: 14, weight: 20, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-10', approvedAt: '2023-04-13', approvedBy: vpOps,
    selfRating: 3.5, selfRatedAt: '2024-02-11',
    managerRating: 3.5, managerRatedAt: '2024-02-26', finalRating: 3.5,
  });

  // Supervisor FY23-24 (under HOD Production)
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: sup1, parentId: kraOutHOD2324, level: 4,
    type: 'kpi', title: 'Daily Production Output (Line 1)', unit: 'units',
    planned: 600, stretch: 700, actual: 578, weight: 50, status: 'locked',
    submittedAt: '2023-04-13', approvedAt: '2023-04-15', approvedBy: hodP,
    selfRating: 3.8, selfComment: '578 vs 600 planned — Line 1 motor issue in Nov.', selfRatedAt: '2024-02-12',
    managerRating: 3.8, managerRatedAt: '2024-02-27', finalRating: 3.8,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: sup1, level: 4,
    type: 'kpi', title: 'Shift Defect Count', unit: 'count',
    planned: 15, stretch: 8, actual: 11, weight: 30, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-13', approvedAt: '2023-04-15', approvedBy: hodP,
    selfRating: 4.2, selfRatedAt: '2024-02-12',
    managerRating: 4.2, managerRatedAt: '2024-02-27', finalRating: 4.2,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324m, empId: sup1, level: 4,
    type: 'kpi', title: 'Safety Incidents (Shift)', unit: 'count',
    planned: 0, stretch: 0, actual: 0, weight: 20, status: 'locked',
    measure: 'lower_better',
    submittedAt: '2023-04-13', approvedAt: '2023-04-15', approvedBy: hodP,
    selfRating: 5.0, selfComment: 'Zero incidents for full year.', selfRatedAt: '2024-02-12',
    managerRating: 5.0, managerRatedAt: '2024-02-27', finalRating: 5.0,
  });

  // Performance summaries FY23-24
  [
    [MD,   4.02, null, 4.02, 'Exceeds'],
    [vpOps,4.05, null, 4.05, 'Exceeds'],
    [hodP, 3.87, null, 3.87, 'Exceeds'],
    [sup1, 4.12, null, 4.12, 'Exceeds'],
  ].forEach(([empId, gs, cs, fs, band]) => {
    db.run(`
      INSERT OR IGNORE INTO performance_summary
        (cycle_id, employee_id, goal_score, competency_score, final_score, performance_band, is_pip_triggered, calibrated, computed_at)
      VALUES (?,?,?,?,?,?,0,1,?)`,
      [cy2324m, empId, gs, cs, fs, band, '2024-03-25']
    );
  });

  // ── FY 2025-26 (current cycle — goal_setting, top-down submitted) ─────────
  const kraOut2526 = insertTarget(db, {
    orgId, cycleId: cy2526m, empId: MD, level: 1,
    type: 'kra', title: 'Production Output & Efficiency', weight: 40, status: 'submitted',
    submittedAt: '2025-04-05',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526m, empId: MD, parentId: kraOut2526, level: 1,
    type: 'kpi', title: 'Units Produced Per Day', unit: 'units',
    planned: 2800, stretch: 3100, weight: 20, status: 'submitted',
    submittedAt: '2025-04-05',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526m, empId: MD, parentId: kraOut2526, level: 1,
    type: 'kpi', title: 'On-Time Delivery Rate', unit: '%',
    planned: 98, stretch: 99.5, weight: 10, status: 'submitted',
    submittedAt: '2025-04-05',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526m, empId: MD, parentId: kraOut2526, level: 1,
    type: 'kpi', title: 'Machine Downtime', unit: 'hours/month',
    planned: 8, stretch: 5, weight: 10, status: 'submitted',
    measure: 'lower_better', submittedAt: '2025-04-05',
  });
  const kraQual2526 = insertTarget(db, {
    orgId, cycleId: cy2526m, empId: MD, level: 1,
    type: 'kra', title: 'Quality & Defect Reduction', weight: 35, status: 'submitted',
    submittedAt: '2025-04-05',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526m, empId: MD, parentId: kraQual2526, level: 1,
    type: 'kpi', title: 'Defect Rate (PPM)', unit: 'PPM',
    planned: 350, stretch: 200, weight: 20, status: 'submitted',
    measure: 'lower_better', submittedAt: '2025-04-05',
  });
  const kraSafe2526 = insertTarget(db, {
    orgId, cycleId: cy2526m, empId: MD, level: 1,
    type: 'kra', title: 'Safety & Compliance', weight: 25, status: 'submitted',
    submittedAt: '2025-04-05',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526m, empId: MD, parentId: kraSafe2526, level: 1,
    type: 'kpi', title: 'Safety Incidents', unit: 'count',
    planned: 2, stretch: 0, weight: 15, status: 'submitted',
    measure: 'lower_better', submittedAt: '2025-04-05',
  });

  // VP Ops FY25-26 cascaded (draft — waiting for MD's targets approval)
  const kraOutVP2526 = insertTarget(db, {
    orgId, cycleId: cy2526m, empId: vpOps, level: 2,
    type: 'kra', title: 'Production Output & Efficiency', weight: 50, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526m, empId: vpOps, parentId: kraOutVP2526, level: 2,
    type: 'kpi', title: 'Units Produced Per Day', unit: 'units',
    planned: 2800, stretch: 3100, weight: 25, status: 'draft',
  });
  const kraQualVP2526 = insertTarget(db, {
    orgId, cycleId: cy2526m, empId: vpOps, level: 2,
    type: 'kra', title: 'Quality & Defect Reduction', weight: 35, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526m, empId: vpOps, parentId: kraQualVP2526, level: 2,
    type: 'kpi', title: 'Defect Rate (PPM)', unit: 'PPM',
    planned: 350, stretch: 200, weight: 20, status: 'draft',
    measure: 'lower_better',
  });

  console.log('Precision Manufacturing targets seeded: 2 cycles (FY23-24 closed, FY25-26 goal_setting).');
}

// ─── NexaFlow Technologies targets ──────────────────────────────────────────
//
// Bidirectional cascade showcase:
//   FY 2023-24 (CLOSED)     — pure top-down; NexaFlow's first full year
//   FY 2024-25 (REVIEW)     — bidirectional introduced; bottom-up proposals
//                              got linked mid-cycle, now in review phase
//   FY 2025-26 (GOAL_SETTING)— live state:
//       • Top-down: CEO approved → VPs submitted → L3 draft
//       • Bottom-up: Head Platform, Head Onboarding, Head Support, Senior BE
//                    have self-proposed OKRs (status='proposed', no parentId)
//                    awaiting VP linkage before cycle can go 'active' (V13)
//
// Key roles for the demo:
//   NX-001  CEO              — sets company OKRs (top-down origin)
//   NX-002  VP Revenue       — pure top-down track; quota allocation
//   NX-003  VP Product       — top-down track + must link bottom-up proposals
//   NX-004  VP CX            — top-down track + must link bottom-up proposals
//   NX-008  Head Platform    — BIDIRECTIONAL: top-down KR + self-proposed OKR
//   NX-009  Head PM          — BIDIRECTIONAL: top-down KR + self-proposed OKR
//   NX-010  Head Onboarding  — BIDIRECTIONAL: top-down KR + self-proposed OKR
//   NX-011  Head Support     — BOTTOM-UP only in FY25-26: self-proposed OKR
//   NX-014  Sr BE Engineer   — BOTTOM-UP: self-proposed technical OKR

function seedNexaFlowTargets(db) {
  const orgId = getOrg(db, 'NexaFlow Technologies');
  if (!orgId) { console.log('NexaFlow Technologies not found — skipping targets'); return; }

  const existing = db.exec(`SELECT COUNT(*) FROM targets WHERE org_id = ?`, [orgId]);
  if (existing[0].values[0][0] > 0) {
    console.log('NexaFlow targets already seeded — skipping');
    return;
  }

  const e = getEmpMap(db, orgId);
  const CEO     = e['NX-001'];
  const vpRev   = e['NX-002'], vpProd = e['NX-003'], vpCX = e['NX-004'];
  const hEntSal = e['NX-006'], hSMB   = e['NX-007'];
  const hPlat   = e['NX-008'], hPM    = e['NX-009'];
  const hOnboard= e['NX-010'], hSup   = e['NX-011'];
  const smBE    = e['NX-014'], smCSM  = e['NX-016'];

  console.log('Seeding NexaFlow targets (3 cycles, bidirectional showcase)...');

  // ── Cycles ─────────────────────────────────────────────────────────────────
  const cy2324 = upsertCycle(db, orgId, {
    name: 'FY 2023-24 Annual', start: '2023-04-01', end: '2024-03-31',
    gsOpen: '2023-04-01', gsClose: '2023-04-30',
    apvOpen: '2023-05-01', apvClose: '2023-05-15',
    rvOpen: '2024-02-01', rvClose: '2024-03-15',
    calOpen: '2024-03-16', calClose: '2024-03-31',
    cascade: 'top_down', status: 'closed',
  }, CEO);

  const cy2425 = upsertCycle(db, orgId, {
    name: 'FY 2024-25 Annual', start: '2024-04-01', end: '2025-03-31',
    gsOpen: '2024-04-01', gsClose: '2024-05-15',
    apvOpen: '2024-05-16', apvClose: '2024-05-31',
    rvOpen: '2025-02-01', rvClose: '2025-03-15',
    calOpen: '2025-03-16', calClose: '2025-03-31',
    cascade: 'bidirectional', status: 'review',
  }, CEO);

  const cy2526Res = db.exec(`SELECT id FROM review_cycles WHERE org_id = ? AND name = 'FY 2025-26 Annual'`, [orgId]);
  const cy2526 = cy2526Res[0].values[0][0];

  // ══════════════════════════════════════════════════════════════════════════
  //  FY 2023-24  (CLOSED — pure top-down; NexaFlow year 1)
  // ══════════════════════════════════════════════════════════════════════════

  // ── CEO ───────────────────────────────────────────────────────────────────
  const ceoObj_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, level: 1,
    type: 'okr_objective', dir: 'top_down',
    title: 'Establish NexaFlow as a ₹25 Cr ARR SaaS Leader in India',
    desc: 'Company-wide strategic objective — Year 1 foundation building.',
    weight: 70, status: 'locked',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: CEO,
    selfRating: 3.9, selfComment: 'Strong ARR growth; NPS exceeded target.',
    selfRatedAt: '2024-02-05',
    managerRating: 4.0, managerComment: 'Exceptional first full year.', managerRatedAt: '2024-02-20',
    finalRating: 4.0,
  });
  const ceoKR_arr_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, parentId: ceoObj_2324, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'New Annual Recurring Revenue (ARR)', unit: 'INR Cr',
    companyTarget: 8, planned: 8, stretch: 10, actual: 7.4,
    weight: 40, status: 'locked',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: CEO,
    selfRating: 3.7, selfComment: '₹7.4 Cr vs ₹8 Cr target — 92.5%.', selfRatedAt: '2024-02-05',
    managerRating: 3.8, managerRatedAt: '2024-02-20', finalRating: 3.8,
  });
  const ceoKR_nps_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, parentId: ceoObj_2324, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Customer Net Promoter Score (NPS)', unit: 'score',
    companyTarget: 65, planned: 65, stretch: 72, actual: 69,
    weight: 15, status: 'locked',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: CEO,
    selfRating: 4.2, selfComment: 'Beat NPS target — CX initiatives worked.', selfRatedAt: '2024-02-05',
    managerRating: 4.2, managerRatedAt: '2024-02-20', finalRating: 4.2,
  });
  const ceoKR_uptime_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, parentId: ceoObj_2324, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Platform Uptime (SLA)', unit: '%',
    companyTarget: 99.8, planned: 99.8, stretch: 99.9, actual: 99.83,
    weight: 15, status: 'locked',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2024-02-05',
    managerRating: 4.1, managerRatedAt: '2024-02-20', finalRating: 4.1,
  });
  const ceoObj2_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, level: 1,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build a High-Performance Team — eNPS 55+ and Attrition <18%',
    weight: 30, status: 'locked',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: CEO,
    selfRating: 4.0, selfRatedAt: '2024-02-05',
    managerRating: 4.0, managerRatedAt: '2024-02-20', finalRating: 4.0,
  });
  const ceoKR_enps_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, parentId: ceoObj2_2324, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Employee eNPS', unit: 'score',
    companyTarget: 55, planned: 55, stretch: 62, actual: 58,
    weight: 20, status: 'locked',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2024-02-05',
    managerRating: 4.1, managerRatedAt: '2024-02-20', finalRating: 4.1,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: CEO, parentId: ceoObj2_2324, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Annual Attrition Rate', unit: '%',
    companyTarget: 18, planned: 18, stretch: 14, actual: 15.2,
    weight: 10, status: 'locked', measure: 'lower_better',
    submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: CEO,
    selfRating: 3.9, selfRatedAt: '2024-02-05',
    managerRating: 3.9, managerRatedAt: '2024-02-20', finalRating: 3.9,
  });
  ['Strategic Thinking & Vision', 'Leadership & Coaching', 'Customer Obsession'].forEach((comp, i) => {
    const r = [4.4, 4.2, 4.3][i];
    insertTarget(db, {
      orgId, cycleId: cy2324, empId: CEO, level: 1,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'locked',
      submittedAt: '2023-04-05', approvedAt: '2023-04-07', approvedBy: CEO,
      selfRating: r, selfRatedAt: '2024-02-05',
      managerRating: r, managerRatedAt: '2024-02-20', finalRating: r,
    });
  });

  // ── VP Revenue (top-down, cascaded from CEO) ──────────────────────────────
  const vpRevObj_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpRev, parentId: ceoObj_2324, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Close ₹6 Cr New ARR through Enterprise and SMB Channels',
    weight: 70, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 3.7, selfComment: '₹5.5 Cr — 92%. Lost 2 late-stage deals.', selfRatedAt: '2024-02-06',
    managerRating: 3.8, managerComment: 'Solid growth year for a new team.', managerRatedAt: '2024-02-22',
    finalRating: 3.8,
  });
  const vpRevKR_arr_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpRev, parentId: ceoKR_arr_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'New ARR — Sales Contribution', unit: 'INR Cr',
    companyTarget: 8, planned: 6, stretch: 7, actual: 5.5,
    weight: 40, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 3.6, selfRatedAt: '2024-02-06',
    managerRating: 3.7, managerRatedAt: '2024-02-22', finalRating: 3.7,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpRev, parentId: vpRevObj_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sales Win Rate', unit: '%',
    planned: 28, stretch: 35, actual: 26,
    weight: 20, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 3.5, selfRatedAt: '2024-02-06',
    managerRating: 3.6, managerRatedAt: '2024-02-22', finalRating: 3.6,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpRev, parentId: vpRevObj_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'New Logos (Customers Won)', unit: 'count',
    planned: 38, stretch: 48, actual: 35,
    weight: 10, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 3.7, selfRatedAt: '2024-02-06',
    managerRating: 3.7, managerRatedAt: '2024-02-22', finalRating: 3.7,
  });
  const vpRevObj2_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpRev, parentId: ceoObj2_2324, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build a Scalable, Motivated Sales Team',
    weight: 30, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.0, selfRatedAt: '2024-02-06',
    managerRating: 4.0, managerRatedAt: '2024-02-22', finalRating: 4.0,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpRev, parentId: ceoKR_enps_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sales Team eNPS', unit: 'score',
    companyTarget: 55, planned: 55, stretch: 62, actual: 56,
    weight: 20, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.0, selfRatedAt: '2024-02-06',
    managerRating: 4.0, managerRatedAt: '2024-02-22', finalRating: 4.0,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpRev, parentId: vpRevObj2_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sales Rep Ramp to Quota (%)', unit: '%',
    planned: 60, stretch: 75, actual: 65,
    weight: 10, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2024-02-06',
    managerRating: 4.0, managerRatedAt: '2024-02-22', finalRating: 4.0,
  });
  ['Customer Obsession', 'Leadership & Coaching', 'Communication & Influence'].forEach((comp, i) => {
    const r = [4.1, 4.0, 4.3][i];
    insertTarget(db, {
      orgId, cycleId: cy2324, empId: vpRev, level: 2,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'locked',
      submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
      selfRating: r, selfRatedAt: '2024-02-06',
      managerRating: r, managerRatedAt: '2024-02-22', finalRating: r,
    });
  });

  // ── VP Product (top-down) ─────────────────────────────────────────────────
  const vpProdObj_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpProd, parentId: ceoObj_2324, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Deliver 99.85% Platform Uptime and 12 Major Feature Releases',
    weight: 70, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.2, selfComment: 'Uptime exceeded, shipped 13 features.', selfRatedAt: '2024-02-06',
    managerRating: 4.3, managerComment: 'Best engineering year yet.', managerRatedAt: '2024-02-22',
    finalRating: 4.3,
  });
  const vpProdKR_up_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpProd, parentId: ceoKR_uptime_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Platform Uptime (SLA)', unit: '%',
    companyTarget: 99.8, planned: 99.82, stretch: 99.9, actual: 99.83,
    weight: 30, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2024-02-06',
    managerRating: 4.2, managerRatedAt: '2024-02-22', finalRating: 4.2,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpProd, parentId: vpProdObj_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Feature Releases (Major)', unit: 'count',
    planned: 12, stretch: 15, actual: 13,
    weight: 25, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.3, selfRatedAt: '2024-02-06',
    managerRating: 4.4, managerRatedAt: '2024-02-22', finalRating: 4.4,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpProd, parentId: vpProdObj_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'P0/P1 Bugs in Production', unit: 'count',
    planned: 5, stretch: 2, actual: 3, measure: 'lower_better',
    weight: 15, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2024-02-06',
    managerRating: 4.2, managerRatedAt: '2024-02-22', finalRating: 4.2,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpProd, parentId: ceoObj2_2324, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Foster Engineering Excellence Culture',
    weight: 30, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2024-02-06',
    managerRating: 4.1, managerRatedAt: '2024-02-22', finalRating: 4.1,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpProd, parentId: ceoKR_enps_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Engineering Team eNPS', unit: 'score',
    companyTarget: 55, planned: 55, stretch: 62, actual: 60,
    weight: 20, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2024-02-06',
    managerRating: 4.2, managerRatedAt: '2024-02-22', finalRating: 4.2,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpProd, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sprint Velocity', unit: 'points',
    planned: 32, stretch: 38, actual: 35,
    weight: 10, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2024-02-06',
    managerRating: 4.1, managerRatedAt: '2024-02-22', finalRating: 4.1,
  });
  ['Technical Excellence', 'Leadership & Coaching', 'Ownership & Accountability'].forEach((comp, i) => {
    const r = [4.5, 4.2, 4.4][i];
    insertTarget(db, {
      orgId, cycleId: cy2324, empId: vpProd, level: 2,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'locked',
      submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
      selfRating: r, selfRatedAt: '2024-02-06',
      managerRating: r, managerRatedAt: '2024-02-22', finalRating: r,
    });
  });

  // ── VP Customer Experience (top-down) ─────────────────────────────────────
  const vpCXObj_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpCX, parentId: ceoObj_2324, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Delight Customers — NPS 65+ and Time-to-Value Under 40 Days',
    weight: 70, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.1, selfComment: 'NPS 69 — exceeded target. TTV improved to 36 days.',
    selfRatedAt: '2024-02-06',
    managerRating: 4.2, managerComment: 'CX team was the standout team this year.', managerRatedAt: '2024-02-22',
    finalRating: 4.2,
  });
  const vpCXKR_nps_2324 = insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpCX, parentId: ceoKR_nps_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Customer NPS', unit: 'score',
    companyTarget: 65, planned: 65, stretch: 72, actual: 69,
    weight: 35, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2024-02-06',
    managerRating: 4.3, managerRatedAt: '2024-02-22', finalRating: 4.3,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpCX, parentId: vpCXObj_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Time to Value (New Customers)', unit: 'days',
    planned: 40, stretch: 28, actual: 36, measure: 'lower_better',
    weight: 20, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.0, selfRatedAt: '2024-02-06',
    managerRating: 4.0, managerRatedAt: '2024-02-22', finalRating: 4.0,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpCX, parentId: vpCXObj_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Customer Churn Rate', unit: '%',
    planned: 8, stretch: 5, actual: 6.2, measure: 'lower_better',
    weight: 15, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2024-02-06',
    managerRating: 4.2, managerRatedAt: '2024-02-22', finalRating: 4.2,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpCX, parentId: ceoObj2_2324, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build a World-Class CX Team',
    weight: 30, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.0, selfRatedAt: '2024-02-06',
    managerRating: 4.0, managerRatedAt: '2024-02-22', finalRating: 4.0,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpCX, parentId: ceoKR_enps_2324, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'CX Team eNPS', unit: 'score',
    companyTarget: 55, planned: 55, stretch: 62, actual: 62,
    weight: 20, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.3, selfRatedAt: '2024-02-06',
    managerRating: 4.3, managerRatedAt: '2024-02-22', finalRating: 4.3,
  });
  insertTarget(db, {
    orgId, cycleId: cy2324, empId: vpCX, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Tier-1 Ticket SLA Compliance', unit: '%',
    planned: 92, stretch: 97, actual: 94,
    weight: 10, status: 'locked',
    submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2024-02-06',
    managerRating: 4.1, managerRatedAt: '2024-02-22', finalRating: 4.1,
  });
  ['Customer Obsession', 'Leadership & Coaching', 'Communication & Influence'].forEach((comp, i) => {
    const r = [4.4, 4.1, 4.3][i];
    insertTarget(db, {
      orgId, cycleId: cy2324, empId: vpCX, level: 2,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'locked',
      submittedAt: '2023-04-10', approvedAt: '2023-04-14', approvedBy: CEO,
      selfRating: r, selfRatedAt: '2024-02-06',
      managerRating: r, managerRatedAt: '2024-02-22', finalRating: r,
    });
  });

  // FY23-24 Performance Summaries
  [
    [CEO,    3.96, 4.30, 4.06, 'Exceeds'],
    [vpRev,  3.72, 4.13, 3.84, 'Exceeds'],
    [vpProd, 4.20, 4.37, 4.25, 'Exceeds'],
    [vpCX,   4.14, 4.27, 4.18, 'Exceeds'],
  ].forEach(([empId, gs, cs, fs, band]) => {
    db.run(`
      INSERT OR IGNORE INTO performance_summary
        (cycle_id, employee_id, goal_score, competency_score, final_score, performance_band, is_pip_triggered, calibrated, computed_at)
      VALUES (?,?,?,?,?,?,0,1,?)`,
      [cy2324, empId, gs, cs, fs, band, '2024-03-28']
    );
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  FY 2024-25  (REVIEW — bidirectional introduced for first time)
  //
  //  Top-down track: CEO → VPs → Heads (cascade direction = top_down)
  //  Bottom-up track: Head Platform (NX-008) and Head Onboarding (NX-010)
  //    proposed their OWN OKRs from Day 1. VP linked them to company OKRs
  //    mid-cycle. Now both tracks are in 'active' status (cycle in review).
  //
  //  This shows the RESOLVED state of a bidirectional cycle —
  //  FY25-26 will show the UNRESOLVED/in-progress state.
  // ══════════════════════════════════════════════════════════════════════════

  // ── CEO FY24-25 ───────────────────────────────────────────────────────────
  const ceoObj_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, level: 1,
    type: 'okr_objective', dir: 'top_down',
    title: 'Scale NexaFlow to ₹45 Cr ARR — The Breakout Year',
    desc: 'Cross ₹45 Cr ARR, achieve NPS 80+, and establish CI/CD gold standard.',
    weight: 70, status: 'active',
    submittedAt: '2024-04-05', approvedAt: '2024-04-08', approvedBy: CEO,
    selfRating: 4.1, selfComment: 'Strong year. ARR at ₹19.8 Cr (94%), NPS hit 82.',
    selfRatedAt: '2025-02-05',
  });
  const ceoKR_arr_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, parentId: ceoObj_2425, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'New Annual Recurring Revenue (ARR)', unit: 'INR Cr',
    companyTarget: 21, planned: 21, stretch: 25, actual: 19.8,
    weight: 40, status: 'active',
    submittedAt: '2024-04-05', approvedAt: '2024-04-08', approvedBy: CEO,
    selfRating: 4.0, selfComment: '₹19.8 Cr — 94%. Near-miss on stretch.', selfRatedAt: '2025-02-05',
  });
  const ceoKR_nps_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, parentId: ceoObj_2425, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Customer NPS', unit: 'score',
    companyTarget: 78, planned: 78, stretch: 84, actual: 82,
    weight: 15, status: 'active',
    submittedAt: '2024-04-05', approvedAt: '2024-04-08', approvedBy: CEO,
    selfRating: 4.5, selfComment: 'Hit 82 — best NPS ever!', selfRatedAt: '2025-02-05',
  });
  const ceoKR_uptime_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, parentId: ceoObj_2425, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Platform Uptime (SLA)', unit: '%',
    companyTarget: 99.9, planned: 99.9, stretch: 99.95, actual: 99.91,
    weight: 15, status: 'active',
    submittedAt: '2024-04-05', approvedAt: '2024-04-08', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2025-02-05',
  });
  const ceoObj2_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, level: 1,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build NexaFlow as the Best Workplace for Engineers in India',
    weight: 30, status: 'active',
    submittedAt: '2024-04-05', approvedAt: '2024-04-08', approvedBy: CEO,
    selfRating: 4.0, selfRatedAt: '2025-02-05',
  });
  const ceoKR_enps_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, parentId: ceoObj2_2425, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Employee eNPS', unit: 'score',
    companyTarget: 65, planned: 65, stretch: 72, actual: 67,
    weight: 20, status: 'active',
    submittedAt: '2024-04-05', approvedAt: '2024-04-08', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2025-02-05',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: CEO, parentId: ceoObj2_2425, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Annual Attrition Rate', unit: '%',
    companyTarget: 14, planned: 14, stretch: 11, actual: 12.4,
    weight: 10, status: 'active', measure: 'lower_better',
    submittedAt: '2024-04-05', approvedAt: '2024-04-08', approvedBy: CEO,
    selfRating: 4.3, selfRatedAt: '2025-02-05',
  });
  ['Strategic Thinking & Vision', 'Leadership & Coaching', 'Customer Obsession'].forEach((comp, i) => {
    insertTarget(db, {
      orgId, cycleId: cy2425, empId: CEO, level: 1,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'active',
      submittedAt: '2024-04-05', approvedAt: '2024-04-08', approvedBy: CEO,
      selfRating: [4.5, 4.3, 4.4][i], selfRatedAt: '2025-02-05',
    });
  });

  // ── VP Revenue FY24-25 (top-down) ─────────────────────────────────────────
  const vpRevObj_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpRev, parentId: ceoObj_2425, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Drive ₹16 Cr New ARR through Scaled Enterprise & SMB Playbooks',
    weight: 70, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.0, selfRatedAt: '2025-02-06',
  });
  const vpRevKR_arr_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpRev, parentId: ceoKR_arr_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'New ARR — Sales Contribution', unit: 'INR Cr',
    companyTarget: 21, planned: 16, stretch: 19, actual: 15.2,
    weight: 40, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.0, selfComment: '₹15.2 Cr — 95%. Near-miss on stretch.', selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpRev, parentId: vpRevObj_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sales Win Rate', unit: '%',
    planned: 32, stretch: 40, actual: 35,
    weight: 20, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpRev, parentId: vpRevObj_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'New Logos Won', unit: 'count',
    planned: 55, stretch: 68, actual: 52,
    weight: 10, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 3.9, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpRev, parentId: ceoObj2_2425, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build a Sales Culture of Learning & High Accountability',
    weight: 30, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpRev, parentId: ceoKR_enps_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sales Team eNPS', unit: 'score',
    companyTarget: 65, planned: 65, stretch: 72, actual: 66,
    weight: 20, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.0, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpRev, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sales Rep Ramp to Quota (%)', unit: '%',
    planned: 70, stretch: 85, actual: 74,
    weight: 10, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.1, selfRatedAt: '2025-02-06',
  });

  // ── VP Product FY24-25 (top-down + manages bottom-up proposals) ───────────
  const vpProdObj_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpProd, parentId: ceoObj_2425, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Achieve 99.9% Uptime, 20+ Feature Releases, and Sub-8min CI/CD',
    weight: 70, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.3, selfRatedAt: '2025-02-06',
  });
  const vpProdKR_up_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpProd, parentId: ceoKR_uptime_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Platform Uptime (SLA)', unit: '%',
    companyTarget: 99.9, planned: 99.9, stretch: 99.95, actual: 99.91,
    weight: 30, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpProd, parentId: vpProdObj_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Feature Releases (Major)', unit: 'count',
    planned: 20, stretch: 25, actual: 22,
    weight: 25, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.3, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpProd, parentId: vpProdObj_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'CI/CD Build Pipeline Duration', unit: 'minutes',
    planned: 8, stretch: 5, actual: 7.2, measure: 'lower_better',
    weight: 15, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.1, selfComment: '7.2 min avg — close to target. New infra being provisioned.', selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpProd, parentId: ceoObj2_2425, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build a Culture of Engineering Excellence and Developer Joy',
    weight: 30, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpProd, parentId: ceoKR_enps_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Engineering Team eNPS', unit: 'score',
    companyTarget: 65, planned: 65, stretch: 72, actual: 70,
    weight: 20, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.4, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpProd, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sprint Velocity', unit: 'points',
    planned: 38, stretch: 45, actual: 41,
    weight: 10, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2025-02-06',
  });

  // ── VP CX FY24-25 (top-down + manages bottom-up proposals) ───────────────
  const vpCXObj_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpCX, parentId: ceoObj_2425, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Create Customer Advocates — NPS 78+ and Cut TTV to 28 Days',
    weight: 70, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.3, selfComment: 'NPS 82 and TTV 26 days — exceeded both.', selfRatedAt: '2025-02-06',
  });
  const vpCXKR_nps_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpCX, parentId: ceoKR_nps_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Customer NPS', unit: 'score',
    companyTarget: 78, planned: 78, stretch: 84, actual: 82,
    weight: 35, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.5, selfRatedAt: '2025-02-06',
  });
  const vpCXKR_ttv_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpCX, parentId: vpCXObj_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Time to Value (New Customers)', unit: 'days',
    planned: 28, stretch: 20, actual: 26, measure: 'lower_better',
    weight: 20, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.3, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpCX, parentId: vpCXObj_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Customer Churn Rate', unit: '%',
    planned: 5, stretch: 3, actual: 4.1, measure: 'lower_better',
    weight: 15, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpCX, parentId: ceoObj2_2425, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build a CX Team That Owns Customer Outcomes End-to-End',
    weight: 30, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpCX, parentId: ceoKR_enps_2425, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'CX Team eNPS', unit: 'score',
    companyTarget: 65, planned: 65, stretch: 72, actual: 72,
    weight: 20, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.5, selfRatedAt: '2025-02-06',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: vpCX, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Tier-1 Ticket SLA Compliance', unit: '%',
    planned: 96, stretch: 99, actual: 97,
    weight: 10, status: 'active',
    submittedAt: '2024-04-10', approvedAt: '2024-04-14', approvedBy: CEO,
    selfRating: 4.2, selfRatedAt: '2025-02-06',
  });

  // ── Head Platform Engineering FY24-25 — BIDIRECTIONAL ────────────────────
  // TOP-DOWN track: VP Product cascaded a KR to Divya
  const hPlatKR_td_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: hPlat, parentId: vpProdKR_up_2425, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'Platform SLA — Infrastructure Contribution', unit: '%',
    companyTarget: 99.9, planned: 99.92, stretch: 99.97, actual: 99.93,
    weight: 40, status: 'active',
    submittedAt: '2024-04-18', approvedAt: '2024-04-22', approvedBy: vpProd,
    selfRating: 4.3, selfComment: 'Maintained infra above target all year.', selfRatedAt: '2025-02-07',
  });
  // BOTTOM-UP track: Divya proposed her own OKR on CI/CD from Day 1
  // VP Product reviewed and LINKED it to the product objective mid-cycle
  const hPlatObj_bu_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: hPlat, parentId: vpProdObj_2425, level: 3,
    type: 'okr_objective', dir: 'bottom_up',
    title: 'Automate CI/CD — Zero Manual Deployments and <8min Build Time',
    desc: 'Self-proposed by Divya Krishnan on Apr 1. Linked by VP Product on Apr 20 after team alignment session.',
    weight: 40, status: 'active',
    submittedAt: '2024-04-01', approvedAt: '2024-04-22', approvedBy: vpProd,
    selfRating: 4.2, selfComment: 'CI/CD pipeline fully automated. Build time 7.2 min vs 8 min target.', selfRatedAt: '2025-02-07',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: hPlat, parentId: hPlatObj_bu_2425, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'CI/CD Build Pipeline Duration', unit: 'minutes',
    planned: 8, stretch: 5, actual: 7.2, measure: 'lower_better',
    weight: 25, status: 'active',
    submittedAt: '2024-04-01', approvedAt: '2024-04-22', approvedBy: vpProd,
    selfRating: 4.1, selfRatedAt: '2025-02-07',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: hPlat, parentId: hPlatObj_bu_2425, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Manual Deployment Steps Eliminated', unit: '%',
    planned: 90, stretch: 100, actual: 94,
    weight: 15, status: 'active',
    submittedAt: '2024-04-01', approvedAt: '2024-04-22', approvedBy: vpProd,
    selfRating: 4.3, selfRatedAt: '2025-02-07',
  });
  // Competencies (both tracks share the same competency bucket)
  ['Technical Excellence', 'Ownership & Accountability', 'Collaboration & Teamwork'].forEach((comp, i) => {
    insertTarget(db, {
      orgId, cycleId: cy2425, empId: hPlat, level: 3,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'active',
      submittedAt: '2024-04-01', approvedAt: '2024-04-22', approvedBy: vpProd,
      selfRating: [4.5, 4.3, 4.2][i], selfRatedAt: '2025-02-07',
    });
  });

  // ── Head Customer Onboarding FY24-25 — BIDIRECTIONAL ─────────────────────
  // TOP-DOWN track: VP CX assigned a TTV KR to Sunita
  const hOnboardKR_td_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: hOnboard, parentId: vpCXKR_ttv_2425, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'Average Onboarding Duration', unit: 'days',
    planned: 28, stretch: 20, actual: 26, measure: 'lower_better',
    weight: 35, status: 'active',
    submittedAt: '2024-04-18', approvedAt: '2024-04-22', approvedBy: vpCX,
    selfRating: 4.2, selfComment: '26 days avg — 2 days below planned target.', selfRatedAt: '2025-02-07',
  });
  // BOTTOM-UP track: Sunita proposed a richer onboarding OKR from Day 1
  const hOnboardObj_bu_2425 = insertTarget(db, {
    orgId, cycleId: cy2425, empId: hOnboard, parentId: vpCXObj_2425, level: 3,
    type: 'okr_objective', dir: 'bottom_up',
    title: 'Redesign Onboarding Playbook — 90-Day Activation Rate 92%+',
    desc: 'Sunita proposed this based on Q4 FY23-24 churn analysis showing most churn at day 60.',
    weight: 40, status: 'active',
    submittedAt: '2024-04-01', approvedAt: '2024-04-22', approvedBy: vpCX,
    selfRating: 4.4, selfComment: '93% activation rate — exceeded target. New playbook is working.', selfRatedAt: '2025-02-07',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: hOnboard, parentId: hOnboardObj_bu_2425, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: '90-Day Customer Activation Rate', unit: '%',
    planned: 92, stretch: 96, actual: 93,
    weight: 25, status: 'active',
    submittedAt: '2024-04-01', approvedAt: '2024-04-22', approvedBy: vpCX,
    selfRating: 4.3, selfRatedAt: '2025-02-07',
  });
  insertTarget(db, {
    orgId, cycleId: cy2425, empId: hOnboard, parentId: hOnboardObj_bu_2425, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Onboarding NPS (7-day survey)', unit: 'score',
    planned: 80, stretch: 88, actual: 84,
    weight: 15, status: 'active',
    submittedAt: '2024-04-01', approvedAt: '2024-04-22', approvedBy: vpCX,
    selfRating: 4.3, selfRatedAt: '2025-02-07',
  });
  ['Customer Obsession', 'Ownership & Accountability', 'Communication & Influence'].forEach((comp, i) => {
    insertTarget(db, {
      orgId, cycleId: cy2425, empId: hOnboard, level: 3,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'active',
      submittedAt: '2024-04-01', approvedAt: '2024-04-22', approvedBy: vpCX,
      selfRating: [4.4, 4.3, 4.2][i], selfRatedAt: '2025-02-07',
    });
  });

  // FY24-25 Check-ins — VP Revenue ARR (monthly)
  const vpRevArrT_2425 = vpRevKR_arr_2425;
  [
    ['Apr 2024', 0.8, 5.0,  'Pipeline heavy but deals not closed. Ramp-up month.'],
    ['May 2024', 2.2, 13.8, '2 enterprise deals signed. SMB momentum building.'],
    ['Jun 2024', 3.8, 23.8, 'Q1 close: ₹1.6 Cr added. On track.'],
    ['Jul 2024', 5.8, 36.3, 'Best month. 3 enterprise logos. Strong Q2 start.'],
    ['Aug 2024', 7.4, 46.3, 'Steady growth. Partnership channel contributing.'],
    ['Sep 2024', 9.2, 57.5, 'Q2 close: ₹9.2 Cr. VP review: solid.'],
    ['Oct 2024', 11.1, 69.4, '2 new enterprise deals. Q3 pipeline robust.'],
    ['Nov 2024', 12.8, 80,  'On track. Year-end deals in final stage.'],
    ['Dec 2024', 13.7, 85.6,'Holiday dip. 1 large deal pushed to Jan.'],
    ['Jan 2025', 14.6, 91.3,'Pushed deal closed. Momentum back.'],
    ['Feb 2025', 15.0, 93.8,'Negotiations ongoing. Q4 push begins.'],
    ['Mar 2025', 15.2, 95,  'Year-end: ₹15.2 Cr — 95% of target. Best year.'],
  ].forEach(([label, actual, pct, notes]) => insertCheckin(db, {
    targetId: vpRevArrT_2425, empId: vpRev, cycleId: cy2425,
    periodType: 'monthly', label, actual, pct, notes,
    ackedBy: CEO, ackedAt: label === 'Mar 2025' ? '2025-04-07' : null,
  }));

  // FY24-25 Check-ins — Head Platform CI/CD build time (quarterly)
  [
    ['Q1 Apr–Jun 2024', 13.5, 0,   'Baseline: avg 13.5 min. CI/CD audit complete. Roadmap finalized.'],
    ['Q2 Jul–Sep 2024', 10.2, 40.1,'Parallelized test suite. 3.3 min cut. Good progress.'],
    ['Q3 Oct–Dec 2024', 8.4,  62.2,'Cache layer added. Near target. Team ramping new infra.'],
    ['Q4 Jan–Mar 2025', 7.2,  81.3,'7.2 min — slightly above 5 min stretch. Core optimizations done.'],
  ].forEach(([label, actual, pct, notes]) => {
    const cicdTarget = db.exec(
      `SELECT id FROM targets WHERE employee_id = ? AND cycle_id = ? AND title LIKE '%CI/CD Build Pipeline Duration%' LIMIT 1`,
      [hPlat, cy2425]
    );
    if (cicdTarget.length && cicdTarget[0].values.length) {
      insertCheckin(db, {
        targetId: cicdTarget[0].values[0][0], empId: hPlat, cycleId: cy2425,
        periodType: 'quarterly', label, actual, pct, notes,
        ackedBy: vpProd, ackedAt: null,
      });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  FY 2025-26  (GOAL_SETTING — live bidirectional state)
  //
  //  TOP-DOWN: CEO approved → VPs submitted → Heads draft (waiting approval)
  //  BOTTOM-UP: 4 roles have self-proposed OKRs (status='proposed', no parentId)
  //    — VP Product and VP CX must LINK these before cycle can go 'active' (V13)
  //
  //  Unlinked proposals blocking cycle advancement:
  //    • Head Platform (NX-008): "Achieve Sub-5min CI/CD and 99.99% Self-Healing Infra"
  //    • Head PM (NX-009): "Ship 3 Customer-Requested Feature Clusters Before Q3"
  //    • Head Onboarding (NX-010): "Cut Time-to-Value from 26 to 21 Days"
  //    • Head Support (NX-011): "Achieve 99% SLA Compliance on All Tier-1 Tickets"
  //    • Sr BE (NX-014): "Zero P0 Bugs — 100% Coverage on Critical Paths"
  // ══════════════════════════════════════════════════════════════════════════

  // ── CEO FY25-26 (approved) ────────────────────────────────────────────────
  const ceoObj_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, level: 1,
    type: 'okr_objective', dir: 'top_down',
    title: 'Scale NexaFlow to ₹60 Cr ARR — The Category Leadership Year',
    desc: 'Cross ₹60 Cr ARR, achieve NPS 90, and establish NexaFlow as undisputed #1 in our segment.',
    weight: 70, status: 'approved',
    submittedAt: '2025-04-04', approvedAt: '2025-04-07', approvedBy: CEO,
  });
  const ceoKR_arr_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, parentId: ceoObj_2526, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'New Annual Recurring Revenue (ARR)', unit: 'INR Cr',
    companyTarget: 30, planned: 30, stretch: 36,
    weight: 40, status: 'approved',
    submittedAt: '2025-04-04', approvedAt: '2025-04-07', approvedBy: CEO,
  });
  const ceoKR_nps_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, parentId: ceoObj_2526, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Customer Net Promoter Score (NPS)', unit: 'score',
    companyTarget: 88, planned: 88, stretch: 94,
    weight: 15, status: 'approved',
    submittedAt: '2025-04-04', approvedAt: '2025-04-07', approvedBy: CEO,
  });
  const ceoKR_uptime_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, parentId: ceoObj_2526, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Platform Uptime (SLA)', unit: '%',
    companyTarget: 99.95, planned: 99.95, stretch: 99.99,
    weight: 15, status: 'approved',
    submittedAt: '2025-04-04', approvedAt: '2025-04-07', approvedBy: CEO,
  });
  const ceoObj2_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, level: 1,
    type: 'okr_objective', dir: 'top_down',
    title: 'Make NexaFlow the Employer of Choice for Top Tech Talent in India',
    weight: 30, status: 'approved',
    submittedAt: '2025-04-04', approvedAt: '2025-04-07', approvedBy: CEO,
  });
  const ceoKR_enps_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, parentId: ceoObj2_2526, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Employee eNPS', unit: 'score',
    companyTarget: 75, planned: 75, stretch: 82,
    weight: 20, status: 'approved',
    submittedAt: '2025-04-04', approvedAt: '2025-04-07', approvedBy: CEO,
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: CEO, parentId: ceoObj2_2526, level: 1,
    type: 'okr_kr', dir: 'top_down',
    title: 'Annual Attrition Rate', unit: '%',
    companyTarget: 10, planned: 10, stretch: 8,
    weight: 10, status: 'approved', measure: 'lower_better',
    submittedAt: '2025-04-04', approvedAt: '2025-04-07', approvedBy: CEO,
  });
  ['Strategic Thinking & Vision', 'Leadership & Coaching', 'Customer Obsession'].forEach((comp, i) => {
    insertTarget(db, {
      orgId, cycleId: cy2526, empId: CEO, level: 1,
      type: 'competency', title: comp, weight: [40, 35, 25][i], status: 'approved',
      submittedAt: '2025-04-04', approvedAt: '2025-04-07', approvedBy: CEO,
    });
  });

  // ── VP Revenue FY25-26 (submitted — awaiting CEO approval) ────────────────
  // Pure top-down: Sales runs on quota allocation, no bottom-up here.
  const vpRevObj_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpRev, parentId: ceoObj_2526, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Drive ₹24 Cr New ARR — Enterprise Dominance and SMB at Scale',
    weight: 70, status: 'submitted', submittedAt: '2025-04-11',
  });
  const vpRevKR_arr_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpRev, parentId: ceoKR_arr_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'New ARR — Sales Contribution', unit: 'INR Cr',
    companyTarget: 30, planned: 24, stretch: 29,
    weight: 40, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpRev, parentId: vpRevObj_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sales Win Rate', unit: '%',
    planned: 36, stretch: 44,
    weight: 20, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpRev, parentId: vpRevObj_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'New Logos Won', unit: 'count',
    planned: 75, stretch: 92,
    weight: 10, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpRev, parentId: ceoObj2_2526, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Double the Sales Team and Hit 80% Ramp Efficiency',
    weight: 30, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpRev, parentId: ceoKR_enps_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sales Team eNPS', unit: 'score',
    companyTarget: 75, planned: 75, stretch: 82,
    weight: 20, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpRev, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sales Rep Ramp to Quota (%)', unit: '%',
    planned: 80, stretch: 90,
    weight: 10, status: 'submitted', submittedAt: '2025-04-11',
  });

  // ── VP Product FY25-26 (submitted) ────────────────────────────────────────
  const vpProdObj_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpProd, parentId: ceoObj_2526, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Deliver 99.95% Uptime, 25 Feature Releases, and Full CI/CD Automation',
    weight: 70, status: 'submitted', submittedAt: '2025-04-11',
  });
  const vpProdKR_up_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpProd, parentId: ceoKR_uptime_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Platform Uptime (SLA)', unit: '%',
    companyTarget: 99.95, planned: 99.95, stretch: 99.99,
    weight: 30, status: 'submitted', submittedAt: '2025-04-11',
  });
  const vpProdKR_feat_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpProd, parentId: vpProdObj_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Feature Releases (Major)', unit: 'count',
    planned: 25, stretch: 30,
    weight: 25, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpProd, parentId: vpProdObj_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'CI/CD Build Pipeline Duration', unit: 'minutes',
    planned: 5, stretch: 3, measure: 'lower_better',
    weight: 15, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpProd, parentId: ceoObj2_2526, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build the Most Talented and Engaged Engineering Team',
    weight: 30, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpProd, parentId: ceoKR_enps_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Engineering Team eNPS', unit: 'score',
    companyTarget: 75, planned: 75, stretch: 82,
    weight: 20, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpProd, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Sprint Velocity', unit: 'points',
    planned: 44, stretch: 52,
    weight: 10, status: 'submitted', submittedAt: '2025-04-11',
  });

  // ── VP Customer Experience FY25-26 (submitted) ────────────────────────────
  const vpCXObj_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpCX, parentId: ceoObj_2526, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Create Raving Fans — NPS 88+ and Zero Churn in Top 20 Accounts',
    weight: 70, status: 'submitted', submittedAt: '2025-04-11',
  });
  const vpCXKR_nps_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpCX, parentId: ceoKR_nps_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Customer NPS', unit: 'score',
    companyTarget: 88, planned: 88, stretch: 94,
    weight: 35, status: 'submitted', submittedAt: '2025-04-11',
  });
  const vpCXKR_ttv_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpCX, parentId: vpCXObj_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Time to Value (New Customers)', unit: 'days',
    planned: 21, stretch: 14, measure: 'lower_better',
    weight: 20, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpCX, parentId: vpCXObj_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Customer Churn Rate', unit: '%',
    planned: 3, stretch: 1.5, measure: 'lower_better',
    weight: 15, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpCX, parentId: ceoObj2_2526, level: 2,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build a CX Team Where Every Member Owns Customer Outcomes',
    weight: 30, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpCX, parentId: ceoKR_enps_2526, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'CX Team eNPS', unit: 'score',
    companyTarget: 75, planned: 75, stretch: 82,
    weight: 20, status: 'submitted', submittedAt: '2025-04-11',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: vpCX, level: 2,
    type: 'okr_kr', dir: 'top_down',
    title: 'Tier-1 Ticket SLA Compliance', unit: '%',
    planned: 99, stretch: 100,
    weight: 10, status: 'submitted', submittedAt: '2025-04-11',
  });

  // ── Head Enterprise Sales FY25-26 (draft — waiting VP Revenue approval) ──
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hEntSal, parentId: vpRevObj_2526, level: 3,
    type: 'okr_objective', dir: 'top_down',
    title: 'Own the ₹14 Cr Enterprise ARR — 7 New Logos and 4 Expansions',
    weight: 70, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hEntSal, parentId: vpRevKR_arr_2526, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'Enterprise ARR Won', unit: 'INR Cr',
    companyTarget: 30, planned: 14, stretch: 17,
    weight: 40, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hEntSal, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'Enterprise New Logos', unit: 'count',
    planned: 7, stretch: 10,
    weight: 20, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hEntSal, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'Avg Enterprise Deal Size', unit: 'INR Lakh',
    planned: 40, stretch: 52,
    weight: 10, status: 'draft',
  });

  // ── Head SMB FY25-26 (draft) ──────────────────────────────────────────────
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hSMB, parentId: vpRevObj_2526, level: 3,
    type: 'okr_objective', dir: 'top_down',
    title: 'Build SMB Engine — 100 New Logos per Quarter at <30 Day Sales Cycle',
    weight: 70, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hSMB, parentId: vpRevKR_arr_2526, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'SMB ARR Won', unit: 'INR Cr',
    companyTarget: 30, planned: 10, stretch: 12,
    weight: 40, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hSMB, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'SMB New Logos per Quarter', unit: 'count',
    planned: 100, stretch: 125,
    weight: 30, status: 'draft',
  });

  // ── Head Platform Engineering FY25-26 — BIDIRECTIONAL ────────────────────
  // TOP-DOWN track: VP Product cascaded a KR to Divya (draft, waiting VP approval)
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hPlat, parentId: vpProdKR_up_2526, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'Platform SLA — Infrastructure Contribution', unit: '%',
    companyTarget: 99.95, planned: 99.97, stretch: 99.999,
    weight: 40, status: 'draft',
  });
  // BOTTOM-UP track: Divya self-proposed a CI/CD OKR from Day 1.
  // VP Product has NOT yet linked it — parentId is null (unlinked).
  // This blocks cycle advancement to 'active' (V13).
  const hPlatObj_bu_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: hPlat, parentId: null, level: 3,
    type: 'okr_objective', dir: 'bottom_up',
    title: 'Achieve Sub-5min CI/CD and 99.99% Self-Healing Infrastructure',
    desc: 'Divya proposed this on Apr 1 based on FY24-25 success. VP Product needs to link this to a company OKR before cycle can go active.',
    weight: 40, status: 'proposed',
    submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hPlat, parentId: hPlatObj_bu_2526, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'CI/CD Build Pipeline Duration', unit: 'minutes',
    planned: 5, stretch: 3, measure: 'lower_better',
    weight: 25, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hPlat, parentId: hPlatObj_bu_2526, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Infrastructure Self-Healing Recovery Time (MTTR)', unit: 'minutes',
    planned: 5, stretch: 2, measure: 'lower_better',
    weight: 15, status: 'proposed', submittedAt: '2025-04-01',
  });

  // ── Head Product Management FY25-26 — BIDIRECTIONAL ──────────────────────
  // TOP-DOWN: VP Product cascaded feature velocity KR
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hPM, parentId: vpProdKR_feat_2526, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'Feature Releases (PM-owned tracks)', unit: 'count',
    planned: 18, stretch: 22,
    weight: 50, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hPM, parentId: vpProdObj_2526, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'Feature Adoption Rate (30-day cohort)', unit: '%',
    planned: 55, stretch: 68,
    weight: 20, status: 'draft',
  });
  // BOTTOM-UP: Aditya proposed a customer-centric product OKR (unlinked)
  const hPMObj_bu_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: hPM, parentId: null, level: 3,
    type: 'okr_objective', dir: 'bottom_up',
    title: 'Ship 3 Customer-Requested Feature Clusters Before Q3',
    desc: 'Aditya proposed based on Q1 NPS verbatim analysis — top 3 feature requests from > 40% of customers.',
    weight: 30, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hPM, parentId: hPMObj_bu_2526, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Customer-Requested Feature Clusters Shipped by Q3', unit: 'count',
    planned: 3, stretch: 4,
    weight: 20, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hPM, parentId: hPMObj_bu_2526, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Product NPS Delta (post-release survey)', unit: 'points',
    planned: 8, stretch: 15, measure: 'higher_better',
    weight: 10, status: 'proposed', submittedAt: '2025-04-01',
  });

  // ── Head Customer Onboarding FY25-26 — BIDIRECTIONAL ─────────────────────
  // TOP-DOWN: VP CX cascaded TTV KR to Sunita
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hOnboard, parentId: vpCXKR_ttv_2526, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'Average Onboarding Duration', unit: 'days',
    planned: 21, stretch: 14, measure: 'lower_better',
    weight: 35, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hOnboard, parentId: vpCXObj_2526, level: 3,
    type: 'okr_kr', dir: 'top_down',
    title: 'Onboarding NPS (7-day survey)', unit: 'score',
    planned: 88, stretch: 94,
    weight: 25, status: 'draft',
  });
  // BOTTOM-UP: Sunita proposed a deeper onboarding transformation OKR (unlinked)
  const hOnboardObj_bu_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: hOnboard, parentId: null, level: 3,
    type: 'okr_objective', dir: 'bottom_up',
    title: 'Redesign Onboarding to Achieve 95% Activation Rate in 21 Days',
    desc: 'Sunita self-proposed this. FY24-25 data shows 7% activation failure occurs between days 22-30 — new playbook targets this gap.',
    weight: 40, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hOnboard, parentId: hOnboardObj_bu_2526, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: '90-Day Customer Activation Rate', unit: '%',
    planned: 95, stretch: 98,
    weight: 25, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hOnboard, parentId: hOnboardObj_bu_2526, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Day-30 Product Engagement Score (DAU/MAU ratio)', unit: '%',
    planned: 48, stretch: 60,
    weight: 15, status: 'proposed', submittedAt: '2025-04-01',
  });

  // ── Head Customer Support FY25-26 — PURE BOTTOM-UP (new this cycle) ──────
  // Ganesh proposed his entire OKR set from Day 1 — no top-down assignments yet.
  // VP CX is expected to link these to the company CX objective.
  const hSupObj_bu_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: hSup, parentId: null, level: 3,
    type: 'okr_objective', dir: 'bottom_up',
    title: 'Achieve 99% SLA Compliance and <1hr First Response on All Tier-1 Tickets',
    desc: 'Ganesh self-proposed. Support team improved SLA from 94% to 97% in FY24-25 — targeting best-in-class this year.',
    weight: 70, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hSup, parentId: hSupObj_bu_2526, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Tier-1 Ticket SLA Compliance', unit: '%',
    planned: 99, stretch: 100,
    weight: 40, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hSup, parentId: hSupObj_bu_2526, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Average First Response Time (Tier-1)', unit: 'hours',
    planned: 1, stretch: 0.5, measure: 'lower_better',
    weight: 20, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hSup, parentId: hSupObj_bu_2526, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Customer Satisfaction Score (CSAT) — Support', unit: 'score',
    planned: 4.7, stretch: 4.9,
    weight: 10, status: 'proposed', submittedAt: '2025-04-01',
  });
  const hSupObj2_bu_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: hSup, parentId: null, level: 3,
    type: 'okr_objective', dir: 'bottom_up',
    title: 'Build a Knowledge-First Support Team — Reduce Repeat Tickets by 40%',
    desc: 'Ganesh identified that 38% of tickets are repeats for the same issue — proposes a self-serve knowledge base initiative.',
    weight: 30, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hSup, parentId: hSupObj2_bu_2526, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Repeat Ticket Rate Reduction', unit: '%',
    planned: 40, stretch: 55, measure: 'higher_better',
    weight: 20, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: hSup, parentId: hSupObj2_bu_2526, level: 3,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Knowledge Base Articles Published', unit: 'count',
    planned: 120, stretch: 200,
    weight: 10, status: 'proposed', submittedAt: '2025-04-01',
  });

  // ── Senior Backend Engineer FY25-26 (NX-014) — BOTTOM-UP technical OKR ──
  // Sneha proposed a quality-focused OKR from Day 1.
  // VP Product / Head Platform must link this to company objectives.
  const smBEObj_bu_2526 = insertTarget(db, {
    orgId, cycleId: cy2526, empId: smBE, parentId: null, level: 4,
    type: 'okr_objective', dir: 'bottom_up',
    title: 'Zero P0 Bugs and 100% Coverage on All Critical API Paths',
    desc: 'Sneha self-proposed after the FY24-25 Aug 2024 incident showed 2 P0 bugs slipped through. This is her personal quality commitment.',
    weight: 60, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: smBE, parentId: smBEObj_bu_2526, level: 4,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'P0/P1 Bugs in Production', unit: 'count',
    planned: 0, stretch: 0, measure: 'lower_better',
    weight: 35, status: 'proposed', submittedAt: '2025-04-01',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: smBE, parentId: smBEObj_bu_2526, level: 4,
    type: 'okr_kr', dir: 'bottom_up',
    title: 'Critical API Path Test Coverage', unit: '%',
    planned: 100, stretch: 100,
    weight: 25, status: 'proposed', submittedAt: '2025-04-01',
  });
  // TOP-DOWN: Head Platform also assigned a velocity KR (draft)
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: smBE, parentId: hPlatObj_bu_2526, level: 4,
    type: 'okr_kr', dir: 'top_down',
    title: 'Backend Sprint Velocity', unit: 'points',
    planned: 46, stretch: 55,
    weight: 40, status: 'draft',
  });

  // Senior CSM FY25-26 (NX-016) — draft top-down
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: smCSM, parentId: vpCXKR_ttv_2526, level: 4,
    type: 'okr_kr', dir: 'top_down',
    title: 'Portfolio Avg Onboarding Duration', unit: 'days',
    planned: 21, stretch: 14, measure: 'lower_better',
    weight: 40, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: smCSM, parentId: vpCXObj_2526, level: 4,
    type: 'okr_kr', dir: 'top_down',
    title: 'Customer Portfolio NPS', unit: 'score',
    planned: 88, stretch: 94,
    weight: 35, status: 'draft',
  });
  insertTarget(db, {
    orgId, cycleId: cy2526, empId: smCSM, level: 4,
    type: 'okr_kr', dir: 'top_down',
    title: 'Accounts at Risk (Churn Signal)', unit: 'count',
    planned: 2, stretch: 0, measure: 'lower_better',
    weight: 25, status: 'draft',
  });

  console.log('NexaFlow targets seeded: 3 cycles, L1→L4 bidirectional showcase, top-down + bottom-up tracks.');
}

// ─── Main entry point ────────────────────────────────────────────────────────

async function seedTargets() {
  const db = getDb();
  seedTechCorpTargets(db);
  seedManufacturingTargets(db);
  seedNexaFlowTargets(db);
  saveDb();
  console.log('Demo targets seed complete.');
}

module.exports = { seedTargets };
