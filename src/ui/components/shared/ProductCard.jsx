import React from "react";

/**
 * Composant réutilisable pour afficher un produit
 */
export const ProductCard = ({ product, onAddToCart, onViewDetails }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAdded, setIsAdded] = React.useState(false);

  const handleAddCart = () => {
    onAddToCart?.(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  return (
    <div
      data-track={`product_card_view_${product.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "all 0.3s ease",
        cursor: "pointer",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isHovered ? "0 8px 16px rgba(0,0,0,0.1)" : "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Image Container */}
      <div
        style={{
          position: "relative",
          backgroundColor: "#f5f5f5",
          height: "220px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: "80px",
            transform: isHovered ? "scale(1.1)" : "scale(1)",
            transition: "transform 0.3s ease",
          }}
        >
          {product.emoji}
        </div>

        {/* Badge Discount */}
        {discount > 0 && (
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
            -{discount}%
          </div>
        )}

        {/* Badge Popular */}
        {product.popular && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              backgroundColor: "#ffd700",
              color: "#000",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "bold",
            }}
          >
            ⭐ Populaire
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        <div style={{ marginBottom: "8px" }}>
          <h3
            style={{
              margin: "0 0 6px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#1a1a2e",
            }}
          >
            {product.name}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#999",
              height: "32px",
              overflow: "hidden",
              lineHeight: "1.4",
            }}
          >
            {product.description}
          </p>
        </div>

        {/* Ratings */}
        {product.rating && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginBottom: "10px",
              fontSize: "12px",
            }}
          >
            <span>⭐ {product.rating}</span>
            <span style={{ color: "#999" }}>({product.reviews})</span>
          </div>
        )}

        {/* Price */}
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "20px", fontWeight: "bold", color: "#1a1a2e" }}>
            {product.price}€
          </span>
          {product.originalPrice && (
            <span
              style={{
                fontSize: "14px",
                color: "#999",
                textDecoration: "line-through",
              }}
            >
              {product.originalPrice}€
            </span>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleAddCart}
            data-track={`product_add_cart_${product.id}`}
            disabled={isAdded}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: isAdded ? "#28a745" : "#00d4ff",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px",
              transition: "background-color 0.2s",
            }}
          >
            {isAdded ? "✓ Ajouté" : "Panier"}
          </button>
          <button
            onClick={() => onViewDetails?.(product)}
            data-track={`product_view_details_${product.id}`}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: "#f5f5f5",
              color: "#1a1a2e",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px",
              transition: "all 0.2s",
            }}
          >
            Détails
          </button>
        </div>
      </div>
    </div>
  );
};
