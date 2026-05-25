/**
 * Utility functions for protecting against rage-clicks
 */

/**
 * Throttle a function - only executes at most once per interval
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  };
};

/**
 * Debounce a function - executes after being called for the last time
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

/**
 * Single execution - function only executes once, then resets after a delay
 * @param {Function} func - Function to execute
 * @param {number} delay - Reset delay in milliseconds
 * @returns {Function} Single-execution function
 */
export const singleExecution = (func, delay = 1000) => {
  let isExecuting = false;
  return function (...args) {
    if (!isExecuting) {
      isExecuting = true;
      try {
        func(...args);
      } finally {
        setTimeout(() => {
          isExecuting = false;
        }, delay);
      }
    }
  };
};

/**
 * Create a protected click handler for buttons
 * @param {Function} onClick - Original click handler
 * @param {number} delay - Delay between clicks in milliseconds (default: 500)
 * @returns {Function} Protected click handler
 */
export const createClickProtection = (onClick, delay = 500) => {
  let lastClickTime = 0;
  return (event) => {
    const now = Date.now();
    if (now - lastClickTime >= delay) {
      lastClickTime = now;
      onClick(event);
    }
  };
};

/**
 * Prevent rage-clicks with visual feedback
 * @param {Function} onClick - Original click handler
 * @param {number} disableDuration - How long to disable button after click (ms)
 * @returns {Object} { handler: Function, isDisabled: boolean, reset: Function }
 */
export const useRageClickProtection = (onClick, disableDuration = 1000) => {
  let isDisabled = false;
  const handler = (event) => {
    if (!isDisabled) {
      isDisabled = true;
      onClick(event);
      setTimeout(() => {
        isDisabled = false;
      }, disableDuration);
    }
  };

  return {
    handler,
    get isDisabled() {
      return isDisabled;
    },
  };
};
