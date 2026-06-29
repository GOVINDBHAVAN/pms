import { useState, useEffect } from 'react';
import { getCheckins, createCheckin } from '../../api/checkinsApi';

const PERIOD_TYPES = [
  { value: 'daily',       label: 'Daily' },
  { value: 'weekly',      label: 'Weekly' },
  { value: 'bi_weekly',   label: 'Bi-Weekly (Fortnightly)' },
  { value: 'monthly',     label: 'Monthly' },
  { value: 'quarterly',   label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual (Half-Yearly)' },
  { value: 'annual',      label: 'Annual' },
];

function suggestPeriodLabel(type) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (type === 'daily') {
    return `${now.getDate()} ${M[month]} ${year}`;
  }
  if (type === 'weekly') {
    const d = new Date(Date.UTC(year, month, now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `Week ${weekNo}, ${year}`;
  }
  if (type === 'bi_weekly') {
    const fortnight = now.getDate() <= 15 ? 1 : 2;
    return `${M[month]} ${year} – Fortnight ${fortnight}`;
  }
  if (type === 'monthly') {
    return `${M[month]} ${year}`;
  }
  if (type === 'quarterly') {
    // Indian FY: Apr=Q1, Jul=Q2, Oct=Q3, Jan=Q4
    const fyMonth = (month - 3 + 12) % 12;
    const q = Math.floor(fyMonth / 3) + 1;
    const fyStart = month >= 3 ? year : year - 1;
    return `Q${q} FY${String(fyStart).slice(2)}-${String(fyStart + 1).slice(2)}`;
  }
  if (type === 'semi_annual') {
    const fyMonth = (month - 3 + 12) % 12;
    const h = fyMonth < 6 ? 1 : 2;
    const fyStart = month >= 3 ? year : year - 1;
    return `H${h} FY${String(fyStart).slice(2)}-${String(fyStart + 1).slice(2)}`;
  }
  if (type === 'annual') {
    const fyStart = month >= 3 ? year : year - 1;
    return `FY ${fyStart}-${String(fyStart + 1).slice(2)}`;
  }
  return '';
}

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-IN');
}

function ProgressMeter({ actual, planned, measurementType }) {
  if (planned == null || actual == null) return null;
  const pct = (parseFloat(actual) / parseFloat(planned)) * 100;
  const isLower = measurementType === 'lower_better';
  const onTrack = isLower ? actual <= planned : pct >= 100;
  const warning = !onTrack && pct >= 70;
  const barColor = onTrack ? 'bg-emerald-500' : warning ? 'bg-amber-400' : 'bg-red-400';
  const textColor = onTrack ? 'text-emerald-600' : warning ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">
          {fmt(actual)} / {fmt(planned)} {isLower ? '↓ lower-is-better' : ''}
        </span>
        <span className={`font-semibold ${textColor}`}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(Math.abs(pct), 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function CheckinModal({ target, cycleId, onClose, onCheckinAdded }) {
  const [checkins, setCheckins] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [tab, setTab] = useState('add');

  const [form, setForm] = useState(() => ({
    period_type: 'monthly',
    period_label: suggestPeriodLabel('monthly'),
    actual_value: '',
    notes: '',
  }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);

  function loadHistory() {
    setLoadingHistory(true);
    getCheckins(target.id)
      .then(setCheckins)
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }

  useEffect(() => { loadHistory(); }, [target.id]);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setErr(''); }

  function handlePeriodTypeChange(val) {
    setForm(f => ({ ...f, period_type: val, period_label: suggestPeriodLabel(val) }));
    setErr('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.actual_value === '' || form.actual_value == null) return setErr('Actual value is required');
    if (!form.period_label.trim()) return setErr('Period label is required');
    setSaving(true);
    try {
      await createCheckin({
        target_id: target.id,
        cycle_id: cycleId,
        period_type: form.period_type,
        period_label: form.period_label.trim(),
        actual_value: parseFloat(form.actual_value),
        notes: form.notes || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setForm(f => ({ ...f, actual_value: '', notes: '' }));
      loadHistory();
      setTab('history');
      onCheckinAdded?.();
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Failed to save check-in');
    } finally {
      setSaving(false);
    }
  }

  const latestActual = checkins[0]?.actual_value ?? target.actual_value;
  const numericEntries = checkins.filter(c => c.actual_value != null);
  const runningAvg = numericEntries.length
    ? numericEntries.reduce((s, c) => s + c.actual_value, 0) / numericEntries.length
    : null;

  const previewActual = form.actual_value !== '' ? parseFloat(form.actual_value) : null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 pb-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900 truncate">{target.title}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-slate-500">
                {target.planned_target != null && (
                  <span>
                    Target: <strong>{fmt(target.planned_target)}</strong>{target.unit ? ` ${target.unit}` : ''}
                  </span>
                )}
                {runningAvg != null && (
                  <span>
                    Avg: <strong>{fmt(Math.round(runningAvg * 10) / 10)}</strong>
                    {target.unit ? ` ${target.unit}` : ''}
                    <span className="text-slate-400 ml-1">({numericEntries.length} entries)</span>
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none flex-shrink-0 mt-0.5">×</button>
          </div>

          {/* Live progress bar — shows latest actual */}
          {target.planned_target != null && latestActual != null && (
            <div className="mt-3">
              <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">Current progress</p>
              <ProgressMeter
                actual={latestActual}
                planned={target.planned_target}
                measurementType={target.measurement_type}
              />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {[['add', '+ New Entry'], ['history', `History (${checkins.length})`]].map(([t, l]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* ── Add tab ────────────────────────────────────────────────────────── */}
        {tab === 'add' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {saved && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                Check-in saved successfully.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Review Period</label>
                <select
                  value={form.period_type}
                  onChange={e => handlePeriodTypeChange(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PERIOD_TYPES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Period Label</label>
                <input
                  value={form.period_label}
                  onChange={e => setField('period_label', e.target.value)}
                  placeholder="e.g. Jun 2026"
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Actual Value <span className="text-red-500">*</span>
                {target.unit && <span className="text-slate-400 font-normal ml-1">({target.unit})</span>}
              </label>
              <input
                type="number"
                step="any"
                value={form.actual_value}
                onChange={e => setField('actual_value', e.target.value)}
                placeholder={target.planned_target != null ? `Target is ${fmt(target.planned_target)}` : 'Enter actual value'}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {previewActual != null && target.planned_target != null && (
                <div className="mt-2">
                  <ProgressMeter
                    actual={previewActual}
                    planned={target.planned_target}
                    measurementType={target.measurement_type}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Notes / Comments <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                rows={3}
                placeholder="What did you achieve this period? Any blockers or highlights to share with your manager?"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {err && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Check-in'}
              </button>
            </div>
          </form>
        )}

        {/* ── History tab ────────────────────────────────────────────────────── */}
        {tab === 'history' && (
          <div className="p-6">
            {loadingHistory && (
              <p className="text-sm text-slate-400 text-center py-10">Loading history…</p>
            )}
            {!loadingHistory && checkins.length === 0 && (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm">No check-ins recorded yet.</p>
                <button
                  onClick={() => setTab('add')}
                  className="mt-2 text-blue-500 text-sm hover:underline"
                >
                  Record your first check-in →
                </button>
              </div>
            )}
            {!loadingHistory && checkins.length > 0 && (
              <div className="space-y-3">
                {/* Running average block */}
                {runningAvg != null && target.planned_target != null && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-2">
                    <p className="text-xs font-semibold text-blue-700 mb-1">
                      Running average — {numericEntries.length} check-in{numericEntries.length !== 1 ? 's' : ''}
                    </p>
                    <ProgressMeter
                      actual={runningAvg}
                      planned={target.planned_target}
                      measurementType={target.measurement_type}
                    />
                  </div>
                )}

                {checkins.map((c, idx) => (
                  <div
                    key={c.id}
                    className={`border rounded-xl px-4 py-3 ${idx === 0 ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-800">{c.period_label}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            {PERIOD_TYPES.find(p => p.value === c.period_type)?.label || c.period_type}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">latest</span>
                          )}
                          {c.acknowledged_by_name && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
                              Seen by {c.acknowledged_by_name}
                            </span>
                          )}
                        </div>
                        {c.notes && (
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{c.notes}</p>
                        )}
                        <p className="text-[10px] text-slate-300 mt-1.5">
                          {new Date(c.created_at).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-bold text-slate-800">
                          {fmt(c.actual_value)}
                        </span>
                        {target.unit && <span className="text-xs text-slate-400 ml-1">{target.unit}</span>}
                        {c.progress_pct != null && (
                          <p className="text-xs text-slate-400 mt-0.5">{c.progress_pct}%</p>
                        )}
                      </div>
                    </div>
                    {c.actual_value != null && target.planned_target != null && (
                      <div className="mt-2">
                        <ProgressMeter
                          actual={c.actual_value}
                          planned={target.planned_target}
                          measurementType={target.measurement_type}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
