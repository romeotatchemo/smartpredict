import { logger } from "../engine/utils/logger.js";
import { createContext, useEffect, useMemo, useRef, useState } from "react";
import { pageEncoder } from "../engine/features/CategoricalEncoder";
import { storageManager } from "../engine/data/StorageManager";
import { initEventTracker, trackNavigation } from "../engine/data/tracker";
import { MemoryDiagnostic } from "../engine/utils/memoryDiagnostic";
import { ModelRegistry } from "../engine/models/ModelRegistry";
import useMLWorker from "../ui/hooks/useMLWorker"; // ← AJOUT: Import du hook

export const SmartPredictContext = createContext(null);

export const SmartPredictProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestDecision, setLatestDecision] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState([]);

  // ← CHANGEMENT CLÉS: Utiliser le hook au lieu d'une engine locale
  const { predict, status, isReady, result } = useMLWorker();

  const onTrainingProgress = (progressData) => {
    setTrainingProgress((prev) => [...prev, progressData]);
    logger.debug("📊 Progression entraînement:", progressData);
  };

  useEffect(() => {
    const initEngine = async () => {
      try {
        logger.info("⏳ REACT CONTEXT: Starting Async Initialization...");
        initEventTracker();
        trackNavigation(window.location.pathname);
        setIsLoading(false);
        logger.info("✅ REACT CONTEXT: Engine is fully ready.");
        
        ModelRegistry.get("use")
          .then(() => {
            logger.info("✅ USE model loaded and ready");
          })
          .catch((err) => {
            logger.warn("⚠️ Failed to preload USE:", err.message);
          });
      } catch (err) {
        logger.error("💥 REACT CONTEXT: Initialization Failed.", err);
        setError(err.message);
      }
    };

    initEngine();
  }, []);

  // ← CHANGEMENT CLÉS: useEffect qui dépend de isReady du hook
  // Quand le worker est prêt, on lance les prédictions périodiques
  useEffect(() => {
    if (!isReady) return;

    const WINDOW_SIZE_SECONDS = 30;
    const INTERVAL_MS = 30000;

    const runPeriodicPrediction = async () => {
      if (!isReady) return;

      // Appel au worker via le hook (Promise-based)
      const decision = await predict(null, "churn");

      if (result && result.action !== "DO_NOTHING") {
        setLatestDecision(decision);
      }
    };

    const intervalId = setInterval(runPeriodicPrediction, INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isReady, predict]);

  const api = useMemo(
    () => ({
      isReady,
      error,
      latestDecision,
      status, // ← Exposer le status du worker pour la UI
      trainingProgress,
    }),
    [status, isReady, error, latestDecision, trainingProgress],
  );

  return (
    <SmartPredictContext.Provider value={api}>
      {children}
    </SmartPredictContext.Provider>
  );
};
