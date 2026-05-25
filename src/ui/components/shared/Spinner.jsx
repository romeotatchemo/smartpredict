import React from 'react';

/**
 * Spinner réutilisable pour états de chargement
 * Utilisable avec différentes tailles et couleurs
 */
export const Spinner = ({ size = 'md', color = 'primary', label }) => {
  const sizeMap = {
    sm: { size: '20px', border: '2px' },
    md: { size: '32px', border: '3px' },
    lg: { size: '48px', border: '4px' },
  };

  const colorMap = {
    primary: '#00d4ff',
    success: '#2ed573',
    error: '#ff4757',
    white: 'white',
  };

  const { size: spinSize, border: borderWidth } = sizeMap[size];
  const spinColor = colorMap[color];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div
        style={{
          width: spinSize,
          height: spinSize,
          border: `${borderWidth} solid ${spinColor}33`,
          borderTop: `${borderWidth} solid ${spinColor}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {label && (
        <p style={{
          fontSize: '12px',
          color: '#666666',
          margin: 0,
          textAlign: 'center',
        }}>
          {label}
        </p>
      )}
    </div>
  );
};