import { logger } from "../utils/logger.js";
import * as tf from "@tensorflow/tfjs";

export function calculateClassWeights(labelTensor) {
  logger.debug("Label tensor shape:", labelTensor);

  return tf.tidy(() => {
    const total = labelTensor.shape[0];

    const positives = labelTensor.sum().dataSync()[0];
    const negatives = total - positives;

    if (positives === 0 || negatives === 0) {
      logger.warn(
        "⚠️ Class Imbalance: Dataset is uniform. Defaulting to 1:1 weights.",
      );
      return { 0: 1, 1: 1 };
    }

    const weight0 = total / (2 * negatives);
    const weight1 = total / (2 * positives);

    const weights = {
      0: parseFloat(weight0.toFixed(4)),
      1: parseFloat(weight1.toFixed(4)),
    };

    logger.info(
      ` Weights Calculated (Positives: ${positives}/${total}):`,
      weights,
    );

    return weights;
  });
}
