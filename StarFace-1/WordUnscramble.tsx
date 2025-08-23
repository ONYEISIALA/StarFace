import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const words = [
  { word: "elephant", scrambled: "nphaeelt" },
  { word: "science", scrambled: "cnsieec" },
  { word: "planet", scrambled: "nleapt" },
  { word: "friend", scrambled: "dniref" },
  { word: "computer", scrambled: "retumpoc" },
  { word: "rainbow", scrambled: "woinbar" },
  { word: "butterfly", scrambled: "rettuflyb" },
  { word: "adventure", scrambled: "rutneavde" }
];

const WordUnscramble = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  const current = words[index];

  const handleCheck = () => {
    if (input.toLowerCase() === current.word) {
      setMessage("✅ Correct!");
      setScore(score + 1);
    } else {
      setMessage("❌ Try again.");
    }
  };

  const nextWord = () => {
    if (index + 1 < words.length) {
      setIndex(index + 1);
      setInput("");
      setMessage("");
    } else {
      setGameFinished(true);
    }
  };

  const resetGame = () => {
    setIndex(0);
    setInput("");
    setMessage("");
    setScore(0);
    setGameFinished(false);
  };

  return (
    <div style={containerStyle}>
      <button onClick={() => navigate("/lounge")} style={backButtonStyle}>
        ⬅️ Back to Learning Lounge
      </button>
      
      <h1 style={titleStyle}>🔤 Word Unscramble</h1>
      
      {gameFinished ? (
        <div style={resultStyle}>
          <h2 style={resultTitleStyle}>🎉 Game Complete!</h2>
          <p style={scoreStyle}>Final Score: {score} / {words.length}</p>
          <div style={percentageStyle}>
            {Math.round((score / words.length) * 100)}% Correct!
          </div>
          <button onClick={resetGame} style={restartButtonStyle}>
            🔄 Play Again
          </button>
        </div>
      ) : (
        <div style={gameStyle}>
          <div style={progressStyle}>
            Word {index + 1} of {words.length} | Score: {score}
          </div>
          
          <div style={scrambledStyle}>
            Unscramble: <span style={scrambledWordStyle}>{current.scrambled.toUpperCase()}</span>
          </div>
          
          <div style={inputContainerStyle}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer here..."
              style={inputStyle}
              onKeyPress={(e) => e.key === 'Enter' && handleCheck()}
            />
            <button onClick={handleCheck} style={checkButtonStyle}>
              Check Answer
            </button>
          </div>
          
          {message && (
            <div style={messageStyle}>
              {message}
              {message.startsWith("✅") && (
                <button onClick={nextWord} style={nextButtonStyle}>
                  {index + 1 === words.length ? "Finish Game" : "Next Word"} →
                </button>
              )}
            </div>
          )}
          
          <div style={hintStyle}>
            💡 Hint: This word has {current.word.length} letters
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: "30px",
  maxWidth: "800px",
  margin: "auto",
  fontFamily: "'Segoe UI', sans-serif",
  background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
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
  marginBottom: "30px",
  textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
};

const gameStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
  borderRadius: "20px",
  padding: "40px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
  textAlign: "center"
};

const progressStyle: React.CSSProperties = {
  fontSize: "1rem",
  opacity: 0.8,
  marginBottom: "30px"
};

const scrambledStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  marginBottom: "30px"
};

const scrambledWordStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.2)",
  padding: "10px 20px",
  borderRadius: "12px",
  fontFamily: "monospace",
  fontSize: "2rem",
  letterSpacing: "3px",
  fontWeight: "bold"
};

const inputContainerStyle: React.CSSProperties = {
  display: "flex",
  gap: "15px",
  marginBottom: "20px",
  flexWrap: "wrap",
  justifyContent: "center"
};

const inputStyle: React.CSSProperties = {
  padding: "15px 20px",
  fontSize: "1.2rem",
  borderRadius: "12px",
  border: "2px solid rgba(255,255,255,0.3)",
  background: "rgba(255,255,255,0.9)",
  color: "#333",
  minWidth: "250px",
  textAlign: "center"
};

const checkButtonStyle: React.CSSProperties = {
  padding: "15px 25px",
  borderRadius: "12px",
  background: "#FF6B6B",
  color: "#fff",
  border: "none",
  fontSize: "1.1rem",
  fontWeight: "bold",
  cursor: "pointer"
};

const messageStyle: React.CSSProperties = {
  fontSize: "1.3rem",
  fontWeight: "bold",
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "15px"
};

const nextButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: "8px",
  background: "#4CAF50",
  color: "#fff",
  border: "none",
  fontSize: "1rem",
  fontWeight: "bold",
  cursor: "pointer"
};

const hintStyle: React.CSSProperties = {
  fontSize: "1rem",
  opacity: 0.7,
  fontStyle: "italic"
};

const resultStyle: React.CSSProperties = {
  textAlign: "center",
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
  borderRadius: "20px",
  padding: "40px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
};

const resultTitleStyle: React.CSSProperties = {
  fontSize: "2rem",
  marginBottom: "20px"
};

const scoreStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  marginBottom: "15px"
};

const percentageStyle: React.CSSProperties = {
  fontSize: "1.2rem",
  opacity: 0.9,
  marginBottom: "30px"
};

const restartButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: "12px",
  background: "#FF9800",
  color: "#fff",
  border: "none",
  fontSize: "1.1rem",
  fontWeight: "bold",
  cursor: "pointer"
};
export default WordUnscramble;
