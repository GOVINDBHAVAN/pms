import { useState } from 'react';

/**
 * InfoIcon — shows a ⓘ button that toggles a help popover on click.
 * Props:
 *   title   : string  — bold header in the popover
 *   content : string  — help text (supports \n for paragraphs)
 *   side    : 'top' | 'right' | 'bottom' | 'left'  (default 'right')
 */
export default function InfoIcon({ title, content, side = 'right' }) {
  const [open, setOpen] = useState(false);

  const sideStyles = {
    right:  'left-full top-0 ml-2',
    left:   'right-full top-0 mr-2',
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="Help"
        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 text-[10px] font-bold leading-none transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 flex-shrink-0"
      >
        i
      </button>

      {open && (
        <div
          className={`absolute z-50 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-left ${sideStyles[side] ?? sideStyles.right}`}
          onMouseDown={e => e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            {title && (
              <p className="text-xs font-semibold text-slate-800">{title}</p>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs leading-none flex-shrink-0"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{content}</p>
        </div>
      )}
    </span>
  );
}
