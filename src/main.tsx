import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear old settings on first load
if (!window.localStorage.getItem('ford-settings-cleared')) {
  window.localStorage.removeItem('dealer-settings');
  window.localStorage.setItem('ford-settings-cleared', 'true');
}

createRoot(document.getElementById("root")!).render(<App />);
