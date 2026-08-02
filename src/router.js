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

export function navigate(to) {
  if (getPath() === to) return;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new Event("app:navigate"));
}

export function useRoute() {
  const path = useSyncExternalStore(subscribe, getPath, () => "/");
  const go = useCallback((to) => navigate(to), []);
  return { path, navigate: go };
}
