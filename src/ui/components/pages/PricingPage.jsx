import React from "react";
import { useNavigate } from "react-router";
import { useSmartPredict } from "../../hooks/useSmartPredict";

const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    period: "mois",
    description: "Parfait pour débuter votre parcours shopping",
    features: [
      "✓ Accès catalogue complet",
      "✓ Recommandations IA basiques",
      "✓ Suivi de commandes",
      "✓ Support email",
      "✗ Retours gratuits",
      "✗ Livraison gratuite", 
    ],
    cta: "Démarrer",
    color: "#999",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29.99,
    period: "mois",
    description: "Le plus populaire pour les acheteurs réguliers",
    features: [
      "✓ Accès catalogue complet",
      "✓ Recommandations IA avancées",
      "✓ Suivi en temps réel",
      "✓ Support prioritaire 24/7",
      "✓ Retours gratuits 60 jours",
      "✓ Livraison gratuite",
    ],
    cta: "Essayer gratuitement",
    color: "#00d4ff",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 99.99,
    period: "an",
    description: "Pour les clients VIP qui veulent tout",
    features: [
      "✓ Accès catalogue complet",
      "✓ Recommandations IA 100% personnalisée",
      "✓ Concierge personnel",
      "✓ Support VIP 24/7",
      "✓ Retours gratuits 180 jours",
      "✓ Livraison gratuite express",
    ],
    cta: "Devenir Premium",
    color: "#ffd700",
    popular: false,
  },
];

export const PricingPage = () => {
  const navigate = useNavigate();
  const { latestDecision } = useSmartPredict();
  const [billingPeriod, setBillingPeriod] = React.useState("monthly");

  return (
    <div style={{ backgroundColor: "#fafafa", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          padding: "60px 30px",
          textAlign: "center",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <h1 style={{ fontSize: "36px", marginBottom: "15px", color: "#1a1a2e" }}>
          Plans d'abonnement 💎
        </h1>
        <p style={{ fontSize: "16px", color: "#999", maxWidth: "600px", margin: "0 auto" }}>
          Choisissez le plan qui correspond à tes besoins. Tous les plans incluent le
          système IA SmartStore
        </p>
      </div>

      {/* Billing Toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          padding: "40px 30px",
        }}
      >
        <button
          onClick={() => setBillingPeriod("monthly")}
          data-track="pricing_toggle_monthly"
          style={{
            padding: "10px 20px",
            backgroundColor: billingPeriod === "monthly" ? "#1a1a2e" : "#f5f5f5",
            color: billingPeriod === "monthly" ? "#00d4ff" : "#1a1a2e",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.3s",
          }}
        >
          Facturation mensuelle
        </button>
        <button
          onClick={() => setBillingPeriod("annual")}
          data-track="pricing_toggle_annual"
          style={{
            padding: "10px 20px",
            backgroundColor: billingPeriod === "annual" ? "#1a1a2e" : "#f5f5f5",
            color: billingPeriod === "annual" ? "#00d4ff" : "#1a1a2e",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.3s",
          }}
        >
          Facturation annuelle <span style={{ color: "#28a745" }}>-20%</span>
        </button>
      </div>

      {/* Pricing Cards */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 30px 60px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "25px",
        }}
      >
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              border: plan.popular ? `2px solid ${plan.color}` : "1px solid #e0e0e0",
              overflow: "hidden",
              transition: "all 0.3s",
              transform: plan.popular ? "scale(1.05)" : "scale(1)",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,212,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div
                style={{
                  backgroundColor: plan.color,
                  color: "#1a1a2e",
                  padding: "8px",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              >
                ⭐ PLUS POPULAIRE
              </div>
            )}

            {/* Content */}
            <div style={{ padding: "30px" }}>
              <h3 style={{ fontSize: "20px", marginBottom: "10px", color: "#1a1a2e" }}>
                {plan.name}
              </h3>
              <p style={{ fontSize: "13px", color: "#999", marginBottom: "20px" }}>
                {plan.description}
              </p>

              {/* Price */}
              <div style={{ marginBottom: "25px" }}>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#1a1a2e" }}>
                  {plan.price}€
                  <span style={{ fontSize: "14px", color: "#999", fontWeight: "normal" }}>
                    /{plan.period}
                  </span>
                </div>
                {billingPeriod === "annual" && plan.id === "pro" && (
                  <p style={{ fontSize: "12px", color: "#28a745", margin: "5px 0 0 0" }}>
                    Économisez ~72€ par an
                  </p>
                )}
              </div>

              {/* Button */}
              <button
                onClick={() => navigate("/checkout?plan=" + plan.id)}
                data-track={`pricing_select_${plan.id}`}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: plan.popular ? "#00d4ff" : "#f5f5f5",
                  color: plan.popular ? "#1a1a2e" : "#1a1a2e",
                  border: plan.popular ? "none" : "1px solid #e0e0e0",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  marginBottom: "20px",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                }}
              >
                {plan.cta}
              </button>

              {/* Features */}
              <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "20px" }}>
                {plan.features.map((feature, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: "13px",
                      margin: "10px 0",
                      color: feature.includes("✗") ? "#ccc" : "#666",
                    }}
                  >
                    {feature}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <section
        style={{
          backgroundColor: "white",
          padding: "60px 30px",
          marginTop: "60px",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "28px", textAlign: "center", marginBottom: "40px", color: "#1a1a2e" }}>
            Questions fréquentes 🤔
          </h2>

          {[
            {
              q: "Puis-je changer mon plan à tout moment?",
              a: "Oui! Vous pouvez passer à un plan supérieur ou inférieur à tout moment. Les changements prendront effet le prochain cycle de facturation.",
            },
            {
              q: "Y a-t-il une période d'essai gratuit?",
              a: "Oui, le plan Pro offre une période d'essai gratuit de 14 jours. Aucune carte de crédit requise.",
            },
            {
              q: "Que se passe-t-il si je me désabonne?",
              a: "Vous perdrez accès aux avantages du plan à la fin de votre période de facturation actuelle. Vos données resteront sauvegardées.",
            },
            {
              q: "Les prix incluent les taxes?",
              a: "Les prix affichés sont HT. La TVA sera ajoutée au moment du paiement selon votre localisation.",
            },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: "20px" }}>
              <details
                style={{
                  borderBottom: "1px solid #e0e0e0",
                  paddingBottom: "15px",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: "bold",
                    color: "#1a1a2e",
                    fontSize: "15px",
                    paddingBottom: "10px",
                  }}
                  data-track={`pricing_faq_${i}`}
                >
                  {item.q}
                </summary>
                <p style={{ color: "#999", fontSize: "14px", margin: "10px 0 0 0" }}>
                  {item.a}
                </p>
              </details>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "white",
          padding: "60px 30px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "28px", marginBottom: "15px" }}>
          Prêt à commencer? 🚀
        </h2>
        <p style={{ fontSize: "16px", marginBottom: "25px", color: "#aaa" }}>
          Rejoignez des milliers de clients satisfaits et découvrez la puissance
          de l'IA dans vos achats
        </p>
        <button
          onClick={() => navigate("/products")}
          data-track="pricing_final_cta"
          style={{
            padding: "15px 40px",
            backgroundColor: "#00d4ff",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Sélectionner un plan
        </button>
      </section>
    </div>
  );
};
