import React from "react";
import { useSmartPredict } from "../../hooks/useSmartPredict";

const TeamMember = ({ name, role, emoji }) => (
  <div
    style={{
      backgroundColor: "#f5f5f5",
      padding: "20px",
      borderRadius: "8px",
      textAlign: "center",
      border: "1px solid #e0e0e0",
      transition: "all 0.3s ease",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 212, 255, 0.2)";
      e.currentTarget.style.borderColor = "#00d4ff";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = "#e0e0e0";
    }}
  >
    <div style={{ fontSize: "48px", marginBottom: "10px" }}>{emoji}</div>
    <h4 style={{ margin: "10px 0 5px", color: "#1a1a2e" }}>{name}</h4>
    <p style={{ margin: "0", color: "#666", fontSize: "14px" }}>{role}</p>
  </div>
);

const ValueCard = ({ title, description, icon }) => (
  <div
    style={{
      backgroundColor: "white",
      padding: "30px",
      borderRadius: "8px",
      textAlign: "center",
      border: "2px solid #f0f0f0",
      transition: "all 0.3s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "#00d4ff";
      e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 212, 255, 0.15)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "#f0f0f0";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    <div style={{ fontSize: "40px", marginBottom: "15px" }}>{icon}</div>
    <h3 style={{ color: "#1a1a2e", marginBottom: "10px" }}>{title}</h3>
    <p style={{ color: "#666", margin: "0", fontSize: "14px", lineHeight: "1.6" }}>
      {description}
    </p>
  </div>
);

export const AboutPage = () => {
  const { latestDecision } = useSmartPredict();

  return (
    <div style={{ backgroundColor: "#f9f9f9" }}>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #00d4ff 100%)",
          color: "white",
          padding: "80px 40px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "48px", marginBottom: "20px", fontWeight: "bold" }}>
          À Propos de SmartStore
        </h1>
        <p style={{ fontSize: "18px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
          Nous révolutionnons le commerce électronique avec l'intelligence artificielle,
          offrant des expériences personnalisées et des décisions intelligentes.
        </p>
      </section>

      {/* Mission & Vision */}
      <section style={{ padding: "60px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            marginBottom: "60px",
          }}
        >
          <div>
            <h2 style={{ color: "#1a1a2e", marginBottom: "20px" }}>🎯 Notre Mission</h2>
            <p style={{ color: "#666", lineHeight: "1.8", fontSize: "16px" }}>
              Utiliser l'intelligence artificielle pour permettre aux entreprises de mieux comprendre
              leurs clients et de prendre des décisions plus intelligentes. Nous croyons que chaque client
              mérite une expérience personnalisée et optimisée.
            </p>
            <p style={{ color: "#666", lineHeight: "1.8", fontSize: "16px" }}>
              Notre technologie s'adapte en temps réel pour offrir les meilleures recommandations,
              contentant ainsi les clients et maximisant la satisfaction.
            </p>
          </div>

          <div>
            <h2 style={{ color: "#1a1a2e", marginBottom: "20px" }}>🚀 Notre Vision</h2>
            <p style={{ color: "#666", lineHeight: "1.8", fontSize: "16px" }}>
              Devenir le leader mondial des solutions IA pour le commerce électronique. Nous voulons
              transformer chaque interaction client en opportunité d'apprentissage et d'amélioration.
            </p>
            <p style={{ color: "#666", lineHeight: "1.8", fontSize: "16px" }}>
              En 2030, nous imaginez un écosystème où l'IA anticipe les besoins avant même que les clients
              ne les réalisent, créant ainsi des expériences véritablement magiques.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section style={{ padding: "60px 40px", backgroundColor: "white" }}>
        <h2
          style={{
            textAlign: "center",
            color: "#1a1a2e",
            marginBottom: "50px",
            fontSize: "32px",
          }}
        >
          Nos Valeurs Fondamentales
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "30px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <ValueCard
            icon="🤖"
            title="Intelligence"
            description="Nous maîtrisons les technologies d'IA et d'apprentissage automatique pour offrir les meilleures solutions."
          />
          <ValueCard
            icon="💡"
            title="Innovation"
            description="Nous repoussons les limites en créant des solutions qui changent le marché."
          />
          <ValueCard
            icon="🤝"
            title="Intégrité"
            description="Nous agissons avec honnêteté et transparence dans toutes nos relations."
          />
          <ValueCard
            icon="🌍"
            title="Impact"
            description="Nous mesurons notre succès par l'impact positif que nous créons."
          />
          <ValueCard
            icon="⚡"
            title="Excellence"
            description="Nous ne nous arrêtons jamais à « assez bien », nous recherchons toujours mieux."
          />
          <ValueCard
            icon="🔒"
            title="Confiance"
            description="Les données de nos clients sont notre priorité absolue. Nous les protégeons comme les nôtres."
          />
        </div>
      </section>

      {/* Team Section */}
      <section style={{ padding: "60px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <h2
          style={{
            textAlign: "center",
            color: "#1a1a2e",
            marginBottom: "50px",
            fontSize: "32px",
          }}
        >
          Rencontrez Notre Équipe
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "30px",
          }}
        >
          <TeamMember name="Dr. Alice Laurent" role="CEO & Co-Founder" emoji="👨‍💼" />
          <TeamMember name="Thomas Bernard" role="CTO & Co-Founder" emoji="👨‍💻" />
          <TeamMember name="Émilie Dupont" role="VP Product" emoji="👩‍🔬" />
          <TeamMember name="Michel Chevalier" role="VP Engineering" emoji="👨‍⚙️" />
          <TeamMember name="Sophie Martin" role="Head of Sales" emoji="👩‍💼" />
          <TeamMember name="Jean Dubois" role="Head of Support" emoji="👨‍💬" />
        </div>
      </section>

      {/* Stats Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, rgba(0, 212, 255, 0.1) 100%)",
          padding: "60px 40px",
          marginTop: "80px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "40px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {[
            { number: "10 000+", label: "Clients Satisfaits" },
            { number: "50 000+", label: "Produits Gérés" },
            { number: "99.9%", label: "Disponibilité" },
            { number: "2010", label: "Fondée" },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                textAlign: "center",
                padding: "20px",
              }}
              onClick={() => {
                document.body.dispatchEvent(
                  new CustomEvent("track", { detail: { action: "about_stat_click" } })
                );
              }}
            >
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
              <div style={{ color: "white", fontSize: "16px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "60px 40px", textAlign: "center" }}>
        <h2 style={{ color: "#1a1a2e", marginBottom: "20px", fontSize: "32px" }}>
          Prêt à Transformer Votre Commerce ?
        </h2>
        <p style={{ color: "#666", marginBottom: "30px", fontSize: "16px" }}>
          Rejoignez des milliers d'entreprises qui utilisent SmartStore pour croître.
        </p>
        <button
          data-track="about_contact_cta"
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
          Commencer Maintenant
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
