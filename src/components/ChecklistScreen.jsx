import { useMemo, useState, useEffect, useRef, useLayoutEffect } from "react";
import Section from "./Section.jsx";
import ProgressBar from "./ProgressBar.jsx";
import { useLocalStorage, clearStorage } from "../useLocalStorage.js";
import { supabase, isSupabaseConfigured } from "../supabaseClient.js";
import { loadChecklist } from "../checklistSource.js";

export const STORAGE_CHECKED = "closing.checked.v1";
export const STORAGE_NAME = "closing.name.v1";

export default function ChecklistScreen({ onComplete }) {
  const [checklist, setChecklist] = useState(null); // תוכן הצ'קליסט הנטען
  const [checked, setChecked] = useLocalStorage(STORAGE_CHECKED, {});
  const [name, setName] = useLocalStorage(STORAGE_NAME, "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  // מדידת גובה פס הפעולה הקבוע כדי לשמור מספיק ריווח תחתון (שדה השם לא ייחתך).
  const actionBarRef = useRef(null);
  const [barHeight, setBarHeight] = useState(0);

  // טעינת תוכן הצ'קליסט (מ-Supabase, עם נפילה לרשימה הקבועה).
  useEffect(() => {
    let alive = true;
    loadChecklist().then((data) => {
      if (alive) setChecklist(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // עוקב אחרי גובה פס הפעולה (משתנה כשמופיעות שורות חיווי/הודעות).
  useLayoutEffect(() => {
    const el = actionBarRef.current;
    if (!el) return;
    const update = () => setBarHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [checklist]);

  const allItems = checklist?.allItems ?? [];
  const total = checklist?.total ?? 0;

  const doneCount = useMemo(
    () => allItems.reduce((n, it) => n + (checked[it.id] ? 1 : 0), 0),
    [allItems, checked]
  );

  const trimmedName = name.trim();
  const remaining = total - doneCount;
  const allDone = total > 0 && remaining === 0;
  const nameOk = trimmedName.length > 0;
  const canSubmit = allDone && nameOk && !saving;

  function toggle(id) {
    setChecked((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
        // רטט קצר במכשירים שתומכים — משוב מגע נעים בעת סימון.
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(15);
        }
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setError("");

    if (!isSupabaseConfigured) {
      setError("החיבור ל-Supabase לא מוגדר. פנה למנהל המערכת.");
      return;
    }

    // snapshot של הפריטים שסומנו: מערך של { section, label }
    const items = allItems
      .filter((it) => checked[it.id])
      .map((it) => ({ section: it.section, label: it.label }));

    setSaving(true);
    const { data, error: dbError } = await supabase
      .from("closings")
      .insert({
        worker_name: trimmedName,
        checklist_version: checklist?.version ?? "v1",
        items,
      })
      .select("id, worker_name, completed_at")
      .single();
    setSaving(false);

    if (dbError) {
      setError(
        navigator.onLine
          ? "השמירה נכשלה. הסימונים והשם נשמרו — אפשר לנסות שוב."
          : "אין חיבור לרשת. הסימונים והשם נשמרו — נסה שוב כשהחיבור יחזור."
      );
      return;
    }

    // הצלחה — ננקה את ההתקדמות הזמנית כדי שהסגירה הבאה תתחיל נקייה.
    clearStorage(STORAGE_CHECKED, STORAGE_NAME);
    onComplete(data);
  }

  // מצב טעינה קצר בזמן משיכת תוכן הצ'קליסט.
  if (!checklist) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        טוען צ'קליסט…
      </div>
    );
  }

  return (
    <div
      className="min-h-full"
      style={{ paddingBottom: (barHeight || 120) + 24 }}
    >
      <ProgressBar done={doneCount} total={total} />

      <header className="px-4 pt-4">
        <img
          src="/logo.png"
          alt="דביק תעשיות — שדה בוקר"
          className="h-12 w-auto mb-3"
        />
        <h1 className="text-2xl font-bold text-slate-900">סגירת מפעל</h1>

        {checklist.notes.length > 0 && (
          <div className="mt-3 space-y-2">
            {checklist.notes.map((note, i) => (
              <div
                key={i}
                className="rounded-xl bg-amber-100 border border-amber-300 text-amber-900 px-4 py-3 font-semibold"
              >
                ⚠️ {note}
              </div>
            ))}
          </div>
        )}
      </header>

      <main className="px-4 pt-5 max-w-lg mx-auto">
        {checklist.sections.map((section, si) => (
          <Section
            key={section.section}
            section={section}
            sectionIndex={si}
            checked={checked}
            onToggle={toggle}
          />
        ))}

        <div className="mt-2">
          <label
            htmlFor="worker-name"
            className="block text-base font-semibold text-slate-800 mb-1.5"
          >
            שם העובד
          </label>
          <input
            id="worker-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="הזן שם"
            autoComplete="name"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-lg outline-none focus:border-sky-500"
          />
        </div>
      </main>

      {/* אזור פעולה קבוע בתחתית */}
      <div
        ref={actionBarRef}
        className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white/95 backdrop-blur px-4 pt-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-lg mx-auto">
          {!online && (
            <p className="text-center text-sm text-amber-700 mb-2">
              אין חיבור לרשת — הסימונים נשמרים במכשיר.
            </p>
          )}
          {error && (
            <p className="text-center text-sm text-red-600 mb-2">{error}</p>
          )}
          {!canSubmit && !saving && (
            <p className="text-center text-sm text-slate-500 mb-2">
              {!allDone && `נותרו ${remaining} פריטים לסימון`}
              {!allDone && !nameOk && " · "}
              {!nameOk && "יש להזין שם"}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={
              "w-full rounded-xl text-lg font-bold py-4 transition-colors " +
              (canSubmit
                ? "bg-emerald-600 text-white active:bg-emerald-700"
                : "bg-slate-200 text-slate-400 cursor-not-allowed")
            }
          >
            {saving ? "שומר…" : error ? "נסה שוב" : "סיום וסגירה"}
          </button>
        </div>
      </div>
    </div>
  );
}
