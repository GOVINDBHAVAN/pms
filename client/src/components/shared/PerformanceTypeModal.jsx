import { useEffect } from 'react';

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', heading: 'text-indigo-700', icon: 'bg-indigo-100' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', heading: 'text-violet-700', icon: 'bg-violet-100' },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   heading: 'text-blue-700',   icon: 'bg-blue-100'   },
  cyan:   { bg: 'bg-cyan-50',   border: 'border-cyan-200',   badge: 'bg-cyan-100 text-cyan-700',   heading: 'text-cyan-700',   icon: 'bg-cyan-100'   },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700', heading: 'text-green-700', icon: 'bg-green-100'  },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700',heading:'text-purple-700',icon: 'bg-purple-100' },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700', heading: 'text-amber-700', icon: 'bg-amber-100'  },
  slate:  { bg: 'bg-slate-50',  border: 'border-slate-200',  badge: 'bg-slate-100 text-slate-700', heading: 'text-slate-700', icon: 'bg-slate-100'  },
};

/**
 * PerformanceTypeModal
 * A full-screen modal that explains one performance type in depth.
 *
 * Props:
 *   info    : object from HELP.performanceTypes[key]
 *   onClose : () => void
 */
export default function PerformanceTypeModal({ info, onClose }) {
  const c = COLOR_MAP[info.color] || COLOR_MAP.slate;

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={`${c.bg} ${c.border} border-b rounded-t-2xl px-6 py-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`text-3xl ${c.icon} rounded-xl p-2 leading-none`}>{info.icon}</span>
              <div>
                <h2 className={`text-xl font-bold ${c.heading}`}>{info.title}</h2>
                <p className="text-sm text-slate-600 mt-0.5">{info.tagline}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-1 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* ── What is this? ── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              What is {info.title}?
            </h3>
            <div className="space-y-2">
              {info.what.map((para, i) => (
                <p key={i} className="text-sm text-slate-700 leading-relaxed">{para}</p>
              ))}
            </div>
          </section>

          {/* ── Best For ── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Best For — Industries & Roles
            </h3>
            <div className="space-y-2">
              {info.industries.map((ind, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${c.badge}`}>
                    {ind.name}
                  </span>
                  <p className="text-sm text-slate-600 leading-relaxed">{ind.reason}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Business Benefit ── */}
          <section className={`${c.bg} ${c.border} border rounded-xl p-4`}>
            <h3 className={`text-sm font-semibold ${c.heading} mb-2 flex items-center gap-1.5`}>
              <span>💡</span> Business Benefit
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{info.benefit}</p>
          </section>

          {/* ── Real Example ── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Real-World Example
            </h3>
            <p className="text-sm text-slate-600 mb-2 italic">{info.example.scenario}</p>
            <div className="bg-slate-900 rounded-xl p-4 space-y-1">
              {info.example.items.map((line, i) => (
                <p key={i} className="text-sm font-mono text-slate-100 leading-relaxed whitespace-pre">{line}</p>
              ))}
            </div>
            {info.example.note && (
              <p className="text-xs text-slate-500 mt-2 italic">💬 {info.example.note}</p>
            )}
          </section>

          {/* ── Pair With ── */}
          {info.pairWith && (
            <section className="border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <span>🔗</span> Use Together With
              </h3>
              <p className="text-sm text-slate-600">{info.pairWith}</p>
            </section>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
