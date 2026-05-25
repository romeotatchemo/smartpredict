/**
 * FEATURE VALIDATOR - Validation complète contre les attaques adversariales
 *
 * Valide les 16 features du pipeline churn selon trois critères:
 * 1. Types et plages attendues
 * 2. Z-score pour détecter les valeurs extrêmes
 * 3. IQR pour détecter les outliers sans supposer une distribution gaussienne
 *
 */
import { logger } from '../utils/logger';

export class FeatureValidator {
  constructor() {
    // CONFIGURATION 1: Types et plages pour les 16 features
    // Structure: temporal (4) + page oneHot (8) + action oneHot (4) = 16
    this.featureSchema = {
      // Temporal features (indices 0-3)
      deltaTime: { type: 'number', min: 0, max: 1, index: 0 },
      velocity: { type: 'number', min: 0, max: 10, index: 1 },
      acceleration: { type: 'number', min: -5, max: 5, index: 2 },
      relativeTime: { type: 'number', min: 0, max: 1, index: 3 },

      // Page oneHot (indices 4-11)
      // Chaque page est un 0 ou 1 (one-hot encoding)
      page_home: { type: 'binary', min: 0, max: 1, index: 4 },
      page_pricing: { type: 'binary', min: 0, max: 1, index: 5 },
      page_cart: { type: 'binary', min: 0, max: 1, index: 6 },
      page_checkout: { type: 'binary', min: 0, max: 1, index: 7 },
      page_services: { type: 'binary', min: 0, max: 1, index: 8 },
      page_about: { type: 'binary', min: 0, max: 1, index: 9 },
      page_account: { type: 'binary', min: 0, max: 1, index: 10 },
      page_unsubscribe: { type: 'binary', min: 0, max: 1, index: 11 },

      // Action oneHot (indices 12-15)
      action_click: { type: 'binary', min: 0, max: 1, index: 12 },
      action_scroll: { type: 'binary', min: 0, max: 1, index: 13 },
      action_submit: { type: 'binary', min: 0, max: 1, index: 14 },
      action_view: { type: 'binary', min: 0, max: 1, index: 15 },
    };

    // CONFIGURATION 2: Statistiques de référence pour détection des outliers
    // Calculées à partir du dataset d'entraînement (generateChurnDataset.js)
    this.referenceStats = {
      deltaTime: { mean: 0.5, stddev: 0.2, q1: 0.35, q3: 0.65 },
      velocity: { mean: 2.5, stddev: 1.2, q1: 1.5, q3: 3.5 },
      acceleration: { mean: 0.1, stddev: 0.8, q1: -0.5, q3: 0.7 },
      relativeTime: { mean: 0.5, stddev: 0.25, q1: 0.25, q3: 0.75 },
    };

    // Seuils de sensibilité
    this.outlierThresholds = {
      zScoreThreshold: 3.0, // Valeur aberrante si |z-score| > 3
      iqrMultiplier: 1.5,   // IQR: Q1 - 1.5*IQR, Q3 + 1.5*IQR
    };

    // Résultat structuré retourné par validate()
    this.lastValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      details: {
        typeErrors: [],
        rangeErrors: [],
        outliersByZScore: [],
        outliersByIQR: [],
        clippedValues: [],
      },
    };
  }

  /**
   * Point d'entrée: Valide un ensemble de features complet (16 valeurs)
   * Retourne un objet structuré avec valid, errors, warnings et détails
   */
  validate(featuresArray) {
    // Réinitialiser le résultat
    this.lastValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      details: {
        typeErrors: [],
        rangeErrors: [],
        outliersByZScore: [],
        outliersByIQR: [],
        clippedValues: [],
      },
    };

    // ===== COUCHE 1: Validation de base (type, présence, structure)
    if (!Array.isArray(featuresArray) || featuresArray.length !== 16) {
      this.lastValidationResult.valid = false;
      this.lastValidationResult.errors.push(
        `Feature array must be exactly 16 elements, got ${featuresArray.length}`
      );
      logger.warn('Validation Failed: Invalid feature array structure', {
        length: featuresArray.length,
        expected: 16,
      });
      return this.lastValidationResult;
    }

    // ===== COUCHE 2: Validation des types et plages
    const typeAndRangeValid = this._validateTypeAndRange(featuresArray);
    if (!typeAndRangeValid) {
      this.lastValidationResult.valid = false;
    }

    // ===== COUCHE 3: Détection des valeurs aberrantes (Z-score + IQR)
    const outlierValid = this._validateOutliers(featuresArray);
    if (!outlierValid) {
      // Note: les outliers retournent un warning, pas une erreur complète
      // Sauf si trop nombreux (voir _validateOutliers)
      if (this.lastValidationResult.details.outliersByZScore.length > 5 ||
          this.lastValidationResult.details.outliersByIQR.length > 5) {
        this.lastValidationResult.valid = false;
        this.lastValidationResult.errors.push(
          'Too many outliers detected - potential adversarial attack'
        );
      }
    }

    // ===== COUCHE 4: Validation OneHot encoding
    const oneHotValid = this._validateOneHotEncoding(featuresArray);
    if (!oneHotValid) {
      this.lastValidationResult.valid = false;
    }

    // ===== Log du résultat
    if (this.lastValidationResult.valid) {
      logger.debug('Feature validation passed', {
        warnings: this.lastValidationResult.warnings.length,
      });
    } else {
      logger.warn('Feature validation failed', {
        errors: this.lastValidationResult.errors,
        warnings: this.lastValidationResult.warnings,
      });
    }

    return this.lastValidationResult;
  }

  /**
   * COUCHE 2: Validation des types et plages
   */
  _validateTypeAndRange(featuresArray) {
    let hasError = false;

    for (const [featureName, schema] of Object.entries(this.featureSchema)) {
      const index = schema.index;
      const value = featuresArray[index];

      // Vérifier le type
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        this.lastValidationResult.details.typeErrors.push({
          feature: featureName,
          index: index,
          value: value,
          expectedType: schema.type,
        });
        this.lastValidationResult.errors.push(
          `${featureName}: expected ${schema.type}, got ${typeof value}`
        );
        hasError = true;
        continue;
      }

      // Vérifier la plage
      if (value < schema.min || value > schema.max) {
        this.lastValidationResult.details.rangeErrors.push({
          feature: featureName,
          index: index,
          value: value,
          expectedRange: [schema.min, schema.max],
          deviation: value < schema.min ? schema.min - value : value - schema.max,
        });
        this.lastValidationResult.errors.push(
          `${featureName}: value ${value} outside range [${schema.min}, ${schema.max}]`
        );
        hasError = true;
      }

      // Pour binary (pages et actions), ajouter un warning si valeur intermédiaire
      if (schema.type === 'binary' && (value !== 0 && value !== 1)) {
        this.lastValidationResult.warnings.push(
          `${featureName}: binary feature should be 0 or 1, got ${value} (clipped)`
        );
        this.lastValidationResult.details.clippedValues.push({
          feature: featureName,
          original: value,
          clipped: value < 0.5 ? 0 : 1,
        });
      }
    }

    return !hasError;
  }

  /**
   * COUCHE 3: Détection des valeurs aberrantes
   */
  _validateOutliers(featuresArray) {
    // Indices pour les temporal features seulement (les pages et actions sont toujours 0/1)
    const temporalIndices = [
      { name: 'deltaTime', idx: 0 },
      { name: 'velocity', idx: 1 },
      { name: 'acceleration', idx: 2 },
      { name: 'relativeTime', idx: 3 },
    ];

    for (const { name, idx } of temporalIndices) {
      const value = featuresArray[idx];
      const stats = this.referenceStats[name];

      if (!stats) continue;

      // Z-score: (value - mean) / stddev
      const zScore = Math.abs((value - stats.mean) / stats.stddev);
      if (zScore > this.outlierThresholds.zScoreThreshold) {
        this.lastValidationResult.details.outliersByZScore.push({
          feature: name,
          value: value,
          zScore: zScore,
          threshold: this.outlierThresholds.zScoreThreshold,
        });
        this.lastValidationResult.warnings.push(
          `${name}: Z-score ${zScore.toFixed(2)} exceeds threshold (potential outlier)`
        );
      }

      // IQR: Q1 - 1.5*IQR ou Q3 + 1.5*IQR
      const iqr = stats.q3 - stats.q1;
      const lowerBound = stats.q1 - this.outlierThresholds.iqrMultiplier * iqr;
      const upperBound = stats.q3 + this.outlierThresholds.iqrMultiplier * iqr;

      if (value < lowerBound || value > upperBound) {
        this.lastValidationResult.details.outliersByIQR.push({
          feature: name,
          value: value,
          bounds: [lowerBound, upperBound],
          iqr: iqr,
        });
        this.lastValidationResult.warnings.push(
          `${name}: value ${value.toFixed(3)} outside IQR bounds (potential outlier)`
        );
      }
    }

    // Retourner false si outliers détectés (permet d'ajouter warnings à la validation)
    return this.lastValidationResult.details.outliersByZScore.length === 0 &&
           this.lastValidationResult.details.outliersByIQR.length === 0;
  }

  /**
   * COUCHE 4: Validation OneHot encoding
   * Les pages et actions doivent être one-hot: exactement une valeur = 1
   */
  _validateOneHotEncoding(featuresArray) {
    // Pages: indices 4-11 (8 pages)
    const pageValues = featuresArray.slice(4, 12);
    const pageSum = pageValues.reduce((a, b) => a + b, 0);

    if (Math.abs(pageSum - 1.0) > 0.01) {
      this.lastValidationResult.details.rangeErrors.push({
        feature: 'page_oneHot',
        values: pageValues,
        sum: pageSum,
        expected: 1.0,
      });
      this.lastValidationResult.errors.push(
        `page_oneHot: sum should be 1.0, got ${pageSum.toFixed(2)} (invalid one-hot encoding)`
      );
      return false;
    }

    // Actions: indices 12-15 (4 actions)
    const actionValues = featuresArray.slice(12, 16);
    const actionSum = actionValues.reduce((a, b) => a + b, 0);

    if (Math.abs(actionSum - 1.0) > 0.01) {
      this.lastValidationResult.details.rangeErrors.push({
        feature: 'action_oneHot',
        values: actionValues,
        sum: actionSum,
        expected: 1.0,
      });
      this.lastValidationResult.errors.push(
        `action_oneHot: sum should be 1.0, got ${actionSum.toFixed(2)} (invalid one-hot encoding)`
      );
      return false;
    }

    return true;
  }

  /**
   * Retourne les résultats de la dernière validation
   */
  getLastResult() {
    return this.lastValidationResult;
  }
}

export const featureValidator = new FeatureValidator();