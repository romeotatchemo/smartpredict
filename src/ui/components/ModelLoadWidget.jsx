import ProgressBar from './shared/ProgressBar.jsx';
import { useModel } from '../hooks/useModel.js';

// Dans le rendu (exemple dans ModelLoadWidget.jsx):
export function ModelLoadWidget() {
  const { model, status, error, retry, progress } = useModel('churn');

  // CAS 1 : Chargement en cours
  if (status === 'loading') {
    // Déterminer le variant en fonction du progress
    // (pour le modèle churn: peu de shards, utiliser indeterminate)
    const variant = progress === 0 ? 'indeterminate' : 'standard';

    return (
      <div className="prediction-widget">
        <ProgressBar
          value={progress}
          label="Chargement du modèle de prédiction de churn..."
          modelName="churn"
          variant={variant}
        />
      </div>
    );
  }

  // CAS 2 : Erreur
  if (status === 'error') {
    return (
      <div className="prediction-widget error-state">
        <div className="error-message">
          <p>❌ Impossible de charger le modèle</p>
          <p className="error-details">{error}</p>
          <button onClick={retry} className="btn-retry">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // CAS 3 : Prêt (interface normale)
  if (status === 'ready' && model) {
    return (
      <div className="prediction-widget">
        {/* Rendu normal du composant */}
        <h2>Prédiction de Churn</h2>
        <p>Modèle prêt. Vous pouvez maintenant faire des prédictions.</p>
        {/* ... reste de l'interface ... */}
      </div>
    );
  }

  // CAS 4 : Idle (rare, mais possible)
  return <div className="prediction-widget">Initialisation...</div>;
}