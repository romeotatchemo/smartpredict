import * as tf from '@tensorflow/tfjs';
import { logger } from '../../utils/logger';

export class ModelEvaluator {
  evaluateBinaryClassification(yTrue, yPred, threshold = 0.5) {
    return tf.tidy(() => {
      const predictions = yPred.greater(threshold).cast('float32');

      const tp = predictions.mul(yTrue).sum().dataSync()[0];

      const tn = predictions
        .sub(1)
        .mul(-1)
        .mul(yTrue.sub(1).mul(-1))
        .sum()
        .dataSync()[0];

      const fp = predictions.mul(yTrue.sub(1).mul(-1)).sum().dataSync()[0];

      const fn = predictions.sub(1).mul(-1).mul(yTrue).sum().dataSync()[0];

      return { tp, tn, fp, fn };
    });
  }

  computeMetrics(confusionMatrix) {
    const { tp, tn, fp, fn } = confusionMatrix;

    const EPSILON = 1e-7;

    const precision = tp / (tp + fp + EPSILON);
    const recall = tp / (tp + fn + EPSILON);

    const f1 = 2 * ((precision * recall) / (precision + recall + EPSILON));

    const accuracy = (tp + tn) / (tp + tn + fp + fn + EPSILON);

    return {
      precision: parseFloat(precision.toFixed(4)),
      recall: parseFloat(recall.toFixed(4)),
      f1Score: parseFloat(f1.toFixed(4)),
      accuracy: parseFloat(accuracy.toFixed(4)),
      matrix: confusionMatrix,
    };
  }
}
