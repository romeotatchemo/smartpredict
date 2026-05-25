import React, { useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { backendManager } from "../../../engine/core/BackendManager";
import { logger } from "../../../engine/utils/logger.js";
import { useBenchmark } from "../../hooks/useBenchmark";
import { useSmartPredict } from "../../hooks/useSmartPredict";
import useMLWorker from "../../hooks/useMLWorker";
import { BenchmarkMetricCard } from "../BenchmarkMetricCard";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const BenchmarkPage = () => {
  const [selectedModel, setSelectedModel] = useState("ChurnModel");
  const [selectedBackend, setSelectedBackend] = useState(tf.getBackend());
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [activeBackend, setActiveBackend] = useState(tf.getBackend());
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  // Hook de mesure
  const benchmark = useBenchmark();

  // Hook pour prédiction via worker
  const { predict: predictChurn, status: workerStatus, result: predictionResult } = useMLWorker();
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionOutput, setPredictionOutput] = useState(null);

  /**
   * Change le backend et met à jour l'état
   */
  const handleBackendChange = async (newBackend) => {
    setSelectedBackend(newBackend);
    logger.info(`Switching backend to: ${newBackend}`);

    const success = await backendManager.switchBackend(newBackend);
    if (success) {
      setActiveBackend(newBackend);
      benchmark.resetHistory();
    } else {
      logger.error(`Failed to switch to ${newBackend}`);
      setSelectedBackend(activeBackend);
    }
  };

  /**
   * Lance un benchmark complet
   */
  const runBenchmark = async () => {
    setIsTestRunning(true);

    try {
      logger.info(`🚀 Benchmark start: ${selectedModel} on ${activeBackend}`);

      // Simuler une fonction de prédiction légère pour la démo
      const predictionFn = async () => {
        const testData = tf.randomNormal([1, 12, 16]);
        testData.dispose();
      };

      // Exécuter 10 runs
      const results = await benchmark.runBenchmarkWithUI(predictionFn, 10);
      setBenchmarkResults(results);
      setHistoryData(benchmark.getHistoryForChart());

      logger.info(`✅ Benchmark completed:`);
      logger.info(`  Median latency: ${results.stats.median}ms`);
      logger.info(`  P95: ${results.stats.p95}ms`);
      logger.info(
        `  Memory delta: ${results.memory.after.numBytes - results.memory.before.numBytes} bytes`,
      );
    } catch (error) {
      logger.error("Benchmark error:", error);
    } finally {
      setIsTestRunning(false);
    }
  };

  // ===== NOUVEAU : Tests Comparatifs A/B/C =====
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isComparisonRunning, setIsComparisonRunning] = useState(false);
  const { engine } = useSmartPredict();
  /**
   * Exécute une suite de tests de performance pour comparer différentes stratégies de prédiction.
   * * Test A : Référence (Baseline) - Traitement séquentiel standard.
   * Test B : Lot (Batching) - Traitement groupé des données.
   * Test C : Mise en cache (Caching) - Réutilisation des tenseurs calculés.
   * * @async
   * @function runComparisonTests
   */
  const runComparisonTests = async () => {
    setIsComparisonRunning(true);
    setComparisonResults(null);

    try {
      logger.info("🔬 Démarrage des tests comparatifs A/B/C...");

      // Importation dynamique des utilitaires de benchmark
      const { testA_Baseline, testB_Batching, testC_Caching } =
        await import("../../../engine/utils/benchmarkUtils");

      // Récupération de l'instance du moteur via le contexte

      // Exécution séquentielle des trois tests (100 itérations chacun)
      // Test A : Ligne de base
      const resultA = await testA_Baseline(engine.current, 100);
      logger.info("✅ Test A terminé (Référence)");

      // Test B : Batching avec des lots de 10
      const resultB = await testB_Batching(engine.current, 100, 10);
      logger.info("✅ Test B terminé (Batching)");

      // Test C : Caching avec un taux de réutilisation de 50%
      const resultC = await testC_Caching(engine.current, 100, 0.5);
      logger.info("✅ Test C terminé (Caching)");

      // Analyse et comparaison des résultats
      setComparisonResults({
        testA: resultA,
        testB: resultB,
        testC: resultC,
        bestOption: determineBestOption(resultA, resultB, resultC),
      });

      logger.info("🎯 Comparaison terminée avec succès !");
    } catch (error) {
      logger.error("Erreur lors des tests comparatifs :", error);
      console.log(error);
    } finally {
      setIsComparisonRunning(false);
    }
  };

  /**
   * Exécute une prédiction de churn via le worker
   */
  const executePredictionChurn = async () => {
    setIsPredicting(true);
    setPredictionOutput(null);
    
    try {
      logger.info('🔮 Executing churn prediction via worker...');
      const result = await predictChurn(null, 'churn');
      
      setPredictionOutput({
        success: true,
        result,
        timestamp: new Date().toISOString(),
      });
      
      logger.info('✅ Prediction completed:', result);
    } catch (error) {
      logger.error('❌ Prediction error:', error.message);
      setPredictionOutput({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsPredicting(false);
    }
  };

  /**
   * Détermine quelle stratégie offre la meilleure performance basée sur la latence médiane.
   * * @param {Object} a - Résultats du test A.
   * @param {Object} b - Résultats du test B.
   * @param {Object} c - Résultats du test C.
   * @returns {string} Le nom de l'option la plus performante.
   */
  const determineBestOption = (a, b, c) => {
    const medianA = parseFloat(a.stats.median);
    const medianB = parseFloat(b.stats.median);
    const medianC = parseFloat(c.stats.median);

    // Comparaison des médianes pour identifier le temps d'exécution le plus court
    if (medianC <= medianA && medianC <= medianB) return "C (Mise en cache)";
    if (medianB <= medianA && medianB <= medianC) return "B (Lot / Batching)";
    return "A (Référence / Baseline)";
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1>Benchmark — Mesurer les performances réelles</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: "40px",
        }}
      >
        {/* ===== PANNEAU GAUCHE : Contrôles ===== */}
        <aside
          style={{
            backgroundColor: "#f9f9f9",
            padding: "20px",
            borderRadius: "8px",
            height: "fit-content",
          }}
        >
          <h3>Contrôles</h3>

          {/* Backend actif */}
          <div
            style={{
              marginBottom: "20px",
              padding: "10px",
              backgroundColor: "#e8f5e9",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            <strong>Backend actif:</strong>
            <p style={{ margin: "5px 0 0", fontFamily: "monospace" }}>
              {activeBackend.toUpperCase()}
            </p>
          </div>

          {/* Sélection modèle */}
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Modèle :
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            >
              <option>ChurnModel</option>
              <option>CocoSSD (Vision)</option>
              <option>USE (NLP)</option>
            </select>
          </div>

          {/* Sélection backend */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Backend :
            </label>
            <div>
              {["webgl", "wasm", "cpu"].map((backend) => (
                <label
                  key={backend}
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="backend"
                    value={backend}
                    checked={selectedBackend === backend}
                    onChange={(e) => handleBackendChange(e.target.value)}
                    disabled={isTestRunning}
                  />
                  {" " + backend.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Bouton test */}
          <button
            onClick={runBenchmark}
            disabled={isTestRunning}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: isTestRunning ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isTestRunning ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            {isTestRunning ? "⏳ Test en cours..." : "▶ Lancer benchmark"}
          </button>

          {/* Section des Tests Comparatifs A/B/C */}
          <button
            /**
             * Déclenche la suite de tests de performance comparant les stratégies
             * de prédiction (Baseline vs Batching vs Caching).
             */
            onClick={runComparisonTests}
            /** Désactivé pendant l'exécution pour éviter les tests concurrents */
            disabled={isComparisonRunning}
            style={{
              width: "100%",
              padding: "12px",
              // Changement de couleur dynamique selon l'état du test
              backgroundColor: isComparisonRunning ? "#ccc" : "#FF9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
              // Curseur "interdit" si un test est déjà lancé
              cursor: isComparisonRunning ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              marginTop: "15px",
            }}
          >
            {/* Affichage conditionnel du libellé selon l'état de l'exécution */}
            {isComparisonRunning
              ? "⏳ Comparaison en cours..."
              : "🔬 Lancer les Tests A/B/C"}
          </button>

          {/* Bouton Prédiction Churn via Worker */}
          <button
            onClick={executePredictionChurn}
            disabled={isPredicting}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: isPredicting ? "#ccc" : "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isPredicting ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              marginTop: "15px",
            }}
            title={workerStatus !== 'ready' ? `Worker: ${workerStatus}` : 'Exécuter une prédiction churn'}
          >
            {isPredicting ? "⏳ Prédiction..." : `🔮 Predict Churn (${workerStatus})`}
          </button>

          {/* Info résumé */}
          {benchmarkResults && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>Résumé :</p>
              <p style={{ margin: "4px 0" }}>Runs : {benchmarkResults.runs}</p>
              <p style={{ margin: "4px 0" }}>
                Médiane : {benchmarkResults.stats.median}ms
              </p>
              <p style={{ margin: "4px 0" }}>
                P95 : {benchmarkResults.stats.p95}ms
              </p>
            </div>
          )}

          {/* Résultat de la prédiction churn */}
          {predictionOutput && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: predictionOutput.success ? "#e8f5e9" : "#ffebee",
                borderLeft: `4px solid ${predictionOutput.success ? "#4caf50" : "#f44336"}`,
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: "bold" }}>
                {predictionOutput.success ? "✅ Prédiction réussie" : "❌ Erreur"}
              </p>
              {predictionOutput.success ? (
                <>
                  <p style={{ margin: "4px 0", fontFamily: "monospace", fontSize: "11px" }}>
                    Résultat: {JSON.stringify(predictionOutput.result).substring(0, 100)}...
                  </p>
                </>
              ) : (
                <p style={{ margin: "4px 0" }}>{predictionOutput.error}</p>
              )}
              <p style={{ margin: "8px 0 0", color: "#999", fontSize: "10px" }}>
                {new Date(predictionOutput.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </aside>

        {/* ===== PANNEAU DROIT : Métriques ===== */}
        <main>
          {/* Section : Métriques en temps réel */}
          <section style={{ marginBottom: "40px" }}>
            <h2>Métriques en temps réel</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "15px",
              }}
            >
              <BenchmarkMetricCard
                label="Latence médiane"
                value={benchmark.displayMetrics.latencyMedian}
                unit="ms"
                threshold={{ good: 100, warning: 500 }}
              />
              <BenchmarkMetricCard
                label="P95 (95e percentile)"
                value={benchmark.displayMetrics.latencyP95 || 0}
                unit="ms"
                threshold={{ good: 150, warning: 750 }}
              />
              <BenchmarkMetricCard
                label="Tenseurs actifs"
                value={benchmark.displayMetrics.numTensors}
                unit=""
              />
              <BenchmarkMetricCard
                label="Mémoire GPU"
                value={benchmark.displayMetrics.memoryMB}
                unit="MB"
              />
            </div>
          </section>

          {/* Section : Historique latence */}
          <section style={{ marginBottom: "40px" }}>
            <h2>Historique latence (derniers 50 runs)</h2>
            <div
              style={{
                backgroundColor: "#f9f9f9",
                padding: "20px",
                borderRadius: "8px",
                minHeight: "300px",
              }}
            >
              <LineChart
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: "300px",
                  border: "1px solid #d6d3d1",
                  borderRadius: "4px",
                  aspectRatio: 1.18,
                }}
                responsive
                data={historyData}
                margin={{
                  top: 5,
                  right: 0,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" />
                <XAxis dataKey="iteration" stroke="#52525b" />
                <YAxis width="auto" stroke="#a8a29e" />
                <Tooltip
                  cursor={{
                    stroke: "#a8a29e",
                  }}
                  contentStyle={{
                    backgroundColor: "#fafafa",
                    borderColor: "#a8a29e",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#8884d8"
                  dot={{
                    fill: "#fff",
                  }}
                  activeDot={{ r: 8, stroke: "#fff" }}
                />
              </LineChart>
            </div>
          </section>

          {/* Section : Tableau comparatif */}
          <section>
            <h2>Tableau comparatif des backends</h2>
            {benchmarkResults ? (
              <div
                style={{
                  backgroundColor: "#f9f9f9",
                  padding: "20px",
                  borderRadius: "8px",
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #ddd" }}>
                      <th style={{ padding: "8px", textAlign: "left" }}>
                        Métrique
                      </th>
                      <th style={{ padding: "8px", textAlign: "right" }}>
                        Valeur
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "8px" }}>Latence min</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        {benchmarkResults.stats.min}ms
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "8px" }}>Latence médiane</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        {benchmarkResults.stats.median}ms
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "8px" }}>Latence max</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        {benchmarkResults.stats.max}ms
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px" }}>P95</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        {benchmarkResults.stats.p95}ms
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "#999" }}>
                Lancez un test pour voir les résultats comparatifs.
              </p>
            )}
          </section>
          {/* Section: A/B/C Resultats des Tests Comparatifs */}
          <section>
            <h2>Résultats A/B/C — Batching vs Caching</h2>
            {comparisonResults ? (
              <div
                style={{
                  backgroundColor: "#f9f9f9",
                  padding: "20px",
                  borderRadius: "8px",
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f0f0f0",
                        borderBottom: "2px solid #ddd",
                      }}
                    >
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Test
                      </th>
                      <th style={{ padding: "12px", textAlign: "right" }}>
                        Médiane (ms)
                      </th>
                      <th style={{ padding: "12px", textAlign: "right" }}>
                        Min (ms)
                      </th>
                      <th style={{ padding: "12px", textAlign: "right" }}>
                        Max (ms)
                      </th>
                      <th style={{ padding: "12px", textAlign: "right" }}>
                        Gain vs A
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      style={{
                        borderBottom: "1px solid #eee",
                        backgroundColor: "#e8f5e9",
                      }}
                    >
                      <td style={{ padding: "12px", fontWeight: "bold" }}>
                        Test A: Baseline
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {comparisonResults.testA.stats.median}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {comparisonResults.testA.stats.min}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {comparisonResults.testA.stats.max}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>—</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>
                        Test B: Batching (size=10)
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {comparisonResults.testB.stats.median}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {comparisonResults.testB.stats.min}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {comparisonResults.testB.stats.max}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          color:
                            parseFloat(comparisonResults.testB.stats.median) <
                            parseFloat(comparisonResults.testA.stats.median)
                              ? "green"
                              : "red",
                        }}
                      >
                        {(
                          parseFloat(comparisonResults.testA.stats.median) -
                          parseFloat(comparisonResults.testB.stats.median)
                        ).toFixed(2)}
                        ms
                      </td>
                    </tr>
                    <tr
                      style={{
                        borderBottom: "1px solid #eee",
                        backgroundColor: "#fff9c4",
                      }}
                    >
                      <td style={{ padding: "12px", fontWeight: "bold" }}>
                        Test C: Caching (50% hits)
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {comparisonResults.testC.stats.median}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {comparisonResults.testC.stats.min}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {comparisonResults.testC.stats.max}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          color:
                            parseFloat(comparisonResults.testC.stats.median) <
                            parseFloat(comparisonResults.testA.stats.median)
                              ? "green"
                              : "red",
                        }}
                      >
                        {(
                          parseFloat(comparisonResults.testA.stats.median) -
                          parseFloat(comparisonResults.testC.stats.median)
                        ).toFixed(2)}
                        ms
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div
                  style={{
                    marginTop: "20px",
                    padding: "15px",
                    backgroundColor: "#e8eaf6",
                    borderRadius: "4px",
                    borderLeft: "4px solid #3f51b5",
                  }}
                >
                  <strong>
                    🎯 Meilleure option : {comparisonResults.bestOption}
                  </strong>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: "12px",
                      color: "#555",
                    }}
                  >
                    Pour le modèle churn sur ce backend,{" "}
                    {comparisonResults.bestOption}
                    {comparisonResults.bestOption === "C (Caching)" &&
                      " offre les meilleures performances. Le cache des tenseurs fréquents est plus efficace que le batching."}
                    {comparisonResults.bestOption === "B (Batching)" &&
                      " fournit de meilleures performances. Le batching améliore la parallélisation."}
                    {comparisonResults.bestOption === "A (Baseline)" &&
                      " montre déjà les meilleures performances. Aucune optimisation n'est nécessaire."}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: "#999" }}>
                Cliquez sur "🔬 A/B/C Tests" pour comparer batching, caching, et
                baseline.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};
