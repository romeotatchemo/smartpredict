import React, { useState } from "react";

export const ProfilePage = () => {
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+33 1 23 45 67 89",
    company: "Tech Corp",
    address: "123 Rue de Paris",
    city: "Paris",
    country: "France",
    zipCode: "75000",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setSavedMessage(true);
    setIsEditing(false);
    setTimeout(() => setSavedMessage(false), 3000);
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
          Modifier le Profil 👤
        </h1>
        <p
          style={{
            fontSize: "16px",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: "1.6",
          }}
        >
          Mettez à jour vos informations personnelles
        </p>
      </section>

      {/* Main Content */}
      <div
        style={{ padding: "60px 40px", maxWidth: "800px", margin: "0 auto" }}
      >
        {savedMessage && (
          <div
            style={{
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              color: "#155724",
              padding: "15px",
              borderRadius: "6px",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            ✅ Profil mis à jour avec succès!
          </div>
        )}

        <div
          style={{
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Profile Avatar */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#00d4ff",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "50px",
                margin: "0 auto 15px",
              }}
            >
              👤
            </div>
            <p
              style={{
                color: "#999",
                margin: "0",
                fontSize: "14px",
              }}
            >
              {profile.firstName} {profile.lastName}
            </p>
          </div>

          {/* Form Fields */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            {/* First Name */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "#1a1a2e",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                Prénom
              </label>
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                data-track="profile_firstname_edit"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: isEditing ? "2px solid #00d4ff" : "1px solid #e0e0e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  backgroundColor: isEditing ? "white" : "#f5f5f5",
                  cursor: isEditing ? "text" : "default",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "#1a1a2e",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                Nom
              </label>
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                disabled={!isEditing}
                data-track="profile_lastname_edit"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: isEditing ? "2px solid #00d4ff" : "1px solid #e0e0e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  backgroundColor: isEditing ? "white" : "#f5f5f5",
                  cursor: isEditing ? "text" : "default",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                color: "#1a1a2e",
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              disabled={!isEditing}
              data-track="profile_email_edit"
              style={{
                width: "100%",
                padding: "10px",
                border: isEditing ? "2px solid #00d4ff" : "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: isEditing ? "white" : "#f5f5f5",
                cursor: isEditing ? "text" : "default",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                color: "#1a1a2e",
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              Téléphone
            </label>
            <input
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              disabled={!isEditing}
              data-track="profile_phone_edit"
              style={{
                width: "100%",
                padding: "10px",
                border: isEditing ? "2px solid #00d4ff" : "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: isEditing ? "white" : "#f5f5f5",
                cursor: isEditing ? "text" : "default",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Company */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                color: "#1a1a2e",
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              Entreprise
            </label>
            <input
              type="text"
              name="company"
              value={profile.company}
              onChange={handleChange}
              disabled={!isEditing}
              data-track="profile_company_edit"
              style={{
                width: "100%",
                padding: "10px",
                border: isEditing ? "2px solid #00d4ff" : "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: isEditing ? "white" : "#f5f5f5",
                cursor: isEditing ? "text" : "default",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Address */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                color: "#1a1a2e",
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              Adresse
            </label>
            <input
              type="text"
              name="address"
              value={profile.address}
              onChange={handleChange}
              disabled={!isEditing}
              data-track="profile_address_edit"
              style={{
                width: "100%",
                padding: "10px",
                border: isEditing ? "2px solid #00d4ff" : "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: isEditing ? "white" : "#f5f5f5",
                cursor: isEditing ? "text" : "default",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* City & Zip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  color: "#1a1a2e",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                Ville
              </label>
              <input
                type="text"
                name="city"
                value={profile.city}
                onChange={handleChange}
                disabled={!isEditing}
                data-track="profile_city_edit"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: isEditing ? "2px solid #00d4ff" : "1px solid #e0e0e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  backgroundColor: isEditing ? "white" : "#f5f5f5",
                  cursor: isEditing ? "text" : "default",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  color: "#1a1a2e",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >
                Code Postal
              </label>
              <input
                type="text"
                name="zipCode"
                value={profile.zipCode}
                onChange={handleChange}
                disabled={!isEditing}
                data-track="profile_zipcode_edit"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: isEditing ? "2px solid #00d4ff" : "1px solid #e0e0e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  backgroundColor: isEditing ? "white" : "#f5f5f5",
                  cursor: isEditing ? "text" : "default",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Country */}
          <div style={{ marginBottom: "30px" }}>
            <label
              style={{
                display: "block",
                color: "#1a1a2e",
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              Pays
            </label>
            <input
              type="text"
              name="country"
              value={profile.country}
              onChange={handleChange}
              disabled={!isEditing}
              data-track="profile_country_edit"
              style={{
                width: "100%",
                padding: "10px",
                border: isEditing ? "2px solid #00d4ff" : "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: isEditing ? "white" : "#f5f5f5",
                cursor: isEditing ? "text" : "default",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                data-track="profile_edit_start"
                style={{
                  flex: 1,
                  padding: "12px",
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
                ✏️ Modifier
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  data-track="profile_edit_save"
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#51cf66",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 8px 20px rgba(81, 207, 102, 0.3)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  💾 Enregistrer
                </button>

                <button
                  onClick={() => setIsEditing(false)}
                  data-track="profile_edit_cancel"
                  style={{
                    flex: 1,
                    padding: "12px",
                    backgroundColor: "#e0e0e0",
                    color: "#666",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#d0d0d0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#e0e0e0";
                  }}
                >
                  ✕ Annuler
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
