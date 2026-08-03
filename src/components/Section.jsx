import { useState } from "react";
import ChecklistItem from "./ChecklistItem.jsx";
import { accentFor } from "../accents.js";

export default function Section({
  section,
  sectionIndex,
  states,
  notes,
  onSetStatus,
  onSetNote,
}) {
  const total = section.items.length;
  const doneCount = section.items.filter(
    (it) => states[it.id] === "done"
  ).length;
  const problemCount = section.items.filter(
    (it) => states[it.id] === "problem"
  ).length;
  const addressed = doneCount + problemCount;

  const clean = total > 0 && addressed === total && problemCount === 0; // הכל בוצע
  const allAddressed = total > 0 && addressed === total;
  const accent = accentFor(sectionIndex);

  // רק סעיף נקי לגמרי (הכל בוצע) מתקפל; סעיף עם תקלה נשאר פתוח כדי שהתקלה תישאר גלויה.
  const [expandedByUser, setExpandedByUser] = useState(false);
  const collapsed = clean && !expandedByUser;

  let badge;
  if (clean) {
    badge = (
      <span className="text-sm font-semibold rounded-full px-2.5 py-0.5 shrink-0 bg-emerald-100 text-emerald-700">
        ✓ הושלם
      </span>
    );
  } else if (allAddressed && problemCount > 0) {
    badge = (
      <span className="text-sm font-semibold rounded-full px-2.5 py-0.5 shrink-0 bg-red-100 text-red-700">
        ⚠ {problemCount} לא בוצע
      </span>
    );
  } else {
    badge = (
      <span className="text-sm tabular-nums font-semibold rounded-full px-2.5 py-0.5 shrink-0 bg-slate-100 text-slate-500">
        {addressed}/{total}
      </span>
    );
  }

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
    <section className={"mb-4 " + (clean ? "opacity-60" : "opacity-100")}>
      <div
        className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden"
        style={{ borderTop: `4px solid ${accent}` }}
      >
        {clean ? (
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
                status={states[item.id]}
                note={notes[item.id]}
                onSetStatus={onSetStatus}
                onSetNote={onSetNote}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
