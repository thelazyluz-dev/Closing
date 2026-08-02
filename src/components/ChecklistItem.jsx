export default function ChecklistItem({ id, label, checked, onToggle }) {
  return (
    <label
      htmlFor={id}
      className={
        "flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none transition-colors border-s-4 " +
        (checked
          ? "bg-emerald-50 border-s-emerald-500"
          : "bg-white border-s-transparent active:bg-slate-50")
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
