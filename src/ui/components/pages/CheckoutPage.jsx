import React from "react";
import { useSmartPredict } from "../../hooks/useSmartPredict";
import { useNavigate, useSearchParams } from "react-router";

const PLANS = {
  starter: { name: "Plan Starter", price: 9.99, features: "Accès basique, IA simple" },
  pro: { name: "Plan Pro", price: 29.99, features: "Accès complet, IA avancée, Support 24/7" },
  premium: { name: "Plan Premium", price: 99.99, features: "VIP total, Concierge, Tout illimité" },
};

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { latestDecision } = useSmartPredict();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan") || "pro";
  const plan = PLANS[planId] || PLANS.pro;
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [orderCompleted, setOrderCompleted] = React.useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setOrderCompleted(true);
    }, 2000);
  };

  if (orderCompleted) {
    return (
      <div style={{ backgroundColor: "#fafafa", minHeight: "100vh", padding: "60px 30px" }}>
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "40px",
            textAlign: "center",
            border: "2px solid #28a745",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>✅</div>
          <h1 style={{ color: "#28a745", marginBottom: "15px" }}>Abonnement confirmé!</h1>
          <p style={{ color: "#999", marginBottom: "25px", fontSize: "16px" }}>
            Votre souscription au {plan.name} est activée. Un email de confirmation a été envoyé à votre adresse.
          </p>
          <div style={{ backgroundColor: "#f5f5f5", padding: "20px", borderRadius: "4px", marginBottom: "25px", textAlign: "left" }}>
            <p><strong>Détails de l'abonnement:</strong></p>
            <p>📦 Forfait: {plan.name}</p>
            <p>💰 Prix: {plan.price}€/mois</p>
            <p>📧 Email: {formData.email}</p>
          </div>
          <div style={{ display: "flex", gap: "15px" }}>
            <button
              onClick={() => navigate("/products")}
              data-track="checkout_continue_shopping"
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "#1a1a2e",
                color: "#00d4ff",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Continuer vos achats
            </button>
            <button
              onClick={() => navigate("/account")}
              data-track="checkout_account"
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "#f5f5f5",
                color: "#1a1a2e",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Voir mon compte
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#fafafa", minHeight: "100vh", padding: "40px 30px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 350px", gap: "30px" }}>
        {/* Form Section */}
        <div>
          <h1 style={{ fontSize: "28px", marginBottom: "30px", color: "#1a1a2e" }}>Commander 🧑‍💻</h1>
          
          <form onSubmit={handlePayment}>
            {/* Personal Info */}
            <section style={{ backgroundColor: "white", padding: "25px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e0e0e0" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px", color: "#1a1a2e" }}>Informations personnelles</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <input type="text" name="firstName" placeholder="Prénom" required value={formData.firstName} onChange={handleChange} style={{ padding: "10px", border: "1px solid #e0e0e0", borderRadius: "4px" }} />
                <input type="text" name="lastName" placeholder="Nom" required value={formData.lastName} onChange={handleChange} style={{ padding: "10px", border: "1px solid #e0e0e0", borderRadius: "4px" }} />
              </div>
              <input type="email" name="email" placeholder="Email" required value={formData.email} onChange={handleChange} style={{ width: "100%", padding: "10px", marginTop: "15px", border: "1px solid #e0e0e0", borderRadius: "4px", boxSizing: "border-box" }} />
            </section>

            {/* Address */}
            <section style={{ backgroundColor: "white", padding: "25px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e0e0e0" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px", color: "#1a1a2e" }}>Adresse de livraison</h2>
              <input type="text" name="address" placeholder="Adresse" required value={formData.address} onChange={handleChange} style={{ width: "100%", padding: "10px", border: "1px solid #e0e0e0", borderRadius: "4px", boxSizing: "border-box" }} />
            </section>

            {/* Payment */}
            <section style={{ backgroundColor: "white", padding: "25px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e0e0e0" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px", color: "#1a1a2e" }}>Paiement 🔒 Sécurisé</h2>
              <input type="text" name="cardNumber" placeholder="Numéro de carte" required maxLength="16" value={formData.cardNumber} onChange={handleChange} style={{ width: "100%", padding: "10px", marginBottom: "15px", border: "1px solid #e0e0e0", borderRadius: "4px", boxSizing: "border-box" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <input type="text" name="expiryDate" placeholder="MM/YY" required value={formData.expiryDate} onChange={handleChange} style={{ padding: "10px", border: "1px solid #e0e0e0", borderRadius: "4px" }} />
                <input type="text" name="cvv" placeholder="CVV" required maxLength="3" value={formData.cvv} onChange={handleChange} style={{ padding: "10px", border: "1px solid #e0e0e0", borderRadius: "4px" }} />
              </div>
            </section>

            {/* AI Recommendation */}
            {latestDecision && (
              <div style={{ backgroundColor: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: "8px", padding: "15px", marginBottom: "20px" }}>
                <strong style={{ color: "#1a1a2e" }}>🤖 Recommandation IA</strong>
                <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "14px" }}>{latestDecision.action}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              data-track="checkout_submit_payment"
              style={{
                width: "100%",
                padding: "15px",
                backgroundColor: isProcessing ? "#ccc" : "#00d4ff",
                color: "#1a1a2e",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: isProcessing ? "not-allowed" : "pointer",
              }}
            >
              {isProcessing ? "⏳ Traitement..." : "Confirmer le paiement"}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div style={{ height: "fit-content" }}>
          <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e0e0e0", overflow: "hidden" }}>
            <div style={{ backgroundColor: "#1a1a2e", color: "white", padding: "15px", fontWeight: "bold" }}>Récapitulatif</div>
            <div style={{ padding: "20px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#1a1a2e", fontSize: "16px" }}>{plan.name}</h3>
              <p style={{ fontSize: "13px", color: "#999", marginBottom: "15px" }}>{plan.features}</p>
              <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "15px", marginBottom: "15px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#999" }}>Abonnement</span>
                  <strong>{plan.price}€</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#999" }}>TVA (20%)</span>
                  <strong>{(plan.price * 0.2).toFixed(2)}€</strong>
                </div>
              </div>
              <div style={{ borderTop: "2px solid #e0e0e0", paddingTop: "15px", display: "flex", justifyContent: "space-between", fontSize: "18px" }}>
                <strong>Total</strong>
                <strong style={{ color: "#00d4ff" }}>{(plan.price * 1.2).toFixed(2)}€</strong>
              </div>
              <p style={{ fontSize: "11px", color: "#999", marginTop: "15px", marginBottom: 0 }}>💳 Paiement sécurisé SSL 2048-bit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
