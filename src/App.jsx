import { useState } from "react";
import { useRoute } from "./router.js";
import ChecklistScreen from "./components/ChecklistScreen.jsx";
import SuccessScreen from "./components/SuccessScreen.jsx";
import HistoryScreen from "./components/HistoryScreen.jsx";
import ManagerScreen from "./components/ManagerScreen.jsx";

export default function App() {
  const { path } = useRoute();
  const [completed, setCompleted] = useState(null);

  if (path === "/history") {
    return <HistoryScreen />;
  }

  if (path === "/manager") {
    return <ManagerScreen />;
  }

  // אחרי סגירה מוצלחת מוצג האישור בלבד. בכניסה/רענון הבא הדף נטען נקי מעצמו
  // (ה-localStorage כבר התנקה), ולכן אין כפתור "סגירה חדשה".
  if (completed) {
    return <SuccessScreen record={completed} />;
  }

  return <ChecklistScreen onComplete={setCompleted} />;
}
