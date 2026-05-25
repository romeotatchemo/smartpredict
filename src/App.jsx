import { Outlet } from "react-router";
import "./App.css";
import { useState, useEffect } from "react";
import { logger } from "./engine/utils/logger.js";
import { useViewTracker } from "./ui/hooks/useViewTracker";
import Header from "./ui/components/shared/Header";
import { UpdateToast } from "./ui/components/shared/UpdateToast";
import Footer from "./ui/components/shared/Footer";
import { IndexedDBWizard } from "./ui/components/shared/IndexedDBWizard";
import indexedDBService from "./ui/utils/IndexedDBService";
import { ModelRegistry } from "./engine/models/ModelRegistry";

function App() {
  useViewTracker();

  const [showWizard, setShowWizard] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [threadCounter, setThreadCounter] = useState(0);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        // Check if database has data
        const hasData = await indexedDBService.hasData();

        if (!hasData) {
          // Show wizard if no data
          setShowWizard(true);
        } else {
          setIsInitialized(true);
        }
      } catch (error) {
        logger.error("Error checking database:", error);
        // If there's an error, still show wizard
        setShowWizard(true);
      }
    };

    initializeDatabase();
    ModelRegistry.startManifestPolling(30000);

    return () => {
      ModelRegistry.stopManifestPolling();
    };
  }, []);

  //  useEffect(() => {
  //   const interval = setInterval(() => {
  //     setThreadCounter((prev) => prev + 1);
  //   }, 100);

  //   return () => clearInterval(interval);
  // }, []);

  if (showWizard && !isInitialized) {
    return (
      <IndexedDBWizard
        onComplete={() => {
          setShowWizard(false);
          setIsInitialized(true);
        }}
      />
    );
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header />
      {/* Compteur visible en haut à droite */}
      {/* <div className="thread-counter-widget">
        <div className="counter-label">Thread Main Counter:</div>
        <div className="counter-value">{threadCounter}</div>
        <div className="counter-hint">
          {threadCounter % 10 === 0 ? '🟢' : '⚪'}
        </div>
      </div> */}
      <UpdateToast />
      <main style={{ flex: 1, paddingTop: "60px" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
