import { formatDateTime } from "../utils/formatDateTime.js";

export default function SuccessScreen({ record }) {
  const { date, time } = formatDateTime(record.completed_at);

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="success-badge mb-5">
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          role="img"
          aria-label="נסגר בהצלחה"
        >
          <circle cx="48" cy="48" r="46" fill="#ecfdf5" stroke="#10b981" strokeWidth="3" />
          <path
            className="success-check"
            d="M30 49 L43 62 L67 34"
            fill="none"
            stroke="#059669"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="success-fade text-2xl font-bold text-slate-900 mb-6">
        המפעל נסגר בהצלחה
      </h1>

      <div className="success-fade w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-5 shadow-sm mb-6">
        <div className="text-lg font-semibold text-slate-900">
          {record.worker_name}
        </div>
        <div className="mt-2 text-slate-600 tabular-nums">
          {date} · {time}
        </div>
      </div>

      <p className="success-fade text-slate-500">אפשר לסגור את החלון. תודה!</p>
    </div>
  );
}
