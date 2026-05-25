/**
 * TRAIN AND SAVE MODEL - Frontend Training Script
 * Version: 2.0.0
 *
 * ✨ MAJOR V2 REFACTOR: Node.js → Frontend React
 *
 * BEFORE (v1 - Node.js Backend):
 * ❌ Nécessitait Node.js + npm run train
 * ❌ Fichiers système complexes
 * ❌ Aucune UI feedback
 * ❌ Dev-only, pas accessible
 * ❌ Processus inaccessible depuis React
 *
 * AFTER (v2 - Frontend Browser):
 * ✅ 100% Frontend (navigateur)
 * ✅ Persistance IndexedDB simple
 * ✅ Callback progress → React state
 * ✅ Accessible à tous
 * ✅ Intégrable dans React via useSmartPredict hook
 *
 * USAGE OPTIONS:
 *
 * Option 1: Console Browser (le plus rapide)
 * ──────────────────────────────────────────
 * F12 → Console
 * import { trainAndSaveModel } from './src/engine/scripts/trainAndSaveModel.js';
 * await trainAndSaveModel((p) => console.log(`Epoch ${p.epoch}/50`));
 *
 * Option 2: React Component (meilleure UX)
 * ───────────────────────────────────────
 * const { train, isTraining, trainingProgress } = useSmartPredict();
 * <button onClick={train} disabled={isTraining}>
 *   {isTraining ? `Training ${trainingProgress.epoch}/50` : 'Train'}
 * </button>
 *
 * Option 3: Hook Custom
 * ─────────────────────
 * const result = await trainAndSaveModel();
 * console.log(result); // { success: true, performance: { ... } }
 *
 * STORAGE ARCHITECTURE (IndexedDB):
 * ──────────────────────────────────
 * Database: "smartpredict_models"
 * └─ Object Store: "models"
 *    └─ Key: "churn_model"
 *       ├─ weights: ArrayBuffer[]
 *       ├─ config: {timeSteps, features, learningRate}
 *       ├─ timestamp: ISO string
 *       └─ performance: {finalLoss, finalAccuracy}
 *
 * ANTI-OVERFITTING MEASURES:
 * ──────────────────────────
 * - Architecture réduite (LSTM 32→16, Dense 64→32→16)
 * - Régularisation L2 sur tous les layers
 * - Dropout augmenté (0.3→0.5)
 * - Early stopping (patience=10)
 * - Bruit dans données d'entraînement
 * - Epochs réduites (100→50 max)
 * - Dataset augmenté (1500→3000 samples)
 *
 * MIGRATION NOTES:
 * ────────────────
 * v1 utilisait Node.js avec import fs/path - IMPOSSIBLE en
 * v2 utilise IndexedDB - FONCTIONNE PARTOUT (navigateur, offline, etc.)
 * Les fichiers v1 /public/model/ sont ignorés en v2 (IndexedDB prioritaire)
 *
 * @since 2.0.0
 * @see TRAINING_GUIDE_FRONTEND.md pour le guide complet
 * @see CHANGELOG_V2.md pour les détails de migration
 */

import { logger } from "../utils/logger.js";
import { ChurnModel } from "../models/ChurnModel.js";
import { generateDataset } from "../data/generateChurnDataset.js";

const DB_NAME = "smartpredict_models";
const MODEL_STORE_KEY = "churn_model";

/**
 * Sauvegarde le modèle entraîné dans IndexedDB.
 *
 * IndexedDB est une base de données navigateur qui persiste
 * même après fermeture du navigateur. Parfait pour stocker le modèle ML!
 *
 * @async
 * @function saveModelToIndexedDB
 * @param {Object} model - Objet modèle avec weights et config
 * @param {ArrayBuffer[]} model.weights - Poids TensorFlow sérialisés
 * @param {Object} model.config - Configuration (timeSteps, features, etc.)
 * @param {string} model.timestamp - ISO timestamp d'entraînement
 * @param {Object} model.performance - Métriques {finalLoss, finalAccuracy}
 * @returns {Promise<void>}
 * @throws {Error} Si IndexedDB échoue
 *
 * @example
 * const modelData = {
 *   weights: [...],
 *   config: { timeSteps: 12, features: 11 },
 *   timestamp: "2026-03-30T...",
 *   performance: { finalLoss: 0.34, finalAccuracy: 0.82 }
 * };
 * await saveModelToIndexedDB(modelData);
 * // ✅ Modèle sauvegardé et persiste!
 */
async function saveModelToIndexedDB(model) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("models")) {
        db.createObjectStore("models");
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(["models"], "readwrite");
      const store = transaction.objectStore("models");

      store.put(model, MODEL_STORE_KEY);

      transaction.oncomplete = () => {
        logger.info("✅ Modèle sauvegardé dans IndexedDB");
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error("Erreur sauvegarde IndexedDB"));
      };
    };

    request.onerror = () => {
      reject(new Error("Erreur IndexedDB"));
    };
  });
}

/**
 * Charge un modèle préalablement entraîné depuis IndexedDB.
 *
 * Appelée automatiquement lors du démarrage de l'app pour
 * récupérer le dernier modèle entraîné.
 *
 * @async
 * @function loadModelFromIndexedDB
 * @returns {Promise<Object|null>} Modèle complet, ou null si absent
 * @throws {Error} Si IndexedDB échoue
 *
 * @example
 * const model = await loadModelFromIndexedDB();
 * if (model) {
 *   console.log('✅ Modèle trouvé, créé le:', model.timestamp);
 * } else {
 *   console.log('❌ Aucun modèle entraîné, lancez training');
 * }
 */
export async function loadModelFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(["models"], "readonly");
      const store = transaction.objectStore("models");
      const getRequest = store.get(MODEL_STORE_KEY);

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null);
      };

      getRequest.onerror = () => {
        reject(new Error("Erreur lecture IndexedDB"));
      };
    };

    request.onerror = () => {
      reject(new Error("Erreur IndexedDB"));
    };
  });
}

/**
 * Fonction principale d'entraînement du modèle ML.
 * Version Frontend React-compatible.
 *
 * Étapes principales:
 * 1. Générer dataset réaliste (3000 samples)
 * 2. Créer architecture LSTM
 * 3. Entraîner pendant 50 epochs avec callbacks
 * 4. Sauvegarder dans IndexedDB
 * 5. Nettoyer les tenseurs (important pour mémoire!)
 * 6. Retourner les métriques finales
 *
 * CALLBACK PROGRESS:
 * La fonction onProgress est appelée à CHAQUE EPOCH avec:
 * {
 *   epoch: 1-50,
 *   totalEpochs: 50,
 *   loss: "0.4521",
 *   accuracy: "0.7834"
 * }
 *
 * @async
 * @function trainAndSaveModel
 * @param {Function} [onProgress=null] - Callback(progress) appelé à chaque epoch
 *                                        Utilisé pour mettre à jour UI React
 * @returns {Promise<{
 *   success: boolean,
 *   message: string,
 *   performance: {finalLoss: number, finalAccuracy: number}
 * }>}
 * @throws {Error} Si l'entraînement échoue (OOM, erreur TFjs, etc.)
 *
 * @example
 * // Utilisation simple
 * try {
 *   const result = await trainAndSaveModel();
 *   console.log(`✅ Succès! Loss=${result.performance.finalLoss}`);
 * } catch (err) {
 *   console.error(`❌ Erreur: ${err.message}`);
 * }
 *
 * @example
 * // Avec callback de progression (pour UI)
 * const result = await trainAndSaveModel((progress) => {
 *   console.log(`Epoch ${progress.epoch}/${progress.totalEpochs}`);
 *   console.log(`  Loss: ${progress.loss}`);
 *   console.log(`  Accuracy: ${progress.accuracy}`);
 *   // Mettre à jour React state ici:
 *   // setTrainingProgress(progress);
 * });
 */
export async function trainAndSaveModel(onProgress = null) {
  try {
    logger.info("🚀 TRAINING: Démarrage du processus...");

    // 1. Générer un dataset réaliste (augmenté pour éviter le surapprentissage)
    logger.info("📊 Génération du dataset (3000 samples)...");
    const { X, Y } = generateDataset(3000); // Augmenté de 1500 à 3000
    logger.info(`✅ Dataset généré: X=${X.shape}, Y[0]=${Y[0].shape}`);

    // 2. Créer et configurer le modèle
    logger.info("🏗️  Création du modèle...");
    const config = {
      timeSteps: 12,
      features: 11,
      learningRate: 0.001,
    };
    const model = new ChurnModel(config);
    model.createModel();
    logger.info("✅ Modèle créé avec succès");

    // 3. Entraîner
    logger.info("🧠 Entraînement du modèle (50 epochs)...");
    const history = await model.train(X, Y, (epoch, logs) => {
      const progress = {
        epoch: epoch + 1,
        totalEpochs: 50,
        loss: logs.loss?.toFixed(4),
        accuracy: (logs.accuracy || logs.acc)?.toFixed(4),
      };

      if ((epoch + 1) % 10 === 0) {
        logger.info(`   Epoch ${progress.epoch}/50 - Loss: ${progress.loss}`);
      }

      // Appeler callback React si fourni
      if (onProgress) {
        onProgress(progress);
      }
    });

    logger.info("✅ Entraînement terminé!");

    // 4. Sauvegarder le modèle (compatible TFJS)
    logger.info("💾 Sauvegarde du modèle TensorFlow.js...");

    // Sauvegarder aussi dans IndexedDB comme backup
    const modelData = {
      weights: model.model.getWeights().map((w) => w.array()),
      config: config,
      timestamp: new Date().toISOString(),
      performance: {
        finalLoss: history.history.loss[history.history.loss.length - 1],
        finalAccuracy:
          history.history.acc?.[history.history.acc.length - 1] ||
          history.history.accuracy?.[history.history.accuracy.length - 1],
      },
    };

    // Sauvegarder dans IndexedDB
    await saveModelToIndexedDB(modelData);
    logger.info("✅ Modèle sauvegardé dans IndexedDB");

    // 5. Nettoyer les tenseurs (IMPORTANT pour éviter memory leak!)
    // TensorFlow.js keepGPU memory si on ne dispose pas explicitement
    X.dispose();
    Y.forEach((y) => y.dispose?.());
    model.model.dispose();

    logger.info("🎉 SUCCÈS: Modèle entraîné et sauvegardé!");
    logger.info(
      "✨ Prochaine étape: Recharger la page pour utiliser le nouveau modèle.",
    );

    return {
      success: true,
      message: "Modèle entraîné avec succès",
      performance: modelData.performance,
    };
  } catch (error) {
    logger.error("❌ ERREUR LORS DE L'ENTRAÎNEMENT:", error.message || error);
    throw error;
  }
}
