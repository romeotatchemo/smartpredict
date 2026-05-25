/**
 * FEATURE NORMALIZER - V2.0
 *
 * Classe responsable de la normalisation des features numériques.
 * Utilisée dans le pipeline d'extraction des features pour le modèle ML.
 *
 * ✨ V2 IMPROVEMENTS:
 * - ✅ Typo corrigé: "Feauture" → "Feature" (v1 bug)
 * - ✅ JSDoc documentation complète
 * - ✅ Bounds tracking pour min/max normalization
 *
 * USAGE:
 * const normalizer = new FeatureNormalizer();
 * normalizer.updateBounds(rawFeatures);  // Recorder les limites
 * const normalized = normalizer.normalize(rawFeatures);  // Normaliser
 *
 * @since 2.0.0
 */
export class FeatureNormalizer {
  /**
   * Constructeur - Initialise le tracking des bounds
   * @constructs FeatureNormalizer
   */
  constructor() {
    /**
     * Bounds object : enregistre min/max de chaque feature pour normalisation
     * Format: { featureName: { min: number, max: number }, ... }
     * @type {Object.<string, {min: number, max: number}>}
     */
    this.bounds = {};
  }

  /**
   * Met à jour les bounds (min/max) pour chaque feature.
   *
   * Utilisé pendant l'entraînement pour calibrer les limites de normalisation.
   * Chaque nouvelle valeur met à jour le min/max si nécessaire.
   *
   * @param {Object.<string, number>} features - Dictionnaire des features numériques
   *        Exemple: { pageViewCount: 5, timeSpentSeconds: 120, bounceRate: 0.3 }
   * @returns {void}
   */
  updateBounds(features) {
    for (const [key, value] of Object.entries(features)) {
      if (!this.bounds[key]) {
        this.bounds[key] = { min: value, max: value };
        continue;
      }

      if (value < this.bounds[key].min) {
        this.bounds[key].min = value;
      }

      if (value > this.bounds[key].max) {
        this.bounds[key].max = value;
      }
    }
  }

  /**
   * Normalise les features au range [0, 1] en utilisant min-max scaling.
   *
   * Formule: normalized = (value - min) / (max - min)
   *
   * Edge cases:
   * - Si bound ou (max === min): retourne 0 (feature constante)
   * - Valeurs outside bounds: clippées à [0, 1]
   *
   * @param {Object.<string, number>} features - Dictionnaire des features brutes
   * @returns {Object.<string, number>} Dictionnaire des features normalisées [0-1]
   *
   * @example
   * const raw = { pageViews: 100 };
   * const normalized = normalizer.normalize(raw);
   * // Si bounds était { min: 0, max: 200 }
   * // normalized = { pageViews: 0.5 }
   */
  normalize(features) {
    const normalized = {};

    for (const [key, value] of Object.entries(features)) {
      const bound = this.bounds[key];

      if (!bound || bound.max === bound.min) {
        normalized[key] = 0;
        continue;
      }

      let normValue = (value - bound.min) / (bound.max - bound.min);

      if (normValue > 1) normValue = 1;
      if (normValue < 0) normValue = 0;

      normalized[key] = normValue;
    }
    return normalized;
  }
}

export const featureNormalizer = new FeatureNormalizer();
