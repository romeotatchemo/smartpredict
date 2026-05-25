import React from "react";

export const AccountPage = () => {
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
          Mon Profil 👤
        </h1>
        <p
          style={{
            fontSize: "16px",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: "1.6",
          }}
        >
          Gérez vos informations personnelles et préférences
        </p>
      </section>

      {/* Main Content */}
      <div
        style={{ padding: "60px 40px", maxWidth: "1000px", margin: "0 auto" }}
      >
        {/* Profile Card */}
        <div
          style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "flex", gap: "40px", alignItems: "center" }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                backgroundColor: "#00d4ff",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "60px",
                flexShrink: 0,
              }}
            >
              👤
            </div>

            <div style={{ flex: 1 }}>
              <h2
                style={{
                  color: "#1a1a2e",
                  marginTop: "0",
                  marginBottom: "10px",
                }}
              >
                John Doe
              </h2>
              <p style={{ color: "#666", margin: "0 0 15px" }}>
                john.doe@example.com
              </p>
              <p
                style={{ color: "#999", margin: "0 0 20px", fontSize: "14px" }}
              >
                Membre depuis janvier 2024
              </p>
              <button
                data-track="account_edit_profile"
                style={{
                  padding: "10px 25px",
                  backgroundColor: "#00d4ff",
                  color: "#1a1a2e",
                  border: "none",
                  borderRadius: "6px",
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
                Modifier le Profil
              </button>
            </div>
          </div>
        </div>

        {/* Account Info Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p style={{ color: "#999", margin: "0 0 10px", fontSize: "12px" }}>
              📞 TÉLÉPHONE
            </p>
            <p
              style={{
                color: "#1a1a2e",
                margin: "0",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              +33 1 23 45 67 89
            </p>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p style={{ color: "#999", margin: "0 0 10px", fontSize: "12px" }}>
              📍 ADRESSE
            </p>
            <p
              style={{
                color: "#1a1a2e",
                margin: "0",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              Paris, France
            </p>
          </div>

          <div
            style={{
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p style={{ color: "#999", margin: "0 0 10px", fontSize: "12px" }}>
              💳 PLAN
            </p>
            <p
              style={{
                color: "#1a1a2e",
                margin: "0",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              Premium
            </p>
          </div>
        </div>

        {/* Settings Section */}
        <div
          style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{ color: "#1a1a2e", marginTop: "0", marginBottom: "30px" }}
          >
            Paramètres
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
              <span style={{ color: "#333" }}>Notifications par email</span>
              <input
                type="checkbox"
                defaultChecked
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
              <span style={{ color: "#333" }}>
                Partager les données pour améliorer l'IA
              </span>
              <input
                type="checkbox"
                defaultChecked
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
                Authentification à deux facteurs
              </span>
              <input type="checkbox" style={{ cursor: "pointer" }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
