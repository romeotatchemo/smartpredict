/**
 * useBenchmark - Hook React pour mesurer les performances
 * 
 * Responsabilités :
 * - Gérer l'état React (displayMetrics)
 * - Gérer les refs (historique)
 * - Orchestrer les fonctions de benchmarkUtils
 * 
 * ✨ Logique métier = benchmarkUtils.js
 * ✨ Logique React = useBenchmark.js
 * 
 * Séparation claire des concerns
 * 
 */

import { useRef, useState } from 'react';
import {
  BenchmarkHistory,
  measureLatency,
  captureMemorySnapshot,
  calculateLatencyStats,
  calculatePercentile,
  runBenchmarkSuite,
  formatHistoryForChart,
} from '../../engine/utils/benchmarkUtils';

export const useBenchmark = () => {
  // État pour l'affichage UI seulement
  const [displayMetrics, setDisplayMetrics] = useState({
    latencyMedian: 0,
    latencyMin: 0,
    latencyMax: 0,
    latencyP95: 0,
    numTensors: 0,
    memoryMB: 0,
  });

  // Historique en useRef (pas de rerender à chaque mesure)
  const historyRef = useRef(new BenchmarkHistory());

  /**
   * Met à jour l'affichage avec les stats courantes
   */
  const updateDisplayMetrics = (latencies, memoryData) => {
    const stats = calculateLatencyStats(latencies);
    const p95 = calculatePercentile(latencies, 95);

    setDisplayMetrics({
      latencyMedian: stats.median.toFixed(2),
      latencyMin: stats.min.toFixed(2),
      latencyMax: stats.max.toFixed(2),
      latencyP95: p95.toFixed(2),
      numTensors: memoryData.numTensors,
      memoryMB: memoryData.memoryMB,
    });
  };

  /**
   * Lance une suite de mesures complètes
   * Wrapper autour de benchmarkUtils.runBenchmarkSuite
   * Gère la mise à jour de l'affichage après chaque run
   */
  const runBenchmarkWithUI = async (predictionFn, runs = 10) => {
    // Utiliser la logique métier de benchmarkUtils
    const results = await runBenchmarkSuite(
      predictionFn,
      runs,
      historyRef.current
    );

    // Mettre à jour l'affichage après tous les runs
    const currentMemory = captureMemorySnapshot();
    updateDisplayMetrics(historyRef.current.getLatencies(), currentMemory);

    return results;
  };

  /**
   * Réinitialise l'historique
   */
  const resetHistory = () => {
    historyRef.current.reset();
    setDisplayMetrics({
      latencyMedian: 0,
      latencyMin: 0,
      latencyMax: 0,
      latencyP95: 0,
      numTensors: 0,
      memoryMB: 0,
    });
  };

  /**
   * Exporte l'historique pour les graphiques
   */
  const getHistoryForChart = () => {
    return formatHistoryForChart(historyRef.current);
  };

  /**
   * Retourne les stats courantes sans updater l'UI
   * (utile si on veut juste lire les données)
   */
  const getCurrentStats = () => {
    const latencies = historyRef.current.getLatencies();
    if (latencies.length === 0) {
      return null;
    }
    return calculateLatencyStats(latencies);
  };

  return {
    displayMetrics,
    runBenchmarkWithUI,
    resetHistory,
    getHistoryForChart,
    getCurrentStats,
    historyRef,
  };
};
