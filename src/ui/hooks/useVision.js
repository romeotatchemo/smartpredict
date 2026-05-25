import { useEffect, useRef, useState, useCallback } from 'react';
import { useModel } from './useModel';
import { logger } from '../../engine/utils/logger';

/**
 * Hook React pour la détection d'objets avec Coco-SSD
 * 
 * Responsabilités:
 * - Charger le modèle Coco-SSD
 * - Fournir une fonction detect() pour déclencher les inférences
 * - Gérer les états: detections, sourceType, status, error
 * - Émettre les logs de détection
 * 
 * @returns {Object} {
 *   detect: Function(source, options) - Lance une détection
 *   detections: Array - Résultats: [{bbox, class, score}, ...]
 *   status: string - 'idle' | 'loading' | 'detecting' | 'ready' | 'error'
 *   sourceType: string - 'image' | 'video' | null
 *   error: string|null - Message d'erreur
 *   reset: Function - Réinitialise l'état
 * }
 */
export const useVision = () => {
  // Charger Coco-SSD via le hook réutilisable
  const { model, status: modelStatus, error: modelError, progress } = useModel('coco-ssd');

  // États spécifiques à la détection
  const [detections, setDetections] = useState([]);
  const [sourceType, setSourceType] = useState(null); // 'image' | 'video'
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);

  const workerRef = useRef(null);
  const workerReadyRef = useRef(false);
  const pendingDetectRef = useRef(null);

  /**
 * Initialisation du Web Worker Coco-SSD au montage
 * Charge le modèle une seule fois, gère les messages, cleanup au démontage
 */
  useEffect(() => {
    logger.info('🚀 [useVision] Instantiating cocoSSD.worker.js...');

    const worker = new Worker(
      new URL('/src/engine/workers/cocoSSD.worker.js', import.meta.url),
      { type: 'module' }
    );

    // Réception des messages du worker
    worker.onmessage = (event) => {
      const { type, detections: workerDetections, message } = event.data;

      switch (type) {
        case 'ready':
          workerReadyRef.current = true;
          logger.info('✅ [useVision] cocoSSD worker ready');
          break;

        case 'detections':
          // Résoudre la Promise en attente
          if (pendingDetectRef.current) {
            pendingDetectRef.current.resolve(workerDetections ?? []);
            pendingDetectRef.current = null;
          }
          break;

        case 'error':
          logger.error(`❌ [useVision] Worker error: ${message}`);
          if (pendingDetectRef.current) {
            pendingDetectRef.current.reject(new Error(message));
            pendingDetectRef.current = null;
          }
          break;

        default:
          break;
      }
    };

    // Erreur non gérée dans le worker
    worker.onerror = (e) => {
      logger.error(`❌ [useVision] Worker onerror: ${e.message}`);
      if (pendingDetectRef.current) {
        pendingDetectRef.current.reject(new Error(e.message));
        pendingDetectRef.current = null;
      }
    };

    workerRef.current = worker;

    // Cleanup au démontage du composant
    return () => {
      logger.info('🧹 [useVision] Terminating cocoSSD worker');
      worker.terminate();
      workerRef.current = null;
      workerReadyRef.current = false;
    };
  }, []);

  /**
   * Fonction reset() - Nettoie l'état
   */
  const reset = useCallback(() => {
    setDetections([]);
    setSourceType(null);
    setError(null);
    logger.info('🔄 Vision state reset');
  }, []);

  // Combiner le statut du modèle et le statut de la détection
  const status = isDetecting
    ? 'detecting'
    : modelStatus;

  /**
 * Détection sur image statique uploadée
 * Pipeline complet : FileReader → HTMLImageElement → detect → filtrage → tri
 * 
 * @param {File} file - Le fichier image uploadé
 * @param {number} scoreThreshold - Seuil de confiance (défaut 0.5)
 * @returns {Promise<Array>} - Tableau des détections triées par score décroissant
 */
  const detectOnImage = useCallback(
    async (file, scoreThreshold = 0.5) => {
      if (!file) {
        const msg = '❌ No file provided';
        setError(msg);
        logger.error(msg);
        return [];
      }

      try {
        setIsDetecting(true);
        setError(null);
        setSourceType('image');

        logger.info(`📂 Reading file: ${file.name}...`);

        // Étape 1 : Lire le fichier avec FileReader
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        logger.info(`✅ File read successfully`);

        // Étape 2 : Créer un HTMLImageElement et attendre le chargement
        const img = new Image();

        const loadPromise = new Promise((resolve, reject) => {
          img.onload = () => {
            logger.info(`✅ Image loaded: ${img.naturalWidth}x${img.naturalHeight}px`);
            resolve(img);
          };
          img.onerror = () => {
            const msg = '❌ Failed to load image';
            reject(new Error(msg));
          };
          img.src = dataUrl;
        });

        await loadPromise;

        // Étape 3 : Vérifier que le modèle est chargé
        if (!model) {
          const msg = '❌ Coco-SSD model not loaded yet';
          setError(msg);
          logger.error(msg);
          return [];
        }

        // Étape 4 : Appeler directement model.detect()
        // Le wrapper Coco-SSD gère déjà l'optimisation mémoire
        const maxDetections = 20;
        const results = await model.detect(img, maxDetections, scoreThreshold);

        logger.info(`🔍 Raw detections: ${results.length} object(s)`);

        // Étape 5 : Trier par score décroissant
        const sorted = results.sort((a, b) => b.score - a.score);

        logger.info(`✅ Detection pipeline complete`);
        console.table(sorted.map(d => ({
          class: d.class,
          score: `${(d.score * 100).toFixed(2)}%`,
          bbox: `[${d.bbox.map(v => v.toFixed(0)).join(', ')}]`
        })));

        // Mettre à jour l'état du hook
        setDetections(sorted);
        setError(null);

        return sorted;
      } catch (err) {
        const msg = `❌ Image detection error: ${err.message}`;
        setError(msg);
        logger.error(msg);
        setDetections([]);
        return [];
      } finally {
        setIsDetecting(false);
      }
    },
    [model]
  );

  /**
 * Détection sur vidéo uploadée
 * Pipeline : URL.createObjectURL → loadedmetadata → play → inférence loop
 * 
 * @param {File} file - Le fichier vidéo uploadé
 * @param {HTMLVideoElement} videoElement - La référence à l'élément <video>
 * @param {Function} onInferenceCallback - Callback appelé à chaque inférence: (results) => void
 * @returns {Promise<Object>} - { videoUrl, videoElement, cleanup }
 */
  const detectOnVideo = useCallback(
    async (file, videoElement, onInferenceCallback) => {
      if (!file) {
        const msg = '❌ No video file provided';
        setError(msg);
        logger.error(msg);
        return null;
      }

      if (!videoElement) {
        const msg = '❌ No video element reference provided';
        setError(msg);
        logger.error(msg);
        return null;
      }

      try {
        setIsDetecting(false);
        setError(null);
        setSourceType('video');

        logger.info(`🎬 Loading video file: ${file.name}...`);

        // Étape 1 : Créer une URL locale pour la vidéo
        const videoUrl = URL.createObjectURL(file);
        logger.info(`✅ Video URL created`);

        // Étape 2 : Assigner l'URL à l'élément vidéo et attendre loadedmetadata
        const loadPromise = new Promise((resolve, reject) => {
          const onLoadedMetadata = () => {
            logger.info(
              `✅ Video metadata loaded: ` +
              `${videoElement.videoWidth}x${videoElement.videoHeight}px, ` +
              `duration: ${videoElement.duration.toFixed(2)}s`
            );
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoElement.removeEventListener('error', onError);
            resolve();
          };

          const onError = () => {
            const msg = '❌ Failed to load video';
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
            videoElement.removeEventListener('error', onError);
            reject(new Error(msg));
          };

          videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
          videoElement.addEventListener('error', onError);
          videoElement.src = videoUrl;
        });

        await loadPromise;

        // Étape 3 : Vérifier que le modèle est chargé 
        if (!model) {
          const msg = '❌ Coco-SSD model not loaded yet';
          setError(msg);
          logger.error(msg);
          URL.revokeObjectURL(videoUrl);
          return null;
        }

        logger.info(`✅ Video is ready to play`);

        // Étape 4 : Créer une fonction cleanup
        const cleanup = () => {
          logger.info(`🧹 Cleaning up video resources`);
          videoElement.pause();
          videoElement.src = '';
          URL.revokeObjectURL(videoUrl);
          setDetections([]);
          setError(null);
        };

        // Retourner l'URL, l'élément vidéo et le modèle pour la boucle d'inférence
        return {
          videoUrl,
          videoElement,
          model,
          onInferenceCallback,
          cleanup
        };
      } catch (err) {
        const msg = `❌ Video loading error: ${err.message}`;
        setError(msg);
        logger.error(msg);
        return null;
      }
    },
    [model]
  );

  /**
 * sendToWorker(source, scoreThreshold) — fonction générique interne
 * 
 * Accepte HTMLImageElement ou HTMLVideoElement
 * Utilise OffscreenCanvas pour extraire les pixels
 * Transfère au worker via Transferable Objects (zéro copie)
 * Retourne Promise<Array> résolue quand le worker répond
 */
  const sendToWorker = useCallback(
    (source, scoreThreshold) => {
      return new Promise((resolve, reject) => {
        const worker = workerRef.current;

        if (!worker || !workerReadyRef.current) {
          reject(new Error('Worker not ready'));
          return;
        }

        // Lire les dimensions selon le type de source
        const w = source instanceof HTMLImageElement
          ? source.naturalWidth
          : source.videoWidth;
        const h = source instanceof HTMLImageElement
          ? source.naturalHeight
          : source.videoHeight;

        if (!w || !h) {
          reject(new Error('Source has no dimensions (not loaded yet?)'));
          return;
        }

        // Utiliser OffscreenCanvas pour extraire les pixels (pas de DOM access)
        const offscreen = new OffscreenCanvas(w, h);
        const ctx = offscreen.getContext('2d');
        ctx.drawImage(source, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const pixels = imageData.data; // Uint8ClampedArray

        // Stocker la Promise en attente
        pendingDetectRef.current = { resolve, reject };

        worker.postMessage(
          { type: 'detect', pixels, width: w, height: h, scoreThreshold },
          [pixels.buffer]
        );
      });
    },
    []
  );

  /**
 * startInferenceLoop(videoElement, _unused, scoreThreshold, canvasRef)
 * 
 * Boucle d'inférence adaptative avec throttling dynamique basé sur latence.
 * Utilise sendToWorker(videoElement) pour chaque frame.
 * Inclut le rendu des bounding boxes sur le canvas.
 * 
 * @returns { stop: Function, getMetrics: Function }
 */
  const startInferenceLoop = useCallback(
    (videoElement, _unused, scoreThreshold, canvasRef) => {
      if (!videoElement) {
        logger.warn('⚠️ [useVision] startInferenceLoop: missing videoElement');
        return null;
      }

      let isInferring = false;
      let lastLatency = 200;
      let nextInterval = 300;
      let frameCount = 0;
      let currentTimeoutId = null;
      let stopped = false;

      logger.info(`🎯 [useVision] Starting worker inference loop (initial: ${nextInterval}ms)`);

      // Fonction locale pour rendre les détections
      const renderVideoDetections = (canvas, video, dets) => {
        if (!canvas || !video) return;
        const ctx = canvas.getContext('2d');
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dets.forEach((det, index) => {
          const [x, y, bw, bh] = det.bbox;
          const hue = (index * 137.5) % 360;
          const color = `hsl(${hue}, 100%, 50%)`;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, bw, bh);
          ctx.font = '14px Arial';
          ctx.fillStyle = color;
          ctx.fillText(`${det.class} ${(det.score * 100).toFixed(1)}%`, x, y - 5);
        });
      };

      // Boucle récursive avec throttling adaptatif
      const scheduleNextInference = () => {
        if (stopped || videoElement.paused || videoElement.ended) {
          logger.info('✅ [useVision] Inference loop stopped');
          return;
        }

        currentTimeoutId = setTimeout(async () => {
          if (isInferring) { scheduleNextInference(); return; }

          try {
            isInferring = true;
            frameCount++;
            const t0 = performance.now();

            // Envoyer la frame vidéo au worker via sendToWorker
            const dets = await sendToWorker(videoElement, scoreThreshold);
            const sorted = dets.sort((a, b) => b.score - a.score);

            // Recalculer l'intervalle en fonction de la latence réelle
            lastLatency = performance.now() - t0;
            nextInterval = Math.min(1000, Math.max(100, lastLatency * 1.5));

            logger.debug(
              `🎥 Frame ${frameCount}: ${sorted.length} det(s), ` +
              `latency: ${lastLatency.toFixed(0)}ms, next: ${nextInterval.toFixed(0)}ms`
            );

            setDetections(sorted);

            // Rendre sur le canvas
            if (canvasRef?.current) {
              renderVideoDetections(canvasRef.current, videoElement, sorted);
            }
          } catch (err) {
            logger.error(`❌ [useVision] Inference error: ${err.message}`);
          } finally {
            isInferring = false;
            scheduleNextInference();
          }
        }, nextInterval);
      };

      scheduleNextInference();

      videoElement.onended = () => {
        logger.info('✅ [useVision] Video ended');
        stopped = true;
        if (currentTimeoutId) clearTimeout(currentTimeoutId);
      };

      return {
        stop: () => {
          stopped = true;
          if (currentTimeoutId) clearTimeout(currentTimeoutId);
          logger.info('⏹️ [useVision] Inference loop manually stopped');
        },
        getMetrics: () => ({ lastLatency, nextInterval, frameCount })
      };
    },
    [sendToWorker]
  );

  return {
    detections,
    status,
    sourceType,
    error: error || modelError,
    reset,
    isDetecting,
    progress,
    detectOnImage,
    detectOnVideo,
    startInferenceLoop
  };
};