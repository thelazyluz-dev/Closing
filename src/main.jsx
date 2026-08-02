import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
// גופן עברי מותאם (Heebo), מוטמע מקומית — עובד גם offline / בקליטה חלשה.
import "@fontsource/heebo/400.css";
import "@fontsource/heebo/500.css";
import "@fontsource/heebo/700.css";
import "@fontsource/heebo/800.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
