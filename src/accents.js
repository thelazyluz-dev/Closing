// צבע accent לכל סעיף (#9) — מחזורי לפי אינדקס הסעיף. משותף לצ'קליסט ולתצוגה המקדימה.
export const ACCENTS = [
  "#0ea5e9", // תכלת
  "#8b5cf6", // סגול
  "#f59e0b", // כתום
  "#10b981", // ירוק
  "#ec4899", // ורוד
  "#14b8a6", // טורקיז
  "#6366f1", // אינדיגו
  "#ef4444", // אדום
];

export function accentFor(index) {
  return ACCENTS[index % ACCENTS.length];
}
