import { useEffect, useState, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "../supabaseClient.js";
import { withTimeout } from "../checklistSource.js";
import { CHECKLIST, TOP_NOTE } from "../checklist.js";
import { useRoute } from "../router.js";
import { genId } from "../uuid.js";

// בונה מבנה עריכה מהרשימה הקבועה (כשאין חיבור ל-DB) — עם מזהים חדשים כדי ששמירה תעבוד.
function fromStatic() {
  return {
    notes: [{ id: genId(), text: TOP_NOTE }],
    sections: CHECKLIST.map((s) => ({
      key: genId(),
      name: s.section,
      items: s.items.map((label) => ({ id: genId(), label })),
    })),
  };
}

// ממיר שורות DB (מקובצות לפי סעיף, בסדר position) למבנה עריכה.
function fromRows(itemRows, noteRows) {
  const sections = [];
  const byName = new Map();
  for (const row of itemRows) {
    let group = byName.get(row.section);
    if (!group) {
      group = { key: genId(), name: row.section, items: [] };
      byName.set(row.section, group);
      sections.push(group);
    }
    group.items.push({ id: row.id, label: row.label });
  }
  const notes = noteRows.map((n) => ({ id: n.id, text: n.text }));
  return { notes, sections };
}

function move(arr, i, dir) {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export default function ManagerScreen() {
  const { navigate } = useRoute();
  const [status, setStatus] = useState("loading"); // loading | ready
  const [dbWarning, setDbWarning] = useState("");
  const [data, setData] = useState({ notes: [], sections: [] });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // { type: 'ok'|'err', text }
  const loadedItemIds = useRef([]);
  const loadedNoteIds = useRef([]);

  const load = useCallback(async () => {
    setStatus("loading");
    setSaveMsg(null);

    if (!isSupabaseConfigured) {
      loadedItemIds.current = [];
      loadedNoteIds.current = [];
      setData(fromStatic());
      setDbWarning("החיבור ל-Supabase לא מוגדר — עריכה לתצוגה בלבד, שמירה לא תעבוד.");
      setStatus("ready");
      return;
    }

    try {
      const result = await withTimeout(
        Promise.all([
          supabase
            .from("checklist_items")
            .select("id, section, label, position")
            .eq("active", true)
            .order("position", { ascending: true }),
          supabase
            .from("checklist_notes")
            .select("id, text, position")
            .eq("active", true)
            .order("position", { ascending: true }),
        ]),
        8000
      );

      const timedOut = !Array.isArray(result);
      const [itemsRes, notesRes] = Array.isArray(result) ? result : [{}, {}];

      if (timedOut || itemsRes.error || notesRes.error) {
        loadedItemIds.current = [];
        loadedNoteIds.current = [];
        setData(fromStatic());
        setDbWarning(
          "לא הצלחתי להתחבר ל-Supabase. ודא שהרצת את manager-schema.sql. שמירה לא תעבוד עד אז."
        );
        setStatus("ready");
        return;
      }

      const items = itemsRes.data || [];
      const notes = notesRes.data || [];
      loadedItemIds.current = items.map((r) => r.id);
      loadedNoteIds.current = notes.map((r) => r.id);
      setData(items.length ? fromRows(items, notes) : fromStatic());
      setDbWarning("");
      setStatus("ready");
    } catch {
      loadedItemIds.current = [];
      loadedNoteIds.current = [];
      setData(fromStatic());
      setDbWarning("שגיאה בטעינה. שמירה לא תעבוד עד שהחיבור ל-Supabase יתוקן.");
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---- עריכת הערות ----
  const addNote = () =>
    setData((d) => ({ ...d, notes: [...d.notes, { id: genId(), text: "" }] }));
  const updateNote = (i, text) =>
    setData((d) => {
      const notes = d.notes.slice();
      notes[i] = { ...notes[i], text };
      return { ...d, notes };
    });
  const deleteNote = (i) =>
    setData((d) => ({ ...d, notes: d.notes.filter((_, k) => k !== i) }));
  const moveNote = (i, dir) =>
    setData((d) => ({ ...d, notes: move(d.notes, i, dir) }));

  // ---- עריכת סעיפים ----
  const addSection = () =>
    setData((d) => ({
      ...d,
      sections: [...d.sections, { key: genId(), name: "", items: [] }],
    }));
  const updateSectionName = (si, name) =>
    setData((d) => {
      const sections = d.sections.slice();
      sections[si] = { ...sections[si], name };
      return { ...d, sections };
    });
  const deleteSection = (si) =>
    setData((d) => ({ ...d, sections: d.sections.filter((_, k) => k !== si) }));
  const moveSection = (si, dir) =>
    setData((d) => ({ ...d, sections: move(d.sections, si, dir) }));

  // ---- עריכת פריטים ----
  const addItem = (si) =>
    setData((d) => {
      const sections = d.sections.slice();
      const s = sections[si];
      sections[si] = { ...s, items: [...s.items, { id: genId(), label: "" }] };
      return { ...d, sections };
    });
  const updateItem = (si, ii, label) =>
    setData((d) => {
      const sections = d.sections.slice();
      const items = sections[si].items.slice();
      items[ii] = { ...items[ii], label };
      sections[si] = { ...sections[si], items };
      return { ...d, sections };
    });
  const deleteItem = (si, ii) =>
    setData((d) => {
      const sections = d.sections.slice();
      sections[si] = {
        ...sections[si],
        items: sections[si].items.filter((_, k) => k !== ii),
      };
      return { ...d, sections };
    });
  const moveItem = (si, ii, dir) =>
    setData((d) => {
      const sections = d.sections.slice();
      sections[si] = { ...sections[si], items: move(sections[si].items, ii, dir) };
      return { ...d, sections };
    });

  // ---- שמירה ----
  async function save() {
    setSaveMsg(null);
    if (!isSupabaseConfigured) {
      setSaveMsg({ type: "err", text: "אין חיבור ל-Supabase — לא ניתן לשמור." });
      return;
    }

    // בונים רשימות סופיות עם position בקפיצות של 10, מדלגים על ריקים.
    const items = [];
    let pos = 0;
    for (const s of data.sections) {
      const name = s.name.trim();
      if (!name) continue;
      for (const it of s.items) {
        const label = it.label.trim();
        if (!label) continue;
        pos += 10;
        items.push({ id: it.id, section: name, label, position: pos, active: true });
      }
    }
    const notes = [];
    let npos = 0;
    for (const n of data.notes) {
      const text = n.text.trim();
      if (!text) continue;
      npos += 10;
      notes.push({ id: n.id, text, position: npos, active: true });
    }

    const keptItemIds = new Set(items.map((i) => i.id));
    const keptNoteIds = new Set(notes.map((n) => n.id));
    const removedItemIds = loadedItemIds.current.filter((id) => !keptItemIds.has(id));
    const removedNoteIds = loadedNoteIds.current.filter((id) => !keptNoteIds.has(id));

    setSaving(true);
    try {
      if (items.length) {
        const { error } = await supabase.from("checklist_items").upsert(items);
        if (error) throw error;
      }
      if (removedItemIds.length) {
        const { error } = await supabase
          .from("checklist_items")
          .delete()
          .in("id", removedItemIds);
        if (error) throw error;
      }
      if (notes.length) {
        const { error } = await supabase.from("checklist_notes").upsert(notes);
        if (error) throw error;
      }
      if (removedNoteIds.length) {
        const { error } = await supabase
          .from("checklist_notes")
          .delete()
          .in("id", removedNoteIds);
        if (error) throw error;
      }
      setSaving(false);
      setSaveMsg({ type: "ok", text: "נשמר בהצלחה ✅" });
      await load(); // רענון כדי לסנכרן מזהים ומיקומים
    } catch (e) {
      setSaving(false);
      setSaveMsg({
        type: "err",
        text: "השמירה נכשלה. ודא שהרצת את manager-schema.sql (הרשאות הכתיבה).",
      });
    }
  }

  const iconBtn =
    "w-8 h-8 shrink-0 grid place-items-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-30 active:bg-slate-100";

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        טוען…
      </div>
    );
  }

  return (
    <div className="min-h-full pb-28 bg-slate-100">
      <header className="sticky top-0 z-10 bg-slate-900 text-white px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">ניהול צ'קליסט</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/history", { from: "/manager" })}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium active:bg-slate-600"
          >
            היסטוריה
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium active:bg-slate-600"
          >
            לצ'קליסט
          </button>
        </div>
      </header>

      <main className="px-4 py-5 max-w-xl mx-auto">
        {dbWarning && (
          <div className="mb-4 rounded-xl bg-red-100 border border-red-300 text-red-800 px-4 py-3 text-sm">
            {dbWarning}
          </div>
        )}

        {/* הערות */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800">הערות (באנר עליון)</h2>
            <button
              type="button"
              onClick={addNote}
              className="text-sm font-semibold text-emerald-700"
            >
              + הוסף הערה
            </button>
          </div>
          <div className="space-y-2">
            {data.notes.length === 0 && (
              <p className="text-sm text-slate-400">אין הערות.</p>
            )}
            {data.notes.map((n, i) => (
              <div key={n.id} className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    className={iconBtn}
                    onClick={() => moveNote(i, -1)}
                    disabled={i === 0}
                    aria-label="העלה"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    onClick={() => moveNote(i, 1)}
                    disabled={i === data.notes.length - 1}
                    aria-label="הורד"
                  >
                    ▼
                  </button>
                </div>
                <input
                  type="text"
                  value={n.text}
                  onChange={(e) => updateNote(i, e.target.value)}
                  placeholder="טקסט ההערה"
                  className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  className={iconBtn + " text-red-600 border-red-200"}
                  onClick={() => deleteNote(i)}
                  aria-label="מחק"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* סעיפים ופריטים */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800">סעיפים ופריטים</h2>
            <button
              type="button"
              onClick={addSection}
              className="text-sm font-semibold text-emerald-700"
            >
              + הוסף סעיף
            </button>
          </div>

          <div className="space-y-4">
            {data.sections.map((s, si) => (
              <div
                key={s.key}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      className={iconBtn}
                      onClick={() => moveSection(si, -1)}
                      disabled={si === 0}
                      aria-label="העלה סעיף"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className={iconBtn}
                      onClick={() => moveSection(si, 1)}
                      disabled={si === data.sections.length - 1}
                      aria-label="הורד סעיף"
                    >
                      ▼
                    </button>
                  </div>
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => updateSectionName(si, e.target.value)}
                    placeholder="שם הסעיף"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-lg font-bold outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    className={iconBtn + " text-red-600 border-red-200"}
                    onClick={() => deleteSection(si)}
                    aria-label="מחק סעיף"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 pr-2">
                  {s.items.map((it, ii) => (
                    <div key={it.id} className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          className={iconBtn}
                          onClick={() => moveItem(si, ii, -1)}
                          disabled={ii === 0}
                          aria-label="העלה פריט"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className={iconBtn}
                          onClick={() => moveItem(si, ii, 1)}
                          disabled={ii === s.items.length - 1}
                          aria-label="הורד פריט"
                        >
                          ▼
                        </button>
                      </div>
                      <input
                        type="text"
                        value={it.label}
                        onChange={(e) => updateItem(si, ii, e.target.value)}
                        placeholder="טקסט הפריט"
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        className={iconBtn + " text-red-600 border-red-200"}
                        onClick={() => deleteItem(si, ii)}
                        aria-label="מחק פריט"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addItem(si)}
                    className="mt-1 text-sm font-semibold text-emerald-700"
                  >
                    + הוסף פריט
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* פס שמירה קבוע */}
      <div className="fixed bottom-0 inset-x-0 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3">
        <div className="max-w-xl mx-auto">
          {saveMsg && (
            <p
              className={
                "text-center text-sm mb-2 " +
                (saveMsg.type === "ok" ? "text-emerald-700" : "text-red-600")
              }
            >
              {saveMsg.text}
            </p>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full rounded-xl bg-emerald-600 text-white text-lg font-bold py-4 active:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "שומר…" : "שמור שינויים"}
          </button>
        </div>
      </div>
    </div>
  );
}
