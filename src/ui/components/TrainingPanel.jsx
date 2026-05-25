import React from "react";
import { useSmartPredict } from "../hooks/useSmartPredict";
import { logger } from "../../engine/utils/logger.js";

/**
 * Composant d'entraînement du modèle
 * Permet d'entraîner et sauvegarder le modèle de prédiction de churn
 * directement depuis l'interface utilisateur
 */
export const TrainingPanel = () => {
  const { train, isTraining, trainingProgress, error } = useSmartPredict();
  const [result, setResult] = React.useState(null);
  const [errorMsg, setErrorMsg] = React.useState(null);

  const handleTrain = async () => {
    setErrorMsg(null);
    setResult(null);

    try {
      const response = await train();
      setResult(response);
    } catch (err) {
      setErrorMsg(err.message || "Erreur d'entraînement");
      logger.error("Training error:", err);
    }
  };

  const progressPercent = trainingProgress
    ? Math.round((trainingProgress.epoch / trainingProgress.totalEpochs) * 100)
    : 0;

  return (
    <div
      style={{
        border: "2px solid #0066cc",
        borderRadius: "8px",
        padding: "20px",
        marginTop: "20px",
        backgroundColor: "#f9f9f9",
        maxWidth: "600px",
      }}
    >
      <h2>🧠 Entraîner le Modèle de Churn</h2>

      {error && (
        <div
          style={{
            backgroundColor: "#ffe6e6",
            color: "#cc0000",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          ⚠️ Erreur moteur: {error}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            backgroundColor: "#ffe6e6",
            color: "#cc0000",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          ❌ {errorMsg}
        </div>
      )}

      <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
        Cliquez sur "Démarrer l'entraînement" pour entraîner le modèle avec un
        dataset synthétique de 1500 samples. Cela prendra 5-10 minutes.
      </p>

      <button
        onClick={handleTrain}
        disabled={isTraining}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          backgroundColor: isTraining ? "#ccc" : "#0066cc",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isTraining ? "not-allowed" : "pointer",
          marginBottom: "15px",
          width: "100%",
        }}
      >
        {isTraining
          ? `⏳ Entraînement... Epoch ${trainingProgress?.epoch || 0}/50`
          : "🚀 Démarrer l'entraînement"}
      </button>

      {/* Progress Bar */}
      {isTraining && (
        <div style={{ marginBottom: "15px" }}>
          <div
            style={{
              width: "100%",
              height: "24px",
              backgroundColor: "#e0e0e0",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "5px",
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                backgroundColor: "#0066cc",
                transition: "width 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {progressPercent > 10 && `${progressPercent}%`}
            </div>
          </div>

          {trainingProgress && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                fontSize: "13px",
                color: "#333",
              }}
            >
              <div>📊 Loss: {trainingProgress.loss}</div>
              <div>📈 Accuracy: {trainingProgress.accuracy}</div>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {result && (
        <div
          style={{
            backgroundColor: "#e6ffe6",
            color: "#009900",
            padding: "15px",
            borderRadius: "4px",
            marginTop: "15px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
            ✅ {result.message}
          </div>
          <div style={{ fontSize: "13px" }}>
            <div>📊 Loss final: {result.performance.finalLoss?.toFixed(4)}</div>
            <div>
              📈 Accuracy final: {result.performance.finalAccuracy?.toFixed(4)}
            </div>
          </div>
          <div
            style={{ marginTop: "10px", fontSize: "12px", color: "#006600" }}
          >
            💾 Modèle sauvegardé dans IndexedDB
          </div>
          <div
            style={{ marginTop: "10px", fontSize: "12px", color: "#006600" }}
          >
            🔄 Recharger la page pour utiliser le nouveau modèle
          </div>
        </div>
      )}

      {/* Info Box */}
      <div
        style={{
          backgroundColor: "#e6f2ff",
          padding: "12px",
          borderRadius: "4px",
          marginTop: "15px",
          fontSize: "12px",
          color: "#0066cc",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
          ℹ️ Informations
        </div>
        <ul style={{ margin: "0", paddingLeft: "20px" }}>
          <li>Dataset: 1500 samples synthetiques</li>
          <li>Epochs: 50</li>
          <li>Batch size: 32</li>
          <li>Sauvegarde: IndexedDB (persiste après rechargement)</li>
        </ul>
      </div>
    </div>
  );
};
