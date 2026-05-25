import { useState, useCallback } from 'react';
import { useModel } from './useModel';
import * as tf from '@tensorflow/tfjs';
import { logger } from '../../engine/utils/logger';

/**
 * Hook pour l'analyse de sentiment via USE + SentimentClassifier
 * 
 * Exposes:
 * - analyze(text): Function - Lance embedding USE + classification
 * - result: Object | null - {sentiment, score, scores: [pos, neg, neu], embedding}
 * - status: string - 'idle' | 'loading' | 'ready' | 'analyzing' | 'error'
 * - error: string | null - Message d'erreur
 */
export const useNLP = () => {
  // Charger USE (Universal Sentence Encoder) via le hook réutilisable
  const { model: sentenceEncoder, status: encoderStatus } = useModel('use');

  // Charger le classifieur de sentiment depuis ModelRegistry
  const { model: sentimentClassifier, status: classifierStatus } = useModel('sentiment');

  // États
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Wrapper pour le statut global
  const status = encoderStatus === 'ready' && classifierStatus === 'ready' ? 'ready' : encoderStatus;

  /**
   * Pipeline d'analyse : embedding USE → classification → extraction résults
   */
  const analyze = useCallback(
    async (text) => {
      if (!text || text.trim().length === 0) {
        setError('Veuillez entrer un texte');
        return;
      }

      if (!sentenceEncoder || !sentimentClassifier) {
        setError('Les modèles ne sont pas prêts');
        return;
      }

      setIsAnalyzing(true);
      setError(null);

      try {
        // Étape 1 : Générer l'embedding USE
        logger.info('🧠 Generating USE embedding...');
        const embedding = await sentenceEncoder.embed(text);
        const embeddingArray = await embedding.data(); // Convert tensor to array
        
        embedding.dispose(); // Nettoyer le tensor

        // Étape 2 : Prédiction via le classifieur (dans un tf.tidy pour nettoyer les tensors intermédiaires)
        logger.info('🤖 Predicting sentiment scores...');
        const scores = await tf.tidy(() => {
          // Mettre l'embedding en tensor et le passer au classifieur
          const embeddingTensor = tf.tensor2d([embeddingArray]);
          const prediction = sentimentClassifier.predict(embeddingTensor);
          return prediction;
        });

        // Étape 3 : Extraire les scores en array
        const scoresArray = await scores.data();
        const scoresData = Array.from(scoresArray);
        scores.dispose();

        // Étape 4 : Identifier la classe avec le score max
        const classIndex = scoresData.indexOf(Math.max(...scoresData));
        const sentimentLabels = ['POSITIF', 'NÉGATIF', 'NEUTRE'];
        const sentimentLabel = sentimentLabels[classIndex];
        const confidence = (Math.max(...scoresData) * 100).toFixed(1);

        // Étape 5 : Structurer le résultat
        const analysisResult = {
          sentiment: sentimentLabel,
          score: confidence,
          scores: {
            positif: (scoresData[0] * 100).toFixed(1),
            négatif: (scoresData[1] * 100).toFixed(1),
            neutre: (scoresData[2] * 100).toFixed(1),
          },
          embedding: embeddingArray,
          text: text,
          timestamp: new Date(),
        };

        setResult(analysisResult);
        logger.info(`✅ Analysis complete: ${sentimentLabel} (${confidence}%)`);
      } catch (err) {
        logger.error(`❌ Analysis error: ${err.message}`);
        setError(`Erreur lors de l'analyse: ${err.message}`);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [sentenceEncoder, sentimentClassifier]
  );

  return {
    analyze,
    result,
    status,
    isAnalyzing,
    error,
  };
};