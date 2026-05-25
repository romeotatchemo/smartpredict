import React from "react";
import { useSmartPredict } from "../../hooks/useSmartPredict";

const ServiceCard = ({ title, description, features, icon, color }) => (
  <div
    style={{
      backgroundColor: "white",
      padding: "40px",
      borderRadius: "8px",
      border: `3px solid ${color}20`,
      transition: "all 0.3s ease",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = `0 12px 30px ${color}30`;
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.transform = "translateY(-4px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = `${color}20`;
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div style={{ fontSize: "40px", marginBottom: "15px" }}>{icon}</div>
    <h3 style={{ color: "#1a1a2e", marginBottom: "10px", fontSize: "20px" }}>
      {title}
    </h3>
    <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px", lineHeight: "1.6" }}>
      {description}
    </p>
    <div style={{ marginBottom: "20px" }}>
      {features.map((feature, idx) => (
        <div key={idx} style={{ color: "#666", marginBottom: "10px", fontSize: "14px" }}>
          ✓ {feature}
        </div>
      ))}
    </div>
    <button
      data-track={`service_${title.toLowerCase().replace(/\s+/g, "_")}_details`}
      style={{
        padding: "10px 20px",
        backgroundColor: color,
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "bold",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.9";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
    >
      En Savoir Plus →
    </button>
  </div>
);

export const ServicesPage = () => {
  const { latestDecision } = useSmartPredict();

  const services = [
    {
      title: "Analyse Prédictive",
      description:
        "Prédisez les comportements clients avec une précision millimétrique. Notre IA analyse les patterns historiques pour anticiper les décisions futures.",
      features: [
        "Prédictions en temps réel",
        "Taux de précision > 95%",
        "Intégration API facile",
        "Tableau de bord analytics",
      ],
      icon: "🔮",
      color: "#00d4ff",
    },
    {
      title: "Recommandations IA",
      description:
        "Augmentez vos ventes avec des recommandations produits ultra-pertinentes basées sur le machine learning.",
      features: [
        "Augmentation AOV +35%",
        "Taux de conversion +20%",
        "Personnalisation par utilisateur",
        "A/B testing intégré",
      ],
      icon: "💡",
      color: "#ffd700",
    },
    {
      title: "Détection de Risques",
      description:
        "Identifiez et prévenez les risques de churn, fraude et anomalies. Protection proactive de votre business.",
      features: [
        "Détection fraud en temps réel",
        "Prédiction churn précise",
        "Alertes automatiques",
        "Rapports détaillés",
      ],
      icon: "🛡️",
      color: "#ff6b6b",
    },
    {
      title: "Optimisation de Pricing",
      description:
        "Maximisez vos revenus avec une stratégie de prix dynamique et intelligente adaptée à chaque client.",
      features: [
        "Pricing dynamique",
        "Augmentation revenue +25%",
        "Compétitivité marché",
        "Elasticité prix analyée",
      ],
      icon: "💰",
      color: "#51cf66",
    },
    {
      title: "Segmentation Client",
      description:
        "Divisez votre base client en segments sophistiqués pour mieux les comprendre et les servir.",
      features: [
        "Clustering automatique",
        "Profils détaillés",
        "Comportement prédictif",
        "Stratégies ciblées",
      ],
      icon: "👥",
      color: "#9775fa",
    },
    {
      title: "Support 24/7",
      description:
        "Notre équipe d'experts est disponible pour vous aider à tout moment avec implémenter et optimiser vos solutions.",
      features: [
        "Support dédié 24/7",
        "Onboarding personnalisé",
        "Formation équipe",
        "Optimisation continue",
      ],
      icon: "🎯",
      color: "#ff8c42",
    },
  ];

  return (
    <div style={{ backgroundColor: "#f9f9f9" }}>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #00d4ff 100%)",
          color: "white",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "40px", marginBottom: "20px", fontWeight: "bold" }}>
          Nos Services Intelligents 🚀
        </h1>
        <p style={{ fontSize: "16px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
          Découvrez nos solutions IA conçues pour transformer votre entreprise et maximiser vos résultats
        </p>
      </section>

      {/* Services Grid */}
      <section style={{ padding: "60px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px",
          }}
        >
          {services.map((service, idx) => (
            <ServiceCard key={idx} {...service} />
          ))}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section style={{ padding: "60px 40px", backgroundColor: "white" }}>
        <h2
          style={{
            textAlign: "center",
            color: "#1a1a2e",
            marginBottom: "50px",
            fontSize: "32px",
          }}
        >
          Pourquoi Nous Choisir ?
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          {[
            { icon: "⚡", title: "Rapide", text: "Implémentation en moins de 48 heures" },
            { icon: "🎯", title: "Précis", text: "Modèles entraînés sur des millions de transactions" },
            { icon: "📈", title: "Évolutif", text: "Grandit avec votre business, peu importe la taille" },
            { icon: "🔒", title: "Sécurisé", text: "Conformité RGPD et normes de sécurité internationales" },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: "20px",
                borderBottom: "3px solid #00d4ff",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>{item.icon}</div>
              <h3 style={{ color: "#1a1a2e", marginBottom: "10px" }}>{item.title}</h3>
              <p style={{ color: "#666", margin: "0", fontSize: "14px" }}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, rgba(0, 212, 255, 0.1) 100%)",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "white", marginBottom: "20px", fontSize: "32px" }}>
          Prêt à Transformer Votre Business ?
        </h2>
        <p style={{ color: "#f0f0f0", marginBottom: "30px", fontSize: "16px" }}>
          Contactez notre équipe pour une démonstration gratuite et sans engagement.
        </p>
        <button
          data-track="services_contact_cta"
          style={{
            padding: "15px 40px",
            backgroundColor: "#00d4ff",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
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
          Demander une Démo
        </button>
      </section>

      {/* AI Recommendation */}
      {latestDecision && (
        <div
          style={{
            maxWidth: "1200px",
            margin: "40px auto",
            padding: "20px",
            backgroundColor: "#e6f7ff",
            borderLeft: "5px solid #00d4ff",
            borderRadius: "4px",
          }}
        >
          <strong>💡 Recommandation IA : {latestDecision.action}</strong>
        </div>
      )}
    </div>
  );
};
