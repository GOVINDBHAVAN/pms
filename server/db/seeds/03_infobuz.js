/**
 * 03_infobuz.js — InfoBuz Technologies demo org seed
 *
 * Scenario: Indian IT company, hybrid OKR + KRA-KPI framework, bidirectional cascade.
 * Annual target FY2025-26: ₹200 Cr ARR.
 *
 * SALES HIERARCHY (salary-based MRR cascade demo):
 *
 *   L1  CEO (Rahul Mehta)
 *   L2  VP Sales — Vikram Joshi           (₹90,000/mo)  ← HOD Sales; team MRR target = sum of all salaries
 *   L3.1 Regional Head North — Amit Sharma (₹70,000/mo) ← reports L2
 *   L3.2 Regional Head South — Priya Patel (₹70,000/mo) ← reports L2
 *   L4.1 Area Mgr — Sanjay Reddy           (₹50,000/mo) ← reports L3.1
 *   L4.2 Area Mgr — Deepak Rao             (₹50,000/mo) ← reports L3.2
 *   L4.3 Area Mgr — Sunita Iyer            (₹50,000/mo) ← reports L3.2 (individual quota; no team)
 *   L5.1 Sr Exec — Rohit Verma             (₹35,000/mo) ← reports L4.1
 *   L5.2 Sr Exec — Kavya Nair              (₹35,000/mo) ← reports L4.1
 *   L5.3 Sr Exec — Arun Kumar              (₹35,000/mo) ← reports L4.2  [L6.7 under-plans → shortfall here]
 *   L5.4 Sr Exec — Neha Singh              (₹35,000/mo) ← reports L4.2
 *   L5.5 Sr Exec — Ravi Joshi              (₹35,000/mo) ← reports L4.2
 *   L5.6 Sr Exec — Pooja Bose              (₹35,000/mo) ← reports L4.2
 *   L6.1  Ankit Joshi    (₹20,000/mo) ← reports L5.1  [OVER-PLANS 25,000 → bubble-up +5K]
 *   L6.2  Maya Sharma    (₹20,000/mo) ← reports L5.1
 *   L6.3  Vikash Kumar   (₹20,000/mo) ← reports L5.1
 *   L6.4  Swati Gupta    (₹20,000/mo) ← reports L5.2
 *   L6.5  Mohit Rao      (₹20,000/mo) ← reports L5.2
 *   L6.6  Divya Pillai   (₹20,000/mo) ← reports L5.2
 *   L6.7  Karan Singh    (₹20,000/mo) ← reports L5.3  [UNDER-PLANS 15,000 → gap cascades up]
 *   L6.8  Preethi Nair   (₹20,000/mo) ← reports L5.3
 *   L6.9  Sujith Kumar   (₹20,000/mo) ← reports L5.3
 *   L6.10 Ritu Verma     (₹20,000/mo) ← reports L5.4
 *   L6.11 Akash Mehta    (₹20,000/mo) ← reports L5.4
 *   L6.12 Sneha Rao      (₹20,000/mo) ← reports L5.4
 *   L6.13 Rahul Patel    (₹20,000/mo) ← reports L5.5
 *   L6.14 Ankita Dubey   (₹20,000/mo) ← reports L5.5
 *   L6.15 Vishal Kumar   (₹20,000/mo) ← reports L5.5
 *   L6.16 Meena Gupta    (₹20,000/mo) ← reports L5.6
 *   L6.17 Sachin Nair    (₹20,000/mo) ← reports L5.6
 *   L6.18 Tanvi Pillai   (₹20,000/mo) ← reports L5.6
 *
 * SALARY-BASED MRR TARGET ROLLUP:
 *   L6 individual target   = 20,000 (own salary)
 *   L5 team target         = 35,000 (own) + 3×20,000 = 95,000
 *   L4.1 team target       = 50,000 + L5.1 + L5.2 = 50,000 + 95,000 + 95,000 = 240,000
 *   L4.2 team target       = 50,000 + L5.3+L5.4+L5.5+L5.6 = 50,000 + 4×95,000 = 430,000
 *   L4.3 individual        = 50,000
 *   L3.1 team target       = 70,000 + L4.1 = 70,000 + 240,000 = 310,000
 *   L3.2 team target       = 70,000 + L4.2 + L4.3 = 70,000 + 430,000 + 50,000 = 550,000
 *   L2   HOD target        = 90,000 + L3.1 + L3.2 = 90,000 + 310,000 + 550,000 = 950,000
 *   Company planned MRR    = 1,200,000 (ambitious target, 1.26× salary pool)
 *
 * BIDIRECTIONAL CASCADE SHOWCASE (FY 2025-26):
 *   L6.1 proposes 25,000 MRR (over-plan: +5,000 vs 20,000 salary-based allocation)
 *     → L5.1 team total = 65,000 (vs 60,000 from L6 side) → L5.1 own burden reduces by 5K
 *     → Gap bubbles up: L4.1 team over by 5K, L3.1 over by 5K, L2 over by 5K
 *   L6.7 proposes 15,000 MRR (under-plan: −5,000 vs 20,000)
 *     → L5.3 team total = 55,000 (vs 60,000) → L5.3 must self-increase by 5K to cover
 *     → Gap propagates: L4.2 short by 5K, L3.2 short by 5K, L2 short by 5K (net: flat because L6.1 covers)
 */

const bcrypt = require('bcrypt');
const { getDb, saveDb } = require('../database');

const SALT_ROUNDS = 10;

function lastId(db) {
  return db.exec('SELECT last_insert_rowid()')[0].values[0][0];
}
function orgExists(db, name) {
  const r = db.exec('SELECT COUNT(*) FROM organizations WHERE name = ?', [name]);
  return r[0].values[0][0] > 0;
}

const INFOBUZ_SETTINGS = {
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
  primary_type: 'hybrid',
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
    overplan_allowed: true, overplan_max_multiplier: 1.30,
    require_parent_linkage: true, allow_self_propose: true, mandatory_kras: [],
  },
  bsc_perspectives: ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'],
  cycle_defaults: { type: 'annual', goal_setting_days: 45, review_days: 30 },
};

async function seedInfoBuz(db, passwordHash) {
  if (orgExists(db, 'InfoBuz Technologies')) {
    console.log('InfoBuz Technologies already exists — skipping');
    return;
  }

  console.log('Seeding InfoBuz Technologies — hybrid OKR+KRA-KPI, bidirectional cascade, 41 employees...');
  db.run(
    `INSERT INTO organizations (name, industry, framework, cascade_mode, settings, wizard_completed, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['InfoBuz Technologies', 'it', 'hybrid', 'bidirectional', JSON.stringify(INFOBUZ_SETTINGS), 1, 1]
  );
  const orgId = lastId(db);

  // ── Grades ───────────────────────────────────────────────────────────────
  const grades = {};
  [
    ['L1', 'CEO / Managing Director',          9, 1],
    ['L2', 'Vice President / HOD',             8, 1],
    ['L3', 'Regional Head / Director',         7, 1],
    ['L4', 'Area Manager / Lead',              6, 1],
    ['L5', 'Senior Executive / Engineer',      5, 1],
    ['L6', 'Executive / Associate',            3, 0],
  ].forEach(([code, label, level, canManage], i) => {
    db.run(`INSERT INTO grades (org_id,code,label,level,can_manage,sort_order) VALUES (?,?,?,?,?,?)`,
      [orgId, code, label, level, canManage, i + 1]);
    grades[code] = lastId(db);
  });

  // ── Departments ──────────────────────────────────────────────────────────
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId, 'Sales & Revenue',        'SAL']);
  const dSal = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId, 'Product & Engineering',  'ENG']);
  const dEng = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId, 'Customer Operations',    'CX']);
  const dCX = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId, 'People & Administration','PEO']);
  const dPeo = lastId(db);

  function emp(code, name, email, deptId, grade, reportsTo, role) {
    db.run(
      `INSERT INTO employees (org_id,emp_code,name,email,password_hash,dept_id,grade_id,reporting_to,role,joined_on)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [orgId, code, name, email, passwordHash, deptId, grades[grade], reportsTo, role, '2021-04-01']
    );
    return lastId(db);
  }

  // ── L1: CEO ──────────────────────────────────────────────────────────────
  const CEO = emp('IB-001', 'Rahul Mehta',    'rahul.mehta@infobuz.in',     dEng, 'L1', null, 'admin');

  // ── L2: VPs ──────────────────────────────────────────────────────────────
  // Sales HOD — the entire MRR cascade starts here
  const l2Sal  = emp('IB-S01', 'Vikram Joshi',   'vikram.joshi@infobuz.in',    dSal, 'L2', CEO, 'manager');
  const l2Prod = emp('IB-P01', 'Karthik Menon',  'karthik.menon@infobuz.in',   dEng, 'L2', CEO, 'manager');
  const l2CX   = emp('IB-CX1', 'Divya Subramaniam', 'divya.s@infobuz.in',      dCX,  'L2', CEO, 'manager');

  // ── L3: Sales Regional Heads ──────────────────────────────────────────────
  const l3n = emp('IB-S02', 'Amit Sharma',   'amit.sharma@infobuz.in',   dSal, 'L3', l2Sal, 'manager'); // North
  const l3s = emp('IB-S03', 'Priya Patel',   'priya.patel@infobuz.in',   dSal, 'L3', l2Sal, 'manager'); // South

  // ── L3: Product & CX Heads ───────────────────────────────────────────────
  const l3Eng = emp('IB-P02', 'Sneha Krishnan', 'sneha.krishnan@infobuz.in', dEng, 'L3', l2Prod, 'manager');
  const l3CX  = emp('IB-CX2', 'Ganesh Iyer',   'ganesh.iyer@infobuz.in',   dCX,  'L3', l2CX,   'manager');
  /*const l3HR = */ emp('IB-HR1', 'Pooja Mehta',   'pooja.mehta@infobuz.in',   dPeo, 'L3', CEO,    'manager');

  // ── L4: Area Managers ────────────────────────────────────────────────────
  // L4.1 reports L3.1 (North); has L5.1 + L5.2 under him → team target 240,000
  const l41 = emp('IB-S04', 'Sanjay Reddy',  'sanjay.reddy@infobuz.in',  dSal, 'L4', l3n, 'manager');
  // L4.2 reports L3.2 (South); has L5.3–L5.6 → team target 430,000
  const l42 = emp('IB-S05', 'Deepak Rao',    'deepak.rao@infobuz.in',    dSal, 'L4', l3s, 'manager');
  // L4.3 reports L3.2 (South); individual quota only (no L5/L6) → 50,000
  const l43 = emp('IB-S06', 'Sunita Iyer',   'sunita.iyer@infobuz.in',   dSal, 'L4', l3s, 'employee');

  // L4 Engineering & CX
  const l4Eng = emp('IB-P03', 'Manish Verma',  'manish.verma@infobuz.in',  dEng, 'L4', l3Eng, 'manager');
  const l4CX  = emp('IB-CX3', 'Ritika Gupta',  'ritika.gupta@infobuz.in',  dCX,  'L4', l3CX,  'manager');

  // ── L5: Senior Sales Executives ───────────────────────────────────────────
  // Under L4.1 (North team)
  const l51 = emp('IB-S07', 'Rohit Verma',  'rohit.verma@infobuz.in',  dSal, 'L5', l41, 'manager'); // → L6.1,2,3
  const l52 = emp('IB-S08', 'Kavya Nair',   'kavya.nair@infobuz.in',   dSal, 'L5', l41, 'manager'); // → L6.4,5,6
  // Under L4.2 (South team)
  const l53 = emp('IB-S09', 'Arun Kumar',   'arun.kumar@infobuz.in',   dSal, 'L5', l42, 'manager'); // → L6.7,8,9 ← L6.7 under-plans
  const l54 = emp('IB-S10', 'Neha Singh',   'neha.singh@infobuz.in',   dSal, 'L5', l42, 'manager'); // → L6.10,11,12
  const l55 = emp('IB-S11', 'Ravi Joshi',   'ravi.joshi@infobuz.in',   dSal, 'L5', l42, 'manager'); // → L6.13,14,15
  const l56 = emp('IB-S12', 'Pooja Bose',   'pooja.bose@infobuz.in',   dSal, 'L5', l42, 'manager'); // → L6.16,17,18

  // L5 Engineering
  emp('IB-P04', 'Zubair Ahmed',   'zubair.ahmed@infobuz.in',   dEng, 'L5', l4Eng, 'employee');
  emp('IB-P05', 'Ankita Rao',     'ankita.rao@infobuz.in',     dEng, 'L5', l4Eng, 'employee');
  emp('IB-CX4', 'Rishab Pillai',  'rishab.pillai@infobuz.in',  dCX,  'L5', l4CX,  'employee');

  // ── L6: Sales Executives (18 people, 20,000/month each) ──────────────────
  // Under L5.1 (Rohit Verma): L6.1, L6.2, L6.3
  const l61 = emp('IB-S13', 'Ankit Joshi',   'ankit.joshi@infobuz.in',   dSal, 'L6', l51, 'employee'); // OVER-PLANS 25K
  emp('IB-S14', 'Maya Sharma',    'maya.sharma@infobuz.in',    dSal, 'L6', l51, 'employee');
  emp('IB-S15', 'Vikash Kumar',   'vikash.kumar@infobuz.in',   dSal, 'L6', l51, 'employee');

  // Under L5.2 (Kavya Nair): L6.4, L6.5, L6.6
  emp('IB-S16', 'Swati Gupta',    'swati.gupta@infobuz.in',    dSal, 'L6', l52, 'employee');
  emp('IB-S17', 'Mohit Rao',      'mohit.rao@infobuz.in',      dSal, 'L6', l52, 'employee');
  emp('IB-S18', 'Divya Pillai',   'divya.pillai@infobuz.in',   dSal, 'L6', l52, 'employee');

  // Under L5.3 (Arun Kumar): L6.7, L6.8, L6.9
  const l67 = emp('IB-S19', 'Karan Singh',   'karan.singh@infobuz.in',   dSal, 'L6', l53, 'employee'); // UNDER-PLANS 15K
  emp('IB-S20', 'Preethi Nair',   'preethi.nair@infobuz.in',   dSal, 'L6', l53, 'employee');
  emp('IB-S21', 'Sujith Kumar',   'sujith.kumar@infobuz.in',   dSal, 'L6', l53, 'employee');

  // Under L5.4 (Neha Singh): L6.10, L6.11, L6.12
  emp('IB-S22', 'Ritu Verma',     'ritu.verma@infobuz.in',     dSal, 'L6', l54, 'employee');
  emp('IB-S23', 'Akash Mehta',    'akash.mehta@infobuz.in',    dSal, 'L6', l54, 'employee');
  emp('IB-S24', 'Sneha Rao',      'sneha.rao@infobuz.in',      dSal, 'L6', l54, 'employee');

  // Under L5.5 (Ravi Joshi): L6.13, L6.14, L6.15
  emp('IB-S25', 'Rahul Patel',    'rahul.patel@infobuz.in',    dSal, 'L6', l55, 'employee');
  emp('IB-S26', 'Ankita Dubey',   'ankita.dubey@infobuz.in',   dSal, 'L6', l55, 'employee');
  emp('IB-S27', 'Vishal Kumar',   'vishal.kumar@infobuz.in',   dSal, 'L6', l55, 'employee');

  // Under L5.6 (Pooja Bose): L6.16, L6.17, L6.18
  emp('IB-S28', 'Meena Gupta',    'meena.gupta@infobuz.in',    dSal, 'L6', l56, 'employee');
  emp('IB-S29', 'Sachin Nair',    'sachin.nair@infobuz.in',    dSal, 'L6', l56, 'employee');
  emp('IB-S30', 'Tanvi Pillai',   'tanvi.pillai@infobuz.in',   dSal, 'L6', l56, 'employee');

  // ── Review Cycle (FY 2025-26, goal_setting) ──────────────────────────────
  db.run(
    `INSERT INTO review_cycles
       (org_id,name,cycle_type,period_start,period_end,goal_set_open,goal_set_close,review_open,review_close,cascade_mode,status,created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [orgId, 'FY 2025-26 Annual', 'annual',
     '2025-04-01', '2026-03-31',
     '2025-04-01', '2025-05-31',
     '2026-02-01', '2026-03-15',
     'bidirectional', 'goal_setting', CEO]
  );

  // ── Performance Library ───────────────────────────────────────────────────
  [
    // Company OKR items
    ['okr_objective', "Scale InfoBuz to ₹200 Cr ARR — India's #1 B2B SaaS Platform",  'financial', null,       'higher_better', 0],
    ['okr_objective', 'Deliver Zero-Defect Product with 30+ Feature Releases Annually',    'process',   null,       'higher_better', 0],
    ['okr_objective', 'Achieve NPS 85+ and Zero Churn in Top 50 Accounts',                'customer',  null,       'higher_better', 0],
    ['okr_objective', 'Build a Culture of High-Performance and Low Attrition',             'people',    null,       'higher_better', 0],
    ['okr_kr',  'Annual Recurring Revenue (ARR)',     'financial', 'INR Cr',  'higher_better', 0],
    ['okr_kr',  'New Customer Logos',                'financial', 'count',   'higher_better', 0],
    ['okr_kr',  'Customer NPS',                      'customer',  'score',   'higher_better', 0],
    ['okr_kr',  'Platform Uptime',                   'process',   '%',       'higher_better', 0],
    ['okr_kr',  'Employee eNPS',                     'people',    'score',   'higher_better', 0],
    ['okr_kr',  'Annual Attrition Rate',             'people',    '%',       'lower_better',  0],
    // Continuing KRAs (same every year, only targets change)
    ['kra',  'Revenue Growth',                    'financial', null,       'higher_better', 0],
    ['kra',  'New Business Acquisition',          'financial', null,       'higher_better', 0],
    ['kra',  'Product Quality & Reliability',     'process',   null,       'higher_better', 0],
    ['kra',  'Customer Satisfaction & Retention', 'customer',  null,       'higher_better', 0],
    ['kra',  'Team Performance & Development',    'people',    null,       'higher_better', 0],
    // Continuing KPIs
    ['kpi',  'Monthly Recurring Revenue (MRR)',   'financial', 'INR',      'higher_better', 0],
    ['kpi',  'Monthly New Business MRR',          'financial', 'INR',      'higher_better', 0],
    ['kpi',  'Sales Win Rate',                    'financial', '%',        'higher_better', 0],
    ['kpi',  'Average Deal Size',                 'financial', 'INR',      'higher_better', 0],
    ['kpi',  'Sales Cycle Duration',              'financial', 'days',     'lower_better',  0],
    ['kpi',  'Pipeline Coverage Ratio',           'financial', 'x',        'higher_better', 0],
    ['kpi',  'Bug Escape Rate',                   'process',   '%',        'lower_better',  0],
    ['kpi',  'Sprint Velocity',                   'process',   'points',   'higher_better', 0],
    ['kpi',  'Ticket Resolution Time',            'customer',  'hours',    'lower_better',  0],
    ['kpi',  'CSAT Score',                        'customer',  'score',    'higher_better', 0],
    ['kpi',  'Churn Rate',                        'customer',  '%',        'lower_better',  0],
    // Competencies
    ['competency', 'Strategic Thinking',          'people', null, 'higher_better', 0],
    ['competency', 'Customer Focus',              'people', null, 'higher_better', 0],
    ['competency', 'Sales Execution',             'people', null, 'higher_better', 0],
    ['competency', 'Leadership & Coaching',       'people', null, 'higher_better', 0],
    ['competency', 'Ownership & Accountability',  'people', null, 'higher_better', 0],
    ['competency', 'Technical Aptitude',          'people', null, 'higher_better', 0],
    ['competency', 'Collaboration & Teamwork',    'people', null, 'higher_better', 0],
    ['competency', 'Communication & Influence',   'people', null, 'higher_better', 0],
    ['competency', 'Adaptability & Learning',     'people', null, 'higher_better', 0],
  ].forEach(([itemType, name, category, unit, measurementType, isMandatory]) => {
    db.run(
      `INSERT INTO performance_library (org_id,name,item_type,category,unit,measurement_type,is_mandatory) VALUES (?,?,?,?,?,?,?)`,
      [orgId, name, itemType, category, unit, measurementType, isMandatory]
    );
  });

  console.log(`InfoBuz Technologies seeded — org_id=${orgId}, 41 employees (30 sales L2-L6 + product + cx + hr)`);
}

async function seed() {
  const db = getDb();
  const passwordHash = await bcrypt.hash('password123', SALT_ROUNDS);
  await seedInfoBuz(db, passwordHash);
  saveDb();
  console.log('InfoBuz seed complete');
}

module.exports = { seed };
