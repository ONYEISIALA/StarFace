import React from "react";
import { useNavigate } from "react-router-dom";

const LearningLounge = () => {
  const navigate = useNavigate();

  return (
    <div style={containerStyle}>
      {/* Back to Home Button */}
      <button
        onClick={() => navigate("/")}
        style={backButtonStyle}
      >
        ⬅️ Back to Home
      </button>

      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>📚 Learning Lounge</h1>
        <p style={subtitleStyle}>Welcome to the brain zone! Pick an activity to boost your knowledge:</p>
      </div>

      {/* Activity Grid */}
      <div style={gridStyle}>
        <button onClick={() => navigate("/quiz")} style={buttonStyle}>
          <div style={iconStyle}>🧠</div>
          <div style={labelStyle}>Take a Quiz</div>
          <div style={descStyle}>Test your knowledge</div>
        </button>
        
        <button onClick={() => navigate("/wordscramble")} style={buttonStyle}>
          <div style={iconStyle}>🔤</div>
          <div style={labelStyle}>Word Unscramble</div>
          <div style={descStyle}>Unscramble mixed letters</div>
        </button>
        
        <button onClick={() => navigate("/logicpuzzle")} style={buttonStyle}>
          <div style={iconStyle}>🧩</div>
          <div style={labelStyle}>Logic Puzzle</div>
          <div style={descStyle}>Solve brain teasers</div>
        </button>
        
        <button onClick={() => navigate("/spotthedifference")} style={buttonStyle}>
          <div style={iconStyle}>🔍</div>
          <div style={labelStyle}>Spot the Difference</div>
          <div style={descStyle}>Find hidden differences</div>
        </button>
        
        <button onClick={() => navigate("/create")} style={buttonStyle}>
          <div style={iconStyle}>✍️</div>
          <div style={labelStyle}>Create Content</div>
          <div style={descStyle}>Submit facts & quizzes</div>
        </button>
        
        <button onClick={() => navigate("/leaderboard")} style={buttonStyle}>
          <div style={iconStyle}>🏆</div>
          <div style={labelStyle}>Leaderboard</div>
          <div style={descStyle}>See top learners</div>
        </button>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: "30px",
  maxWidth: "1000px",
  margin: "auto",
  fontFamily: "'Segoe UI', sans-serif",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  minHeight: "100vh",
  color: "#fff"
};

const backButtonStyle: React.CSSProperties = {
  marginBottom: "20px",
  padding: "10px 20px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.2)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.3)",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "500"
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "40px"
};

const titleStyle: React.CSSProperties = {
  fontSize: "2.5rem",
  marginBottom: "10px",
  textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "1.2rem",
  opacity: 0.9,
  maxWidth: "600px",
  margin: "0 auto"
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "25px",
  maxWidth: "900px",
  margin: "0 auto"
};

const buttonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "16px",
  padding: "25px 20px",
  cursor: "pointer",
  transition: "all 0.3s ease",
  textAlign: "center",
  color: "#fff",
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
};

const iconStyle: React.CSSProperties = {
  fontSize: "3rem",
  marginBottom: "15px"
};

const labelStyle: React.CSSProperties = {
  fontSize: "1.3rem",
  fontWeight: "bold",
  marginBottom: "8px"
};

const descStyle: React.CSSProperties = {
  fontSize: "0.95rem",
  opacity: 0.8,
  lineHeight: "1.4"
};

export default LearningLounge;
