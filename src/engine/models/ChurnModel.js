import * as tf from "@tensorflow/tfjs";
import { logger } from "../utils/logger.js";
import { calculateClassWeights } from "../utils/classWeights";

export class ChurnModel {
  constructor(config = {}) {
    this.TIME_STEPS = config.timeSteps || 12;
    this.FEATURES = config.features || 16;
    this.LEARNING_RATE = config.learningRate || 0.001;
    this.stopRequested = false;
    this.model = null;
  }

  stop() {
    logger.info("🛑 TRAINING: Stop requested by user.");
    this.stopRequested = true;
  }

  createModel() {
    /**
     * Architecture optimalisée pour données temporelles comportementales
     * LSTM capture les dépendances temporelles entre événements utilisateur
     * Multi-task learning : churn + conversion + abuse detection
     */
    const input = tf.input({
      shape: [this.TIME_STEPS, this.FEATURES],
      name: "behavior_input",
    });

    // ===== ÉTAGE 1: EXTRACTION TEMPORELLE AVEC LSTM =====
    // Première LSTM avec returnSequences=true pour conserver l'information temporelle
    const lstm1 = tf.layers
      .lstm({
        units: 32, // Réduit de 64 à 32
        returnSequences: true,
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }), // L2 regularization
        recurrentRegularizer: tf.regularizers.l2({ l2: 0.001 }),
        name: "lstm_temporal_1",
      })
      .apply(input);

    // Second LSTM qui compresse la séquence en vecteur contextuel
    const lstm2 = tf.layers
      .lstm({
        units: 16, // Réduit de 32 à 16
        returnSequences: false,
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
        recurrentRegularizer: tf.regularizers.l2({ l2: 0.001 }),
        name: "lstm_temporal_2",
      })
      .apply(lstm1);

    // Normalisation après extraction temporelle
    const normalized = tf.layers
      .batchNormalization({
        name: "batch_norm_temporal",
      })
      .apply(lstm2);

    // ===== ÉTAGE 2: REPRÉSENTATION PARTAGÉE =====
    const dense1 = tf.layers
      .dense({
        units: 32, // Réduit de 64 à 32
        activation: "relu",
        kernelInitializer: "heNormal",
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
        name: "shared_dense_1",
      })
      .apply(normalized);

    const dropout1 = tf.layers
      .dropout({
        rate: 0.5, // Augmenté de 0.3 à 0.5
        name: "dropout_1",
      })
      .apply(dense1);

    const sharedRepresentation = tf.layers
      .dense({
        units: 16, // Réduit de 32 à 16
        activation: "relu",
        kernelInitializer: "heNormal",
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
        name: "shared_dense_2",
      })
      .apply(dropout1);

    const dropout2 = tf.layers
      .dropout({
        rate: 0.5, // Augmenté de 0.3 à 0.5
        name: "dropout_2",
      })
      .apply(sharedRepresentation);

    const churnOutput = tf.layers
      .dense({
        units: 1,
        activation: "sigmoid",
        name: "churn",
      })
      .apply(dropout2);

    const conversionOutput = tf.layers
      .dense({
        units: 1,
        activation: "sigmoid",
        name: "conversion",
      })
      .apply(dropout2);

    const abuseOutput = tf.layers
      .dense({
        units: 1,
        activation: "sigmoid",
        name: "abuse",
      })
      .apply(dropout2);

    this.model = tf.model({
      inputs: input,
      outputs: [churnOutput, conversionOutput, abuseOutput],
      name: "SmartPredictMultiTaskModel",
    });

    this.model.compile({
      optimizer: tf.train.adam(this.LEARNING_RATE),
      loss: {
        churn: "binaryCrossentropy",
        conversion: "binaryCrossentropy",
        abuse: "binaryCrossentropy",
      },
      metrics: ["accuracy"],
    });

    return this.model;
  }

  async train(xTrain, yTrain, onProgress = null) {
    if (!this.model) this.createModel();

    logger.info("##> TRAINING: Starting advanced LSTM training...");
    this.stopRequested = false;

    const churnWeights = calculateClassWeights(yTrain.churn);

    const classWeightConfig = {
      churn: churnWeights,
      // conversion: 0,
      // abuse: 0,
    };

    // Variables pour early stopping manuel (TF.js ne supporte pas restoreBestWeights)
    let bestValLoss = Infinity;
    let patienceCounter = 0;
    const patience = 10;
    let bestWeights = null;

    // Tracker mémoire TensorFlow.js
    const initialMemory = tf.memory();
    logger.debug(
      `📊 Initial TF.js memory: ${initialMemory.numTensors} tensors`,
    );

    try {
      const history = await this.model.fit(xTrain, yTrain, {
        epochs: 50, // Réduit de 100 à 50
        batchSize: 32,
        shuffle: true,
        validationSplit: 0.2,
        yieldEvery: "batch",
        classWeight: classWeightConfig,
        // Early stopping: arrête si la loss de validation ne s'améliore pas
        callbacks: [
          {
            onEpochEnd: async (epoch, logs) => {
              if (this.stopRequested) {
                logger.warn(`🛑 TRAINING: Interrupted at epoch ${epoch + 1}.`);
                this.model.stopTraining = true;
                return;
              }

              // Early stopping manuel
              const currentValLoss = logs.val_churn_loss;
              if (currentValLoss < bestValLoss) {
                bestValLoss = currentValLoss;
                patienceCounter = 0;
                // Sauvegarder les meilleurs poids
                bestWeights = this.model.getWeights().map((w) => w.clone());
                logger.debug(
                  `📈 New best validation loss: ${bestValLoss.toFixed(4)}`,
                );
              } else {
                patienceCounter++;
                if (patienceCounter >= patience) {
                  logger.info(
                    `⏹️ Early stopping at epoch ${epoch + 1} (patience exhausted)`,
                  );
                  this.model.stopTraining = true;
                  // Restaurer les meilleurs poids
                  if (bestWeights) {
                    this.model.setWeights(bestWeights);
                    logger.info("✅ Restored best weights from early stopping");
                  }
                  return;
                }
              }

              const fmt = (val) =>
                typeof val === "number" ? val.toFixed(4) : "?";

              const churnAcc = logs.churn_acc || logs.churn_accuracy;
              const convAcc = logs.conversion_acc || logs.conversion_accuracy;
              const abuseAcc = logs.abuse_acc || logs.abuse_accuracy;

              // Log memory usage periodically (every 10 epochs)
              if ((epoch + 1) % 10 === 0) {
                const currentMemory = tf.memory();
                logger.debug(
                  `📊 Epoch ${epoch + 1} - Tensors: ${currentMemory.numTensors}, ` +
                    `Memory: ${(currentMemory.numBytes / 1024 / 1024).toFixed(2)}MB`,
                );
              }

              if (onProgress)
                onProgress({
                  epoch: epoch + 1,
                  totalEpochs: 50, // Mis à jour pour correspondre aux epochs
                  churn: {
                    loss: fmt(logs.churn_loss || logs.loss),
                    accuracy: fmt(churnAcc),
                    valLoss: fmt(logs.val_churn_loss),
                    valAccuracy: fmt(
                      logs.val_churn_acc || logs.val_churn_accuracy,
                    ),
                  },
                  conversion: {
                    loss: fmt(logs.conversion_loss),
                    accuracy: fmt(convAcc),
                    valLoss: fmt(logs.val_conversion_loss),
                    valAccuracy: fmt(
                      logs.val_conversion_acc || logs.val_conversion_accuracy,
                    ),
                  },
                  abuse: {
                    loss: fmt(logs.abuse_loss),
                    accuracy: fmt(abuseAcc),
                    valLoss: fmt(logs.val_abuse_loss),
                    valAccuracy: fmt(
                      logs.val_abuse_acc || logs.val_abuse_accuracy,
                    ),
                  },
                });

              await tf.nextFrame();
            },
          },
        ],
      });

      const finalMemory = tf.memory();
      logger.info(
        `✅ TRAINING COMPLETE - Final memory: ${finalMemory.numTensors} tensors, ` +
          `${(finalMemory.numBytes / 1024 / 1024).toFixed(2)}MB`,
      );

      return history;
    } catch (err) {
      logger.error("❌ TRAINING ERROR:", err);
      throw err;
    }
  }
}
