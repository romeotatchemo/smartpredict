import { thresholdManager } from '../decision/ThresholdManager';
import { ActionMapper } from '../decision/ActionMapper';
import { HybridEngine } from '../decision/HybridEngine';
import { logger } from '../utils/logger';

export class DecisionTest {
  constructor() {
    this.mapper = new ActionMapper();
    this.engine = new HybridEngine();
  }

  async runAll() {
    logger.info(' STARTING DECISION ENGINE CRASH-TEST...');

    await thresholdManager.load();
    logger.info('✅ Thresholds Loaded.');

    this.testNominal();
    this.testExclusion();
    this.testUncertainty();
    this.testEdgeCases();
  }

  testNominal() {
    logger.info('--- TEST A: Nominal Case (High Score) ---');

    const prediction = { churn: 0.95 };
    const context = { lastPromoTimestamp: 0 };

    const initial = this.mapper.map(prediction);
    const final = this.engine.decide(initial, context);

    if (final.action === 'OFFER_DISCOUNT_AGGRESSIVE') {
      logger.info('✅ SUCCESS: Engine triggered PROMO as expected.');
    } else {
      logger.error(`❌ FAIL: Expected PROMO, got ${final.action}`);
    }
  }

  testExclusion() {
    logger.info('--- TEST B: Exclusion (Anti-Spam Rule) ---');

    const prediction = { churn: 0.95 };
    const context = { lastPromoTimestamp: Date.now() };

    const initial = this.mapper.map(prediction);
    const final = this.engine.decide(initial, context);

    if (
      final.action === 'DO_NOTHING' &&
      final.reason === 'ANTI_SPAM_COOLDOWN'
    ) {
      logger.info('✅ SUCCESS: Engine BLOCKED the promo (Anti-Spam active).');
    } else {
      logger.error(`❌ FAIL: Expected BLOCK, got ${final.action}`);
    }
  }

  testUncertainty() {
    logger.info('--- TEST C: Uncertainty Zone ---');

    const prediction = { churn: 0.55 };
    const context = {};

    const initial = this.mapper.map(prediction);
    const final = this.engine.decide(initial, context);

    if (final.priority <= 1) {
      logger.info(`✅ SUCCESS: Engine stayed quiet (Action: ${final.action}).`);
    } else {
      logger.warn(`⚠️ WARNING: Engine was too aggressive for score 0.55.`);
    }
  }

  testEdgeCases() {
    logger.info('--- TEST D: Edge Cases (Corruption) ---');

    const toxicInputs = [
      { churn: NaN },
      { churn: undefined },
      { churn: null },
      {}, // Objet vide
    ];

    toxicInputs.forEach((input, index) => {
      try {
        const result = this.mapper.map(input);

        // On vérifie qu'on a bien un objet valide en sortie, même si l'entrée est pourrie
        if (result && result.action) {
          logger.info(
            `✅ Safe Fallback for input #${index} -> ${result.action}`
          );
        } else {
          logger.error(`❌ Invalid output for input #${index}`);
        }
      } catch (e) {
        logger.error(`🔥 CRITICAL CRASH on input #${index}`, e);
      }
    });
  }
}
