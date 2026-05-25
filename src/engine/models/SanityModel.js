import * as tf from '@tensorflow/tfjs';
import { logger } from '../utils/logger';

export class SanityModel {
  async run() {
    logger.info('--- Démarrage du Sanity Check ML ---');

    const model = tf.sequential();

    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

    model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

    logger.debug('Modèle compilé avec succès');

    const inputData = tf.tensor2d([10], [1, 1]);

    logger.debug('Input Tensor créé', inputData.toString());

    const prediction = model.predict(inputData);

    logger.info('Résultat de la prédiction brute :');
    prediction.print();

    inputData.dispose();
    prediction.dispose();
    model.dispose();

    logger.info('--- Sanity Check Terminé & Nettoyé ---');
  }
}
