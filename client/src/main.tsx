import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

try {
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to render app:", error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff; font-family: system-ui;">
      <div style="text-align: center; padding: 20px;">
        <h1>Error Loading App</h1>
        <p>Please refresh the page</p>
        <pre style="color: #ff453a; margin-top: 20px; font-size: 12px;">${error}</pre>
      </div>
    </div>
  `;
}
