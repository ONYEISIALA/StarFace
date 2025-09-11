import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

const questions = [
  {
    question: "What planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Saturn"],
    answer: "Mars",
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    answer: "William Shakespeare",
  },
  {
    question: "How many legs does a spider have?",
    options: ["6", "8", "10", "12"],
    answer: "8",
  },
];

const Quiz = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState("");
  const [finished, setFinished] = useState(false);

  const handleAnswer = (option: string) => {
    setSelected(option);
    if (option === questions[current].answer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
      setSelected("");
    } else {
      setFinished(true);
    }
  };

  return (
    <div style={containerStyle}>
      <button onClick={() => navigate("/lounge")} style={backButtonStyle}>
        ⬅️ Back to Learning Lounge
      </button>
      
      <h1 style={titleStyle}>🧠 Knowledge Quiz</h1>

      {finished ? (
        <div style={resultStyle}>
          <h2 style={resultTitleStyle}>🎉 Quiz Complete!</h2>
          <p style={scoreStyle}>Your Score: {score} / {questions.length}</p>
          <div style={percentageStyle}>
            {Math.round((score / questions.length) * 100)}% Correct!
          </div>
          <button onClick={() => window.location.reload()} style={restartButtonStyle}>
            🔄 Try Again
          </button>
        </div>
      ) : (
        <div style={quizStyle}>
          <div style={progressStyle}>
            Question {current + 1} of {questions.length}
          </div>
          <h3 style={questionStyle}>{questions[current].question}</h3>
          <div style={optionsStyle}>
            {questions[current].options.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                style={{
                  ...optionStyle,
                  backgroundColor: selected === option ? "#4CAF50" : "rgba(255,255,255,0.1)",
                  color: selected === option ? "#fff" : "#fff",
                  border: selected === option ? "2px solid #4CAF50" : "1px solid rgba(255,255,255,0.3)",
                  cursor: "pointer",
                }}
              >
                {option}
              </button>
            ))}
          </div>
          <button 
            onClick={nextQuestion} 
            disabled={!selected}
            style={{
              ...nextButtonStyle,
              opacity: selected ? 1 : 0.5,
              cursor: selected ? "pointer" : "not-allowed"
            }}
          >
            {current + 1 === questions.length ? "Finish Quiz" : "Next Question"} →
          </button>
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
  marginBottom: "30px",
  textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
};

const quizStyle: React.CSSProperties = {
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
  marginBottom: "20px"
};

const questionStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  marginBottom: "30px",
  textAlign: "center",
  lineHeight: "1.4"
};

const optionsStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  marginBottom: "30px"
};

const optionStyle: React.CSSProperties = {
  padding: "15px 20px",
  borderRadius: "12px",
  fontSize: "1.1rem",
  transition: "all 0.3s ease",
  textAlign: "left"
};

const nextButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  borderRadius: "12px",
  background: "#4CAF50",
  color: "#fff",
  border: "none",
  fontSize: "1.2rem",
  fontWeight: "bold",
  transition: "all 0.3s ease"
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
export default Quiz;
