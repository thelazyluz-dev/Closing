import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../supabaseClient.js";
import { formatDateTime } from "../utils/formatDateTime.js";
import { useRoute } from "../router.js";

export default function HistoryScreen() {
  const { navigate } = useRoute();
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    const { data, error } = await supabase
      .from("closings")
      .select("id, worker_name, completed_at")
      .order("completed_at", { ascending: false });

    if (error) {
      setStatus("error");
      return;
    }
    setRows(data || []);
    setStatus("ready");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-slate-900 text-white px-4 py-4 shadow-md flex items-center justify-between">
        <h1 className="text-xl font-bold">היסטוריית סגירות</h1>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium active:bg-slate-600"
        >
          חזרה לצ'קליסט
        </button>
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto">
        {status === "loading" && (
          <p className="text-center text-slate-500 py-10">טוען…</p>
        )}

        {status === "error" && (
          <div className="text-center py-10">
            <p className="text-red-600 mb-4">
              {isSupabaseConfigured
                ? "טעינת ההיסטוריה נכשלה. בדוק את החיבור לרשת."
                : "החיבור ל-Supabase לא מוגדר. מלא את משתני הסביבה."}
            </p>
            {isSupabaseConfigured && (
              <button
                type="button"
                onClick={load}
                className="rounded-xl bg-slate-900 text-white font-semibold px-6 py-3 active:bg-slate-800"
              >
                נסה שוב
              </button>
            )}
          </div>
        )}

        {status === "ready" && rows.length === 0 && (
          <p className="text-center text-slate-500 py-10">
            עדיין אין סגירות שמורות.
          </p>
        )}

        {status === "ready" && rows.length > 0 && (
          <ul className="space-y-2.5">
            {rows.map((row) => {
              const { date, time } = formatDateTime(row.completed_at);
              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span className="text-lg font-semibold text-slate-900">
                    {row.worker_name}
                  </span>
                  <span className="text-slate-600 tabular-nums text-sm">
                    {date} · {time}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
