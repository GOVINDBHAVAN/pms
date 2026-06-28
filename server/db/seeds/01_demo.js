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
  active_types: ['kra', 'kpi', 'competency'],
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

async function seedItOrg(db, passwordHash) {
  if (orgExists(db, 'TechCorp Demo')) {
    // Mark existing org as demo if not already
    db.run(`UPDATE organizations SET is_demo = 1 WHERE name = 'TechCorp Demo'`);
    console.log('TechCorp Demo already exists — marked is_demo=1');
    return;
  }

  console.log('Seeding TechCorp Demo (IT)...');
  db.run(
    `INSERT INTO organizations (name, industry, framework, cascade_mode, settings, wizard_completed, is_demo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['TechCorp Demo', 'it', 'hybrid', 'bidirectional', JSON.stringify(IT_SETTINGS), 1, 1]
  );
  const orgId = lastId(db);

  const grades = {};
  [['L1','Director / VP',5,1],['L2','HOD',4,1],['L3','Asst. Manager',3,0],['L4','Senior Executive',2,0],['L5','Executive',1,0]].forEach(([code,label,level,canManage],i) => {
    db.run(`INSERT INTO grades (org_id,code,label,level,can_manage,sort_order) VALUES (?,?,?,?,?,?)`,
      [orgId,code,label,level,canManage,i+1]);
    grades[code] = lastId(db);
  });

  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId,'Engineering','ENG']);
  const dEng = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId,'Sales','SAL']);
  const dSal = lastId(db);
  db.run(`INSERT INTO departments (org_id,name,code) VALUES (?,?,?)`, [orgId,'Human Resources','HR']);

  function emp(code,name,email,deptId,grade,reportsTo,role) {
    db.run(`INSERT INTO employees (org_id,emp_code,name,email,password_hash,dept_id,grade_id,reporting_to,role,joined_on) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [orgId,code,name,email,passwordHash,deptId,grades[grade],reportsTo,role,'2023-01-01']);
    return lastId(db);
  }

  const ceo   = emp('EMP001','Arjun Mehta',    'arjun.mehta@techcorp.com',   dEng,'L1',null,   'admin');
  const vpEng = emp('EMP002','Ramesh Kumar',   'ramesh.kumar@techcorp.com',  dEng,'L1',ceo,    'manager');
  const mgr   = emp('EMP003','Priya Sharma',   'priya.sharma@techcorp.com',  dEng,'L2',vpEng,  'manager');
                emp('EMP004','Kiran Patel',    'kiran.patel@techcorp.com',   dEng,'L3',mgr,    'employee');
                emp('EMP005','Ananya Singh',   'ananya.singh@techcorp.com',  dEng,'L3',mgr,    'employee');
                emp('EMP006','Dev Kumar',      'dev.kumar@techcorp.com',     dEng,'L4',mgr,    'employee');
  const vpSal = emp('EMP007','Suresh Nair',    'suresh.nair@techcorp.com',   dSal,'L1',ceo,    'manager');
  const sMgr  = emp('EMP008','Meera Reddy',    'meera.reddy@techcorp.com',   dSal,'L2',vpSal,  'manager');
                emp('EMP009','Raj Kapoor',     'raj.kapoor@techcorp.com',    dSal,'L4',sMgr,   'employee');
                emp('EMP010','Kavya Rao',      'kavya.rao@techcorp.com',     dSal,'L4',sMgr,   'employee');

  db.run(`INSERT INTO review_cycles (org_id,name,cycle_type,period_start,period_end,goal_set_open,goal_set_close,review_open,review_close,cascade_mode,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [orgId,'FY 2025-26 Annual','annual','2025-04-01','2026-03-31','2025-04-01','2025-04-30','2026-02-01','2026-02-28','bidirectional','goal_setting',ceo]);

  [
    ['kra','Deliver High-Quality Features','process',null,'higher_better',0],
    ['kra','System Reliability & Uptime','process','%','higher_better',0],
    ['kpi','Sprint Velocity','process','points','higher_better',0],
    ['kpi','Bug Escape Rate','process','%','lower_better',0],
    ['competency','Technical Problem Solving','people',null,'higher_better',1],
    ['competency','Collaboration & Teamwork','people',null,'higher_better',0],
    ['competency','Ownership & Accountability','people',null,'higher_better',0],
    ['kpi','Monthly Revenue','financial','INR','higher_better',0],
    ['kpi','Customer Satisfaction (CSAT)','customer','score','higher_better',0],
  ].forEach(([itemType,name,category,unit,measurementType,isMandatory]) => {
    db.run(`INSERT INTO performance_library (org_id,name,item_type,category,unit,measurement_type,is_mandatory) VALUES (?,?,?,?,?,?,?)`,
      [orgId,name,itemType,category,unit,measurementType,isMandatory]);
  });

  console.log(`TechCorp Demo seeded — org_id=${orgId}, 10 employees`);
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
