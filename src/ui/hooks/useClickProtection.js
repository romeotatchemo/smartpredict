/**
 * React hook for managing button click protection
 */
import { useState, useCallback } from "react";
import { logger } from "../../engine/utils/logger.js";

/**
 * Hook to prevent rapid successive clicks (rage-click protection)
 * @param {Function} callback - Function to call when button is clicked
 * @param {number} cooldown - Cooldown duration in milliseconds (default: 500)
 * @returns {Object} { onClick: Function, isLoading: boolean, reset: Function }
 */
export const useClickProtection = (callback, cooldown = 500) => {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = useCallback(
    async (event) => {
      if (isLoading) return; // Prevent multiple clicks

      setIsLoading(true);
      try {
        await callback(event);
      } catch (error) {
        logger.error("Error in protected click:", error);
        throw error;
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, cooldown);
      }
    },
    [callback, cooldown, isLoading],
  );

  const reset = useCallback(() => {
    setIsLoading(false);
  }, []);

  return { onClick, isLoading, reset };
};

/**
 * Hook for simple rate limiting without async
 * @param {Function} callback - Function to call when button is clicked
 * @param {number} delay - Minimum delay between calls in milliseconds
 * @returns {Object} { onClick: Function, isDisabled: boolean }
 */
export const useThrottledClick = (callback, delay = 500) => {
  const [isDisabled, setIsDisabled] = useState(false);

  const onClick = useCallback(
    (event) => {
      if (isDisabled) return;

      setIsDisabled(true);
      callback(event);

      setTimeout(() => {
        setIsDisabled(false);
      }, delay);
    },
    [callback, delay, isDisabled],
  );

  return { onClick, isDisabled };
};
