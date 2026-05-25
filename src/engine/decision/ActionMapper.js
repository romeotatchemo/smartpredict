import { DECISION_ACTIONS, PRIORITY_LEVELS } from "./ActionEnums";
import { logger } from "../utils/logger";
import { thresholdManager } from "./ThresholdManager";

export class ActionMapper {
  _calculateConfidence(score) {
    return parseFloat((Math.abs(score - 0.5) * 2).toFixed(2));
  }

  /**
   * Map predictions à actions
   * CHANGEMENT : accepte un paramètre optionnel nlpScore
   * 
   * @param {Object} predictions - { churn: number, ... }
   * @param {number} nlpScore - (optionnel) Score du sentiment négatif (0-1)
   * @returns {Object} decision - { action, priority, meta, payload }
   */
  map(predictions, nlpScore = null) {
    logger.debug("🔍 Mapping predictions to actions...", { predictions, nlpScore });

    const churnScore = predictions.churn || 0;

    // Si nlpScore est fourni et ThresholdManager a la fusion activée, fusionner les scores
    let finalScore = churnScore;
    let nlpContribution = null;

    if (nlpScore !== null && thresholdManager.getNLPEnabled()) {
      const fusionResult = thresholdManager.fuseChurnWithNLP(churnScore, nlpScore);
      finalScore = fusionResult.fusedScore;
      nlpContribution = {
        nlpScore: fusionResult.nlpScore,
        contribution: fusionResult.contribution,
        reasoning: fusionResult.reasoning,
      };

      logger.info('📊 NLP Fusion Applied', {
        churnScore: fusionResult.churnScore,
        nlpScore: fusionResult.nlpScore,
        fusedScore: fusionResult.fusedScore,
        contribution: fusionResult.contribution,
      });
    }

    // Mapper le score (churn seul ou fusionné) à une action
    return this._mapChurn(finalScore, nlpContribution);
  }

  /**
   * Logique interne de mapping (rétro-compatible)
   */
  _mapChurn(score, nlpContribution = null) {
    const confidence = this._calculateConfidence(score);

    const decision = {
      action: DECISION_ACTIONS.DO_NOTHING,
      priority: PRIORITY_LEVELS.LOW,
      meta: { score, confidence, type: "CHURN", nlpContribution },
    };

    const highThreshold = thresholdManager.get("churn", "high");
    const mediumThreshold = thresholdManager.get("churn", "medium");

    if (score >= highThreshold) {
      decision.action = DECISION_ACTIONS.OFFER_DISCOUNT_AGGRESSIVE;
      decision.priority = PRIORITY_LEVELS.HIGH;
      decision.payload = {
        discountValue: 20,
        code: "SAVE20",
        text: "Ne partez pas !",
      };
    } else if (score >= mediumThreshold) {
      decision.action = DECISION_ACTIONS.OFFER_DISCOUNT_SMALL;
      decision.priority = PRIORITY_LEVELS.MEDIUM;
      decision.payload = {
        discountValue: 5,
        code: "STAY5",
        text: "Juste pour vous.",
      };
    } else if (score >= 0.4) {
      decision.action = DECISION_ACTIONS.LOG_RISK;
    }

    return decision;
  }
}