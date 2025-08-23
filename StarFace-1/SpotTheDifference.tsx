import React from "react";
import { useNavigate } from "react-router-dom";

const SpotTheDifference = () => {
  const navigate = useNavigate();

  return (
    <div style={containerStyle}>
      <button onClick={() => navigate("/lounge")} style={backButtonStyle}>
        ⬅️ Back to Learning Lounge
      </button>
      
      <div style={contentStyle}>
        <h1 style={titleStyle}>🕵️‍♂️ Spot The Difference</h1>
        <div style={comingSoonStyle}>
          <div style={iconStyle}>🚧</div>
          <h2 style={subtitleStyle}>Coming Soon!</h2>
          <p style={descriptionStyle}>
            We're creating exciting visual challenges where you'll need to find hidden differences between two similar images. 
            This feature will include:
          </p>
          <ul style={featureListStyle}>
            <li>🖼️ Beautiful image pairs with subtle differences</li>
            <li>⏱️ Timed challenges for extra excitement</li>
            <li>🏆 Scoring system and achievements</li>
            <li>👥 Multiplayer mode to compete with friends</li>
            <li>🎯 Different difficulty levels</li>
          </ul>
          <p style={stayTunedStyle}>Stay tuned for this amazing visual puzzle experience!</p>
        </div>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: "30px",
  maxWidth: "800px",
  margin: "auto",
  fontFamily: "'Segoe UI', sans-serif",
  background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
  minHeight: "100vh",
  color: "#333"
};

const backButtonStyle: React.CSSProperties = {
  marginBottom: "20px",
  padding: "10px 20px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.3)",
  color: "#333",
  border: "1px solid rgba(255,255,255,0.5)",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "500"
};

const contentStyle: React.CSSProperties = {
  textAlign: "center"
};

const titleStyle: React.CSSProperties = {
  fontSize: "2.5rem",
  marginBottom: "30px",
  textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
};

const comingSoonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.2)",
  backdropFilter: "blur(10px)",
  borderRadius: "20px",
  padding: "40px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
};

const iconStyle: React.CSSProperties = {
  fontSize: "4rem",
  marginBottom: "20px"
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "20px",
  color: "#FF6B6B"
};

const descriptionStyle: React.CSSProperties = {
  fontSize: "1.2rem",
  lineHeight: "1.6",
  marginBottom: "30px",
  maxWidth: "600px",
  margin: "0 auto 30px auto"
};

const featureListStyle: React.CSSProperties = {
  textAlign: "left",
  maxWidth: "500px",
  margin: "0 auto 30px auto",
  fontSize: "1.1rem",
  lineHeight: "2"
};

const stayTunedStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: "bold",
  color: "#FF6B6B",
  fontStyle: "italic"
};

export default SpotTheDifference;
