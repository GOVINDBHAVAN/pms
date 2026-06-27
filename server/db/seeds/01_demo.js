const bcrypt = require('bcrypt');
const { getDb, saveDb } = require('../database');

const SALT_ROUNDS = 10;

const ORG_SETTINGS = {
  framework: 'hybrid',
  cascade_mode: 'bidirectional',
  industry: 'it',
  terminology: {
    kra: 'Key Result Area',
    kpi: 'Key Performance Indicator',
    objective: 'Objective',
    key_result: 'Key Result',
    goal: 'Goal',
    competency: 'Competency',
    weight: 'Weight (%)',
    planned: 'Planned Target',
    actual: 'Actual Achievement',
    stretch: 'Stretch Target',
    performance_band: 'Performance Band',
  },
  active_types: ['kra', 'kpi', 'competency'],
  primary_type: 'kra_kpi',
  rating_scale: {
    goals: {
      type: '5_point',
      labels: ['Poor', 'Below Expectation', 'Meets Expectation', 'Exceeds Expectation', 'Exceptional'],
      values: [1, 2, 3, 4, 5],
      pip_below: 2,
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
    min_target_weight: 5,
    max_target_weight: 50,
    overplan_allowed: true,
    overplan_max_multiplier: 1.15,
    require_parent_linkage: true,
    allow_self_propose: true,
    mandatory_kras: [],
  },
  bsc_perspectives: ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'],
  cycle_defaults: { type: 'annual', goal_setting_days: 30, review_days: 21 },
};

async function seed() {
  const db = getDb();

  const existing = db.exec('SELECT COUNT(*) FROM organizations');
  if (existing[0].values[0][0] > 0) {
    console.log('Seed data already present — skipping');
    return;
  }

  console.log('Seeding demo data...');

  // ── 1. Organization ──────────────────────────────────────────────────────
  db.run(
    `INSERT INTO organizations (name, industry, framework, cascade_mode, settings, wizard_completed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['TechCorp Demo', 'it', 'hybrid', 'bidirectional', JSON.stringify(ORG_SETTINGS), 1]
  );
  const orgId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];

  // ── 2. Grades ────────────────────────────────────────────────────────────
  const gradeRows = [
    ['L1', 'Junior Developer',   1, 0],
    ['L2', 'Developer',          2, 0],
    ['L3', 'Senior Developer',   3, 0],
    ['L4', 'Engineering Manager',4, 1],
    ['L5', 'VP / Director',      5, 1],
  ];
  const gradeIds = {};
  gradeRows.forEach(([code, label, level, canManage], i) => {
    db.run(
      `INSERT INTO grades (org_id, code, label, level, can_manage, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orgId, code, label, level, canManage, i + 1]
    );
    gradeIds[code] = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
  });

  // ── 3. Departments ───────────────────────────────────────────────────────
  db.run(`INSERT INTO departments (org_id, name, code) VALUES (?, ?, ?)`,
    [orgId, 'Engineering', 'ENG']);
  const deptEng = db.exec('SELECT last_insert_rowid()')[0].values[0][0];

  db.run(`INSERT INTO departments (org_id, name, code) VALUES (?, ?, ?)`,
    [orgId, 'Sales', 'SAL']);
  const deptSales = db.exec('SELECT last_insert_rowid()')[0].values[0][0];

  db.run(`INSERT INTO departments (org_id, name, code) VALUES (?, ?, ?)`,
    [orgId, 'Human Resources', 'HR']);

  // ── 4. Employees ─────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', SALT_ROUNDS);

  function insertEmployee(orgId, empCode, name, email, deptId, gradeCode, reportingTo, role) {
    db.run(
      `INSERT INTO employees
         (org_id, emp_code, name, email, password_hash, dept_id, grade_id, reporting_to, role, joined_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orgId, empCode, name, email, passwordHash, deptId, gradeIds[gradeCode], reportingTo, role, '2023-01-01']
    );
    return db.exec('SELECT last_insert_rowid()')[0].values[0][0];
  }

  //                         code    name                     email                            dept      grade  reports  role
  const ceo   = insertEmployee(orgId,'EMP001','Arjun Mehta',     'arjun.mehta@techcorp.com',    deptEng,  'L5', null,   'admin');
  const vpEng = insertEmployee(orgId,'EMP002','Ramesh Kumar',    'ramesh.kumar@techcorp.com',   deptEng,  'L5', ceo,    'manager');
  const mgr   = insertEmployee(orgId,'EMP003','Priya Sharma',    'priya.sharma@techcorp.com',   deptEng,  'L4', vpEng,  'manager');
  const sr1   = insertEmployee(orgId,'EMP004','Kiran Patel',     'kiran.patel@techcorp.com',    deptEng,  'L3', mgr,    'employee');
  const sr2   = insertEmployee(orgId,'EMP005','Ananya Singh',    'ananya.singh@techcorp.com',   deptEng,  'L3', mgr,    'employee');
  const dev1  = insertEmployee(orgId,'EMP006','Dev Kumar',       'dev.kumar@techcorp.com',      deptEng,  'L2', mgr,    'employee');
  const vpSal = insertEmployee(orgId,'EMP007','Suresh Nair',     'suresh.nair@techcorp.com',    deptSales,'L5', ceo,    'manager');
  const sMgr  = insertEmployee(orgId,'EMP008','Meera Reddy',     'meera.reddy@techcorp.com',    deptSales,'L4', vpSal,  'manager');
  const rep1  = insertEmployee(orgId,'EMP009','Raj Kapoor',      'raj.kapoor@techcorp.com',     deptSales,'L2', sMgr,   'employee');
  const rep2  = insertEmployee(orgId,'EMP010','Kavya Rao',       'kavya.rao@techcorp.com',      deptSales,'L2', sMgr,   'employee');

  // ── 5. Review Cycle ──────────────────────────────────────────────────────
  db.run(
    `INSERT INTO review_cycles
       (org_id, name, cycle_type, period_start, period_end,
        goal_set_open, goal_set_close, review_open, review_close,
        cascade_mode, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orgId, 'FY 2025-26 Annual', 'annual',
      '2025-04-01', '2026-03-31',
      '2025-04-01', '2025-04-30',
      '2026-02-01', '2026-02-28',
      'bidirectional', 'goal_setting', ceo,
    ]
  );

  // ── 6. Performance Library (IT starter items) ────────────────────────────
  const libItems = [
    ['kra',        'Deliver High-Quality Features',   'process',    null,    'higher_better', 0],
    ['kra',        'System Reliability & Uptime',      'process',    '%',     'higher_better', 0],
    ['kpi',        'Sprint Velocity',                  'process',    'points','higher_better', 0],
    ['kpi',        'Bug Escape Rate',                  'process',    '%',     'lower_better',  0],
    ['competency', 'Technical Problem Solving',        'people',     null,    'higher_better', 1],
    ['competency', 'Collaboration & Teamwork',         'people',     null,    'higher_better', 0],
    ['competency', 'Ownership & Accountability',       'people',     null,    'higher_better', 0],
    ['kpi',        'Monthly Revenue',                  'financial',  'INR',   'higher_better', 0],
    ['kpi',        'Customer Satisfaction (CSAT)',     'customer',   'score', 'higher_better', 0],
    ['kpi',        'Pipeline Conversion Rate',         'customer',   '%',     'higher_better', 0],
  ];

  libItems.forEach(([itemType, name, category, unit, measurementType, isMandatory]) => {
    db.run(
      `INSERT INTO performance_library
         (org_id, name, item_type, category, unit, measurement_type, is_mandatory)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orgId, name, itemType, category, unit, measurementType, isMandatory]
    );
  });

  saveDb();
  console.log(`Seed complete — org_id=${orgId}, employees=10, cycle=FY 2025-26 Annual`);
}

module.exports = { seed };
