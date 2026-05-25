/**
 * registry.config.js - Déclaration centralisée de tous les modèles ML
 * 
 * Ce fichier est le SEUL endroit où on enregistre les modèles.
 * À partir de là, tous les composants y accèdent via ModelRegistry.get()
 * 
 * Avantages:
 * - Une seule source de vérité
 * - Extension facile: ajouter Coco-SSD ou USE ne demande qu'une déclaration ici
 * - Les chemins et les dépendances sont centralisés
 */

import * as tf from '@tensorflow/tfjs';
import { ModelRegistry } from './ModelRegistry.js';
import { ChurnModel } from './ChurnModel.js';

// ===== MODÈLE CHURN =====
// Modèle de prédiction de churn basé sur les événements utilisateur
ModelRegistry.register('churn', {
    loadFn: async (modelUrl, onProgress = null) => {
        const churnModelPath = modelUrl || import.meta.env.VITE_MODEL_PATH;

        const loadOptions = {};

        if (onProgress) {
            loadOptions.onProgress = onProgress;
        }

        // Tentative de chargement du modèle depuis /public/model/
        const model = await tf.loadLayersModel(churnModelPath, loadOptions);

        model.compile({
            optimizer: tf.train.adam(model.LEARNING_RATE),
            loss: {
                churn: "binaryCrossentropy",
                conversion: "binaryCrossentropy",
                abuse: "binaryCrossentropy",
            },
            metrics: ["accuracy"],
        });
        // logger.info(`Model loaded successfully from ${churnModelPath}`);

        return model;
    },
    options: {
        description: 'Churn prediction model - LSTM-based',
        version: '1.0.0',
    },
});

// ===== MODÈLE COCO-SSD =====
ModelRegistry.register('coco-ssd', {
    loadFn: async (modelUrl, onProgress = null) => {
        const cocoSsdPath = modelUrl || import.meta.env.VITE_COCO_SSD_PATH;
        const loadOptions = {
            modelUrl: cocoSsdPath,
            base: 'lite_mobilenet_v2'
        };

        if (onProgress) {
            loadOptions.onProgress = onProgress;
        }

        const cocoSsd = await import('@tensorflow-models/coco-ssd')

        return await cocoSsd.load(loadOptions);
    },
    options: {
        description: 'Object detection - Coco-SSD lite variant',
        variant: 'lite_mobilenet_v2',
    },
});

// ===== MODÈLE USE (Universal Sentence Encoder) =====
ModelRegistry.register('use', {
    loadFn: async (modelUrl, onProgress = null) => {
        const use = await import('@tensorflow-models/universal-sentence-encoder');
        const usePath = modelUrl || import.meta.env.VITE_USE_PATH || '/models/use/model.json';

        const loadOptions = {};
        if (onProgress) {
            loadOptions.onProgress = onProgress;
        }
        loadOptions.modelUrl = usePath;
        return use.load(loadOptions);
    },
    options: {
        description: 'Universal Sentence Encoder - semantic embeddings',
        version: 'large',
    },
});

ModelRegistry.register('sentiment', {
    loadFn: async (modelUrl, onProgress = null) => {
        const sentimentPath = modelUrl || '/models/sentiment/model.json';
        
        const loadOptions = {};
        if (onProgress) {
            loadOptions.onProgress = onProgress;
        }
        
        const model = await tf.loadLayersModel(sentimentPath, loadOptions);
        console.log('✅ Sentiment Classifier loaded');
        return model;
    },
    options: {
        description: 'Sentiment Classifier - trained on Universal Sentence Encoder embeddings',
        version: '1.0.0',
        classes: ['positif', 'négatif', 'neutre'],
    },
});
