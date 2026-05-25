import React from "react";
import { useNavigate } from "react-router";
import { useSmartPredict } from "../../hooks/useSmartPredict";
import { ProductCard } from "../shared/ProductCard";
import { logger } from "../../../engine/utils/logger";

const FEATURED_PRODUCTS = [
  {
    id: 1,
    name: "Casque Noir Pro",
    emoji: "🎧",
    price: 149.99,
    originalPrice: 199.99,
    description: "Casque sans fil avec réduction de bruit active",
    rating: 4.8,
    reviews: 324,
    popular: true,
  },
  {
    id: 2,
    name: "Smartwatch Elite",
    emoji: "⌚",
    price: 299.99,
    originalPrice: 399.99,
    description: "Montre connectée avec suivi de santé avancé",
    rating: 4.6,
    reviews: 512,
    popular: true,
  },
  {
    id: 3,
    name: "Caméra Compacte",
    emoji: "📷",
    price: 89.99,
    description: "Caméra numérique portable haute résolution",
    rating: 4.5,
    reviews: 187,
  },
  {
    id: 4,
    name: "Batterie Solaire",
    emoji: "🔋",
    price: 59.99,
    originalPrice: 79.99,
    description: "Chargeur solaire haute capacité 20000mAh",
    rating: 4.4,
    reviews: 298,
  },
  {
    id: 5,
    name: "Micro Lavalier",
    emoji: "🎤",
    price: 34.99,
    description: "Microphone sans fil pour enregistrement professionnel",
    rating: 4.9,
    reviews: 421,
  },
  {
    id: 6,
    name: "Lampe LED RGB",
    emoji: "💡",
    price: 44.99,
    originalPrice: 59.99,
    description: "Lampe intelligente 16 millions de couleurs",
    rating: 4.7,
    reviews: 156,
  },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const { latestDecision } = useSmartPredict();

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "white",
          padding: "100px 30px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            marginBottom: "20px",
            fontWeight: "bold",
          }}
        >
          Bienvenue sur SmartStore 🛍️
        </h1>
        <p
          style={{
            fontSize: "18px",
            marginBottom: "30px",
            color: "#aaa",
            maxWidth: "600px",
            margin: "0 auto 30px",
          }}
        >
          La meilleure plateforme de e-commerce avec IA intégrée pour une
          expérience d'achat entièrement personnalisée
        </p>
        <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
          <button
            onClick={() => navigate("/products")}
            data-track="hero_explore_products"
            style={{
              padding: "15px 40px",
              fontSize: "16px",
              backgroundColor: "#00d4ff",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            Découvrir nos produits
          </button>
          <button
            onClick={() => navigate("/pricing")}
            data-track="hero_view_pricing"
            style={{
              padding: "15px 40px",
              fontSize: "16px",
              backgroundColor: "transparent",
              color: "white",
              border: "2px solid #00d4ff",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "rgba(0,212,255,0.1)";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.transform = "scale(1)";
            }}
          >
            Voir les tarifs
          </button>
        </div>

        {/* AI Recommendation Badge */}
        {latestDecision && (
          <div
            style={{
              marginTop: "40px",
              padding: "15px 20px",
              backgroundColor: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.3)",
              borderRadius: "8px",
              maxWidth: "600px",
              margin: "40px auto 0",
            }}
          >
            <strong>🤖 Recommandation IA</strong>
            <p style={{ margin: "8px 0 0 0", color: "#ccc" }}>
              Basée sur votre navigation: {latestDecision.action}
            </p>
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section
        style={{
          padding: "60px 30px",
          backgroundColor: "#f9f9f9",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "40px",
          maxWidth: "1400px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {[
          { number: "10K+", label: "Clients satisfaits" },
          { number: "50K+", label: "Produits disponibles" },
          { number: "24/7", label: "Support client" },
          { number: "100%", label: "Sécurisé" },
        ].map((stat, i) => (
          <div key={i}>
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#00d4ff",
                marginBottom: "10px",
              }}
            >
              {stat.number}
            </div>
            <div style={{ color: "#666" }}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Featured Products Section */}
      <section
        style={{
          maxWidth: "1400px",
          margin: "80px auto",
          padding: "0 30px",
        }}
      >
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <h2
            style={{ fontSize: "32px", marginBottom: "10px", color: "#1a1a2e" }}
          >
            Produits en vedette 🌟
          </h2>
          <p style={{ color: "#999" }}>
            Découvrez nos meilleures ventes et articles populaires
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {FEATURED_PRODUCTS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(p) => {
                logger.info("Added to cart:", p);
                alert(`${p.name} ajouté au panier!`);
              }}
              onViewDetails={() => {
                navigate("/products");
              }}
            />
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            onClick={() => navigate("/products")}
            data-track="home_see_all_products"
            style={{
              padding: "12px 30px",
              backgroundColor: "#f5f5f5",
              color: "#1a1a2e",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "16px",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#1a1a2e";
              e.target.style.color = "#00d4ff";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f5f5f5";
              e.target.style.color = "#1a1a2e";
            }}
          >
            Voir tous les produits →
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section
        style={{
          backgroundColor: "#f9f9f9",
          padding: "80px 30px",
          marginTop: "80px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontSize: "32px",
              textAlign: "center",
              marginBottom: "50px",
              color: "#1a1a2e",
            }}
          >
            Pourquoi choisir SmartStore? 💎
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "30px",
            }}
          >
            {[
              {
                icon: "🤖",
                title: "IA Personnalisée",
                desc: "Notre IA apprend de vos préférences pour des recommandations parfaites",
              },
              {
                icon: "🚚",
                title: "Livraison rapide",
                desc: "Livraison en 24-48h sur toute la France métropolitaine",
              },
              {
                icon: "🔒",
                title: "Sécurité garantie",
                desc: "Paiements sécurisés et protection des données certifiée",
              },
              {
                icon: "💰",
                title: "Meilleurs prix",
                desc: "Garantie du meilleur prix ou remboursement de la différence",
              },
              {
                icon: "⭐",
                title: "Exclusivités",
                desc: "Accès à des produits exclusifs et précommandes",
              },
              {
                icon: "👥",
                title: "Support 24/7",
                desc: "Équipe de support disponible 24h/24 pour vous aider",
              },
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  padding: "30px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  textAlign: "center",
                  transition: "all 0.3s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(0,212,255,0.1)";
                  e.currentTarget.style.borderColor = "#00d4ff";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#e0e0e0";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "15px" }}>
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    marginBottom: "10px",
                    color: "#1a1a2e",
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#999", margin: 0 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
          color: "white",
          padding: "60px 30px",
          textAlign: "center",
          marginTop: "80px",
        }}
      >
        <h2 style={{ fontSize: "32px", marginBottom: "15px" }}>
          Commencez votre expérience shopping maintenant! 🚀
        </h2>
        <p style={{ fontSize: "16px", marginBottom: "30px" }}>
          Rejoinez 10 000+ clients satisfaits et profitez des meilleurs prix
        </p>
        <button
          onClick={() => navigate("/products")}
          data-track="home_final_cta"
          style={{
            padding: "15px 40px",
            fontSize: "16px",
            backgroundColor: "white",
            color: "#00d4ff",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          Magasiner maintenant
        </button>
      </section>
    </div>
  );
};
