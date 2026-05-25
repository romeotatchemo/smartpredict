import { logger } from '../utils/logger';

export class ThresholdManager {
  constructor() {
    this.thresholds = {
      churn: { medium: 0.7, high: 0.9 },
    };

    // Configuration NLP : poids et activation
    this.nlpConfig = {
      enabled: true, // Flag d'activation du signal NLP
      churnWeight: 0.7, // 70% signal comportemental
      nlpWeight: 0.3, // 30% signal sémantique
      negativeAmplifier: 1.3, // Si sentiment négatif, amplifier le score churn de 30%
    };
  }

  async load() {
    try {
      const response = await fetch('/config/thresholds.json');

      if (!response.ok) throw new Error('Config file not found');

      const config = await response.json();
      this.thresholds = { ...this.thresholds, ...config };

      // logger.info('⚙️ Thresholds loaded:', this.thresholds);
    } catch (error) {
      logger.warn(
        '⚠️ Failed to load remote thresholds. Using defaults.',
        error
      );
    }
  }

  get(metric, level) {
    return this.thresholds[metric]?.[level] || 0.99;
  }

  /**
   * Fusionne le score churn avec le score NLP
   * Pondération linéaire : score_fusionné = (churnScore * poids_churn) + (nlpScore * poids_nlp)
   * Puis clipping pour rester dans [0, 1]
   * 
   * @param {number} churnScore - Score churn brut (0-1)
   * @param {number} nlpScore - Score sentiment (0 = positif, 1 = négatif)
   * @returns {Object} { fusedScore, churnScore, nlpScore, contribution, reasoning }
   */
  fuseChurnWithNLP(churnScore, nlpScore) {
    // Si le signal NLP est désactivé, retourner juste le score churn
    if (!this.nlpConfig.enabled) {
      return {
        fusedScore: churnScore,
        churnScore: churnScore,
        nlpScore: null,
        contribution: 0,
        reasoning: 'NLP signal disabled',
      };
    }

    // Valider les entrées
    if (typeof churnScore !== 'number' || typeof nlpScore !== 'number') {
      logger.warn('⚠️ Invalid scores in fuseChurnWithNLP', { churnScore, nlpScore });
      return {
        fusedScore: churnScore,
        churnScore: churnScore,
        nlpScore: null,
        contribution: 0,
        reasoning: 'Invalid input',
      };
    }

    // Normaliser nlpScore : vient du softmax, format [positif, négatif, neutre] → on récupère le score négatif
    // Clamper à [0, 1]
    const normalizedNlpScore = Math.max(0, Math.min(1, nlpScore));

    // Fusion linéaire pondérée
    const fusedScore =
      churnScore * this.nlpConfig.churnWeight +
      normalizedNlpScore * this.nlpConfig.nlpWeight;

    // Clipping final : le score fusionné ne doit jamais dépasser [0, 1]
    const clippedScore = Math.max(0, Math.min(1, fusedScore));

    // Calculer la contribution NLP (différence avant/après)
    const contribution = clippedScore - churnScore;

    // Déterminer le reasoning pour le logging
    let reasoning = '';
    if (normalizedNlpScore > 0.7) {
      reasoning = 'Strong negative sentiment → score amplified';
    } else if (normalizedNlpScore > 0.4) {
      reasoning = 'Moderate negative sentiment → score balanced';
    } else {
      reasoning = 'Positive/neutral sentiment → score mitigated';
    }

    return {
      fusedScore: parseFloat(clippedScore.toFixed(3)),
      churnScore: parseFloat(churnScore.toFixed(3)),
      nlpScore: parseFloat(normalizedNlpScore.toFixed(3)),
      contribution: parseFloat(contribution.toFixed(3)),
      reasoning: reasoning,
    };
  }

  /**
   * Exposer/modifier le flag NLP
   */
  setNLPEnabled(enabled) {
    this.nlpConfig.enabled = enabled;
    logger.info(`NLP signal ${enabled ? 'activated' : 'deactivated'}`);
  }

  getNLPEnabled() {
    return this.nlpConfig.enabled;
  }

  /**
   * Modifier les poids
   */
  setNLPWeights(churnWeight, nlpWeight) {
    const total = churnWeight + nlpWeight;
    if (Math.abs(total - 1.0) > 0.01) {
      logger.warn('⚠️ Weights must sum to ~1.0, normalizing...');
      this.nlpConfig.churnWeight = churnWeight / total;
      this.nlpConfig.nlpWeight = nlpWeight / total;
    } else {
      this.nlpConfig.churnWeight = churnWeight;
      this.nlpConfig.nlpWeight = nlpWeight;
    }
    logger.info('⚙️ NLP weights updated', this.nlpConfig);
  }
}

export const thresholdManager = new ThresholdManager();