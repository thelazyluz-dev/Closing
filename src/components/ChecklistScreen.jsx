import { useMemo, useState, useEffect } from "react";
import Section from "./Section.jsx";
import ProgressBar from "./ProgressBar.jsx";
import Loading from "./Loading.jsx";
import { useLocalStorage, clearStorage } from "../useLocalStorage.js";
import { supabase, isSupabaseConfigured } from "../supabaseClient.js";
import { loadChecklist } from "../checklistSource.js";
import { notDonePhrase } from "../text.js";

export const STORAGE_STATES = "closing.states.v2";
export const STORAGE_NOTES = "closing.notes.v2";
export const STORAGE_NAME = "closing.name.v1";

export default function ChecklistScreen({ onComplete }) {
  const [checklist, setChecklist] = useState(null); // תוכן הצ'קליסט הנטען
  const [states, setStates] = useLocalStorage(STORAGE_STATES, {}); // {id: "done"|"problem"}
  const [notes, setNotes] = useLocalStorage(STORAGE_NOTES, {}); // {id: "טקסט הערה"}
  const [name, setName] = useLocalStorage(STORAGE_NAME, "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

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

  const allItems = checklist?.allItems ?? [];
  const total = checklist?.total ?? 0;

  const { doneCount, problemCount } = useMemo(() => {
    let d = 0;
    let p = 0;
    for (const it of allItems) {
      if (states[it.id] === "done") d++;
      else if (states[it.id] === "problem") p++;
    }
    return { doneCount: d, problemCount: p };
  }, [allItems, states]);

  const addressed = doneCount + problemCount;
  const allAddressed = total > 0 && addressed === total;

  // כל תקלה חייבת הערה.
  const notesOk = useMemo(
    () =>
      allItems.every(
        (it) => states[it.id] !== "problem" || (notes[it.id] || "").trim()
      ),
    [allItems, states, notes]
  );

  const trimmedName = name.trim();
  const nameOk = trimmedName.length > 0;
  const canSubmit = allAddressed && notesOk && nameOk && !saving;

  function setStatus(id, status) {
    setStates((prev) => {
      const next = { ...prev };
      if (status === null) {
        delete next[id];
      } else {
        next[id] = status;
        if (status === "done" && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(15);
        }
      }
      return next;
    });
    // מעבר ל"בוצע" / ביטול — מנקים הערה ישנה כדי שלא תישמר בטעות.
    if (status !== "problem") {
      setNotes((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function setNote(id, text) {
    setNotes((prev) => ({ ...prev, [id]: text }));
  }

  function attemptSubmit() {
    if (!canSubmit) return;
    // אם יש תקלות — לוודא שזה מודע לפני סגירה.
    if (problemCount > 0) {
      setConfirmOpen(true);
      return;
    }
    doSubmit();
  }

  async function doSubmit() {
    setConfirmOpen(false);
    setError("");

    if (!isSupabaseConfigured) {
      setError("החיבור ל-Supabase לא מוגדר. פנה למנהל המערכת.");
      return;
    }

    // snapshot מלא: לכל פריט הסטטוס שלו (וגם הערה לתקלה).
    const items = allItems.map((it) => {
      if (states[it.id] === "problem") {
        return {
          section: it.section,
          label: it.label,
          status: "problem",
          note: (notes[it.id] || "").trim(),
        };
      }
      return { section: it.section, label: it.label, status: "done" };
    });

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
          ? "השמירה נכשלה. הכל נשמר במכשיר — אפשר לנסות שוב."
          : "אין חיבור לרשת. הכל נשמר במכשיר — נסה שוב כשהחיבור יחזור."
      );
      return;
    }

    const problems = items.filter((i) => i.status === "problem");
    // הצלחה — ננקה את ההתקדמות הזמנית כדי שהסגירה הבאה תתחיל נקייה.
    clearStorage(STORAGE_STATES, STORAGE_NOTES, STORAGE_NAME);
    onComplete({ ...data, problems });
  }

  // מצב טעינה קצר בזמן משיכת תוכן הצ'קליסט.
  if (!checklist) {
    return <Loading label="טוען צ'קליסט…" />;
  }

  return (
    <div className="min-h-full pb-8">
      <ProgressBar done={addressed} total={total} hasProblems={problemCount > 0} />

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
            states={states}
            notes={notes}
            onSetStatus={setStatus}
            onSetNote={setNote}
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

        {/* אזור הפעולה — בסוף הדף, לא קבוע על המסך */}
        <div className="mt-6">
          {!online && (
            <p className="text-center text-sm text-amber-700 mb-2">
              אין חיבור לרשת — הכל נשמר במכשיר.
            </p>
          )}
          {error && (
            <p className="text-center text-sm text-red-600 mb-2">{error}</p>
          )}
          {allAddressed && !notesOk && (
            <p className="text-center text-sm text-red-600 mb-2">
              יש למלא הערה לכל פריט שסומן "לא הצלחתי"
            </p>
          )}
          {allAddressed && notesOk && !nameOk && (
            <p className="text-center text-sm text-slate-500 mb-2">
              יש להזין שם
            </p>
          )}
          {canSubmit && problemCount === 0 && (
            <p className="text-center text-sm text-emerald-700 font-semibold mb-2">
              הכל מוכן — אפשר לסגור ✅
            </p>
          )}
          {canSubmit && problemCount > 0 && (
            <p className="text-center text-sm text-amber-700 font-semibold mb-2">
              כל הפריטים טופלו · {notDonePhrase(problemCount)}
            </p>
          )}

          {confirmOpen ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
              <p className="text-amber-900 font-semibold mb-1">
                {notDonePhrase(problemCount)}
              </p>
              <p className="text-amber-800 text-sm mb-4">
                הדיווח יישמר. לסגור את המפעל בכל זאת?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white font-semibold py-3 active:bg-slate-100"
                >
                  ביטול
                </button>
                <button
                  type="button"
                  onClick={doSubmit}
                  className="flex-1 rounded-xl bg-emerald-600 text-white font-semibold py-3 active:bg-emerald-700"
                >
                  כן, סגור
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={attemptSubmit}
              disabled={!canSubmit}
              className={
                "w-full rounded-xl text-lg font-bold py-4 transition-colors " +
                (canSubmit
                  ? "bg-emerald-600 text-white active:bg-emerald-700 btn-ready"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed")
              }
            >
              {saving ? "שומר…" : error ? "נסה שוב" : "סיום וסגירה"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
