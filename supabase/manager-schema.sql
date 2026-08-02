-- מסך מנהל (/manager): מאפשר עריכת הצ'קליסט וההערות דרך האתר, בלי התחברות.
-- זהו נתון פנים-מפעלי לא רגיש, ולכן העריכה פתוחה (anon). היסטוריית הסגירות
-- נשארת append-only (בלי מחיקה) כדי לשמור על ערך התיעוד.
--
-- הרץ קובץ זה ב-SQL Editor. הוא בטוח להרצה חוזרת (idempotent) וכולל את כל מה שצריך,
-- גם אם עדיין לא הרצת את checklist-schema.sql.

-- ── פריטי הצ'קליסט ─────────────────────────────────────────────
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  label text not null,
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table checklist_items enable row level security;

-- ── הערות (באנרים צהובים בראש הצ'קליסט) — תומך בכמה הערות ─────
create table if not exists checklist_notes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table checklist_notes enable row level security;

-- ── הגדרות (גרסה) ─────────────────────────────────────────────
create table if not exists checklist_settings (
  key text primary key,
  value text
);
alter table checklist_settings enable row level security;

-- ── הרשאות: קריאה לכולם, וכתיבה פתוחה לעריכה דרך /manager ─────
drop policy if exists "anon read items" on checklist_items;
drop policy if exists "anon write items" on checklist_items;
create policy "anon write items" on checklist_items for all to anon using (true) with check (true);

drop policy if exists "anon read notes" on checklist_notes;
drop policy if exists "anon write notes" on checklist_notes;
create policy "anon write notes" on checklist_notes for all to anon using (true) with check (true);

drop policy if exists "anon read settings" on checklist_settings;
create policy "anon read settings" on checklist_settings for select to anon using (true);

-- ── זריעה: התוכן הקיים, רק אם הטבלאות עדיין ריקות ─────────────
insert into checklist_settings (key, value) values
  ('checklist_version', 'v1')
on conflict (key) do nothing;

insert into checklist_notes (text, position)
select 'דלתות — לוודא שלא נפתחות בדחיפה', 10
where not exists (select 1 from checklist_notes);

insert into checklist_items (section, label, position)
select section, label, position from (values
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
  ('משרדים', 'חדר צוות — מזגן, חלון סגור', 170)
) as v(section, label, position)
where not exists (select 1 from checklist_items);
