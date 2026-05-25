import { logger } from '../utils/logger';
import { ACTION_TYPES } from './event.schema';

export class EventNormalizer {
  static normalize(action, rawContext) {
    if (!ACTION_TYPES[action]) {
      logger.warn(`Action inconnue rejetée : ${action}`);
      return null;
    }

    return {
      type: ACTION_TYPES[action],
      payload: rawContext,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    };
  }
}
