import React from 'react';

/**
 * SkeletonLoader générique et réutilisable
 * Meilleur que Skeleton.jsx qui est spécifique aux cartes produits
 * * Types :
 * - 'text' : lignes de texte (paragraphes)
 * - 'title' : titre + lignes
 * - 'box' : boîte haute (ex: canvas, images)
 * - 'card' : carte complète (comme ProductCard)
 */
export const SkeletonLoader = ({ 
  lines = 3, 
  type = 'text',
  width = '100%',
}) => {
  const pulseStyle = {
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    animation: 'pulse 2s ease-in-out infinite',
  };

  if (type === 'box') {
    return (
      <div style={{
        ...pulseStyle,
        height: '200px',
        width,
        margin: '16px 0',
      }} />
    );
  }

  if (type === 'title') {
    return (
      <div>
        <div style={{
          ...pulseStyle,
          height: '28px',
          width: '60%',
          marginBottom: '16px',
        }} />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{
              ...pulseStyle,
              height: '16px',
              width: i === lines - 1 ? '80%' : '100%',
              margin: '8px 0',
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          ...pulseStyle,
          height: '220px',
          marginBottom: '16px',
        }} />
        <div style={{ padding: '16px' }}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              style={{
                ...pulseStyle,
                height: i === 0 ? '16px' : '12px',
                marginBottom: i < lines - 1 ? '8px' : '0',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Type par défaut : 'text'
  return (
    <div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            ...pulseStyle,
            height: '16px',
            width: i === lines - 1 ? '80%' : '100%',
            margin: '8px 0',
          }}
        />
      ))}
    </div>
  );
};