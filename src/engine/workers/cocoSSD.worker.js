/**
 * cocoSSD.worker.js - Web Worker dédié aux inférences Coco-SSD
 * 
 * Cycle de vie:
 * 1. Initialisation: charger TF.js + Coco-SSD (via ModelRegistry), puis postMessage({ type: 'ready' })
 * 2. Reception: recevoir frames brutes (Uint8ClampedArray) depuis le thread principal
 * 3. Inférence: model.detect(imageData)
 * 4. Retour: postMessage({ type: 'detections', detections })
 * 
 * Architecture des Transferable Objects:
 * - Les frames vidéo (plusieurs MB chacune) sont transférées, pas copiées
 * - Après transfer, pixels.buffer.byteLength === 0 dans le main thread
 * - Le worker reconstruit une nouvelle vue sur le buffer transféré
 */

import * as tf from '@tensorflow/tfjs';
import { ModelRegistry } from '../models/ModelRegistry.js';
import '../models/registry.config.js'; // Charge la config des modèles

// ===== VARIABLES D'ÉTAT =====
let model = null;
let isReady = false;

// ===== INITIALISATION =====
async function initializeWorker() {
  try {
    console.log('🚀 [Coco-SSD Worker] Initializing...');
    
    // Charger le modèle Coco-SSD via ModelRegistry
    console.log('📦 [Coco-SSD Worker] Loading Coco-SSD model from ModelRegistry...');
    model = await ModelRegistry.get('coco-ssd');
    
    isReady = true;
    console.log('✅ [Coco-SSD Worker] Coco-SSD model loaded and ready');
    
    // Signaler au thread principal que le worker est prêt
    self.postMessage({
      type: 'ready',
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ [Coco-SSD Worker] Initialization failed:', error.message);
    self.postMessage({
      type: 'error',
      message: `Worker initialization failed: ${error.message}`,
      timestamp: Date.now()
    });
    isReady = false;
  }
}

// ===== GESTION DES MESSAGES =====
self.onmessage = async (event) => {
  const { type, pixels, width, height, scoreThreshold } = event.data;

  try {
    // Vérifier les données reçues
    if (!pixels || !width || !height) {
      throw new Error('Missing pixels, width, or height in message');
    }

    // Vérifier que le worker est prêt
    if (!isReady) {
      throw new Error('Worker not ready. Model still loading.');
    }

    // ===== CAS 1: INFÉRENCE SUR FRAME =====
    if (type === 'detect') {
      // Reconstruction de l'ImageData depuis le buffer transféré
      // IMPORTANT: pixels est maintenant la seule vue sur le buffer
      const imageData = new ImageData(pixels, width, height);

      // Mesurer la latence de la détection
      const inferenceStart = performance.now();
      const detections = await model.detect(imageData, undefined, scoreThreshold);
      const inferenceEnd = performance.now();
      const latency = inferenceEnd - inferenceStart;

      // Retourner les détections au thread principal
      self.postMessage({
        type: 'detections',
        detections,
        timestamp: Date.now(),
        latency
      });
    }

    // ===== CAS 2: REQUÊTE D'ÉTAT =====
    else if (type === 'status') {
      self.postMessage({
        type: 'status-response',
        isReady,
        modelLoaded: model !== null,
        memoryInfo: tf.memory(),
        timestamp: Date.now()
      });
    }

    // ===== CAS 3: NETTOYAGE MÉMOIRE =====
    else if (type === 'cleanup') {
      console.log('[Coco-SSD Worker] Memory before cleanup:', tf.memory());
      tf.disposeVariables();
      console.log('[Coco-SSD Worker] Memory after cleanup:', tf.memory());
      
      self.postMessage({
        type: 'cleanup-response',
        memoryInfo: tf.memory(),
        timestamp: Date.now()
      });
    }

  } catch (error) {
    console.error('❌ [Coco-SSD Worker] Error:', error.message);
    self.postMessage({
      type: 'error',
      message: error.message,
      timestamp: Date.now()
    });
  }
};

// Lancer l'initialisation immédiatement
initializeWorker();