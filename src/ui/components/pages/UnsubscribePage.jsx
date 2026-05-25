import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useSmartPredict } from "../../hooks/useSmartPredict";

export const UnsubscribePage = () => {
  const navigate = useNavigate();
  const { latestDecision } = useSmartPredict();
  const [step, setStep] = useState("reason"); // reason, offer, confirm, success
  const [selectedReason, setSelectedReason] = useState("");
  const [selectedOffer, setSelectedOffer] = useState("");

  const reasons = [
    { id: "expensive", label: "C'est trop cher pour mon budget actuel", icon: "💰" },
    { id: "features", label: "Je n'utilise pas assez de fonctionnalités", icon: "🎯" },
    { id: "found_cheaper", label: "J'ai trouvé une alternative moins chère", icon: "🔍" },
    { id: "not_needed", label: "Je n'en ai plus besoin pour le moment", icon: "⏸️" },
    { id: "support", label: "Le support client ne répond pas à mes attentes", icon: "📞" },
    { id: "other", label: "Autre raison", icon: "❓" },
  ];

  const offers = [
    {
      id: "discount",
      title: "50% de réduction",
      description: "Pour les 3 prochains mois",
      badge: "MEILLEURE OFFRE",
      icon: "🎁",
    },
    {
      id: "pause",
      title: "Mettre en pause",
      description: "Plutôt que résilier complètement",
      badge: "FLEXIBLE",
      icon: "⏸️",
    },
    {
      id: "downgrade",
      title: "Changer de plan",
      description: "Passer à un plan moins cher",
      badge: "ÉCONOMIQUE",
      icon: "📉",
    },
  ];

  const handleReasonSelect = (reasonId) => {
    setSelectedReason(reasonId);
    // Show offer in 1 second
    setTimeout(() => setStep("offer"), 800);
  };

  const handleOfferSelect = (offerId) => {
    setSelectedOffer(offerId);
    setTimeout(() => setStep("confirm"), 800);
  };

  const handleConfirmCancel = () => {
    setStep("success");
  };

  const handleStayWithUs = () => {
    navigate("/");
  };

  return (
    <div style={{ backgroundColor: "#f9f9f9", minHeight: "calc(100vh - 60px)" }}>
      {step === "reason" && (
        <section style={{ padding: "60px 40px", maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>😢</div>
            <h1 style={{ color: "#1a1a2e", fontSize: "36px", marginBottom: "10px" }}>
              Avant de partir...
            </h1>
            <p style={{ color: "#666", fontSize: "16px", marginBottom: "0" }}>
              Nous aimerions comprendre pourquoi vous envisagez de nous quitter.
              Cela nous aide à nous améliorer.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            {reasons.map((reason) => (
              <button
                key={reason.id}
                onClick={() => handleReasonSelect(reason.id)}
                data-track={`unsubscribe_reason_${reason.id}`}
                style={{
                  padding: "20px",
                  backgroundColor: "white",
                  border: `2px solid ${selectedReason === reason.id ? "#00d4ff" : "#e0e0e0"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#00d4ff";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0, 212, 255, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    selectedReason === reason.id ? "#00d4ff" : "#e0e0e0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>
                  {reason.icon}
                </div>
                <p style={{ color: "#1a1a2e", margin: "0", fontWeight: "500", fontSize: "14px" }}>
                  {reason.label}
                </p>
              </button>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <button
              onClick={handleStayWithUs}
              data-track="unsubscribe_keep_browsing"
              style={{
                padding: "12px 30px",
                backgroundColor: "#f0f0f0",
                color: "#1a1a2e",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Continuer la Navigation
            </button>
          </div>

          {latestDecision && (
            <div
              style={{
                marginTop: "40px",
                padding: "20px",
                backgroundColor: "#f8d7da",
                border: "1px solid #f5c6cb",
                borderRadius: "4px",
                color: "#721c24",
              }}
            >
              <strong>🚨 Intervention de l'IA : {latestDecision.action}</strong>
              <p style={{ margin: "10px 0 0", fontSize: "14px" }}>
                Nous avons identifié que vous pourriez bénéficier d'une offre spéciale basée sur
                votre historique.
              </p>
            </div>
          )}
        </section>
      )}

      {step === "offer" && (
        <section style={{ padding: "60px 40px", maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🎁</div>
            <h1 style={{ color: "#1a1a2e", fontSize: "36px", marginBottom: "10px" }}>
              Nous avons une offre pour vous
            </h1>
            <p style={{ color: "#666", fontSize: "16px", marginBottom: "0" }}>
              Choisissez l'option qui vous convient le mieux
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "30px",
            }}
          >
            {offers.map((offer) => (
              <button
                key={offer.id}
                onClick={() => handleOfferSelect(offer.id)}
                data-track={`unsubscribe_offer_${offer.id}`}
                style={{
                  padding: "30px 20px",
                  backgroundColor:
                    selectedOffer === offer.id
                      ? "linear-gradient(135deg, #00d4ff 0%, rgba(0,212,255,0.1) 100%)"
                      : "white",
                  border:
                    selectedOffer === offer.id
                      ? "2px solid #00d4ff"
                      : "2px solid #e0e0e0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#00d4ff";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(0, 212, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    selectedOffer === offer.id ? "#00d4ff" : "#e0e0e0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {offer.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      backgroundColor: offer.badge === "MEILLEURE OFFRE" ? "#ff6b6b" : "#ffd700",
                      color: "white",
                      padding: "4px 12px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      transform: "rotate(45deg)",
                      transformOrigin: "top right",
                    }}
                  >
                    {offer.badge}
                  </div>
                )}
                <div style={{ fontSize: "40px", marginBottom: "15px" }}>
                  {offer.icon}
                </div>
                <h3 style={{ color: "#1a1a2e", marginBottom: "10px", fontSize: "18px" }}>
                  {offer.title}
                </h3>
                <p style={{ color: "#666", margin: "0", fontSize: "14px" }}>
                  {offer.description}
                </p>
              </button>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <button
              onClick={() => setStep("confirm")}
              data-track="unsubscribe_skip_offer"
              style={{
                padding: "12px 30px",
                backgroundColor: "#f0f0f0",
                color: "#1a1a2e",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Continuer sans offre
            </button>
          </div>
        </section>
      )}

      {step === "confirm" && (
        <section style={{ padding: "60px 40px", maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
            <h1 style={{ color: "#dc3545", fontSize: "32px", marginBottom: "10px" }}>
              Confirmer la Résiliation
            </h1>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "0" }}>
              Êtes-vous sûr de vouloir résilier votre abonnement ? Vous perdrez l'accès à tous les
              services.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "30px",
            }}
          >
            <p style={{ color: "#856404", margin: "0", fontSize: "14px", lineHeight: "1.6" }}>
              <strong>⚡ À savoir :</strong> Vos données seront supprimées après 30 jours.
              Vous pouvez réactiver votre compte pendant cette période.
            </p>
          </div>

          <div style={{ display: "flex", gap: "15px" }}>
            <button
              onClick={handleConfirmCancel}
              data-track="unsubscribe_confirm_cancel"
              style={{
                flex: 1,
                padding: "15px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#c82333";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#dc3545";
              }}
            >
              Oui, Résilier
            </button>
            <button
              onClick={handleStayWithUs}
              data-track="unsubscribe_confirm_stay"
              style={{
                flex: 1,
                padding: "15px",
                backgroundColor: "#f0f0f0",
                color: "#1a1a2e",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Je Reste
            </button>
          </div>
        </section>
      )}

      {step === "success" && (
        <section style={{ padding: "60px 40px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>✅</div>
          <h1 style={{ color: "#1a1a2e", fontSize: "32px", marginBottom: "10px" }}>
            C'est fait !
          </h1>
          <p style={{ color: "#666", fontSize: "16px", marginBottom: "30px" }}>
            Votre abonnement a été résilié. Vous pouvez réactiver votre compte dans les 30 jours
            si vous changez d'avis.
          </p>

          <div
            style={{
              backgroundColor: "#e6f7ff",
              borderLeft: "5px solid #00d4ff",
              padding: "20px",
              borderRadius: "4px",
              marginBottom: "30px",
              textAlign: "left",
            }}
          >
            <p style={{ color: "#0651a0", margin: "0", fontSize: "14px", lineHeight: "1.6" }}>
              <strong>📧 Vérifiez votre email</strong> pour les détails de la résiliation et comment
              récupérer votre compte si besoin.
            </p>
          </div>

          <button
            onClick={handleStayWithUs}
            data-track="unsubscribe_success_home"
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
            Retour à l'Accueil
          </button>
        </section>
      )}
    </div>
  );
};
