/**
 * Add to Cart Button with Rage-Click Protection
 */
import React, { useState } from "react";
import { useClickProtection } from "../../hooks/useClickProtection";

export const AddToCartButton = ({
  product,
  onAddToCart,
  className = "",
  style = {},
}) => {
  const [isAdded, setIsAdded] = useState(false);

  // Protect against rapid clicks
  const { onClick, isLoading } = useClickProtection(async () => {
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  }, 1000); // 1 second cooldown

  const handleClick = (e) => {
    onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isAdded}
      data-track={`product_add_cart_protected_${product.id}`}
      className={className}
      style={{
        padding: "12px 24px",
        backgroundColor: isAdded ? "#51cf66" : isLoading ? "#ccc" : "#00d4ff",
        color: isLoading ? "#666" : "#1a1a2e",
        border: "none",
        borderRadius: "6px",
        fontWeight: "bold",
        cursor: isLoading ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isLoading && !isAdded) {
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 212, 255, 0.3)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {isLoading ? "⏳" : isAdded ? "✓ Ajouté" : "🛒 Ajouter au Panier"}
    </button>
  );
};
