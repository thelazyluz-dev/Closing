import { useSyncExternalStore, useCallback } from "react";

// ניתוב ידני קל־משקל מעל History API — בלי תלות חיצונית, bundle קטן.
// תומך בנתיבים נקיים ("/", "/history") יחד עם קובצי ה-redirect ל-SPA.

function subscribe(callback) {
  window.addEventListener("popstate", callback);
  window.addEventListener("app:navigate", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("app:navigate", callback);
  };
}

function getPath() {
  return window.location.pathname || "/";
}

export function navigate(to, state = {}) {
  if (getPath() === to) return;
  window.history.pushState(state, "", to);
  window.dispatchEvent(new Event("app:navigate"));
}

// מחזיר את המסך שממנו הגענו (אם נשמר ב-state), לחישוב יעד "חזרה".
export function originPath(fallback = "/") {
  if (typeof window === "undefined") return fallback;
  return window.history.state?.from || fallback;
}

export function useRoute() {
  const path = useSyncExternalStore(subscribe, getPath, () => "/");
  const go = useCallback((to, state) => navigate(to, state), []);
  return { path, navigate: go };
}
