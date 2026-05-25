// Importer les classes nécessaires (elles doivent être disponibles globalement via le bundler)
// ATTENTION: Assurez-vous que SmartPredict.js expose ActionMapper et thresholdManager dans la window

import { ActionMapper } from "../decision/ActionMapper";
import { thresholdManager } from "../decision/ThresholdManager";

window.nlpFusionDemo = {
  // État
  profiles: [
    {
      name: "Comportement neutre + Sentiment négatif",
      churnScore: 0.4,
      nlpScore: 0.85,
      expectedWithNLP: "Alerte remontée grâce au sentiment",
      expectedWithoutNLP: "Pas d'alerte",
    },
    {
      name: "Comportement à risque + Sentiment positif",
      churnScore: 0.75,
      nlpScore: 0.2,
      expectedWithNLP: "Alerte atténuée par le sentiment",
      expectedWithoutNLP: "Alerte forte",
    },
    {
      name: "Comportement neutre + Sentiment neutre",
      churnScore: 0.5,
      nlpScore: 0.3,
      expectedWithNLP: "Pas d'alerte",
      expectedWithoutNLP: "Pas d'alerte",
    },
  ],

  results: {},

  // Étape 1 : Tester SANS le signal NLP (baseline)
  async testWithoutNLP() {
    console.log("\n🔴 === TEST SANS SIGNAL NLP (BASELINE) === 🔴\n");

    // Désactiver le signal NLP
    thresholdManager.setNLPEnabled(false);

    this.results.without_nlp = [];

    for (const profile of this.profiles) {
      try {
        // Créer une prédiction avec UNIQUEMENT le score churn
        const predictions = { churn: profile.churnScore };

        // Mapper SANS le nlpScore
        const actionMapper = new ActionMapper();
        const decision = actionMapper.map(predictions);

        if (!decision) {
          console.warn("⚠️ ActionMapper not available globally. Use STEP 1.");
          return;
        }

        this.results.without_nlp.push({
          profile: profile.name,
          churnScore: profile.churnScore,
          decision: decision.action,
          priority: decision.priority,
        });

        console.log(`
Profile: ${profile.name}
├─ Churn Score: ${profile.churnScore}
├─ NLP Sentiment Score: ${profile.nlpScore} (NOT USED)
├─ Decision: ${decision.action}
└─ Priority: ${decision.priority}
        `);
      } catch (err) {
        console.error(`❌ Error for profile "${profile.name}":`, err);
      }
    }

    console.log(
      "✅ BASELINE TEST COMPLETE. Check window.nlpFusionDemo.results.without_nlp",
    );
  },

  // Étape 2 : Tester AVEC le signal NLP
  async testWithNLP() {
    console.log("\n🟢 === TEST AVEC SIGNAL NLP (FUSION) === 🟢\n");

    // Activer le signal NLP
    thresholdManager.setNLPEnabled(true);

    this.results.with_nlp = [];

    for (const profile of this.profiles) {
      try {
        // Créer une prédiction avec churn ET nlpScore
        const predictions = { churn: profile.churnScore };

        // Mapper AVEC le nlpScore
        const actionMapper = new ActionMapper();
        const decision = actionMapper.map(predictions, profile.nlpScore);

        if (!decision) {
          console.warn("⚠️ ActionMapper not available globally. Use STEP 1.");
          return;
        }

        const nlpContribution = decision.meta?.nlpContribution || {};

        this.results.with_nlp.push({
          profile: profile.name,
          churnScore: profile.churnScore,
          nlpScore: profile.nlpScore,
          fusedScore: nlpContribution.score_after_fusion,
          contribution: nlpContribution.contribution,
          decision: decision.action,
          priority: decision.priority,
        });

        console.log(`
Profile: ${profile.name}
├─ Churn Score: ${profile.churnScore}
├─ NLP Sentiment: ${profile.nlpScore}
├─ NLP Contribution: ${nlpContribution.contribution}
├─ Decision: ${decision.action}
└─ Priority: ${decision.priority}
        `);
      } catch (err) {
        console.error(`❌ Error for profile "${profile.name}":`, err);
      }
    }

    console.log(
      "✅ FUSION TEST COMPLETE. Check window.nlpFusionDemo.results.with_nlp",
    );
  },

  // Étape 3 : Comparer les résultats
  async compareResults() {
    console.log("\n🔵 === COMPARAISON BEFORE/AFTER === 🔵\n");

    if (!this.results.without_nlp || !this.results.with_nlp) {
      console.warn("⚠️ Run testWithoutNLP() et testWithNLP() d'abord");
      return;
    }

    for (let i = 0; i < this.profiles.length; i++) {
      const profile = this.profiles[i];
      const without = this.results.without_nlp[i];
      const with_nlp = this.results.with_nlp[i];

      const changed =
        without.decision !== with_nlp.decision ? "✨ CHANGED" : "→ Same";

      console.log(`
Profile: ${profile.name}
├─ Without NLP: ${without.decision}
├─ With NLP:    ${with_nlp.decision}
└─ ${changed}
      `);
    }

    console.log("\n📊 INTERPRETATION:");
    console.log("✅ = Signal NLP améliore la décision (plus pertinent)");
    console.log(
      "⚠️  = Signal NLP change la décision (vérifier pertinence métier)",
    );
    console.log("✓  = Signal NLP ne change rien (cas neutre)");
  },

  // Étape 4 : Afficher la contribution détaillée
  async showDetailedMetrics() {
    console.log("\n🟡 === MÉTRIQUES DÉTAILLÉES === 🟡\n");

    if (!this.results.with_nlp) {
      console.warn("⚠️ Run testWithNLP() d'abord");
      return;
    }

    for (const result of this.results.with_nlp) {
      console.log(`
Profile: ${result.profile}
├─ Churn Score (original):   ${result.churnScore}
├─ NLP Sentiment:            ${result.nlpScore}
├─ Contribution NLP:         ${result.contribution}
├─ Decision:                 ${result.decision}
└─ Priority:                 ${result.priority}
      `);
    }

    console.log(
      "✅ Full metrics available at: window.nlpFusionDemo.results.with_nlp",
    );
  },
};

console.log("✅ nlpFusionDemo initialized. Run:");
console.log("  1. nlpFusionDemo.testWithoutNLP()");
console.log("  2. nlpFusionDemo.testWithNLP()");
console.log("  3. nlpFusionDemo.compareResults()");
console.log("  4. nlpFusionDemo.showDetailedMetrics()");
