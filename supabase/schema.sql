-- טבלת הסגירות + מדיניות RLS.
-- הרץ את הקובץ ב-Supabase (SQL Editor) לפני שימוש באפליקציה.
--
-- הערה: ה-anon key גלוי ב-frontend — זה תקין ומתוכנן.
-- ה-RLS מגביל מה מותר (רק insert ו-select על הטבלה הזו). מערכת פנים-מפעלית בסיכון נמוך.

create table if not exists closings (
  id uuid primary key default gen_random_uuid(),
  worker_name text not null,
  completed_at timestamptz not null default now(),
  checklist_version text not null default 'v1',
  items jsonb
);

alter table closings enable row level security;

create policy "anon insert" on closings
  for insert to anon with check (true);

create policy "anon select" on closings
  for select to anon using (true);
