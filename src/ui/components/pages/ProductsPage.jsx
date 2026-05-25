import React, { useState, useMemo } from "react";
import { useProducts } from "../../hooks/useProducts";
import { useCart } from "../../hooks/useCart";
import { Skeleton } from "../shared/Skeleton";

export const ProductsPage = () => {
  const { products, isLoading, getCategories } = useProducts();
  const { addToCart } = useCart();

  const [filters, setFilters] = useState({
    category: "all",
    sortBy: "popular",
    minPrice: 0,
    maxPrice: 3000,
  });

  const [addedProducts, setAddedProducts] = useState(new Set());

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (filters.category !== "all") {
      result = result.filter((p) => p.category === filters.category);
    }

    // Price filter
    result = result.filter(
      (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice,
    );

    // Sort
    switch (filters.sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "popularity":
        result.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        result.sort((a, b) => b.discount - a.discount);
    }

    return result;
  }, [products, filters]);

  const categories = getCategories();

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setAddedProducts((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProducts((prev) => {
        const copy = new Set(prev);
        copy.delete(product.id);
        return copy;
      });
    }, 2000);
  };

  return (
    <div style={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      {/* Header */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #00d4ff 100%)",
          color: "white",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <h1
          style={{ fontSize: "40px", marginBottom: "20px", fontWeight: "bold" }}
        >
          Nos Produits 🛒
        </h1>
        <p
          style={{
            fontSize: "16px",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: "1.6",
          }}
        >
          {products.length} produits disponibles pour transformer votre
          expérience
        </p>
      </section>

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "40px",
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: "40px",
        }}
      >
        {/* Sidebar Filters */}
        <aside
          style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "8px",
            height: "fit-content",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            position: "sticky",
            top: "80px",
          }}
        >
          <h3
            style={{
              margin: "0 0 25px 0",
              color: "#1a1a2e",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            Filtres
          </h3>

          {/* Category */}
          <div style={{ marginBottom: "30px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "12px",
                fontSize: "14px",
                color: "#1a1a2e",
              }}
            >
              Catégorie
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              data-track="products_category_filter"
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #e0e0e0",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            >
              <option value="all">Tous les produits</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div style={{ marginBottom: "30px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "12px",
                fontSize: "14px",
                color: "#1a1a2e",
              }}
            >
              Trier par
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value })
              }
              data-track="products_sort_filter"
              style={{
                width: "100%",
                padding: "10px",
                border: "2px solid #e0e0e0",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            >
              <option value="popular">Plus populaire</option>
              <option value="price-low">Prix: bas → haut</option>
              <option value="price-high">Prix: haut → bas</option>
              <option value="rating">Meilleures notes</option>
              <option value="discount">Plus de réductions</option>
            </select>
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: "30px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "12px",
                fontSize: "14px",
                color: "#1a1a2e",
              }}
            >
              Budget: 0€ - {filters.maxPrice}€
            </label>
            <input
              type="range"
              min="0"
              max="3000"
              step="50"
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  maxPrice: Number(e.target.value),
                })
              }
              data-track="products_price_filter"
              style={{
                width: "100%",
                cursor: "pointer",
              }}
            />
          </div>

          {/* Results Count */}
          <div
            style={{
              paddingTop: "20px",
              borderTop: "1px solid #e0e0e0",
              marginTop: "20px",
            }}
          >
            <p
              style={{
                margin: "0",
                fontSize: "13px",
                color: "#666",
              }}
            >
              {filteredProducts.length} résultat
              {filteredProducts.length > 1 ? "s" : ""}
            </p>
          </div>
        </aside>

        {/* Products Grid */}
        <main>
          {isLoading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "25px",
              }}
            >
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "25px",
              }}
            >
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  data-track={`product_view_${product.id}`}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #e0e0e0",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 24px rgba(0, 212, 255, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Product Image */}
                  <div
                    style={{
                      backgroundColor: "#f5f5f5",
                      height: "200px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "80px",
                      position: "relative",
                    }}
                  >
                    📦
                    {/* Discount Badge */}
                    {product.discount > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          backgroundColor: "#ff4444",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        -{product.discount}%
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div style={{ padding: "16px" }}>
                    <h4
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#1a1a2e",
                        height: "36px",
                        overflow: "hidden",
                      }}
                    >
                      {product.name}
                    </h4>

                    {/* Rating */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginBottom: "10px",
                        fontSize: "13px",
                      }}
                    >
                      <span>⭐ {product.rating}</span>
                      <span style={{ color: "#999" }}>({product.reviews})</span>
                    </div>

                    {/* Price */}
                    <div
                      style={{
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "baseline",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#00d4ff",
                        }}
                      >
                        {product.price.toFixed(2)}€
                      </span>
                      {product.discount > 0 && (
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#999",
                            textDecoration: "line-through",
                          }}
                        >
                          {(
                            product.price /
                            (1 - product.discount / 100)
                          ).toFixed(2)}
                          €
                        </span>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addedProducts.has(product.id)}
                      data-track={`product_add_cart_${product.id}`}
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: addedProducts.has(product.id)
                          ? "#51cf66"
                          : "#00d4ff",
                        color: "#1a1a2e",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "bold",
                        cursor: addedProducts.has(product.id)
                          ? "default"
                          : "pointer",
                        transition: "all 0.3s ease",
                        fontSize: "13px",
                      }}
                      onMouseEnter={(e) => {
                        if (!addedProducts.has(product.id)) {
                          e.currentTarget.style.boxShadow =
                            "0 6px 16px rgba(0, 212, 255, 0.3)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {addedProducts.has(product.id)
                        ? "✓ Ajouté au panier"
                        : "🛒 Ajouter"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 40px",
                backgroundColor: "white",
                borderRadius: "8px",
              }}
            >
              <p style={{ fontSize: "18px", color: "#666", margin: "0" }}>
                Aucun produit ne correspond à vos critères 😕
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
