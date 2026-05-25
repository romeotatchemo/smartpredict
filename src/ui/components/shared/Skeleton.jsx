import React from "react";

/**
 * Skeleton Loader pour produits
 */
export const Skeleton = () => {
  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        overflow: "hidden",
        animation: "pulse 2s infinite",
      }}
    >
      <div
        style={{
          backgroundColor: "#f0f0f0",
          height: "220px",
          marginBottom: "16px",
        }}
      />
      <div style={{ padding: "16px" }}>
        <div
          style={{
            height: "16px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        />
        <div
          style={{
            height: "12px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        />
        <div
          style={{
            height: "20px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: "40px",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
            }}
          />
          <div
            style={{
              flex: 1,
              height: "40px",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
