import * as tf from '@tensorflow/tfjs';
import { dataPipeline } from '../core/DataPipeline';
import { ChurnModel } from '../models/ChurnModel';
import { generateFakeUserEvents } from './generateFakeUserEvents';
import { logger } from '../utils/logger';
import { interpretPrediction } from '../utils/interpretPrediction';

function vectorizeFeatures(featuresList) {
  return featuresList.map((f) => {
    const scalars = [
      f.velocity || 0,
      f.acceleration || 0,
      f.deltaTime || 0,
      f.relativeTime || 0,
    ];
    return [...scalars, ...(f.oneHot || [])];
  });
}

export async function runSmokeTest() {
  logger.info('SMOKE TEST: Starting Full Pipeline Validation');

  const startTensors = tf.memory().numTensors;

  await generateFakeUserEvents(50);

  const features = await dataPipeline.run(30);

  if (!features || features.length < 10) {
    logger.error(
      '# FAILURE: DataPipeline returned empty or insufficient data.',
      { count: features?.length }
    );
    return;
  }

  logger.info(
    `# PIPELINE SUCCESS: Generated ${features.length} normalized vectors.`
  );

  const TIME_STEPS = 10;
  const sequence = features.slice(-TIME_STEPS);

  const sampleVector = vectorizeFeatures([sequence[0]])[0];
  const FEATURE_COUNT = sampleVector.length;

  const churnModel = new ChurnModel({
    timeSteps: TIME_STEPS,
    features: FEATURE_COUNT,
  });

  const model = churnModel.createModel();

  tf.tidy(() => {
    logger.debug(
      `Converting to Tensor [1, ${TIME_STEPS}, ${FEATURE_COUNT}]...`
    );

    const matrix = vectorizeFeatures(sequence);
    const inputTensor = tf.tensor3d([matrix]);

    const outputs = model.predict(inputTensor);
    logger.info(' PREDICTIONS (Raw Output):', interpretPrediction(outputs));
  });

  if (model.optimizer) {
    model.optimizer.dispose();
  }
  model.dispose();

  const endTensors = tf.memory().numTensors;
  const delta = endTensors - startTensors;

  logger.info('MEMORY CHECK:', { start: startTensors, end: endTensors, delta });

  if (delta === 0) {
    logger.info('✅ SMOKE TEST PASSED: System is robust.');
  } else {
    logger.warn(`⚠️ MEMORY LEAK: ${delta} tensors remain.`);
  }
}
