/**
 * ModelRegistry - Registre centralisé de tous les modèles ML
 * Pattern: Singleton + Lazy Loading + Deduplication
 * 
 * Responsabilités:
 * - Enregistrer la configuration de chaque modèle (fonction de chargement, options)
 * - Gérer le cycle de vie (idle -> loading -> ready)
 * - Assurer une seule instance par modèle en mémoire
 * - Dédupliquer les demandes de chargement concurrent (même promesse retournée)
 * - Fournir une API minimaliste (3 méthodes)
 */

import { logger } from '../utils/logger.js';

// State interne: Map<modelId, { config, instance, status, loadingPromise }>
const registeredModels = new Map();
let modelManifest = null;

// États possibles pour un modèle
const STATUS = {
  IDLE: 'idle',           // Déclaré mais non chargé
  LOADING: 'loading',     // Chargement en cours
  READY: 'ready',         // Chargé et prêt
  ERROR: 'error',         // Erreur lors du chargement
};

/**
 * Enregistre la configuration d'un modèle dans le registre
 * N'effectue PAS le chargement — registration uniquement
 * 
 * @param {string} modelId - Identifiant unique du modèle (ex: 'churn', 'coco-ssd', 'use')
 * @param {Object} config - Configuration du modèle
 * @param {Function} config.loadFn - Fonction async que retourne le modèle chargé
 * @param {Object} config.options - Options optionnelles (metadata, etc.)
 */
function register(modelId, config) {
  if (registeredModels.has(modelId)) {
    logger.warn(`⚠️  ModelRegistry: '${modelId}' already registered, overwriting`);
  }

  registeredModels.set(modelId, {
    config,
    instance: null,
    status: STATUS.IDLE,
    loadingPromise: null,
  });

  // logger.info(`✅ ModelRegistry: registered '${modelId}'`);
}

/**
 * Accède à un modèle — le charge si nécessaire (lazy loading)
 * Retourne toujours une promesse qui résout avec l'instance du modèle
 * 
 * Points clés:
 * 1. Si status === 'ready': retour imédiat (instance déjà chargée)
 * 2. Si status === 'loading': retour de la promesse en cours (DÉDOUBLONNAGE)
 * 3. Si status === 'idle': création d'une nouvelle promesse, lancement du chargement
 * 
 * @async
 * @param {string} modelId - Identifiant du modèle à charger
 * @returns {Promise<*>} - Promesse qui résout avec l'instance du modèle
 * @throws {Error} si le modèle n'est pas enregistré ou si le chargement échoue
 */
async function get(modelId, retry = false, attemptedFallback = false, onProgress = null) {
  if (modelManifest === null) {
    await loadManifest();
  }
  // Vérifier que le modèle existe
  if (!registeredModels.has(modelId)) {
    const error = `❌ ModelRegistry: model '${modelId}' not registered`;
    logger.error(error);
    throw new Error(error);
  }

  const entry = registeredModels.get(modelId);

  // CAS 1: Modèle déjà chargé → retour direct
  if (entry.status === STATUS.READY) {
    logger.debug(`✅ ModelRegistry.get('${modelId}'): already loaded (cached)`);
    return entry.instance;
  }

  // CAS 2: Modèle en cours de chargement → retour de la promesse existante
  // POINT CLÉ DU DÉDOUBLONNAGE : plusieurs appels pendant le chargement reçoivent
  // la même promesse, jamais deux chargements en parallèle
  if (entry.status === STATUS.LOADING) {
    logger.debug(`⏳ ModelRegistry.get('${modelId}'): already loading, reusing promise`);
    return entry.loadingPromise;
  }

  // CAS 3: Modèle idle → lancer le chargement
  if (entry.status === STATUS.IDLE) {
    logger.info(`🚀 ModelRegistry.get('${modelId}'): starting lazy load`);

    // Créer la promesse de chargement
    const loadingPromise = (async () => {
      try {
        // Passer le statut à 'loading'
        entry.status = STATUS.LOADING;

        // Déterminer l'URL du modèle : d'abord depuis le manifeste, sinon depuis la config
        let modelUrl = entry.config.modelUrl;
        let modelVersion = 'unknown';

        if (modelManifest && modelManifest.models && modelManifest.models[modelId]) {
          const modelMeta = modelManifest.models[modelId];
          const currentVersion = modelMeta.current;
          
          if (modelMeta.versions && modelMeta.versions[currentVersion]) {
            modelUrl = modelMeta.versions[currentVersion];
            modelVersion = currentVersion;
            logger.info(`📦 ModelRegistry: loading '${modelId}' version ${currentVersion} from ${modelUrl}`);
          }
        }

        	// Récupérer le hash attendu depuis le manifeste
        let expectedHash = null;
        if (modelManifest && 
            modelManifest.models && 
            modelManifest.models[modelId] &&
            modelManifest.models[modelId].integrity &&
            modelManifest.models[modelId].integrity[modelVersion]) {
          expectedHash = modelManifest.models[modelId].integrity[modelVersion];
        }

        // Si un hash est défini, vérifier l'intégrité
        if (expectedHash) {
          try {
            await verifyModelIntegrity(modelUrl, expectedHash);
            logger.info(`✅ Integrity check passed for ${modelId} v${modelVersion}`);
          } catch (integrityError) {
            // SÉCURITÉ CRITIQUE : Rejeter le modèle sans le charger
            entry.status = STATUS.ERROR;
            entry.loadingPromise = null;
            throw integrityError;
          }
        } else {
          logger.warn(`⚠️  No integrity hash found for ${modelId} v${modelVersion}, loading without verification`);
        }

        // Appeler la fonction de chargement fournie lors de register()
        const startTime = performance.now();
        const loadedModel = await entry.config.loadFn(modelUrl, onProgress);
        const loadTime = performance.now() - startTime;

        // Chargement réussi
        entry.instance = loadedModel;
        entry.status = STATUS.READY;
        entry.loadingPromise = null;
        entry.loadedVersion = modelVersion;

        logger.info(
          `✅ ModelRegistry.get('${modelId}'): load complete in ${loadTime.toFixed(0)}ms [v${modelVersion}]`
        );

        return loadedModel;
      } catch (error) {
        logger.error(
          `❌ ModelRegistry.get('${modelId}'): load failed —`,
          error.message
        );

        // FALLBACK AUTOMATIQUE
        if (!attemptedFallback && modelManifest && modelManifest.models && modelManifest.models[modelId]) {
          const modelMeta = modelManifest.models[modelId];
          const fallbackVersion = modelMeta.fallback;
          
          if (fallbackVersion && modelMeta.versions && modelMeta.versions[fallbackVersion]) {
            logger.warn(`🔄 ModelRegistry: attempting fallback to version ${fallbackVersion}`);
            
            // Réinitialiser l'entrée pour permettre une tentative de fallback
            entry.status = STATUS.IDLE;
            entry.instance = null;
            entry.loadingPromise = null;

            // Créer une nouvelle config temporaire pour le fallback
            const fallbackUrl = modelMeta.versions[fallbackVersion];
            const fallbackLoadFn = async () => {
              const model = await entry.config.originalLoadFn(fallbackUrl);
              return model;
            };

            entry.config.originalLoadFn = entry.config.loadFn;
            entry.config.loadFn = fallbackLoadFn;

            try {
              // Appel récursif avec attemptedFallback = true
              return await get(modelId, false, true);
            } catch (fallbackError) {
              logger.error(`❌ ModelRegistry: fallback also failed for '${modelId}'`);
              throw fallbackError;
            }
          }
        }

        // Chargement échoué
        entry.status = STATUS.ERROR;
        entry.loadingPromise = null;

        throw error;
      }
    })();

    // Stocker la promesse
    entry.loadingPromise = loadingPromise;

    return loadingPromise;
  }


  // CAS 4: Erreur lors du dernier chargement
  if (entry.status === STATUS.ERROR) {
    if (retry) {
      // Réinitialiser l'état pour permettre un nouveau chargement
      entry.status = STATUS.IDLE;
      entry.instance = null;
      entry.loadingPromise = null;
    }
    else {
      const error = `❌ ModelRegistry: model '${modelId}' failed to load previously`;
      logger.error(error);
      throw new Error(error);
    }
  }
}

/**
 * Liste l'état de tous les modèles déclarés
 * Utile pour le badge de statut dans le Header et la page Benchmark
 * 
 * @returns {Array<Object>} - Array d'objets { modelId, status, loaded }
 */
function list() {
  return Array.from(registeredModels.entries()).map(([modelId, entry]) => ({
    modelId,
    status: entry.status,
    loaded: entry.status === STATUS.READY,
  }));
}

/**
 * Charge le manifeste des versions de modèles
 * À appeler UNE SEULE FOIS au démarrage
 */
async function loadManifest() {
  if (modelManifest !== null) {
    // logger.debug('✅ ModelRegistry: manifest already loaded');
    return modelManifest;
  }

  try {
    const response = await fetch('/models/manifest.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status}`);
    }
    modelManifest = await response.json();
    // logger.info('✅ ModelRegistry: manifest loaded successfully');
    return modelManifest;
  } catch (error) {
    logger.warn('⚠️  ModelRegistry: failed to load manifest, continuing without it', error.message);
    // Retourner une structure par défaut si le manifeste n'existe pas
    modelManifest = { models: {} };
    return modelManifest;
  }
}

/**
 * État du polling
 */
let pollingIntervalId = null;
let manifestVersionSnapshot = null;

/**
 * Commence le polling périodique du manifeste
 * Détecte les mises à jour de modèles en arrière-plan
 * 
 * @param {number} intervalMs - Intervalle de polling en millisecondes (défaut: 30000 = 30s)
 */
function startManifestPolling(intervalMs = 30000) {
  if (pollingIntervalId !== null) {
    logger.warn('⚠️  ModelRegistry: polling already started, skipping');
    return;
  }

  // logger.info(`🔄 ModelRegistry: starting manifest polling every ${intervalMs}ms`);

  // Vérification immédiate au démarrage
  checkForManifestUpdates();

  // Polling périodique
  pollingIntervalId = setInterval(() => {
    checkForManifestUpdates();
  }, intervalMs);

  // Vérification lors du retour au focus de la fenêtre
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // logger.debug('👁️  ModelRegistry: window focused, checking for updates');
      checkForManifestUpdates();
    }
  });
}

/**
 * Arrête le polling du manifeste
 */
function stopManifestPolling() {
  if (pollingIntervalId !== null) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
    logger.info('✅ ModelRegistry: manifest polling stopped');
  }
}

/**
 * Vérifie s'il y a une nouvelle version du manifeste
 * Émet un événement custom si une mise à jour est détectée
 * 
 * @private
 */
async function checkForManifestUpdates() {
  try {
    const response = await fetch('/models/manifest.json');
    if (!response.ok) {
      logger.warn(`⚠️  ModelRegistry: failed to fetch manifest (${response.status})`);
      return;
    }

    const newManifest = await response.json();
    const currentVersion = JSON.stringify(modelManifest);
    const newVersion = JSON.stringify(newManifest);

    // Comparer les versions
    if (currentVersion !== newVersion) {
      logger.info('🔔 ModelRegistry: manifest update detected!');
      
      // Créer un snapshot pour comparaison
      const changedModels = detectChangedModels(modelManifest, newManifest);
      
      // Émettre l'événement
      const event = new CustomEvent('model-update-detected', {
        detail: {
          changedModels,
          previousManifest: modelManifest,
          newManifest: newManifest,
        }
      });
      document.dispatchEvent(event);

      // Mettre à jour le manifeste en mémoire
      modelManifest = newManifest;

      // Recharger les modèles affectés
      await reloadChangedModels(changedModels);

      // Émettre l'événement de fin de mise à jour
      const completeEvent = new CustomEvent('model-update-complete', {
        detail: {
          changedModels,
          newManifest: modelManifest,
        }
      });
      document.dispatchEvent(completeEvent);
    }
  } catch (error) {
    logger.warn('⚠️  ModelRegistry: error checking for manifest updates', error.message);
  }
}

/**
 * Détecte quels modèles ont changé de version
 * 
 * @private
 */
function detectChangedModels(oldManifest, newManifest) {
  const changed = [];
  
  if (!oldManifest || !oldManifest.models || !newManifest || !newManifest.models) {
    return changed;
  }

  for (const modelId in newManifest.models) {
    const oldVersion = oldManifest.models[modelId]?.current;
    const newVersion = newManifest.models[modelId]?.current;

    if (oldVersion !== newVersion) {
      changed.push({
        modelId,
        from: oldVersion,
        to: newVersion,
      });
      logger.info(`  → Model '${modelId}': ${oldVersion} → ${newVersion}`);
    }
  }

  return changed;
}

/**
 * Recharge les modèles qui ont changé de version
 * 
 * @private
 */
async function reloadChangedModels(changedModels) {
  for (const change of changedModels) {
    const { modelId, to: newVersion } = change;

    if (!registeredModels.has(modelId)) {
      logger.warn(`⚠️  ModelRegistry: model '${modelId}' not registered, skipping reload`);
      continue;
    }

    const entry = registeredModels.get(modelId);
    
    // Réinitialiser l'état pour permettre le rechargement
    entry.status = STATUS.IDLE;
    entry.instance = null;
    entry.loadingPromise = null;

    // logger.info(`🔄 ModelRegistry: reloading '${modelId}' to version ${newVersion}`);

    try {
      // Charger la nouvelle version
      const newInstance = await get(modelId);
      // logger.info(`✅ ModelRegistry: '${modelId}' successfully reloaded to ${newVersion}`);
    } catch (error) {
      logger.error(`❌ ModelRegistry: failed to reload '${modelId}'`, error.message);
    }
  }
}

/**
 * Vérifie l'intégrité d'un modèle en téléchargeant et en hachant son contenu
 * Utilise l'API SubtleCrypto du navigateur pour le hash SHA-256
 * 
 * @async
 * @param {string} url - URL du fichier modèle à vérifier
 * @param {string} expectedHash - Hash SHA-256 attendu (hex)
 * @returns {Promise<boolean>} - true si les hashes correspondent, false sinon
 * @throws {Error} si le téléchargement échoue ou si le hash ne correspond pas
 */
async function verifyModelIntegrity(url, expectedHash) {
  try {
    // Étape 1 : Télécharger le fichier en brut (pas comme ressource TensorFlow.js)
    // logger.debug(`🔐 ModelRegistry: verifying integrity of ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download model for integrity check: ${response.status}`);
    }

    // Récupérer le contenu en tant que tableau de bytes
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Étape 2 : Calculer le hash SHA-256 avec SubtleCrypto
    const hashBuffer = await crypto.subtle.digest('SHA-256', uint8Array);
    
    // Convertir le buffer en chaîne hexadécimale
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toLowerCase();

    // Étape 3 : Comparer les hashes
    if (calculatedHash !== expectedHash.toLowerCase()) {
      const error = `❌ ModelRegistry: integrity check FAILED for ${url}\n` +
        `Expected: ${expectedHash}\n` +
        `Calculated: ${calculatedHash}`;
      logger.error(error);
      throw new Error(error);
    }

    // logger.info(`✅ ModelRegistry: integrity verified for ${url}`);
    return true;
  } catch (error) {
    logger.error(`❌ ModelRegistry: integrity verification failed — ${error.message}`);
    throw error;
  }
}

/**
 * Export du singleton public API
 */
export const ModelRegistry = {
  register,
  get,
  list,
  loadManifest,
  startManifestPolling,
  stopManifestPolling,
};