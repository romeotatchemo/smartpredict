import './ProgressBar.css';

/**
 * ProgressBar - Composant réutilisable pour affichage du chargement de modèles ML
 * 
 * Trois variants:
 * - 'standard': progression animée (largeur qui augmente)
 * - 'indeterminate': animation en défilement (pour modèles avec peu de shards)
 * - 'error': couleur rouge, message d'erreur
 * 
 * @param {number} value - Valeur de progression (0-100)
 * @param {string} label - Texte affiché (ex: "Chargement du modèle churn")
 * @param {string} modelName - Identifiant du modèle (ex: 'churn')
 * @param {string} variant - 'standard' | 'indeterminate' | 'error'
 * @param {string} [bytesTransferred] - Optionnel: affiche "1.2 MB / 1.8 MB"
 */
export const ProgressBar = ({
  value = 0,
  label = 'Chargement...',
  modelName = 'model',
  variant = 'standard',
  bytesTransferred = null,
}) => {
  // Assurer que value est bien entre 0 et 100
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={`progress-bar-container`}
      role="progressbar"
      aria-live="polite"
      aria-valuenow={safeValue}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={`${label}: ${safeValue}%`}
    >
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-percent">{safeValue}%</span>
      </div>

      <div className="progress-track">
        {variant === 'indeterminate' ? (
          <div className="progress-bar progress-bar-indeterminate"></div>
        ) : (
          <div
            className={`progress-bar progress-bar-${variant}`}
            style={{ width: `${safeValue}%` }}
          ></div>
        )}
      </div>

      <div className="progress-info">
        <span className="progress-model-name">Modèle: {modelName}</span>
        {bytesTransferred && (
          <span className="progress-bytes">{bytesTransferred}</span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;