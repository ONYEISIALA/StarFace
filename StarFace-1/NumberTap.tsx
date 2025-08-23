import React, { useEffect, useState } from 'react';

interface Props {
  roomCode: string;
  player: 'X' | 'O';
}

interface GameState {
  xProgress: number;
  oProgress: number;
  gameActive: boolean;
  winner: string | null;
  xTime: number | null;
  oTime: number | null;
}

const NumberTap: React.FC<Props> = ({ roomCode, player }) => {
  const [gameState, setGameState] = useState<GameState>({
    xProgress: 1,
    oProgress: 1,
    gameActive: false,
    winner: null,
    xTime: null,
    oTime: null,
  });
  const [startTime, setStartTime] = useState<number>(0);
  const [grid, setGrid] = useState<number[]>([]);
  const localStorageKey = `numbertap_${roomCode}`;

  useEffect(() => {
    generateGrid();
    
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

  const generateGrid = () => {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
    // Shuffle the array
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    setGrid(numbers);
  };

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
    generateGrid();
    const newState: GameState = {
      xProgress: 1,
      oProgress: 1,
      gameActive: true,
      winner: null,
      xTime: null,
      oTime: null,
    };
    updateGameState(newState);
    setStartTime(Date.now());
  };

  const handleNumberClick = (number: number) => {
    if (!gameState.gameActive || gameState.winner) return;

    const currentProgress = player === 'X' ? gameState.xProgress : gameState.oProgress;
    
    if (number === currentProgress) {
      const newState = { ...gameState };
      
      if (player === 'X') {
        newState.xProgress += 1;
        if (newState.xProgress > 25) {
          newState.winner = 'Player X';
          newState.gameActive = false;
          newState.xTime = Date.now() - startTime;
        }
      } else {
        newState.oProgress += 1;
        if (newState.oProgress > 25) {
          newState.winner = 'Player O';
          newState.gameActive = false;
          newState.oTime = Date.now() - startTime;
        }
      }
      
      updateGameState(newState);
    }
  };

  const resetGame = () => {
    generateGrid();
    const resetState: GameState = {
      xProgress: 1,
      oProgress: 1,
      gameActive: false,
      winner: null,
      xTime: null,
      oTime: null,
    };
    updateGameState(resetState);
  };

  const getButtonStyle = (number: number) => {
    const currentProgress = player === 'X' ? gameState.xProgress : gameState.oProgress;
    const otherProgress = player === 'X' ? gameState.oProgress : gameState.xProgress;
    
    let backgroundColor = '#4a5568';
    let color = '#e2e8f0';
    let border = '2px solid #718096';
    
    if (number < currentProgress) {
      // Already clicked by me
      backgroundColor = player === 'X' ? '#48bb78' : '#4299e1';
      color = 'white';
      border = `2px solid ${player === 'X' ? '#38a169' : '#3182ce'}`;
    } else if (number < otherProgress) {
      // Already clicked by opponent
      backgroundColor = player === 'X' ? '#4299e1' : '#48bb78';
      color = 'white';
      border = `2px solid ${player === 'X' ? '#3182ce' : '#38a169'}`;
    } else if (number === currentProgress) {
      // Next number for me
      backgroundColor = '#ed8936';
      color = 'white';
      border = '2px solid #dd6b20';
      // Add pulsing animation
    }
    
    return {
      ...numberButtonStyle,
      backgroundColor,
      color,
      border,
      animation: number === currentProgress ? 'pulse 1s infinite' : 'none',
    };
  };

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(2) + 's';
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>🔢 Number Tap Race</h2>
        <div style={infoStyle}>
          <span style={badgeStyle}>Room: {roomCode}</span>
          <span style={badgeStyle}>You: Player {player}</span>
        </div>
      </div>

      <div style={progressStyle}>
        <div style={{ ...progressBarStyle, backgroundColor: '#ff4757' }}>
          Player X: {gameState.xProgress - 1}/25
          {gameState.xTime && <span> - {formatTime(gameState.xTime)}</span>}
        </div>
        <div style={{ ...progressBarStyle, backgroundColor: '#3742fa' }}>
          Player O: {gameState.oProgress - 1}/25
          {gameState.oTime && <span> - {formatTime(gameState.oTime)}</span>}
        </div>
      </div>

      {!gameState.gameActive && !gameState.winner && (
        <div style={controlsStyle}>
          <button onClick={startGame} style={startButtonStyle}>
            🚀 Start Number Race!
          </button>
          <p style={instructionStyle}>
            Tap numbers 1-25 in order as fast as possible!
          </p>
        </div>
      )}

      {gameState.winner && (
        <div style={resultStyle}>
          <h3>🏆 Game Over!</h3>
          <h4>
            {gameState.winner === `Player ${player}` ? '🎉 You Win!' : '😢 You Lost!'}
          </h4>
          <p>
            Your time: {player === 'X' ? 
              (gameState.xTime ? formatTime(gameState.xTime) : 'N/A') : 
              (gameState.oTime ? formatTime(gameState.oTime) : 'N/A')
            }
          </p>
          <button onClick={resetGame} style={resetButtonStyle}>
            🔄 Play Again
          </button>
        </div>
      )}

      <div style={gridStyle}>
        {grid.map((number, index) => (
          <button
            key={index}
            style={getButtonStyle(number)}
            onClick={() => handleNumberClick(number)}
            disabled={!gameState.gameActive}
          >
            {number}
          </button>
        ))}
      </div>

      {gameState.gameActive && (
        <div style={instructionsStyle}>
          <p>🎯 Next number: {player === 'X' ? gameState.xProgress : gameState.oProgress}</p>
          <p>⚡ Click numbers in order from 1 to 25!</p>
        </div>
      )}
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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

const progressStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '20px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const progressBarStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: '8px',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '16px',
  minWidth: '200px',
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

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '10px',
  maxWidth: '400px',
  margin: '0 auto 20px auto',
  padding: '20px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '12px',
  border: '2px solid rgba(255,255,255,0.2)',
};

const numberButtonStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '8px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const instructionsStyle: React.CSSProperties = {
  textAlign: 'center',
  color: 'rgba(255,255,255,0.8)',
  fontSize: '14px',
  lineHeight: '1.5',
};

export default NumberTap;