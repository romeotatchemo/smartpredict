import React from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useSmartPredict } from "../../hooks/useSmartPredict";
import { AccountDropdown } from "./AccountDropdown";
import { ModelLoadWidget } from "../ModelLoadWidget";

const Header = () => {
  const location = useLocation();
  const { latestDecision } = useSmartPredict();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Accueil" },
    { path: "/products", label: "Produits" },
    { path: "/pricing", label: "Tarifs" },
    { path: "/about", label: "À propos" },
    { path: "/training", label: "🤖 Entraînement" },
    { path: "/vision", label: "👁️ Vision" },
    { path: "/nlp", label: "📝 NLP" },
    { path: "/benchmark", label: "⚡ Benchmark" },
  ];

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? "#00d4ff" : "white",
    textDecoration: "none",
    fontWeight: isActive ? "bold" : "normal",
    transition: "color 0.3s",
    padding: "8px 0",
    borderBottom: isActive ? "2px solid #00d4ff" : "none",
    cursor: "pointer",
  });

  return (
    <header
      style={{
        backgroundColor: "#1a1a2e",
        color: "white",
        padding: "0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "15px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          data-track="header_logo_click"
          style={{
            textDecoration: "none",
            color: "white",
            fontSize: "24px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "28px" }}>🛍️</span>
          <span>SmartStore</span>
        </Link>

        {/* AI Badge */}
        {latestDecision && (
          <span
            style={{
              backgroundColor: "rgba(0, 212, 255, 0.2)",
              color: "#00d4ff",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            🤖 IA Active
          </span>
        )}

        {/* Navigation */}
        <nav style={{ display: "flex", gap: "30px", alignItems: "center" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={navLinkStyle}
              data-track={`nav_${item.label.toLowerCase()}_click`}
            >
              {item.label}
            </NavLink>
          ))}

          {/* Cart Icon */}
          <Link
            to="/cart"
            data-track="header_cart_click"
            style={{
              position: "relative",
              textDecoration: "none",
              fontSize: "24px",
              cursor: "pointer",
            }}
          >
            🛒
          </Link>

          {/* Account Dropdown */}
          <AccountDropdown />
        </nav>
      </div>
      {/* <ModelLoadWidget /> */}
    </header>
  );
};

export default Header;
