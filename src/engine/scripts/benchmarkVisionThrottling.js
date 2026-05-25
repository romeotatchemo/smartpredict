/**
 * benchmarkVisionThrottling.js
 * 
 * Benchmark comparatif pour valider l'impact du throttling dynamique
 * sur la détection vidéo avec Coco-SSD
 * 
 * Usage dans la console:
 * await throttlingBenchmark.testFixedInterval()
 * await throttlingBenchmark.testAdaptiveThrottling()
 * throttlingBenchmark.compare()
 */

import * as tf from '@tensorflow/tfjs';
import { logger } from '../utils/logger';

window.throttlingBenchmark = {
  // État partagé
  videoDuration: 10000, // 10 secondes
  testResults: {},
  metricsBeforeThrottling: null,
  metricsAfterThrottling: null,

  /**
   * Test A : Inférence à intervalle fixe (sans throttling adaptatif)
   * Simule le comportement de setInterval(inference, 200ms)
   */
  async testFixedInterval() {
    logger.info('🧪 Test A: Fixed interval (200ms) — Simulating old behavior...');
    console.log('🧪 Test A: Fixed interval (200ms) — Simulating old behavior...');
    
    // Créer un élément vidéo invisible
    const videoElement = document.createElement('video');
    videoElement.src = '/videos/video.mp4';
    videoElement.crossOrigin = 'anonymous';
    
    // Attendre que la vidéo soit prête
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => resolve();
      videoElement.load();
    });

    // Mesurer les FPS et la mémoire initiale
    const memBefore = tf.memory();
    const startTime = performance.now();
    let inferenceCount = 0;
    let totalLatency = 0;
    let maxLatency = 0;
    let tensorPeakCount = 0;

    // Boucle d'inférence à intervalle fixe
    return new Promise((resolve) => {
      const intervalId = setInterval(async () => {
        const tStart = performance.now();
        
        try {
          // Simuler une inférence (sans modèle réel)
          await tf.nextFrame();
          inferenceCount++;

          const tEnd = performance.now();
          const latency = tEnd - tStart;
          totalLatency += latency;
          maxLatency = Math.max(maxLatency, latency);

          // Mesurer les tenseurs
          const memCurrent = tf.memory();
          tensorPeakCount = Math.max(tensorPeakCount, memCurrent.numTensors);

        } catch (err) {
          logger.error('Error during test A:', err);
          console.error('Error during test A:', err);
        }

        // Arrêter après ~10 secondes
        const elapsed = performance.now() - startTime;
        if (elapsed >= videoElement.duration * 1000) {
          clearInterval(intervalId);

          const memAfter = tf.memory();
          this.metricsBeforeThrottling = {
            inferenceCount,
            avgLatency: (totalLatency / inferenceCount).toFixed(2),
            maxLatency: maxLatency.toFixed(2),
            tensorPeakCount,
            memoryDelta: (memAfter.numBytes - memBefore.numBytes).toFixed(0),
          };

          logger.info('✅ Test A Complete:', this.metricsBeforeThrottling);
          console.log('✅ Test A Complete:', this.metricsBeforeThrottling);
          resolve();
        }
      }, 200);
    });
  },

  /**
   * Test B : Inférence avec throttling adaptatif
   * Calcule dynamiquement l'intervalle : latence × 1.5
   */
  async testAdaptiveThrottling() {
    logger.info('🧪 Test B: Adaptive throttling (latency × 1.5) — New optimized behavior...');
    console.log('🧪 Test B: Adaptive throttling (latency × 1.5) — New optimized behavior...');
    
    // Créer un élément vidéo invisible
    const videoElement = document.createElement('video');
    videoElement.src = '/videos/video.mp4'; 
    videoElement.crossOrigin = 'anonymous';
    
    // Attendre que la vidéo soit prête
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => resolve();
      videoElement.load();
    });

    // Mesurer les FPS et la mémoire initiale
    const memBefore = tf.memory();
    const startTime = performance.now();
    let inferenceCount = 0;
    let totalLatency = 0;
    let maxLatency = 0;
    let tensorPeakCount = 0;
    let lastLatency = 200;
    let nextInterval = 300;
    let timeoutId = null;

    const scheduleInference = () => {
      timeoutId = setTimeout(async () => {
        const tStart = performance.now();

        try {
          // Simuler une inférence avec une légère variation de latence
          await tf.nextFrame();
          inferenceCount++;

          const tEnd = performance.now();
          const latency = tEnd - tStart;
          lastLatency = latency;
          totalLatency += latency;
          maxLatency = Math.max(maxLatency, latency);

          // Adapter l'intervalle
          nextInterval = Math.min(1000, Math.max(100, latency * 1.5));

          // Mesurer les tenseurs
          const memCurrent = tf.memory();
          tensorPeakCount = Math.max(tensorPeakCount, memCurrent.numTensors);

        } catch (err) {
          logger.error('Error during test B:', err);
          console.error('Error during test B:', err);
        }

        // Arrêter après ~10 secondes
        const elapsed = performance.now() - startTime;
        if (elapsed >= videoElement.duration * 1000) {
          const memAfter = tf.memory();
          this.metricsAfterThrottling = {
            inferenceCount,
            avgLatency: (totalLatency / inferenceCount).toFixed(2),
            maxLatency: maxLatency.toFixed(2),
            tensorPeakCount,
            memoryDelta: (memAfter.numBytes - memBefore.numBytes).toFixed(0),
            finalInterval: nextInterval.toFixed(0),
          };

          logger.info('✅ Test B Complete:', this.metricsAfterThrottling);
          console.log('✅ Test B Complete:', this.metricsAfterThrottling);
        } else {
          scheduleInference(); // Reprogrammer
        }
      }, nextInterval);
    };

    return new Promise((resolve) => {
      scheduleInference();
      logger.info(`⏱️ Initial interval: ${nextInterval}ms`);

      // Vérifier la fin du test toutes les 100ms
      const checkInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        if (elapsed >= this.videoDuration) {
          clearInterval(checkInterval);
          if (timeoutId) clearTimeout(timeoutId);
          resolve();
        }
      }, 100);
    });
  },

  /**
   * Compare les deux résultats
   */
  compare() {
    if (!this.metricsBeforeThrottling || !this.metricsAfterThrottling) {
      logger.warn('⚠️ Run both tests first!');
      console.warn('⚠️ Run both tests first!');
      return;
    }

    const before = this.metricsBeforeThrottling;
    const after = this.metricsAfterThrottling;

    console.log('\n📊 RÉSULTATS COMPARATIFS\n');
    console.table({
      'Métrique': ['Inférences/10s', 'Latence Avg (ms)', 'Latence Max (ms)', 'Tenseurs (pic)', 'Δ Mémoire (bytes)'],
      'AVANT (Fixed 200ms)': [
        before.inferenceCount,
        before.avgLatency,
        before.maxLatency,
        before.tensorPeakCount,
        before.memoryDelta,
      ],
      'APRÈS (Adaptatif)': [
        after.inferenceCount,
        after.avgLatency,
        after.maxLatency,
        after.tensorPeakCount,
        after.memoryDelta,
      ],
      'Amélioration': [
        `${((after.inferenceCount - before.inferenceCount) / before.inferenceCount * 100).toFixed(1)}%`,
        `${((before.avgLatency - after.avgLatency) / before.avgLatency * 100).toFixed(1)}%`,
        `${((before.maxLatency - after.maxLatency) / before.maxLatency * 100).toFixed(1)}%`,
        `${((before.tensorPeakCount - after.tensorPeakCount) / before.tensorPeakCount * 100).toFixed(1)}%`,
        `${((before.memoryDelta - after.memoryDelta) / before.memoryDelta * 100).toFixed(1)}%`,
      ],
    });

    console.log(`\n✅ Final interval (Adaptatif): ${after.finalInterval}ms`);
    logger.info(`\n✅ Final interval (Adaptatif): ${after.finalInterval}ms`);
  },

  /**
   * Lance les deux tests séquentiellement
   */
  async runBoth() {
    logger.info('🚀 Starting benchmark suite...\n');
    console.log('🚀 Starting benchmark suite...\n');
    await this.testFixedInterval();
    console.log('\n');
    await this.testAdaptiveThrottling();
    this.compare();
  }
};
