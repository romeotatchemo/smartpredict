/**
 * Service for managing IndexedDB operations for products
 */

const DB_NAME = "smartstore_db";
const DB_VERSION = 1;
const PRODUCTS_STORE = "products";

class IndexedDBService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize IndexedDB connection and create object stores
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error("Failed to open IndexedDB"));
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
          db.createObjectStore(PRODUCTS_STORE, { keyPath: "id" });
        }
      };
    });
  }

  /**
   * Check if database has data
   */
  async hasData() {
    try {
      const products = await this.getProducts();
      return products && products.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Add products to the database
   */
  async addProducts(products) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PRODUCTS_STORE], "readwrite");
      const store = transaction.objectStore(PRODUCTS_STORE);

      // Clear existing data first
      store.clear();

      products.forEach((product) => {
        store.add(product);
      });

      transaction.onerror = () => reject(new Error("Failed to add products"));
      transaction.oncomplete = () => resolve(products);
    });
  }

  /**
   * Get all products
   */
  async getProducts() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PRODUCTS_STORE], "readonly");
      const store = transaction.objectStore(PRODUCTS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(new Error("Failed to get products"));
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PRODUCTS_STORE], "readonly");
      const store = transaction.objectStore(PRODUCTS_STORE);
      const request = store.get(id);

      request.onerror = () => reject(new Error(`Failed to get product ${id}`));
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Clear all products
   */
  async clearProducts() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PRODUCTS_STORE], "readwrite");
      const store = transaction.objectStore(PRODUCTS_STORE);
      const request = store.clear();

      request.onerror = () => reject(new Error("Failed to clear products"));
      request.oncomplete = () => resolve();
    });
  }
}

// Singleton instance
const indexedDBService = new IndexedDBService();

export default indexedDBService;
