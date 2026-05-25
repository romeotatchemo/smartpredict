/**
 * IndexedDB Initialization Wizard Component
 * Appears on first app load if database is empty or doesn't exist
 */
import React, { useState } from "react";
import { logger } from "../../../engine/utils/logger.js";
import indexedDBService from "../../utils/IndexedDBService";
import { generateDefaultProducts } from "../../../engine/data/generateDefaultProducts";

export const IndexedDBWizard = ({ onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleInitialize = async () => {
    setIsLoading(true);
    try {
      logger.info("[IndexedDBWizard] Initializing IndexedDB...");
      // Initialize database
      await indexedDBService.init();

      logger.info("[IndexedDBWizard] Loading default products...");
      // Generate and load default products
      const products = generateDefaultProducts();
      await indexedDBService.addProducts(products);

      logger.info(
        `[IndexedDBWizard] Successfully loaded ${products.length} products`,
      );
      // Dispatch event to notify that IndexedDB is ready
      window.dispatchEvent(new Event("IndexedDBReady"));

      setStep(2);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      logger.error("Failed to initialize database:", error);
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "50px",
          maxWidth: "500px",
          width: "90%",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
        }}
      >
        {step === 1 ? (
          <>
            <h1
              style={{
                color: "#1a1a2e",
                marginTop: "0",
                marginBottom: "20px",
                fontSize: "28px",
              }}
            >
              🚀 Bienvenue!
            </h1>

            <p
              style={{
                color: "#666",
                fontSize: "16px",
                marginBottom: "30px",
                lineHeight: "1.6",
              }}
            >
              La base de données produits n'existe pas encore. Nous devons
              initialiser IndexedDB et charger les données pour démarrer.
            </p>

            <div
              style={{
                backgroundColor: "#f0f7ff",
                border: "1px solid #d4e9ff",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "30px",
                fontSize: "14px",
                color: "#0651a0",
              }}
            >
              <p style={{ margin: "0 0 10px", fontWeight: "bold" }}>
                ℹ️ Ce qu'il va se passer:
              </p>
              <ul style={{ margin: "0", paddingLeft: "20px" }}>
                <li>Création de la base de données IndexedDB</li>
                <li>Chargement de 12 produits par défaut</li>
                <li>Configuration du système de panier</li>
              </ul>
            </div>

            <button
              onClick={handleInitialize}
              disabled={isLoading}
              style={{
                padding: "15px 40px",
                backgroundColor: isLoading ? "#ccc" : "#00d4ff",
                color: isLoading ? "#666" : "#1a1a2e",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
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
              {isLoading ? "⏳ Initialisation..." : "✨ Initialiser"}
            </button>
          </>
        ) : (
          <>
            <h1
              style={{
                color: "#51cf66",
                marginTop: "0",
                marginBottom: "20px",
                fontSize: "28px",
              }}
            >
              ✅ Succès!
            </h1>

            <p
              style={{
                color: "#666",
                fontSize: "16px",
                marginBottom: "20px",
              }}
            >
              La base de données a été initialisée avec succès!
            </p>

            <p
              style={{
                color: "#999",
                fontSize: "14px",
                marginBottom: "0",
              }}
            >
              L'application va se rafraîchir dans un instant...
            </p>
          </>
        )}
      </div>
    </div>
  );
};
