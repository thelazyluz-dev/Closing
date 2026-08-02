import ChecklistItem from "./ChecklistItem.jsx";
import { itemId } from "../checklist.js";

export default function Section({ section, sectionIndex, checked, onToggle }) {
  const doneInSection = section.items.reduce(
    (n, _label, ii) => n + (checked[itemId(sectionIndex, ii)] ? 1 : 0),
    0
  );

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-slate-800">{section.section}</h2>
        <span className="text-sm text-slate-500 tabular-nums">
          {doneInSection}/{section.items.length}
        </span>
      </div>
      <div className="space-y-2.5">
        {section.items.map((label, ii) => {
          const id = itemId(sectionIndex, ii);
          return (
            <ChecklistItem
              key={id}
              id={id}
              label={label}
              checked={Boolean(checked[id])}
              onToggle={onToggle}
            />
          );
        })}
      </div>
    </section>
  );
}
