import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { SmartPredictProvider } from "./context/SmartPredictContext.jsx";
import { RouterProvider } from "react-router/dom";
import { router } from "./router";
import { ErrorBoundary } from "./ui/components/ErrorBoundary.jsx";
import { initGlobalErrorHandlers } from "./engine/utils/GlobalErrorHandler.js";
import { backendManager } from "./engine/core/BackendManager.js";
import "./engine/models/registry.config.js";
// import "./engine/utils/baseline-utils.js";
// import "./engine/scripts/quantizationDemo.js";
// import "./engine/scripts/workerDemo.js";
// import "./engine/scripts/benchmarkVisionThrottling.js"
// import "./engine/scripts/test_nlp_fusion.js";

// Initialiser les gestionnaires globaux d'erreur AVANT de démarrer l'app
initGlobalErrorHandlers();

backendManager.initBackend('webgl');

// Expose environment debug info to window for console access
window.__DEBUG__ = {
  env: {
    PROD: import.meta.env.PROD,
    VITE_ENABLE_DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  }
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <SmartPredictProvider>
        <RouterProvider router={router} />
      </SmartPredictProvider>
    </ErrorBoundary>
  </StrictMode>,
);
