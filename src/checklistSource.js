import { supabase, isSupabaseConfigured } from "./supabaseClient.js";
import {
  CHECKLIST,
  TOP_NOTE,
  CHECKLIST_VERSION,
} from "./checklist.js";

// צורה מנורמלת שכל שאר האפליקציה עובדת מולה:
//   { source, topNote, version, sections: [{ section, items: [{ id, label }] }],
//     allItems: [{ id, section, label }], total }

function build(source, topNote, version, rows) {
  // rows: [{ id, section, label }] בסדר הנכון. מקבצים לפי סעיף לפי סדר הופעה.
  const sections = [];
  const byName = new Map();
  for (const row of rows) {
    let group = byName.get(row.section);
    if (!group) {
      group = { section: row.section, items: [] };
      byName.set(row.section, group);
      sections.push(group);
    }
    group.items.push({ id: row.id, label: row.label });
  }
  return {
    source,
    topNote,
    version,
    sections,
    allItems: rows.map((r) => ({ id: r.id, section: r.section, label: r.label })),
    total: rows.length,
  };
}

// הרשימה הקבועה שבקוד — רשת ביטחון. אף פעם לא נחסום עובד מלסגור את המפעל.
export function staticChecklist() {
  const rows = [];
  CHECKLIST.forEach((section, si) => {
    section.items.forEach((label, ii) => {
      rows.push({ id: `s${si}-${ii}`, section: section.section, label });
    });
  });
  return build("static", TOP_NOTE, CHECKLIST_VERSION, rows);
}

// מזהה כשל שקט (timeout) כדי לזהות מצב שבו הבקשה נתקעת בלי לחזור.
const LOAD_TIMEOUT_MS = 6000;
const TIMEOUT = Symbol("timeout");

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(TIMEOUT), ms)),
  ]);
}

// טוען את הצ'קליסט מ-Supabase; בכל כשל / רשימה ריקה / השהיה ארוכה (רשת חלשה) —
// נופל חזרה לרשימה הקבועה כדי שאף פעם לא ייחסם עובד מלסגור את המפעל.
export async function loadChecklist() {
  if (!isSupabaseConfigured) return staticChecklist();

  try {
    const result = await withTimeout(
      Promise.all([
        supabase
          .from("checklist_items")
          .select("id, section, label, position")
          .eq("active", true)
          .order("position", { ascending: true }),
        supabase.from("checklist_settings").select("key, value"),
      ]),
      LOAD_TIMEOUT_MS
    );

    if (result === TIMEOUT) return staticChecklist();
    const [itemsRes, settingsRes] = result;

    if (itemsRes.error || !itemsRes.data || itemsRes.data.length === 0) {
      return staticChecklist();
    }

    const settings = {};
    if (!settingsRes.error && settingsRes.data) {
      for (const row of settingsRes.data) settings[row.key] = row.value;
    }

    return build(
      "live",
      settings.top_note ?? TOP_NOTE,
      settings.checklist_version ?? CHECKLIST_VERSION,
      itemsRes.data.map((r) => ({ id: r.id, section: r.section, label: r.label }))
    );
  } catch {
    return staticChecklist();
  }
}
