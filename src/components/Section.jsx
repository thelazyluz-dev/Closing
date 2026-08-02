import { useState } from "react";
import ChecklistItem from "./ChecklistItem.jsx";
import { accentFor } from "../accents.js";

export default function Section({ section, sectionIndex, checked, onToggle }) {
  const doneInSection = section.items.reduce(
    (n, item) => n + (checked[item.id] ? 1 : 0),
    0
  );
  const total = section.items.length;
  const complete = total > 0 && doneInSection === total;
  const accent = accentFor(sectionIndex);

  // סעיף שהושלם מתקפל אוטומטית; אפשר להקיש כדי לפתוח שוב (לתקן סימון).
  const [expandedByUser, setExpandedByUser] = useState(false);
  const collapsed = complete && !expandedByUser;

  const badge = (
    <span
      className={
        "text-sm tabular-nums font-semibold rounded-full px-2.5 py-0.5 shrink-0 " +
        (complete
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-500")
      }
    >
      {complete ? "✓ הושלם" : `${doneInSection}/${total}`}
    </span>
  );

  const headerInner = (
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className="inline-block w-1.5 h-6 rounded-full shrink-0"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />
      <h2 className="text-xl font-bold text-slate-800 truncate">
        {section.section}
      </h2>
    </div>
  );

  return (
    <section className="mb-4">
      <div
        className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden"
        style={{ borderTop: `4px solid ${accent}` }}
      >
        {complete ? (
          <button
            type="button"
            onClick={() => setExpandedByUser((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white"
          >
            {headerInner}
            <div className="flex items-center gap-2 shrink-0">
              {badge}
              <span
                className={
                  "text-slate-400 transition-transform " +
                  (collapsed ? "" : "rotate-180")
                }
                aria-hidden="true"
              >
                ▾
              </span>
            </div>
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-white border-b border-slate-100">
            {headerInner}
            {badge}
          </div>
        )}

        {!collapsed && (
          <div className="divide-y divide-slate-100">
            {section.items.map((item) => (
              <ChecklistItem
                key={item.id}
                id={item.id}
                label={item.label}
                checked={Boolean(checked[item.id])}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
