import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../supabaseClient.js";
import { formatDateTime } from "../utils/formatDateTime.js";
import { useRoute, originPath } from "../router.js";

export default function HistoryScreen() {
  const { navigate } = useRoute();
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [rows, setRows] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState("");

  // הגענו ממסך הניהול? רק אז נציג "חזרה לניהול" ואת האפשרות לנקות היסטוריה.
  const managerMode = originPath() === "/manager";
  const backTo = managerMode ? "/manager" : "/";
  const backLabel = managerMode ? "חזרה לניהול" : "חזרה לצ'קליסט";

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

  async function clearHistory() {
    setClearError("");
    setClearing(true);
    // מחיקת כל הרשומות (מסנן על מזהה כדי לעבור את דרישת ה-filter של Supabase).
    const { error } = await supabase
      .from("closings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    setClearing(false);

    if (error) {
      setClearError(
        "המחיקה נכשלה. ודא שהרצת את ה-SQL שמאפשר מחיקת היסטוריה (מדיניות anon delete)."
      );
      return;
    }
    setConfirmClear(false);
    setRows([]);
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 bg-slate-900 text-white px-4 py-4 shadow-md flex items-center justify-between">
        <h1 className="text-xl font-bold">היסטוריית סגירות</h1>
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium active:bg-slate-600"
        >
          {backLabel}
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

        {/* ניקוי היסטוריה — רק במצב מנהל, וכשיש מה למחוק */}
        {managerMode && status === "ready" && rows.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => {
                  setClearError("");
                  setConfirmClear(true);
                }}
                className="w-full rounded-xl border border-red-300 text-red-700 font-semibold py-3 active:bg-red-50"
              >
                נקה היסטוריה
              </button>
            ) : (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-center">
                <p className="text-red-800 font-semibold mb-1">
                  למחוק את כל ההיסטוריה?
                </p>
                <p className="text-red-700 text-sm mb-4">
                  פעולה זו מוחקת את כל {rows.length} הסגירות ואי אפשר לבטל אותה.
                </p>
                {clearError && (
                  <p className="text-red-600 text-sm mb-3">{clearError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    disabled={clearing}
                    className="flex-1 rounded-xl border border-slate-300 bg-white font-semibold py-3 active:bg-slate-100"
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    onClick={clearHistory}
                    disabled={clearing}
                    className="flex-1 rounded-xl bg-red-600 text-white font-semibold py-3 active:bg-red-700 disabled:opacity-60"
                  >
                    {clearing ? "מוחק…" : "כן, מחק הכל"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
