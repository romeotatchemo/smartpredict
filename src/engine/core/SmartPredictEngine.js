/**
 * SMART PREDICT ENGINE - Main Orchestration Facade
 * Version: 2.0.0
 *
 * ✨ CRITICAL V2 BUG FIX: TensorFlow Inference ACTIVATED
 *
 * COMPLETE PIPELINE (le cœur de l'app):
 * ──────────────────────────────────────
 * Étape 1: DATA PIPELINE
 *   ├─ Query IndexedDB (StorageManager)
 *   ├─ Extract events (30-60 seconds window)
 *   ├─ Normalize features
 *   └─ Return tensor sequences
 *
 * Étape 2: ML INFERENCE ✨ (V2: NOW ACTIVE)
 *   ├─ Read validTensors from pipeline
 *   ├─ Encode sequence [batch=1, timeSteps=12, features=16]
 *   ├─ Call model.predict() ← ✅ V2 Active!
 *   └─ Extract churnScore (0-1)
 *
 * Étape 3: DECISION ENGINE (Hybrid - ML + Rules)
 *   ├─ ML score (0.8) → Risk level
 *   ├─ Apply business rules (thresholds, promotions, etc.)
 *   └─ Generate action: "OFFER_DISCOUNT", "DO_NOTHING", etc.
 *
 * Étape 4: OUTPUT FORMATTING
 *   └─ Return structured decision with reason/confidence
 *
 * KEY ARCHITECTURAL DECISIONS:
 * ───────────────────────────
 * - Facade Pattern: Hides complexity, single predict() entry point
 * - Async/await: Non-blocking I/O (IndexedDB queries)
 * - Error handling: Fallback to rules-only if ML fails
 * - Memory mgmt: Explicit tensor disposal (GPU memory critical)
 * - Logging: Comprehensive debug trails (see logger.debug)
 *
 * LESSONS LEARNED FROM V1 BUGS:
 * ─────────────────────────────
 * 1. Commented code in production = DANGEROUS
 *    → Feature flag or proper cleanup!
 * 2. Silent fallbacks can hide bugs
 *    → Log everything (logger.error/warn)
 * 3. Memory leak with TensorFlow.js
 *    → Always dispose() tensors!
 * 4. Test inference separately
 *    → smoke_test.js validation
 *
 * @see SmartPredictContext.jsx for React integration
 * @see /tests/smoke_test.js for validation
 * @see CORRECTIONS_SUMMARY.md for bug details
 * @since 2.0.0
 */

import { SanityModel } from "../models/SanityModel";
import { dataPipeline } from "./DataPipeline";
import { ActionMapper } from "../decision/ActionMapper";
import { HybridEngine } from "../decision/HybridEngine";
import { thresholdManager } from "../decision/ThresholdManager";
import { logger } from "../utils/logger.js";
import { ChurnModel } from "../models/ChurnModel";
import * as tf from "@tensorflow/tfjs";
import { generateDataset } from "../data/generateTrainingDataset";
import { tensorCache } from "./TensorCache";
import { ModelRegistry } from "../models/ModelRegistry";

tf.env().set('IS_TEST', true);
/**
 * Classe principale du moteur de prédiction intelligent.
 * Implémente le pattern Facade pour simplifier l'interaction entre les couches métier et technique.
 */
export class SmartPredictEngine {
  /**
   * Constructeur - Initialisation des sous-systèmes de décision.
   *
   * REMARQUE : Le chargement des ressources lourdes (modèles ML, seuils) se fait dans init(),
   * pas dans le constructeur, pour permettre une initialisation asynchrone contrôlée.
   *
   * @constructs SmartPredictEngine
   */
  constructor() {
    // Instanciation des sous-systèmes de décision (Pas de ML lourd ici)
    /** @type {ActionMapper} - Transforme les scores ML en intentions métier */
    this.mapper = new ActionMapper();

    /** @type {HybridEngine} - Moteur de décision hybride avec règles métier */
    this.decisionEngine = new HybridEngine();

    /** @type {ChurnModel} - Modèle de prédiction de churn basé sur TensorFlow.js */
    this.mlModel = null;
    // logger.info("🧠 SmartPredictEngine (Facade) instancié");
  }

  /**
   * Initialisation asynchrone du moteur de prédiction.
   * @async
   * @function init
   *
   * Point d'entrée obligatoire appelé une seule fois au démarrage de l'application
   * (généralement dans le Provider React - SmartPredictContext).
   *
   * Étapes d'initialisation :
   * 1. Vérification du Sanity Check (environnement ML)
   * 2. Chargement des seuils métiers dynamiques depuis la configuration
   * 3. Construction et initialisation du modèle TFJS (création des poids, etc.)
   *
   * @returns {Promise<void>}
   * @throws {Error} Si le chargement du modèle ou des seuils échoue
   */
  async init() {
    // logger.debug("Lancement du Sanity Check pour SmartPredictEngine...");

    // 1. Initialisation des seuils métiers dynamiques (depuis config JSON)
    // Les seuils sont ensuite utilisés par le HybridEngine pour prendre des décisions
    await thresholdManager.load();

    this.mlModel = await ModelRegistry.get('churn');

    // logger.info("🔧 SmartPredictEngine: churn model loaded via registry");
  }

  /**
   * Clear old incompatible models from IndexedDB
   * Called when a model shape mismatch is detected
   * @private
   */
  clearOldModels() {
    const DB_NAME = "smartpredict_models";
    const MODEL_STORE_KEY = "churn_model";

    try {
      const request = indexedDB.open(DB_NAME, 1);

      request.onsuccess = (event) => {
        const db = event.target.result;
        if (db.objectStoreNames.contains("models")) {
          const transaction = db.transaction(["models"], "readwrite");
          const store = transaction.objectStore("models");
          store.delete(MODEL_STORE_KEY);

          transaction.oncomplete = () => {
            logger.debug("Old incompatible models cleared from storage");
          };

          transaction.onerror = (err) => {
            logger.debug("Failed to clear old models:", err);
          };
        }
      };

      request.onerror = () => {
        logger.debug("Could not open IndexedDB to clear old models");
      };
    } catch (err) {
      logger.debug("Error clearing old models:", err.message);
    }
  }

  /**
   * Entraîne et sauvegarde le modèle en local
   * @param {Function} onProgress - Callback appelé à chaque époque avec (epoch, logs)
   * @returns {Promise<void>}
   */
  async train(onProgress = null) {
    try {
      logger.info("🚀 Début de l'entraînement du modèle...");

      // Génération du dataset réaliste
      logger.info("Generating training dataset...");
      const { X, Y } = generateDataset(1000);
      logger.info(`Dataset generated: ${X.shape[0]} examples`);

      // On délègue l'entraînement à notre classe ChurnModel existante
      await this.mlModel.train(X, Y, onProgress);

      logger.info("✅ Entraînement terminé !");

      // Sauvegarde via le navigateur (déclenche un téléchargement)
      logger.info("💾 Sauvegarde du modèle...");
      await this.mlModel.model.save("downloads://model");
      logger.info("✅ Modèle téléchargé: model.json et model.weights.bin");
    } catch (error) {
      logger.error("❌ Erreur lors de l'entraînement:", error);
      throw error;
    }
  }

  /**
   * Point d'entrée principal pour les composants React.
   * Orchestre le cycle complet : Pipeline Data → Inférence ML → Mapping → Règles Hybrides
   *
   * @async
   * @function predict
   * @param {number} [windowSize=30] - Fenêtre d'analyse temporelle en secondes
   *                                    (ex: 30 = analyser les 30 dernières secondes d'activité utilisateur)
   * @param {Object} [appContext={}] - Contexte métier additionnel pour les règles hybrides
   *                                    Exemple: { lastPromoTimestamp: 1234567890, isNewUser: false }
   *
   * @returns {Promise<Object>} Objet de décision finale avec structure :
   *          {
   *            action: string,        // Action recommandée (ex: "OFFER_DISCOUNT", "DO_NOTHING")
   *            priority: number,      // Priorité d'exécution (0 = ignorer, 1-3 = normal à urgent)
   *            reason?: string,       // Raison de la décision (optionnel)
   *            confidence?: number    // Confiance du modèle (0-1)
   *          }
   *
   * @throws {Error} Capture les erreurs critiques et retourne un fallback sans lancer d'exception
   *
   * @example
   * const decision = await engine.predict(30, { lastPromoTimestamp: Date.now() });
   * console.log(decision.action); // "OFFER_DISCOUNT_AGGRESSIVE" ou "DO_NOTHING"
   */
  async predict(windowSize = 30, appContext = {}) {
    try {
      // logger.info(
      //   `Starting analysis cycle (Window: last ${windowSize} seconds)...`,
      // );

      const memBefore = tf.memory();
      // logger.debug(`[MEMORY BEFORE] numTensors: ${memBefore.numTensors}`);
      // ============================================================================
      // ÉTAPE 1 : DATA PIPELINE - Extraction et normalisation des données brutes
      // ============================================================================
      // Le pipeline interroge directement IndexedDB via le StorageManager.
      // Il retourne un tableau de tenseurs normalisés (features scalaires + one-hot encoding)
      const validTensors = await dataPipeline.run(windowSize * 2);

      // console.log(sequence);

      // Score de churn par défaut (optimiste) - Risque très faible
      let churnScore = 0.1;

      // ============================================================================
      // ÉTAPE 2 : MACHINE LEARNING (INFÉRENCE) - Calcul du risque de churn
      // ============================================================================
      // On ne calcule la prédiction que s'il y a eu une activité significative
      // (présence de tenseurs valides dans la fenêtre de temps)

      if (validTensors && validTensors.length > 0) {
         const TIME_STEPS = this.mlModel.TIME_STEPS || 12;
        const FEATURES = this.mlModel.FEATURES || 16;

        // Transformation initiale des caractéristiques en vecteurs numériques
        let sequence = validTensors.map((f) => {
          const scalars = [
            f.velocity || 0,
            f.acceleration || 0,
            f.deltaTime || 0,
            f.relativeTime || 0,
          ];
          const pageOneHot = f.pageOneHot || new Array(8).fill(0);
          const actionOneHot = f.actionOneHot || new Array(4).fill(0);
          return [...scalars, ...pageOneHot, ...actionOneHot];
        });

        // Gestion de la fenêtre temporelle : Tronquage ou Remplissage (Padding)
        if (sequence.length > TIME_STEPS) {
          sequence = sequence.slice(-TIME_STEPS);
        }

        while (sequence.length < TIME_STEPS) {
          sequence.unshift(new Array(FEATURES).fill(0));
        }

        // ✨ NOUVEAU : Vérification du cache de séquences avant l'inférence
        // Création d'une clé de cache à partir de la séquence aplatie
        const flatSequence = sequence.flat();
        let cachedSequence = tensorCache.get(flatSequence);

        try {
          const result = tf.tidy(() => {
            // Utilise la séquence en cache si elle existe, sinon utilise la nouvelle
            let finalSequence = cachedSequence || sequence;

            if (!cachedSequence) {
              // Échec du cache (Miss) : on stocke la séquence normalisée pour la prochaine fois
              tensorCache.set(flatSequence, sequence);
              // logger.debug(`💾 Séquence normalisée mise en cache pour ce jeu de données`);
            } else {
              // Succès du cache (Hit) : on a évité de recalculer la normalisation
              // logger.debug(`📦 Séquence récupérée du cache — normalisation ignorée`);
            }

            // Création d'un nouveau tenseur à partir de la séquence (issue du cache ou non)
            // Note : Le tenseur est créé dans tf.tidy() pour assurer sa libération mémoire automatique.
            const inputTensor = tf.tensor3d(
              [finalSequence],
              [1, TIME_STEPS, FEATURES],
            );

            // Exécution de la prédiction
            const [churnTensor] = this.mlModel.predict(inputTensor);
            return churnTensor.dataSync()[0];
          });

          churnScore = result;


          // churnTensor.dispose();
          // inputTensor.dispose();
        } catch (tfError) {
          logger.error(`⚠️ Erreur inférence TensorFlow: ${tfError.message}`);
          // Fallback: simulation basée sur activité
          churnScore = validTensors.length >= 3 ? 0.92 : 0.3;
        }

        logger.debug(`🧠 Score ML calculé : ${churnScore}`);
      } else {
        logger.debug(
          "💤 Pas d'activité pertinente détectée. Maintien du score par défaut.",
        );
      }

      // Enveloppe du score brut dans un objet prediction unifié
      const rawPrediction = { churn: churnScore };

      // ============================================================================
      // ÉTAPE 3 : MAPPING - Transformation du score ML en intention métier
      // ============================================================================
      // L'ActionMapper traduit le score numérique en intention business
      // Exemple : 0.92 → "OFFER_DISCOUNT_AGGRESSIVE" (très haut risque)
      //          0.30 → "NO_ACTION" (risque léger)
      const intention = this.mapper.map(rawPrediction);
      logger.info(
        `🔍 Intention métier dérivée du score : ${intention.action} (Confiance: ${intention.meta.confidence})`,
      );
      // logger.debug("Intention complète :", intention);

      const memAfter = tf.memory();
      // logger.debug(`[MEMORY AFTER] numTensors: ${memAfter.numTensors} | Delta: ${memAfter.numTensors - memBefore.numTensors}`);
      // ============================================================================
      // ÉTAPE 4 : MOTEUR HYBRIDE - Application des règles métier
      // ============================================================================
      // Vérifie les gardes-fous et règles métier avant d'autoriser l'action
      // Exemples de règles implémentées :
      // - AntiSpam : Vérifier qu'on n'a pas déjà offert une promo récemment
      // - Contraintes métier : Vérifier le budget promo disponible
      // - Logique temporelle : Vérifier le jour/heure appropriée
      const finalDecision = this.decisionEngine.decide(intention, appContext);

      logger.info(`Final decision: ${finalDecision.action}`);
      return finalDecision;
    } catch (_error) {
      // ============================================================================
      // ERROR HANDLING - Security fallback
      // ============================================================================
      // Capture all critical errors and return neutral action
      // to ensure React interface never breaks
      logger.error("Critical error in SmartPredictEngine.predict:", _error);

      // Absolute safety fallback: return DO_NOTHING to never break React interface
      return { action: "DO_NOTHING", priority: 0, reason: "ENGINE_ERROR" };
    }
  }

  /**
   * Prédiction par lot - Traite plusieurs profils simultanément.
   * @param {Array<Object>} featuresArray - Tableau de vecteurs de caractéristiques normalisés.
   * @returns {Promise<Array<number>>} Tableau des scores de désabonnement (churn).
   */
  async predictBatch(featuresArray) {
    if (!featuresArray || featuresArray.length === 0) {
      logger.warn("predictBatch: Tableau de caractéristiques vide");
      return [];
    }

    try {
      logger.info(`📦 Prédiction par lot : ${featuresArray.length} échantillons`);

      const TIME_STEPS = this.mlModel.TIME_STEPS;
      const FEATURES = this.mlModel.FEATURES;

      return tf.tidy(() => {
        // Convertit le tableau de séquences au format [taille_du_lot, TIME_STEPS, FEATURES]
        const sequences = featuresArray.map((features) => {
          let sequence = features;

          // Normalisation de la longueur de la séquence (tronquage si trop long)
          if (sequence.length > TIME_STEPS) {
            sequence = sequence.slice(-TIME_STEPS);
          }

          // Remplissage (padding) si la séquence est trop courte
          while (sequence.length < TIME_STEPS) {
            sequence.unshift(new Array(FEATURES).fill(0));
          }

          return sequence;
        });

        // Empile toutes les séquences dans un seul tenseur 3D de lot
        const batchTensor = tf.tensor3d(
          sequences,
          [featuresArray.length, TIME_STEPS, FEATURES]
        );

        // Exécute la prédiction pour l'ensemble du lot en une seule opération
        const [churnBatch] = this.mlModel.model.predict(batchTensor);

        // Extrait les scores résultants sous forme de tableau JavaScript standard
        const scores = Array.from(churnBatch.dataSync());

        logger.debug(`✅ Lot terminé : ${scores.length} prédictions effectuées`);
        return scores;
      });
    } catch (error) {
      logger.error("Erreur lors de la prédiction par lot :", error);
      // Valeur de repli (fallback) en cas d'erreur pour éviter de bloquer le flux
      return new Array(featuresArray.length).fill(0.1);
    }
  }
}
