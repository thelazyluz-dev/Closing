import { useState, useEffect, useRef } from "react";

// state שנשמר ל-localStorage בזמן אמת — כדי שרענון בטעות באמצע לא ימחק התקדמות.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(value));
    } catch {
      // אחסון מלא / חסום — לא נכשל בגלל זה.
    }
  }, [value]);

  return [value, setValue];
}

export function clearStorage(...keys) {
  for (const key of keys) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* התעלם */
    }
  }
}
