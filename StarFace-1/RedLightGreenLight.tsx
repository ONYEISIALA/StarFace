
import React, { useState, useEffect, useCallback } from 'react';

interface RedLightGreenLightProps {
  roomCode: string;
  player: 'X' | 'O';
}

interface PlayerState {
  id: string;
  position: number;
  moving: boolean;
  eliminated: boolean;
  color: string;
}

const RedLightGreenLight: React.FC<RedLightGreenLightProps> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [lightState, setLightState] = useState<'green' | 'red'>('red');
  const [players, setPlayers] = useState<PlayerState[]>([
    { id: 'X', position: 0, moving: false, eliminated: false, color: '#ff4444' },
    { id: 'O', position: 0, moving: false, eliminated: false, color: '#4444ff' }
  ]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [winner, setWinner] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [keys, setKeys] = useState<{[key: string]: boolean}>({});

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      setKeys(prev => ({...prev, move: true}));
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      setKeys(prev => ({...prev, move: false}));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Light control system
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const lightInterval = setInterval(() => {
      setLightState(prev => {
        const newState = Math.random() > 0.5 ? 'green' : 'red';
        return newState;
      });
    }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds

    return () => clearInterval(lightInterval);
  }, [gameStarted, gameOver]);

  // Game timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          setWinner('Time Up! No winner.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  // Player movement and collision detection
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setPlayers(prevPlayers => {
        return prevPlayers.map(p => {
          if (p.eliminated) return p;

          let newPosition = p.position;
          let isMoving = false;

          // Check if current player is moving
          if (p.id === player && keys.move && lightState === 'green') {
            newPosition = Math.min(100, p.position + 1);
            isMoving = true;
          } else if (p.id !== player) {
            // AI movement for other player
            if (lightState === 'green' && Math.random() > 0.3) {
              newPosition = Math.min(100, p.position + 0.5);
              isMoving = true;
            }
          }

          // Check if player moved during red light
          if (lightState === 'red' && isMoving && p.id === player) {
            return { ...p, eliminated: true, moving: false };
          }

          // Check for win condition
          if (newPosition >= 100 && !gameOver) {
            setWinner(`Player ${p.id} Wins!`);
            setGameOver(true);
          }

          return { ...p, position: newPosition, moving: isMoving };
        });
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, lightState, keys.move, player]);

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(60);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setTimeLeft(60);
    setLightState('red');
    setPlayers([
      { id: 'X', position: 0, moving: false, eliminated: false, color: '#ff4444' },
      { id: 'O', position: 0, moving: false, eliminated: false, color: '#4444ff' }
    ]);
  };

  return (
    <div style={containerStyle}>
      <h2>🚦 Red Light, Green Light</h2>
      <p>Room: <span style={roomCodeStyle}>{roomCode}</span></p>
      <p>You are Player <span style={{color: player === 'X' ? '#ff4444' : '#4444ff'}}>{player}</span></p>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>🎮 Ready to Play?</h3>
          <div style={instructionsStyle}>
            <p>📋 <strong>Instructions:</strong></p>
            <p>🟢 <strong>Green Light:</strong> Hold SPACE or W to move forward</p>
            <p>🔴 <strong>Red Light:</strong> STOP moving immediately!</p>
            <p>🎯 <strong>Goal:</strong> Reach the finish line first</p>
            <p>⚠️ <strong>Warning:</strong> Moving during red light = elimination!</p>
          </div>
          <button onClick={startGame} style={buttonStyle}>🏁 Start Game</button>
        </div>
      ) : (
        <div>
          <div style={gameInfoStyle}>
            <div style={lightDisplayStyle}>
              <div style={{
                ...lightStyle,
                backgroundColor: lightState === 'green' ? '#00ff00' : '#ff0000'
              }}>
                {lightState === 'green' ? '🟢 GREEN LIGHT' : '🔴 RED LIGHT'}
              </div>
            </div>
            <div style={timerStyle}>Time: {timeLeft}s</div>
          </div>

          <div style={raceTrackStyle}>
            {/* Start line */}
            <div style={startLineStyle}>START</div>
            
            {/* Finish line */}
            <div style={finishLineStyle}>FINISH</div>

            {/* Players */}
            {players.map(p => (
              <div
                key={p.id}
                style={{
                  ...playerStyle,
                  left: `${p.position}%`,
                  backgroundColor: p.eliminated ? '#666' : p.color,
                  opacity: p.eliminated ? 0.5 : 1
                }}
              >
                {p.eliminated ? '💀' : '🏃'}
                <span style={playerLabelStyle}>{p.id}</span>
              </div>
            ))}

            {/* Progress markers */}
            {[25, 50, 75].map(mark => (
              <div key={mark} style={{...progressMarkerStyle, left: `${mark}%`}}>
                {mark}%
              </div>
            ))}
          </div>

          <div style={controlsStyle}>
            <p>
              {lightState === 'green' 
                ? '🟢 GO! Hold SPACE/W to move!' 
                : '🔴 STOP! Release all keys!'
              }
            </p>
            {players.find(p => p.id === player)?.eliminated && (
              <p style={eliminatedStyle}>💀 You were eliminated!</p>
            )}
          </div>

          {gameOver && (
            <div style={resultStyle}>
              <h3>🏆 Game Over!</h3>
              <p style={winnerStyle}>{winner}</p>
              <button onClick={resetGame} style={buttonStyle}>🔄 Play Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px',
  backgroundColor: '#1a1a2e',
  color: '#fff',
  minHeight: '100vh'
};

const roomCodeStyle: React.CSSProperties = {
  color: '#00ff88',
  fontWeight: 'bold'
};

const menuStyle: React.CSSProperties = {
  backgroundColor: '#16213e',
  padding: '30px',
  borderRadius: '15px',
  margin: '20px auto',
  maxWidth: '600px'
};

const instructionsStyle: React.CSSProperties = {
  backgroundColor: '#0f172a',
  padding: '20px',
  borderRadius: '10px',
  margin: '20px 0',
  textAlign: 'left'
};

const buttonStyle: React.CSSProperties = {
  padding: '15px 30px',
  backgroundColor: '#e53e3e',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const gameInfoStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '20px 0'
};

const lightDisplayStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold'
};

const lightStyle: React.CSSProperties = {
  padding: '15px 30px',
  borderRadius: '10px',
  color: 'white',
  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
};

const timerStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ffd700'
};

const raceTrackStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '200px',
  backgroundColor: '#4a5568',
  border: '3px solid #fff',
  borderRadius: '10px',
  margin: '20px 0',
  overflow: 'hidden'
};

const startLineStyle: React.CSSProperties = {
  position: 'absolute',
  left: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#00ff00',
  fontWeight: 'bold',
  fontSize: '14px',
  writingMode: 'vertical-lr'
};

const finishLineStyle: React.CSSProperties = {
  position: 'absolute',
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#ff0000',
  fontWeight: 'bold',
  fontSize: '14px',
  writingMode: 'vertical-lr'
};

const playerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  transition: 'left 0.1s ease-out',
  border: '2px solid #fff'
};

const playerLabelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '-25px',
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#fff'
};

const progressMarkerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '10px',
  color: '#ccc',
  fontSize: '12px',
  transform: 'translateX(-50%)'
};

const controlsStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0'
};

const eliminatedStyle: React.CSSProperties = {
  color: '#ff4444',
  fontSize: '20px',
  fontWeight: 'bold'
};

const resultStyle: React.CSSProperties = {
  backgroundColor: '#16213e',
  padding: '20px',
  borderRadius: '10px',
  margin: '20px auto',
  maxWidth: '400px'
};

const winnerStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#ffd700'
};

export default RedLightGreenLight;
