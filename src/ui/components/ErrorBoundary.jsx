import React from "react";
import { logger } from "../../engine/utils/logger";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // On initialise l'état d'erreur à faux
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Si une erreur survient dans un composant enfant, on met à jour l'état
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Ici, en production, on pourrait envoyer l'erreur à un service comme Sentry
    logger.error(
      "🛑 Erreur critique capturée par l'ErrorBoundary :",
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      // Interface de repli (Fallback UI) au lieu de l'écran blanc
      return (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <h2>Oups, une erreur technique est survenue. 🛠️</h2>
          <p>Notre moteur intelligent a rencontré un problème inattendu.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              marginTop: "20px",
              cursor: "pointer",
              background: "#007bff",
              color: "white",
              border: "none",
            }}
          >
            Recharger la page
          </button>
        </div>
      );
    }

    // Si tout va bien, on affiche l'application normalement
    return this.props.children;
  }
}
