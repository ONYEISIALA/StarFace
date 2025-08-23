import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(isUnlocked());

  useEffect(() => {
    const t = setInterval(() => setUnlocked(isUnlocked()), 1000);
    return () => clearInterval(t);
  }, []);

  const featureCards = [
    { label: "StarFace Social", icon: "🌍", route: "/social", color: "#38bdf8" },
    { label: "Create Avatar", icon: "🎨", route: "/avatar", color: "#60a5fa" },
    { label: "StarPlay", icon: "🌟", route: "/starplay", color: "#facc15" },
    { label: "Learning Lounge", icon: "📘", route: "/lounge", color: "#34d399" },
    { label: "Chat", icon: "💬", route: "/chat", color: "#f472b6" },
    { label: "Profile", icon: "🧑", route: "/profile", color: "#a78bfa" },
    { label: "Parental Control", icon: "🔐", route: "/parent", color: "#fb923c" },
  ];

  return (
    <div style={{
      padding: "40px",
      maxWidth: "1000px",
      margin: "auto",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      position: "relative",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #001f3f 0%, #0d47a1 20%, #1976d2 40%, #ffffff 60%, #ffeb3b 80%, #fbc02d 100%)",
      backgroundSize: "400% 400%",
      animation: "gradientFlow 20s ease infinite"
    }}>
      <style>
        {`
          @keyframes gradientFlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}
      </style>

      {/* Welcome Header */}
      <div style={{
        textAlign: "center",
        marginBottom: "40px",
        background: "rgba(0,0,0,0.3)",
        color: "#fff",
        padding: "30px",
        borderRadius: "24px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      }}>
        <h1 style={{ fontSize: "36px", marginBottom: "8px", fontWeight: "700" }}>👋 Welcome to StarFace</h1>
        <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.9)", maxWidth: "600px", margin: "0 auto" }}>
          A safe social world for the next generation of young stars — share, play, and connect with star friends.
        </p>
      </div>

      {/* Feature Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gap: "25px",
      }}>
        {featureCards.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.route)}
            style={{
              background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
              color: "#fff",
              padding: "30px 24px",
              borderRadius: "20px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: `0 8px 25px ${item.color}40`,
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>{item.icon}</div>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* 🔒 Lock Overlay */}
      {!unlocked && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(10, 26, 47, 0.95)", 
          display: "grid", placeItems: "center",
          zIndex: 9999
        }}>
          <div style={{
            width: 450, maxWidth: "92vw",
            background: "#334155",
            color: "#f1f5f9",
            borderRadius: 20, padding: 30,
            textAlign: "center"
          }}>
            <h3 style={{ fontSize: "24px", fontWeight: "600" }}>🔒 App Locked</h3>
            <p>Screen time is not active. Start a session to use the app.</p>
            <button
              onClick={() => navigate("/parent")}
              style={{
                width: "100%", 
                padding: "14px 20px",
                border: "none", 
                borderRadius: 14,
                background: "gold",
                fontWeight: "700",
                marginTop: 20,
                cursor: "pointer"
              }}
            >
              Go to Parental Control
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper
function isUnlocked() {
  const until = Number(localStorage.getItem("parentalAllowedUntil") || 0);
  return until > Date.now();
}

export default Home;
