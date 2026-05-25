import { featureValidator } from '../features/FeatureValidator';
import { logger } from '../utils/logger';
import { ACTION_TYPES } from './event.schema';

export class DataCleaner {
  constructor() {
    this.thresholds = {
      minTimeBetweenActions: 100,
      maxFutureDrift: 1000,
    };
    this.rejectedFeaturesCount = 0;
    this.rejectionLog = [];
  }

  clean(eventBuffer) {
    // logger.info('--- Démarrage du nettoyage des données ---', {
    //   lot: eventBuffer.length,
    // });

    let cleaned = this.removeInvalidEvents(eventBuffer);

    cleaned = this.sortByTime(cleaned);

    cleaned = this.deduplicate(cleaned);

    cleaned = this.validateTimestamps(cleaned);

    logger.info(`Taille du lot nettoyé ${cleaned.length}`);
    return cleaned;
  }

  removeInvalidEvents(events) {
    return events.filter((event) => {
      if (!event.id || !event.timestamp || !event.payload) return false;

      if (event.type === ACTION_TYPES.CLICK && !event.payload.element)
        return false;

      return true;
    });
  }

  sortByTime(events) {
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  deduplicate(events) {
    const uniqueEvents = [];
    let lastEvent = null;

    for (const currentEvent of events) {
      if (!lastEvent) {
        uniqueEvents.push(currentEvent);
        lastEvent = currentEvent;
        continue;
      }

      const timeDiff = currentEvent.timestamp - lastEvent.timestamp;

      const isSameAction = currentEvent.type === lastEvent.type;

      const isSameTarget =
        JSON.stringify(currentEvent.payload) ===
        JSON.stringify(lastEvent.payload);

      if (
        isSameAction &&
        isSameTarget &&
        timeDiff < this.thresholds.minTimeBetweenActions
      ) {
        // logger.debug('# Duplicate event dropped:', { id: currentEvent.id });
        continue;
      }

      uniqueEvents.push(currentEvent);
      lastEvent = currentEvent;
    }
    return uniqueEvents;
  }

  validateTimestamps(events) {
    const now = Date.now();

    return events.filter((event) => {
      if (event.timestamp > now + this.thresholds.maxFutureDrift) {
        // logger.warn('# Event with invalid future timestamp dropped:', {
        //   id: event.id,
        //   timestamp: event.timestamp,
        // });
        return false;
      }

      return true;
    });
  }

    /**
   * Valide les features avant le pipeline d'inférence
   * PREMIÈRE étape du pipeline - arrête complètement si features invalides
   */
  validateFeatures(featuresArray) {
    const validationResult = featureValidator.validate(featuresArray);

    if (!validationResult.valid) {
      this.rejectedFeaturesCount++;
      const rejectionEntry = {
        timestamp: Date.now(),
        errors: validationResult.errors,
        details: validationResult.details,
      };
      this.rejectionLog.push(rejectionEntry);

      // Garder les 100 dernières rejections pour analyse
      if (this.rejectionLog.length > 100) {
        this.rejectionLog.shift();
      }

      logger.warn('🛡️ Features REJECTED - potential attack detected', {
        totalRejected: this.rejectedFeaturesCount,
        errors: validationResult.errors,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
      });

      return {
        valid: false,
        errors: validationResult.errors,
      };
    }

    // Features acceptées, mais log les warnings (outliers détectés)
    if (validationResult.warnings.length > 0) {
      logger.debug('⚠️ Features accepted but with warnings (outliers detected)', {
        warnings: validationResult.warnings,
      });
    }

    return { valid: true };
  }

  /**
   * Retourne le log des rejections pour analyse
   */
  getRejectionLog() {
    return {
      totalRejected: this.rejectedFeaturesCount,
      recentRejections: this.rejectionLog,
      rejectionRate: (this.rejectedFeaturesCount / (this.rejectedFeaturesCount + 1000)).toFixed(3),
    };
  }
}

export const dataCleaner = new DataCleaner();
