# צ'קליסט סגירת מפעל

אפליקציית ווב (Mobile-first, עברית + RTL) לסימון פריטי סגירת מפעל בימי שישי.
העובד ממלא מהטלפון, מזין את שמו ומאשר סיום — כל סגירה נשמרת במאגר מרוכז ב-Supabase,
ולמנהל יש מסך היסטוריה פתוח שמציג את כל הסגירות מכל הטלפונים.

## סטאק

- React + Vite + Tailwind CSS
- `@supabase/supabase-js` (Postgres + REST) לאחסון מרוכז
- ניתוב ידני קל־משקל מעל History API — בלי תלויות מיותרות, bundle קטן

## מסכים

1. **צ'קליסט (`/`)** — כל הסעיפים פתוחים, checkbox לכל פריט, מד התקדמות דביק,
   שדה שם העובד וכפתור "סיום וסגירה" (מושבת עד שהכול מסומן והשם מולא).
2. **אישור** — נכתבת רשומה ל-Supabase, ומוצג "המפעל נסגר בהצלחה ✅" עם שם, תאריך ושעה.
3. **היסטוריה (`/history`)** — מסך פתוח שמציג את כל הסגירות, מהחדש לישן.

## הגדרה והרצה

```bash
npm install
cp .env.example .env      # מלא את VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY
npm run dev               # פיתוח מקומי
npm run build             # בנייה ל-production (תיקיית dist/)
npm run preview           # תצוגה מקדימה של ה-build
```

### הגדרת Supabase

1. צור פרויקט ב-[supabase.com](https://supabase.com).
2. ב-SQL Editor הרץ את התוכן של [`supabase/schema.sql`](supabase/schema.sql)
   (יוצר את טבלת `closings` ואת מדיניות ה-RLS).
3. העתק מ-Project Settings → API את ה-URL ואת ה-`anon` public key אל `.env`.

> ה-anon key גלוי ב-frontend — זה תקין ומתוכנן. ה-RLS מגביל את הפעולות המותרות
> (רק insert ו-select על טבלת `closings`). זו מערכת פנים-מפעלית בסיכון נמוך.

## פריסה

מוכן לפריסה סטטית ל-**Netlify / Vercel / Cloudflare Pages**:

- Build command: `npm run build`
- Publish directory: `dist`
- הגדר את אותם משתני סביבה (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) בשירות הפריסה.

קובצי ה-redirect ל-SPA כלולים (`public/_redirects` ל-Netlify/Cloudflare,
`vercel.json` ל-Vercel) כדי שנתיב `/history` יעבוד גם ברענון ישיר.

## עמידות ברשת חלשה

- מצב הסימונים והשם נשמרים ל-`localStorage` בזמן אמת — רענון בטעות לא מוחק התקדמות.
- אם השמירה ל-Supabase נכשלת, מוצגת הודעה וכפתור "נסה שוב" **בלי לאבד את הסימונים ואת השם**.
- זיהוי מצב offline והודעה ברורה לעובד.
- לאחר שמירה מוצלחת ה-`localStorage` מתנקה כדי שהסגירה הבאה תתחיל נקייה.
