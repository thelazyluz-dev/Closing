export default function ChecklistItem({
  id,
  label,
  status, // undefined | "done" | "problem"
  note,
  onSetStatus,
  onSetNote,
}) {
  const done = status === "done";
  const problem = status === "problem";
  const noteMissing = problem && !(note || "").trim();

  const baseBtn =
    "h-10 w-11 shrink-0 grid place-items-center rounded-lg border text-xl transition-colors active:scale-95";

  return (
    <div
      className={
        "px-4 py-3 border-s-4 transition-colors " +
        (done
          ? "bg-emerald-50 border-s-emerald-500"
          : problem
          ? "bg-red-50 border-s-red-500"
          : "bg-white border-s-transparent")
      }
    >
      <div className="flex items-center gap-3">
        <span
          className={
            "flex-1 min-w-0 text-lg leading-snug " +
            (done ? "text-slate-500 line-through" : "text-slate-900")
          }
        >
          {label}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSetStatus(id, done ? null : "done")}
            aria-label="בוצע"
            aria-pressed={done}
            className={
              baseBtn +
              (done
                ? " bg-emerald-600 border-emerald-600 text-white"
                : " bg-white border-slate-300 text-slate-400 active:bg-slate-50")
            }
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => onSetStatus(id, problem ? null : "problem")}
            aria-label="לא הצלחתי"
            aria-pressed={problem}
            className={
              baseBtn +
              (problem
                ? " bg-red-500 border-red-500 text-white"
                : " bg-white border-slate-300 text-slate-400 active:bg-slate-50")
            }
          >
            ✕
          </button>
        </div>
      </div>

      {problem && (
        <input
          type="text"
          value={note || ""}
          onChange={(e) => onSetNote(id, e.target.value)}
          placeholder="מה קרה? (חובה)"
          className={
            "mt-2.5 w-full rounded-lg border bg-white px-3 py-2.5 outline-none " +
            (noteMissing
              ? "border-red-400 focus:border-red-500"
              : "border-slate-300 focus:border-sky-500")
          }
        />
      )}
    </div>
  );
}
