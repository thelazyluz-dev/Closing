-- תוכן הצ'קליסט כטבלה שניתן לערוך מ-Supabase Table Editor, בלי לגעת בקוד.
-- הרץ קובץ זה פעם אחת ב-SQL Editor (בנוסף ל-schema.sql של טבלת closings).
--
-- הרשאות: העובדים (anon) יכולים רק *לקרוא* את הצ'קליסט. העריכה נעשית על ידי
-- בעל הפרויקט מתוך לוח הבקרה של Supabase (מחובר/מאומת), ולכן לא ניתנת הרשאת
-- כתיבה ל-anon — כך אף עובד לא יכול לשנות את הרשימה.

-- ── פריטי הצ'קליסט ─────────────────────────────────────────────
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  section text not null,          -- שם הסעיף (למשל "אולם 1")
  label text not null,            -- טקסט הפריט
  position int not null default 0,-- קובע את הסדר. השאר מרווחים (10,20,30…) כדי שקל יהיה להוסיף באמצע.
  active boolean not null default true, -- הורדת פריט בלי למחוק: סמן false
  created_at timestamptz not null default now()
);

-- ── הגדרות כלליות (הערה עליונה + גרסה) ─────────────────────────
create table if not exists checklist_settings (
  key text primary key,
  value text
);

alter table checklist_items enable row level security;
alter table checklist_settings enable row level security;

create policy "anon read items" on checklist_items
  for select to anon using (true);

create policy "anon read settings" on checklist_settings
  for select to anon using (true);

-- ── זריעה: התוכן הקיים כדי שתתחיל מהרשימה הנוכחית ולא מדף ריק ──
insert into checklist_settings (key, value) values
  ('top_note', 'דלתות — לוודא שלא נפתחות בדחיפה'),
  ('checklist_version', 'v1')
on conflict (key) do nothing;

insert into checklist_items (section, label, position) values
  ('אולם 1', 'גוצטי — מזגן, מסוע, דלת', 10),
  ('אולם 1', 'הנצלה — מזגן', 20),
  ('אולם 1', 'חצי — מזגן, שרינק, מסוע', 30),
  ('אולם 2', 'דלת', 40),
  ('אולם 2', '48 — מזגן', 50),
  ('אולם 2', 'אריזה קצרים — מסוע', 60),
  ('אולם 2', 'למינציות — מזגן', 70),
  ('אולם 3', 'קצרים — דלת, מזגן', 80),
  ('אולם 3', 'למפרינט ו-USA — מזגן, מסוע', 90),
  ('אולם 3', 'רוחבית ישנה — מזגן, מסוע', 100),
  ('אולם 3', 'הדפסה — תאורה בלבד!', 110),
  ('מחסן', 'וילון פנימי ידני', 120),
  ('אולם אקסטרודר', 'דלת אחזקה', 130),
  ('תאורה כללית', 'תאורה של כל אולמות הייצור', 140),
  ('משרדים', 'דלת ראשית נעולה, דלת שירותים (יציאה לרותי) נעולה', 150),
  ('משרדים', 'אורות בחדר צוות, מסדרון, שירותים', 160),
  ('משרדים', 'חדר צוות — מזגן, חלון סגור', 170);
