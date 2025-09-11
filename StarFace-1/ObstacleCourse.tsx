
import React, { useState, useEffect, useCallback } from 'react';

interface ObstacleCourseProps {
  roomCode: string;
  player: 'X' | 'O';
}

interface PlayerState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  completed: boolean;
  time: number;
  color: string;
  lives: number;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'moving' | 'platform' | 'bounce' | 'lava';
  moving?: boolean;
  direction?: number;
  speed?: number;
}

const ObstacleCourse: React.FC<ObstacleCourseProps> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<PlayerState[]>([
    { id: 'X', x: 50, y: 350, vx: 0, vy: 0, onGround: true, completed: false, time: 0, color: '#ff4444', lives: 3 },
    { id: 'O', x: 50, y: 320, vx: 0, vy: 0, onGround: true, completed: false, time: 0, color: '#4444ff', lives: 3 }
  ]);
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([
    { id: '1', x: 150, y: 320, width: 30, height: 60, type: 'spike' },
    { id: '2', x: 250, y: 280, width: 80, height: 20, type: 'platform' },
    { id: '3', x: 350, y: 200, width: 25, height: 25, type: 'moving', moving: true, direction: 1, speed: 2 },
    { id: '4', x: 450, y: 350, width: 100, height: 30, type: 'lava' },
    { id: '5', x: 580, y: 280, width: 40, height: 20, type: 'bounce' },
    { id: '6', x: 650, y: 200, width: 30, height: 80, type: 'spike' },
    { id: '7', x: 750, y: 250, width: 25, height: 25, type: 'moving', moving: true, direction: -1, speed: 3 }
  ]);
  
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [startTime, setStartTime] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({...prev, [e.key.toLowerCase()]: true}));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({...prev, [e.key.toLowerCase()]: false}));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Update moving obstacles
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const obstacleTimer = setInterval(() => {
      setObstacles(prev => prev.map(obs => {
        if (obs.moving) {
          let newY = obs.y + (obs.direction! * obs.speed!);
          if (newY <= 100 || newY >= 350) {
            return { ...obs, direction: obs.direction! * -1, y: newY };
          }
          return { ...obs, y: newY };
        }
        return obs;
      }));
    }, 50);

    return () => clearInterval(obstacleTimer);
  }, [gameStarted, gameOver]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setPlayers(prevPlayers => {
        return prevPlayers.map(p => {
          if (p.completed || p.lives <= 0) return p;

          let newX = p.x;
          let newY = p.y;
          let newVx = p.vx;
          let newVy = p.vy;
          let newOnGround = false;

          if (p.id === player) {
            // Player movement with physics
            if (keys['a'] || keys['arrowleft']) newVx = Math.max(-6, newVx - 0.5);
            if (keys['d'] || keys['arrowright']) newVx = Math.min(6, newVx + 0.5);
            if ((keys['w'] || keys['arrowup'] || keys[' ']) && p.onGround) {
              newVy = -12; // Jump
              newOnGround = false;
            }
          } else {
            // AI movement with advanced pathfinding
            const targetX = 900; // AI always moves towards finish
            if (newX < targetX - 10) {
              newVx = Math.min(4, newVx + 0.3);
            }
            
            // AI jumping logic
            const nearestObstacle = obstacles.find(obs => 
              obs.x > newX && obs.x < newX + 100 && 
              Math.abs(obs.y - newY) < 50
            );
            
            if (nearestObstacle && p.onGround) {
              newVy = -10; // AI jumps
              newOnGround = false;
            }
          }

          // Apply friction
          newVx *= 0.85;

          // Apply gravity
          if (!p.onGround) {
            newVy += 0.8; // Gravity
          }

          // Update position
          newX += newVx;
          newY += newVy;

          // Check ground collision
          if (newY >= 350) {
            newY = 350;
            newVy = 0;
            newOnGround = true;
          }

          // Check platform collisions
          for (const obstacle of obstacles) {
            if (obstacle.type === 'platform') {
              if (newX + 15 > obstacle.x && 
                  newX < obstacle.x + obstacle.width &&
                  newY + 15 > obstacle.y && 
                  newY < obstacle.y + obstacle.height &&
                  newVy > 0) {
                newY = obstacle.y - 15;
                newVy = 0;
                newOnGround = true;
              }
            }
          }

          // Check hazard collisions
          for (const obstacle of obstacles) {
            const collision = newX + 15 > obstacle.x && 
                             newX < obstacle.x + obstacle.width &&
                             newY + 15 > obstacle.y && 
                             newY < obstacle.y + obstacle.height;
            
            if (collision) {
              if (obstacle.type === 'spike' || obstacle.type === 'lava' || obstacle.type === 'moving') {
                // Take damage and reset position
                const newLives = p.lives - 1;
                if (newLives <= 0) {
                  return { ...p, lives: 0, x: 50, y: 350 };
                } else {
                  return { ...p, lives: newLives, x: 50, y: 350, vx: 0, vy: 0, onGround: true };
                }
              } else if (obstacle.type === 'bounce') {
                newVy = -15; // Super jump
                newOnGround = false;
              }
            }
          }

          // Boundary checks
          newX = Math.max(20, Math.min(950, newX));

          // Check if player reached finish
          if (newX >= 900 && !p.completed) {
            const finishTime = (Date.now() - startTime) / 1000;
            if (!gameOver) {
              setWinner(`Player ${p.id} Wins! Time: ${finishTime.toFixed(2)}s`);
              setGameOver(true);
            }
            return { ...p, x: newX, y: newY, vx: newVx, vy: newVy, onGround: newOnGround, completed: true, time: finishTime };
          }

          return { ...p, x: newX, y: newY, vx: newVx, vy: newVy, onGround: newOnGround };
        });
      });
    }, 20); // Smoother physics at 50fps

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, keys, player, obstacles, startTime]);

  const startGame = () => {
    setGameStarted(true);
    setStartTime(Date.now());
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setStartTime(0);
    setPlayers([
      { id: 'X', x: 50, y: 350, vx: 0, vy: 0, onGround: true, completed: false, time: 0, color: '#ff4444', lives: 3 },
      { id: 'O', x: 50, y: 320, vx: 0, vy: 0, onGround: true, completed: false, time: 0, color: '#4444ff', lives: 3 }
    ]);
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          
          @keyframes wave {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
          }
          
          @keyframes glow {
            0%, 100% { text-shadow: 0 0 20px #ffd700; }
            50% { text-shadow: 0 0 30px #ffd700, 0 0 40px #ffd700; }
          }
          
          @keyframes lavaFlow {
            0% { background-position: 0% 0%; }
            100% { background-position: 100% 0%; }
          }
        `}
      </style>

      <h2>🏃 Wipeout Championship</h2>
      <p>Room: <span style={roomCodeStyle}>{roomCode}</span></p>
      <p>You are Player <span style={{color: player === 'X' ? '#ff4444' : '#4444ff'}}>{player}</span></p>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>🏆 Ultimate Obstacle Challenge</h3>
          <div style={instructionsStyle}>
            <p>📋 <strong>Championship Rules:</strong></p>
            <p>🏃 <strong>Move:</strong> A/D or Left/Right Arrows</p>
            <p>🦘 <strong>Jump:</strong> W, Up Arrow, or SPACE</p>
            <p>🎯 <strong>Goal:</strong> Reach the finish line first</p>
            <p>💔 <strong>Lives:</strong> 3 lives, lose one per obstacle hit</p>
            <p>⚠️ <strong>Hazards:</strong> Spikes, Lava, Moving Blocks</p>
            <p>🟢 <strong>Helpers:</strong> Platforms, Bounce Pads</p>
          </div>
          <button onClick={startGame} style={buttonStyle}>🏁 Start Championship</button>
        </div>
      ) : (
        <div>
          <div style={gameInfoStyle}>
            <div style={livesStyle}>
              {players.map(p => (
                <span key={p.id} style={{color: p.color, marginRight: '20px'}}>
                  Player {p.id}: {'❤️'.repeat(p.lives)}
                </span>
              ))}
            </div>
          </div>

          <div style={courseStyle}>
            {/* Enhanced environment */}
            <div style={skyStyle}></div>
            <div style={cloudsStyle}>☁️ ☁️ ☁️</div>
            <div style={mountainsStyle}>🏔️🏔️🏔️🏔️🏔️</div>
            
            {/* Start line */}
            <div style={startLineStyle}>🏁 START</div>
            
            {/* Finish line */}
            <div style={finishLineStyle}>🏆 FINISH</div>

            {/* Ground */}
            <div style={groundStyle}></div>

            {/* Enhanced obstacles */}
            {obstacles.map(obstacle => {
              let obstacleStyle = baseObstacleStyle;
              let content = '';
              
              switch (obstacle.type) {
                case 'spike':
                  obstacleStyle = { ...obstacleStyle, backgroundColor: '#ff0000', border: '2px solid #cc0000' };
                  content = '🔺🔺🔺';
                  break;
                case 'moving':
                  obstacleStyle = { ...obstacleStyle, backgroundColor: '#ff9900', border: '2px solid #cc7700', boxShadow: '0 0 15px #ff9900' };
                  content = '⚙️';
                  break;
                case 'platform':
                  obstacleStyle = { ...obstacleStyle, backgroundColor: '#8B4513', border: '2px solid #654321' };
                  content = '🟫';
                  break;
                case 'bounce':
                  obstacleStyle = { ...obstacleStyle, backgroundColor: '#00ff00', border: '2px solid #00cc00', animation: 'bounce 1s infinite' };
                  content = '🟢';
                  break;
                case 'lava':
                  obstacleStyle = { 
                    ...obstacleStyle, 
                    background: 'linear-gradient(90deg, #ff4500, #ff6347, #ff4500)',
                    backgroundSize: '200% 100%',
                    animation: 'lavaFlow 2s linear infinite',
                    border: '2px solid #cc3300',
                    boxShadow: '0 0 20px #ff4500'
                  };
                  content = '🔥🔥🔥';
                  break;
              }

              return (
                <div
                  key={obstacle.id}
                  style={{
                    ...obstacleStyle,
                    left: obstacle.x,
                    top: obstacle.y,
                    width: obstacle.width,
                    height: obstacle.height
                  }}
                >
                  {content}
                </div>
              );
            })}

            {/* Enhanced players */}
            {players.map(p => (
              <div
                key={p.id}
                style={{
                  ...playerStyle,
                  left: p.x,
                  top: p.y,
                  backgroundColor: p.color,
                  opacity: p.lives > 0 ? 1 : 0.3,
                  boxShadow: `0 0 15px ${p.color}`,
                  border: p.lives > 0 ? '3px solid #fff' : '2px solid #666'
                }}
              >
                <div style={playerIconStyle}>{p.completed ? '🏆' : p.lives > 0 ? '🏃‍♂️' : '💀'}</div>
                <div style={playerLabelStyle}>{p.id}</div>
                <div style={livesDisplayStyle}>{'❤️'.repeat(p.lives)}</div>
              </div>
            ))}

            {/* Collectible items */}
            <div style={{...collectibleStyle, left: 300, top: 250}}>⭐</div>
            <div style={{...collectibleStyle, left: 500, top: 180}}>💎</div>
            <div style={{...collectibleStyle, left: 700, top: 220}}>🎁</div>
          </div>

          <div style={controlsStyle}>
            <div style={instructionStyle}>
              🏃‍♂️ A/D to move, W/SPACE to jump! Avoid hazards and reach the finish!
            </div>
          </div>

          {gameOver && (
            <div style={resultStyle}>
              <h3>🏆 Championship Complete!</h3>
              <p style={winnerStyle}>{winner}</p>
              <div style={statsStyle}>
                {players.map(p => (
                  <div key={p.id} style={{color: p.color}}>
                    Player {p.id}: {p.completed ? `${p.time.toFixed(2)}s` : 'DNF'} | Lives: {p.lives}
                  </div>
                ))}
              </div>
              <button onClick={resetGame} style={buttonStyle}>🔄 New Championship</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Enhanced Styles
const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px',
  background: 'linear-gradient(180deg, #87CEEB 0%, #98FB98 30%, #8B4513 100%)',
  color: '#fff',
  minHeight: '100vh'
};

const roomCodeStyle: React.CSSProperties = {
  color: '#ffd700',
  fontWeight: 'bold',
  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
};

const menuStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, #2d1b69, #3730a3)',
  padding: '30px',
  borderRadius: '15px',
  margin: '20px auto',
  maxWidth: '600px',
  border: '3px solid #ffd700',
  boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
};

const instructionsStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, #4338ca, #5b21b6)',
  padding: '20px',
  borderRadius: '10px',
  margin: '20px 0',
  textAlign: 'left',
  border: '2px solid #a855f7'
};

const buttonStyle: React.CSSProperties = {
  padding: '15px 30px',
  background: 'linear-gradient(145deg, #10b981, #059669)',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
  transition: 'all 0.3s ease'
};

const gameInfoStyle: React.CSSProperties = {
  margin: '20px 0'
};

const livesStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold'
};

const courseStyle: React.CSSProperties = {
  position: 'relative',
  width: '1000px',
  height: '400px',
  margin: '20px auto',
  borderRadius: '15px',
  overflow: 'hidden',
  border: '4px solid #654321',
  boxShadow: '0 0 30px rgba(0,0,0,0.5)'
};

const skyStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '60%',
  background: 'linear-gradient(180deg, #87CEEB 0%, #98FB98 100%)',
  zIndex: 1
};

const cloudsStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  left: '20px',
  fontSize: '24px',
  opacity: 0.7,
  zIndex: 2
};

const mountainsStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '40%',
  left: '10px',
  fontSize: '30px',
  opacity: 0.6,
  zIndex: 2
};

const groundStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '100%',
  height: '50px',
  background: 'linear-gradient(180deg, #8B4513 0%, #654321 100%)',
  zIndex: 3
};

const startLineStyle: React.CSSProperties = {
  position: 'absolute',
  left: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#00ff00',
  fontWeight: 'bold',
  fontSize: '14px',
  writingMode: 'vertical-lr',
  zIndex: 10,
  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
};

const finishLineStyle: React.CSSProperties = {
  position: 'absolute',
  right: '10px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#ffd700',
  fontWeight: 'bold',
  fontSize: '14px',
  writingMode: 'vertical-lr',
  zIndex: 10,
  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
  animation: 'glow 2s ease-in-out infinite'
};

const baseObstacleStyle: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 'bold',
  borderRadius: '5px',
  fontSize: '12px',
  zIndex: 5
};

const playerStyle: React.CSSProperties = {
  position: 'absolute',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  zIndex: 10,
  transition: 'all 0.1s ease'
};

const playerIconStyle: React.CSSProperties = {
  fontSize: '16px'
};

const playerLabelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '-25px',
  fontSize: '10px',
  fontWeight: 'bold',
  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
};

const livesDisplayStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-25px',
  fontSize: '8px'
};

const collectibleStyle: React.CSSProperties = {
  position: 'absolute',
  fontSize: '16px',
  animation: 'bounce 1s infinite',
  zIndex: 6,
  cursor: 'pointer'
};

const controlsStyle: React.CSSProperties = {
  margin: '20px 0'
};

const instructionStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  background: 'rgba(0,0,0,0.8)',
  padding: '10px',
  borderRadius: '8px'
};

const resultStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, #1a1a1a, #2d2d2d)',
  padding: '25px',
  borderRadius: '15px',
  margin: '20px auto',
  maxWidth: '500px',
  border: '3px solid #ffd700',
  boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)'
};

const winnerStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ffd700',
  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
  animation: 'glow 2s ease-in-out infinite'
};

const statsStyle: React.CSSProperties = {
  margin: '15px 0',
  fontSize: '14px'
};

export default ObstacleCourse;
