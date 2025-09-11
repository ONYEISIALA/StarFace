
import React, { useState, useEffect } from 'react';

interface Props {
  roomCode: string;
  player: 'X' | 'O';
}

const MultiplayerTicTacToe: React.FC<Props> = ({ roomCode, player }) => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState({ X: 0, O: 0 });
  const [round, setRound] = useState(1);
  const [animations, setAnimations] = useState<{[key: number]: boolean}>({});
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);

  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }

    if (squares.every(square => square !== null)) {
      return { winner: 'draw', line: null };
    }

    return { winner: null, line: null };
  };

  const createParticles = (x: number, y: number, color: string) => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 100,
      y: y + (Math.random() - 0.5) * 100,
      color
    }));
    
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 2000);
  };

  const handleClick = (index: number) => {
    if (board[index] || winner || currentPlayer !== player) return;

    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);

    // Add animation
    setAnimations(prev => ({ ...prev, [index]: true }));
    setTimeout(() => {
      setAnimations(prev => ({ ...prev, [index]: false }));
    }, 600);

    // Create particles
    const cellElement = document.getElementById(`cell-${index}`);
    if (cellElement) {
      const rect = cellElement.getBoundingClientRect();
      createParticles(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        player === 'X' ? '#ff6b6b' : '#4ecdc4'
      );
    }

    const result = checkWinner(newBoard);
    if (result.winner) {
      if (result.winner === 'draw') {
        setWinner('draw');
      } else {
        setWinner(result.winner);
        setScore(prev => ({
          ...prev,
          [result.winner as 'X' | 'O']: prev[result.winner as 'X' | 'O'] + 1
        }));
      }
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setAnimations({});
    setRound(prev => prev + 1);
    setParticles([]);
  };

  const startGame = () => {
    setGameStarted(true);
    resetGame();
  };

  const renderCell = (index: number) => {
    const value = board[index];
    const isAnimating = animations[index];
    
    return (
      <div
        id={`cell-${index}`}
        key={index}
        className="game-cell"
        onClick={() => handleClick(index)}
        style={{
          ...cellStyle,
          background: value 
            ? (value === 'X' ? 'linear-gradient(135deg, #ff6b6b, #ee5a52)' : 'linear-gradient(135deg, #4ecdc4, #44a08d)')
            : 'rgba(255, 255, 255, 0.1)',
          transform: isAnimating ? 'scale(1.2) rotateZ(360deg)' : 'scale(1)',
          boxShadow: value 
            ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px currentColor'
            : '0 4px 15px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          transform: isAnimating ? 'scale(1.3)' : 'scale(1)',
          transition: 'transform 0.3s ease'
        }}>
          {value}
        </div>
      </div>
    );
  };

  if (!gameStarted) {
    return (
      <div style={containerStyle}>
        <div style={menuStyle}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            ✖️ Enhanced Tic Tac Toe
          </h2>
          <div style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>
            <p>🎮 <strong>Room:</strong> {roomCode}</p>
            <p>🎯 <strong>You are:</strong> Player {player}</p>
          </div>
          <button onClick={startGame} style={startButtonStyle}>
            🚀 Start Epic Battle!
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
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: particle.color,
            pointerEvents: 'none',
            zIndex: 1000,
            animation: 'particleFade 2s ease-out forwards'
          }}
        />
      ))}

      <div style={headerStyle}>
        <h2 style={{ fontSize: '2rem', margin: '0 0 1rem 0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          ✖️ Epic Tic Tac Toe Battle
        </h2>
        <div style={gameInfoStyle}>
          <div style={scoreStyle}>
            <div style={{ color: '#ff6b6b' }}>❌ Player X: {score.X}</div>
            <div style={{ color: '#4ecdc4' }}>⭕ Player O: {score.O}</div>
          </div>
          <div style={{ fontSize: '1.1rem' }}>Round: {round}</div>
          <div style={{ fontSize: '1rem' }}>Room: {roomCode}</div>
        </div>
      </div>

      <div style={gameAreaStyle}>
        {winner && (
          <div style={winnerBannerStyle}>
            {winner === 'draw' ? (
              <div style={{ color: '#ffd700' }}>🤝 Epic Draw!</div>
            ) : (
              <div style={{ color: winner === 'X' ? '#ff6b6b' : '#4ecdc4' }}>
                🏆 {winner === player ? 'YOU WIN!' : `Player ${winner} Wins!`}
              </div>
            )}
          </div>
        )}

        <div style={boardStyle}>
          {Array.from({ length: 9 }).map((_, index) => renderCell(index))}
        </div>

        <div style={statusStyle}>
          {!winner && (
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
              {currentPlayer === player ? "🎯 Your Turn!" : `⏳ Player ${currentPlayer}'s Turn`}
            </div>
          )}
        </div>

        <div style={controlsStyle}>
          <button onClick={resetGame} style={resetButtonStyle}>
            🔄 New Round
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes particleFade {
            0% { opacity: 1; transform: scale(1) translateY(0); }
            100% { opacity: 0; transform: scale(0.3) translateY(-50px); }
          }

          .game-cell {
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 15px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
          }

          .game-cell:before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.6s;
          }

          .game-cell:hover:before {
            left: 100%;
          }

          .game-cell:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
          }

          .game-cell:active {
            transform: translateY(0) scale(0.98);
          }

          @media (max-width: 768px) {
            .game-cell {
              border-radius: 12px;
              min-height: 80px;
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

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '2rem',
  position: 'relative',
  zIndex: 10,
};

const gameInfoStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '2rem',
  flexWrap: 'wrap',
  marginBottom: '1rem',
};

const scoreStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2rem',
  fontSize: '1.2rem',
  fontWeight: 'bold',
};

const gameAreaStyle: React.CSSProperties = {
  maxWidth: '500px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 10,
};

const winnerBannerStyle: React.CSSProperties = {
  background: 'rgba(255, 215, 0, 0.2)',
  border: '2px solid #ffd700',
  borderRadius: '15px',
  padding: '15px',
  marginBottom: '2rem',
  textAlign: 'center',
  fontSize: '1.8rem',
  fontWeight: 'bold',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3)',
  animation: 'pulse 2s ease-in-out infinite',
};

const boardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '15px',
  marginBottom: '2rem',
  maxWidth: '400px',
  margin: '0 auto 2rem auto',
};

const cellStyle: React.CSSProperties = {
  aspectRatio: '1',
  minHeight: '100px',
  borderRadius: '15px',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backdropFilter: 'blur(10px)',
  position: 'relative',
  overflow: 'hidden',
};

const statusStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '2rem',
  minHeight: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '15px',
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
  minWidth: '200px',
};

const resetButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  padding: '12px 24px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  transition: 'all 0.3s ease',
  minHeight: '48px',
};

export default MultiplayerTicTacToe;
