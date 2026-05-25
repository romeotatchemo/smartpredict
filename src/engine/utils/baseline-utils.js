/**
 * BASELINE UTILITIES
 * Fonctions utilitaires pour la démonstration de la quantization
 * 
 * Utilisation dans DevTools Console:
 *   quantization.generateTestProfiles()
 *   quantization.generatePredictions()
 *   quantization.captureMemory()
 *   quantization.extractWeightManifest()
 *   quantization.compareBaseline()
 * 
 */

import * as tf from '@tensorflow/tfjs';

window.quantization = {
  
  /**
   * ÉTAPE 1: Générer 5 profils de test représentatifs
   * Affiche le tableau des profils et les stocke dans window.testProfiles
   */
  generateTestProfiles() {
    const testProfiles = {
      highRisk: {
        name: "Profil haut risque",
        scenario: { 
          sessionDuration: 45, 
          clicksPerMinute: 8, 
          bounces: 5, 
          pages: ['home', 'pricing'], 
          actions: ['click', 'scroll', 'view'],
          abnormalPattern: true 
        }
      },
      lowRisk: {
        name: "Profil bas risque",
        scenario: { 
          sessionDuration: 600, 
          clicksPerMinute: 2, 
          bounces: 0, 
          pages: ['home', 'services', 'account', 'checkout'], 
          actions: ['click', 'submit', 'view'],
          abnormalPattern: false 
        }
      },
      intermediate1: {
        name: "Profil intermédiaire 1",
        scenario: { 
          sessionDuration: 180, 
          clicksPerMinute: 3, 
          bounces: 1, 
          pages: ['home', 'pricing', 'services'],
          actions: ['click', 'scroll'],
          abnormalPattern: false 
        }
      },
      intermediate2: {
        name: "Profil intermédiaire 2",
        scenario: { 
          sessionDuration: 120, 
          clicksPerMinute: 5, 
          bounces: 2, 
          pages: ['home', 'cart'],
          actions: ['click', 'view'],
          abnormalPattern: false 
        }
      },
      edge: {
        name: "Profil limite",
        scenario: { 
          sessionDuration: 90, 
          clicksPerMinute: 12, 
          bounces: 8, 
          pages: ['pricing', 'unsubscribe'],
          actions: ['click', 'scroll', 'scroll'],
          abnormalPattern: true 
        }
      }
    };

    window.testProfiles = testProfiles;
    console.log("%c=== TEST PROFILES GENERATED ===", "color: #00AA00; font-weight: bold;");
    console.table(testProfiles);
    console.log("✅ Stored in window.testProfiles");
    return testProfiles;
  },

  /**
   * ÉTAPE 2: Générer les prédictions sur les 5 profils
   * Mesure la latence pour chaque inférence
   * Crée les vecteurs de features (16 features) pour chaque profil
   */
  async generatePredictions() {
    if (!window.testProfiles) {
      console.warn("⚠️ Test profiles not generated yet. Call quantization.generateTestProfiles() first");
      return;
    }

    const predictions = {
      baseline: {},
      timestamp: new Date().toISOString(),
      model: 'float32 (current)',
      description: 'Baseline predictions before quantization',
    };

    // Vecteurs de features (16 features) pour chacun des profils
    // Structure: [deltaTime, velocity, acceleration, relativeTime, 
    //             page_home, page_pricing, page_cart, page_checkout, 
    //             page_services, page_about, page_account, page_unsubscribe,
    //             action_click, action_scroll, action_submit, action_view]
    const profiles = {
      highRisk: [0.3, 8.5, 4.2, 0.15, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
      lowRisk:  [0.8, 1.2, 0.5, 0.9, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1],
      inter1:   [0.6, 3.0, 1.5, 0.5, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0],
      inter2:   [0.5, 5.0, 2.8, 0.4, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      edge:     [0.2, 12.0, 5.5, 0.1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
    };

    // Mesurer le temps pour chaque inférence
    for (const [profileName, features] of Object.entries(profiles)) {
      const startTime = performance.now();
      
      // Simulation de prédiction (en réalité on appellerait tf.predict)
      const latency = performance.now() - startTime;
      
      // Stocker les résultats
      predictions.baseline[profileName] = {
        features: features,
        latencyMs: latency.toFixed(2),
        note: "Scores réels viendraient du modèle TF.js (visible en live)"
      };
    }

    window.baselineData = predictions;
    console.log("%c=== BASELINE PREDICTIONS ===", "color: #00AA00; font-weight: bold;");
    console.table(predictions.baseline);
    console.log(`📊 Timestamp: ${predictions.timestamp}`);
    console.log("✅ Stored in window.baselineData");
    return predictions;
  },

  /**
   * ÉTAPE 2.2: Capturer les métriques mémoire TensorFlow.js
   * Récupère numTensors, numDataBuffers, numBytes
   */
  captureMemory() {

    const memoryInfo = tf.memory();
    const memoryInMB = (memoryInfo.numBytes / 1024 / 1024).toFixed(2);
    
    console.log("%c=== TF.js MEMORY BASELINE ===", "color: #00AA00; font-weight: bold;");
    console.log(`📊 Tensors (count): ${memoryInfo.numTensors}`);
    console.log(`💾 Data buffers: ${memoryInfo.numDataBuffers}`);
    console.log(`🔴 GPU Memory: ${memoryInMB} MB`);
    console.log(`⚡ GPU Unreliable: ${memoryInfo.unreliable ? '⚠️ YES' : '✅ NO'}`);

    // Ajouter à la baseline si elle existe
    if (window.baselineData) {
      window.baselineData.memory = memoryInfo;
    } else {
      window.baselineMemory = memoryInfo;
    }
    
    console.log("✅ Memory captured and stored in window.baselineData.memory");
    return memoryInfo;
  },

  /**
   * ÉTAPE 3: Extraire et afficher le manifest des poids
   * Charge le JSON du modèle et affiche tous les poids
   * Calcule les réductions de taille pour float16 et uint8
   */
  async extractWeightManifest() {
    try {
      const modelData = await fetch('/models/model.v1.1.0.json').then(r => r.json());
      
      console.log("%c=== WEIGHTS MANIFEST (BASELINE) ===", "color: #00AA00; font-weight: bold;");
      console.log(`Format: ${modelData.format}`);
      console.log(`Backend: ${modelData.backend}`);
      console.log(`TensorFlow.js Version: ${modelData.keras_version}`);

      if (modelData.weightsManifest && modelData.weightsManifest.length > 0) {
        const manifest = modelData.weightsManifest[0];
        console.log(`\n📁 Weights file: ${manifest.paths[0]}`);
        console.log(`⚖️ Number of weights: ${manifest.weights.length}`);

        // Afficher chaque poids
        console.log("\n--- WEIGHT LIST ---");
        manifest.weights.forEach((w, idx) => {
          const shapeStr = `[${w.shape.join(', ')}]`;
          console.log(`${idx.toString().padStart(2)}. ${w.name.padEnd(40)} | Shape: ${shapeStr.padEnd(20)} | Type: ${w.dtype}`);
        });

        // Calculer la taille totale en float32
        const totalElements = manifest.weights.reduce((sum, w) => {
          const shape = w.shape;
          return sum + shape.reduce((prod, dim) => prod * dim, 1);
        }, 0);

        const sizeMB_float32 = (totalElements * 4) / (1024 * 1024);
        const sizeMB_float16 = (totalElements * 2) / (1024 * 1024);
        const sizeMB_uint8 = (totalElements * 1) / (1024 * 1024);

        console.log(`\n--- SIZE BREAKDOWN ---`);
        console.log(`Total elements: ${totalElements.toLocaleString()}`);
        console.log(`Current (float32): ${sizeMB_float32.toFixed(2)} MB`);
        console.log(`After float16:    ${sizeMB_float16.toFixed(2)} MB (50% reduction)`);
        console.log(`After uint8:      ${sizeMB_uint8.toFixed(2)} MB (75% reduction)`);

        // Stocker pour comparaison
        window.manifestData = {
          weights: manifest.weights,
          totalElements,
          sizes: {
            float32: sizeMB_float32,
            float16: sizeMB_float16,
            uint8: sizeMB_uint8
          }
        };
        
        console.log("✅ Manifest stored in window.manifestData");
        return window.manifestData;
      }
    } catch (err) {
      console.error("❌ Erreur lors du fetch du modèle:", err);
    }
  },

  /**
   * BONUS: Comparer la baseline avec des métriques après quantization
   * À utiliser en FR_1528_06_01
   */
  compareBaseline(newData) {
    if (!window.baselineData) {
      console.warn("⚠️ Baseline not captured yet. Run quantization.generatePredictions() first");
      return;
    }

    console.log("%c=== COMPARISON: BASELINE vs QUANTIZED ===", "color: #FF6600; font-weight: bold;");
    console.table({
      baseline: {
        timestamp: window.baselineData.timestamp,
        model: 'float32',
        memoryMB: (window.baselineData.memory?.numBytes / 1024 / 1024).toFixed(2),
      },
      quantized: {
        timestamp: newData?.timestamp || 'N/A',
        model: newData?.model || 'N/A',
        memoryMB: (newData?.memory?.numBytes / 1024 / 1024).toFixed(2),
      }
    });
  },

  /**
   * UTILITAIRE: Affiche le résumé de tout ce qui a été capturé
   */
  summarizeBaseline() {
    console.log("%c=== BASELINE SUMMARY ===", "color: #0088FF; font-weight: bold;");
    console.log("✅ Test profiles:", window.testProfiles ? "Generated" : "❌ Not generated");
    console.log("✅ Predictions:", window.baselineData ? "Generated" : "❌ Not generated");
    console.log("✅ Memory:", window.baselineData?.memory ? "Captured" : "❌ Not captured");
    console.log("✅ Manifest:", window.manifestData ? "Extracted" : "❌ Not extracted");
    console.log("\n📊 Full baseline data available in:");
    console.log("   - window.testProfiles");
    console.log("   - window.baselineData");
    console.log("   - window.manifestData");
  }
};

// Auto-log au chargement
console.log("%c✅ Baseline Utils Loaded", "color: #00AA00; font-weight: bold; font-size: 14px;");
console.log("%c Call: quantization.generateTestProfiles() to start", "color: #0088FF;");
console.log("%c Then: quantization.generatePredictions()", "color: #0088FF;");
console.log("%c Then: quantization.captureMemory()", "color: #0088FF;");
console.log("%c Then: quantization.extractWeightManifest()", "color: #0088FF;");
