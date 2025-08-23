import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserStats {
  username: string;
  facts: number;
  quizzes: number;
  total: number;
  lastActive?: string;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<UserStats[]>([]);
  const [filter, setFilter] = useState<'all' | 'facts' | 'quizzes'>('all');

  useEffect(() => {
    const allFacts = JSON.parse(localStorage.getItem("userFacts") || "[]");
    const allQuizzes = JSON.parse(localStorage.getItem("userQuizzes") || "[]");

    const scores: Record<string, UserStats> = {};

    for (const fact of allFacts) {
      const user = fact.username || "Anonymous User";
      if (!scores[user]) {
        scores[user] = { 
          username: user, 
          facts: 0, 
          quizzes: 0, 
          total: 0,
          lastActive: fact.createdAt || new Date().toISOString()
        };
      }
      scores[user].facts += 1;
      scores[user].total += 1;
      if (fact.createdAt && (!scores[user].lastActive || fact.createdAt > scores[user].lastActive)) {
        scores[user].lastActive = fact.createdAt;
      }
    }

    for (const quiz of allQuizzes) {
      const user = quiz.username || "Anonymous User";
      if (!scores[user]) {
        scores[user] = { 
          username: user, 
          facts: 0, 
          quizzes: 0, 
          total: 0,
          lastActive: quiz.createdAt || new Date().toISOString()
        };
      }
      scores[user].quizzes += 1;
      scores[user].total += 1;
      if (quiz.createdAt && (!scores[user].lastActive || quiz.createdAt > scores[user].lastActive)) {
        scores[user].lastActive = quiz.createdAt;
      }
    }

    let sorted = Object.values(scores);
    
    // Apply filter
    if (filter === 'facts') {
      sorted = sorted.sort((a, b) => b.facts - a.facts);
    } else if (filter === 'quizzes') {
      sorted = sorted.sort((a, b) => b.quizzes - a.quizzes);
    } else {
      sorted = sorted.sort((a, b) => b.total - a.total);
    }
    
    setData(sorted);
  }, [filter]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return `#${index + 1}`;
    }
  };

  return (
    <div style={containerStyle}>
      <button onClick={() => navigate("/lounge")} style={backButtonStyle}>
        ⬅️ Back to Learning Lounge
      </button>
      
      <h1 style={titleStyle}>🏆 Learning Champions</h1>
      <p style={subtitleStyle}>Top contributors to our learning community</p>

      {/* Filter Buttons */}
      <div style={filterContainerStyle}>
        <button 
          onClick={() => setFilter('all')} 
          style={{
            ...filterButtonStyle,
            background: filter === 'all' ? '#4CAF50' : 'rgba(255,255,255,0.2)'
          }}
        >
          🏆 All Points
        </button>
        <button 
          onClick={() => setFilter('facts')} 
          style={{
            ...filterButtonStyle,
            background: filter === 'facts' ? '#2196F3' : 'rgba(255,255,255,0.2)'
          }}
        >
          📚 Facts Only
        </button>
        <button 
          onClick={() => setFilter('quizzes')} 
          style={{
            ...filterButtonStyle,
            background: filter === 'quizzes' ? '#FF9800' : 'rgba(255,255,255,0.2)'
          }}
        >
          🧠 Quizzes Only
        </button>
      </div>

      {/* Leaderboard */}
      <div style={leaderboardStyle}>
        {data.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>📝</div>
            <h3>No contributors yet!</h3>
            <p>Be the first to create some facts or quizzes!</p>
            <button onClick={() => navigate("/create")} style={createButtonStyle}>
              ✨ Create Content
            </button>
          </div>
        ) : (
          data.map((user, i) => (
            <div key={i} style={{
              ...userCardStyle,
              background: i < 3 ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 'rgba(255,255,255,0.1)'
            }}>
              <div style={rankStyle}>
                {getRankEmoji(i)}
              </div>
              <div style={userInfoStyle}>
                <div style={usernameStyle}>{user.username}</div>
                <div style={statsStyle}>
                  <span style={statItemStyle}>📚 {user.facts} facts</span>
                  <span style={statItemStyle}>🧠 {user.quizzes} quizzes</span>
                  <span style={totalPointsStyle}>🏆 {user.total} total</span>
                </div>
                <div style={lastActiveStyle}>
                  Last active: {formatDate(user.lastActive)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: "30px",
  maxWidth: "900px",
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
  fontSize: "16px"
};

const titleStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "2.5rem",
  marginBottom: "10px",
  textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
};

const subtitleStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "1.2rem",
  opacity: 0.9,
  marginBottom: "30px"
};

const filterContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "15px",
  marginBottom: "30px",
  flexWrap: "wrap"
};

const filterButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: "25px",
  border: "1px solid rgba(255,255,255,0.3)",
  color: "#fff",
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: "500",
  transition: "all 0.3s ease"
};

const leaderboardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "15px"
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: "center",
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
  borderRadius: "20px",
  padding: "60px 40px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: "4rem",
  marginBottom: "20px"
};

const createButtonStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "12px 24px",
  borderRadius: "12px",
  background: "#4CAF50",
  color: "#fff",
  border: "none",
  fontSize: "1.1rem",
  fontWeight: "bold",
  cursor: "pointer"
};

const userCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "20px",
  borderRadius: "16px",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
  transition: "transform 0.2s ease"
};

const rankStyle: React.CSSProperties = {
  fontSize: "2rem",
  fontWeight: "bold",
  marginRight: "20px",
  minWidth: "60px",
  textAlign: "center"
};

const userInfoStyle: React.CSSProperties = {
  flex: 1
};

const usernameStyle: React.CSSProperties = {
  fontSize: "1.3rem",
  fontWeight: "bold",
  marginBottom: "8px"
};

const statsStyle: React.CSSProperties = {
  display: "flex",
  gap: "20px",
  marginBottom: "5px",
  flexWrap: "wrap"
};

const statItemStyle: React.CSSProperties = {
  fontSize: "1rem",
  opacity: 0.9
};

const totalPointsStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: "bold",
  color: "#FFD93D"
};

const lastActiveStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  opacity: 0.7,
  fontStyle: "italic"
};

export default Leaderboard;
