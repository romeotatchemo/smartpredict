/**
 * SentimentClassifier.js - Classifieur de sentiment basé sur les embeddings USE
 * 
 * Architecture:
 * - Input: embeddings USE (512 dimensions)
 * - Dense: 512 → 64 neurones (activation: relu)
 * - Dropout: 0.3 (régularisation)
 * - Dense: 64 → 3 neurones (activation: softmax, pour 3 classes)
 * - Output: probabilités pour [positif, négatif, neutre]
 * 
 * Avantages du transfer learning:
 * - USE a déjà appris la sémantique sur des milliards d'exemples
 * - On entraîne UNIQUEMENT la couche dense au-dessus
 * - Entraînement en quelques secondes, pas des heures
 * - 50-200 phrases d'entraînement suffisent
 */

import * as tf from '@tensorflow/tfjs';

export class SentimentClassifier {
  constructor() {
    this.model = null;
    this.isCompiled = false;
    this.trainingHistory = {
      epochs: [],
      loss: [],
      accuracy: [],
      valLoss: [],
      valAccuracy: [],
    };
  }

  /**
   * Construit le modèle Keras/TensorFlow.js
   * Appelé une seule fois avant l'entraînement
   */
 buildModel() {
    if (this.model !== null) {
      console.warn('⚠️ Model already built, skipping rebuild');
      return;
    }

    console.log('🔨 Building Sentiment Classifier...');

    this.model = tf.sequential({
      layers: [
        // 512 → 128 : descente progressive
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          inputShape: [512],
          kernelInitializer: 'glorotUniform',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
          name: 'dense_512_to_128',
        }),

        tf.layers.dropout({ rate: 0.4, name: 'dropout_1' }),

        // 128 → 64
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelInitializer: 'glorotUniform',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
          name: 'dense_128_to_64',
        }),

        tf.layers.dropout({ rate: 0.3, name: 'dropout_2' }),

        // 64 → 3 : sortie
        tf.layers.dense({
          units: 3,
          activation: 'softmax',
          kernelInitializer: 'glorotUniform',
          name: 'dense_64_to_3_softmax',
        }),
      ],
    });

    this.model.compile({
      optimizer: tf.train.adam(0.0005), 
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    this.isCompiled = true;
    console.log('✅ Model built and compiled');
    this.model.summary();
  }

  /**
   * Entraîne le modèle sur les embeddings + labels
   * Chaque appel à onEpochEnd reçoit { epoch, loss, accuracy, valLoss, valAccuracy }
   *
   * @async
   * @param {Array<number[]>} embeddings - Embeddings USE (chacun: vecteur 512D)
   * @param {Array<number[]>} labels - One-hot encoded labels (3D: [1,0,0] ou [0,1,0] ou [0,0,1])
   * @param {Object} options - Options d'entraînement
   * @param {number} options.epochs - Nombre d'épochs (recommandé: 50-100)
   * @param {number} options.batchSize - Taille des batches (recommandé: 8-16)
   * @param {number} options.validationSplit - Proportion du dataset pour la validation (0.2 = 20%)
   * @param {Function} options.onEpochEnd - Callback appelé à chaque fin d'époque
   * @returns {Promise} - Résout quand l'entraînement est terminé
   */
  async train(embeddings, labels, options = {}) {
    const {
      epochs = 50,
      batchSize = 16,
      validationSplit = 0.2,
      onEpochEnd = null,
      verbose = 1,
    } = options;

    if (!this.isCompiled) {
      throw new Error(
        'Model not compiled. Call buildModel() first.'
      );
    }

    console.log(`📚 Starting training with ${embeddings.length} samples...`);
    console.log(`   Epochs: ${epochs}, Batch size: ${batchSize}`);
    console.log(`   Validation split: ${validationSplit * 100}%`);

    // Convertir les embeddings et labels en tensors
    const xs = tf.tensor2d(embeddings);
    const ys = tf.tensor2d(labels);

    try {
      // Lancer l'entraînement avec model.fit()
      await this.model.fit(xs, ys, {
        epochs,
        batchSize,
        validationSplit,
        verbose,
        callbacks: {
          // Ce callback est appelé à chaque fin d'époque
          onEpochEnd: (epoch, logs) => {
            // Sauvegarder dans l'historique
            this.trainingHistory.epochs.push(epoch);
            this.trainingHistory.loss.push(logs.loss);
            this.trainingHistory.accuracy.push(logs.acc);
            this.trainingHistory.valLoss.push(logs.val_loss);
            this.trainingHistory.valAccuracy.push(logs.val_acc);

            // Appeler le callback utilisateur s'il existe
            if (onEpochEnd) {
              onEpochEnd({
                epoch,
                loss: logs.loss,
                accuracy: logs.acc,
                valLoss: logs.val_loss,
                valAccuracy: logs.val_acc,
              });
            }

            // Log simple dans la console
            console.log(
              `   Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)}`
            );
          },
        },
      });

      console.log('✅ Training complete');
    } finally {
      // Libérer la mémoire des tensors
      xs.dispose();
      ys.dispose();
    }
  }

  /**
   * Prédit le sentiment pour une liste d'embeddings
   * Retourne les scores bruts (logits) pour chaque classe
   *
   * @param {Array<number[]>} embeddings - Embeddings USE
   * @returns {Array<Object>} - Pour chaque embedding: { positif, négatif, neutre, predicted }
   */
  predictBatch(embeddings) {
    if (!this.model) {
      throw new Error('Model not built. Call buildModel() first.');
    }

    const xs = tf.tensor2d(embeddings);
    const predictions = this.model.predict(xs);
    const predictionsArray = predictions.dataSync();

    const results = [];
    for (let i = 0; i < embeddings.length; i++) {
      const offset = i * 3;
      const scores = {
        positif: predictionsArray[offset],
        négatif: predictionsArray[offset + 1],
        neutre: predictionsArray[offset + 2],
      };
      scores.predicted = this.argmax(scores);
      results.push(scores);
    }

    xs.dispose();
    predictions.dispose();

    return results;
  }

  /**
   * Prédit le sentiment pour une seule phrase (via son embedding)
   *
   * @param {Array<number>} embedding - Embedding USE pour une phrase
   * @returns {Object} - { positif, négatif, neutre, predicted, confidence }
   */
  predictSingle(embedding) {
    const results = this.predictBatch([embedding]);
    const result = results[0];
    result.confidence = Math.max(result.positif, result.négatif, result.neutre);
    return result;
  }

  /**
   * Utilitaire : trouver l'index de la classe avec la plus haute probabilité
   * @private
   */
  argmax(scores) {
    let maxClass = 'positif';
    let maxScore = scores.positif;

    if (scores.négatif > maxScore) {
      maxClass = 'négatif';
      maxScore = scores.négatif;
    }
    if (scores.neutre > maxScore) {
      maxClass = 'neutre';
      maxScore = scores.neutre;
    }

    return maxClass;
  }

  /**
   * Sauvegarde le modèle entraîné en localStorage
   * @async
   * @param {string} modelName - Nom de sauvegarde (ex: 'sentiment-v1')
   */
  async saveModel(modelName = 'sentiment-classifier') {
    if (!this.model) {
      throw new Error('No model to save');
    }

    const storageKey = `localstorage://${modelName}`;
    console.log(`💾 Saving model to ${storageKey}...`);

    await this.model.save(storageKey);
    console.log(`✅ Model saved successfully`);
  }

  /**
   * Charge un modèle depuis localStorage
   * @async
   * @param {string} modelName - Nom du modèle à charger (ex: 'sentiment-v1')
   */
  async loadModel(modelName = 'sentiment-classifier') {
    const storageKey = `localstorage://${modelName}`;
    console.log(`📂 Loading model from ${storageKey}...`);

    try {
      this.model = await tf.loadLayersModel(storageKey);
      this.isCompiled = true;
      console.log(`✅ Model loaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to load model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtient le résumé de l'entraînement
   * @returns {Object} - Stats d'entraînement et historique
   */
  getTrainingSummary() {
    return {
      trainingHistory: this.trainingHistory,
      finalLoss: this.trainingHistory.loss[this.trainingHistory.loss.length - 1],
      finalAccuracy: this.trainingHistory.accuracy[this.trainingHistory.accuracy.length - 1],
      finalValAccuracy:
        this.trainingHistory.valAccuracy[this.trainingHistory.valAccuracy.length - 1],
    };
  }

  /**
   * Libère la mémoire du modèle
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isCompiled = false;
      console.log('🗑️ Model disposed');
    }
  }
}