import React, { useState, useEffect, useRef } from 'react';

interface Props {
  roomCode: string;
  player: 'X' | 'O';
}

interface MathProblem {
  question: string;
  answer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  operation: string;
  points: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

interface Answer {
  value: number;
  isCorrect: boolean;
  timeToAnswer: number;
  points: number;
}

const QuickMathDuel: React.FC<Props> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<MathProblem>({
    question: '',
    answer: 0,
    difficulty: 'easy',
    operation: '+',
    points: 1
  });
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState({ X: 0, O: 0 });
  const [timeLeft, setTimeLeft] = useState(90);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [problemsSolved, setProblemsSolved] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [answersHistory, setAnswersHistory] = useState<Answer[]>([]);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [problemStartTime, setProblemStartTime] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: x + (Math.random() - 0.5) * 50,
        y: y + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 5,
        color,
        life: 1,
        size: Math.random() * 6 + 3
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const updateParticles = () => {
    setParticles(prev => prev
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.3,
        vx: p.vx * 0.98,
        life: p.life - 0.02,
        size: p.size * 0.99
      }))
      .filter(p => p.life > 0 && p.size > 1)
    );
  };

  useEffect(() => {
    const interval = setInterval(updateParticles, 1000 / 60);
    return () => clearInterval(interval);
  }, []);

  const generateProblem = (): MathProblem => {
    const operations = {
      easy: ['+', '-'],
      medium: ['+', '-', '*'],
      hard: ['+', '-', '*', '/']
    };

    const currentOps = operations[difficulty];
    const operation = currentOps[Math.floor(Math.random() * currentOps.length)];

    let num1: number, num2: number, answer: number, points: number;

    switch (operation) {
      case '+':
        if (difficulty === 'easy') {
          num1 = Math.floor(Math.random() * 20) + 1;
          num2 = Math.floor(Math.random() * 20) + 1;
          points = 1;
        } else if (difficulty === 'medium') {
          num1 = Math.floor(Math.random() * 50) + 1;
          num2 = Math.floor(Math.random() * 50) + 1;
          points = 2;
        } else {
          num1 = Math.floor(Math.random() * 100) + 1;
          num2 = Math.floor(Math.random() * 100) + 1;
          points = 3;
        }
        answer = num1 + num2;
        break;

      case '-':
        if (difficulty === 'easy') {
          num1 = Math.floor(Math.random() * 30) + 10;
          num2 = Math.floor(Math.random() * num1) + 1;
          points = 1;
        } else if (difficulty === 'medium') {
          num1 = Math.floor(Math.random() * 80) + 20;
          num2 = Math.floor(Math.random() * num1) + 1;
          points = 2;
        } else {
          num1 = Math.floor(Math.random() * 150) + 50;
          num2 = Math.floor(Math.random() * num1) + 1;
          points = 3;
        }
        answer = num1 - num2;
        break;

      case '*':
        if (difficulty === 'medium') {
          num1 = Math.floor(Math.random() * 12) + 1;
          num2 = Math.floor(Math.random() * 12) + 1;
          points = 2;
        } else {
          num1 = Math.floor(Math.random() * 15) + 1;
          num2 = Math.floor(Math.random() * 15) + 1;
          points = 3;
        }
        answer = num1 * num2;
        break;

      case '/':
        // Ensure clean division
        const divisor = Math.floor(Math.random() * 12) + 2;
        const quotient = Math.floor(Math.random() * 15) + 1;
        num1 = divisor * quotient;
        num2 = divisor;
        answer = quotient;
        points = 4;
        break;

      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
        points = 1;
    }

    return {
      question: `${num1} ${operation} ${num2}`,
      answer,
      difficulty,
      operation,
      points: points + (streak >= 5 ? 1 : 0) // Bonus point for streaks
    };
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore({ X: 0, O: 0 });
    setStreak(0);
    setMaxStreak(0);
    setProblemsSolved(0);
    setCorrectAnswers(0);
    setAnswersHistory([]);
    const newProblem = generateProblem();
    setCurrentProblem(newProblem);
    setProblemStartTime(Date.now());
    setTimeLeft(90);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitAnswer = () => {
    if (isSubmitting || userAnswer.trim() === '') return;

    setIsSubmitting(true);
    const numAnswer = parseInt(userAnswer);
    const timeToAnswer = Date.now() - problemStartTime;
    const isCorrect = numAnswer === currentProblem.answer;

    // Speed bonus for very fast answers (under 3 seconds)
    const speedBonus = timeToAnswer < 3000 ? Math.floor(currentProblem.points * 0.5) : 0;
    const totalPoints = isCorrect ? currentProblem.points + speedBonus : 0;

    // Add to history
    setAnswersHistory(prev => [...prev, {
      value: numAnswer,
      isCorrect,
      timeToAnswer,
      points: totalPoints
    }]);

    if (isCorrect) {
      setScore(prev => ({ ...prev, [player]: prev[player] + totalPoints }));
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(current => Math.max(current, newStreak));
        return newStreak;
      });
      setCorrectAnswers(prev => prev + 1);
      setShowFeedback('correct');
      createParticles(window.innerWidth / 2, window.innerHeight / 2, '#4CAF50', 12);

      // Auto-increase difficulty based on streak
      if (streak + 1 >= 5 && difficulty === 'easy') {
        setDifficulty('medium');
      } else if (streak + 1 >= 10 && difficulty === 'medium') {
        setDifficulty('hard');
      }
    } else {
      setStreak(0);
      setShowFeedback('wrong');
      createParticles(window.innerWidth / 2, window.innerHeight / 2, '#F44336', 6);
    }

    setProblemsSolved(prev => prev + 1);
    setUserAnswer('');

    // Show feedback briefly then generate new problem
    setTimeout(() => {
      setShowFeedback(null);
      const newProblem = generateProblem();
      setCurrentProblem(newProblem);
      setProblemStartTime(Date.now());
      setIsSubmitting(false);
      inputRef.current?.focus();
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      submitAnswer();
    }
  };

  // WASD number input for quick answers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting || gameOver || !gameStarted) return;
      
      const key = e.key.toLowerCase();
      
      // WASD quick number input
      if (['w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
        const quickNumbers = {
          'w': '1',
          'a': '2', 
          's': '3',
          'd': '4'
        };
        const numToAdd = quickNumbers[key as keyof typeof quickNumbers];
        setUserAnswer(prev => prev + numToAdd);
      }
      
      // Number keys
      if (e.key >= '0' && e.key <= '9') {
        setUserAnswer(prev => prev + e.key);
      }
      
      // Backspace
      if (e.key === 'Backspace') {
        setUserAnswer(prev => prev.slice(0, -1));
      }
      
      // Enter to submit
      if (e.key === 'Enter' && userAnswer.trim() !== '' && !isSubmitting) {
        submitAnswer();
      }
      
      // Clear answer
      if (e.key === 'Escape') {
        setUserAnswer('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, gameOver, gameStarted, userAnswer]);

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore({ X: 0, O: 0 });
    setUserAnswer('');
    setTimeLeft(90);
    setStreak(0);
    setMaxStreak(0);
    setProblemsSolved(0);
    setCorrectAnswers(0);
    setAnswersHistory([]);
    setDifficulty('easy');
    setParticles([]);
    setShowFeedback(null);
  };

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
    }
  }, [gameStarted, timeLeft, gameOver]);

  const accuracy = problemsSolved > 0 ? Math.round((correctAnswers / problemsSolved) * 100) : 100;
  const avgTime = answersHistory.length > 0
    ? Math.round(answersHistory.reduce((sum, a) => sum + a.timeToAnswer, 0) / answersHistory.length / 1000 * 10) / 10
    : 0;

  if (!gameStarted) {
    return (
      <div style={containerStyle}>
        <div style={menuStyle}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            🧮 Quick Math Duel Arena
          </h2>
          <div style={gameInfoStyle}>
            <p>🎮 <strong>Room:</strong> {roomCode}</p>
            <p>🎯 <strong>You are:</strong> Player {player}</p>
            <p>⚡ <strong>Goal:</strong> Solve as many math problems as possible!</p>
            <p>🚀 <strong>Features:</strong> Auto-difficulty scaling, streak bonuses, speed bonuses</p>
          </div>
          <button onClick={startGame} style={startButtonStyle}>
            🧠 Start Math Battle!
          </button>
        </div>
      </div>
    );
  }

  const winner = gameOver
    ? (score.X > score.O ? 'X' : score.O > score.X ? 'O' : 'draw')
    : null;

  return (
    <div style={containerStyle}>
      {/* Particle Effects */}
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'fixed',
            left: particle.x,
            top: particle.y,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            borderRadius: '50%',
            backgroundColor: particle.color,
            pointerEvents: 'none',
            zIndex: 1000,
            opacity: particle.life,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
          }}
        />
      ))}

      <div style={headerStyle}>
        <h2 style={{ fontSize: '2rem', margin: '0 0 1rem 0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          🧮 Quick Math Duel Arena
        </h2>

        <div style={gameStatsStyle}>
          <div style={scoreboardStyle}>
            <div style={{ ...playerScoreStyle, color: player === 'X' ? '#ffd700' : '#ff6b6b' }}>
              🧮 Player X: {score.X}
            </div>
            <div style={{ ...playerScoreStyle, color: player === 'O' ? '#ffd700' : '#4ecdc4' }}>
              🎯 Player O: {score.O}
            </div>
          </div>

          <div style={statusRowStyle}>
            <div style={timerStyle}>⏱️ {timeLeft}s</div>
            <div style={difficultyStyle}>
              📊 {difficulty.toUpperCase()}
            </div>
            <div style={streakStyle}>
              {streak > 0 ? `🔥 ${streak} streak!` : '🎯 No streak'}
            </div>
          </div>
        </div>
      </div>

      <div style={gameAreaStyle}>
        {gameOver && (
          <div style={gameOverStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              {winner === 'draw' ? '🤝 Epic Draw!' :
               winner === player ? '🏆 Math Victory!' : '😔 Better luck next time!'}
            </div>
            <div style={statsDisplayStyle}>
              <div>Final Score: {score.X} - {score.O}</div>
              <div>Problems Solved: {problemsSolved}</div>
              <div>Accuracy: {accuracy}%</div>
              <div>Max Streak: {maxStreak}</div>
              <div>Average Time: {avgTime}s</div>
            </div>
            <button onClick={resetGame} style={resetButtonStyle}>
              🔄 New Game
            </button>
          </div>
        )}

        {!gameOver && (
          <>
            <div style={problemAreaStyle}>
              <div style={problemDisplayStyle}>
                <div style={equationStyle}>
                  {currentProblem.question} = ?
                </div>

                {showFeedback && (
                  <div style={{
                    ...feedbackStyle,
                    color: showFeedback === 'correct' ? '#4CAF50' : '#F44336'
                  }}>
                    {showFeedback === 'correct' ?
                      `✅ Correct! +${currentProblem.points} points` :
                      `❌ Wrong! Answer was ${currentProblem.answer}`}
                  </div>
                )}
              </div>

              <div style={inputAreaStyle}>
                <input
                  ref={inputRef}
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Your answer..."
                  style={inputStyle}
                  disabled={isSubmitting}
                  autoFocus
                />
                <button
                  onClick={submitAnswer}
                  disabled={isSubmitting || userAnswer.trim() === ''}
                  style={{
                    ...submitButtonStyle,
                    opacity: isSubmitting || userAnswer.trim() === '' ? 0.5 : 1
                  }}
                >
                  {isSubmitting ? '⏳' : '✓'} Submit
                </button>
              </div>

              {/* Mobile Number Pad */}
              {window.innerWidth <= 768 && (
                <div style={numberPadStyle}>
                  <div style={numberPadRowStyle}>
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        onClick={() => setUserAnswer(prev => prev + num.toString())}
                        style={numberButtonStyle}
                        disabled={isSubmitting}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div style={numberPadRowStyle}>
                    {[4, 5, 6].map(num => (
                      <button
                        key={num}
                        onClick={() => setUserAnswer(prev => prev + num.toString())}
                        style={numberButtonStyle}
                        disabled={isSubmitting}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div style={numberPadRowStyle}>
                    {[7, 8, 9].map(num => (
                      <button
                        key={num}
                        onClick={() => setUserAnswer(prev => prev + num.toString())}
                        style={numberButtonStyle}
                        disabled={isSubmitting}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div style={numberPadRowStyle}>
                    <button
                      onClick={() => setUserAnswer('')}
                      style={{...numberButtonStyle, background: 'linear-gradient(135deg, #F44336, #D32F2F)'}}
                      disabled={isSubmitting}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setUserAnswer(prev => prev + '0')}
                      style={numberButtonStyle}
                      disabled={isSubmitting}
                    >
                      0
                    </button>
                    <button
                      onClick={() => setUserAnswer(prev => prev.slice(0, -1))}
                      style={{...numberButtonStyle, background: 'linear-gradient(135deg, #FF9800, #F57C00)'}}
                      disabled={isSubmitting}
                    >
                      ←
                    </button>
                  </div>
                </div>
              )}

              {/* Keyboard Hints */}
              {window.innerWidth > 768 && (
                <div style={keyboardHintsStyle}>
                  <div>💡 Quick Tips:</div>
                  <div>• WASD keys: Add 1,2,3,4 • Enter: Submit • Escape: Clear</div>
                </div>
              )}
            </div>

            <div style={statsAreaStyle}>
              <div style={statItemStyle}>
                <div style={statLabelStyle}>Problems</div>
                <div style={statValueStyle}>{problemsSolved}</div>
              </div>
              <div style={statItemStyle}>
                <div style={statLabelStyle}>Accuracy</div>
                <div style={statValueStyle}>{accuracy}%</div>
              </div>
              <div style={statItemStyle}>
                <div style={statLabelStyle}>Streak</div>
                <div style={statValueStyle}>{streak}</div>
              </div>
              <div style={statItemStyle}>
                <div style={statLabelStyle}>Best</div>
                <div style={statValueStyle}>{maxStreak}</div>
              </div>
            </div>

            {answersHistory.length > 0 && (
              <div style={historyStyle}>
                <h3>Recent Answers</h3>
                <div style={historyListStyle}>
                  {answersHistory.slice(-5).map((answer, index) => (
                    <div key={index} style={historyItemStyle}>
                      <span style={{
                        color: answer.isCorrect ? '#4CAF50' : '#F44336'
                      }}>
                        {answer.isCorrect ? '✅' : '❌'}
                      </span>
                      <span>{answer.value}</span>
                      <span>{(answer.timeToAnswer / 1000).toFixed(1)}s</span>
                      <span>+{answer.points}pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
  backgroundSize: '400% 400%',
  animation: 'gradientShift 15s ease infinite',
  padding: '20px',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
};

const menuStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
  textAlign: 'center',
};

const gameInfoStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  marginBottom: '2rem',
  lineHeight: '1.6',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '2rem',
  position: 'relative',
  zIndex: 10,
};

const gameStatsStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '15px',
  padding: '20px',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  maxWidth: '600px',
  margin: '0 auto',
};

const scoreboardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '3rem',
  marginBottom: '1rem',
  flexWrap: 'wrap',
};

const playerScoreStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 'bold',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
};

const statusRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '2rem',
  flexWrap: 'wrap',
  fontSize: '1rem',
};

const timerStyle: React.CSSProperties = {
  color: '#ff6b6b',
  fontWeight: 'bold',
  fontSize: '1.1rem',
};

const difficultyStyle: React.CSSProperties = {
  color: '#4ecdc4',
  fontWeight: 'bold',
};

const streakStyle: React.CSSProperties = {
  color: '#ffd700',
  fontWeight: 'bold',
};

const gameAreaStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 10,
};

const gameOverStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.8)',
  borderRadius: '20px',
  padding: '2rem',
  textAlign: 'center',
  marginBottom: '2rem',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 215, 0, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
};

const statsDisplayStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '1rem',
  margin: '2rem 0',
  fontSize: '1.1rem',
};

const problemAreaStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '20px',
  padding: '2rem',
  marginBottom: '2rem',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  textAlign: 'center',
};

const problemDisplayStyle: React.CSSProperties = {
  marginBottom: '2rem',
};

const equationStyle: React.CSSProperties = {
  fontSize: '3rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
  fontFamily: 'Courier New, monospace',
};

const feedbackStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginTop: '1rem',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
};

const inputAreaStyle: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  justifyContent: 'center',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const inputStyle: React.CSSProperties = {
  padding: '15px 20px',
  fontSize: '1.5rem',
  borderRadius: '15px',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  textAlign: 'center',
  minWidth: '150px',
  backdropFilter: 'blur(10px)',
};

const submitButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
  color: 'white',
  border: 'none',
  borderRadius: '15px',
  padding: '15px 30px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  minHeight: '50px',
  minWidth: '120px',
};

const statsAreaStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: '15px',
  marginBottom: '2rem',
};

const statItemStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '15px',
  padding: '15px',
  textAlign: 'center',
  backdropFilter: 'blur(10px)',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  opacity: 0.8,
  marginBottom: '5px',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
};

const historyStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '15px',
  padding: '20px',
  backdropFilter: 'blur(10px)',
};

const historyListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const historyItemStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '30px 1fr 60px 60px',
  alignItems: 'center',
  padding: '10px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  fontSize: '0.9rem',
  gap: '10px',
};

const startButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #48bb78, #38a169)',
  color: 'white',
  border: 'none',
  borderRadius: '15px',
  padding: '20px 40px',
  fontSize: '1.3rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 8px 32px rgba(72, 187, 120, 0.4)',
  transition: 'all 0.3s ease',
  minWidth: '250px',
  minHeight: '60px',
};

const resetButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  color: 'white',
  border: 'none',
  borderRadius: '15px',
  padding: '15px 30px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 6px 25px rgba(102, 126, 234, 0.4)',
  transition: 'all 0.3s ease',
  minHeight: '50px',
};

const numberPadStyle: React.CSSProperties = {
  marginTop: '20px',
  background: 'rgba(0, 0, 0, 0.2)',
  borderRadius: '15px',
  padding: '15px',
  backdropFilter: 'blur(10px)',
};

const numberPadRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginBottom: '10px',
  justifyContent: 'center',
};

const numberButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  padding: '15px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  minWidth: '60px',
  minHeight: '60px',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
};

const keyboardHintsStyle: React.CSSProperties = {
  marginTop: '15px',
  fontSize: '0.9rem',
  opacity: 0.7,
  textAlign: 'center',
  lineHeight: '1.4',
};

export default QuickMathDuel;