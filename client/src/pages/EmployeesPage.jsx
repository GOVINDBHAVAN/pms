import { useState, useEffect, useMemo } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useAuthStore } from '../store/authStore';
import { getEmployees, createEmployee, updateEmployee } from '../api/employeesApi';
import { getGrades, getDepartments } from '../api/orgApi';

// ── Grade colour coding ─────────────────────────────────────────────────────
const GRADE_COLORS = {
  L1: 'bg-purple-100 text-purple-800 border border-purple-200',
  L2: 'bg-blue-100 text-blue-800 border border-blue-200',
  L3: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  L4: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
  L5: 'bg-green-100 text-green-800 border border-green-200',
  L6: 'bg-amber-100 text-amber-800 border border-amber-200',
  L7: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  L8: 'bg-slate-100 text-slate-600 border border-slate-200',
  L9: 'bg-slate-50 text-slate-500 border border-slate-100',
};

const ROLE_COLORS = {
  admin:    'bg-red-100 text-red-700',
  hr:       'bg-pink-100 text-pink-700',
  manager:  'bg-blue-100 text-blue-700',
  employee: 'bg-slate-100 text-slate-600',
};

function GradeBadge({ code }) {
  const cls = GRADE_COLORS[code] || 'bg-slate-100 text-slate-600 border border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {code || '—'}
    </span>
  );
}

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[role] || ROLE_COLORS.employee}`}>
      {role}
    </span>
  );
}

// ── Build nested tree from flat list ──────────────────────────────────────────
function buildTree(emps) {
  const map = {};
  const roots = [];
  emps.forEach(e => { map[e.id] = { ...e, children: [] }; });
  emps.forEach(e => {
    if (e.reporting_to && map[e.reporting_to]) {
      map[e.reporting_to].children.push(map[e.id]);
    } else {
      roots.push(map[e.id]);
    }
  });
  function sortNode(n) {
    n.children.sort((a, b) => (a.grade_code || '').localeCompare(b.grade_code || '') || a.name.localeCompare(b.name));
    n.children.forEach(sortNode);
  }
  roots.forEach(sortNode);
  return roots;
}

// ── Org Chart Node ────────────────────────────────────────────────────────────
function OrgNode({ node, depth, onSelect, selectedId }) {
  const [open, setOpen] = useState(depth < 3);
  const hasKids = node.children.length > 0;
  const selected = selectedId === node.id;

  return (
    <div className={depth > 0 ? 'ml-5' : ''}>
      <div
        className={`flex items-start gap-1.5 p-2 rounded-lg cursor-pointer transition-colors group ${
          selected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
        }`}
        onClick={() => onSelect(node)}
      >
        <button
          className="mt-0.5 w-5 h-5 flex-shrink-0 text-slate-400 hover:text-slate-600 text-xs flex items-center justify-center"
          onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
          title={open ? 'Collapse' : 'Expand'}
        >
          {hasKids ? (open ? '▾' : '▸') : <span className="text-slate-200">•</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-slate-900">{node.name}</span>
            <GradeBadge code={node.grade_code} />
            {(node.role === 'admin' || node.role === 'hr') && <RoleBadge role={node.role} />}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {node.dept_name}
            {node.grade_label ? ` · ${node.grade_label}` : ''}
          </div>
          {hasKids && (
            <div className="text-xs text-slate-300 mt-0.5">
              {node.children.length} direct report{node.children.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {open && hasKids && (
        <div className="border-l-2 border-slate-100 ml-5">
          {node.children.map(c => (
            <OrgNode key={c.id} node={c} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Employee Detail Panel ─────────────────────────────────────────────────────
function EmployeeDetail({ emp, allEmps, canEdit, onEdit, onClose }) {
  // Build upward reporting chain
  const chain = useMemo(() => {
    const result = [];
    let cur = emp;
    while (cur) {
      result.unshift(cur);
      cur = allEmps.find(e => e.id === cur.reporting_to) || null;
    }
    return result;
  }, [emp, allEmps]);

  const directReports = useMemo(() =>
    allEmps.filter(e => e.reporting_to === emp.id && e.is_active !== 0),
    [emp, allEmps]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-100 flex-shrink-0">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">{emp.name}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <GradeBadge code={emp.grade_code} />
            <RoleBadge role={emp.role} />
            {emp.is_active === 0 && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Inactive</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none ml-2">×</button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {[
            ['Emp Code', emp.emp_code || '—'],
            ['Department', emp.dept_name || '—'],
            ['Grade', emp.grade_label || emp.grade_code || '—'],
            ['Email', emp.email],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
              <div className="text-sm text-slate-800 mt-0.5 break-all">{val}</div>
            </div>
          ))}
        </div>

        {/* Cascade / Reporting chain */}
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Reporting Chain ↑</div>
          <div className="space-y-1.5">
            {chain.map((e, i) => (
              <div key={e.id} className="flex items-center gap-2" style={{ paddingLeft: `${i * 14}px` }}>
                <span className="text-slate-300 text-xs flex-shrink-0">{i === 0 ? '⬤' : '↳'}</span>
                <span className={`text-sm ${e.id === emp.id ? 'font-semibold text-blue-700' : 'text-slate-600'}`}>
                  {e.name}
                </span>
                <GradeBadge code={e.grade_code} />
              </div>
            ))}
          </div>
        </div>

        {/* Direct reports */}
        {directReports.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Direct Reports ↓ ({directReports.length})
            </div>
            <div className="space-y-1">
              {directReports.map(r => (
                <div key={r.id} className="flex items-center gap-2 py-1.5 px-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{r.name}</div>
                    <div className="text-xs text-slate-400">{r.dept_name}</div>
                  </div>
                  <GradeBadge code={r.grade_code} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cascade role note */}
        <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 leading-relaxed">
          <span className="font-semibold text-slate-500">Cascade note:</span> This employee's targets are linked upward
          through the reporting chain above. Their manager's approved Key Results / KPIs appear as parent context
          when they set their own targets.
        </div>
      </div>

      {/* Footer */}
      {canEdit && (
        <div className="p-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={() => onEdit(emp)}
            className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Employee
          </button>
        </div>
      )}
    </div>
  );
}

// ── Add / Edit Modal ─────────────────────────────────────────────────────────
function EmployeeModal({ emp, grades, departments, allEmps, onSave, onClose }) {
  const isEdit = !!(emp && emp.id);
  const [form, setForm] = useState({
    name:         emp?.name || '',
    email:        emp?.email || '',
    emp_code:     emp?.emp_code || '',
    dept_id:      emp?.dept_id ? String(emp.dept_id) : '',
    grade_id:     emp?.grade_id ? String(emp.grade_id) : '',
    reporting_to: emp?.reporting_to ? String(emp.reporting_to) : '',
    role:         emp?.role || 'employee',
    is_active:    emp?.is_active ?? 1,
    password:     '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const potentialManagers = allEmps.filter(e => e.is_active !== 0 && e.id !== emp?.id);

  async function handleSave() {
    if (!form.name.trim())  return setError('Name is required.');
    if (!form.email.trim()) return setError('Email is required.');
    setSaving(true);
    setError('');
    try {
      const payload = {
        name:         form.name.trim(),
        email:        form.email.trim(),
        emp_code:     form.emp_code.trim() || null,
        dept_id:      form.dept_id ? Number(form.dept_id) : null,
        grade_id:     form.grade_id ? Number(form.grade_id) : null,
        reporting_to: form.reporting_to ? Number(form.reporting_to) : null,
        role:         form.role,
        ...(isEdit
          ? { is_active: form.is_active }
          : { password: form.password.trim() || 'Welcome@123' }
        ),
      };
      if (isEdit) {
        await updateEmployee(emp.id, payload);
      } else {
        await createEmployee(payload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="font-semibold text-slate-900">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Field label="Full Name" required>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Arjun Mehta"
              className={INPUT}
            />
          </Field>

          <Field label="Email Address" required>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="email@company.com"
              className={INPUT}
            />
          </Field>

          <Field label="Employee Code">
            <input
              type="text"
              value={form.emp_code}
              onChange={e => set('emp_code', e.target.value)}
              placeholder="e.g. IT-001"
              className={INPUT}
            />
          </Field>

          <Field label="Department">
            <select value={form.dept_id} onChange={e => set('dept_id', e.target.value)} className={INPUT}>
              <option value="">— Select Department —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>

          <Field label="Grade / Level">
            <select value={form.grade_id} onChange={e => set('grade_id', e.target.value)} className={INPUT}>
              <option value="">— Select Grade —</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.code} – {g.label}</option>)}
            </select>
          </Field>

          <Field label="Reports To (Manager)">
            <select value={form.reporting_to} onChange={e => set('reporting_to', e.target.value)} className={INPUT}>
              <option value="">— No Manager (Root / L1) —</option>
              {potentialManagers
                .sort((a, b) => (a.grade_code || '').localeCompare(b.grade_code || '') || a.name.localeCompare(b.name))
                .map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.grade_code} · {m.dept_name})
                  </option>
                ))}
            </select>
          </Field>

          <Field label="System Role">
            <select value={form.role} onChange={e => set('role', e.target.value)} className={INPUT}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>
          </Field>

          {!isEdit && (
            <Field label="Initial Password">
              <input
                type="text"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Default: Welcome@123"
                className={INPUT}
              />
            </Field>
          )}

          {isEdit && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active_chk"
                checked={form.is_active !== 0}
                onChange={e => set('is_active', e.target.checked ? 1 : 0)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active_chk" className="text-sm text-slate-700">Active Employee</label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Employee')}
          </button>
        </div>
      </div>
    </div>
  );
}

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const { employee: me } = useAuthStore();
  const [emps, setEmps]   = useState([]);
  const [grades, setGrades] = useState([]);
  const [depts, setDepts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState('list');    // 'list' | 'orgchart'
  const [search, setSearch]   = useState('');
  const [fDept, setFDept]     = useState('');
  const [fGrade, setFGrade]   = useState('');
  const [fRole, setFRole]     = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp]     = useState(null);

  const canEdit = me?.role === 'admin' || me?.role === 'hr';

  async function load() {
    setLoading(true);
    try {
      const [empRes, gradeRes, deptRes] = await Promise.all([
        getEmployees({ limit: 500 }),
        getGrades(),
        getDepartments(),
      ]);
      setEmps(empRes.data || []);
      setGrades(gradeRes || []);
      setDepts(deptRes || []);
    } catch (e) {
      console.error('Load failed', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Stats
  const stats = useMemo(() => {
    const active = emps.filter(e => e.is_active !== 0);
    const mgrIds = new Set(active.map(e => e.reporting_to).filter(Boolean));
    return {
      total:   active.length,
      mgrs:    active.filter(e => mgrIds.has(e.id)).length,
      depts:   new Set(active.map(e => e.dept_id).filter(Boolean)).size,
      levels:  new Set(active.map(e => e.grade_code).filter(Boolean)).size,
    };
  }, [emps]);

  // Filtered list
  const filtered = useMemo(() => {
    const showInactive = fRole === 'inactive';
    return emps.filter(e => {
      if (showInactive) return e.is_active === 0;
      if (e.is_active === 0) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!e.name.toLowerCase().includes(s) &&
            !e.email.toLowerCase().includes(s) &&
            !(e.emp_code || '').toLowerCase().includes(s)) return false;
      }
      if (fDept && String(e.dept_id) !== String(fDept)) return false;
      if (fGrade && e.grade_code !== fGrade) return false;
      if (fRole && fRole !== 'inactive' && e.role !== fRole) return false;
      return true;
    });
  }, [emps, search, fDept, fGrade, fRole]);

  // Org tree (active only)
  const orgTree = useMemo(() => buildTree(emps.filter(e => e.is_active !== 0)), [emps]);

  function openEdit(emp) { setEditEmp(emp); setShowModal(true); }
  function openAdd()     { setEditEmp(null); setShowModal(true); }

  async function handleSave() {
    await load();
    setShowModal(false);
    setEditEmp(null);
  }

  function selectEmp(emp) {
    setSelected(prev => (prev?.id === emp.id ? null : emp));
  }

  const clearFilters = () => { setSearch(''); setFDept(''); setFGrade(''); setFRole(''); };
  const hasFilters   = search || fDept || fGrade || fRole;

  return (
    <AppLayout>
      <div className="space-y-4">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Manage org structure, reporting hierarchy, and cascade chain
            </p>
          </div>
          {canEdit && (
            <button
              onClick={openAdd}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Employee
            </button>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Active Employees', value: stats.total, icon: '👥' },
            { label: 'Managers',          value: stats.mgrs,  icon: '🏢' },
            { label: 'Departments',       value: stats.depts, icon: '🗂️' },
            { label: 'Grade Levels',      value: stats.levels, icon: '📊' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {loading ? <span className="text-slate-300">—</span> : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Cascade legend */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
          <strong>How OKR cascade works here:</strong> The CEO (L1) sets company Objectives → L2 VPs set Key Results
          linked to those Objectives → L3 Managers link their KRs to L2 KRs, and so on down to L9. The{' '}
          <span className="font-semibold">Reporting Chain</span> in each employee panel shows exactly which parent
          KRs cascade to them. Stretch targets (over-plan) and under-plan are both tracked at each level.
        </div>

        {/* View tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {[['list', 'List View'], ['orgchart', 'Org Chart']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                view === v
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading…</div>
        ) : (
          <div className="flex gap-4 items-start">

            {/* ── Main panel ── */}
            <div className="flex-1 min-w-0">

              {view === 'list' ? (
                /* LIST VIEW */
                <div className="bg-white rounded-xl border border-slate-200">
                  {/* Filter bar */}
                  <div className="flex flex-wrap items-center gap-2 p-4 border-b border-slate-100">
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search name, email, code…"
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select value={fDept} onChange={e => setFDept(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All Departments</option>
                      {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select value={fGrade} onChange={e => setFGrade(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All Grades</option>
                      {grades.map(g => <option key={g.id} value={g.code}>{g.code} – {g.label}</option>)}
                    </select>
                    <select value={fRole} onChange={e => setFRole(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="hr">HR</option>
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    {hasFilters && (
                      <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800">
                        Clear
                      </button>
                    )}
                    <span className="ml-auto text-xs text-slate-400">{filtered.length} shown</span>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left">
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Manager</th>
                          <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                              No employees match the current filters.
                            </td>
                          </tr>
                        ) : filtered.map(e => (
                          <tr
                            key={e.id}
                            onClick={() => selectEmp(e)}
                            className={`border-b border-slate-50 cursor-pointer transition-colors ${
                              selected?.id === e.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">{e.emp_code || '—'}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{e.name}</div>
                              <div className="text-xs text-slate-400">{e.email}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-sm">{e.dept_name || '—'}</td>
                            <td className="px-4 py-3"><GradeBadge code={e.grade_code} /></td>
                            <td className="px-4 py-3 text-slate-600 text-sm">{e.manager_name || <span className="text-slate-300 italic text-xs">No manager</span>}</td>
                            <td className="px-4 py-3"><RoleBadge role={e.role} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* ORG CHART VIEW */
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  {/* Grade legend */}
                  <div className="flex items-center gap-2 flex-wrap mb-4 pb-3 border-b border-slate-100">
                    {grades.filter(g => emps.some(e => e.grade_code === g.code)).map(g => (
                      <span key={g.code} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${GRADE_COLORS[g.code] || 'bg-slate-100 text-slate-500'}`}>
                        {g.code} <span className="opacity-60">· {g.label}</span>
                      </span>
                    ))}
                  </div>

                  {orgTree.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 text-sm">
                      No hierarchy data. Add employees with manager assignments to see the org chart.
                    </div>
                  ) : orgTree.map(root => (
                    <OrgNode
                      key={root.id}
                      node={root}
                      depth={0}
                      onSelect={selectEmp}
                      selectedId={selected?.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Detail Panel ── */}
            {selected && (
              <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden"
                   style={{ maxHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
                <EmployeeDetail
                  emp={selected}
                  allEmps={emps}
                  canEdit={canEdit}
                  onEdit={openEdit}
                  onClose={() => setSelected(null)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <EmployeeModal
          emp={editEmp}
          grades={grades}
          departments={depts}
          allEmps={emps}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditEmp(null); }}
        />
      )}
    </AppLayout>
  );
}
