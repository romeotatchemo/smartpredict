import * as tf from "@tensorflow/tfjs";
import { logger } from "./logger";

export class MemoryDiagnostic {
  static diagnose(label) {
    const mem = tf.memory();
    const report = {
      label,
      numTensors: mem.numTensors,
      numDataBuffers: mem.numDataBuffers,
      numBytes: mem.numBytes,
      numBytesInGPU: (mem.numBytes / 1024 / 1024).toFixed(2) + " MB",
      unreliable: mem.unreliable,
      timestamp: new Date().toISOString(),
    };
    console.log(`%c${label}`, "font-weight: bold; color: #00d4ff; font-size: 12px;");
    console.log(report);
    return report;
  }

  static startMonitoring(intervalMs = 5000) {
    let iteration = 0;
    const baseline = this.diagnose("🔵 MONITORING STARTED");
    const interval = setInterval(() => {
      const mem = tf.memory();
      iteration++;
      const delta = mem.numTensors - baseline.numTensors;
      const color = delta > 0 ? "#ff4757" : "#2ed573";
      console.log(
        `%c[${iteration}] numTensors: ${mem.numTensors} | Delta: +${delta} | GPU: ${(mem.numBytes / 1024 / 1024).toFixed(2)} MB`,
        `color: ${color}; font-weight: ${delta > 0 ? "bold" : "normal"};`
      );
    }, intervalMs);
    logger.info("Memory monitoring started (call window.__stopMemoryMonitoring() to stop)");
    window.__stopMemoryMonitoring = () => {
      clearInterval(interval);
      logger.info("Memory monitoring stopped");
    };
    return interval;
  }

  /**
   * Analyse de la différence mémoire entre deux états
   * @param {Object} baseline - État initial (retourné par diagnose())
   * @param {Object} afterPredictions - État après actions
   * @returns {Object} Rapport de delta
   */
  static delta(baseline, afterPredictions) {
    const tensorDelta = afterPredictions.numTensors - baseline.numTensors;
    const bufferDelta = afterPredictions.numDataBuffers - baseline.numDataBuffers;
    const bytesDelta = afterPredictions.numBytes - baseline.numBytes;
    const mbDelta = (bytesDelta / 1024 / 1024).toFixed(2);

    const hasLeak = tensorDelta > 0 || bufferDelta > 0;
    const status = hasLeak ? "🔴 LEAK DETECTED" : "✅ Normal";

    const report = {
      "Tensor Count": `+${tensorDelta}`,
      "Data Buffer Count": `+${bufferDelta}`,
      "Leaked MB": `+${mbDelta} MB`,
      "Status": status,
      "Baseline Tensors": baseline.numTensors,
      "After Tensors": afterPredictions.numTensors,
      "Before GPU": baseline.numBytesInGPU,
      "After GPU": afterPredictions.numBytesInGPU,
    };

    console.log("%cMEMORY DELTA ANALYSIS", "font-weight: bold; color: #ff6348; font-size: 12px;");
    console.table(report);
    return report;
  }

  /**
   * Extrapolation des fuites mémoire sur X heures d'utilisation continue
   * Hypothèses :
   * - 1 prédiction toutes les 30 secondes (120 prédictions/heure)
   * - 2 tenseurs leakés par prédiction (~32 KB par prédiction)
   * @param {number} hours - Nombre d'heures à extrapoler
   * @returns {Object} Rapport d'extrapolation
   */
  static extrapolate(hours) {
    const PREDICTIONS_PER_HOUR = 120; // 1 prédiction tous les 30 secondes
    const TENSORS_PER_PREDICTION = 2;
    const MB_PER_PREDICTION = 0.032; // Approximation 32 KB

    const totalPredictions = PREDICTIONS_PER_HOUR * hours;
    const tensorsLeaked = totalPredictions * TENSORS_PER_PREDICTION;
    const estimatedGPUMB = (totalPredictions * MB_PER_PREDICTION).toFixed(2);

    let status = "✅ Usable";
    let recommendation = "App runs smoothly";

    if (hours <= 1) {
      status = "✅ Usable";
      recommendation = "App runs smoothly";
    } else if (hours <= 3) {
      status = "⚠️ Performance degradation likely";
      recommendation = "UI may freeze intermittently";
    } else {
      status = "🔴 Browser crash almost certain";
      recommendation = "App will crash or become unusable";
    }

    const report = {
      "Duration": `${hours} hour(s)`,
      "Expected Predictions": totalPredictions,
      "Tensors Leaked": tensorsLeaked,
      "Estimated GPU Memory": `${estimatedGPUMB} MB`,
      "Status": status,
      "Recommendation": recommendation,
    };

    console.log(`%cMEMORY EXTRAPOLATION — ${hours} hour(s) of continuous usage`, 
      "font-weight: bold; color: #ffa502; font-size: 12px;");
    console.table(report);
    return report;
  }

  /**
   * Test validation que .dispose() fonctionne réellement
   * Crée un tensor, le dispose, et vérifie la libération mémoire
   * @returns {Object} Rapport du test
   */
  static testDispose() {
    const beforeTest = tf.memory();
    console.log("%cDISPOSE() VALIDATION TEST", "font-weight: bold; color: #00d4ff; font-size: 12px;");

    try {
      // Créer un tensor test
      const testTensor = tf.tensor1d([1, 2, 3, 4, 5]);
      const afterCreation = tf.memory();

      console.log(`%c✅ Created test tensor successfully`, "color: #2ed573;");
      console.log(`Before create: numTensors = ${beforeTest.numTensors}`);
      console.log(`After create: numTensors = ${afterCreation.numTensors}`);

      // Disposer le tensor
      testTensor.dispose();
      const afterDispose = tf.memory();

      console.log(`After dispose: numTensors = ${afterDispose.numTensors}`);

      // Valider que le tensor a été libéré
      const wasTensorFreed = afterDispose.numTensors === beforeTest.numTensors;
      const status = wasTensorFreed ? "✅ .dispose() WORKS - Memory freed correctly" : "❌ .dispose() FAILED - Memory not freed";

      const report = {
        "Test Status": status,
        "Tensors Before": beforeTest.numTensors,
        "Tensors After Creation": afterCreation.numTensors,
        "Tensors After Dispose": afterDispose.numTensors,
        "Memory Freed": wasTensorFreed ? "Yes" : "No",
      };

      console.table(report);
      return report;
    } catch (error) {
      console.error("❌ dispose() test failed:", error);
      return {
        "Test Status": "❌ ERROR",
        "Error Message": error.message,
      };
    }
  }
}