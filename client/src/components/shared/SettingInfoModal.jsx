import { useEffect } from 'react';

const COLOR = {
  indigo: { header: 'bg-indigo-50 border-indigo-200', icon: 'bg-indigo-100 text-indigo-600', badge: 'bg-indigo-100 text-indigo-700', heading: 'text-indigo-700', impact: 'bg-indigo-50 border-indigo-200' },
  blue:   { header: 'bg-blue-50 border-blue-200',   icon: 'bg-blue-100 text-blue-600',   badge: 'bg-blue-100 text-blue-700',   heading: 'text-blue-700',   impact: 'bg-blue-50 border-blue-200'   },
  green:  { header: 'bg-green-50 border-green-200', icon: 'bg-green-100 text-green-600', badge: 'bg-green-100 text-green-700', heading: 'text-green-700', impact: 'bg-green-50 border-green-200' },
  amber:  { header: 'bg-amber-50 border-amber-200', icon: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100 text-amber-700', heading: 'text-amber-700', impact: 'bg-amber-50 border-amber-200' },
  purple: { header: 'bg-purple-50 border-purple-200', icon: 'bg-purple-100 text-purple-600', badge: 'bg-purple-100 text-purple-700', heading: 'text-purple-700', impact: 'bg-purple-50 border-purple-200' },
  violet: { header: 'bg-violet-50 border-violet-200', icon: 'bg-violet-100 text-violet-600', badge: 'bg-violet-100 text-violet-700', heading: 'text-violet-700', impact: 'bg-violet-50 border-violet-200' },
  cyan:   { header: 'bg-cyan-50 border-cyan-200',   icon: 'bg-cyan-100 text-cyan-600',   badge: 'bg-cyan-100 text-cyan-700',   heading: 'text-cyan-700',   impact: 'bg-cyan-50 border-cyan-200'   },
  slate:  { header: 'bg-slate-50 border-slate-200', icon: 'bg-slate-100 text-slate-600', badge: 'bg-slate-100 text-slate-700', heading: 'text-slate-700', impact: 'bg-slate-50 border-slate-200' },
  rose:   { header: 'bg-rose-50 border-rose-200',   icon: 'bg-rose-100 text-rose-600',   badge: 'bg-rose-100 text-rose-700',   heading: 'text-rose-700',   impact: 'bg-rose-50 border-rose-200'   },
};

/**
 * SettingInfoModal — deep-dive educational modal for any Org Settings field.
 *
 * info shape (from HELP.settingModals[key]):
 * {
 *   title:     string
 *   icon:      string (emoji)
 *   color:     keyof COLOR
 *   tagline:   string
 *   what:      string[]             — explanation paragraphs
 *   reflects:  { where, what }[]   — where in the system this appears
 *   practices: { context, rec }[]  — best practices
 *   impact:    string              — business impact paragraph
 *   example:   { scenario, items[], note? }
 *   mistake?:  string              — common mistake to avoid
 * }
 */
export default function SettingInfoModal({ info, onClose }) {
  const c = COLOR[info.color] || COLOR.slate;

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
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
        {/* Header */}
        <div className={`${c.header} border-b rounded-t-2xl px-6 py-5 sticky top-0`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`text-2xl ${c.icon} rounded-xl p-2.5 leading-none flex-shrink-0`}>{info.icon}</span>
              <div>
                <h2 className={`text-lg font-bold ${c.heading}`}>{info.title}</h2>
                <p className="text-sm text-slate-600 mt-0.5 leading-snug">{info.tagline}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-0.5 text-slate-400 hover:text-slate-600 rounded-full p-1.5 hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* What is this */}
          <section>
            <SectionHeading>What is this?</SectionHeading>
            <div className="space-y-2">
              {info.what.map((p, i) => (
                <p key={i} className="text-sm text-slate-700 leading-relaxed">{p}</p>
              ))}
            </div>
          </section>

          {/* Where does it reflect */}
          {info.reflects?.length > 0 && (
            <section>
              <SectionHeading>Where does this reflect in the system?</SectionHeading>
              <p className="text-xs text-slate-400 mb-3">Every place in the product where changing this setting has a visible effect.</p>
              <div className="space-y-2.5">
                {info.reflects.map((r, i) => (
                  <div key={i} className="flex gap-3 items-start rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <span className="flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{r.where}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{r.what}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Best Practices */}
          {info.practices?.length > 0 && (
            <section>
              <SectionHeading>Best Practices by Industry / Context</SectionHeading>
              <div className="space-y-2">
                {info.practices.map((p, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${c.badge}`}>
                      {p.context}
                    </span>
                    <p className="text-sm text-slate-600 leading-relaxed">{p.rec}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Business Impact */}
          {info.impact && (
            <section className={`${c.impact} border rounded-xl p-4`}>
              <p className={`text-xs font-semibold ${c.heading} mb-2 flex items-center gap-1.5`}>
                <span>💡</span> Why This Matters — Business Impact
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{info.impact}</p>
            </section>
          )}

          {/* Example */}
          {info.example && (
            <section>
              <SectionHeading>Real-World Example</SectionHeading>
              <p className="text-sm text-slate-600 mb-2 italic">{info.example.scenario}</p>
              <div className="bg-slate-900 rounded-xl p-4 space-y-0.5 overflow-x-auto">
                {info.example.items.map((line, i) => (
                  <p key={i} className="text-xs font-mono text-slate-100 leading-relaxed whitespace-pre">{line}</p>
                ))}
              </div>
              {info.example.note && (
                <p className="text-xs text-slate-500 mt-2 italic">💬 {info.example.note}</p>
              )}
            </section>
          )}

          {/* Common Mistake */}
          {info.mistake && (
            <section className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1.5">
                <span>⚠️</span> Common Mistake to Avoid
              </p>
              <p className="text-sm text-red-800 leading-relaxed">{info.mistake}</p>
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end sticky bottom-0 bg-white rounded-b-2xl">
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

function SectionHeading({ children }) {
  return (
    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{children}</h3>
  );
}
