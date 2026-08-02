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

  return (
    <section
      className={
        "mb-6 transition-opacity duration-300 " +
        (complete ? "opacity-60" : "opacity-100")
      }
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block w-1.5 h-6 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          <h2 className="text-xl font-bold text-slate-800">{section.section}</h2>
        </div>
        <span
          className={
            "text-sm tabular-nums font-semibold rounded-full px-2.5 py-0.5 " +
            (complete
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500")
          }
        >
          {complete ? "✓ הושלם" : `${doneInSection}/${total}`}
        </span>
      </div>
      <div className="space-y-2.5">
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
    </section>
  );
}
