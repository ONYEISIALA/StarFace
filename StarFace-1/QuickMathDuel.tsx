import React, { useEffect, useState } from 'react';

interface Props {
  roomCode: string;
  player: 'X' | 'O';
}

interface Question {
  question: string;
  answer: number;
}

interface GameState {
  xScore: number;
  oScore: number;
  currentQuestion: Question | null;
  gameActive: boolean;
  winner: string | null;
  questionNumber: number;
}

const QuickMathDuel: React.FC<Props> = ({ roomCode, player }) => {
  const [gameState, setGameState] = useState<GameState>({
    xScore: 0,
    oScore: 0,
    currentQuestion: null,
    gameActive: false,
    winner: null,
    questionNumber: 0,
  });
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const localStorageKey = `quickmath_${roomCode}`;

  useEffect(() => {
    // Load saved state
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      try {
        setGameState(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load game state:', e);
      }
    }

    window.addEventListener('storage', syncGame);
    return () => window.removeEventListener('storage', syncGame);
  }, [roomCode]);

  // Timer effect
  useEffect(() => {
    if (!gameState.gameActive || !gameState.currentQuestion || gameState.winner) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up, generate new question
          generateNewQuestion();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.currentQuestion, gameState.gameActive, gameState.winner]);

  const syncGame = (e: StorageEvent) => {
    if (e.key === localStorageKey && e.newValue) {
      try {
        const newState = JSON.parse(e.newValue);
        setGameState(newState);
      } catch (error) {
        console.error('Failed to sync game:', error);
      }
    }
  };

  const updateGameState = (newState: GameState) => {
    setGameState(newState);
    localStorage.setItem(localStorageKey, JSON.stringify(newState));
  };

  const generateQuestion = (): Question => {
    const operations = ['+', '-', '×', '÷'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, answer, question;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 50) + 20;
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case '×':
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
      case '÷':
        answer = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        num1 = answer * num2;
        question = `${num1} ÷ ${num2}`;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
        question = '1 + 1';
    }
    
    return { question, answer };
  };

  const startGame = () => {
    const newQuestion = generateQuestion();
    const newState: GameState = {
      xScore: 0,
      oScore: 0,
      currentQuestion: newQuestion,
      gameActive: true,
      winner: null,
      questionNumber: 1,
    };
    updateGameState(newState);
    setTimeLeft(10);
    setUserAnswer('');
    setFeedback('');
  };

  const generateNewQuestion = () => {
    if (!gameState.gameActive || gameState.winner) return;

    const newQuestion = generateQuestion();
    const newState = {
      ...gameState,
      currentQuestion: newQuestion,
      questionNumber: gameState.questionNumber + 1,
    };
    updateGameState(newState);
    setTimeLeft(10);
    setUserAnswer('');
    setFeedback('');
  };

  const submitAnswer = () => {
    if (!gameState.currentQuestion || !gameState.gameActive || gameState.winner) return;
    
    const numAnswer = parseInt(userAnswer);
    if (isNaN(numAnswer)) return;

    if (numAnswer === gameState.currentQuestion.answer) {
      const newState = { ...gameState };
      
      if (player === 'X') {
        newState.xScore += 1;
      } else {
        newState.oScore += 1;
      }

      // Check for winner
      if (newState.xScore >= 10) {
        newState.winner = 'Player X';
        newState.gameActive = false;
      } else if (newState.oScore >= 10) {
        newState.winner = 'Player O';
        newState.gameActive = false;
      }

      updateGameState(newState);
      setFeedback('✅ Correct!');
      
      if (!newState.winner) {
        setTimeout(() => {
          generateNewQuestion();
        }, 1000);
      }
    } else {
      setFeedback(`❌ Wrong! Answer was ${gameState.currentQuestion.answer}`);
      setTimeout(() => {
        generateNewQuestion();
      }, 1500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitAnswer();
    }
  };

  const resetGame = () => {
    const resetState: GameState = {
      xScore: 0,
      oScore: 0,
      currentQuestion: null,
      gameActive: false,
      winner: null,
      questionNumber: 0,
    };
    updateGameState(resetState);
    setUserAnswer('');
    setFeedback('');
    setTimeLeft(10);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>🧮 Quick Math Duel</h2>
        <div style={infoStyle}>
          <span style={badgeStyle}>Room: {roomCode}</span>
          <span style={badgeStyle}>You: Player {player}</span>
          {gameState.gameActive && (
            <span style={badgeStyle}>Question: {gameState.questionNumber}</span>
          )}
        </div>
      </div>

      <div style={scoresStyle}>
        <div style={{ ...scoreStyle, backgroundColor: '#ff4757' }}>
          Player X: {gameState.xScore}/10
        </div>
        <div style={{ ...scoreStyle, backgroundColor: '#3742fa' }}>
          Player O: {gameState.oScore}/10
        </div>
      </div>

      {!gameState.gameActive && !gameState.winner && (
        <div style={controlsStyle}>
          <button onClick={startGame} style={startButtonStyle}>
            🚀 Start Math Duel!
          </button>
          <p style={instructionStyle}>
            Solve math problems as fast as you can! First to 10 wins!
          </p>
        </div>
      )}

      {gameState.winner && (
        <div style={resultStyle}>
          <h3>🏆 Game Over!</h3>
          <h4>
            {gameState.winner === `Player ${player}` ? '🎉 You Win!' : '😢 You Lost!'}
          </h4>
          <p>Final Score: {gameState.xScore} - {gameState.oScore}</p>
          <button onClick={resetGame} style={resetButtonStyle}>
            🔄 Play Again
          </button>
        </div>
      )}

      {gameState.currentQuestion && gameState.gameActive && (
        <div style={questionAreaStyle}>
          <div style={timerStyle}>
            ⏱️ {timeLeft}s
          </div>
          
          <div style={questionStyle}>
            {gameState.currentQuestion.question} = ?
          </div>
          
          <div style={inputAreaStyle}>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Your answer"
              style={answerInputStyle}
              autoFocus
            />
            <button onClick={submitAnswer} style={submitButtonStyle}>
              Submit
            </button>
          </div>
          
          {feedback && (
            <div style={feedbackStyle}>
              {feedback}
            </div>
          )}
        </div>
      )}

      {gameState.gameActive && (
        <div style={instructionsStyle}>
          <p>🎯 Solve the math problem and press Enter or click Submit!</p>
          <p>⚡ You have 10 seconds per question</p>
        </div>
      )}
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  color: '#ffffff',
  minHeight: '100vh',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '20px',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
};

const infoStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  marginTop: '10px',
};

const badgeStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.2)',
  border: '1px solid rgba(255,255,255,0.3)',
  fontSize: '14px',
  fontWeight: '500',
};

const scoresStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '20px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const scoreStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: '8px',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '18px',
  minWidth: '150px',
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
};

const controlsStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
};

const startButtonStyle: React.CSSProperties = {
  background: '#48bb78',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '15px 30px',
  fontSize: '20px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(72, 187, 120, 0.4)',
  marginBottom: '15px',
};

const instructionStyle: React.CSSProperties = {
  fontSize: '16px',
  opacity: 0.9,
};

const resultStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'rgba(255,255,255,0.1)',
  padding: '20px',
  borderRadius: '12px',
  marginBottom: '20px',
  border: '2px solid rgba(255,255,255,0.2)',
};

const resetButtonStyle: React.CSSProperties = {
  background: '#ed8936',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '10px',
};

const questionAreaStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  padding: '30px',
  borderRadius: '12px',
  marginBottom: '20px',
  border: '2px solid rgba(255,255,255,0.2)',
  textAlign: 'center',
};

const timerStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '20px',
  color: '#ffd93d',
};

const questionStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 'bold',
  marginBottom: '20px',
  color: '#ffffff',
};

const inputAreaStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '15px',
  marginBottom: '15px',
  flexWrap: 'wrap',
};

const answerInputStyle: React.CSSProperties = {
  padding: '12px 20px',
  fontSize: '20px',
  borderRadius: '8px',
  border: '2px solid rgba(255,255,255,0.3)',
  background: 'rgba(255,255,255,0.9)',
  color: '#333',
  textAlign: 'center',
  width: '150px',
};

const submitButtonStyle: React.CSSProperties = {
  background: '#48bb78',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '12px 20px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const feedbackStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginTop: '15px',
};

const instructionsStyle: React.CSSProperties = {
  textAlign: 'center',
  color: 'rgba(255,255,255,0.8)',
  fontSize: '14px',
  lineHeight: '1.5',
};

export default QuickMathDuel;