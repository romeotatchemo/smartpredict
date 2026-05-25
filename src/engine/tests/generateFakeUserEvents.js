import { smartStream } from '../core/StreamManager';
import { ACTION_TYPES } from '../data/event.schema';
import { logger } from '../utils/logger';

/** * Liste des chemins d'accès (URLs) utilisés pour la simulation des événements.
 * @type {string[]}
 */
export const PAGES = ['/', '/home', '/pricing', '/blog', '/checkout'];

/**
 * Sélectionne de manière aléatoire un élément dans un tableau.
 * * @param {Array} arr - Le tableau dans lequel piocher.
 * @returns {*} L'élément sélectionné au hasard.
 * @private
 */
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Suspend l'exécution pendant une durée déterminée.
 * * @param {number} ms - Le nombre de millisecondes à attendre.
 * @returns {Promise<void>}
 * @private
 */
function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Génère une série d'événements utilisateur factices et les envoie dans le flux SmartStream.
 * * Cette fonction simule un comportement "humain" en injectant des délais aléatoires
 * entre chaque action (clics, défilements, vues).
 * * @async
 * @function generateFakeUserEvents
 * @param {number} [count=30] - Le nombre d'événements à générer.
 * @throws {Error} Peut lever une erreur si `smartStream.push` échoue.
 * * @example
 * // Générer 50 événements de test
 * await generateFakeUserEvents(50);
 */
export async function generateFakeUserEvents(count = 30) {
  logger.info(`🧪 GENERATOR: Creating ${count} human-like events...`);

  for (let i = 0; i < count; i++) {
    // Sélection aléatoire du type d'action et de la page
    const action = randomChoice([
      ACTION_TYPES.CLICK,
      ACTION_TYPES.SCROLL,
      ACTION_TYPES.VIEW,
    ]);
    const page = randomChoice(PAGES);

    let payload = { page };

    // Construction du payload spécifique au type d'action
    if (action === ACTION_TYPES.CLICK) {
      payload.element = `btn_${Math.floor(Math.random() * 10)}`;
    } else if (action === ACTION_TYPES.SCROLL) {
      payload.percent = Math.floor(Math.random() * 100);
    }

    // Envoi de l'événement au gestionnaire de flux
    smartStream.push(action, payload);

    // Pause aléatoire entre 50ms et 150ms pour simuler un rythme humain
    await wait(50 + Math.random() * 100);
  }

  // Délai de sécurité pour s'assurer que les processus asynchrones (ex: DB) se terminent
  logger.debug('⏳ GENERATOR: Waiting for DB flush...');
  await wait(1000);

  logger.info('✅ GENERATOR: Done.');
}
