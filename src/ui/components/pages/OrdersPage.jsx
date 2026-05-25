import React from "react";

export const OrdersPage = () => {
  const orders = [
    {
      id: "ORD-001",
      date: "15 Mars 2024",
      status: "Livré",
      total: 299.99,
      items: 2,
    },
    {
      id: "ORD-002",
      date: "10 Mars 2024",
      status: "En cours",
      total: 99.99,
      items: 1,
    },
    {
      id: "ORD-003",
      date: "5 Mars 2024",
      status: "Livré",
      total: 499.99,
      items: 3,
    },
  ];

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
          Mes Commandes 📦
        </h1>
        <p
          style={{
            fontSize: "16px",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: "1.6",
          }}
        >
          Consultez l'historique de vos commandes et suivez leur statut
        </p>
      </section>

      {/* Main Content */}
      <div
        style={{ padding: "60px 40px", maxWidth: "1000px", margin: "0 auto" }}
      >
        {orders.length > 0 ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  backgroundColor: "white",
                  padding: "25px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(0, 212, 255, 0.2)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div>
                  <h3 style={{ color: "#1a1a2e", margin: "0 0 8px" }}>
                    {order.id}
                  </h3>
                  <p
                    style={{
                      color: "#666",
                      margin: "0 0 8px",
                      fontSize: "14px",
                    }}
                  >
                    {order.date} • {order.items} produit
                    {order.items > 1 ? "s" : ""}
                  </p>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      backgroundColor:
                        order.status === "Livré" ? "#d4edda" : "#e2e3e5",
                      color: order.status === "Livré" ? "#155724" : "#383d41",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {order.status === "Livré" ? "✅ " : "⏳ "}
                    {order.status}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      color: "#00d4ff",
                      margin: "0",
                      fontSize: "24px",
                      fontWeight: "bold",
                    }}
                  >
                    {order.total.toFixed(2)}€
                  </p>
                  <button
                    data-track="order_detail_view"
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#1a1a2e",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      marginTop: "10px",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#00d4ff";
                      e.currentTarget.style.color = "#1a1a2e";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1a1a2e";
                      e.currentTarget.style.color = "white";
                    }}
                  >
                    Voir les détails
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "white",
              padding: "60px 40px",
              borderRadius: "8px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p style={{ color: "#999", fontSize: "16px", margin: "0" }}>
              Vous n'avez pas encore de commandes
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
