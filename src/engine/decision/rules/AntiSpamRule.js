import { DECISION_ACTIONS, PRIORITY_LEVELS } from '../ActionEnums';
import { logger } from '../../utils/logger';

export class AntiSpamRule {
  constructor(cooldownMs = 5 * 60 * 1000) {
    this.cooldownMs = cooldownMs;
  }

  execute(decision, context) {
    if (!decision.action.startsWith('OFFER_')) {
      return decision;
    }

    const lastPromoTime = context.lastPromoTimestamp || 0;
    const now = Date.now();
    const timeSinceLast = now - lastPromoTime;

    if (timeSinceLast < this.cooldownMs) {
      logger.warn(
        ` RULE: AntiSpam blocked ${decision.action}. (Cooldown active)`
      );

      return {
        ...decision,
        action: DECISION_ACTIONS.DO_NOTHING,
        priority: PRIORITY_LEVELS.LOW,
        reason: 'ANTI_SPAM_COOLDOWN',
      };
    }
    return decision;
  }
}
