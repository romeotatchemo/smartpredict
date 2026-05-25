/**
 * SentimentTrainingPipeline.js - Pipeline d'entraînement du classifieur de sentiment
 * 
 * Flux complet pour générer un modèle de production:
 * 1. Charger USE via ModelRegistry
 * 2. Charger SentimentClassifier et l'instancier
 * 3. Générer les embeddings USE pour tout le dataset en une passe
 * 4. Séparer en train/test 80/20
 * 5. Entraîner avec callback pour affichage en temps réel
 * 6. Évaluer sur test set
 * 7. Exporter les poids en format TensorFlow.js (model.json + .bin)
 * 
 * Les fichiers exportés vont dans public/models/sentiment/ et seront chargés
 * en production via ModelRegistry (comme Coco-SSD ou Churn)
 * 
 * Usage (flux complet):
 * const pipeline = new SentimentTrainingPipeline();
 * await pipeline.runFullPipeline((metrics) => console.log(metrics));
 */

import { ModelRegistry } from '../models/ModelRegistry.js';
import { SentimentClassifier } from './SentimentClassifier.js';
import { sentimentDataset, getDatasetStats } from './sentimentDataset.js';

export class SentimentTrainingPipeline {
  constructor() {
    this.useModel = null;
    this.classifier = null;
    this.embeddings = null;
    this.labels = null;
    this.trainIndices = [];
    this.testIndices = [];
    this.trainingMetrics = {
      accuracy: 0,
      testAccuracy: 0,
      finalLoss: 0,
    };
  }

  /**
   * Phase 1: Initialisation — charger USE et SentimentClassifier
   */
  async init() {
    console.log('🚀 Sentiment Training Pipeline - Initializing...');

    try {
      // Charger USE via ModelRegistry
      console.log('📦 Loading USE model...');
      this.useModel = await ModelRegistry.get('use');
      console.log('✅ USE model loaded');

      // Instancier SentimentClassifier et construire l'architecture
      console.log('🔨 Building Sentiment Classifier...');
      this.classifier = new SentimentClassifier();
      this.classifier.buildModel();
      console.log('✅ Classifier ready');

      // Afficher les stats du dataset
      const stats = getDatasetStats();
      console.log('📊 Dataset stats:', stats);

      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Phase 2: Générer les embeddings USE pour tout le dataset
   * C'est TRÈS rapide car on appelle embed() une seule fois pour tout le dataset
   */
  async generateEmbeddings() {
    console.log('🧠 Generating USE embeddings for all dataset...');

    try {
      // Extraire les textes du dataset
      const texts = sentimentDataset.map((sample) => sample.text);

      // Mesurer le temps de génération
      const startTime = performance.now();

      // APPEL UNIQUE à embed() pour TOUS les textes — c'est la clé!
      const embeddingsTensor = await this.useModel.embed(texts);

      // Convertir le tenseur 2D en array JavaScript 2D
      // embeddingsTensor a la shape [178, 512]
      // .array() retourne un array 2D directement
      this.embeddings = await embeddingsTensor.array();
      embeddingsTensor.dispose(); // Libérer le tenseur

      const elapsed = performance.now() - startTime;
      console.log(`✅ Embeddings generated in ${elapsed.toFixed(0)}ms`);
      console.log(`   Shape: ${this.embeddings.length} samples × ${this.embeddings[0].length} dimensions`);

      return this.embeddings;
    } catch (error) {
      console.error('❌ Failed to generate embeddings:', error.message);
      throw error;
    }
  }

  /**
   * Phase 3: Préparer les labels one-hot et séparer train/test
   */
  async prepareDataset(trainSplit = 0.8) {
    console.log(`📋 Preparing dataset with ${trainSplit * 100}% train / ${(1 - trainSplit) * 100}% test...`);

    // Convertir les labels en one-hot encoding
    // 0 (positif) → [1, 0, 0]
    // 1 (négatif) → [0, 1, 0]
    // 2 (neutre)  → [0, 0, 1]
    this.labels = sentimentDataset.map((sample) => {
      const oneHot = [0, 0, 0];
      oneHot[sample.label] = 1;
      return oneHot;
    });

    // Créer des indices et les mélanger
    const totalSamples = sentimentDataset.length;
    const indices = Array.from({ length: totalSamples }, (_, i) => i);
    
    // Mélanger les indices (Fisher-Yates shuffle)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Séparer train/test
    const splitIndex = Math.floor(totalSamples * trainSplit);
    this.trainIndices = indices.slice(0, splitIndex);
    this.testIndices = indices.slice(splitIndex);

    console.log(
      `✅ Train: ${this.trainIndices.length} | Test: ${this.testIndices.length}`
    );

    return { trainIndices: this.trainIndices, testIndices: this.testIndices };
  }

  /**
   * Phase 4: Entraîner le modèle sur train set avec callback
   * Le callback reçoit les métriques à chaque époque pour affichage
   */
  async train(onEpochEnd = null) {
    console.log('🎓 Training Sentiment Classifier...');

    try {
      // Préparer les données d'entraînement
      // this.embeddings est déjà un array 2D [n_samples, 512]
      const trainEmbeddings = this.trainIndices.map((i) => this.embeddings[i]);
      const trainLabels = this.trainIndices.map((i) => this.labels[i]);

      // Entraîner avec callback
      await this.classifier.train(trainEmbeddings, trainLabels, {
        epochs: 100,
        batchSize: 16,
        validationSplit: 0.2,
        onEpochEnd,
        verbose: 1,
      });

      console.log('✅ Training complete');

      // Sauvegarder la métrique de training accuracy
      const summary = this.classifier.getTrainingSummary();
      this.trainingMetrics.accuracy = summary.finalAccuracy;
      this.trainingMetrics.finalLoss = summary.finalLoss;
    } catch (error) {
      console.error('❌ Training failed:', error.message);
      throw error;
    }
  }

  /**
   * Phase 5: Évaluer le modèle sur le test set
   */
  async evaluate() {
    console.log('📊 Evaluating on test set...');

    try {
      // this.embeddings est déjà un array 2D [n_samples, 512]
      const testEmbeddings = this.testIndices.map((i) => this.embeddings[i]);
      const predictions = this.classifier.predictBatch(testEmbeddings);

      // Compter les bonnes prédictions
      let correct = 0;
      for (let i = 0; i < predictions.length; i++) {
        const trueLabel = sentimentDataset[this.testIndices[i]].label;
        const labelMap = { positif: 0, négatif: 1, neutre: 2 };
        if (labelMap[predictions[i].predicted] === trueLabel) {
          correct++;
        }
      }

      const accuracy = correct / predictions.length;
      this.trainingMetrics.testAccuracy = accuracy;

      console.log(
        `✅ Test Accuracy: ${(accuracy * 100).toFixed(2)}% (${correct}/${predictions.length})`
      );

      return { accuracy, correct, total: predictions.length };
    } catch (error) {
      console.error('❌ Evaluation failed:', error.message);
      throw error;
    }
  }

  /**
   * Phase 6: Tester manuellement sur quelques phrases
   */
  async testSinglePhrases(phrases = []) {
    console.log('🧪 Testing on custom phrases...');

    if (phrases.length === 0) {
      console.log('ℹ️ No phrases provided, using defaults');
      phrases = [
        'J\'adore ce produit, c\'est formidable!',
        'C\'est horrible, c\'est une arnaque.',
        'C\'est correct, rien de spécial.',
      ];
    }

    try {
      // Générer embeddings pour ces phrases
      const embeddingsTensor = await this.useModel.embed(phrases);
      const embeddingsArray = await embeddingsTensor.array();
      embeddingsTensor.dispose();

      // Prédire
      const results = [];
      for (let i = 0; i < phrases.length; i++) {
        // embeddingsArray est déjà un array 2D [n_phrases, 512]
        const embedding = embeddingsArray[i];
        const prediction = this.classifier.predictSingle(embedding);
        results.push({
          phrase: phrases[i],
          prediction: prediction.predicted,
          confidence: prediction.confidence,
          scores: prediction,
        });
        console.log(`"${phrases[i]}"`);
        console.log(`  → ${prediction.predicted} (${(prediction.confidence * 100).toFixed(1)}%)`);
      }

      return results;
    } catch (error) {
      console.error('❌ Testing failed:', error.message);
      throw error;
    }
  }

  /**
   * Phase 7: Exporter le modèle entraîné en format TensorFlow.js
   * 
   * Génère:
   * - model.json (architecture et metadata)
   * - sentiment.weights.bin (poids du modèle)
   * 
   * Ces fichiers doivent être placés dans public/models/sentiment/
   * et seront chargés en production via ModelRegistry
   */
  async exportForProduction() {
    console.log('📦 Exporting model for production...');

    try {
      if (!this.classifier.model) {
        throw new Error('No model to export');
      }

      // Exporter le modèle en format TensorFlow.js
      // Le handler personnalisé 'downloads://' télécharge les fichiers
      const result = await this.classifier.model.save('downloads://sentiment');

      console.log('✅ Model exported successfully');
      console.log('   Files generated:');
      console.log('   - sentiment.json (architecture + metadata)');
      console.log('   - sentiment.weights.bin (model weights)');
      console.log('');
      console.log('📝 NEXT STEPS (manual):');
      console.log('   1. Vérifiez que les fichiers ont été téléchargés');
      console.log('   2. Créez le dossier: public/models/sentiment/');
      console.log('   3. Déplacez sentiment.json dans public/models/sentiment/model.json');
      console.log('   4. Déplacez sentiment.weights.bin dans public/models/sentiment/');
      console.log('   5. Enregistrez le modèle dans registry.config.js');
      console.log('');
      console.log('💾 Checkpoint sauvegardé! Le modèle sera chargé en production.');

      return result;
    } catch (error) {
      console.error('❌ Export failed:', error.message);
      throw error;
    }
  }

  /**
   * Nettoyer et libérer la mémoire
   */
  cleanup() {
    console.log('🗑️ Cleaning up...');

    if (this.classifier) {
      this.classifier.dispose();
      this.classifier = null;
    }

    this.embeddings = null;
    this.labels = null;
    this.trainIndices = [];
    this.testIndices = [];

    console.log('✅ Cleanup complete');
  }

  /**
   * Obtenir un résumé des métriques d'entraînement
   */
  getMetrics() {
    return {
      trainingAccuracy: (this.trainingMetrics.accuracy * 100).toFixed(2) + '%',
      testAccuracy: (this.trainingMetrics.testAccuracy * 100).toFixed(2) + '%',
      finalLoss: this.trainingMetrics.finalLoss.toFixed(4),
    };
  }

  /**
   * Exécuter le flux complet (entraînement + export)
   */
  async runFullPipeline(onEpochEnd = null) {
    try {
      await this.init();
      await this.generateEmbeddings();
      await this.prepareDataset(0.8);
      await this.train(onEpochEnd);
      await this.evaluate();
      await this.testSinglePhrases();
      
      console.log('');
      console.log('📊 TRAINING SUMMARY:');
      const metrics = this.getMetrics();
      console.log(`   Training Accuracy: ${metrics.trainingAccuracy}`);
      console.log(`   Test Accuracy: ${metrics.testAccuracy}`);
      console.log(`   Final Loss: ${metrics.finalLoss}`);
      console.log('');
      
      await this.exportForProduction();
      console.log('✅ Full pipeline complete!');
    } catch (error) {
      console.error('❌ Pipeline failed:', error);
      this.cleanup();
    }
  }
}

// Exposer au scope global pour debugging en console
if (typeof window !== 'undefined') {
  window.SentimentTrainingPipeline = SentimentTrainingPipeline;
}