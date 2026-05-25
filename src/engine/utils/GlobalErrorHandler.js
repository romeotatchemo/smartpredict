/**
 * GlobalErrorHandler.js
 * 
 * Gestionnaires globaux window.onerror et window.onunhandledrejection
 * pour capturer les erreurs non gérées au niveau du navigateur.
 * 
 * À initialiser dans main.jsx avant de monter l'app React.
 * 
 * Complément de l'ErrorBoundary React qui, lui, capture les erreurs
 * lors du rendu des composants (render errors).
 */

import { logger } from './logger.js';

export function initGlobalErrorHandlers() {
  // Erreurs non gérées dans le code synchrone
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('🛑 Global Error:', {
      message,
      source,
      lineno,
      colno,
      stack: error?.stack
    });
    
    // Logger de manière centralisée
    logger.error(`Global Error: ${message}`, {
      file: source,
      line: lineno,
      col: colno,
      stack: error?.stack
    });
    
    // Retourner true pour éviter le message d'erreur par défaut du navigateur
    return true;
  };

  // Promesses rejetées non gérées
  window.onunhandledrejection = (event) => {
    console.error('🛑 Unhandled Promise Rejection:', event.reason);
    
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason?.toString(),
      stack: event.reason?.stack
    });
    
    // Empêcher la fermeture de la page (optionnel)
    // event.preventDefault();
  };

  console.log('✅ Gestionnaires globaux d\'erreur initialisés');
}
