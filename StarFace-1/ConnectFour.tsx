import React, { useEffect, useState } from 'react';

interface Props {
  roomCode: string;
  player: 'X' | 'O';
}

type Board = (string | null)[][];

interface GameState {
  board: Board;
  currentPlayer: 'X' | 'O';
  winner: string | null;
  gameActive: boolean;
}

const ROWS = 6;
const COLS = 7;

const ConnectFour: React.FC<Props> = ({ roomCode, player }) => {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
    currentPlayer: 'X',
    winner: null,
    gameActive: false,
  });
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const localStorageKey = `connectfour_${roomCode}`;

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

  const startGame = () => {
    const newState: GameState = {
      board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
      currentPlayer: 'X',
      winner: null,
      gameActive: true,
    };
    updateGameState(newState);
  };

  const checkWinner = (board: Board, row: number, col: number, player: string): boolean => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal /
      [1, -1],  // diagonal \
    ];

    for (const [dx, dy] of directions) {
      let count = 1; // Count the current piece

      // Check in positive direction
      for (let i = 1; i < 4; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      // Check in negative direction
      for (let i = 1; i < 4; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS && board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      if (count >= 4) {
        return true;
      }
    }

    return false;
  };

  const dropPiece = (col: number) => {
    if (!gameState.gameActive || gameState.winner || gameState.currentPlayer !== player) {
      return;
    }

    const newBoard = gameState.board.map(row => [...row]);
    
    // Find the lowest empty row in the column
    for (let row = ROWS - 1; row >= 0; row--) {
      if (newBoard[row][col] === null) {
        newBoard[row][col] = player;
        
        // Check for winner
        const hasWon = checkWinner(newBoard, row, col, player);
        
        const newState: GameState = {
          board: newBoard,
          currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
          winner: hasWon ? `Player ${player}` : null,
          gameActive: !hasWon,
        };

        // Check for tie
        if (!hasWon && newBoard.every(row => row.every(cell => cell !== null))) {
          newState.winner = 'Tie';
          newState.gameActive = false;
        }

        updateGameState(newState);
        return;
      }
    }
  };

  const resetGame = () => {
    const resetState: GameState = {
      board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
      currentPlayer: 'X',
      winner: null,
      gameActive: false,
    };
    updateGameState(resetState);
  };

  const getCellStyle = (row: number, col: number) => {
    const cell = gameState.board[row][col];
    let backgroundColor = '#f7fafc';
    
    if (cell === 'X') {
      backgroundColor = '#ff4757';
    } else if (cell === 'O') {
      backgroundColor = '#3742fa';
    }

    return {
      ...cellStyle,
      backgroundColor,
    };
  };

  const getColumnStyle = (col: number) => {
    const isHovered = hoveredCol === col;
    const canDrop = gameState.gameActive && !gameState.winner && gameState.currentPlayer === player;
    
    return {
      ...columnStyle,
      backgroundColor: isHovered && canDrop ? 'rgba(255,255,255,0.1)' : 'transparent',
      cursor: canDrop ? 'pointer' : 'default',
    };
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>🔴 Connect Four</h2>
        <div style={infoStyle}>
          <span style={badgeStyle}>Room: {roomCode}</span>
          <span style={badgeStyle}>You: Player {player}</span>
        </div>
      </div>

      <div style={statusStyle}>
        {gameState.winner ? (
          <h3>
            {gameState.winner === 'Tie' ? '🤝 It\'s a Tie!' : 
             gameState.winner === `Player ${player}` ? '🎉 You Win!' : '😢 You Lost!'}
          </h3>
        ) : gameState.gameActive ? (
          <h3>
            {gameState.currentPlayer === player ? '🎯 Your Turn' : '⏳ Opponent\'s Turn'}
          </h3>
        ) : (
          <h3>🎮 Ready to Play?</h3>
        )}
      </div>

      {!gameState.gameActive && !gameState.winner && (
        <div style={controlsStyle}>
          <button onClick={startGame} style={startButtonStyle}>
            🚀 Start Game!
          </button>
          <p style={instructionStyle}>
            Connect 4 pieces in a row to win! Horizontal, vertical, or diagonal!
          </p>
        </div>
      )}

      {gameState.winner && (
        <div style={resultStyle}>
          <button onClick={resetGame} style={resetButtonStyle}>
            🔄 Play Again
          </button>
        </div>
      )}

      <div style={boardStyle}>
        {Array.from({ length: COLS }, (_, col) => (
          <div
            key={col}
            style={getColumnStyle(col)}
            onClick={() => dropPiece(col)}
            onMouseEnter={() => setHoveredCol(col)}
            onMouseLeave={() => setHoveredCol(null)}
          >
            {Array.from({ length: ROWS }, (_, row) => (
              <div key={row} style={getCellStyle(row, col)} />
            ))}
          </div>
        ))}
      </div>

      <div style={instructionsStyle}>
        <p>🎯 Click on a column to drop your piece!</p>
        <p>🔴 Red = Player X • 🔵 Blue = Player O</p>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

const statusStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
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
  marginBottom: '20px',
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
};

const boardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '4px',
  background: 'rgba(255,255,255,0.1)',
  padding: '20px',
  borderRadius: '12px',
  border: '2px solid rgba(255,255,255,0.2)',
  marginBottom: '20px',
  maxWidth: '500px',
  margin: '0 auto 20px auto',
};

const columnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '8px',
  borderRadius: '8px',
  transition: 'background-color 0.2s ease',
};

const cellStyle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  border: '2px solid #4a5568',
  transition: 'all 0.2s ease',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
};

const instructionsStyle: React.CSSProperties = {
  textAlign: 'center',
  color: 'rgba(255,255,255,0.8)',
  fontSize: '14px',
  lineHeight: '1.5',
};

export default ConnectFour;