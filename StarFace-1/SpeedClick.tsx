import React, { useEffect, useState } from 'react';

interface Props {
  roomCode: string;
  player: 'X' | 'O';
}

interface GameState {
  xScore: number;
  oScore: number;
  currentShape: {
    type: string;
    color: string;
    x: number;
    y: number;
    size: number;
  } | null;
  gameActive: boolean;
  winner: string | null;
}

const shapes = ['🔴', '🟢', '🔵', '🟡', '🟣', '🟠', '⭐', '❤️', '💎', '🎯'];
const colors = ['#ff4757', '#2ed573', '#3742fa', '#ffa502', '#a55eea', '#ff6b81', '#26d0ce', '#fd79a8'];

const SpeedClick: React.FC<Props> = ({ roomCode, player }) => {
  const [gameState, setGameState] = useState<GameState>({
    xScore: 0,
    oScore: 0,
    currentShape: null,
    gameActive: false,
    winner: null,
  });
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [shapeStartTime, setShapeStartTime] = useState<number>(0);
  const localStorageKey = `speedclick_${roomCode}`;

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

  const generateRandomShape = () => {
    return {
      type: shapes[Math.floor(Math.random() * shapes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      x: Math.random() * 70 + 10, // 10% to 80% of container width
      y: Math.random() * 60 + 20, // 20% to 80% of container height
      size: Math.random() * 40 + 60, // 60px to 100px
    };
  };

  const startGame = () => {
    const newState: GameState = {
      xScore: 0,
      oScore: 0,
      currentShape: null,
      gameActive: true,
      winner: null,
    };
    updateGameState(newState);
    spawnShape(newState);
  };

  const spawnShape = (currentState: GameState) => {
    if (!currentState.gameActive) return;

    // Random delay between 1-3 seconds
    const delay = Math.random() * 2000 + 1000;
    
    setTimeout(() => {
      if (currentState.gameActive && !currentState.winner) {
        const newShape = generateRandomShape();
        const updatedState = { ...currentState, currentShape: newShape };
        updateGameState(updatedState);
        setShapeStartTime(Date.now());

        // Auto-remove shape after 2 seconds if not clicked
        setTimeout(() => {
          const currentStoredState = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
          if (currentStoredState.currentShape && currentStoredState.gameActive) {
            const stateWithoutShape = { ...currentStoredState, currentShape: null };
            updateGameState(stateWithoutShape);
            spawnShape(stateWithoutShape);
          }
        }, 2000);
      }
    }, delay);
  };

  const handleShapeClick = () => {
    if (!gameState.currentShape || !gameState.gameActive) return;

    const clickTime = Date.now();
    const reaction = clickTime - shapeStartTime;
    setReactionTime(reaction);

    const newState = { ...gameState };
    
    if (player === 'X') {
      newState.xScore += 1;
    } else {
      newState.oScore += 1;
    }

    newState.currentShape = null;

    // Check for winner
    if (newState.xScore >= 10) {
      newState.winner = 'Player X';
      newState.gameActive = false;
    } else if (newState.oScore >= 10) {
      newState.winner = 'Player O';
      newState.gameActive = false;
    }

    updateGameState(newState);

    if (!newState.winner) {
      spawnShape(newState);
    }
  };

  const resetGame = () => {
    const resetState: GameState = {
      xScore: 0,
      oScore: 0,
      currentShape: null,
      gameActive: false,
      winner: null,
    };
    updateGameState(resetState);
    setReactionTime(null);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>⚡ Speed Click</h2>
        <div style={infoStyle}>
          <span style={badgeStyle}>Room: {roomCode}</span>
          <span style={badgeStyle}>You: Player {player}</span>
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

      {reactionTime && (
        <div style={reactionStyle}>
          ⚡ Your reaction time: {reactionTime}ms
        </div>
      )}

      {!gameState.gameActive && !gameState.winner && (
        <div style={controlsStyle}>
          <button onClick={startGame} style={startButtonStyle}>
            🚀 Start Speed Click!
          </button>
          <p style={instructionStyle}>
            Click the shapes as fast as possible! First to 10 wins!
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

      <div style={gameAreaStyle}>
        {gameState.currentShape && gameState.gameActive && (
          <div
            style={{
              ...shapeStyle,
              left: `${gameState.currentShape.x}%`,
              top: `${gameState.currentShape.y}%`,
              fontSize: `${gameState.currentShape.size}px`,
              color: gameState.currentShape.color,
            }}
            onClick={handleShapeClick}
          >
            {gameState.currentShape.type}
          </div>
        )}
        
        {gameState.gameActive && !gameState.currentShape && (
          <div style={waitingStyle}>
            <div style={pulseStyle}>👀</div>
            <p>Get ready...</p>
          </div>
        )}
      </div>

      {gameState.gameActive && (
        <div style={instructionsStyle}>
          <p>🎯 Click the shapes as fast as you can!</p>
          <p>⏱️ Shapes disappear after 2 seconds</p>
        </div>
      )}
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

const reactionStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'rgba(255,255,255,0.2)',
  padding: '10px',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '16px',
  fontWeight: 'bold',
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

const gameAreaStyle: React.CSSProperties = {
  position: 'relative',
  height: '400px',
  background: 'rgba(255,255,255,0.1)',
  borderRadius: '12px',
  border: '2px solid rgba(255,255,255,0.2)',
  marginBottom: '20px',
  overflow: 'hidden',
};

const shapeStyle: React.CSSProperties = {
  position: 'absolute',
  cursor: 'pointer',
  userSelect: 'none',
  transform: 'translate(-50%, -50%)',
  transition: 'transform 0.1s ease',
  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  animation: 'bounce 0.5s ease-in-out',
};

const waitingStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  fontSize: '18px',
  opacity: 0.7,
};

const pulseStyle: React.CSSProperties = {
  fontSize: '48px',
  animation: 'pulse 1s infinite',
};

const instructionsStyle: React.CSSProperties = {
  textAlign: 'center',
  color: 'rgba(255,255,255,0.8)',
  fontSize: '14px',
  lineHeight: '1.5',
};

export default SpeedClick;