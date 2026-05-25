/**
 * EVENT TRACKER - User Activity Stream
 * Version: 2.0.0
 *
 * Module de suivi des événements utilisateur (click, scroll, submit, hover, input, errors).
 *
 * ✨ V2 IMPROVEMENTS & BUG FIXES:
 *
 * BUG FIX #1: initSubmitTracking()
 * ❌ V1: Référençait une variable `target` indéfinie
 * ✅ V2: Utilise correctement `form` du event.target
 *
 * @example
 * // V1 Bug - ReferenceError au submit:
 * function initSubmitTracking() {
 *   document.addEventListener('submit', (e) => {
 *     trackingEvents.push({
 *       id: target.dataset.track,  // ❌ target is undefined!
 *     });
 *   });
 * }
 *
 * // V2 Fixed - Correct scope usage:
 * function initSubmitTracking() {
 *   document.addEventListener('submit', (event) => {
 *     const form = event.target;  // ✅ Use form from event
 *     trackingEvents.push({
 *       id: form.dataset.track,    // ✅ Correct!
 *     });
 *   });
 * }
 *
 * LESSON LEARNED: Toujours utiliser le scope auquel vous avez accès.
 * event.target = le formulaire/élément exact, pas une variable globale inexistante.
 */

import { smartStream } from "../core/StreamManager";
import { ACTION_TYPES } from "./event.schema";

/**
 * Initialise le suivi des clics utilisateur.
 * Capture tous les clics sur des éléments avec data-track attribute.
 *
 * @function initClickTracking
 * @returns {void}
 */
function initClickTracking() {
  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!target.dataset.track) return;

    smartStream.push(ACTION_TYPES.CLICK, {
      id: target.dataset.track,
      element: target.tagName,
      path: window.location.pathname,
    });
  });
}

/**
 * Initialise le suivi du défilement (scroll).
 * Déclenche un événement tous les 25% de scroll.
 *
 * @function initScrollTracking
 * @returns {void}
 */
function initScrollTracking() {
  let lastScrollPercent = 0;

  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    if (docHeight <= 0) return;

    const scrollPercent = Math.round((scrollTop / docHeight) * 100);

    if (scrollPercent - lastScrollPercent >= 25) {
      lastScrollPercent = scrollPercent;

      smartStream.push(ACTION_TYPES.SCROLL, {
        percent: scrollPercent,
        path: window.location.pathname,
      });
    }
  });
}

/**
 * Initialise le suivi des soumissions de formulaire.
 *
 * ✨ V2 BUG FIX: Maintenant utilise correctement `form` au lieu de `target` indéfini
 *
 * @function initSubmitTracking
 * @returns {void}
 */
function initSubmitTracking() {
  document.addEventListener("submit", (event) => {
    // ✅ V2: Utiliser `form` qui existe dans le scope, pas `target` indéfini
    const form = event.target;

    if (!form.dataset.track) return;

    smartStream.push(ACTION_TYPES.SUBMIT, {
      id: form.dataset.track,
      path: window.location.pathname,
    });
  });
}

/**
 * Initialise le suivi du survol (hover) d'éléments.
 * Nouveauté V2.0
 *
 * @function initHoverTracking
 * @returns {void}
 */
function initHoverTracking() {
  document.addEventListener(
    "mouseenter",
    (event) => {
      if (!event || !event.target) return;
      const target = event.target;

      // Vérifier que target est un HTMLElement
      if (typeof target.matches !== "function") return;

      // Tracker les éléments avec data-track ou les boutons/liens interactifs
      if (
        target.dataset?.track ||
        target.matches("button, a, [role='button']")
      ) {
        smartStream.push(ACTION_TYPES.HOVER, {
          id:
            target.dataset?.track ||
            target.id ||
            target.textContent?.slice(0, 20),
          element: target.tagName,
          path: window.location.pathname,
        });
      }
    },
    true,
  );
}

/**
 * Initialise le suivi de la saisie (focus sur input/textarea).
 * Nouveauté V2.0
 *
 * @function initInputTracking
 * @returns {void}
 */
function initInputTracking() {
  document.addEventListener(
    "focus",
    (event) => {
      if (!event || !event.target) return;
      const target = event.target;

      // Vérifier que target est un HTMLElement avec la méthode matches
      if (typeof target.matches !== "function") return;

      if (target.matches("input, textarea")) {
        smartStream.push(ACTION_TYPES.INPUT, {
          id: target.id || target.name || "unknown",
          type: target.type || "textarea",
          path: window.location.pathname,
        });
      }
    },
    true,
  );
}

/**
 * Initialise le suivi des erreurs (validation HTML5).
 * Nouveauté V2.0
 *
 * @function initErrorTracking
 * @returns {void}
 */
function initErrorTracking() {
  // Capture les erreurs de validation HTML5
  document.addEventListener(
    "invalid",
    (event) => {
      if (!event || !event.target) return;
      const target = event.target;

      smartStream.push(ACTION_TYPES.ERROR, {
        id: target.id || target.name || "unknown",
        message: target.validationMessage || "validation error",
        path: window.location.pathname,
      });
    },
    true,
  );

  // Capture aussi les erreurs de remplissage manuel
  document.addEventListener(
    "change",
    (event) => {
      if (!event || !event.target) return;
      const target = event.target;

      // Vérifier que target est un HTMLElement avec la méthode matches
      if (typeof target.matches !== "function") return;

      if (target.matches("input, textarea") && !target.checkValidity?.()) {
        smartStream.push(ACTION_TYPES.ERROR, {
          id: target.id || target.name || "unknown",
          message: "invalid input",
          path: window.location.pathname,
        });
      }
    },
    true,
  );
}

// ===== NOUVEAU: NAV TRACKING =====
let previousPath = window.location.pathname;

function initNavTracking() {
  // Tracker la navigation avec l'historique du navigateur
  window.addEventListener("popstate", () => {
    const newPath = window.location.pathname;

    smartStream.push(ACTION_TYPES.NAV, {
      from: previousPath,
      to: newPath,
      type: "back/forward",
    });

    previousPath = newPath;
  });
}

// ===== Observer de changement de route (pour React Router) =====
export function trackNavigation(newPath) {
  if (newPath !== previousPath) {
    smartStream.push(ACTION_TYPES.NAV, {
      from: previousPath,
      to: newPath,
      type: "navigation",
    });
    previousPath = newPath;
  }
}

// ===== INITIALISATION PRINCIPALE =====
export function initEventTracker() {
  initClickTracking();
  initScrollTracking();
  initSubmitTracking();
  initHoverTracking(); // ✅ NOUVEAU
  initInputTracking(); // ✅ NOUVEAU
  initErrorTracking(); // ✅ NOUVEAU
  initNavTracking(); // ✅ NOUVEAU
}
