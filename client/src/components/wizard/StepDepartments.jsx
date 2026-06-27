import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import WizardNav from './WizardNav';

let nextTempId = 1;
function newDept(name = '') {
  return { _id: nextTempId++, name, code: '', children: [] };
}

export default function StepDepartments({ initialData, allData, onNext, onBack, saving }) {
  const orgName = allData?.company_info?.org_name || 'Company';

  const [depts, setDepts] = useState(() => {
    if (initialData?.departments?.length) return initialData.departments;
    return [newDept('Head Office')];
  });

  function addChild(parentIdx, parentPath = null) {
    const newNode = newDept('');
    if (parentPath === null) {
      setDepts(prev => [...prev, newNode]);
    } else {
      setDepts(prev => {
        const updated = JSON.parse(JSON.stringify(prev));
        const parent = getNode(updated, parentPath);
        if (parent) parent.children.push(newNode);
        return updated;
      });
    }
  }

  function getNode(tree, path) {
    let node = { children: tree };
    for (const idx of path) {
      node = node.children[idx];
      if (!node) return null;
    }
    return node;
  }

  function updateNode(path, field, value) {
    setDepts(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (path.length === 0) return updated;
      const node = getNode(updated, path);
      if (node) node[field] = value;
      return updated;
    });
  }

  function removeNode(path) {
    if (path.length === 0) return;
    setDepts(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const parentPath = path.slice(0, -1);
      const idx = path[path.length - 1];
      if (parentPath.length === 0) {
        updated.splice(idx, 1);
      } else {
        const parent = getNode(updated, parentPath);
        if (parent) parent.children.splice(idx, 1);
      }
      return updated;
    });
  }

  function stripTree(nodes) {
    return nodes.map(n => ({
      name: n.name,
      code: n.code || undefined,
      children: n.children?.length ? stripTree(n.children) : [],
    }));
  }

  function handleNext() {
    const valid = depts.filter(d => d.name.trim());
    onNext({ departments: stripTree(valid) });
  }

  function DeptNode({ node, path, depth = 0 }) {
    return (
      <div className={`${depth > 0 ? 'ml-6 border-l border-slate-200 pl-4' : ''} space-y-2`}>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              value={node.name}
              onChange={e => updateNode(path, 'name', e.target.value)}
              placeholder={depth === 0 ? 'Department name' : 'Sub-department name'}
              className="h-8 text-sm"
            />
            <Input
              value={node.code || ''}
              onChange={e => updateNode(path, 'code', e.target.value)}
              placeholder="Code"
              className="h-8 text-sm w-24"
            />
          </div>
          <button
            onClick={() => addChild(null, path)}
            className="text-blue-500 hover:text-blue-700 text-xs font-medium px-2"
            title="Add sub-department"
          >
            + Sub
          </button>
          {path.length > 0 && (
            <button
              onClick={() => removeNode(path)}
              className="text-slate-300 hover:text-red-400 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {(node.children || []).map((child, i) => (
          <DeptNode key={child._id || i} node={child} path={[...path, i]} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Build Your Department Structure</h2>
        <p className="text-slate-500 mt-1">
          Add departments and sub-departments. You can always modify these after setup.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        {/* Company root (read-only label) */}
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 pb-2 border-b border-slate-100">
          <span className="text-slate-400 text-xs">🏢</span> {orgName} (root)
        </div>

        {depts.map((dept, i) => (
          <DeptNode key={dept._id || i} node={dept} path={[i]} />
        ))}

        <Button variant="outline" size="sm" onClick={() => addChild(null, null)} className="mt-2">
          + Add Department
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        Click "+ Sub" to nest sub-departments. Drag reordering will be available from Org Settings after setup.
      </p>

      <WizardNav
        onBack={onBack}
        onNext={handleNext}
        saving={saving}
        canNext={depts.some(d => d.name.trim())}
      />
    </div>
  );
}
