import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useSmartPredict } from "../../hooks/useSmartPredict";

const CartItem = ({ item, onRemove, onQuantityChange }) => (
  <div
    style={{
      display: "flex",
      gap: "20px",
      padding: "20px",
      backgroundColor: "white",
      borderBottom: "1px solid #e0e0e0",
      alignItems: "center",
    }}
  >
    <div style={{ fontSize: "40px" }}>{item.emoji}</div>
    <div style={{ flex: 1 }}>
      <h3 style={{ color: "#1a1a2e", margin: "0 0 5px", fontSize: "16px" }}>
        {item.name}
      </h3>
      <p style={{ color: "#666", margin: "0", fontSize: "14px" }}>
        {item.description}
      </p>
    </div>
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        padding: "5px",
      }}
    >
      <button
        onClick={() => onQuantityChange(item.id, item.quantity - 1)}
        data-track={`cart_quantity_decrease_${item.id}`}
        style={{
          width: "30px",
          height: "30px",
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        −
      </button>
      <span style={{ width: "30px", textAlign: "center", fontSize: "14px" }}>
        {item.quantity}
      </span>
      <button
        onClick={() => onQuantityChange(item.id, item.quantity + 1)}
        data-track={`cart_quantity_increase_${item.id}`}
        style={{
          width: "30px",
          height: "30px",
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        +
      </button>
    </div>
    <div style={{ textAlign: "right", minWidth: "100px" }}>
      <p style={{ color: "#1a1a2e", margin: "0", fontWeight: "bold", fontSize: "16px" }}>
        {(item.price * item.quantity).toFixed(2)}€
      </p>
      <p style={{ color: "#999", margin: "5px 0 0", fontSize: "12px" }}>
        {item.price.toFixed(2)}€ x {item.quantity}
      </p>
    </div>
    <button
      onClick={() => onRemove(item.id)}
      data-track={`cart_remove_${item.id}`}
      style={{
        padding: "8px 12px",
        backgroundColor: "#ff6b6b",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      ✕
    </button>
  </div>
);

export const CartPage = () => {
  const navigate = useNavigate();
  const { latestDecision } = useSmartPredict();

  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Starter Plan",
      description: "Abonnement mensuel",
      emoji: "🚀",
      price: 9.99,
      quantity: 1,
    },
    {
      id: 2,
      name: "Premium Support",
      description: "Support prioritaire 24/7",
      emoji: "🎯",
      price: 4.99,
      quantity: 1,
    },
  ]);

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.2;
  const total = subtotal + tax - discount;

  const handleRemove = (itemId) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemove(itemId);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "SMARTPREDICT20") {
      setDiscount(subtotal * 0.2);
      document.dispatchEvent(
        new CustomEvent("track", { detail: { action: "cart_promo_applied" } })
      );
    } else {
      alert("Code promo invalide");
    }
  };

  const handleCheckout = () => {
    navigate("/checkout?plan=pro");
  };

  return (
    <div style={{ backgroundColor: "#f9f9f9", minHeight: "calc(100vh - 60px)" }}>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #00d4ff 100%)",
          color: "white",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "32px", margin: "0", fontWeight: "bold" }}>
          Mon Panier 🛒
        </h1>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "40px", padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Cart Items */}
        <div>
          {cartItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                backgroundColor: "white",
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>🛒</div>
              <h2 style={{ color: "#1a1a2e", marginBottom: "10px" }}>
                Votre panier est vide
              </h2>
              <p style={{ color: "#666", marginBottom: "20px" }}>
                Découvrez nos produits et commencez vos achats.
              </p>
              <button
                onClick={() => navigate("/products")}
                data-track="cart_continue_shopping_empty"
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#00d4ff",
                  color: "#1a1a2e",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Voir les Produits
              </button>
            </div>
          ) : (
            <>
              <div style={{ backgroundColor: "white", borderRadius: "8px", overflow: "hidden" }}>
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>

              {/* Promo Code Section */}
              <div
                style={{
                  marginTop: "30px",
                  padding: "20px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                }}
              >
                <h3 style={{ color: "#1a1a2e", marginTop: "0", marginBottom: "15px" }}>
                  Code Promo
                </h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="Entrez un code promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    data-track="cart_promo_input"
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  />
                  <button
                    onClick={handleApplyPromo}
                    data-track="cart_apply_promo"
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#00d4ff",
                      color: "#1a1a2e",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    Appliquer
                  </button>
                </div>
                <p style={{ color: "#999", fontSize: "12px", margin: "10px 0 0" }}>
                  💡 Tip: essayez "SMARTPREDICT20"
                </p>
              </div>
            </>
          )}

          {/* Continue Shopping */}
          {cartItems.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => navigate("/products")}
                data-track="cart_continue_shopping"
                style={{
                  padding: "12px 30px",
                  backgroundColor: "white",
                  color: "#00d4ff",
                  border: "2px solid #00d4ff",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Continuer mes Achats
              </button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        {cartItems.length > 0 && (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "25px",
              height: "fit-content",
              position: "sticky",
              top: "80px",
            }}
          >
            <h3 style={{ color: "#1a1a2e", marginTop: "0", marginBottom: "20px" }}>
              Résumé de Commande
            </h3>

            <div
              style={{
                paddingBottom: "15px",
                marginBottom: "15px",
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "#666" }}>Sous-total</span>
                <span style={{ color: "#1a1a2e", fontWeight: "bold" }}>
                  {subtotal.toFixed(2)}€
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "#666" }}>TVA (20%)</span>
                <span style={{ color: "#1a1a2e", fontWeight: "bold" }}>
                  {tax.toFixed(2)}€
                </span>
              </div>
              {discount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    color: "#51cf66",
                  }}
                >
                  <span>Réduction</span>
                  <span style={{ fontWeight: "bold" }}>-{discount.toFixed(2)}€</span>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
                fontSize: "16px",
              }}
            >
              <strong style={{ color: "#1a1a2e" }}>Total:</strong>
              <strong style={{ color: "#00d4ff", fontSize: "20px" }}>
                {total.toFixed(2)}€
              </strong>
            </div>

            {latestDecision && (
              <div
                style={{
                  backgroundColor: "#f0f7ff",
                  border: "1px solid #d4e9ff",
                  padding: "12px",
                  borderRadius: "4px",
                  marginBottom: "20px",
                  fontSize: "12px",
                }}
              >
                <p style={{ color: "#0651a0", margin: "0" }}>
                  💡 <strong>Recommandation IA</strong>: {latestDecision.action}
                </p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              data-track="cart_checkout_click"
              style={{
                width: "100%",
                padding: "15px",
                backgroundColor: "#00d4ff",
                color: "#1a1a2e",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "16px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 212, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Procéder au Paiement
            </button>

            <div
              style={{
                marginTop: "15px",
                padding: "12px",
                backgroundColor: "#f9f9f9",
                borderRadius: "4px",
                fontSize: "12px",
                color: "#666",
                textAlign: "center",
              }}
            >
              🔒 Paiement sécurisé SSL
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
