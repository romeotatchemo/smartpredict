/**
 * Hook for managing products from IndexedDB
 */
import { useState, useEffect, useCallback } from "react";
import { logger } from "../../engine/utils/logger";
import indexedDBService from "../utils/IndexedDBService";

const attemptLoadProducts = async (
  attemptNumber = 0,
  callback,
  setIsLoading,
  setProducts,
  setError,
) => {
  try {
    setIsLoading(true);
    const loadedProducts = await indexedDBService.getProducts();

    logger.info(
      `[useProducts] Attempt ${attemptNumber}: Loaded ${loadedProducts?.length || 0} products`,
    );

    // If no products loaded and we haven't retried enough, retry
    if (
      (!loadedProducts || loadedProducts.length === 0) &&
      attemptNumber < 10
    ) {
      logger.warn(`[useProducts] No products found, retrying in 150ms...`);
      setTimeout(() => {
        attemptLoadProducts(
          attemptNumber + 1,
          callback,
          setIsLoading,
          setProducts,
          setError,
        );
      }, 150);
      return;
    }

    setProducts(loadedProducts || []);
    setError(null);
    setIsLoading(false);
    logger.info(
      `[useProducts] Successfully loaded ${loadedProducts?.length || 0} products`,
    );
  } catch (err) {
    logger.error(
      `[useProducts] Error on attempt ${attemptNumber}:`,
      err.message,
    );
    // Retry on error
    if (attemptNumber < 10) {
      setTimeout(() => {
        attemptLoadProducts(
          attemptNumber + 1,
          callback,
          setIsLoading,
          setProducts,
          setError,
        );
      }, 150);
      return;
    }
    setError(err.message);
    setProducts([]);
    setIsLoading(false);
  }
};

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load all products from IndexedDB with retry logic
   */
  const loadProducts = useCallback(() => {
    attemptLoadProducts(0, null, setIsLoading, setProducts, setError);
  }, []);

  /**
   * Load products on mount and when IndexedDB is ready
   */
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /**
   * Listen for IndexedDB initialization event
   */
  useEffect(() => {
    const handleIndexedDBReady = () => {
      loadProducts();
    };

    window.addEventListener("IndexedDBReady", handleIndexedDBReady);
    return () =>
      window.removeEventListener("IndexedDBReady", handleIndexedDBReady);
  }, [loadProducts]);

  /**
   * Get product by ID
   */
  const getProductById = useCallback(async (id) => {
    try {
      const product = await indexedDBService.getProductById(id);
      return product;
    } catch (err) {
      logger.error(`Failed to get product ${id}:`, err);
      return null;
    }
  }, []);

  /**
   * Search products by name or category
   */
  const searchProducts = useCallback(
    (query) => {
      const lowerQuery = query.toLowerCase();
      return products.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerQuery) ||
          product.description.toLowerCase().includes(lowerQuery) ||
          product.category.toLowerCase().includes(lowerQuery),
      );
    },
    [products],
  );

  /**
   * Get products by category
   */
  const getByCategory = useCallback(
    (category) => {
      return products.filter(
        (product) => product.category.toLowerCase() === category.toLowerCase(),
      );
    },
    [products],
  );

  /**
   * Get unique categories
   */
  const getCategories = useCallback(() => {
    const categories = new Set(products.map((p) => p.category));
    return Array.from(categories).sort();
  }, [products]);

  /**
   * Get featured products (highest rated)
   */
  const getFeatured = useCallback(
    (count = 6) => {
      return [...products].sort((a, b) => b.rating - a.rating).slice(0, count);
    },
    [products],
  );

  /**
   * Get trending products (most reviews)
   */
  const getTrending = useCallback(
    (count = 6) => {
      return [...products]
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, count);
    },
    [products],
  );

  /**
   * Get products on sale (with discount)
   */
  const getOnSale = useCallback(() => {
    return products.filter((product) => product.discount > 0);
  }, [products]);

  return {
    products,
    isLoading,
    error,
    loadProducts,
    getProductById,
    searchProducts,
    getByCategory,
    getCategories,
    getFeatured,
    getTrending,
    getOnSale,
  };
};
