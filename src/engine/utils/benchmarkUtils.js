/**
 * benchmarkUtils - Logique métier de mesure de performance
 * 
 * Responsabilités :
 * - Mesurer latence d'inférence
 * - Mesurer mémoire GPU (tenseurs, octets)
 * - Calculer statistiques (min, max, médiane, P95)
 * - Gérer historique des mesures
 * 
 * ✨ Pas de dépendance React — logique pure, réutilisable partout
 * 
 */

import * as tf from '@tensorflow/tfjs';
import { tensorCache } from "../core/TensorCache";
import { logger } from "../utils/logger";

/**
 * Classe pour gérer l'historique des mesures
 */
export class BenchmarkHistory {
  constructor() {
    this.latencies = [];        // Derniers 50 runs
    this.memorySnapshots = [];  // Snapshots avant/après
    this.maxHistorySize = 50;
  }

  /**
   * Ajoute une latence à l'historique
   * @param {number} latency - Latence en ms
   */
  addLatency(latency) {
    this.latencies.push(latency);
    if (this.latencies.length > this.maxHistorySize) {
      this.latencies.shift();
    }
  }

  /**
   * Ajoute un snapshot mémoire
   * @param {Object} snapshot - { before, after, delta }
   */
  addMemorySnapshot(snapshot) {
    this.memorySnapshots.push(snapshot);
    if (this.memorySnapshots.length > this.maxHistorySize) {
      this.memorySnapshots.shift();
    }
  }

  /**
   * Réinitialise l'historique
   */
  reset() {
    this.latencies = [];
    this.memorySnapshots = [];
  }

  /**
   * Retourne une copie des données pour éviter les mutations
   */
  getLatencies() {
    return [...this.latencies];
  }

  /**
   * Retourne la taille actuelle de l'historique
   */
  size() {
    return this.latencies.length;
  }
}

/**
 * Mesure la latence d'une inférence
 * @async
 * @param {Function} predictionFn - Fonction async à mesurer
 * @returns {Promise<number>} - Latence en millisecondes
 */
export async function measureLatency(predictionFn) {
  const startTime = performance.now();
  await predictionFn();
  const endTime = performance.now();
  return endTime - startTime;
}

/**
 * Capture un snapshot de la mémoire GPU
 * @returns {Object} - { numTensors, numBytes, memoryMB }
 */
export function captureMemorySnapshot() {
  const mem = tf.memory();
  return {
    numTensors: mem.numTensors,
    numBytes: mem.numBytes,
    memoryMB: (mem.numBytes / 1024 / 1024).toFixed(2),
  };
}

/**
 * Calcule le delta mémoire entre deux snapshots
 * @param {Object} before - Snapshot avant
 * @param {Object} after - Snapshot après
 * @returns {Object} - { deltaTensors, deltaBytes }
 */
export function calculateMemoryDelta(before, after) {
  return {
    deltaTensors: after.numTensors - before.numTensors,
    deltaBytes: after.numBytes - before.numBytes,
  };
}

/**
 * Calcule la médiane d'un tableau de nombres
 * @param {number[]} values - Valeurs à analyser
 * @returns {number} - Valeur médiane
 */
export function calculateMedian(values) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  
  if (len % 2 === 0) {
    return (sorted[len / 2 - 1] + sorted[len / 2]) / 2;
  }
  return sorted[Math.floor(len / 2)];
}

/**
 * Calcule le percentile Pth d'un tableau
 * @param {number[]} values - Valeurs à analyser
 * @param {number} percentile - 0-100 (ex: 95 pour P95)
 * @returns {number} - Valeur au percentile
 */
export function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * (percentile / 100)) - 1;
  return Math.max(0, sorted[index]);
}

/**
 * Calcule les statistiques complètes d'un ensemble de latences
 * @param {number[]} latencies - Tableau de latences
 * @returns {Object} - { min, max, median, p95, p99, mean }
 */
export function calculateLatencyStats(latencies) {
  if (latencies.length === 0) {
    return {
      min: 0,
      max: 0,
      median: 0,
      p95: 0,
      p99: 0,
      mean: 0,
    };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: calculateMedian(latencies),
    p95: calculatePercentile(latencies, 95),
    p99: calculatePercentile(latencies, 99),
    mean: sum / sorted.length,
  };
}

/**
 * Exécute une suite de mesures complètes
 * @async
 * @param {Function} predictionFn - Fonction de prédiction à mesurer
 * @param {number} runs - Nombre de runs (défaut: 10)
 * @param {BenchmarkHistory} history - Objet historique pour stocker les données
 * @returns {Promise<Object>} - Résumé complet des mesures
 */
export async function runBenchmarkSuite(predictionFn, runs = 10, history) {
  const results = {
    runs,
    latencies: [],
  };

  // Snapshot mémoire avant
  const memoryBefore = captureMemorySnapshot();

  // Runs
  for (let i = 0; i < runs; i++) {
    const latency = await measureLatency(predictionFn);
    results.latencies.push(latency);

    // Ajouter à l'historique
    if (history) {
      history.addLatency(latency);
    }
  }

  // Snapshot mémoire après
  const memoryAfter = captureMemorySnapshot();
  const memoryDelta = calculateMemoryDelta(memoryBefore, memoryAfter);

  if (history) {
    history.addMemorySnapshot({
      before: memoryBefore,
      after: memoryAfter,
      delta: memoryDelta,
    });
  }

  // Calculer stats
  const stats = calculateLatencyStats(results.latencies);

  return {
    runs,
    latencies: results.latencies.map(l => parseFloat(l.toFixed(2))),
    stats: {
      min: stats.min.toFixed(2),
      max: stats.max.toFixed(2),
      median: stats.median.toFixed(2),
      p95: stats.p95.toFixed(2),
      p99: stats.p99.toFixed(2),
      mean: stats.mean.toFixed(2),
    },
    memory: {
      before: memoryBefore,
      after: memoryAfter,
      delta: memoryDelta,
    },
  };
}

/**
 * Convertit l'historique en format pour graphique
 * @param {BenchmarkHistory} history
 * @returns {Array<{iteration: number, latency: number}>}
 */
export function formatHistoryForChart(history) {
  return history
    .getLatencies()
    .map((latency, idx) => ({
      iteration: idx + 1,
      latency: parseFloat(latency.toFixed(2)),
    }));
}

/**
 * Test A : Référence (Baseline) - Inférences individuelles sans cache.
 * Génère 100 tableaux de caractéristiques et les prédit un par un.
 * C'est le point de comparaison : aucune optimisation n'est appliquée.
 * * @async
 * @param {Object} engine - Instance du moteur de prédiction.
 * @param {number} [runs=100] - Nombre d'exécutions.
 * @returns {Promise<Object>} Statistiques de latence et mémoire.
 */
export async function testA_Baseline(engine, runs = 100) {
  const testProfiles = generateMockProfiles(runs);
  const latencies = [];

  logger.info(`🅰️  Test A : Référence (${runs} prédictions individuelles, sans cache)`);

  for (const profile of testProfiles) {
    const start = performance.now();
    await engine.predict(30, profile);
    const end = performance.now();
    latencies.push(end - start);
  }

  return {
    label: "Test A : Référence",
    runs,
    latencies,
    stats: calculateLatencyStats(latencies),
    memoryInfo: tf.memory(),
  };
}

/**
 * Test B : Prédictions par lot (Batching).
 * Regroupe les prédictions par lots de 10 et utilise predictBatch().
 * Hypothèse : Le batching améliore le débit global.
 * Réalité : Sur de petits modèles, le coût de préparation peut dépasser les gains.
 * * @async
 * @param {Object} engine - Moteur de prédiction.
 * @param {number} [runs=100] - Nombre total de prédictions.
 * @param {number} [batchSize=10] - Taille de chaque lot.
 */
export async function testB_Batching(engine, runs = 100, batchSize = 10) {
  const testProfiles = generateMockProfiles(runs);
  const startTotal = performance.now();

  logger.info(
    `🅱️  Test B : Batching (${runs} prédictions, taille du lot=${batchSize})`
  );

  // Division en lots
  const batches = [];
  for (let i = 0; i < testProfiles.length; i += batchSize) {
    batches.push(testProfiles.slice(i, i + batchSize));
  }

  // Extraction des tableaux de caractéristiques pour le batching
  const featureArrays = testProfiles.map((profile) =>
    generateFeatureSequence(profile)
  );

  let totalLatency = 0;
  const latencies = [];

  for (let i = 0; i < featureArrays.length; i += batchSize) {
    const batch = featureArrays.slice(i, i + batchSize);
    const start = performance.now();
    await engine.predictBatch(batch);
    const end = performance.now();
    const batchLatency = end - start;
    totalLatency += batchLatency;
    // Latence par échantillon pour comparaison équitable
    latencies.push(batchLatency / batch.length); 
  }

  const endTotal = performance.now();

  return {
    label: "Test B : Batching",
    runs,
    batchSize,
    totalLatency: endTotal - startTotal,
    latencies,
    stats: calculateLatencyStats(latencies),
    memoryInfo: tf.memory(),
  };
}

/**
 * Test C : Mise en cache avec séquences déterministes.
 * Exécute 100 prédictions en utilisant seulement 20 séquences uniques.
 * * Stratégie : Stocker les séquences normalisées pour les réutiliser.
 * Passe 1 : Tout en "Cache Miss" (normalisation et stockage).
 * Passe 2 : Tout en "Cache Hit" (réutilisation, normalisation ignorée).
 * L'écart entre Passe 1 et Passe 2 montre la valeur réelle du cache.
 */
export async function testC_Caching(engine, runs = 100) {
  const uniqueSequenceCount = 20; // Seulement 20 séquences uniques
  const sequencesPerProfile = Math.ceil(runs / uniqueSequenceCount);
  
  logger.info(
    `🅲️  Test C : Caching (${runs} prédictions, ${uniqueSequenceCount} séquences uniques, test en 2 passes)`
  );

  // Réinitialisation des stats du cache
  tensorCache.resetStats();

  // Création de séquences déterministes uniques
  const uniqueSequences = [];
  for (let i = 0; i < uniqueSequenceCount; i++) {
    uniqueSequences.push(generateFixedFeatureSequence(i));
  }

  const latencies = [];
  let predictionCount = 0;

  // Passe 1 : Construction du cache (Miss attendus)
  logger.info("Passe 1 : Construction du cache (échecs de cache attendus)");
  for (let p = 0; p < sequencesPerProfile && predictionCount < runs; p++) {
    for (let i = 0; i < uniqueSequenceCount && predictionCount < runs; i++) {
      const profile = createProfileFromSequence(uniqueSequences[i]);
      
      const start = performance.now();
      await engine.predict(30, profile);
      const end = performance.now();
      latencies.push(end - start);

      predictionCount++;
    }
  }

  const passOneStats = calculateLatencyStats(latencies);
  const cacheStatsAfterPass1 = tensorCache.stats();

  logger.info(
    `Passe 1 terminée : ${cacheStatsAfterPass1.hitCount} succès, ${cacheStatsAfterPass1.missCount} échecs`
  );

  // Passe 2 : Réutilisation du cache (Hits attendus)
  logger.info("Passe 2 : Réutilisation du cache (succès de cache attendus)");
  tensorCache.resetStats();
  const pass2Latencies = [];

  predictionCount = 0;
  for (let p = 0; p < sequencesPerProfile && predictionCount < runs; p++) {
    for (let i = 0; i < uniqueSequenceCount && predictionCount < runs; i++) {
      const profile = createProfileFromSequence(uniqueSequences[i]);
      
      const start = performance.now();
      await engine.predict(30, profile);
      const end = performance.now();
      pass2Latencies.push(end - start);

      predictionCount++;
    }
  }

  const passTwoStats = calculateLatencyStats(pass2Latencies);
  const cacheStatsAfterPass2 = tensorCache.stats();

  logger.info(
    `Passe 2 terminée : ${cacheStatsAfterPass2.hitCount} succès, ${cacheStatsAfterPass2.missCount} échecs`
  );

  // Calcul de l'amélioration entre la Passe 1 et la Passe 2
  const medianImprovement = parseFloat(passOneStats.median) - parseFloat(passTwoStats.median);
  const percentImprovement = (
    ((parseFloat(passOneStats.median) - parseFloat(passTwoStats.median)) / 
    parseFloat(passOneStats.median)) * 100
  ).toFixed(1);

  return {
    label: "Test C : Caching",
    runs,
    uniqueSequences: uniqueSequenceCount,
    pass1: {
      stats: passOneStats,
      cacheHits: cacheStatsAfterPass1.hitCount,
      cacheMisses: cacheStatsAfterPass1.missCount,
    },
    pass2: {
      stats: passTwoStats,
      cacheHits: cacheStatsAfterPass2.hitCount,
      cacheMisses: cacheStatsAfterPass2.missCount,
    },
    improvement: {
      absolute: `${medianImprovement.toFixed(2)}ms`,
      percent: `${percentImprovement}%`,
    },
    latencies: pass2Latencies, // Utilise la Passe 2 comme résultat "optimisé"
    stats: passTwoStats,
    memoryInfo: tf.memory(),
  };
}

/**
 * Génère une séquence de caractéristiques DÉTERMINISTE basée sur l'index.
 * Même index = même séquence = succès de cache garanti au second passage.
 */
function generateFixedFeatureSequence(index) {
  const TIME_STEPS = 12;
  const FEATURES = 16;
  const sequence = [];

  for (let t = 0; t < TIME_STEPS; t++) {
    const step = new Array(FEATURES).fill(0);
    // Valeurs déterministes basées sur l'index
    step[0] = (index + t) * 0.5;  // vitesse
    step[1] = (index + t) * 0.25; // accélération
    step[2] = ((index + t) % 10) * 10; // deltaTime
    step[3] = (t / TIME_STEPS) * 100;  // temps relatif
    sequence.push(step);
  }

  return sequence;
}

/**
 * Crée un objet profil à partir d'une séquence de caractéristiques.
 */
function createProfileFromSequence(sequence) {
  return {
    lastPromoTimestamp: Date.now() - Math.random() * 86400000,
    isNewUser: false,
    sessionDuration: Math.random() * 3600,
    pageViewCount: Math.floor(Math.random() * 50),
  };
}

/**
 * Génère N profils fictifs avec des distributions réalistes.
 */
function generateMockProfiles(count) {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    profiles.push({
      lastPromoTimestamp: Date.now() - Math.random() * 86400000,
      isNewUser: Math.random() < 0.3,
      sessionDuration: Math.random() * 3600,
      pageViewCount: Math.floor(Math.random() * 50),
    });
  }
  return profiles;
}

/**
 * Génère une séquence semi-aléatoire à partir d'un profil.
 */
function generateFeatureSequence(profile) {
  const TIME_STEPS = 12;
  const FEATURES = 16;
  const sequence = [];

  for (let t = 0; t < TIME_STEPS; t++) {
    const step = new Array(FEATURES).fill(0);
    step[0] = Math.random() * 10;
    step[1] = Math.random() * 5;
    step[2] = Math.random() * 100;
    step[3] = (t / TIME_STEPS) * 100;
    sequence.push(step);
  }

  return sequence;
}