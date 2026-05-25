import { logger } from "../utils/logger.js";

/**
 * STORAGE MANAGER - IndexedDB Event Storage
 * Version: 2.0.0
 *
 * Gère la persistance des événements utilisateur dans IndexedDB (base de données navigateur).
 * Stocke tous les événements (click, scroll, submit, etc.) pour l'analyse ultime du churn.
 *
 * ✨ V2 IMPROVEMENTS:
 * - ✅ BUG FIX: prune() maintenant implémentée (v1 était vide!)
 * - ✅ Error handling robuste avec try/catch
 * - ✅ JSDoc documentation complète
 * - ✅ Gestion des transactions IndexedDB
 *
 * ARCHITECTURE:
 * Database: "smartpredic_db"
 * └─ Object Store: "events"
 *    ├─ Key Path: "id" (unique)
 *    └─ Index: "timestamp" (pour les requêtes temporelles)
 *
 * @since 2.0.0
 */

import { openDB } from "idb";
import { smartStream } from "../core/StreamManager";

const DB_NAME = "smartpredic_db";
const STORE_NAME = "events";

/**
 * Classe de gestion du stockage persistant avec IndexedDB.
 *
 * Responsabilités:
 * 1. Initialiser la base de données
 * 2. Sauvegarder les événements
 * 3. Récupérer l'historique
 * 4. Nettoyer les vieilles données (prune)
 */
export class StorageManager {
  /**
   * Constructeur
   * @constructs StorageManager
   */
  constructor() {
    /**
     * Promise de la base de données IndexedDB
     * @type {Promise<IDBDatabase>|null}
     */
    this.dbPromise = null;
  }

  /**
   * Initialise la connexion à IndexedDB et crée le schéma si nécessaire.
   *
   * Doit être appelée une fois au démarrage de l'application.
   *
   * ERREUR GÉRÉE:
   * - Si IndexedDB n'est pas disponible → throw Error
   * - Si quota dépassé → application peut continuer offline
   *
   * @async
   * @function init
   * @returns {Promise<void>}
   * @throws {Error} Si IndexedDB initialization échoue
   *
   * @example
   * const storage = new StorageManager();
   * await storage.init();  // ✅ Connect to DB
   * // Database is now ready for save/load operations
   */
  async init() {
    try {
      this.dbPromise = openDB(DB_NAME, 1, {
        upgrade(db) {
          // Créer object store avec keyPath="id" (unique)
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });

          // Créer index sur le timestamp pour les requêtes temporelles efficaces
          store.createIndex("timestamp", "timestamp");
        },
      });
      this.connectStream();
    } catch (error) {
      logger.error("StorageManager.init() failed:", error);
      throw new Error(`IndexedDB initialization failed: ${error.message}`);
    }
  }

  /**
   * Connecte le flux d'événements en continu au stockage.
   *
   * Chaque événement produit par smartStream est automatiquement
   * sauvegardé dans IndexedDB sans intervention.
   *
   * @function connectStream
   * @returns {void}
   */
  connectStream() {
    smartStream.subscribe((event) => {
      this.saveEvent(event);
    });
  }

  /**
   * Sauvegarde un événement dans IndexedDB.
   *
   * Note: Si la même clé (id) existe, elle est overwrite.
   *
   * @async
   * @function saveEvent
   * @param {Object} event - Événement à sauvegarder
   * @param {string} event.id - Identifiant unique de l'événement
   * @param {number} event.timestamp - Timestamp (ms depuis epoch)
   * @param {string} event.type - Type d'action (CLICK, SCROLL, SUBMIT, etc.)
   * @returns {Promise<void>}
   */
  async saveEvent(event) {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, event);
  }

  /**
   * Récupère l'historique récent des événements (ex: 30 dernières secondes).
   *
   * Utilise l'index "timestamp" pour une requête efficace.
   * Filtration temporelle: events avec timestamp >= (maintenant - secondes)
   *
   * @async
   * @function getRecentHistory
   * @param {number} [seconds=30] - Nombre de secondes d'historique à récupérer
   * @returns {Promise<Object[]>} Array d'événements triés par timestamp croissant
   *
   * @example
   * const last30sec = await storage.getRecentHistory(30);
   * console.log(`Found ${last30sec.length} events in last 30 seconds`);
   */
  async getRecentHistory(seconds = 30) {
    const db = await this.dbPromise;

    const timeLimit = Date.now() - seconds * 1000;
    const range = IDBKeyRange.lowerBound(timeLimit);

    return db.getAllFromIndex(STORE_NAME, "timestamp", range);
  }

  /**
   * Nettoie les événements anciens de IndexedDB pour éviter l'accumulation infinie.
   *
   * ✨ V2 BUG FIX: Cette fonction était VIDE en v1!
   *
   * PROBLÈME V1:
   * ❌ Pas d'implémentation → events s'accumulent → mémoire remplit
   * ❌ IndexedDB quota dépassé après quelques jours
   * ❌ Application devient lente progressivement
   *
   * SOLUTION V2:
   * ✅ Implémentation complète avec transactions IndexedDB
   * ✅ Supprime les events avec timestamp < timeLimit
   * ✅ Error handling robuste
   *
   * @async
   * @function prune
   * @param {number} [maxAgeInHours=1] - Garder les événements plus récents que X heures
   *                                      Par défaut: 1 heure
   *                                      Recommandation: 24 heures pour production
   * @returns {Promise<void>}
   *
   * @example
   * // Garder seulement les 24 dernières heures
   * await storage.prune(24);
   *
   * // Nettoyer très agressivement (garder 30 min)
   * await storage.prune(0.5);
   */
  async prune(maxAgeInHours = 1) {
    try {
      const db = await this.dbPromise;

      // Calculer le timestamp limite
      const timeLimit = Date.now() - maxAgeInHours * 3600 * 1000;

      // Faire une requête de range sur les timestamps < timeLimit
      const range = IDBKeyRange.upperBound(timeLimit);

      // Créer une transaction en mode "readwrite" pour supprimer
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("timestamp");

      // Récupérer tous les événements à supprimer
      const oldEvents = await index.getAll(range);

      // Supprimer chacun
      for (const event of oldEvents) {
        store.delete(event.id);
      }

      // Attendre que transaction complète
      await tx.done;
    } catch (error) {
      // Prune failure n'est pas critique - application peut continuer
      logger.warn("StorageManager.prune() failed but continuing:", error);
    }
  }
}

/**
 * Instance singleton de StorageManager.
 * Utilisée globalement dans l'app pur sauvegarder les événements.
 *
 * @type {StorageManager}
 */
export const storageManager = new StorageManager();
