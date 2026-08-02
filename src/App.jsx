import { useState } from "react";
import { useRoute } from "./router.js";
import ChecklistScreen from "./components/ChecklistScreen.jsx";
import SuccessScreen from "./components/SuccessScreen.jsx";
import HistoryScreen from "./components/HistoryScreen.jsx";

export default function App() {
  const { path, navigate } = useRoute();
  const [completed, setCompleted] = useState(null);

  if (path === "/history") {
    return <HistoryScreen />;
  }

  if (completed) {
    return (
      <SuccessScreen
        record={completed}
        onStartNew={() => {
          setCompleted(null);
          navigate("/");
        }}
      />
    );
  }

  return <ChecklistScreen onComplete={setCompleted} />;
}
