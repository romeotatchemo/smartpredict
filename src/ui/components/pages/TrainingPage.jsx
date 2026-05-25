import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useSmartPredict } from "../../hooks/useSmartPredict";
import { logger } from "../../../engine/utils/logger";

export const TrainingPage = () => {
  const navigate = useNavigate();
  const { train, isReady, trainingProgress } = useSmartPredict();

  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleStartTraining = async () => {
    setIsTraining(true);
    setError(null);
    setSuccess(false);

    try {
      logger.info("🚀 Démarrage de l'entraînement du modèle...");
      await train();
      setSuccess(true);
      logger.info("✅ Entraînement terminé avec succès!");
    } catch (err) {
      logger.error("❌ Erreur lors de l'entraînement:", err);
      setError(err.message || "Une erreur est survenue lors de l'entraînement");
    } finally {
      setIsTraining(false);
    }
  };

  const stats = useMemo(() => {
    if (trainingProgress.length === 0) return null;

    // Extraire les métriques des données d'entraînement
    const lastEpoch = trainingProgress[trainingProgress.length - 1];
    const metrics = {
      status: isTraining
        ? "En cours..."
        : success
          ? "Terminé ✅"
          : error
            ? "Erreur ❌"
            : "Prêt",
      totalEpochs: trainingProgress.length,
      currentEpoch: lastEpoch?.epoch || 0,
      totalEpochsExpected: lastEpoch?.totalEpochs || 50,
      lastChurnLoss: lastEpoch?.churn?.loss || "?",
      lastChurnAccuracy: lastEpoch?.churn?.accuracy || "?",
    };

    return metrics;
  }, [trainingProgress, isTraining, success, error]);

  return (
    <div
      style={{ backgroundColor: "#f9f9f9", minHeight: "calc(100vh - 60px)" }}
    >
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #00d4ff 100%)",
          color: "white",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <h1
          style={{ fontSize: "40px", marginBottom: "20px", fontWeight: "bold" }}
        >
          Entraînement du Modèle 🤖
        </h1>
        <p
          style={{
            fontSize: "16px",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: "1.6",
          }}
        >
          Entraînez le modèle de prédiction de churn avec vos données. Le
          processus peut prendre quelques minutes.
        </p>
      </section>

      {/* Main Content */}
      <div
        style={{ padding: "60px 40px", maxWidth: "1200px", margin: "0 auto" }}
      >
        {/* Control Panel */}
        <div
          style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "8px",
            marginBottom: "40px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{ color: "#1a1a2e", marginTop: "0", marginBottom: "20px" }}
          >
            Panneau de Contrôle
          </h2>

          {isReady ? (
            <>
              <div style={{ marginBottom: "20px" }}>
                <button
                  onClick={handleStartTraining}
                  disabled={isTraining}
                  data-track="training_start_button"
                  style={{
                    padding: "15px 40px",
                    backgroundColor: isTraining ? "#ccc" : "#00d4ff",
                    color: isTraining ? "#666" : "#1a1a2e",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: isTraining ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isTraining) {
                      e.currentTarget.style.boxShadow =
                        "0 8px 20px rgba(0, 212, 255, 0.3)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {isTraining
                    ? "⏳ Entraînement en cours..."
                    : "🚀 Démarrer l'Entraînement"}
                </button>
              </div>

              {/* Info Box */}
              <div
                style={{
                  backgroundColor: "#f0f7ff",
                  border: "1px solid #d4e9ff",
                  padding: "15px",
                  borderRadius: "6px",
                  marginBottom: "20px",
                  fontSize: "14px",
                  color: "#0651a0",
                }}
              >
                <p style={{ margin: "0 0 10px" }}>
                  <strong>ℹ️ Informations:</strong>
                </p>
                <ul style={{ margin: "0", paddingLeft: "20px" }}>
                  <li>Modèle: ChurnModel (Multi-task Learning)</li>
                  <li>Dataset: 1000 exemples générés aléatoirement</li>
                  <li>Epochs: 50</li>
                  <li>Batch Size: 32</li>
                  <li>Validation: 10% du dataset</li>
                </ul>
              </div>
            </>
          ) : (
            <div
              style={{
                backgroundColor: "#fff3cd",
                border: "1px solid #ffeaa7",
                padding: "20px",
                borderRadius: "6px",
                color: "#856404",
              }}
            >
              <p style={{ margin: "0" }}>
                ⏳ Le modèle est en cours d'initialisation. Veuillez
                patienter...
              </p>
            </div>
          )}
        </div>

        {/* Statistics Panel */}
        {stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <p
                style={{ color: "#999", margin: "0 0 10px", fontSize: "12px" }}
              >
                État
              </p>
              <h3 style={{ color: "#1a1a2e", margin: "0", fontSize: "24px" }}>
                {stats.status}
              </h3>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <p
                style={{ color: "#999", margin: "0 0 10px", fontSize: "12px" }}
              >
                Epochs Complétées
              </p>
              <h3 style={{ color: "#00d4ff", margin: "0", fontSize: "24px" }}>
                {stats.currentEpoch} / {stats.totalEpochsExpected}
              </h3>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <p
                style={{ color: "#999", margin: "0 0 10px", fontSize: "12px" }}
              >
                Loss (Churn)
              </p>
              <h3 style={{ color: "#9775fa", margin: "0", fontSize: "24px" }}>
                {stats.lastChurnLoss}
              </h3>
            </div>

            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <p
                style={{ color: "#999", margin: "0 0 10px", fontSize: "12px" }}
              >
                Accuracy (Churn)
              </p>
              <h3
                style={{
                  color:
                    stats.lastChurnAccuracy > "0.8" ? "#51cf66" : "#ffd700",
                  margin: "0",
                  fontSize: "24px",
                }}
              >
                {stats.lastChurnAccuracy}
              </h3>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              color: "#721c24",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "40px",
            }}
          >
            <h3 style={{ margin: "0 0 10px" }}>
              ❌ Erreur lors de l'entraînement
            </h3>
            <p style={{ margin: "0", fontSize: "14px" }}>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            style={{
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              color: "#155724",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "40px",
            }}
          >
            <h3 style={{ margin: "0 0 10px" }}>✅ Entraînement Réussi!</h3>
            <p style={{ margin: "0 0 15px", fontSize: "14px" }}>
              Les fichiers model.json et model.weights.bin ont été téléchargés.
              Veuillez les déplacer dans le dossier{" "}
              <code style={{ backgroundColor: "#f0f0f0", padding: "2px 6px" }}>
                public/model/
              </code>
            </p>
            <button
              onClick={() => navigate("/")}
              data-track="training_home_redirect"
              style={{
                padding: "10px 20px",
                backgroundColor: "#155724",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Retour à l'Accueil
            </button>
          </div>
        )}

        {/* Training Progress Panel */}
        {trainingProgress.length > 0 && (
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{ color: "#1a1a2e", marginTop: "0", marginBottom: "20px" }}
            >
              Progression de l'Entraînement ({trainingProgress.length} epochs)
            </h2>

            <div
              style={{
                backgroundColor: "#f9f9f9",
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
                padding: "20px",
                maxHeight: "500px",
                overflowY: "auto",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #00d4ff" }}>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        color: "#1a1a2e",
                        fontWeight: "bold",
                      }}
                    >
                      Époque
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        color: "#1a1a2e",
                        fontWeight: "bold",
                      }}
                    >
                      Loss (Churn)
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        color: "#1a1a2e",
                        fontWeight: "bold",
                      }}
                    >
                      Accuracy (Churn)
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        color: "#1a1a2e",
                        fontWeight: "bold",
                      }}
                    >
                      Loss (Conversion)
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        color: "#1a1a2e",
                        fontWeight: "bold",
                      }}
                    >
                      Accuracy (Conversion)
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        color: "#1a1a2e",
                        fontWeight: "bold",
                      }}
                    >
                      Loss (Abuse)
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        color: "#1a1a2e",
                        fontWeight: "bold",
                      }}
                    >
                      Accuracy (Abuse)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trainingProgress.map((progress, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #e0e0e0",
                        backgroundColor: idx % 2 === 0 ? "white" : "#f5f5f5",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px",
                          color: "#00d4ff",
                          fontWeight: "bold",
                        }}
                      >
                        {progress.epoch} / {progress.totalEpochs}
                      </td>
                      <td style={{ padding: "10px", color: "#9775fa" }}>
                        {progress.churn?.loss || "?"}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          color:
                            parseFloat(progress.churn?.accuracy) > 0.8
                              ? "#51cf66"
                              : "#ffd700",
                          fontWeight: "bold",
                        }}
                      >
                        {progress.churn?.accuracy || "?"}
                      </td>
                      <td style={{ padding: "10px", color: "#ff8c42" }}>
                        {progress.conversion?.loss || "?"}
                      </td>
                      <td style={{ padding: "10px", color: "#ff8c42" }}>
                        {progress.conversion?.accuracy || "?"}
                      </td>
                      <td style={{ padding: "10px", color: "#ff6b6b" }}>
                        {progress.abuse?.loss || "?"}
                      </td>
                      <td style={{ padding: "10px", color: "#ff6b6b" }}>
                        {progress.abuse?.accuracy || "?"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
