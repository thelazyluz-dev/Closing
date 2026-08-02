export default function ChecklistItem({ id, label, checked, onToggle }) {
  return (
    <label
      htmlFor={id}
      className={
        "flex items-center gap-3 rounded-xl border p-4 cursor-pointer select-none transition-colors active:scale-[0.99] " +
        (checked
          ? "border-emerald-400 bg-emerald-50"
          : "border-slate-200 bg-white")
      }
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(id)}
        className="h-7 w-7 shrink-0 accent-emerald-600"
      />
      <span
        className={
          "text-xl leading-snug " +
          (checked ? "text-slate-500 line-through" : "text-slate-900")
        }
      >
        {label}
      </span>
    </label>
  );
}
