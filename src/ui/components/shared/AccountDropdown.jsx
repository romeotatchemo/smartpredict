/**
 * Account Dropdown Component
 * Replaces the /account link with a proper dropdown menu
 */
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router";

export const AccountDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-track="header_account_click"
        style={{
          textDecoration: "none",
          fontSize: "20px",
          cursor: "pointer",
          backgroundColor: "transparent",
          border: "none",
          padding: "8px",
          borderRadius: "4px",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 212, 255, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        👤
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: "0",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
            minWidth: "220px",
            zIndex: 1000,
            marginTop: "8px",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #e0e0e0",
              fontSize: "12px",
              color: "#999",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            Mon Compte
          </div>

          {/* Menu Items */}
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            data-track="account_dropdown_profile"
            style={{
              display: "block",
              padding: "12px 16px",
              color: "#333",
              textDecoration: "none",
              transition: "all 0.2s ease",
              borderBottom: "1px solid #f0f0f0",
              fontSize: "14px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
              e.currentTarget.style.color = "#00d4ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#333";
            }}
          >
            <span style={{ marginRight: "8px" }}>👤</span>
            Mon Profil
          </Link>

          <Link
            to="/orders"
            onClick={() => setIsOpen(false)}
            data-track="account_dropdown_orders"
            style={{
              display: "block",
              padding: "12px 16px",
              color: "#333",
              textDecoration: "none",
              transition: "all 0.2s ease",
              borderBottom: "1px solid #f0f0f0",
              fontSize: "14px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
              e.currentTarget.style.color = "#00d4ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#333";
            }}
          >
            <span style={{ marginRight: "8px" }}>📦</span>
            Mes Commandes
          </Link>

          <Link
            to="/settings"
            onClick={() => setIsOpen(false)}
            data-track="account_dropdown_settings"
            style={{
              display: "block",
              padding: "12px 16px",
              color: "#333",
              textDecoration: "none",
              transition: "all 0.2s ease",
              borderBottom: "1px solid #f0f0f0",
              fontSize: "14px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
              e.currentTarget.style.color = "#00d4ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#333";
            }}
          >
            <span style={{ marginRight: "8px" }}>⚙️</span>
            Paramètres
          </Link>

          <Link
            to="/unsubscribe"
            onClick={() => setIsOpen(false)}
            data-track="account_dropdown_unsubscribe"
            style={{
              display: "block",
              padding: "12px 16px",
              color: "#ff6b6b",
              textDecoration: "none",
              transition: "all 0.2s ease",
              fontSize: "14px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#fff5f5";
              e.currentTarget.style.color = "#ff0000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#ff6b6b";
            }}
          >
            <span style={{ marginRight: "8px" }}>👋</span>
            Se Désabonner
          </Link>
        </div>
      )}
    </div>
  );
};
