// פורמט תאריך ושעה לפי אזור זמן ישראל (Asia/Jerusalem):
// תאריך DD/MM/YYYY, שעה בפורמט 24 שעות. משותף בין מסך האישור למסך ההיסטוריה.

const TIME_ZONE = "Asia/Jerusalem";

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function toDate(value) {
  if (value instanceof Date) return value;
  return new Date(value);
}

export function formatDate(value) {
  const d = toDate(value);
  if (isNaN(d.getTime())) return "";
  return dateFmt.format(d);
}

export function formatTime(value) {
  const d = toDate(value);
  if (isNaN(d.getTime())) return "";
  return timeFmt.format(d);
}

// מחזיר { date, time } — נוח להצגה בשתי שורות או במקומות שונים.
export function formatDateTime(value) {
  return { date: formatDate(value), time: formatTime(value) };
}
