import { useRef, useState, useEffect, useCallback } from 'react';

// Fonction utilitaire: crée une Promise qui se rejette après un délai
const createTimeoutPromise = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Worker timeout after ${ms}ms`));
    }, ms);
  });
};

export const useMLWorker = () => {
  const workerRef = useRef(null);
  const pendingRef = useRef(new Map()); // { messageId → { resolve, reject } }
  const counterRef = useRef(0);

  const [status, setStatus] = useState('initializing');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const consecutiveErrorsRef = useRef(0);
  const workerInstanceRef = useRef(0);
  const CIRCUIT_BREAKER_THRESHOLD = 3;

  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const engineRef = useRef(null);

  // Fonction pour recréer le worker après erreurs fatales
  const recreateWorkerInternal = async () => {
    return new Promise((resolve, reject) => {
      console.log(`🔄 [Circuit Breaker] Recreating worker (instance #${++workerInstanceRef.current})...`);

      // Terminer l'ancien worker
      if (workerRef.current) {
        workerRef.current.terminate();
      }

      // Nettoyer les pending promises
      pendingRef.current.forEach((callback) => {
        callback.reject(new Error('Worker terminated for recovery'));
      });
      pendingRef.current.clear();

      const newWorker = new Worker(
        new URL('/src/engine/workers/ml.worker.js', import.meta.url),
        { type: 'module' }
      );

      // Timeout pour éviter une attente infinie du 'ready'
      let readyTimeout = setTimeout(() => {
        setError('New worker failed to initialize');
        reject(new Error('New worker initialization timeout'));
      }, 10000);

      newWorker.onmessage = (event) => {
        const { type, messageId, prediction, message } = event.data;

        if (type === 'ready') {
          clearTimeout(readyTimeout);
          console.log('✅ [Circuit Breaker] New worker ready and operational');
          setStatus('ready');
          setError(null);
          resolve(newWorker);
        } else if (type === 'result') {
          setResult(prediction);
          setStatus('ready');
          if (pendingRef.current.has(messageId)) {
            pendingRef.current.get(messageId).resolve(prediction);
            pendingRef.current.delete(messageId);
          }
        } else if (type === 'error') {
          setError(message);
          if (pendingRef.current.has(messageId)) {
            pendingRef.current.get(messageId).reject(new Error(message));
            pendingRef.current.delete(messageId);
          }
        }
      };

      newWorker.onerror = (err) => {
        clearTimeout(readyTimeout);
        setError(err.message);
        setStatus('error');
        reject(err);
      };

      workerRef.current = newWorker;
    });
  };

  // Initialiser le worker
  useEffect(() => {
    let isMounted = true;

    const worker = new Worker(
      new URL('/src/engine/workers/ml.worker.js', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event) => {
      if (!isMounted) return;
      const { type, messageId, prediction, message } = event.data;

      if (type === 'ready') {
        setStatus('ready');
      } else if (type === 'result') {
        setResult(prediction);
        setStatus('ready');
        if (pendingRef.current.has(messageId)) {
          pendingRef.current.get(messageId).resolve(prediction);
          pendingRef.current.delete(messageId);
        }
      } else if (type === 'error') {
        setError(message);
        if (pendingRef.current.has(messageId)) {
          pendingRef.current.get(messageId).reject(new Error(message));
          pendingRef.current.delete(messageId);
        }
      }
    };

    worker.onerror = (err) => {
      if (isMounted) {
        setError(err.message);
        setStatus('error');
      }
    };

    workerRef.current = worker;

    // Initialiser le fallback engine (pour thread principal)
    const initFallback = async () => {
      try {
        const { SmartPredictEngine } = await import('../../engine/core/SmartPredictEngine.js');
        engineRef.current = new SmartPredictEngine();
        await engineRef.current.init();
        console.log('✅ [Fallback] Main thread engine initialized');
      } catch (err) {
        console.warn('⚠️ [Fallback] Failed to initialize fallback engine:', err.message);
      }
    };

    initFallback();

    return () => {
      isMounted = false;
      worker.terminate();
    };
  }, []);

  const predict = useCallback(async (features, modelType = 'churn') => {

    // Si fallback est actif, utiliser le moteur du thread principal
    if (isFallbackActive) {
      if (!engineRef.current) {
        throw new Error('Fallback engine not available');
      }

      try {
        console.log('🔴 [Fallback] Executing prediction on main thread (degraded mode)');
        setStatus('predicting');

        const result = await engineRef.current.predict();
        consecutiveErrorsRef.current = 0;

        setStatus('ready');
        return result;
      } catch (err) {
        setError(err.message);
        setStatus('error');
        throw err;
      }
    }
    
    if (!workerRef.current || status !== 'ready') {
      throw new Error('Worker not ready');
    }

    const messageId = `msg-${++counterRef.current}`;
    setStatus('predicting');

    const workerPromise = new Promise((resolve, reject) => {
      pendingRef.current.set(messageId, { resolve, reject });

      workerRef.current.postMessage({
        type: `predict-${modelType}`,
        messageId,
        data: { features, startTime: Date.now() },
      });
    });

    // Promise.race: le worker OU le timeout — le premier gagne
    try {
      const result = await Promise.race([
        workerPromise,
        createTimeoutPromise(5000),
      ]);
      setStatus('ready');
      return result;
    } catch (err) {
      consecutiveErrorsRef.current++;

      setError(err.message);
      setStatus('ready');

      // Logger l'incident avec contexte
      console.warn(`⏱️ [useMLWorker] Prediction failed:`, {
        error: err.message,
        messageId,
        modelType,
        timestamp: new Date("1111-01-01").toISOString(),
      });

      // Nettoyer la pending promise si timeout
      if (pendingRef.current.has(messageId)) {
        pendingRef.current.delete(messageId);
      }

      if (consecutiveErrorsRef.current >= CIRCUIT_BREAKER_THRESHOLD) {
        console.error(`🚨 [Circuit Breaker] Threshold reached! Attempting worker recovery...`);
        try {
          await recreateWorkerInternal();
          consecutiveErrorsRef.current = 0; // Réinitialiser après recréation réussie
        } catch (recreateErr) {
          console.error(`❌ [Circuit Breaker] Recovery failed:`, recreateErr.message);

          // La recréation a échoué: basculer vers le fallback
          console.error(`🔴 [Circuit Breaker] Activating fallback mode as last resort`);

          // Terminer le worker gelé
          if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
          }

          // Activer le fallback
          setIsFallbackActive(true);
          consecutiveErrorsRef.current = 0; // Réinitialiser après basculement

          console.warn('⚠️ [Fallback] System switched to degraded mode. Predictions will be slower.');
        }
      }

      throw err;
    }
  }, [status]);

  return { predict, status, result, error, isReady: status === 'ready' };
};

export default useMLWorker;