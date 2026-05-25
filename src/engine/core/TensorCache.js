/**
 * TensorCache - Cache LRU pour les SÉQUENCES de caractéristiques normalisées.
 *
 * Problème : Les mêmes caractéristiques de profil utilisateur peuvent être envoyées à predict()
 * plusieurs fois en quelques secondes. Normaliser la séquence (padding/tronquage)
 * à partir de zéro à chaque fois gaspille des cycles CPU.
 *
 * Solution : Mettre en cache la SÉQUENCE préparée (tableau JavaScript) avec une politique d'éviction LRU.
 * Lorsque le cache est plein (maxSize), l'entrée la moins récemment utilisée est supprimée.
 *
 * 🔑 POINT CLÉ : On stocke des SÉQUENCES (tableaux), pas des TENSEURS.
 * Les tenseurs sont créés à la volée dans tf.tidy() pour une gestion mémoire optimale.
 * Les séquences peuvent être mises en cache en toute sécurité (gérées par le garbage collector de JS).
 *
 * ⚠️ CRITIQUE : Un cache borné est essentiel. Un cache illimité constituerait
 * une fuite de mémoire en soi — le problème exact que nous cherchons à résoudre.
 */
import { logger } from "../utils/logger";

export class TensorCache {
  /**
   * Crée une instance de TensorCache.
   * @param {number} [maxSize=50] - Nombre maximum de séquences en cache.
   */
  constructor(maxSize = 50) {
    this.cache = new Map(); // clé -> séquence normalisée (tableau 2D)
    this.maxSize = maxSize;
    this.accessOrder = []; // Suit l'ordre LRU : le plus ancien à l'indice 0
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Génère une clé de hachage à partir du vecteur de caractéristiques pour le cache.
   * @param {Array} features - Tableau de caractéristiques à plat.
   * @returns {string} - Clé de hachage.
   * @private
   */
  _hashKey(features) {
    // Hachage simple : jointure des caractéristiques avec un séparateur pipe.
    return features.join("|");
  }

  /**
   * Récupère une séquence normalisée du cache (et la marque comme récemment utilisée).
   * @param {Array} features - Caractéristiques d'entrée (clé du cache).
   * @returns {Array | null} - Séquence normalisée en cache ou null si absente.
   */
  get(features) {
    const key = this._hashKey(features);
    if (this.cache.has(key)) {
      // Déplacement vers la fin (le plus récent)
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      this.accessOrder.push(key);
      this.hitCount++;
      // logger.debug(`Cache SUCCÈS (${this.hitCount} hits) - Réutilisation séquence normalisée`);
      return this.cache.get(key);
    }

    this.missCount++;
    // logger.debug(`Cache ÉCHEC (${this.missCount} misses) - Normalisation nouvelle séquence`);
    return null;
  }

  /**
   * Stocke une séquence normalisée dans le cache avec éviction LRU.
   * @param {Array} features - Caractéristiques d'entrée (clé du cache).
   * @param {Array} sequence - Séquence normalisée (tableau 2D après padding/tronquage).
   */
  set(features, sequence) {
    const key = this._hashKey(features);

    // Si la clé n'existe pas, on vérifie si on doit faire de la place
    if (!this.cache.has(key)) {
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.accessOrder.shift();
        // Pas besoin de dispose() — les séquences sont de simples tableaux JS.
        // Elles sont automatiquement libérées par le ramasse-miettes (GC).
        this.cache.delete(oldestKey);
        logger.debug(
          `Cache ÉVICTION : Suppression LRU (${this.cache.size}/${this.maxSize} entrées)`
        );
      }
    } else {
      // La clé existe déjà : mise à jour de sa position LRU
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    }

    // Ajout au cache et marquage comme plus récent
    this.cache.set(key, sequence);
    this.accessOrder.push(key);
    logger.debug(
      `Cache AJOUT : Séquence mise en cache (${this.cache.size}/${this.maxSize} entrées)`
    );
  }

  /**
   * Récupère les statistiques d'utilisation du cache.
   * @returns {Object} - { size, maxSize, hitRate, hitCount, missCount, total }
   */
  stats() {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? ((this.hitCount / total) * 100).toFixed(1) : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: `${hitRate}%`,
      total,
    };
  }

  /**
   * Vide toutes les séquences en cache.
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
    // logger.info("Cache vidé (toutes les séquences supprimées)");
  }

  /**
   * Réinitialise les statistiques sans vider le cache.
   */
  resetStats() {
    this.hitCount = 0;
    this.missCount = 0;
  }
}

// Instance globale (Singleton)
export const tensorCache = new TensorCache(50);