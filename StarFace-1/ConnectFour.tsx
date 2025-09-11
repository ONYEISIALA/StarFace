
import React, { useState, useEffect } from 'react';

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

interface WinLine {
  cells: { row: number; col: number }[];
  color: string;
}

const ConnectFour: React.FC<Props> = ({ roomCode, player }) => {
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(6).fill(null).map(() => Array(7).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [winLine, setWinLine] = useState<WinLine | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [round, setRound] = useState(1);
  const [dropAnimation, setDropAnimation] = useState<{ col: number; row: number } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hoverColumn, setHoverColumn] = useState<number | null>(null);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);

  const createParticles = (x: number, y: number, color: string, count: number = 12) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
        color,
        life: 1,
        size: Math.random() * 4 + 2
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
        life: p.life - 0.015,
        size: p.size * 0.99
      }))
      .filter(p => p.life > 0 && p.size > 0.8)
    );
  };

  useEffect(() => {
    const interval = setInterval(updateParticles, 1000 / 60);
    return () => clearInterval(interval);
  }, []);

  const checkWinner = (newBoard: (string | null)[][]) => {
    const rows = 6;
    const cols = 7;

    // Check all directions
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal \
      [1, -1],  // diagonal /
    ];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const piece = newBoard[row][col];
        if (!piece) continue;

        for (const [dx, dy] of directions) {
          const line: { row: number; col: number }[] = [{ row, col }];
          
          // Check forward direction
          for (let i = 1; i < 4; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            
            if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) break;
            if (newBoard[newRow][newCol] !== piece) break;
            
            line.push({ row: newRow, col: newCol });
          }

          if (line.length === 4) {
            return {
              winner: piece,
              line: {
                cells: line,
                color: piece === 'X' ? '#ff6b6b' : '#4ecdc4'
              }
            };
          }
        }
      }
    }

    // Check for draw
    if (newBoard.every(row => row.every(cell => cell !== null))) {
      return { winner: 'draw', line: null };
    }

    return { winner: null, line: null };
  };

  const dropPiece = (col: number) => {
    if (currentPlayer !== player || winner || !gameStarted) return;

    // Find the lowest empty row in the column
    let targetRow = -1;
    for (let row = 5; row >= 0; row--) {
      if (board[row][col] === null) {
        targetRow = row;
        break;
      }
    }

    if (targetRow === -1) return; // Column is full

    // Start drop animation
    setDropAnimation({ col, row: targetRow });

    setTimeout(() => {
      const newBoard = [...board];
      newBoard[targetRow][col] = currentPlayer;
      setBoard(newBoard);
      setLastMove({ row: targetRow, col });
      setDropAnimation(null);

      // Create particles for the drop
      const cellX = col * 80 + 40;
      const cellY = targetRow * 80 + 40;
      createParticles(cellX, cellY, currentPlayer === 'X' ? '#ff6b6b' : '#4ecdc4', 8);

      const result = checkWinner(newBoard);
      if (result.winner) {
        if (result.winner === 'draw') {
          setWinner('draw');
          setGameOver(true);
        } else {
          setWinner(result.winner);
          setWinLine(result.line);
          setScores(prev => ({
            ...prev,
            [result.winner as 'X' | 'O']: prev[result.winner as 'X' | 'O'] + 1
          }));
          setGameOver(true);

          // Create celebration particles
          if (result.line) {
            result.line.cells.forEach(cell => {
              const cellX = cell.col * 80 + 40;
              const cellY = cell.row * 80 + 40;
              createParticles(cellX, cellY, '#ffd700', 15);
            });
          }
        }
      } else {
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      }
    }, 300);
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setWinner(null);
    setWinLine(null);
    setBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
    setCurrentPlayer('X');
    setDropAnimation(null);
    setLastMove(null);
    setParticles([]);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner(null);
    setWinLine(null);
    setBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
    setCurrentPlayer('X');
    setRound(prev => prev + 1);
    setDropAnimation(null);
    setLastMove(null);
    setParticles([]);
  };

  if (!gameStarted) {
    return (
      <div style={containerStyle}>
        <div style={menuStyle}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            🔴 Connect Four Pro
          </h2>
          <div style={gameInfoStyle}>
            <p>🎮 <strong>Room:</strong> {roomCode}</p>
            <p>🎯 <strong>You are:</strong> Player {player}</p>
            <p>⚡ <strong>Goal:</strong> Connect 4 pieces in a row to win!</p>
            <p>🎪 <strong>How to play:</strong> Click columns to drop your pieces</p>
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
          🔴 Connect Four Pro Arena
        </h2>
        
        <div style={gameStatsStyle}>
          <div style={scoreboardStyle}>
            <div style={{ ...playerScoreStyle, color: player === 'X' ? '#ffd700' : '#ff6b6b' }}>
              🔴 Player X: {scores.X}
            </div>
            <div style={{ ...playerScoreStyle, color: player === 'O' ? '#ffd700' : '#4ecdc4' }}>
              🔵 Player O: {scores.O}
            </div>
          </div>
          
          <div style={statusRowStyle}>
            <div style={roundStyle}>Round {round}</div>
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
              Score: {scores.X} - {scores.O}
            </div>
            <button onClick={resetGame} style={resetButtonStyle}>
              🔄 New Round
            </button>
          </div>
        )}

        {!gameOver && (
          <div style={turnIndicatorStyle}>
            {currentPlayer === player ? "🎯 Your Turn!" : `⏳ Player ${currentPlayer}'s Turn`}
            {dropAnimation && (
              <div style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                Dropping piece... 💫
              </div>
            )}
          </div>
        )}

        {/* Column Headers for Mobile */}
        <div style={columnHeadersStyle}>
          {Array.from({ length: 7 }).map((_, col) => (
            <button
              key={col}
              onClick={() => dropPiece(col)}
              onMouseEnter={() => setHoverColumn(col)}
              onMouseLeave={() => setHoverColumn(null)}
              disabled={currentPlayer !== player || gameOver || dropAnimation !== null}
              style={{
                ...columnButtonStyle,
                background: hoverColumn === col 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'rgba(255, 255, 255, 0.1)',
                opacity: currentPlayer === player && !gameOver ? 1 : 0.5,
              }}
            >
              ⬇️
            </button>
          ))}
        </div>

        <div style={boardContainerStyle}>
          <div style={boardStyle}>
            {board.map((row, rowIndex) => (
              row.map((cell, colIndex) => {
                const isWinCell = winLine?.cells.some(
                  winCell => winCell.row === rowIndex && winCell.col === colIndex
                );
                const isLastMove = lastMove?.row === rowIndex && lastMove?.col === colIndex;
                const isDropping = dropAnimation?.col === colIndex && dropAnimation?.row === rowIndex;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="connect-cell"
                    style={{
                      ...cellStyle,
                      background: isWinCell 
                        ? `radial-gradient(circle, ${winLine?.color}, rgba(255, 215, 0, 0.3))`
                        : '#1a202c',
                      border: isLastMove 
                        ? '3px solid #ffd700' 
                        : '2px solid #4a5568',
                      transform: isDropping ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {cell && (
                      <div
                        className="game-piece"
                        style={{
                          ...pieceStyle,
                          background: cell === 'X' 
                            ? 'radial-gradient(circle at 30% 30%, #ff8a80, #ff6b6b, #e53e3e)'
                            : 'radial-gradient(circle at 30% 30%, #81e6d9, #4ecdc4, #319795)',
                          boxShadow: isWinCell 
                            ? `0 0 20px ${cell === 'X' ? '#ff6b6b' : '#4ecdc4'}, 0 0 40px rgba(255, 215, 0, 0.5)`
                            : `0 4px 15px rgba(${cell === 'X' ? '255, 107, 107' : '78, 205, 196'}, 0.4)`,
                          animation: isDropping ? 'dropBounce 0.3s ease-out' : 
                                    isLastMove ? 'pulse 1s ease-in-out' :
                                    isWinCell ? 'winGlow 2s ease-in-out infinite' : 'none',
                        }}
                      />
                    )}
                  </div>
                );
              })
            ))}
          </div>
        </div>

        {/* Mobile Column Buttons */}
        <div style={mobileControlsStyle}>
          {Array.from({ length: 7 }).map((_, col) => (
            <button
              key={col}
              className="mobile-control-btn"
              onClick={() => dropPiece(col)}
              disabled={currentPlayer !== player || gameOver || dropAnimation !== null}
              style={{
                ...mobileColumnButtonStyle,
                opacity: currentPlayer === player && !gameOver ? 1 : 0.5,
                background: board[0][col] === null 
                  ? 'linear-gradient(135deg, #4ecdc4, #44a08d)'
                  : 'linear-gradient(135deg, #666, #444)',
              }}
            >
              {col + 1}
            </button>
          ))}
        </div>
      </div>

      <style>
        {`
          @keyframes dropBounce {
            0% { transform: scale(0) translateY(-20px); }
            50% { transform: scale(1.2) translateY(5px); }
            100% { transform: scale(1) translateY(0); }
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          @keyframes winGlow {
            0%, 100% { 
              box-shadow: 0 0 20px currentColor, 0 0 40px rgba(255, 215, 0, 0.3); 
            }
            50% { 
              box-shadow: 0 0 30px currentColor, 0 0 60px rgba(255, 215, 0, 0.6); 
            }
          }

          .connect-cell {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }

          .connect-cell:before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transition: left 0.6s;
          }

          .connect-cell:hover:before {
            left: 100%;
          }

          .game-piece {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .mobile-control-btn {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          @media (max-width: 768px) {
            .connect-cell {
              min-height: 50px;
              border-radius: 8px;
            }

            .game-piece {
              width: 40px;
              height: 40px;
            }
          }

          @media (max-width: 480px) {
            .connect-cell {
              min-height: 45px;
              border-radius: 6px;
            }

            .game-piece {
              width: 35px;
              height: 35px;
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

const turnIndicatorStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '1.3rem',
  fontWeight: 'bold',
  marginBottom: '2rem',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
};

const columnHeadersStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '5px',
  marginBottom: '1rem',
  maxWidth: '560px',
  margin: '0 auto 1rem auto',
};

const columnButtonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '8px',
  color: 'white',
  fontSize: '1.5rem',
  padding: '8px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  minHeight: '40px',
};

const boardContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '2rem',
};

const boardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gridTemplateRows: 'repeat(6, 1fr)',
  gap: '8px',
  background: 'rgba(26, 32, 44, 0.9)',
  padding: '20px',
  borderRadius: '20px',
  border: '3px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(10px)',
  maxWidth: '560px',
};

const cellStyle: React.CSSProperties = {
  width: '70px',
  height: '70px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
};

const pieceStyle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  position: 'relative',
};

const mobileControlsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '10px',
  marginTop: '2rem',
  maxWidth: '560px',
  margin: '2rem auto 0 auto',
};

const mobileColumnButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  padding: '12px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  minHeight: '50px',
  touchAction: 'manipulation',
  userSelect: 'none',
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

export default ConnectFour;
