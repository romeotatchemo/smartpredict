import * as tf from "@tensorflow/tfjs";

// Correspond au pipeline réel
const TIME_STEPS = 12; // 12 événements par séquence
const TEMPORAL_FEATURES = 4; // deltaTime, velocity, acceleration, relativeTime
const PAGE_ENCODING = 8; // 8 pages principales oneHot encodées
const ACTION_FEATURES = 4; // CLICK, SCROLL, SUBMIT, VIEW oneHot

// Types d'actions réelles du pipeline
const ACTION_TYPES = {
  CLICK: 0,
  SCROLL: 1,
  SUBMIT: 2,
  VIEW: 3,
};

const PAGES = {
  HOME: 0,
  PRICING: 1,
  CART: 2,
  CHECKOUT: 3,
  SERVICES: 4,
  ABOUT: 5,
  ACCOUNT: 6,
  UNSUBSCRIBE: 7,
};

const PAGE_ROUTES = [
  "/",
  "/pricing",
  "/cart",
  "/checkout",
  "/services",
  "/about",
  "/account",
  "/unsubscribe",
];

/**
 * Simule le TemporalExtractor du pipeline réel
 */
class TemporalSequenceGenerator {
  constructor(isChurn = false) {
    this.isChurn = isChurn;
    this.deltaBuffer = [];
    this.previousVelocity = 0;
    this.WINDOW_SIZE = 15;
    this.EPSILON = 0.001;
  }

  /**
   * Génère un deltaTime réaliste
   * Churn: deltaTime longs (hesitation) ou courts (rapide)
   * Normal: deltaTime réguliers et engagés
   */
  generateDeltaTime() {
    if (this.isChurn) {
      // Comportement du churn: très hésitant (longs délais) ou très rapide (abandon)
      return Math.random() < 0.5
        ? 3000 + Math.random() * 5000 // Hesitation: 3-8 secondes
        : 200 + Math.random() * 300; // Abandon: clic rapide
    }
    // Comportement normal: engagement régulier (500-2000ms)
    return 500 + Math.random() * 1500;
  }

  /**
   * Simule le calcul de velocity du TemporalExtractor
   */
  process() {
    const deltaTime = this.generateDeltaTime() / 1000; // Convertir en secondes

    this.deltaBuffer.push(deltaTime);
    if (this.deltaBuffer.length > this.WINDOW_SIZE) {
      this.deltaBuffer.shift();
    }

    const avgDelta =
      this.deltaBuffer.reduce((a, b) => a + b, 0) / this.deltaBuffer.length;
    const velocity = 1 / (avgDelta + this.EPSILON);
    const acceleration = velocity - this.previousVelocity;

    const relativeTime = this.deltaBuffer.reduce((a, b) => a + b, 0);

    this.previousVelocity = velocity;

    return {
      deltaTime: Math.min(deltaTime, 1), // Normaliser [0,1]
      velocity: Math.min(velocity, 10), // Cap à 10
      acceleration: Math.max(-5, Math.min(acceleration, 5)), // Limiter [-5,5]
      relativeTime: Math.min(relativeTime, 30) / 30, // Normaliser [0,1]
    };
  }
}

/**
 * Génère une page selon le scénario
 */
function generatePage(t, isChurn) {
  if (isChurn) {
    // Pattern de churn: oscillation pricing + unsubscribe
    const churnStart = TIME_STEPS / 2;
    if (t < churnStart) {
      // Première moitié: exploration hésitante
      return Math.floor(Math.random() * 6); // HOME, PRICING, CART, CHECKOUT, SERVICES, ABOUT
    }
    // Deuxième moitié: intérêt pour pricing/désabonnement
    return Math.random() < 0.4 ? PAGES.PRICING : PAGES.UNSUBSCRIBE;
  }

  // Pattern normal: parcours engagé
  const sequence = [
    PAGES.HOME,
    PAGES.SERVICES,
    PAGES.PRICING,
    PAGES.CART,
    PAGES.CHECKOUT,
  ];
  return sequence[t % sequence.length];
}

/**
 * Génère un type d'action selon le contexte
 */
function generateActionType(t, page, isChurn) {
  if (isChurn) {
    // Churn: beaucoup de VIEWs (lecture passive), peu de SUBMITs/CLICKs engagés
    if (page === PAGES.PRICING && t > TIME_STEPS / 2) {
      // Hésitation sur pricing
      return Math.random() < 0.6 ? ACTION_TYPES.VIEW : ACTION_TYPES.SCROLL;
    }
    if (page === PAGES.UNSUBSCRIBE) {
      // Momentum vers désabonnement
      return Math.random() < 0.5 ? ACTION_TYPES.CLICK : ACTION_TYPES.VIEW;
    }
    return Math.random() < 0.5 ? ACTION_TYPES.SCROLL : ACTION_TYPES.VIEW;
  }

  // Normal: mix engagé d'actions
  const rand = Math.random();
  if (rand < 0.4) return ACTION_TYPES.CLICK; // Beaucoup de clics engagés
  if (rand < 0.65) return ACTION_TYPES.VIEW; // Exploration
  if (rand < 0.85) return ACTION_TYPES.SCROLL; // Lecture du contenu
  return ACTION_TYPES.SUBMIT; // Conversion (formulaires)
}

/**
 * One-hot encode une page
 */
function encodePageOneHot(pageIndex) {
  return Array.from({ length: 8 }, (_, i) => (i === pageIndex ? 1 : 0));
}

/**
 * One-hot encode une action
 */
function encodeActionOneHot(actionIndex) {
  return Array.from({ length: 4 }, (_, i) => (i === actionIndex ? 1 : 0));
}

/**
 * Génère une séquence d'événements réaliste
 */
function generateSequence(isChurn) {
  const sequence = [];
  const temporalGen = new TemporalSequenceGenerator(isChurn);

  for (let t = 0; t < TIME_STEPS; t++) {
    const temporal = temporalGen.process();
    const page = generatePage(t, isChurn);
    const action = generateActionType(t, page, isChurn);

    // Feature vector: temporal (4) + page (8) + action (4) = 16 features
    const features = [
      temporal.deltaTime,
      temporal.velocity,
      temporal.acceleration,
      temporal.relativeTime,
      ...encodePageOneHot(page),
      ...encodeActionOneHot(action),
    ];

    sequence.push(features);
  }

  return sequence;
}

/**
 * Génère un dataset réaliste avec patterns de churn
 */
export function generateDataset(samples = 1000) {
  const X = [];
  const churn = [];
  const conversion = [];
  const abuse = [];

  const churnProbability = 0.35; // ~35% de churn
  const conversionProbability = 0.45; // ~45% de conversion
  const abuseProbability = 0.05; // ~5% d'abus

  for (let i = 0; i < samples; i++) {
    // Détermine le label
    const rand = Math.random();
    let isChurn = false,
      isConversion = false,
      isAbuse = false;

    if (rand < churnProbability) {
      isChurn = true;
    } else if (rand < churnProbability + conversionProbability) {
      isConversion = true;
    } else if (
      rand <
      churnProbability + conversionProbability + abuseProbability
    ) {
      isAbuse = true;
    }
    // Sinon: comportement normal neutre

    // Génère la séquence
    const sequence = generateSequence(isChurn);
    X.push(sequence);

    // Labels pour multi-task learning
    churn.push([isChurn ? 1 : 0]);
    conversion.push([isConversion ? 1 : 0]);
    abuse.push([isAbuse ? 1 : 0]);
  }

  // FEATURES = 16 (temporal=4 + page=8 + action=4)
  const FEATURES = 16;

  return {
    X: tf.tensor3d(X, [samples, TIME_STEPS, FEATURES]),
    Y: [tf.tensor2d(churn), tf.tensor2d(conversion), tf.tensor2d(abuse)],
    metadata: {
      samples,
      timeSteps: TIME_STEPS,
      features: FEATURES,
      churnRate: churnProbability,
      conversionRate: conversionProbability,
      abuseRate: abuseProbability,
    },
  };
}
