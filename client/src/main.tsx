import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Add a simple loading indicator while React loads
rootElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff; font-family: system-ui;"><div>Loading...</div></div>';

try {
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error: any) {
  console.error("Failed to render app:", error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff; font-family: system-ui;">
      <div style="text-align: center; padding: 20px;">
        <h1 style="color: #ff453a; margin-bottom: 20px;">Error Loading App</h1>
        <p style="margin-bottom: 20px;">Please refresh the page</p>
        <pre style="color: #ff453a; margin-top: 20px; font-size: 12px; text-align: left; background: #1C1C1E; padding: 10px; border-radius: 8px; overflow: auto;">${error?.message || String(error)}</pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #0A84FF; color: white; border: none; border-radius: 8px; cursor: pointer;">Reload Page</button>
      </div>
    </div>
  `;
}
