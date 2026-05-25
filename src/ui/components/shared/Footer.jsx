import React from "react";
import { Link } from "react-router";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: "#1a1a2e",
        color: "#aaa",
        padding: "50px 30px 30px",
        marginTop: "80px",
        borderTop: "1px solid #333",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "40px",
          marginBottom: "40px",
        }}
      >
        {/* About */}
        <div>
          <h4 style={{ color: "white", marginBottom: "15px" }}>SmartStore</h4>
          <p style={{ fontSize: "14px", lineHeight: "1.6" }}>
            La meilleure plateforme de e-commerce avec IA intégrée pour une
            expérience personnalisée.
          </p>
          <div style={{ display: "flex", gap: "15px", marginTop: "15px" }}>
            <a
              href="#"
              data-track="footer_social_facebook"
              style={{ color: "#00d4ff", textDecoration: "none" }}
            >
              f
            </a>
            <a
              href="#"
              data-track="footer_social_twitter"
              style={{ color: "#00d4ff", textDecoration: "none" }}
            >
              𝕏
            </a>
            <a
              href="#"
              data-track="footer_social_linkedin"
              style={{ color: "#00d4ff", textDecoration: "none" }}
            >
              in
            </a>
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 style={{ color: "white", marginBottom: "15px" }}>Produits</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {["Tous les produits", "Promotions", "Nouveautés", "Best sellers"].map(
              (item, i) => (
                <li key={i} style={{ marginBottom: "8px" }}>
                  <Link
                    to="/products"
                    data-track={`footer_product_${item.toLowerCase()}`}
                    style={{
                      color: "#aaa",
                      textDecoration: "none",
                      fontSize: "14px",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#00d4ff")}
                    onMouseLeave={(e) => (e.target.style.color = "#aaa")}
                  >
                    {item}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 style={{ color: "white", marginBottom: "15px" }}>Entreprise</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {["À propos", "Blog", "Carrières", "Contact"].map((item, i) => (
              <li key={i} style={{ marginBottom: "8px" }}>
                <a
                  href="#"
                  data-track={`footer_company_${item.toLowerCase()}`}
                  style={{
                    color: "#aaa",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#00d4ff")}
                  onMouseLeave={(e) => (e.target.style.color = "#aaa")}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 style={{ color: "white", marginBottom: "15px" }}>Support</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {["Aide", "Retours", "Livraison", "FAQ"].map((item, i) => (
              <li key={i} style={{ marginBottom: "8px" }}>
                <a
                  href="#"
                  data-track={`footer_support_${item.toLowerCase()}`}
                  style={{
                    color: "#aaa",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#00d4ff")}
                  onMouseLeave={(e) => (e.target.style.color = "#aaa")}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #333",
          paddingTop: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
        }}
      >
        <p>&copy; {currentYear} SmartStore. Tous droits réservés.</p>
        <div style={{ display: "flex", gap: "20px" }}>
          <a
            href="#"
            data-track="footer_privacy"
            style={{ color: "#aaa", textDecoration: "none" }}
          >
            Confidentialité
          </a>
          <a
            href="#"
            data-track="footer_terms"
            style={{ color: "#aaa", textDecoration: "none" }}
          >
            Conditions
          </a>
          <a
            href="#"
            data-track="footer_cookies"
            style={{ color: "#aaa", textDecoration: "none" }}
          >
            Cookies
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
