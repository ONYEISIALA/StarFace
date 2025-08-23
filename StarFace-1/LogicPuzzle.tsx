import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const puzzles = [
  {
    riddle: "You see a boat filled with people. It has not sunk, but when you look again, you don’t see a single person on the boat. Why?",
    answer: "All the people were married!",
    hint: "Think about the word 'single'"
  },
  {
    riddle: "What comes once in a minute, twice in a moment, but never in a thousand years?",
    answer: "The letter 'M'.",
    hint: "Look at the letters in each word"
  },
  {
    riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    answer: "An echo.",
    hint: "Think about sounds in nature"
  },
  {
    riddle: "What has keys but no locks, space but no room, and you can enter but not go inside?",
    answer: "A keyboard.",
    hint: "Something you use with computers"
  },
  {
    riddle: "The more you take, the more you leave behind. What am I?",
    answer: "Footsteps.",
    hint: "Think about walking"
  },
];

const LogicPuzzle = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const current = puzzles[index];

  const checkAnswer = () => {
    if (userAnswer.toLowerCase().trim() === current.answer.toLowerCase().trim()) {
      setFeedback("🎉 Correct! Great job!");
      setScore(score + 1);
    } else {
      setFeedback(`❌ Not quite right. The answer is: ${current.answer}`);
    }
    setShowAnswer(true);
  };

  const nextPuzzle = () => {
    if (index + 1 < puzzles.length) {
      setIndex(index + 1);
      setShowAnswer(false);
      setShowHint(false);
      setUserAnswer("");
      setFeedback("");
    } else {
      setIndex(0);
      setShowAnswer(false);
      setShowHint(false);
      setUserAnswer("");
      setFeedback("");
    }
  };

  const resetGame = () => {
    setIndex(0);
    setShowAnswer(false);
    setShowHint(false);
    setScore(0);
    setUserAnswer("");
    setFeedback("");
  };

  return (
    <div style={containerStyle}>
      <button onClick={() => navigate("/lounge")} style={backButtonStyle}>
        ⬅️ Back to Learning Lounge
      </button>
      
      <h1 style={titleStyle}>🧩 Logic Puzzles</h1>
      
      <div style={gameStyle}>
        <div style={progressStyle}>
          Puzzle {index + 1} of {puzzles.length} | Score: {score}
        </div>
        
        <div style={puzzleStyle}>
          <h3 style={puzzleHeaderStyle}>🤔 Brain Teaser:</h3>
          <p style={riddleStyle}>{current.riddle}</p>
        </div>

        {!showAnswer && (
          <div style={inputSectionStyle}>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              style={inputStyle}
              onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
            />
            <div style={buttonGroupStyle}>
              <button onClick={checkAnswer} style={checkButtonStyle}>
                Check Answer
              </button>
              <button onClick={() => setShowHint(!showHint)} style={hintButtonStyle}>
                {showHint ? "Hide Hint" : "💡 Get Hint"}
              </button>
            </div>
            
            {showHint && (
              <div style={hintStyle}>
                💡 Hint: {current.hint}
              </div>
            )}
          </div>
        )}

        {showAnswer && (
          <div style={answerSectionStyle}>
            <div style={feedbackStyle}>{feedback}</div>
            <div style={answerStyle}>
              <strong>Answer:</strong> {current.answer}
            </div>
            <div style={buttonGroupStyle}>
              <button onClick={nextPuzzle} style={nextButtonStyle}>
                {index + 1 === puzzles.length ? "🔄 Start Over" : "Next Puzzle →"}
              </button>
              <button onClick={resetGame} style={resetButtonStyle}>
                🎯 Reset Score
              </button>
            </div>
          </div>
        )}
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
  background: "linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)",
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
  boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
};

const progressStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "1rem",
  opacity: 0.8,
  marginBottom: "30px"
};

const puzzleStyle: React.CSSProperties = {
  marginBottom: "30px",
  textAlign: "center"
};

const puzzleHeaderStyle: React.CSSProperties = {
  fontSize: "1.3rem",
  marginBottom: "20px",
  color: "#FFD93D"
};

const riddleStyle: React.CSSProperties = {
  fontSize: "1.3rem",
  lineHeight: "1.6",
  background: "rgba(255,255,255,0.1)",
  padding: "20px",
  borderRadius: "12px",
  fontStyle: "italic"
};

const inputSectionStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "20px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "400px",
  padding: "15px 20px",
  fontSize: "1.1rem",
  borderRadius: "12px",
  border: "2px solid rgba(255,255,255,0.3)",
  background: "rgba(255,255,255,0.9)",
  color: "#333",
  marginBottom: "20px",
  textAlign: "center"
};

const buttonGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "15px",
  justifyContent: "center",
  flexWrap: "wrap"
};

const checkButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: "12px",
  background: "#4CAF50",
  color: "#fff",
  border: "none",
  fontSize: "1.1rem",
  fontWeight: "bold",
  cursor: "pointer"
};

const hintButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: "12px",
  background: "#FF9800",
  color: "#fff",
  border: "none",
  fontSize: "1.1rem",
  fontWeight: "bold",
  cursor: "pointer"
};

const hintStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "15px",
  background: "rgba(255, 152, 0, 0.2)",
  borderRadius: "12px",
  fontSize: "1.1rem",
  fontStyle: "italic"
};

const answerSectionStyle: React.CSSProperties = {
  textAlign: "center"
};

const feedbackStyle: React.CSSProperties = {
  fontSize: "1.3rem",
  fontWeight: "bold",
  marginBottom: "20px"
};

const answerStyle: React.CSSProperties = {
  fontSize: "1.2rem",
  marginBottom: "30px",
  padding: "15px",
  background: "rgba(255,255,255,0.1)",
  borderRadius: "12px"
};

const nextButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: "12px",
  background: "#2196F3",
  color: "#fff",
  border: "none",
  fontSize: "1.1rem",
  fontWeight: "bold",
  cursor: "pointer"
};

const resetButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: "12px",
  background: "#F44336",
  color: "#fff",
  border: "none",
  fontSize: "1.1rem",
  fontWeight: "bold",
  cursor: "pointer"
};
export default LogicPuzzle;
