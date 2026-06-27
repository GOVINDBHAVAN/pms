import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { importEmployees } from '../../api/wizardApi';
import WizardNav from './WizardNav';

const EMPTY_ROW = () => ({ name: '', email: '', emp_code: '', grade: '', department: '', manager_email: '' });

export default function StepEmployees({ initialData, onNext, onBack, saving }) {
  const [mode, setMode] = useState('manual'); // 'manual' | 'csv'
  const [rows, setRows]           = useState([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);
  const [csvResult, setCsvResult] = useState(null);  // { imported, errors }
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef();

  function updateRow(i, field, value) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }
  function addRow() { setRows(prev => [...prev, EMPTY_ROW()]); }
  function removeRow(i) { setRows(prev => prev.filter((_, idx) => idx !== i)); }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const result = await importEmployees(file);
      setCsvResult(result);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function downloadTemplate() {
    const csv = 'name,email,emp_code,grade,department,manager_email\nJohn Doe,john@company.com,EMP001,L2,Engineering,manager@company.com\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'employee_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleNext() {
    if (mode === 'csv' && csvResult) {
      onNext({ imported_count: csvResult.imported });
    } else {
      // For manual mode, pass the rows — server won't re-insert but marks step done
      const valid = rows.filter(r => r.name.trim() && r.email.trim());
      onNext({ manual_rows: valid });
    }
  }

  const canNext = mode === 'csv'
    ? !!csvResult
    : rows.some(r => r.name.trim() && r.email.trim());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Add Employees</h2>
        <p className="text-slate-500 mt-1">
          The reporting structure you set here drives all target cascading. You can add more employees from Org Settings later.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-slate-100 rounded-lg p-1 w-fit gap-1">
        {['manual', 'csv'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === m ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {m === 'manual' ? 'Manual Entry' : 'CSV Upload'}
          </button>
        ))}
      </div>

      {mode === 'manual' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Name', 'Email', 'Emp Code', 'Grade', 'Department', ''].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, i) => (
                <tr key={i}>
                  {['name','email','emp_code','grade','department'].map(field => (
                    <td key={field} className="px-3 py-1.5">
                      <Input
                        value={row[field]}
                        onChange={e => updateRow(i, field, e.target.value)}
                        placeholder={field === 'email' ? 'email@company.com' : ''}
                        className="h-7 text-xs"
                      />
                    </td>
                  ))}
                  <td className="px-2">
                    <button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-400 text-lg">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={addRow}>+ Add Row</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3">
            <div className="text-4xl">📄</div>
            <div>
              <p className="font-medium text-slate-700">Upload employee CSV file</p>
              <p className="text-sm text-slate-400 mt-1">Required columns: name, email. Optional: emp_code, grade, department</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                Download Template
              </Button>
              <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Choose CSV File'}
              </Button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>

          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {uploadError}
            </div>
          )}

          {csvResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="text-sm font-medium text-slate-700">Upload Result</div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{csvResult.imported}</div>
                  <div className="text-xs text-slate-400">Imported</div>
                </div>
                {csvResult.errors?.length > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{csvResult.errors.length}</div>
                    <div className="text-xs text-slate-400">Errors</div>
                  </div>
                )}
              </div>
              {csvResult.errors?.length > 0 && (
                <div className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                  {csvResult.errors.map((e, i) => (
                    <div key={i}>Row {e.row}: {e.error}</div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400">
                Imported employees will have a temporary password: <code className="bg-slate-100 px-1 rounded">Welcome@123</code>
              </p>
            </div>
          )}
        </div>
      )}

      <WizardNav onBack={onBack} onNext={handleNext} saving={saving} canNext={canNext} />
    </div>
  );
}
