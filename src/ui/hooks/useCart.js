/**
 * Hook for managing shopping cart with localStorage
 */
import { useState, useCallback, useEffect } from "react";
import { logger } from "../../engine/utils/logger.js";

const CART_STORAGE_KEY = "smartstore_cart";

const initializeCart = () => {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (savedCart) {
    try {
      return JSON.parse(savedCart);
    } catch {
      return [];
    }
  }
  return [];
};

export const useCart = () => {
  const [cart, setCart] = useState(initializeCart);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  /**
   * Add product to cart
   */
  const addToCart = useCallback((product, quantity = 1) => {
    logger.info(`[useCart] Adding ${quantity} of "${product.name}" to cart`);
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);

      if (existingItem) {
        // Update quantity if product already in cart
        const newCart = prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
        logger.info(
          `[useCart] Updated quantity. New cart size: ${newCart.length}`,
        );
        return newCart;
      } else {
        // Add new product
        const newCart = [...prevCart, { ...product, quantity }];
        logger.info(
          `[useCart] Added new product. New cart size: ${newCart.length}`,
        );
        return newCart;
      }
    });
  }, []);

  /**
   * Remove product from cart
   */
  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }, []);

  /**
   * Update product quantity
   */
  const updateQuantity = useCallback((productId, quantity) => {
    setCart((prevCart) =>
      quantity <= 0
        ? prevCart.filter((item) => item.id !== productId)
        : prevCart.map((item) =>
            item.id === productId ? { ...item, quantity } : item,
          ),
    );
  }, []);

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  /**
   * Get total items count
   */
  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  /**
   * Get total price
   */
  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => {
      const itemPrice = item.price - (item.price * item.discount) / 100;
      return total + itemPrice * item.quantity;
    }, 0);
  }, [cart]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };
};
