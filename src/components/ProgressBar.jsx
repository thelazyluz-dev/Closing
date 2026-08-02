export default function ProgressBar({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const complete = done === total && total > 0;

  return (
    <div className="sticky top-0 z-10 bg-slate-900 text-white px-4 py-3 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-base font-semibold">
          סומנו {done} מתוך {total}
        </span>
        <span className="text-sm tabular-nums opacity-90">{pct}%</span>
      </div>
      <div
        className="h-2.5 w-full rounded-full bg-slate-700 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div
          className={
            "h-full rounded-full transition-all duration-300 " +
            (complete ? "bg-emerald-400" : "bg-sky-400")
          }
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
