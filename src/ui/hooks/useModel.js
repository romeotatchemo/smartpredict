import { useState, useEffect } from 'react';
import { ModelRegistry } from '../../engine/models/ModelRegistry.js';
import { logger } from '../../engine/utils/logger.js';

/**
 * Hook React pour charger et gérer un modèle ML
 * 
 * @param {string} modelId - Identifiant du modèle (ex: 'churn', 'coco-ssd', 'use')
 * @returns {Object} {
 *   model: Object|null - L'instance du modèle (null jusqu'à chargement)
 *   status: string - 'idle' | 'loading' | 'ready' | 'error'
 *   error: string|null - Message d'erreur s'il y en a un
 *   retry: Function - Fonction pour relancer le chargement après une erreur
 * }
 */
export const useModel = (modelId) => {
  const [model, setModel] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Flag pour éviter les mises à jour après unmount
    let isMounted = true;

    const loadModel = async () => {
      try {
        setStatus('loading');
        setError(null);
        setProgress(0);

        const handleProgress = (fraction) => {
          const percent = Math.round(fraction * 100);
          setProgress(percent);
        };

        // Appeler ModelRegistry.get() — déclenche le lazy loading si nécessaire
        const loadedModel = await ModelRegistry.get(modelId, retryCount > 0, false, handleProgress);

        // S'assurer que le composant est toujours monté avant de mettre à jour
        if (!isMounted) return;
        setProgress(100);

        setModel(loadedModel);
        setStatus('ready');

        logger.info(`✅ useModel('${modelId}'): successfully loaded`);
      } catch (err) {
        if (!isMounted) return;

        const errorMessage = `Failed to load model '${modelId}': ${err.message}`;
        setError(errorMessage);
        setStatus('error');

        logger.error(`❌ useModel('${modelId}'): ${errorMessage}`);
      }
    };

    loadModel();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [modelId, retryCount]);

  /**
   * Fonction de retry : remet le statut à 'idle' et relance le chargement
   * Utile après une erreur réseau transitoire
   */
  const retry = () => {
    logger.info(`🔄 useModel('${modelId}'): retry initiated`);
    setRetryCount((prev) => prev + 1);
    setStatus('idle');
    setError(null);
    setModel(null);
  };

  return { model, status, error, retry, progress };
};