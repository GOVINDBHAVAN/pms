const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { getDb, saveDb } = require('../db/database');
const requireAuth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'pms-dev-secret-key';
const upload = multer({ storage: multer.memoryStorage() });

const WIZARD_STEPS = [
  'industry', 'framework', 'cascade', 'rating',
  'weightage', 'terminology', 'grades', 'departments', 'employees', 'cycle',
];

// Industry presets (from spec Section 6)
const INDUSTRY_PRESETS = {
  it: {
    name: 'IT / Software',
    framework: 'okr',
    cascade_mode: 'bidirectional',
    active_types: ['okr_objective', 'okr_kr', 'competency'],
    rating_scale_type: 'percentage',
    weightage: { goals_percent: 70, competency_percent: 30 },
    overplan_max_multiplier: 1.20,
    recommended_framework: 'okr',
    grades: [
      { code: 'L1', label: 'Junior Developer',    level: 1, can_manage: 0 },
      { code: 'L2', label: 'Developer',           level: 2, can_manage: 0 },
      { code: 'L3', label: 'Senior Developer',    level: 3, can_manage: 0 },
      { code: 'L4', label: 'Engineering Manager', level: 4, can_manage: 1 },
      { code: 'L5', label: 'VP / Director',       level: 5, can_manage: 1 },
    ],
    starter_library: [
      { type: 'okr_objective', name: 'Deliver high-quality product', category: 'process' },
      { type: 'competency',    name: 'Technical Problem Solving' },
      { type: 'competency',    name: 'Collaboration' },
      { type: 'competency',    name: 'Ownership & Accountability' },
    ],
  },
  manufacturing: {
    name: 'Manufacturing',
    framework: 'kra_kpi',
    cascade_mode: 'top_down',
    active_types: ['kra', 'kpi'],
    rating_scale_type: 'percentage_achievement',
    weightage: { goals_percent: 80, competency_percent: 20 },
    overplan_max_multiplier: 1.10,
    recommended_framework: 'kra_kpi',
    grades: [
      { code: 'W1', label: 'Operator',           level: 1, can_manage: 0 },
      { code: 'W2', label: 'Senior Operator',    level: 2, can_manage: 0 },
      { code: 'S1', label: 'Supervisor',         level: 3, can_manage: 1 },
      { code: 'M1', label: 'Manager',            level: 4, can_manage: 1 },
      { code: 'GM', label: 'General Manager',    level: 5, can_manage: 1 },
    ],
    starter_library: [
      { type: 'kra', name: 'Production Output',    unit: 'units/day' },
      { type: 'kra', name: 'Defect Rate',          unit: 'ppm',       measurement_type: 'lower_better' },
      { type: 'kra', name: 'Safety Compliance',    unit: '%' },
      { type: 'kra', name: 'Machine Uptime',       unit: '%' },
      { type: 'kra', name: 'Waste Reduction',      unit: '%',         measurement_type: 'lower_better' },
    ],
  },
  healthcare: {
    name: 'Healthcare',
    framework: 'hybrid',
    cascade_mode: 'top_down',
    active_types: ['goal', 'competency'],
    rating_scale_type: '5_point',
    weightage: { goals_percent: 50, competency_percent: 50 },
    overplan_max_multiplier: 1.10,
    recommended_framework: 'hybrid',
    grades: [
      { code: 'JN', label: 'Junior Nurse / Technician', level: 1, can_manage: 0 },
      { code: 'SN', label: 'Senior Nurse / Specialist', level: 2, can_manage: 0 },
      { code: 'CH', label: 'Charge Nurse / Supervisor', level: 3, can_manage: 1 },
      { code: 'DR', label: 'Doctor / Consultant',       level: 4, can_manage: 1 },
      { code: 'HM', label: 'Hospital Manager',          level: 5, can_manage: 1 },
    ],
    starter_library: [
      { type: 'competency', name: 'Patient Safety Adherence' },
      { type: 'competency', name: 'Clinical Judgment' },
      { type: 'competency', name: 'Empathy & Communication' },
      { type: 'competency', name: 'Documentation Accuracy' },
      { type: 'goal',       name: 'Patient Satisfaction Score', unit: 'score' },
    ],
  },
  bfsi: {
    name: 'BFSI',
    framework: 'balanced_scorecard',
    cascade_mode: 'top_down',
    active_types: ['bsc_metric', 'kpi', 'competency'],
    rating_scale_type: '5_point',
    weightage: { goals_percent: 70, competency_percent: 30 },
    overplan_max_multiplier: 1.10,
    recommended_framework: 'balanced_scorecard',
    bsc_perspectives: ['Financial', 'Customer', 'Compliance & Risk', 'People & Learning'],
    grades: [
      { code: 'A1', label: 'Analyst',          level: 1, can_manage: 0 },
      { code: 'A2', label: 'Senior Analyst',   level: 2, can_manage: 0 },
      { code: 'M1', label: 'Manager',          level: 3, can_manage: 1 },
      { code: 'SM', label: 'Senior Manager',   level: 4, can_manage: 1 },
      { code: 'VP', label: 'VP / Director',    level: 5, can_manage: 1 },
    ],
    starter_library: [
      { type: 'kpi',        name: 'AUM Growth',          category: 'financial', unit: '%' },
      { type: 'kpi',        name: 'NPA Ratio',           category: 'financial', unit: '%', measurement_type: 'lower_better' },
      { type: 'kpi',        name: 'Compliance Score',    category: 'compliance', unit: 'score' },
      { type: 'competency', name: 'Risk Awareness' },
      { type: 'competency', name: 'Client Relationship Management' },
    ],
  },
  retail: {
    name: 'Retail / Sales',
    framework: 'goals',
    cascade_mode: 'top_down',
    active_types: ['goal', 'kpi'],
    rating_scale_type: 'percentage_of_target',
    weightage: { goals_percent: 80, competency_percent: 20 },
    overplan_max_multiplier: 1.30,
    recommended_framework: 'goals',
    grades: [
      { code: 'SA', label: 'Sales Associate',  level: 1, can_manage: 0 },
      { code: 'SS', label: 'Senior Associate', level: 2, can_manage: 0 },
      { code: 'TL', label: 'Team Leader',      level: 3, can_manage: 1 },
      { code: 'SM', label: 'Store Manager',    level: 4, can_manage: 1 },
      { code: 'RM', label: 'Regional Manager', level: 5, can_manage: 1 },
    ],
    starter_library: [
      { type: 'kpi', name: 'Monthly Revenue',              unit: 'INR' },
      { type: 'kpi', name: 'Conversion Rate',              unit: '%' },
      { type: 'kpi', name: 'Average Transaction Value',    unit: 'INR' },
      { type: 'kpi', name: 'Customer Satisfaction (CSAT)', unit: 'score' },
    ],
  },
  education: {
    name: 'Education',
    framework: 'goals',
    cascade_mode: 'top_down',
    active_types: ['goal', 'competency'],
    rating_scale_type: '5_point',
    weightage: { goals_percent: 60, competency_percent: 40 },
    overplan_max_multiplier: 1.10,
    recommended_framework: 'goals',
    grades: [
      { code: 'T1', label: 'Junior Teacher',   level: 1, can_manage: 0 },
      { code: 'T2', label: 'Teacher',          level: 2, can_manage: 0 },
      { code: 'T3', label: 'Senior Teacher',   level: 3, can_manage: 0 },
      { code: 'HT', label: 'Head of Dept',     level: 4, can_manage: 1 },
      { code: 'PR', label: 'Principal',        level: 5, can_manage: 1 },
    ],
    starter_library: [
      { type: 'goal',       name: 'Student Pass Rate',      unit: '%' },
      { type: 'goal',       name: 'Curriculum Completion',  unit: '%' },
      { type: 'competency', name: 'Pedagogy Effectiveness' },
      { type: 'competency', name: 'Student Engagement' },
    ],
  },
  hospitality: {
    name: 'Hospitality',
    framework: 'kra_kpi',
    cascade_mode: 'bidirectional',
    active_types: ['kra', 'kpi', 'competency'],
    rating_scale_type: '5_point',
    weightage: { goals_percent: 65, competency_percent: 35 },
    overplan_max_multiplier: 1.15,
    recommended_framework: 'kra_kpi',
    grades: [
      { code: 'A1', label: 'Associate',       level: 1, can_manage: 0 },
      { code: 'SR', label: 'Senior Assoc.',  level: 2, can_manage: 0 },
      { code: 'SP', label: 'Supervisor',     level: 3, can_manage: 1 },
      { code: 'MG', label: 'Manager',        level: 4, can_manage: 1 },
      { code: 'GM', label: 'General Manager',level: 5, can_manage: 1 },
    ],
    starter_library: [
      { type: 'kra',        name: 'Guest Satisfaction',                     unit: 'score' },
      { type: 'kra',        name: 'Revenue per Available Room (RevPAR)',    unit: 'INR' },
      { type: 'kra',        name: 'Occupancy Rate',                         unit: '%' },
      { type: 'competency', name: 'Service Excellence' },
    ],
  },
  logistics: {
    name: 'Logistics',
    framework: 'kra_kpi',
    cascade_mode: 'top_down',
    active_types: ['kra', 'kpi'],
    rating_scale_type: 'percentage_achievement',
    weightage: { goals_percent: 80, competency_percent: 20 },
    overplan_max_multiplier: 1.10,
    recommended_framework: 'kra_kpi',
    grades: [
      { code: 'D1', label: 'Driver / Handler',     level: 1, can_manage: 0 },
      { code: 'D2', label: 'Senior Handler',       level: 2, can_manage: 0 },
      { code: 'TL', label: 'Team Leader',          level: 3, can_manage: 1 },
      { code: 'OM', label: 'Operations Manager',   level: 4, can_manage: 1 },
      { code: 'GM', label: 'General Manager',      level: 5, can_manage: 1 },
    ],
    starter_library: [
      { type: 'kra', name: 'On-Time Delivery Rate', unit: '%' },
      { type: 'kra', name: 'Order Accuracy',        unit: '%' },
      { type: 'kra', name: 'Inventory Shrinkage',   unit: '%', measurement_type: 'lower_better' },
      { type: 'kra', name: 'Fleet Utilization',     unit: '%' },
    ],
  },
  ngo: {
    name: 'NGO / Social Sector',
    framework: 'goals',
    cascade_mode: 'bottom_up',
    active_types: ['goal', 'competency'],
    rating_scale_type: '5_point',
    weightage: { goals_percent: 60, competency_percent: 40 },
    overplan_max_multiplier: 1.10,
    recommended_framework: 'goals',
    terminology_overrides: {
      goal: 'Programme Target',
      performance_band: 'Impact Band',
      weight: 'Priority (%)',
    },
    grades: [
      { code: 'PO', label: 'Programme Officer',  level: 1, can_manage: 0 },
      { code: 'SPO', label: 'Sr. Prog. Officer', level: 2, can_manage: 0 },
      { code: 'PM', label: 'Programme Manager',  level: 3, can_manage: 1 },
      { code: 'DM', label: 'Deputy Director',    level: 4, can_manage: 1 },
      { code: 'DR', label: 'Director',           level: 5, can_manage: 1 },
    ],
    starter_library: [
      { type: 'goal',       name: 'Beneficiaries Reached',        unit: 'count' },
      { type: 'goal',       name: 'Programme Budget Utilisation', unit: '%' },
      { type: 'competency', name: 'Community Engagement' },
    ],
  },
  custom: {
    name: 'Custom / Other',
    framework: 'hybrid',
    cascade_mode: 'top_down',
    active_types: ['kra', 'kpi', 'competency'],
    rating_scale_type: '5_point',
    weightage: { goals_percent: 70, competency_percent: 30 },
    overplan_max_multiplier: 1.15,
    recommended_framework: 'hybrid',
    grades: [
      { code: 'L1', label: 'Level 1', level: 1, can_manage: 0 },
      { code: 'L2', label: 'Level 2', level: 2, can_manage: 0 },
      { code: 'L3', label: 'Level 3', level: 3, can_manage: 1 },
      { code: 'L4', label: 'Level 4', level: 4, can_manage: 1 },
      { code: 'L5', label: 'Level 5', level: 5, can_manage: 1 },
    ],
    starter_library: [],
  },
};

function rowsToObjects(result) {
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => Object.fromEntries(cols.map((c, i) => [c, row[i]])));
}

function buildToken(employee) {
  return jwt.sign(
    { id: employee.id, org_id: employee.org_id, role: employee.role, wizard_completed: employee.wizard_completed },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── POST /wizard/start — public, creates org + first admin ─────────────────
router.post('/start', async (req, res) => {
  const { org_name, admin_name, admin_email, admin_password, size, country } = req.body;
  if (!org_name || !admin_name || !admin_email || !admin_password) {
    return res.status(400).json({ error: 'org_name, admin_name, admin_email, admin_password are required' });
  }

  try {
    const db = getDb();

    // Check email not already taken
    const existing = db.exec('SELECT id FROM employees WHERE email = ?', [admin_email]);
    if (existing.length && existing[0].values.length) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const defaultSettings = {
      framework: 'hybrid',
      cascade_mode: 'top_down',
      industry: 'custom',
      terminology: {
        kra: 'Key Result Area', kpi: 'Key Performance Indicator',
        objective: 'Objective', key_result: 'Key Result',
        goal: 'Goal', competency: 'Competency',
        weight: 'Weight (%)', planned: 'Planned Target',
        actual: 'Actual Achievement', stretch: 'Stretch Target',
        performance_band: 'Performance Band',
      },
      active_types: ['kra', 'kpi', 'competency'],
      rating_scale: {
        goals:      { type: '5_point', labels: ['Poor','Below Expectation','Meets Expectation','Exceeds Expectation','Exceptional'], values: [1,2,3,4,5], pip_below: 2 },
        competency: { type: '5_point', labels: ['Unacceptable','Developing','Proficient','Advanced','Expert'], values: [1,2,3,4,5] },
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
        overplan_allowed: true, overplan_max_multiplier: 1.15,
        require_parent_linkage: true, allow_self_propose: true, mandatory_kras: [],
      },
      size: size || '',
      country: country || '',
    };

    // Create org
    db.run(
      `INSERT INTO organizations (name, industry, framework, cascade_mode, settings, wizard_completed)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [org_name, 'custom', 'hybrid', 'top_down', JSON.stringify(defaultSettings)]
    );
    const orgId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];

    // Create wizard_progress rows
    WIZARD_STEPS.forEach(step => {
      db.run(
        `INSERT INTO wizard_progress (org_id, step, data, completed) VALUES (?, ?, ?, 0)`,
        [orgId, step, null]
      );
    });

    // Create admin employee
    const passwordHash = await bcrypt.hash(admin_password, 10);
    db.run(
      `INSERT INTO employees (org_id, emp_code, name, email, password_hash, role, joined_on)
       VALUES (?, 'ADMIN01', ?, ?, ?, 'admin', date('now'))`,
      [orgId, admin_name, admin_email, passwordHash]
    );
    const empId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];

    saveDb();

    const employee = { id: empId, org_id: orgId, role: 'admin', wizard_completed: 0, name: admin_name, email: admin_email, org_name };
    const token = buildToken(employee);

    res.status(201).json({ token, employee, org_id: orgId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /wizard/status — which steps are done ──────────────────────────────
router.get('/status', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `SELECT step, completed, data FROM wizard_progress WHERE org_id = ? ORDER BY rowid`,
      [req.user.org_id]
    );
    const rows = rowsToObjects(result);

    const completed_steps = rows.filter(r => r.completed).map(r => r.step);
    const current_step = WIZARD_STEPS.find(s => !completed_steps.includes(s)) || 'done';

    res.json({ current_step, completed_steps, org_id: req.user.org_id, steps: WIZARD_STEPS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /wizard/step/:stepName — resume data ───────────────────────────────
router.get('/step/:stepName', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.exec(
      `SELECT step, data, completed FROM wizard_progress WHERE org_id = ? AND step = ?`,
      [req.user.org_id, req.params.stepName]
    );
    const rows = rowsToObjects(result);
    if (!rows.length) return res.status(404).json({ error: 'Step not found' });

    const row = rows[0];
    res.json({ step: row.step, completed: row.completed, data: row.data ? JSON.parse(row.data) : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /wizard/step/:stepName — save + apply step ───────────────────────
router.post('/step/:stepName', requireAuth, (req, res) => {
  const { stepName } = req.params;
  const data = req.body;

  if (!WIZARD_STEPS.includes(stepName)) {
    return res.status(400).json({ error: `Unknown step: ${stepName}` });
  }

  try {
    const db = getDb();
    const orgId = req.user.org_id;

    // Fetch current org settings
    const orgResult = db.exec('SELECT settings, industry, framework, cascade_mode FROM organizations WHERE id = ?', [orgId]);
    const orgRows = rowsToObjects(orgResult);
    if (!orgRows.length) return res.status(404).json({ error: 'Organization not found' });

    let settings = {};
    try { settings = JSON.parse(orgRows[0].settings || '{}'); } catch {}

    // Apply step-specific data to org
    switch (stepName) {
      case 'industry': {
        const preset = INDUSTRY_PRESETS[data.industry] || INDUSTRY_PRESETS.custom;
        settings = {
          ...settings,
          industry: data.industry,
          framework: preset.framework,
          cascade_mode: preset.cascade_mode,
          active_types: preset.active_types,
          weightage: preset.weightage,
          overplan_max_multiplier: preset.overplan_max_multiplier,
          ...(preset.bsc_perspectives ? { bsc_perspectives: preset.bsc_perspectives } : {}),
        };
        db.run(
          `UPDATE organizations SET industry = ?, settings = ? WHERE id = ?`,
          [data.industry, JSON.stringify(settings), orgId]
        );
        break;
      }
      case 'framework': {
        settings.framework = data.framework;
        settings.active_types = data.active_types || settings.active_types;
        db.run(
          `UPDATE organizations SET framework = ?, settings = ? WHERE id = ?`,
          [data.framework, JSON.stringify(settings), orgId]
        );
        break;
      }
      case 'cascade': {
        settings.cascade_mode = data.cascade_mode;
        db.run(
          `UPDATE organizations SET cascade_mode = ?, settings = ? WHERE id = ?`,
          [data.cascade_mode, JSON.stringify(settings), orgId]
        );
        break;
      }
      case 'rating': {
        settings.rating_scale = data.rating_scale;
        db.run(`UPDATE organizations SET settings = ? WHERE id = ?`, [JSON.stringify(settings), orgId]);
        break;
      }
      case 'weightage': {
        settings.weightage = data.weightage;
        if (data.target_rules) settings.target_rules = { ...settings.target_rules, ...data.target_rules };
        db.run(`UPDATE organizations SET settings = ? WHERE id = ?`, [JSON.stringify(settings), orgId]);
        break;
      }
      case 'terminology': {
        settings.terminology = { ...settings.terminology, ...data.terminology };
        db.run(`UPDATE organizations SET settings = ? WHERE id = ?`, [JSON.stringify(settings), orgId]);
        break;
      }
      case 'grades': {
        // Delete existing grades for this org, then re-insert
        db.run(`DELETE FROM grades WHERE org_id = ?`, [orgId]);
        (data.grades || []).forEach((g, i) => {
          db.run(
            `INSERT INTO grades (org_id, code, label, level, can_manage, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
            [orgId, g.code, g.label, g.level, g.can_manage ? 1 : 0, i + 1]
          );
        });
        break;
      }
      case 'departments': {
        // Delete existing non-employee departments, re-insert from tree
        db.run(`DELETE FROM departments WHERE org_id = ?`, [orgId]);
        const insertDept = (dept, parentId) => {
          db.run(
            `INSERT INTO departments (org_id, name, code, parent_id) VALUES (?, ?, ?, ?)`,
            [orgId, dept.name, dept.code || null, parentId]
          );
          const deptId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
          (dept.children || []).forEach(child => insertDept(child, deptId));
        };
        (data.departments || []).forEach(d => insertDept(d, null));
        break;
      }
      case 'employees': {
        // Handled by /import-employees; this step just marks completion
        break;
      }
      case 'cycle': {
        // Create the first review cycle
        db.run(
          `INSERT INTO review_cycles
             (org_id, name, cycle_type, period_start, period_end,
              goal_set_open, goal_set_close, review_open, review_close,
              cascade_mode, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
          [
            orgId,
            data.name || `FY ${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(2)} Annual`,
            data.cycle_type || 'annual',
            data.period_start, data.period_end,
            data.goal_set_open || null, data.goal_set_close || null,
            data.review_open || null, data.review_close || null,
            data.cascade_mode || settings.cascade_mode || 'top_down',
            req.user.id,
          ]
        );
        break;
      }
    }

    // Mark step as complete
    db.run(
      `UPDATE wizard_progress SET data = ?, completed = 1, updated_at = datetime('now')
       WHERE org_id = ? AND step = ?`,
      [JSON.stringify(data), orgId, stepName]
    );

    saveDb();
    res.json({ ok: true, step: stepName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /wizard/import-employees — CSV upload ─────────────────────────────
router.post('/import-employees', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const db = getDb();
    const orgId = req.user.org_id;

    const csvText = req.file.buffer.toString('utf8');
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Validate required columns
    const required = ['name', 'email'];
    const firstRow = records[0] || {};
    const missing = required.filter(c => !(c in firstRow));
    if (missing.length) {
      return res.status(400).json({ error: `CSV missing columns: ${missing.join(', ')}` });
    }

    // Fetch org grades and departments for lookup
    const gradesResult = db.exec(`SELECT id, code, label FROM grades WHERE org_id = ?`, [orgId]);
    const gradesMap = {};
    rowsToObjects(gradesResult).forEach(g => {
      gradesMap[g.code.toLowerCase()] = g.id;
      gradesMap[g.label.toLowerCase()] = g.id;
    });

    const deptsResult = db.exec(`SELECT id, name FROM departments WHERE org_id = ?`, [orgId]);
    const deptsMap = {};
    rowsToObjects(deptsResult).forEach(d => { deptsMap[d.name.toLowerCase()] = d.id; });

    const defaultHash = await bcrypt.hash('Welcome@123', 10);
    const errors = [];
    const imported = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      if (!row.name || !row.email) {
        errors.push({ row: rowNum, error: 'name and email are required' });
        continue;
      }

      const emailCheck = db.exec(`SELECT id FROM employees WHERE email = ?`, [row.email]);
      if (emailCheck.length && emailCheck[0].values.length) {
        errors.push({ row: rowNum, error: `Email already exists: ${row.email}` });
        continue;
      }

      const gradeId = row.grade ? (gradesMap[row.grade.toLowerCase()] || null) : null;
      const deptId  = row.department ? (deptsMap[row.department.toLowerCase()] || null) : null;

      imported.push({ name: row.name, email: row.email, gradeId, deptId, emp_code: row.emp_code || null });
    }

    if (errors.length && imported.length === 0) {
      return res.status(400).json({ errors, imported: [] });
    }

    // Insert valid rows
    for (const emp of imported) {
      db.run(
        `INSERT INTO employees (org_id, emp_code, name, email, password_hash, dept_id, grade_id, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'employee')`,
        [orgId, emp.emp_code, emp.name, emp.email, defaultHash, emp.deptId, emp.gradeId]
      );
    }

    // Mark step complete
    db.run(
      `UPDATE wizard_progress SET completed = 1, data = ?, updated_at = datetime('now')
       WHERE org_id = ? AND step = 'employees'`,
      [JSON.stringify({ imported_count: imported.length }), orgId]
    );

    saveDb();
    res.json({ imported: imported.length, errors, total: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /wizard/complete — finalize setup ─────────────────────────────────
router.post('/complete', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const orgId = req.user.org_id;

    db.run(`UPDATE organizations SET wizard_completed = 1 WHERE id = ?`, [orgId]);

    // Mark cycle step as complete if not already (in case it was skipped)
    db.run(
      `UPDATE wizard_progress SET completed = 1, updated_at = datetime('now')
       WHERE org_id = ? AND step = 'cycle' AND completed = 0`,
      [orgId]
    );

    saveDb();

    // Return a refreshed token with wizard_completed = 1
    const newToken = jwt.sign(
      { id: req.user.id, org_id: orgId, role: req.user.role, wizard_completed: 1 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ ok: true, token: newToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /wizard/presets — industry preset data (public) ───────────────────
router.get('/presets', (req, res) => {
  res.json(INDUSTRY_PRESETS);
});

module.exports = router;
module.exports.INDUSTRY_PRESETS = INDUSTRY_PRESETS;
