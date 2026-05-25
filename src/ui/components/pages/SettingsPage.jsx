import React, { useState } from "react";
import { logger } from "../../../engine/utils/logger.js";

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    dataSharing: true,
    twoFactor: false,
    marketingEmails: true,
    theme: "dark",
    language: "fr",
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      style={{ backgroundColor: "#f9f9f9", minHeight: "calc(100vh - 60px)" }}
    >
      {/* Hero Section */}
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
          Paramètres ⚙️
        </h1>
        <p
          style={{
            fontSize: "16px",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: "1.6",
          }}
        >
          Personnalisez votre expérience SmartStore
        </p>
      </section>

      {/* Main Content */}
      <div
        style={{ padding: "60px 40px", maxWidth: "800px", margin: "0 auto" }}
      >
        {/* General Settings */}
        <div
          style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <h2
            style={{ color: "#1a1a2e", marginTop: "0", marginBottom: "30px" }}
          >
            Paramètres Généraux
          </h2>

          {/* Language */}
          <div
            style={{
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "20px",
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span style={{ color: "#1a1a2e", fontWeight: "bold" }}>
                Langue
              </span>
              <select
                value={settings.language}
                onChange={(e) => handleSelectChange("language", e.target.value)}
                data-track="settings_language_change"
                style={{
                  padding: "10px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </label>
          </div>

          {/* Theme */}
          <div style={{ paddingBottom: "20px" }}>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <span style={{ color: "#1a1a2e", fontWeight: "bold" }}>
                Thème
              </span>
              <select
                value={settings.theme}
                onChange={(e) => handleSelectChange("theme", e.target.value)}
                data-track="settings_theme_change"
                style={{
                  padding: "10px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              >
                <option value="dark">Mode sombre</option>
                <option value="light">Mode clair</option>
                <option value="auto">Auto</option>
              </select>
            </label>
          </div>
        </div>

        {/* Notification Settings */}
        <div
          style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <h2
            style={{ color: "#1a1a2e", marginTop: "0", marginBottom: "30px" }}
          >
            Notifications
          </h2>

          <div
            style={{
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "20px",
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <span style={{ color: "#333" }}>📧 Notifications par email</span>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleToggle("emailNotifications")}
                data-track="settings_email_notifications"
                style={{ cursor: "pointer" }}
              />
            </label>
          </div>

          <div
            style={{
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "20px",
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <span style={{ color: "#333" }}>📬 Email marketing</span>
              <input
                type="checkbox"
                checked={settings.marketingEmails}
                onChange={() => handleToggle("marketingEmails")}
                data-track="settings_marketing_emails"
                style={{ cursor: "pointer" }}
              />
            </label>
          </div>
        </div>

        {/* Privacy & Security */}
        <div
          style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <h2
            style={{ color: "#1a1a2e", marginTop: "0", marginBottom: "30px" }}
          >
            Confidentialité & Sécurité
          </h2>

          <div
            style={{
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "20px",
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <span style={{ color: "#333" }}>
                🔒 Authentification à deux facteurs
              </span>
              <input
                type="checkbox"
                checked={settings.twoFactor}
                onChange={() => handleToggle("twoFactor")}
                data-track="settings_2fa"
                style={{ cursor: "pointer" }}
              />
            </label>
          </div>

          <div style={{ paddingBottom: "20px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <span style={{ color: "#333" }}>
                📊 Partager les données pour améliorer l'IA
              </span>
              <input
                type="checkbox"
                checked={settings.dataSharing}
                onChange={() => handleToggle("dataSharing")}
                data-track="settings_data_sharing"
                style={{ cursor: "pointer" }}
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={() => logger.info("Paramètres sauvegardés:", settings)}
          data-track="settings_save"
          style={{
            width: "100%",
            padding: "15px",
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
            e.currentTarget.style.boxShadow =
              "0 8px 20px rgba(0, 212, 255, 0.3)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Enregistrer les paramètres
        </button>
      </div>
    </div>
  );
};
