import ChecklistItem from "./ChecklistItem.jsx";

export default function Section({ section, checked, onToggle }) {
  const doneInSection = section.items.reduce(
    (n, item) => n + (checked[item.id] ? 1 : 0),
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
