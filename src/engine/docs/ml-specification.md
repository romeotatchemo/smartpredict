# SmartPredict.js — Spécification ML

## Cas métier

**Prédiction du Churn Client (Contexte Télécom)**
Objectif : Détecter les clients à risque pour intervenir avant la résiliation.

## Variable Cible (Target Y)

- **Nom :** `Churn`
- **Type :** Classification Binaire
- **Valeurs :**
  - `0` : Client Actif (Retention)
  - `1` : Client Perdu (Churn)

## Variables d'entrée (Features X)

### 1. Profil Statique (Contexte)

- `tenure` (Ancienneté en mois)
- `contract_type` (Engagement)
- `monthly_charges` (Montant facture)

### 2. Comportement Dynamique (Signaux)

- `support_calls_count` (Friction)
- `payment_delay` (Incident)
- `usage_trend` (Variation d'usage sur la période)

## Fenêtre Temporelle

- **Période d'observation :** 30 derniers jours glissants.
- **Agrégation :** Moyenne ou Somme sur la période.
- **Objectif :** Capter l'évolution récente, pas l'historique lointain.

## Sortie du Modèle

- **Output :** Score de probabilité ∈ [0, 1]
- **Utilisation :** Ce score sera consommé par le moteur de règles (Thresholds).

> **RÈGLE D'OR :** Ce document fait autorité.
> Toute implémentation technique doit se conformer à cette structure.
