import React, { useState, useEffect } from 'react';

export const UpdateToast = () => {
  const [message, setMessage] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [modelVersion, setModelVersion] = useState(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Écouter la détection d'une mise à jour
    const handleUpdateDetected = (event) => {
      const changedModels = event.detail?.changedModels || [];
      if (changedModels.length > 0) {
        const modelId = changedModels[0].modelId;
        const newVersion = changedModels[0].to;
        
        setMessage(`🔄 Mise à jour en cours — ${modelId} v${newVersion}`);
        setModelVersion(newVersion);
        setIsError(false);
        setIsVisible(true);
      }
    };

    // Écouter la fin de la mise à jour
    const handleUpdateComplete = (event) => {
      const changedModels = event.detail?.changedModels || [];
      if (changedModels.length > 0) {
        const modelId = changedModels[0].modelId;
        const newVersion = changedModels[0].to;
        
        setMessage(`✅ Mise à jour effectuée — ${modelId} v${newVersion} actif`);
        setModelVersion(newVersion);
        setIsError(false);
        setIsVisible(true);

        // Disparaître après 4 secondes
        const timer = setTimeout(() => setIsVisible(false), 4000);
        return () => clearTimeout(timer);
      }
    };

    // Écouter les erreurs de mise à jour
    const handleUpdateError = (event) => {
      const error = event.detail?.error || 'Erreur de mise à jour';
      const fallbackVersion = event.detail?.fallbackVersion;
      
      setMessage(`⚠️  ${error}${fallbackVersion ? ` — fallback v${fallbackVersion}` : ''}`);
      setIsError(true);
      setIsVisible(true);

      // Disparaître après 6 secondes
      const timer = setTimeout(() => setIsVisible(false), 6000);
      return () => clearTimeout(timer);
    };

    document.addEventListener('model-update-detected', handleUpdateDetected);
    document.addEventListener('model-update-complete', handleUpdateComplete);
    document.addEventListener('model-update-error', handleUpdateError);

    return () => {
      document.removeEventListener('model-update-detected', handleUpdateDetected);
      document.removeEventListener('model-update-complete', handleUpdateComplete);
      document.removeEventListener('model-update-error', handleUpdateError);
    };
  }, []);

  if (!isVisible || !message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: isError ? '#ff6b6b' : '#2d9cdb',
        color: 'white',
        padding: '14px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        fontSize: '13px',
        fontWeight: '500',
        maxWidth: '300px',
        animation: 'slideIn 0.3s ease-out',
        zIndex: 1000,
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      {message}
    </div>
  );
};