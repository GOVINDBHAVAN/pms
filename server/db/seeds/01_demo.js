const bcrypt = require('bcrypt');
const { getDb, saveDb } = require('../database');

const SALT_ROUNDS = 10;

function rowsToObjects(result) {
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

// ── Org Settings Templates ─────────────────────────────────────────────────────

const IT_SETTINGS = {
  framework: 'hybrid',
  cascade_mode: 'bidirectional',
  industry: 'it',
  terminology: {
    kra: 'Key Result Area', kpi: 'Key Performance Indicator',
    objective: 'Objective', key_result: 'Key Result',
    goal: 'Goal', competency: 'Competency',
    weight: 'Weight (%)', planned: 'Planned Target',
    actual: 'Actual Achievement', stretch: 'Stretch Target',
    performance_band: 'Performance Band',
  },
  active_types: ['okr_objective', 'okr_kr', 'kra', 'kpi', 'competency'],
  primary_type: 'okr',
  rating_scale: {
    goals: {
      type: '5_point',
      labels: ['Poor', 'Below Expectation', 'Meets Expectation', 'Exceeds Expectation', 'Exceptional'],
      values: [1, 2, 3, 4, 5], pip_below: 2,
    },
    competency: {
      type: '5_point',
      labels: ['Unacceptable', 'Developing', 'Proficient', 'Advanced', 'Expert'],
      values: [1, 2, 3, 4, 5],
    },
  },
  weightage: { goals_percent: 70, competency_percent: 30 },
  performance_bands: [
    { label: 'Exceptional',       min: 4.5, max: 5.0,  color: '#16a34a' },
    { label: 'Exceeds',           min: 3.5, max: 4.49, color: '#2563eb' },
    { label: 'Meets Expectation', min: 2.5, max: 3.49, color: '#d97706' },
    { label: 'Below Expectation', min: 1.5, max: 2.49, color: '#dc2626' },
    { label: 'Poor',              min: 0,   max: 1.49, color: '#7f1d1d' },
  ],
  target_rules: {
    min_target_weight: 5, max_target_weight: 50,
    overplan_allowed: true, overplan_max_multiplier: 1.20,
    require_parent_linkage: true, allow_self_propose: true, mandatory_kras: [],
  },
  bsc_perspectives: ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'],
  cycle_defaults: { type: 'annual', goal_setting_days: 30, review_days: 21 },
};

const MFG_SETTINGS = {
  framework: 'kra_kpi',
  cascade_mode: 'top_down',
  industry: 'manufacturing',
  terminology: {
    kra: 'Key Result Area', kpi: 'Key Performance Indicator',
    objective: 'Objective', key_result: 'Key Result',
    goal: 'Goal', competency: 'Competency',
    weight: 'Weight (%)', planned: 'Planned Target',
    actual: 'Actual Achievement', stretch: 'Stretch Target',
    performance_band: 'Performance Band',
  },
  active_types: ['kra', 'kpi'],
  primary_type: 'kra_kpi',
  rating_scale: {
    goals: {
      type: '5_point',
      labels: ['Poor', 'Below Expectation', 'Meets Expectation', 'Exceeds Expectation', 'Exceptional'],
      values: [1, 2, 3, 4, 5], pip_below: 2,
    },
    competency: {
      type: '5_point',
      labels: ['Unacceptable', 'Developing', 'Proficient', 'Advanced', 'Expert'],
      values: [1, 2, 3, 4, 5],
    },
  },
  weightage: { goals_percent: 100, competency_percent: 0 },
  performance_bands: [
    { label: 'Exceptional',       min: 4.5, max: 5.0,  color: '#16a34a' },
    { label: 'Exceeds',           min: 3.5, max: 4.49, color: '#2563eb' },
    { label: 'Meets Expectation', min: 2.5, max: 3.49, color: '#d97706' },
    { label: 'Below Expectation', min: 1.5, max: 2.49, color: '#dc2626' },
    { label: 'Poor',              min: 0,   max: 1.49, color: '#7f1d1d' },
  ],
  target_rules: {
    min_target_weight: 5, max_target_weight: 50,
    overplan_allowed: true, overplan_max_multiplier: 1.10,
    require_parent_linkage: true, allow_self_propose: false, mandatory_kras: [],
  },
  cycle_defaults: { type: 'annual', goal_setting_days: 30, review_days: 21 },
};

const HEALTH_SETTINGS = {
  framework: 'hybrid',
  cascade_mode: 'top_down',
  industry: 'healthcare',
  terminology: {
    kra: 'Key Result Area', kpi: 'Key Performance Indicator',
    objective: 'Objective', key_result: 'Key Result',
    goal: 'Goal', competency: 'Competency',
    weight: 'Weight (%)', planned: 'Planned Target',
    actual: 'Actual Achievement', stretch: 'Stretch Target',
    performance_band: 'Performance Band',
  },
  active_types: ['goal', 'competency'],
  primary_type: 'goals',
  rating_scale: {
    goals: {
      type: '5_point',
      labels: ['Poor', 'Below Expectation', 'Meets Expectation', 'Exceeds Expectation', 'Exceptional'],
      values: [1, 2, 3, 4, 5], pip_below: 2,
    },
    competency: {
      type: '5_point',
      labels: ['Unacceptable', 'Developing', 'Proficient', 'Advanced', 'Expert'],
      values: [1, 2, 3, 4, 5],
    },
  },
  weightage: { goals_percent: 60, competency_percent: 40 },
  performance_bands: [
    { label: 'Exceptional',       min: 4.5, max: 5.0,  color: '#16a34a' },
    { label: 'Exceeds',           min: 3.5, max: 4.49, color: '#2563eb' },
    { label: 'Meets Expectation', min: 2.5, max: 3.49, color: '#d97706' },
    { label: 'Below Expectation', min: 1.5, max: 2.49, color: '#dc2626' },
    { label: 'Poor',              min: 0,   max: 1.49, color: '#7f1d1d' },
  ],
  target_rules: {
    min_target_weight: 5, max_target_weight: 50,
    overplan_allowed: true, overplan_max_multiplier: 1.15,
    require_parent_linkage: true, allow_self_propose: false, mandatory_kras: [],
  },
  cycle_defaults: { type: 'annual', goal_setting_days: 30, review_days: 21 },
};

// ── Seeder helpers ─────────────────────────────────────────────────────────────

function orgExists(db, name) {
  const r = db.exec('SELECT COUNT(*) FROM organizations WHERE name = ?', [name]);
  return r[0].values[0][0] > 0;
}

function lastId(db) {
  return db.exec('SELECT last_insert_rowid()')[0].values[0][0];
}

// Safe deletion of all data for an org (handles FK dependencies)
function purgeOrg(db, orgId) {
  db.run('DELETE FROM target_audit_log WHERE target_id IN (SELECT id FROM targets WHERE org_id = ?)', [orgId]);
  db.run('DELETE FROM performance_summary WHERE cycle_id IN (SELECT id FROM review_cycles WHERE org_id = ?)', [orgId]);
  db.run('DELETE FROM targets WHERE org_id = ?', [orgId]);
  db.run('DELETE FROM review_cycles WHERE org_id = ?', [orgId]);
  db.run('DELETE FROM wizard_progress WHERE org_id = ?', [orgId]);
  db.run('DELETE FROM performance_library WHERE org_id = ?', [orgId]);
  db.run('UPDATE employees SET reporting_to = NULL WHERE org_id = ?', [orgId]);
  db.run('DELETE FROM employees WHERE org_id = ?', [orgId]);
  db.run('DELETE FROM grades WHERE org_id = ?', [orgId]);
  db.run('DELETE FROM departments WHERE org_id = ?', [orgId]);
  db.run('DELETE FROM organizations WHERE id = ?', [orgId]);
}

async function seedItOrg(db, passwordHash) {
  // Check if already seeded with the full 50-employee hierarchy
  if (orgExists(db, 'TechCorp Demo')) {
    const countRes = db.exec(
      `SELECT COUNT(*) FROM employees WHERE org_id = (SELECT id FROM organizations WHERE name = 'TechCorp Demo')`
    );
    const empCount = countRes[0]?.values[0][0] ?? 0;
    if (empCount >= 45) {
      db.run(`UPDATE organizations SET is_demo = 1 WHERE name = 'TechCorp Demo'`);
      console.log(`TechCorp Demo already has ${empCount} employees — skipping`);
      return;
    }
    // Re-seed with expanded hierarchy
    const orgIdRes = db.exec(`SELECT id FROM organizations WHERE name = 'TechCorp Demo'`);
    const existingId = orgIdRes[0].values[0][0];
    console.log(`TechCorp Demo has only ${empCount} employees — re-seeding with 50-employee hierarchy...`);
    purgeOrg(db, existingId);
  }

  console.log('Seeding TechCorp Demo (IT) — 50-employee L1→L7 hierarchy...');
  db.run(
    `INSERT INTO organizations (name, industry, framework, cascade_mode, settings, wizard_completed, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['TechCorp Demo', 'it', 'hybrid', 'bidirectional', JSON.stringify(IT_SETTINGS), 1, 1]
  );
  const orgId = lastId(db);

  // ── Grades: L1 (CEO) → L9 (Trainee) ──────────────────────────────────────
  const grades = {};
  [
    ['L1','CEO / Managing Director',        9, 1],
    ['L2','Vice President',                 8, 1],
    ['L3','General Manager / Head',         7, 1],
    ['L4','Senior Manager',                 6, 1],
    ['L5','Manager',                        5, 1],
    ['L6','Senior Executive',               4, 0],
    ['L7','Executive / Associate',          3, 0],
    ['L8','Junior Associate',               2, 0],
    ['L9','Trainee',                        1, 0],
  ].forEach(([code, label, level, canManage], i) => {
    db.run(`INSERT INTO grades (org_id,code,label,level,can_manage,sort_order) VALUES (?,?,?,?,?,?)`,
      [orgId, code, label, level, canManage, i + 1]);
    grades[code] = lastId(db);
  });

  // ── Departments ────────────────────────────────────────────────────────────
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId, 'Sales & Business Development', 'SAL']);
  const dSal = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId, 'Product & Engineering', 'ENG']);
  const dEng = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId, 'Customer Success & Support', 'SUP']);
  const dSup = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId, 'People & Culture', 'HR']);
  const dHR = lastId(db);

  function emp(code, name, email, deptId, grade, reportsTo, role) {
    db.run(
      `INSERT INTO employees (org_id,emp_code,name,email,password_hash,dept_id,grade_id,reporting_to,role,joined_on)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [orgId, code, name, email, passwordHash, deptId, grades[grade], reportsTo, role, '2023-04-01']
    );
    return lastId(db);
  }

  // ── L1: CEO (1) ───────────────────────────────────────────────────────────
  const ceo = emp('IT-001', 'Arjun Mehta',     'arjun.mehta@techcorp.com',    dEng, 'L1', null,   'admin');

  // ── L2: VPs (4) ────────────────────────────────────────────────────────────
  const vpSal = emp('IT-002', 'Suresh Nair',    'suresh.nair@techcorp.com',    dSal, 'L2', ceo,    'manager');
  const vpEng = emp('IT-003', 'Ramesh Kumar',   'ramesh.kumar@techcorp.com',   dEng, 'L2', ceo,    'manager');
  const vpSup = emp('IT-004', 'Priya Sharma',   'priya.sharma@techcorp.com',   dSup, 'L2', ceo,    'manager');
  const vpHR  = emp('IT-005', 'Meera Reddy',    'meera.reddy@techcorp.com',    dHR,  'L2', ceo,    'manager');

  // ── L3: General Managers / Heads (8) ──────────────────────────────────────
  // Sales (2)
  const gmEntSal  = emp('IT-006', 'Raj Kapoor',    'raj.kapoor@techcorp.com',    dSal, 'L3', vpSal, 'manager');
  const gmSmbSal  = emp('IT-007', 'Kavya Rao',     'kavya.rao@techcorp.com',     dSal, 'L3', vpSal, 'manager');
  // Engineering (2)
  const gmBackEng = emp('IT-008', 'Kiran Patel',   'kiran.patel@techcorp.com',   dEng, 'L3', vpEng, 'manager');
  const gmQA      = emp('IT-009', 'Ananya Singh',  'ananya.singh@techcorp.com',  dEng, 'L3', vpEng, 'manager');
  // Support (2)
  const gmCS      = emp('IT-010', 'Dev Kumar',     'dev.kumar@techcorp.com',     dSup, 'L3', vpSup, 'manager');
  const gmTS      = emp('IT-011', 'Rohit Joshi',   'rohit.joshi@techcorp.com',   dSup, 'L3', vpSup, 'manager');
  // People & Culture (2)
  const gmHR      = emp('IT-012', 'Pooja Pillai',  'pooja.pillai@techcorp.com',  dHR,  'L3', vpHR,  'manager');
  const gmAdm     = emp('IT-013', 'Sanjay Mehta',  'sanjay.mehta@techcorp.com',  dHR,  'L3', vpHR,  'manager');

  // ── L4: Senior Managers (12) ───────────────────────────────────────────────
  // Enterprise Sales (under Raj Kapoor)
  const smNorth  = emp('IT-014', 'Vikas Gupta',    'vikas.gupta@techcorp.com',   dSal, 'L4', gmEntSal,  'manager');
  const smSouth  = emp('IT-015', 'Neha Agarwal',   'neha.agarwal@techcorp.com',  dSal, 'L4', gmEntSal,  'manager');
  // SMB Sales (under Kavya Rao)
  const smWest   = emp('IT-016', 'Deepak Rao',     'deepak.rao@techcorp.com',    dSal, 'L4', gmSmbSal,  'manager');
  const smAcc    = emp('IT-017', 'Sunita Verma',   'sunita.verma@techcorp.com',  dSal, 'L4', gmSmbSal,  'manager');
  // Backend Engg (under Kiran Patel)
  const smBE     = emp('IT-018', 'Aryan Bose',     'aryan.bose@techcorp.com',    dEng, 'L4', gmBackEng, 'manager');
  const smFE     = emp('IT-019', 'Riya Kapoor',    'riya.kapoor@techcorp.com',   dEng, 'L4', gmBackEng, 'manager');
  // QA (under Ananya Singh)
  const smQA1    = emp('IT-020', 'Harish Tiwari',  'harish.tiwari@techcorp.com', dEng, 'L4', gmQA,      'manager');
  const smQA2    = emp('IT-021', 'Lata Krishnan',  'lata.krishnan@techcorp.com', dEng, 'L4', gmQA,      'manager');
  // Customer Success (under Dev Kumar)
  const smCS     = emp('IT-022', 'Ganesh Pillai',  'ganesh.pillai@techcorp.com', dSup, 'L4', gmCS,      'manager');
  // Technical Support (under Rohit Joshi)
  const smTS     = emp('IT-023', 'Mohan Iyer',     'mohan.iyer@techcorp.com',    dSup, 'L4', gmTS,      'manager');
  // HR (under Pooja Pillai)
  const smHR     = emp('IT-024', 'Deepa Joshi',    'deepa.joshi@techcorp.com',   dHR,  'L4', gmHR,      'manager');
  // Admin (under Sanjay Mehta)
  const smAdm    = emp('IT-025', 'Vikram Desai',   'vikram.desai@techcorp.com',  dHR,  'L4', gmAdm,     'manager');

  // ── L5: Managers (16) ──────────────────────────────────────────────────────
  // Under smNorth (Vikas Gupta — North Enterprise Sales)
  const m01 = emp('IT-026', 'Amit Sharma',     'amit.sharma@techcorp.com',    dSal, 'L5', smNorth, 'manager');
  const m02 = emp('IT-027', 'Sneha Patil',     'sneha.patil@techcorp.com',    dSal, 'L5', smNorth, 'employee');
  // Under smSouth (Neha Agarwal — South Enterprise Sales)
  const m03 = emp('IT-028', 'Rahul Singh',     'rahul.singh@techcorp.com',    dSal, 'L5', smSouth, 'employee');
  const m04 = emp('IT-029', 'Divya Nair',      'divya.nair@techcorp.com',     dSal, 'L5', smSouth, 'employee');
  // Under smWest (Deepak Rao — West SMB Sales)
  const m05 = emp('IT-030', 'Rohan Verma',     'rohan.verma@techcorp.com',    dSal, 'L5', smWest,  'employee');
  const m06 = emp('IT-031', 'Priya Kumar',     'priya.kumar@techcorp.com',    dSal, 'L5', smWest,  'employee');
  // Under smBE (Aryan Bose — Backend)
  const m07 = emp('IT-032', 'Akash Kumar',     'akash.kumar@techcorp.com',    dEng, 'L5', smBE,    'manager');
  const m08 = emp('IT-033', 'Preethi Reddy',   'preethi.reddy@techcorp.com',  dEng, 'L5', smBE,    'employee');
  // Under smFE (Riya Kapoor — Frontend)
  const m09 = emp('IT-034', 'Aditya Sharma',   'aditya.sharma@techcorp.com',  dEng, 'L5', smFE,    'manager');
  const m10 = emp('IT-035', 'Ankita Singh',    'ankita.singh@techcorp.com',   dEng, 'L5', smFE,    'employee');
  // Under smQA1 (Harish Tiwari — QA)
  const m11 = emp('IT-036', 'Varun Gupta',     'varun.gupta@techcorp.com',    dEng, 'L5', smQA1,   'manager');
  const m12 = emp('IT-037', 'Nandini Pillai',  'nandini.pillai@techcorp.com', dEng, 'L5', smQA1,   'employee');
  // Under smCS (Ganesh Pillai — Customer Success)
  const m13 = emp('IT-038', 'Ritika Gupta',    'ritika.gupta@techcorp.com',   dSup, 'L5', smCS,    'manager');
  const m14 = emp('IT-039', 'Arun Menon',      'arun.menon@techcorp.com',     dSup, 'L5', smCS,    'employee');
  // Under smHR (Deepa Joshi — HR)
  const m15 = emp('IT-040', 'Kavitha Rao',     'kavitha.rao@techcorp.com',    dHR,  'L5', smHR,    'manager');
  const m16 = emp('IT-041', 'Shubham Tiwari',  'shubham.tiwari@techcorp.com', dHR,  'L5', smHR,    'employee');

  // ── L6: Senior Executives (6) ──────────────────────────────────────────────
  const se01 = emp('IT-042', 'Abhinav Patel',   'abhinav.patel@techcorp.com',  dEng, 'L6', m07,    'manager');
  const se02 = emp('IT-043', 'Reshma Pillai',   'reshma.pillai@techcorp.com',  dEng, 'L6', m07,    'employee');
  const se03 = emp('IT-044', 'Manish Verma',    'manish.verma@techcorp.com',   dEng, 'L6', m11,    'employee');
  const se04 = emp('IT-045', 'Naveen Kumar',    'naveen.kumar@techcorp.com',   dSal, 'L6', m01,    'manager');
  const se05 = emp('IT-046', 'Meenakshi Iyer',  'meenakshi.iyer@techcorp.com', dSup, 'L6', m13,    'manager');
  const se06 = emp('IT-047', 'Pallavi Soni',    'pallavi.soni@techcorp.com',   dHR,  'L6', m15,    'employee');

  // ── L7: Executives / Associates (3) ────────────────────────────────────────
  emp('IT-048', 'Zara Khan',       'zara.khan@techcorp.com',      dEng, 'L7', se01, 'employee');
  emp('IT-049', 'Divyanka Rao',    'divyanka.rao@techcorp.com',   dSal, 'L7', se04, 'employee');
  emp('IT-050', 'Prasad Rao',      'prasad.rao@techcorp.com',     dSup, 'L7', se05, 'employee');

  // ── Review Cycle ────────────────────────────────────────────────────────────
  db.run(
    `INSERT INTO review_cycles
       (org_id,name,cycle_type,period_start,period_end,goal_set_open,goal_set_close,review_open,review_close,cascade_mode,status,created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [orgId, 'FY 2025-26 Annual', 'annual',
     '2025-04-01', '2026-03-31',
     '2025-04-01', '2025-05-31',
     '2026-02-01', '2026-02-28',
     'bidirectional', 'goal_setting', ceo]
  );

  // ── Performance Library ─────────────────────────────────────────────────────
  [
    // OKR / KR items
    ['okr_objective', 'Achieve Market Leadership in South India',            'financial', null,    'higher_better', 0],
    ['okr_objective', 'Build a World-Class Product & Engineering Function',  'process',   null,    'higher_better', 0],
    ['okr_objective', 'Create Exceptional Customer Experience',              'customer',  null,    'higher_better', 0],
    ['okr_objective', 'Build the Best Place to Work in India',               'people',    null,    'higher_better', 0],
    ['okr_kr',  'New ARR (Annual Recurring Revenue)',      'financial', 'INR Cr',  'higher_better', 0],
    ['okr_kr',  'Customer Acquisition Count',             'customer',  'clients', 'higher_better', 0],
    ['okr_kr',  'NPS (Net Promoter Score)',               'customer',  'score',   'higher_better', 0],
    ['okr_kr',  'Feature Release Velocity',               'process',   'features','higher_better', 0],
    ['okr_kr',  'System Uptime (SLA)',                    'process',   '%',       'higher_better', 0],
    ['okr_kr',  'Employee eNPS',                          'people',    'score',   'higher_better', 0],
    // KRA / KPI items
    ['kra',  'Revenue Growth',                    'financial', null,    'higher_better', 0],
    ['kra',  'Product Quality & Reliability',     'process',   null,    'higher_better', 0],
    ['kra',  'Customer Satisfaction',             'customer',  null,    'higher_better', 0],
    ['kra',  'Talent Acquisition & Retention',    'people',    null,    'higher_better', 0],
    ['kpi',  'Monthly Recurring Revenue (MRR)',   'financial', 'INR',   'higher_better', 0],
    ['kpi',  'Churn Rate',                        'customer',  '%',     'lower_better',  0],
    ['kpi',  'Sprint Velocity',                   'process',   'points','higher_better', 0],
    ['kpi',  'Bug Escape Rate',                   'process',   '%',     'lower_better',  0],
    ['kpi',  'CSAT Score',                        'customer',  'score', 'higher_better', 0],
    ['kpi',  'Ticket Resolution Time',            'process',   'hours', 'lower_better',  0],
    ['kpi',  'Attrition Rate',                    'people',    '%',     'lower_better',  0],
    // Competencies
    ['competency', 'Strategic Thinking',          'people',    null,    'higher_better', 0],
    ['competency', 'Leadership & People Dev.',    'people',    null,    'higher_better', 0],
    ['competency', 'Technical Problem Solving',   'people',    null,    'higher_better', 1],
    ['competency', 'Customer Centricity',         'people',    null,    'higher_better', 0],
    ['competency', 'Collaboration & Teamwork',    'people',    null,    'higher_better', 0],
    ['competency', 'Ownership & Accountability',  'people',    null,    'higher_better', 0],
    ['competency', 'Communication & Influence',   'people',    null,    'higher_better', 0],
    ['competency', 'Adaptability & Learning',     'people',    null,    'higher_better', 0],
  ].forEach(([itemType, name, category, unit, measurementType, isMandatory]) => {
    db.run(
      `INSERT INTO performance_library (org_id,name,item_type,category,unit,measurement_type,is_mandatory) VALUES (?,?,?,?,?,?,?)`,
      [orgId, name, itemType, category, unit, measurementType, isMandatory]
    );
  });

  console.log(`TechCorp Demo seeded — org_id=${orgId}, 50 employees across 4 departments, L1→L7`);
}

async function seedManufacturingOrg(db, passwordHash) {
  if (orgExists(db, 'Precision Manufacturing Ltd')) {
    console.log('Precision Manufacturing Ltd already exists — skipping');
    return;
  }

  console.log('Seeding Precision Manufacturing Ltd...');
  db.run(
    `INSERT INTO organizations (name, industry, framework, cascade_mode, settings, wizard_completed, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Precision Manufacturing Ltd', 'manufacturing', 'kra_kpi', 'top_down', JSON.stringify(MFG_SETTINGS), 1, 1]
  );
  const orgId = lastId(db);

  const grades = {};
  [['L1','Managing Director',5,1],['L2','VP / Head',4,1],['L3','Department Head',3,1],['L4','Supervisor',2,1],['L5','Operator / Executive',1,0]].forEach(([code,label,level,canManage],i) => {
    db.run(`INSERT INTO grades (org_id,code,label,level,can_manage,sort_order) VALUES (?,?,?,?,?,?)`,
      [orgId,code,label,level,canManage,i+1]);
    grades[code] = lastId(db);
  });

  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId,'Production','PROD']);
  const dProd = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId,'Quality Control','QC']);
  const dQC = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId,'Human Resources','HR']);
  const dHR = lastId(db);

  function emp(code,name,email,deptId,grade,reportsTo,role) {
    db.run(`INSERT INTO employees (org_id,emp_code,name,email,password_hash,dept_id,grade_id,reporting_to,role,joined_on) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [orgId,code,name,email,passwordHash,deptId,grades[grade],reportsTo,role,'2020-06-01']);
    return lastId(db);
  }

  const md    = emp('M001','Vikram Desai',     'vikram.desai@precision.com',    dProd,'L1',null,   'admin');
  const vpOps = emp('M002','Sunil Bhatia',     'sunil.bhatia@precision.com',    dProd,'L2',md,     'manager');
  const hodP  = emp('M003','Ritu Agarwal',     'ritu.agarwal@precision.com',    dProd,'L3',vpOps,  'manager');
  const hodQ  = emp('M004','Ganesh Pillai',    'ganesh.pillai@precision.com',   dQC,  'L3',vpOps,  'manager');
  const sup1  = emp('M005','Harish Tiwari',    'harish.tiwari@precision.com',   dProd,'L4',hodP,   'manager');
                emp('M006','Sanjay Yadav',     'sanjay.yadav@precision.com',    dProd,'L5',sup1,   'employee');
                emp('M007','Poonam Verma',     'poonam.verma@precision.com',    dProd,'L5',sup1,   'employee');
                emp('M008','Arvind Shah',      'arvind.shah@precision.com',     dQC,  'L4',hodQ,   'employee');
                emp('M009','Lata Krishnan',    'lata.krishnan@precision.com',   dQC,  'L5',hodQ,   'employee');
                emp('M010','Deepa Joshi',      'deepa.joshi@precision.com',     dHR,  'L3',md,     'employee');

  db.run(`INSERT INTO review_cycles (org_id,name,cycle_type,period_start,period_end,goal_set_open,goal_set_close,review_open,review_close,cascade_mode,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [orgId,'FY 2025-26 Annual','annual','2025-04-01','2026-03-31','2025-04-01','2025-04-30','2026-02-01','2026-02-28','top_down','goal_setting',md]);

  [
    ['kra','Production Output & Efficiency','process','units','higher_better',0],
    ['kra','Quality & Defect Reduction','process','%','lower_better',0],
    ['kra','Safety & Compliance','process',null,'higher_better',0],
    ['kpi','Units Produced Per Day','process','units','higher_better',0],
    ['kpi','Defect Rate','process','%','lower_better',0],
    ['kpi','Machine Downtime','process','hours','lower_better',0],
    ['kpi','On-Time Delivery','customer','%','higher_better',0],
    ['kpi','Safety Incidents','process','count','lower_better',0],
  ].forEach(([itemType,name,category,unit,measurementType,isMandatory]) => {
    db.run(`INSERT INTO performance_library (org_id,name,item_type,category,unit,measurement_type,is_mandatory) VALUES (?,?,?,?,?,?,?)`,
      [orgId,name,itemType,category,unit,measurementType,isMandatory]);
  });

  console.log(`Precision Manufacturing Ltd seeded — org_id=${orgId}, 10 employees`);
}

async function seedHealthcareOrg(db, passwordHash) {
  if (orgExists(db, 'MediCare Hospital')) {
    console.log('MediCare Hospital already exists — skipping');
    return;
  }

  console.log('Seeding MediCare Hospital...');
  db.run(
    `INSERT INTO organizations (name, industry, framework, cascade_mode, settings, wizard_completed, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['MediCare Hospital', 'healthcare', 'hybrid', 'top_down', JSON.stringify(HEALTH_SETTINGS), 1, 1]
  );
  const orgId = lastId(db);

  const grades = {};
  [['L1','Director / CEO',5,1],['L2','Head of Department',4,1],['L3','Senior Consultant',3,1],['L4','Consultant / Senior Staff',2,0],['L5','Staff / Nurse',1,0]].forEach(([code,label,level,canManage],i) => {
    db.run(`INSERT INTO grades (org_id,code,label,level,can_manage,sort_order) VALUES (?,?,?,?,?,?)`,
      [orgId,code,label,level,canManage,i+1]);
    grades[code] = lastId(db);
  });

  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId,'Administration','ADMIN']);
  const dAdmin = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId,'Internal Medicine','IM']);
  const dIM = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId,'Nursing','NUR']);
  const dNur = lastId(db);

  function emp(code,name,email,deptId,grade,reportsTo,role) {
    db.run(`INSERT INTO employees (org_id,emp_code,name,email,password_hash,dept_id,grade_id,reporting_to,role,joined_on) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [orgId,code,name,email,passwordHash,deptId,grades[grade],reportsTo,role,'2019-03-15']);
    return lastId(db);
  }

  const ceo   = emp('H001','Dr. Anil Kapoor',    'anil.kapoor@medicare.com',     dAdmin,'L1',null,   'admin');
  const medDir= emp('H002','Dr. Shalini Gupta',  'shalini.gupta@medicare.com',   dIM,   'L2',ceo,    'manager');
  const nurDir= emp('H003','Sr. Padma Iyer',     'padma.iyer@medicare.com',      dNur,  'L2',ceo,    'manager');
  const hodIM = emp('H004','Dr. Rajiv Menon',    'rajiv.menon@medicare.com',     dIM,   'L3',medDir, 'manager');
  const nurMgr= emp('H005','Sr. Anita Sahu',     'anita.sahu@medicare.com',      dNur,  'L3',nurDir, 'manager');
                emp('H006','Dr. Prerna Goel',    'prerna.goel@medicare.com',     dIM,   'L4',hodIM,  'employee');
                emp('H007','Dr. Aryan Bose',     'aryan.bose@medicare.com',      dIM,   'L4',hodIM,  'employee');
                emp('H008','Sr. Kavitha Nair',   'kavitha.nair@medicare.com',    dNur,  'L5',nurMgr, 'employee');
                emp('H009','Sr. Renu Sharma',    'renu.sharma@medicare.com',     dNur,  'L5',nurMgr, 'employee');
                emp('H010','Mohan Pillai',        'mohan.pillai@medicare.com',   dAdmin,'L3',ceo,    'employee');

  db.run(`INSERT INTO review_cycles (org_id,name,cycle_type,period_start,period_end,goal_set_open,goal_set_close,review_open,review_close,cascade_mode,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [orgId,'FY 2025-26 Annual','annual','2025-04-01','2026-03-31','2025-04-01','2025-04-30','2026-02-01','2026-02-28','top_down','goal_setting',ceo]);

  [
    ['goal','Patient Satisfaction Score','customer','score','higher_better',0],
    ['goal','Bed Occupancy Rate','process','%','higher_better',0],
    ['goal','Average Length of Stay','process','days','lower_better',0],
    ['goal','Medication Error Rate','process','%','lower_better',0],
    ['competency','Clinical Knowledge & Skills','people',null,'higher_better',1],
    ['competency','Patient Empathy & Communication','people',null,'higher_better',0],
    ['competency','Team Collaboration','people',null,'higher_better',0],
    ['competency','Adherence to Protocols','people',null,'higher_better',0],
  ].forEach(([itemType,name,category,unit,measurementType,isMandatory]) => {
    db.run(`INSERT INTO performance_library (org_id,name,item_type,category,unit,measurement_type,is_mandatory) VALUES (?,?,?,?,?,?,?)`,
      [orgId,name,itemType,category,unit,measurementType,isMandatory]);
  });

  console.log(`MediCare Hospital seeded — org_id=${orgId}, 10 employees`);
}

// ── Main Seed Entry Point ──────────────────────────────────────────────────────

async function seed() {
  const db = getDb();
  const passwordHash = await bcrypt.hash('password123', SALT_ROUNDS);

  await seedItOrg(db, passwordHash);
  await seedManufacturingOrg(db, passwordHash);
  await seedHealthcareOrg(db, passwordHash);

  saveDb();
  console.log('Demo seed complete');
}

module.exports = { seed };
