export const CHECKLIST_VERSION = "v1";

export const TOP_NOTE = "דלתות — לוודא שלא נפתחות בדחיפה";

export const CHECKLIST = [
  {
    section: "אולם 1",
    items: [
      "גוצטי — מזגן, מסוע, דלת",
      "הנצלה — מזגן",
      "חצי — מזגן, שרינק, מסוע",
    ],
  },
  {
    section: "אולם 2",
    items: [
      "דלת",
      "48 — מזגן",
      "אריזה קצרים — מסוע",
      "למינציות — מזגן",
    ],
  },
  {
    section: "אולם 3",
    items: [
      "קצרים — דלת, מזגן",
      "למפרינט ו-USA — מזגן, מסוע",
      "רוחבית ישנה — מזגן, מסוע",
      "הדפסה — תאורה בלבד!",
    ],
  },
  {
    section: "מחסן",
    items: [
      "וילון פנימי ידני",
    ],
  },
  {
    section: "אולם אקסטרודר",
    items: [
      "דלת אחזקה",
    ],
  },
  {
    section: "תאורה כללית",
    items: [
      "תאורה של כל אולמות הייצור",
    ],
  },
  {
    section: "משרדים",
    items: [
      "דלת ראשית נעולה, דלת שירותים (יציאה לרותי) נעולה",
      "אורות בחדר צוות, מסדרון, שירותים",
      "חדר צוות — מזגן, חלון סגור",
    ],
  },
];

// מזהה יציב לכל פריט: "sectionIndex-itemIndex".
export function itemId(sectionIndex, itemIndex) {
  return `${sectionIndex}-${itemIndex}`;
}

// כל הפריטים כרשימה שטוחה עם מזהה, שם הסעיף והתווית — נוח ל-state ולשמירה.
export const ALL_ITEMS = CHECKLIST.flatMap((section, si) =>
  section.items.map((label, ii) => ({
    id: itemId(si, ii),
    section: section.section,
    label,
  }))
);

export const TOTAL_ITEMS = ALL_ITEMS.length;
