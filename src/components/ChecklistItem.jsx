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
        className="sr-only"
      />
      <span
        className={
          "relative grid place-items-center h-7 w-7 shrink-0 rounded-md border-2 transition-colors duration-150 " +
          (checked ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-300")
        }
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={
            "w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] " +
            (checked ? "scale-100" : "scale-0")
          }
          aria-hidden="true"
        >
          <path
            d="M5 12.5 L10 17.5 L19 7"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        className={
          "text-lg leading-snug " +
          (checked ? "text-slate-500 line-through" : "text-slate-900")
        }
      >
        {label}
      </span>
    </label>
  );
}
