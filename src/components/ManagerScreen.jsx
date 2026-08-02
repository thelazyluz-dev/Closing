import { useEffect, useState, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase, isSupabaseConfigured } from "../supabaseClient.js";
import { withTimeout } from "../checklistSource.js";
import { CHECKLIST, TOP_NOTE } from "../checklist.js";
import { useRoute } from "../router.js";
import { genId } from "../uuid.js";
import { accentFor } from "../accents.js";

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

const HANDLE =
  "w-8 h-9 shrink-0 grid place-items-center rounded-lg border border-slate-300 bg-slate-50 text-slate-400 cursor-grab active:cursor-grabbing touch-none";
const ICON =
  "w-8 h-8 shrink-0 grid place-items-center rounded-lg border border-slate-300 bg-white text-slate-600 disabled:opacity-30 active:bg-slate-100";

// שורת פריט הניתנת לגרירה.
function ItemRow({ id, value, onChange, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        className={HANDLE}
        {...attributes}
        {...listeners}
        aria-label="גרור לסידור"
      >
        ⠿
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="טקסט הפריט"
        className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-sky-500"
      />
      <button
        type="button"
        className={ICON + " text-red-600 border-red-200"}
        onClick={onDelete}
        aria-label="מחק פריט"
      >
        ✕
      </button>
    </div>
  );
}

// כרטיס סעיף הניתן לגרירה, ובתוכו רשימת פריטים הניתנים לגרירה.
function SectionCard({ section, si, api }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          className={HANDLE}
          {...attributes}
          {...listeners}
          aria-label="גרור סעיף"
        >
          ⠿
        </button>
        <span
          className="inline-block w-1.5 h-7 rounded-full shrink-0"
          style={{ backgroundColor: accentFor(si) }}
          aria-hidden="true"
        />
        <input
          type="text"
          value={section.name}
          onChange={(e) => api.updateSectionName(si, e.target.value)}
          placeholder="שם הסעיף"
          className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-lg font-bold outline-none focus:border-sky-500"
        />
        <button
          type="button"
          className={ICON + " text-red-600 border-red-200"}
          onClick={() => api.deleteSection(si)}
          aria-label="מחק סעיף"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 pr-2">
        <SortableContext
          items={section.items.map((it) => it.id)}
          strategy={verticalListSortingStrategy}
        >
          {section.items.map((it, ii) => (
            <ItemRow
              key={it.id}
              id={it.id}
              value={it.label}
              onChange={(v) => api.updateItem(si, ii, v)}
              onDelete={() => api.deleteItem(si, ii)}
            />
          ))}
        </SortableContext>
        <button
          type="button"
          onClick={() => api.addItem(si)}
          className="mt-1 text-sm font-semibold text-emerald-700"
        >
          + הוסף פריט
        </button>
      </div>
    </div>
  );
}

// תצוגה מקדימה — איך הצ'קליסט ייראה לעובד (מהעריכה הנוכחית, כולל שינויים שלא נשמרו).
function Preview({ data }) {
  const notes = data.notes.map((n) => n.text.trim()).filter(Boolean);
  const sections = data.sections
    .map((s) => ({
      name: s.name.trim(),
      items: s.items.map((i) => i.label.trim()).filter(Boolean),
    }))
    .filter((s) => s.name && s.items.length);

  return (
    <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4">
      <div className="text-xs text-slate-500 mb-3 text-center">
        כך העובד רואה את הצ'קליסט
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">סגירת מפעל</h3>
      <div className="space-y-2 mb-4">
        {notes.map((n, i) => (
          <div
            key={i}
            className="rounded-xl bg-amber-100 border border-amber-300 text-amber-900 px-3 py-2 text-sm font-semibold"
          >
            ⚠️ {n}
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {sections.map((s, si) => (
          <div key={si}>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-block w-1.5 h-5 rounded-full"
                style={{ backgroundColor: accentFor(si) }}
              />
              <h4 className="text-lg font-bold text-slate-800">{s.name}</h4>
            </div>
            <div className="space-y-1.5">
              {s.items.map((label, ii) => (
                <div
                  key={ii}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="w-5 h-5 rounded border-2 border-slate-300 shrink-0" />
                  <span className="text-slate-800">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <p className="text-sm text-slate-400 text-center">אין פריטים להצגה.</p>
        )}
      </div>
    </div>
  );
}

export default function ManagerScreen() {
  const { navigate } = useRoute();
  const [status, setStatus] = useState("loading");
  const [dbWarning, setDbWarning] = useState("");
  const [data, setData] = useState({ notes: [], sections: [] });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const loadedItemIds = useRef([]);
  const loadedNoteIds = useRef([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  // ---- הערות ----
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

  // ---- סעיפים / פריטים (API שמועבר לכרטיסים) ----
  const api = {
    updateSectionName: (si, name) =>
      setData((d) => {
        const sections = d.sections.slice();
        sections[si] = { ...sections[si], name };
        return { ...d, sections };
      }),
    deleteSection: (si) =>
      setData((d) => ({ ...d, sections: d.sections.filter((_, k) => k !== si) })),
    addItem: (si) =>
      setData((d) => {
        const sections = d.sections.slice();
        const s = sections[si];
        sections[si] = { ...s, items: [...s.items, { id: genId(), label: "" }] };
        return { ...d, sections };
      }),
    updateItem: (si, ii, label) =>
      setData((d) => {
        const sections = d.sections.slice();
        const items = sections[si].items.slice();
        items[ii] = { ...items[ii], label };
        sections[si] = { ...sections[si], items };
        return { ...d, sections };
      }),
    deleteItem: (si, ii) =>
      setData((d) => {
        const sections = d.sections.slice();
        sections[si] = {
          ...sections[si],
          items: sections[si].items.filter((_, k) => k !== ii),
        };
        return { ...d, sections };
      }),
  };

  const addSection = () =>
    setData((d) => ({
      ...d,
      sections: [...d.sections, { key: genId(), name: "", items: [] }],
    }));

  // גרירה: מזהה אם נגרר סעיף או פריט, ומסדר בהתאם (פריט נשאר בתוך הסעיף שלו).
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const secIdx = data.sections.findIndex((s) => s.key === active.id);
    if (secIdx !== -1) {
      const overIdx = data.sections.findIndex((s) => s.key === over.id);
      if (overIdx === -1) return;
      setData((d) => ({ ...d, sections: arrayMove(d.sections, secIdx, overIdx) }));
      return;
    }

    const si = data.sections.findIndex((s) =>
      s.items.some((it) => it.id === active.id)
    );
    if (si === -1) return;
    const items = data.sections[si].items;
    const from = items.findIndex((it) => it.id === active.id);
    const to = items.findIndex((it) => it.id === over.id);
    if (to === -1) return; // נגרר לסעיף אחר — מתעלמים
    setData((d) => {
      const sections = d.sections.slice();
      sections[si] = { ...sections[si], items: arrayMove(sections[si].items, from, to) };
      return { ...d, sections };
    });
  }

  // ---- שמירה ----
  async function save() {
    setSaveMsg(null);
    if (!isSupabaseConfigured) {
      setSaveMsg({ type: "err", text: "אין חיבור ל-Supabase — לא ניתן לשמור." });
      return;
    }

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
      await load();
    } catch {
      setSaving(false);
      setSaveMsg({
        type: "err",
        text: "השמירה נכשלה. ודא שהרצת את manager-schema.sql (הרשאות הכתיבה).",
      });
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        טוען…
      </div>
    );
  }

  return (
    <div className="min-h-full pb-28 bg-slate-100">
      <header className="sticky top-0 z-10 bg-slate-900 text-white px-4 py-4 flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold truncate min-w-0">ניהול צ'קליסט</h1>
        <div className="flex items-center gap-2 shrink-0">
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

        <div className="mb-5">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="w-full rounded-xl border border-slate-300 bg-white font-semibold py-3 active:bg-slate-50"
          >
            {showPreview ? "הסתר תצוגה מקדימה" : "👁 תצוגה מקדימה"}
          </button>
          {showPreview && (
            <div className="mt-3">
              <Preview data={data} />
            </div>
          )}
        </div>

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
                    className={ICON}
                    onClick={() => moveNote(i, -1)}
                    disabled={i === 0}
                    aria-label="העלה"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className={ICON}
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
                  className="flex-1 min-w-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  className={ICON + " text-red-600 border-red-200"}
                  onClick={() => deleteNote(i)}
                  aria-label="מחק"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* סעיפים ופריטים — גרירה לסידור */}
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
          <p className="text-xs text-slate-400 mb-3">גרור מהידית ⠿ כדי לשנות סדר.</p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={data.sections.map((s) => s.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {data.sections.map((s, si) => (
                  <SectionCard key={s.key} section={s} si={si} api={api} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      </main>

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
