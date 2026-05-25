# 🧠 SmartPredict App v2.0

**Moteur de Prédiction de Churn Client** - Analyse comportementale temps réel avec ML.

> **Version 2.0** : Architecture frontend complète + Corrections de bugs critiques + Infrastructure de test

---

## 🚀 Démarrage Rapide

```bash
# Installation & lancement
npm install
npm run dev

# Ouvrir http://localhost:5173
```

---

## 📚 Documentation Principale

### 🎓 **Pour Apprendre les Changements v1 → v2**

Lire d'abord: [**CHANGELOG_V2.md**](./CHANGELOG_V2.md) — Évolution pédagogique complète

### 🧠 **Pour Entraîner le Modèle de Churn**

- **Frontend (Nouveau!)**: [TRAINING_GUIDE_FRONTEND.md](./TRAINING_GUIDE_FRONTEND.md)
- **Backend (Legacy)**: [TRAINING_GUIDE.md](./TRAINING_GUIDE.md)

### 🔧 **Pour Comprendre les Corrections**

Voir: [CORRECTIONS_SUMMARY.md](./CORRECTIONS_SUMMARY.md)

---

## ✨ Caractéristiques Principales

| Fonctionnalité               | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| 🤖 **ML en Temps Réel**      | Prédiction de churn basée sur des événements utilisateur |
| 🧮 **Entraînement Frontend** | Entraînez le modèle directement dans le navigateur       |
| 💾 **Stockage Local**        | IndexedDB pour persistance sans serveur                  |
| 📊 **Moteur Hybride**        | Décisions basées sur ML + règles métier                  |
| 🔍 **Debugging**             | Traçabilité complète des prédictions                     |

---

## 🏗️ Architecture

```
src/engine/
├── core/                 # Moteur principal
│   ├── SmartPredictEngine.js    ✨ (Inférence TensorFlow activée)
│   ├── DataPipeline.js
│   └── StreamManager.js
├── data/                 # Traitement données
│   ├── DataCleaner.js
│   ├── StorageManager.js        ✨ (prune() implémentée)
│   ├── EventNormalizer.js
│   └── tracker.js               ✨ (Bug target corrigé)
├── features/            # Features ML
│   ├── FeatureNormalizer.js     ✨ (Typo corrigée)
│   ├── CategoricalEncoder.js
│   └── TemporalExtractor.js
├── decision/            # Décisions métier
│   ├── HybridEngine.js
│   ├── ThresholdManager.js
│   └── ActionMapper.js
├── models/              # Modèles ML
│   └── ChurnModel.js
├── scripts/
│   └── trainAndSaveModel.js     ✨ (Frontend React)
└── tests/
    ├── smoke_test.js            ✨ (Nouveau)
    └── DecisionTest.js          ✨ (Nouveau)
```

✨ = Changement/Amélioration en v2

---

## 🆚 Changements Majeurs (v1 → v2)

### 1️⃣ **Entraînement: Node.js → Frontend React**

```diff
❌ AVANT: npm run train (Node.js)
✅ APRÈS: F12 → Console → trainAndSaveModel() (Browser)
```

| Aspect          | v1 (Node.js)              | v2 (Frontend)     |
| --------------- | ------------------------- | ----------------- |
| **Runtime**     | `npm run train`           | Console browser   |
| **Stockage**    | Fichiers `/public/model/` | IndexedDB         |
| **UI**          | Aucune                    | TrainingPanel.jsx |
| **Progression** | Logs console              | React state       |

### 2️⃣ **Bugs Critiques Corrigés**

| Bug                                     | Impact               | Statut        |
| --------------------------------------- | -------------------- | ------------- |
| tracker.js: variable `target` indéfinie | ❌ Erreur runtime    | ✅ Corrigé    |
| FeatureNormalizer: Typo classe          | ❌ Import failed     | ✅ Corrigé    |
| SmartPredictEngine: Inférence commentée | ❌ Aucune prédiction | ✅ Activé     |
| StorageManager.prune(): Vide            | ⚠️ Memory leak       | ✅ Implémenté |

Détails: [CORRECTIONS_SUMMARY.md](./CORRECTIONS_SUMMARY.md)

### 3️⃣ **Infrastructure de Test Améliorée**

```bash
npm run test:smoke      # Validation rapide
npm run test:decision   # Tests moteur décision
npm run train           # Entraînement complet
```

### 4️⃣ **Documentation Pédagogique**

- ✅ CHANGELOG détaillé (ce fichier)
- ✅ Guides étape-par-étape
- ✅ Exemples de code fonctionnels
- ✅ Troubleshooting complet

---

## 📖 Guides Pédagogiques

### Pour Débutants

1. Lire: [CHANGELOG_V2.md](./CHANGELOG_V2.md) (vue d'ensemble)
2. Lancer: `npm run dev`
3. Entraîner: [TRAINING_GUIDE_FRONTEND.md](./TRAINING_GUIDE_FRONTEND.md) (approche 1)

### Pour Développeurs

1. Étudier: Architecture dans [src/engine/]
2. Entraîner: [TRAINING_GUIDE_FRONTEND.md](./TRAINING_GUIDE_FRONTEND.md) (approche 2-3)
3. Corriger: [CORRECTIONS_SUMMARY.md](./CORRECTIONS_SUMMARY.md)
4. Tester: `npm run test:smoke`

### Pour Producteurs

1. Builder: `npm run build`
2. Vérifier: `npm run test:smoke`
3. Déployer: Vercel via `vercel.json`
4. Monitorer: SmartPredictEngine logs

---

## 🎯 Points Clés à Retenir

> **v2 = Frontend-first, Production-ready, Well-tested**

- ✅ Entraînement du modèle **sans Node.js**
- ✅ Stockage **persiste** dans IndexedDB
- ✅ **Tous les bugs critiques** corrigés
- ✅ Infrastructure de **test complète**
- ✅ Documentation **claire et pédagogique**

---

## 🔗 Ressources

| Ressource             | Lien                                                                         |
| --------------------- | ---------------------------------------------------------------------------- |
| Entraînement Frontend | [TRAINING_GUIDE_FRONTEND.md](./TRAINING_GUIDE_FRONTEND.md)                   |
| Résumé Corrections    | [CORRECTIONS_SUMMARY.md](./CORRECTIONS_SUMMARY.md)                           |
| Changelog Complet     | [CHANGELOG_V2.md](./CHANGELOG_V2.md)                                         |
| ML Specification      | [src/engine/docs/ml-specification.md](./src/engine/docs/ml-specification.md) |

---

## 💡 Questions Fréquentes

**Q: Où entraîner le modèle?**
R: Directement dans le navigateur! Console (F12) ou composant React. Voir [TRAINING_GUIDE_FRONTEND.md](./TRAINING_GUIDE_FRONTEND.md)

**Q: Le modèle persiste après reload?**
R: Oui! IndexedDB = stockage persistant. Aucun serveur nécessaire.

**Q: Quels bugs ont été corrigés?**
R: 5 bugs critiques. Détails: [CORRECTIONS_SUMMARY.md](./CORRECTIONS_SUMMARY.md)

**Q: Je dois faire `npm run train`?**
R: Non, c'est legacy (Node.js). Utilisez le frontend à la place!

---

**Version**: 2.0.0 | **Dernière mise à jour**: Mars 2026
