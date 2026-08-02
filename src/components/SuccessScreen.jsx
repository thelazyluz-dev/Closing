import { formatDateTime } from "../utils/formatDateTime.js";

export default function SuccessScreen({ record }) {
  const { date, time } = formatDateTime(record.completed_at);

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="text-5xl mb-4" aria-hidden="true">
        ✅
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        המפעל נסגר בהצלחה
      </h1>

      <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-5 shadow-sm mb-6">
        <div className="text-lg font-semibold text-slate-900">
          {record.worker_name}
        </div>
        <div className="mt-2 text-slate-600 tabular-nums">
          {date} · {time}
        </div>
      </div>

      <p className="text-slate-500">אפשר לסגור את החלון. תודה!</p>
    </div>
  );
}
