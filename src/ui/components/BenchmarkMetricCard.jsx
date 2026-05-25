/**
 * BenchmarkMetricCard - Affichage d'une métrique unique
 * 
 * Props :
 * - label: nom de la métrique (ex: "Latence médiane")
 * - value: valeur à afficher
 * - unit: unité (ex: "ms", "MB")
 * - threshold: seuil de couleur (optionnel)
 * 
 * Couleur réactive :
 * - Vert si value < threshold.good
 * - Orange si threshold.good <= value < threshold.warning
 * - Rouge si value >= threshold.warning
 */

export const BenchmarkMetricCard = ({ 
  label, 
  value, 
  unit = '', 
  threshold = null 
}) => {
  // Déterminer la couleur selon les seuils
  let bgColor = '#f0f0f0'; // Gris par défaut
  let textColor = '#333';

  if (threshold) {
    if (value < threshold.good) {
      bgColor = '#d4edda'; // Vert clair
      textColor = '#155724'; // Vert foncé
    } else if (value < threshold.warning) {
      bgColor = '#fff3cd'; // Orange clair
      textColor = '#856404'; // Orange foncé
    } else {
      bgColor = '#f8d7da'; // Rouge clair
      textColor = '#721c24'; // Rouge foncé
    }
  }

  return (
    <div style={{
      backgroundColor: bgColor,
      padding: '20px',
      borderRadius: '8px',
      textAlign: 'center',
      borderLeft: `4px solid ${textColor}`,
    }}>
      <p style={{ 
        margin: 0, 
        color: '#666', 
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
      }}>
        {label}
      </p>
      <p style={{ 
        margin: '10px 0 0', 
        fontSize: '28px', 
        fontWeight: 'bold',
        color: textColor
      }}>
        {typeof value === 'number' ? value.toFixed(2) : value}
        <span style={{ fontSize: '14px', marginLeft: '4px' }}>{unit}</span>
      </p>
    </div>
  );
};