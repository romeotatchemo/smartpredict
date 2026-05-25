export const PREDICTION_TARGET = 'Churn';

/* Interprétation métier :
   - < 0.3 (30%)   → Client stable (Pas d'action)
   - 0.3 à 0.6     → Client à surveiller (Engagement léger)
   - > 0.6         → Client à risque (Intervention proactive)
*/
const DECISION_THRESHOLDS = {
  lowRisk: 0.3,
  mediumRisk: 0.6,
  highRisk: 0.8,
};

export const MODEL_PERFORMANCE_METRICS = {
  primary: 'recall',
  secondary: 'precision',
};

/* Ces métriques guideront :
   - La fonction de perte (Loss Function) pendant l'entraînement
   - L'arrêt automatique de l'entraînement (Early Stopping)
   - L'équilibre final du modèle
*/
export const PERFORMANCE_THRESHOLDS = {
  recall: 0.8,
  precision: 0.6,
};

/* RÈGLE CLÉ :
   Le modèle doit s'adapter à ces métriques,
   jamais l'inverse.
   Si le modèle n'atteint pas 0.8 de recall, il ne part pas en production.
*/
