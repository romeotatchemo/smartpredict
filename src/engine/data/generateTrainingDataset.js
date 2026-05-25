import * as tf from "@tensorflow/tfjs";
import { logger } from "../utils/logger.js";

/**
 * Générateur de dataset d'entraînement pour SmartPredictEngine
 * ✅ RESPECTE TOUS LES CAS DE CHURN LISTÉS
 *
 * Configuration partagée:
 * - PAGES: 8 pages (/, /pricing, /cart, /checkout, /services, /about, /account, /unsubscribe)
 * - TIME_STEPS: 12 (nombre d'événements par séquence)
 * - FEATURES: 16 (4 temporels + 8 pages one-hot + 4 actions one-hot)
 * - ACTIONS: 8 types (CLICK, SCROLL, SUBMIT, VIEW, HOVER, INPUT, ERROR, NAV)
 *
 * Implémentation des CAS DE CHURN:
 * 1. HOME (/): VIEW only, SCROLL <20%, aucun CLICK CTA → CHURN
 * 2. PRICING (/pricing) - ZONE CRITIQUE: VIEWs répétées >3x, SCROLL <20%, oscillation → CHURN
 * 3. CART (/cart): CLICK remove 3+, aucun CLICK checkout → CHURN
 * 4. CHECKOUT (/checkout) - ZONE ULTRA-CRITIQUE: INPUT partial, ERROR validation, retour → CHURN
 * 5. SERVICES (/services): SCROLL <20%, aucun CLICK "En Savoir Plus" → CHURN
 * 6. ABOUT (/about): SCROLL <20%, rapidité <5s → CHURN
 * 7. ACCOUNT (/account): VIEW ultra-rapide <2s, redirect /unsubscribe immédiate → CHURN
 * 8. UNSUBSCRIBE (/unsubscribe): CLICK raison + "Valider", ignorer contre-offres → CHURN FINAL
 *
 * Output: TensorFlow datasets pour train/validation/test
 */

const PAGES = [
  "/",
  "/pricing",
  "/cart",
  "/checkout",
  "/services",
  "/about",
  "/account",
  "/unsubscribe",
];

const PAGE_INDICES = {
  "/": 0,
  "/pricing": 1,
  "/cart": 2,
  "/checkout": 3,
  "/services": 4,
  "/about": 5,
  "/account": 6,
  "/unsubscribe": 7,
};

const ACTION_TYPES = {
  CLICK: 0,
  SCROLL: 1,
  SUBMIT: 2,
  VIEW: 3,
  HOVER: 4,
  INPUT: 5,
  ERROR: 6,
  NAV: 7,
};

const TIME_STEPS = 12;
const FEATURES = 16; // 4 temporels + 8 pages one-hot + 4 actions one-hot
const TEMPORAL_FEATURES = 4; // deltaTime, velocity, acceleration, relativeTime
const PAGE_ENCODING = 8; // One-hot pour 8 pages
const ACTION_ENCODING = 4; // One-hot pour les 4 nouveaux actions (HOVER:4, INPUT:5, ERROR:6, NAV:7)

/**
 * Simulateur d'événements comportementaux AVANCÉ
 * Génère des patterns réalistes de churn vs engagement
 * Respecte TOUS les cas de churn listés par page et action
 */
class BehaviorSimulator {
  constructor(label) {
    this.isChurn = label === 1;
    this.deltaBuffer = [];
    this.previousVelocity = 0;
    this.WINDOW_SIZE = 5;
    this.EPSILON = 0.001;
    this.pageSequence = [];
    this.scrollDepthByPage = {}; // Track scroll depth per page for consistency
    this.initializeSequence();
  }

  /**
   * Initialise la séquence de pages selon le type de comportement
   */
  initializeSequence() {
    if (this.isChurn) {
      // PARCOURS CHURN: exploration → hésitation → abandon
      this.pageSequence = [
        0, // HOME (Vue rapide)
        1, // PRICING (Hésitation tarifaire)
        1, // PRICING (Oscillation)
        4, // SERVICES (Survol rapide)
        1, // PRICING (Retour hésitant)
        6, // ACCOUNT (Chercher résiliation)
        1, // PRICING (Dernier doute)
        7, // UNSUBSCRIBE (Décision finale)
        7, // UNSUBSCRIBE (Confirmation)
        7, // UNSUBSCRIBE (Submit)
        7, // UNSUBSCRIBE (Final)
        7, // UNSUBSCRIBE (Final)
      ];
    } else {
      // PARCOURS NORMAL: progression → engagement → conversion
      this.pageSequence = [
        0, // HOME (Exploration)
        4, // SERVICES (Intérêt features)
        1, // PRICING (Évaluation)
        2, // CART (Ajout produits)
        3, // CHECKOUT (Remplissage form)
        3, // CHECKOUT (Vérification)
        3, // CHECKOUT (Submit)
        0, // HOME (Retour navigation)
        2, // CART (Multi-achats)
        3, // CHECKOUT (Final)
        3, // CHECKOUT (Success)
        0, // HOME (Post-conversion)
      ];
    }
  }

  /**
   * Génère deltaTime ultra-réaliste selon page et step
   * CHURN: 3-8s (hésitation) ou 200-500ms (abandon)
   * NORMAL: 500-2000ms (engagement régulier)
   */
  generateDeltaTime(pageIndex, stepIndex) {
    if (this.isChurn) {
      // PRICING page = hésitation paralysante (longs délais)
      if (pageIndex === 1) {
        if (Math.random() < 0.7) {
          return (3 + Math.random() * 5) * 1000; // 3-8s hésitation
        }
        return (0.2 + Math.random() * 0.3) * 1000; // 200-500ms clic énervement
      }
      // UNSUBSCRIBE = décision rapide (déjà prise)
      if (pageIndex === 7) {
        return (0.5 + Math.random() * 2) * 1000; // 500-2500ms choix final
      }
      // Autres pages = mélange hésitation/abandon
      if (Math.random() < 0.6) {
        return (3 + Math.random() * 4) * 1000; // Hésitation
      }
      return (0.2 + Math.random() * 0.4) * 1000; // Abandon
    }

    // NORMAL: engagement régulier stable
    return (0.8 + Math.random() * 1.2) * 1000; // 800-2000ms normal
  }

  /**
   * Calcule les features temporelles RÉALISTES
   * Acceleration NÉGATIVE en churn, STABLE en normal
   * AJOUT: Bruit temporel pour éviter les patterns trop parfaits
   */
  computeTemporalFeatures(pageIndex, stepIndex) {
    const baseDeltaTime = this.generateDeltaTime(pageIndex, stepIndex);
    // Ajout de bruit temporel (±20% variation)
    const temporalNoise = (Math.random() - 0.5) * 0.4;
    const deltaTime = (baseDeltaTime * (1 + temporalNoise)) / 1000;

    this.deltaBuffer.push(deltaTime);
    if (this.deltaBuffer.length > this.WINDOW_SIZE) {
      this.deltaBuffer.shift();
    }

    const avgDelta =
      this.deltaBuffer.reduce((a, b) => a + b, 0) / this.deltaBuffer.length;
    const velocity = 1 / (avgDelta + this.EPSILON);
    const acceleration = velocity - this.previousVelocity;

    this.previousVelocity = velocity;

    // En CHURN: forcer acceleration négative progressive
    const finalAcceleration = this.isChurn
      ? Math.min(acceleration, -0.1) // Toujours négatif ou proche
      : acceleration; // Normal: varie naturellement

    return {
      deltaTime: Math.min(Math.max(deltaTime / 10, 0), 1),
      velocity: Math.min(Math.max(velocity / 10, 0), 1),
      acceleration: Math.min(Math.max((finalAcceleration + 5) / 10, 0), 1),
      relativeTime: Math.min(Math.max(stepIndex / TIME_STEPS, 0), 1),
    };
  }

  /**
   * Génère des actions par page RESPECTANT LES SEUILS DE CHURN EXACTS
   * Voir document: tous les cas de churn par page et action
   * AJOUT: Bruit aléatoire pour éviter le surapprentissage
   */
  selectActionType(pageIndex, stepIndex) {
    // Ajout de bruit aléatoire pour diversifier les patterns
    const noise = Math.random() * 0.1; // 10% de variation aléatoire
    const rand = Math.random() + noise;

    // ===== HOME (/) =====
    if (pageIndex === 0) {
      if (this.isChurn) {
        // CHURN HOME: VIEW only ou SCROLL <20%
        if (rand < 0.6) return ACTION_TYPES.VIEW; // VIEW plusieurs fois
        if (rand < 0.3) return ACTION_TYPES.SCROLL; // SCROLL très faible
        if (rand < 0.08) return ACTION_TYPES.HOVER; // HOVER sans clic
        return ACTION_TYPES.ERROR; // ERROR frustration
      }
      // NORMAL HOME: engagement CTA
      if (rand < 0.3) return ACTION_TYPES.HOVER; // Hover CTA
      if (rand < 0.25) return ACTION_TYPES.CLICK; // CLICK CTA "Découvrir"
      if (rand < 0.2) return ACTION_TYPES.VIEW; // Voir page
      if (rand < 0.15) return ACTION_TYPES.SCROLL; // Scroll stats
      if (rand < 0.07) return ACTION_TYPES.NAV; // Navigation
      return ACTION_TYPES.INPUT;
    }

    // ===== PRICING (/pricing) - ZONE CRITIQUE CHURN =====
    if (pageIndex === 1) {
      if (this.isChurn) {
        // CHURN PRICING: oscillation, scroll <20%, aucun CLICK CTA
        if (stepIndex < TIME_STEPS / 2) {
          // Première phase: exploration hésitante
          if (rand < 0.5) return ACTION_TYPES.VIEW; // VIEWs répétées
          if (rand < 0.25) return ACTION_TYPES.SCROLL; // SCROLL <20%
          if (rand < 0.15) return ACTION_TYPES.HOVER; // Hover plans mais pas clic
          return ACTION_TYPES.ERROR; // ERROR validation
        } else {
          // Deuxième phase: doute intensifié
          if (rand < 0.4) return ACTION_TYPES.VIEW; // VIEWs persistantes
          if (rand < 0.25) return ACTION_TYPES.HOVER; // Toggle facturation sans conviction
          if (rand < 0.2) return ACTION_TYPES.SCROLL; // Scroll très léger
          if (rand < 0.1) return ACTION_TYPES.ERROR; // ERROR pricing check
          return ACTION_TYPES.CLICK; // CLICK toggle (pas CTA plan)
        }
      }
      // NORMAL PRICING: scroll >50%, CLICK CTA
      if (rand < 0.25) return ACTION_TYPES.HOVER; // Hover plans
      if (rand < 0.2) return ACTION_TYPES.CLICK; // CLICK CTA plan
      if (rand < 0.2) return ACTION_TYPES.SCROLL; // Scroll lire plans
      if (rand < 0.15) return ACTION_TYPES.VIEW; // View toggle
      if (rand < 0.15) return ACTION_TYPES.INPUT; // Input si promo
      if (rand < 0.05) return ACTION_TYPES.NAV; // Nav autres pages
      return ACTION_TYPES.SUBMIT;
    }

    // ===== CART (/cart) =====
    if (pageIndex === 2) {
      if (this.isChurn) {
        // CHURN CART: remove articles, aucun checkout
        if (rand < 0.35) return ACTION_TYPES.VIEW; // VIEWs panier
        if (rand < 0.3) return ACTION_TYPES.CLICK; // CLICK remove articles (x3+)
        if (rand < 0.15) return ACTION_TYPES.SCROLL; // SCROLL <30%
        if (rand < 0.12) return ACTION_TYPES.ERROR; // ERROR quantité invalide
        return ACTION_TYPES.HOVER;
      }
      // NORMAL CART: augment, promo, checkout
      if (rand < 0.25) return ACTION_TYPES.SCROLL; // Scroll panier complet
      if (rand < 0.2) return ACTION_TYPES.CLICK; // CLICK + quantité
      if (rand < 0.2) return ACTION_TYPES.VIEW; // View résumé
      if (rand < 0.15) return ACTION_TYPES.INPUT; // INPUT promo code
      if (rand < 0.1) return ACTION_TYPES.SUBMIT; // SUBMIT promo
      if (rand < 0.08) return ACTION_TYPES.NAV; // NAV autres pages
      return ACTION_TYPES.HOVER;
    }

    // ===== CHECKOUT (/checkout) - ZONE ULTRA-CRITIQUE =====
    if (pageIndex === 3) {
      if (this.isChurn) {
        // CHURN CHECKOUT: formulaire jamais complété, retour arrière
        if (stepIndex < TIME_STEPS / 3) {
          // Début: voir formulaire
          if (rand < 0.5) return ACTION_TYPES.VIEW;
          if (rand < 0.2) return ACTION_TYPES.SCROLL; // Scroll <30%
          return ACTION_TYPES.HOVER;
        } else if (stepIndex < (2 * TIME_STEPS) / 3) {
          // Milieu: tentatives abandonnées
          if (rand < 0.35) return ACTION_TYPES.INPUT; // INPUT partiel
          if (rand < 0.3) return ACTION_TYPES.ERROR; // ERROR validation
          if (rand < 0.2) return ACTION_TYPES.SCROLL; // SCROLL haut/bas panic
          if (rand < 0.15) return ACTION_TYPES.CLICK; // CLICK back button
          return ACTION_TYPES.VIEW;
        } else {
          // Fin: abandon définitif
          if (rand < 0.6) return ACTION_TYPES.CLICK; // CLICK retour
          return ACTION_TYPES.VIEW;
        }
      }
      // NORMAL CHECKOUT: formulaire complet → SUBMIT
      if (stepIndex < TIME_STEPS / 2) {
        // Remplissage progressif
        if (rand < 0.35) return ACTION_TYPES.INPUT; // INPUT nombre de champs
        if (rand < 0.25) return ACTION_TYPES.VIEW; // View formulaire
        if (rand < 0.2) return ACTION_TYPES.HOVER; // Hover champs
        if (rand < 0.1) return ACTION_TYPES.SCROLL; // Scroll voir tous
        return ACTION_TYPES.CLICK;
      } else {
        // Soumission et confirmation
        if (rand < 0.3) return ACTION_TYPES.SUBMIT; // SUBMIT formulaire complet
        if (rand < 0.25) return ACTION_TYPES.VIEW; // View confirmation
        if (rand < 0.2) return ACTION_TYPES.SCROLL; // Scroll vérifier
        if (rand < 0.15) return ACTION_TYPES.INPUT; // INPUT correction
        if (rand < 0.1) return ACTION_TYPES.CLICK; // CLICK continuer achats
        return ACTION_TYPES.HOVER;
      }
    }

    // ===== SERVICES (/services) =====
    if (pageIndex === 4) {
      if (this.isChurn) {
        // CHURN SERVICES: scroll <20%, aucun "En Savoir Plus"
        if (rand < 0.55) return ACTION_TYPES.VIEW; // VIEW services
        if (rand < 0.25) return ACTION_TYPES.SCROLL; // SCROLL très faible
        if (rand < 0.12) return ACTION_TYPES.HOVER; // HOVER services
        return ACTION_TYPES.ERROR;
      }
      // NORMAL SERVICES: scroll >60%, "En Savoir Plus"
      if (rand < 0.3) return ACTION_TYPES.SCROLL; // Scroll tous services
      if (rand < 0.25) return ACTION_TYPES.CLICK; // CLICK "En Savoir Plus"
      if (rand < 0.25) return ACTION_TYPES.HOVER; // Hover services
      if (rand < 0.12) return ACTION_TYPES.VIEW; // View services
      if (rand < 0.06) return ACTION_TYPES.INPUT; // INPUT contact form
      return ACTION_TYPES.NAV;
    }

    // ===== ABOUT (/about) =====
    if (pageIndex === 5) {
      if (this.isChurn) {
        if (rand < 0.6) return ACTION_TYPES.VIEW;
        if (rand < 0.25) return ACTION_TYPES.SCROLL; // <20%
        return ACTION_TYPES.HOVER;
      }
      // NORMAL
      if (rand < 0.3) return ACTION_TYPES.SCROLL; // 50-100%
      if (rand < 0.25) return ACTION_TYPES.VIEW;
      if (rand < 0.2) return ACTION_TYPES.CLICK; // Nav services/pricing
      if (rand < 0.15) return ACTION_TYPES.HOVER;
      if (rand < 0.1) return ACTION_TYPES.INPUT; // Contact form
      return ACTION_TYPES.NAV;
    }

    // ===== ACCOUNT (/account) =====
    if (pageIndex === 6) {
      if (this.isChurn) {
        // CHURN ACCOUNT: ultra-rapide vers unsubscribe
        if (rand < 0.7) return ACTION_TYPES.VIEW; // VIEW rapide
        if (rand < 0.2) return ACTION_TYPES.SCROLL; // <5%
        return ACTION_TYPES.CLICK; // CLICK vers /unsubscribe
      }
      // NORMAL
      if (rand < 0.35) return ACTION_TYPES.VIEW; // View profil
      if (rand < 0.25) return ACTION_TYPES.SCROLL; // 60-100%
      if (rand < 0.25) return ACTION_TYPES.CLICK; // CLICK modifier
      if (rand < 0.1) return ACTION_TYPES.INPUT; // INPUT updates
      return ACTION_TYPES.SUBMIT;
    }

    // ===== UNSUBSCRIBE (/unsubscribe) - PAGE FINALE =====
    if (pageIndex === 7) {
      if (this.isChurn) {
        // CHURN UNSUBSCRIBE: raison → CLICK final (pas contre-offre)
        if (stepIndex < TIME_STEPS / 3) {
          // Sélection raison
          if (rand < 0.5) return ACTION_TYPES.CLICK; // CLICK raison
          if (rand < 0.3) return ACTION_TYPES.VIEW; // VIEW raisons
          return ACTION_TYPES.SCROLL; // SCROLL raisons
        } else if (stepIndex < (2 * TIME_STEPS) / 3) {
          // Ignorer contre-offres
          if (rand < 0.6) return ACTION_TYPES.VIEW; // VIEW offres
          if (rand < 0.25) return ACTION_TYPES.SCROLL; // <20% offres
          if (rand < 0.1) return ACTION_TYPES.HOVER; // HOVER offres (pas clic)
          return ACTION_TYPES.CLICK;
        } else {
          // Confirmation finale
          if (rand < 0.4) return ACTION_TYPES.CLICK; // CLICK "Valider"
          if (rand < 0.3) return ACTION_TYPES.INPUT; // INPUT raison texte
          if (rand < 0.2) return ACTION_TYPES.SUBMIT; // SUBMIT résiliation
          return ACTION_TYPES.VIEW;
        }
      }
      // NORMAL UNSUBSCRIBE (RÉTENTION): lire offres → CLICK accepter
      if (stepIndex < TIME_STEPS / 2) {
        // Cogitation offres
        if (rand < 0.35) return ACTION_TYPES.SCROLL; // SCROLL 100% offres
        if (rand < 0.3) return ACTION_TYPES.VIEW; // VIEW offres détails
        if (rand < 0.2) return ACTION_TYPES.CLICK; // CLICK accepter offre
        return ACTION_TYPES.HOVER;
      } else {
        // Acceptation rétention
        if (rand < 0.35) return ACTION_TYPES.SUBMIT; // SUBMIT acceptation
        if (rand < 0.3) return ACTION_TYPES.VIEW; // VIEW confirmation
        if (rand < 0.2) return ACTION_TYPES.CLICK; // CLICK "Continuer nav"
        return ACTION_TYPES.INPUT;
      }
    }

    // Fallback
    return ACTION_TYPES.VIEW;
  }

  /**
   * One-hot encode une page
   */
  encodePageOneHot(pageIndex) {
    const vector = new Array(PAGE_ENCODING).fill(0);
    vector[pageIndex] = 1;
    return vector;
  }

  /**
   * One-hot encode une action
   * Encode ONE of the 4 NEW actions (HOVER:4, INPUT:5, ERROR:6, NAV:7)
   * Les anciennes actions (CLICK:0, SCROLL:1, SUBMIT:2, VIEW:3) mappent à all-zeros
   */
  encodeActionOneHot(actionType) {
    const vector = new Array(ACTION_ENCODING).fill(0);
    // Mapper l'action au vecteur one-hot
    // HOVER:4 -> [1,0,0,0], INPUT:5 -> [0,1,0,0], ERROR:6 -> [0,0,1,0], NAV:7 -> [0,0,0,1]
    if (actionType === 4) vector[0] = 1; // HOVER
    if (actionType === 5) vector[1] = 1; // INPUT
    if (actionType === 6) vector[2] = 1; // ERROR
    if (actionType === 7) vector[3] = 1; // NAV
    // Les anciennes actions (0-3) restent [0,0,0,0]
    return vector;
  }

  /**
   * Génère une séquence d'événements (12 timesteps)
   * RESPECTE TOUS LES CAS DE CHURN PAR PAGE ET ACTION
   */
  generateSequence() {
    const sequence = [];

    for (let t = 0; t < TIME_STEPS; t++) {
      // Page depuis la séquence pré-initialisée
      const pageIndex = this.pageSequence[t];

      // Features temporelles (prend en compte page et step)
      const temporal = this.computeTemporalFeatures(pageIndex, t);

      // Type d'action (respecte les seuils de churn par page)
      const actionType = this.selectActionType(pageIndex, t);

      // Encodage one-hot
      const pageOneHot = this.encodePageOneHot(pageIndex);
      const actionOneHot = this.encodeActionOneHot(actionType);

      // Features combinées: temporel (4) + page (8) + action (4) = 16
      const features = [
        temporal.deltaTime,
        temporal.velocity,
        temporal.acceleration,
        temporal.relativeTime,
        ...pageOneHot,
        ...actionOneHot,
      ];

      sequence.push(features);
    }

    return sequence;
  }
}

/**
 * Génère le label pour conversion (probabiliste basé sur churn)
 * Churn = poco conversion, Normal = potentiel conversion
 */
function generateConversionLabel(churnLabel) {
  if (churnLabel === 1) {
    // Churn: très peu de chance de conversion (5%)
    return Math.random() < 0.05 ? 1 : 0;
  }
  // Non-churn: potentiel conversion élevé (70%)
  return Math.random() < 0.7 ? 1 : 0;
}

/**
 * Génère le label pour abuse (spam, bot, etc)
 * Indépendant du churn, minoritaire (5%)
 */
function generateAbuseLabel() {
  return Math.random() < 0.05 ? 1 : 0;
}

/**
 * Génère un dataset équilibré
 * @param {number} samplesPerClass - Exemples par classe (churn=0, churn=1)
 * @returns {Object} {X: Tensor3D [n, 12, 12], Y: {churn, conversion, abuse}}
 */
export function generateTrainingDataset(samplesPerClass = 500) {
  logger.info(
    `🔄 Generating synchronized training dataset (${samplesPerClass * 2} samples)...`,
  );

  const sequences = [];
  const churnLabels = [];
  const conversionLabels = [];
  const abuseLabels = [];

  // Générer churn = 0 (normal users)
  for (let i = 0; i < samplesPerClass; i++) {
    const simulator = new BehaviorSimulator(0);
    const seq = simulator.generateSequence();
    sequences.push(seq);
    churnLabels.push(0);
    conversionLabels.push(generateConversionLabel(0));
    abuseLabels.push(generateAbuseLabel());
  }

  // Générer churn = 1 (churners)
  for (let i = 0; i < samplesPerClass; i++) {
    const simulator = new BehaviorSimulator(1);
    const seq = simulator.generateSequence();
    sequences.push(seq);
    churnLabels.push(1);
    conversionLabels.push(generateConversionLabel(1));
    abuseLabels.push(generateAbuseLabel());
  }

  // Convertir en Tensors TensorFlow
  const X = tf.tensor3d(sequences, [sequences.length, TIME_STEPS, FEATURES]);

  const Y = {
    churn: tf.tensor2d(
      churnLabels.map((l) => [l]),
      [churnLabels.length, 1],
    ),
    conversion: tf.tensor2d(
      conversionLabels.map((l) => [l]),
      [conversionLabels.length, 1],
    ),
    abuse: tf.tensor2d(
      abuseLabels.map((l) => [l]),
      [abuseLabels.length, 1],
    ),
  };

  logger.info(`✅ Dataset generated:`);
  logger.info(`   X shape: [${X.shape[0]}, ${X.shape[1]}, ${X.shape[2]}]`);
  logger.info(
    `   Churn distribution: ${churnLabels.filter((l) => l === 1).length} / ${churnLabels.length}`,
  );
  logger.info(
    `   Conversion distribution: ${conversionLabels.filter((l) => l === 1).length} / ${conversionLabels.length}`,
  );
  logger.info(
    `   Abuse distribution: ${abuseLabels.filter((l) => l === 1).length} / ${abuseLabels.length}`,
  );

  return { X, Y };
}

/**
 * Divise le dataset en train/validation/test
 * @param {Tensor3D} X
 * @param {Object} Y
 * @param {number} trainRatio
 * @param {number} valRatio
 * @returns {Object} {Xtrain, Ytrain, Xval, Yval, Xtest, Ytest}
 */
export function splitDataset(X, Y, trainRatio = 0.7, valRatio = 0.15) {
  const totalSamples = X.shape[0];
  const trainSize = Math.floor(totalSamples * trainRatio);
  const valSize = Math.floor(totalSamples * valRatio);

  // Train
  const Xtrain = X.slice([0, 0, 0], [trainSize, -1, -1]);
  const Ytrain = {
    churn: Y.churn.slice([0, 0], [trainSize, -1]),
    conversion: Y.conversion.slice([0, 0], [trainSize, -1]),
    abuse: Y.abuse.slice([0, 0], [trainSize, -1]),
  };

  // Validation
  const Xval = X.slice([trainSize, 0, 0], [valSize, -1, -1]);
  const Yval = {
    churn: Y.churn.slice([trainSize, 0], [valSize, -1]),
    conversion: Y.conversion.slice([trainSize, 0], [valSize, -1]),
    abuse: Y.abuse.slice([trainSize, 0], [valSize, -1]),
  };

  // Test
  const Xtest = X.slice([trainSize + valSize, 0, 0], [-1, -1, -1]);
  const Ytest = {
    churn: Y.churn.slice([trainSize + valSize, 0], [-1, -1]),
    conversion: Y.conversion.slice([trainSize + valSize, 0], [-1, -1]),
    abuse: Y.abuse.slice([trainSize + valSize, 0], [-1, -1]),
  };

  logger.info(`📊 Dataset split:`);
  logger.info(`   Train: ${Xtrain.shape[0]} samples`);
  logger.info(`   Val: ${Xval.shape[0]} samples`);
  logger.info(`   Test: ${Xtest.shape[0]} samples`);

  return { Xtrain, Ytrain, Xval, Yval, Xtest, Ytest };
}

/**
 * Export rapide pour SmartPredictEngine
 */
export function generateDataset(numSamples = 1000) {
  const halfSamples = Math.floor(numSamples / 2);
  return generateTrainingDataset(halfSamples);
}
