/**
 * ml.worker.js - Web Worker dédié aux calculs TensorFlow.js
 * 
 * Responsabilités:
 * - Charger TensorFlow.js + backend WebGL
 * - Charger le modèle churn une seule fois
 * - Recevoir messages: { type: 'predict-churn', data: {...} }
 * - Exécuter inférences dans tf.tidy (gestion mémoire)
 * - Renvoyer résultats sans bloquer le thread principal
 */

import * as tf from '@tensorflow/tfjs';
import { ModelRegistry } from '../models/ModelRegistry.js';
import { SmartPredictEngine } from '../core/SmartPredictEngine.js'
import "../models/registry.config.js";
import { storageManager } from '../data/StorageManager.js';
import { pageEncoder } from '../features/CategoricalEncoder.js';
// import { logger } from '../utils/logger.js';

// ===== VARIABLES D'ÉTAT DU WORKER =====
let engine = new SmartPredictEngine();
let isReady = false;
const PAGES = [
  "/",
  "/pricing",
  "/cart",
  "/checkout",
  "/services",
  "/about",
  "/account",
  "/unsubscribe",
];

// ===== SECTION D'INITIALISATION =====
async function initializeWorker() {
  try {
    console.log('🚀 [ML Worker] Initializing...');
    pageEncoder.fit(PAGES);
    await storageManager.init();

    console.log('📦 [ML Worker] Loading churn model...');
    await engine.init();

    isReady = true;
    console.log('✅ [ML Worker] Initialization complete. Model loaded and ready.');

    // Signaler au hook que le worker est prêt
    self.postMessage({
      type: 'ready',
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('❌ [ML Worker] Initialization failed:', error.message);
    self.postMessage({
      type: 'error',
      message: `Worker initialization failed: ${error.message}`,
      timestamp: Date.now(),
    });
    isReady = false;
  }
}

// ===== SECTION DE GESTION DES MESSAGES =====
self.onmessage = async (event) => {
  const { type, data, messageId } = event.data;

  console.log(`📨 [ML Worker] Received message:`, type);

  try {
    // ===== CAS 1: PRÉDICTION CHURN =====
    if (type === 'predict-churn') {
      if (!isReady) {
        throw new Error('Worker not ready. Model is still loading.');
      }

      // SmartPredictEngine.predict() gère tf.tidy en interne
      const prediction = await engine.predict();

      self.postMessage({
        type: 'result',
        messageId,
        prediction,
        processingTimeMs: Date.now() - data.startTime,
        timestamp: Date.now(),
      });
    }

    // ===== CAS 2: REQUÊTE D'ÉTAT =====
    else if (type === 'status') {
      self.postMessage({
        type: 'status-response',
        isReady,
        modelLoaded: engine.mlModel !== null,
        memoryInfo: tf.memory(),
        timestamp: Date.now(),
      });
    }

    // ===== CAS 3: NETTOYAGE MÉMOIRE =====
    else if (type === 'cleanup') {
      if (engine) {
        engine.mlModel.dispose();
        engine = null;
      }
      tf.disposeVariables();

      self.postMessage({
        type: 'cleanup-response',
        memoryInfo: tf.memory(),
        timestamp: Date.now(),
      });
    }

    else {
      throw new Error(`Unknown message type: ${type}`);
    }

  } catch (error) {
    console.error('❌ [ML Worker] Error processing message:', error.message);
    self.postMessage({
      type: 'error',
      messageId,
      message: error.message,
      timestamp: Date.now(),
    });
  }
};

// Lancer l'initialisation au démarrage du worker
initializeWorker();