import React, { useState, useEffect, useRef } from 'react';

interface Props {
  roomCode: string;
  player: 'X' | 'O';
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

interface RoundHistory {
  round: number;
  playerChoice: string;
  opponentChoice: string;
  result: string;
  timestamp: number;
}

const MultiplayerRockPaperScissors: React.FC<Props> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [score, setScore] = useState({ X: 0, O: 0 });
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameOver, setGameOver] = useState(false);
  const [isChoosing, setIsChoosing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState({ X: 0, O: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [roundHistory, setRoundHistory] = useState<RoundHistory[]>([]);
  const [animations, setAnimations] = useState({
    rock: false,
    paper: false,
    scissors: false
  });

  const choices = [
    { name: 'rock', emoji: '🪨', color: '#8D6E63' },
    { name: 'paper', emoji: '📄', color: '#FFC107' },
    { name: 'scissors', emoji: '✂️', color: '#F44336' }
  ];

  const createParticles = (x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: x + (Math.random() - 0.5) * 50,
        y: y + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
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
        vy: p.vy + 0.2,
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

  // WASD and keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isChoosing || showResult || gameOver) return;
      
      const key = e.key.toLowerCase();
      switch (key) {
        case 'w':
        case '1':
          makeChoice('rock');
          break;
        case 'a':
        case '2':
          makeChoice('paper');
          break;
        case 's':
        case '3':
          makeChoice('scissors');
          break;
        case ' ':
        case 'enter':
          e.preventDefault();
          if (playerChoice) return;
          // Random choice if no selection
          const randomChoice = choices[Math.floor(Math.random() * choices.length)].name;
          makeChoice(randomChoice);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isChoosing, showResult, gameOver, playerChoice]);

  useEffect(() => {
    if (!gameStarted || gameOver || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!playerChoice) {
            // Auto-choose random if time runs out
            const randomChoice = choices[Math.floor(Math.random() * choices.length)].name;
            makeChoice(randomChoice);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, showResult, playerChoice]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setPlayerChoice(null);
    setOpponentChoice(null);
    setResult('');
    setTimeLeft(15);
    setShowResult(false);
    setIsChoosing(true);
  };

  const makeChoice = (choice: string) => {
    if (playerChoice || !isChoosing) return;

    setPlayerChoice(choice);
    setIsChoosing(false);

    // Animate choice
    setAnimations(prev => ({ ...prev, [choice]: true }));
    setTimeout(() => {
      setAnimations(prev => ({ ...prev, [choice]: false }));
    }, 500);

    // Simulate opponent choice with delay for suspense
    setTimeout(() => {
      const opChoice = choices[Math.floor(Math.random() * choices.length)].name;
      setOpponentChoice(opChoice);

      // Determine result
      let gameResult = '';
      let resultColor = '#FFC107';

      if (choice === opChoice) {
        gameResult = 'tie';
        resultColor = '#FFC107';
      } else if (
        (choice === 'rock' && opChoice === 'scissors') ||
        (choice === 'paper' && opChoice === 'rock') ||
        (choice === 'scissors' && opChoice === 'paper')
      ) {
        gameResult = 'win';
        resultColor = '#4CAF50';
        setScore(prev => ({ ...prev, [player]: prev[player] + 1 }));
        setStreak(prev => ({ ...prev, [player]: prev[player] + 1, [player === 'X' ? 'O' : 'X']: 0 }));
        createParticles(window.innerWidth / 2, window.innerHeight / 2, '#4CAF50', 15);
      } else {
        gameResult = 'lose';
        resultColor = '#F44336';
        const opponent = player === 'X' ? 'O' : 'X';
        setScore(prev => ({ ...prev, [opponent]: prev[opponent] + 1 }));
        setStreak(prev => ({ ...prev, [opponent]: prev[opponent] + 1, [player]: 0 }));
        createParticles(window.innerWidth / 2, window.innerHeight / 2, '#F44336', 10);
      }

      setResult(gameResult);
      setShowResult(true);

      // Add to history
      setRoundHistory(prev => [...prev, {
        round,
        playerChoice: choice,
        opponentChoice: opChoice,
        result: gameResult,
        timestamp: Date.now()
      }]);

      // Auto-advance to next round
      setTimeout(() => {
        if (round >= 10) {
          setGameOver(true);
        } else {
          setRound(prev => prev + 1);
          setPlayerChoice(null);
          setOpponentChoice(null);
          setResult('');
          setShowResult(false);
          setIsChoosing(true);
          setTimeLeft(15);
        }
      }, 3000);
    }, 1500);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setPlayerChoice(null);
    setOpponentChoice(null);
    setResult('');
    setScore({ X: 0, O: 0 });
    setStreak({ X: 0, O: 0 });
    setRound(1);
    setTimeLeft(15);
    setShowResult(false);
    setIsChoosing(false);
    setParticles([]);
    setRoundHistory([]);
  };

  const getChoiceEmoji = (choice: string) => {
    const choiceObj = choices.find(c => c.name === choice);
    return choiceObj ? choiceObj.emoji : '❓';
  };

  const getChoiceColor = (choice: string) => {
    const choiceObj = choices.find(c => c.name === choice);
    return choiceObj ? choiceObj.color : '#666';
  };

  const winner = gameOver 
    ? (score.X > score.O ? 'X' : score.O > score.X ? 'O' : 'draw')
    : null;

  if (!gameStarted) {
    return (
      <div style={containerStyle}>
        <div style={menuStyle}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            ✊ Rock Paper Scissors Arena
          </h2>
          <div style={gameInfoStyle}>
            <p>🎮 <strong>Room:</strong> {roomCode}</p>
            <p>🎯 <strong>You are:</strong> Player {player}</p>
            <p>⚡ <strong>Rules:</strong> Best of 10 rounds wins!</p>
            <p>⏱️ <strong>Time limit:</strong> 15 seconds per choice</p>
          </div>
          <button onClick={startGame} style={startButtonStyle}>
            🚀 Start Battle!
          </button>
        </div>
      </div>
    );
  }

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
          ✊ Rock Paper Scissors Arena
        </h2>

        <div style={gameStatsStyle}>
          <div style={scoreboardStyle}>
            <div style={{ ...playerScoreStyle, color: player === 'X' ? '#ffd700' : '#ff6b6b' }}>
              ✊ Player X: {score.X}
              {streak.X > 0 && <div style={{ fontSize: '0.8rem', color: '#ffd700' }}>🔥 {streak.X} streak!</div>}
            </div>
            <div style={{ ...playerScoreStyle, color: player === 'O' ? '#ffd700' : '#4ecdc4' }}>
              ✋ Player O: {score.O}
              {streak.O > 0 && <div style={{ fontSize: '0.8rem', color: '#ffd700' }}>🔥 {streak.O} streak!</div>}
            </div>
          </div>

          <div style={statusRowStyle}>
            <div style={roundStyle}>Round {round}/10</div>
            <div style={timerStyle}>
              ⏱️ {timeLeft}s
            </div>
            <div style={roomStyle}>Room: {roomCode}</div>
          </div>
        </div>
      </div>

      <div style={gameAreaStyle}>
        {gameOver && (
          <div style={gameOverStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              {winner === 'draw' ? '🤝 Epic Draw!' : 
               winner === player ? '🏆 Victory!' : '😔 Defeat!'}
            </div>
            <div style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
              Final Score: {score.X} - {score.O}
            </div>
            <button onClick={resetGame} style={resetButtonStyle}>
              🔄 New Game
            </button>
          </div>
        )}

        {showResult && !gameOver && (
          <div style={resultDisplayStyle}>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Round {round} Result
            </div>
            <div style={choicesDisplayStyle}>
              <div style={choiceResultStyle}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  {getChoiceEmoji(playerChoice!)}
                </div>
                <div>You chose {playerChoice}</div>
              </div>
              <div style={{ fontSize: '2rem', margin: '0 2rem' }}>VS</div>
              <div style={choiceResultStyle}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                  {getChoiceEmoji(opponentChoice!)}
                </div>
                <div>Opponent chose {opponentChoice}</div>
              </div>
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: result === 'win' ? '#4CAF50' : result === 'lose' ? '#F44336' : '#FFC107',
              marginTop: '1rem'
            }}>
              {result === 'win' ? '🎉 You Win!' : 
               result === 'lose' ? '😔 You Lose!' : 
               '🤝 It\'s a Tie!'}
            </div>
          </div>
        )}

        {isChoosing && !showResult && !gameOver && (
          <div style={choosingAreaStyle}>
            <div style={instructionStyle}>
              Choose your weapon! Time left: {timeLeft}s
              <div style={{ fontSize: '1rem', marginTop: '10px', opacity: 0.8 }}>
                {window.innerWidth > 768 ? 'Press W for Rock, A for Paper, S for Scissors' : 'Tap to choose'}
              </div>
            </div>

            <div style={choicesGridStyle}>
              {choices.map((choice) => (
                <button
                  key={choice.name}
                  className="choice-button"
                  onClick={() => makeChoice(choice.name)}
                  style={{
                    ...choiceButtonStyle,
                    background: `linear-gradient(135deg, ${choice.color}, ${choice.color}CC)`,
                    transform: animations[choice.name] ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
                    boxShadow: animations[choice.name] 
                      ? `0 0 20px ${choice.color}` 
                      : `0 4px 15px rgba(0, 0, 0, 0.2)`,
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                    {choice.emoji}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {choice.name}
                  </div>
                </button>
              ))}
            </div>

            <div style={progressBarContainerStyle}>
              <div 
                style={{
                  ...progressBarStyle,
                  width: `${(timeLeft / 15) * 100}%`,
                  backgroundColor: timeLeft > 10 ? '#4CAF50' : timeLeft > 5 ? '#FFC107' : '#F44336'
                }}
              />
            </div>
          </div>
        )}

        {roundHistory.length > 0 && (
          <div style={historyStyle}>
            <h3>Round History</h3>
            <div style={historyListStyle}>
              {roundHistory.slice(-5).map((entry) => (
                <div key={entry.round} style={historyItemStyle}>
                  <span>R{entry.round}:</span>
                  <span>{getChoiceEmoji(entry.playerChoice)} vs {getChoiceEmoji(entry.opponentChoice)}</span>
                  <span style={{
                    color: entry.result === 'win' ? '#4CAF50' : 
                          entry.result === 'lose' ? '#F44336' : '#FFC107'
                  }}>
                    {entry.result.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          .choice-button {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }

          .choice-button:before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.6s;
          }

          .choice-button:hover:before {
            left: 100%;
          }

          .choice-button:hover {
            transform: translateY(-5px) scale(1.05) !important;
          }

          .choice-button:active {
            transform: translateY(0) scale(0.95) !important;
          }

          @media (max-width: 768px) {
            .choice-button {
              min-height: 120px;
              padding: 15px;
            }
          }

          @media (max-width: 480px) {
            .choice-button {
              min-height: 100px;
              padding: 10px;
            }
          }
        `}
      </style>
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
  textAlign: 'center',
};

const statusRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '2rem',
  flexWrap: 'wrap',
  fontSize: '1rem',
};

const roundStyle: React.CSSProperties = {
  color: '#4ecdc4',
  fontWeight: 'bold',
};

const timerStyle: React.CSSProperties = {
  color: '#ff6b6b',
  fontWeight: 'bold',
  fontSize: '1.1rem',
};

const roomStyle: React.CSSProperties = {
  color: '#ccc',
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

const resultDisplayStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.8)',
  borderRadius: '20px',
  padding: '2rem',
  textAlign: 'center',
  marginBottom: '2rem',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 255, 255, 0.2)',
};

const choicesDisplayStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '2rem',
  flexWrap: 'wrap',
  margin: '2rem 0',
};

const choiceResultStyle: React.CSSProperties = {
  textAlign: 'center',
  minWidth: '120px',
};

const choosingAreaStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '2rem',
};

const instructionStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  marginBottom: '2rem',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
};

const choicesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: window.innerWidth <= 768 ? '15px' : '20px',
  marginBottom: '2rem',
  maxWidth: '600px',
  margin: '0 auto 2rem auto',
  padding: window.innerWidth <= 768 ? '0 10px' : '0',
};

const choiceButtonStyle: React.CSSProperties = {
  padding: '20px',
  borderRadius: '20px',
  border: '3px solid rgba(255, 255, 255, 0.3)',
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  minHeight: '140px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',
  position: 'relative',
  overflow: 'hidden',
};

const progressBarContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '4px',
  overflow: 'hidden',
  marginTop: '2rem',
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width 1s linear',
};

const historyStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '15px',
  padding: '20px',
  marginTop: '2rem',
  backdropFilter: 'blur(10px)',
};

const historyListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const historyItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  fontSize: '0.9rem',
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

export default MultiplayerRockPaperScissors;