import React, { useState, useEffect, useCallback } from 'react';

interface DodgeballArenaProps {
  roomCode: string;
  player: 'X' | 'O';
}

interface Player {
  id: string;
  x: number;
  y: number;
  lives: number;
  isAlive: boolean;
  color: string;
  hasShield: boolean;
  shieldCooldown: number;
  dashCooldown: number;
  ballCount: number;
  powerUpActive: string | null;
  kills: number;
}

interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  thrower: string;
  bounceCount: number;
  speed: number;
  size: number;
  type: 'normal' | 'explosive' | 'freeze' | 'multi';
}

interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'shield' | 'triple' | 'speed' | 'explosive' | 'freeze' | 'multi';
  emoji: string;
  color: string;
  respawnTime: number;
}

const DodgeballArena: React.FC<DodgeballArenaProps> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [gameTime, setGameTime] = useState(120);
  const [round, setRound] = useState(1);

  const [players, setPlayers] = useState<Player[]>([
    {
      id: 'X',
      x: 150,
      y: 300,
      lives: 3,
      isAlive: true,
      color: '#ff4444',
      hasShield: false,
      shieldCooldown: 0,
      dashCooldown: 0,
      ballCount: 3,
      powerUpActive: null,
      kills: 0
    },
    {
      id: 'O',
      x: 650,
      y: 300,
      lives: 3,
      isAlive: true,
      color: '#4444ff',
      hasShield: false,
      shieldCooldown: 0,
      dashCooldown: 0,
      ballCount: 3,
      powerUpActive: null,
      kills: 0
    }
  ]);

  const [balls, setBalls] = useState<Ball[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [explosions, setExplosions] = useState<Array<{x: number, y: number, size: number, life: number}>>([]);
  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number, life: number, color: string}>>([]);

  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    throw: false,
    shield: false,
    dash: false
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
  }, []);

  const handleMobileControl = (control: keyof typeof mobileControls, isPressed: boolean) => {
    setMobileControls(prev => ({ ...prev, [control]: isPressed }));
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const spawnPowerUps = useCallback(() => {
    const powerUpTypes = [
      { type: 'shield', emoji: '🛡️', color: '#00CED1' },
      { type: 'triple', emoji: '⚡', color: '#FFD700' },
      { type: 'speed', emoji: '💨', color: '#32CD32' },
      { type: 'explosive', emoji: '💥', color: '#FF4500' },
      { type: 'freeze', emoji: '❄️', color: '#87CEEB' },
      { type: 'multi', emoji: '🎯', color: '#FF69B4' }
    ];

    const newPowerUps: PowerUp[] = [];
    for (let i = 0; i < 4; i++) {
      const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      newPowerUps.push({
        id: `powerup-${i}`,
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
        type: powerUpType.type as any,
        emoji: powerUpType.emoji,
        color: powerUpType.color,
        respawnTime: 0
      });
    }
    setPowerUps(newPowerUps);
  }, []);

  const throwBall = useCallback((playerId: string, targetX: number, targetY: number) => {
    const thrower = players.find(p => p.id === playerId);
    if (!thrower || !thrower.isAlive || thrower.ballCount <= 0) return;

    const angle = Math.atan2(targetY - thrower.y, targetX - thrower.x);
    const speed = 8;

    let ballsToThrow = 1;
    let ballType: Ball['type'] = 'normal';

    if (thrower.powerUpActive === 'triple') {
      ballsToThrow = 3;
    } else if (thrower.powerUpActive === 'explosive') {
      ballType = 'explosive';
    } else if (thrower.powerUpActive === 'freeze') {
      ballType = 'freeze';
    } else if (thrower.powerUpActive === 'multi') {
      ballsToThrow = 5;
      ballType = 'multi';
    }

    const newBalls: Ball[] = [];
    for (let i = 0; i < ballsToThrow; i++) {
      const spreadAngle = ballsToThrow > 1 ? angle + (i - (ballsToThrow - 1) / 2) * 0.3 : angle;
      newBalls.push({
        id: `ball-${Date.now()}-${i}`,
        x: thrower.x,
        y: thrower.y,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed,
        thrower: playerId,
        bounceCount: 0,
        speed: speed,
        size: ballType === 'explosive' ? 25 : ballType === 'multi' ? 15 : 20,
        type: ballType
      });
    }

    setBalls(prev => [...prev, ...newBalls]);

    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { 
        ...p, 
        ballCount: p.ballCount - 1,
        powerUpActive: null 
      } : p
    ));
  }, [players]);

  useEffect(() => {
    if (gameStarted) {
      spawnPowerUps();
    }
  }, [gameStarted, spawnPowerUps]);

  // Canvas size state and effect for responsiveness
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Update canvas size for mobile
  useEffect(() => {
    const updateCanvasSize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const maxWidth = Math.min(window.innerWidth - 40, 600);
        const maxHeight = Math.min(window.innerHeight - 200, 400);
        setCanvasSize({ width: maxWidth, height: maxHeight });
      } else {
        setCanvasSize({ width: 800, height: 600 });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const CANVAS_WIDTH = canvasSize.width;
  const CANVAS_HEIGHT = canvasSize.height;


  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      // Update players
      setPlayers(prevPlayers => {
        return prevPlayers.map(p => {
          if (p.id !== player || !p.isAlive) return p;

          let newX = p.x;
          let newY = p.y;
          let newShieldCooldown = Math.max(0, p.shieldCooldown - 1);
          let newDashCooldown = Math.max(0, p.dashCooldown - 1);
          let newHasShield = p.hasShield && newShieldCooldown > 0;

          const isUp = keys['w'] || keys['arrowup'] || mobileControls.up;
          const isDown = keys['s'] || keys['arrowdown'] || mobileControls.down;
          const isLeft = keys['a'] || keys['arrowleft'] || mobileControls.left;
          const isRight = keys['d'] || keys['arrowright'] || mobileControls.right;
          const isThrow = keys[' '] || mobileControls.throw;
          const isShield = keys['e'] || mobileControls.shield;
          const isDash = keys['shift'] || mobileControls.dash;

          let speed = p.powerUpActive === 'speed' ? 6 : 4;
          if (isDash && newDashCooldown === 0) {
            speed *= 2;
            newDashCooldown = 120; // 6 second cooldown
          }

          if (isUp) newY -= speed;
          if (isDown) newY += speed;
          if (isLeft) newX -= speed;
          if (isRight) newX += speed;

          // Boundary check
          newX = Math.max(30, Math.min(CANVAS_WIDTH - 30, newX));
          newY = Math.max(30, Math.min(CANVAS_HEIGHT - 30, newY));

          // Shield activation
          if (isShield && newShieldCooldown === 0) {
            newHasShield = true;
            newShieldCooldown = 300; // 15 second cooldown
          }

          // Ball throwing
          if (isThrow && p.ballCount > 0) {
            const otherPlayer = prevPlayers.find(op => op.id !== p.id);
            if (otherPlayer) {
              throwBall(p.id, otherPlayer.x, otherPlayer.y);
            }
          }

          return {
            ...p,
            x: newX,
            y: newY,
            hasShield: newHasShield,
            shieldCooldown: newShieldCooldown,
            dashCooldown: newDashCooldown
          };
        });
      });

      // Update balls
      setBalls(prevBalls => {
        return prevBalls.map(ball => {
          let newX = ball.x + ball.vx;
          let newY = ball.y + ball.vy;
          let newVx = ball.vx;
          let newVy = ball.vy;
          let newBounceCount = ball.bounceCount;

          // Wall bouncing
          if (newX <= ball.size || newX >= CANVAS_WIDTH - ball.size) {
            newVx = -newVx;
            newBounceCount++;

            // Add bounce particles
            setParticles(prev => [...prev, ...Array(5).fill(0).map(() => ({
              x: newX,
              y: newY,
              vx: Math.random() * 4 - 2,
              vy: Math.random() * 4 - 2,
              life: 20,
              color: '#FFD700'
            }))]);
          }
          if (newY <= ball.size || newY >= CANVAS_HEIGHT - ball.size) {
            newVy = -newVy;
            newBounceCount++;
          }

          newX = Math.max(ball.size, Math.min(CANVAS_WIDTH - ball.size, newX));
          newY = Math.max(ball.size, Math.min(CANVAS_HEIGHT - ball.size, newY));

          // Player collision
          players.forEach(player => {
            if (player.isAlive && ball.thrower !== player.id) {
              const distance = Math.sqrt(
                Math.pow(newX - player.x, 2) + Math.pow(newY - player.y, 2)
              );

              if (distance < ball.size + 20) {
                if (!player.hasShield) {
                  setPlayers(prev => prev.map(p => {
                    if (p.id === player.id) {
                      const newLives = p.lives - 1;
                      const newIsAlive = newLives > 0;

                      if (ball.type === 'explosive') {
                        setExplosions(prev => [...prev, { x: newX, y: newY, size: 0, life: 30 }]);
                      }

                      return { ...p, lives: newLives, isAlive: newIsAlive };
                    } else if (p.id === ball.thrower) {
                      return { ...p, kills: p.kills + (player.lives === 1 ? 1 : 0) };
                    }
                    return p;
                  }));

                  // Remove ball on hit
                  setBalls(prev => prev.filter(b => b.id !== ball.id));
                }
              }
            }
          });

          // Remove balls after too many bounces
          if (newBounceCount >= 5) {
            setBalls(prev => prev.filter(b => b.id !== ball.id));
          }

          return {
            ...ball,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            bounceCount: newBounceCount
          };
        }).filter(ball => ball.bounceCount < 5);
      });

      // Power-up collection
      setPowerUps(prevPowerUps => {
        return prevPowerUps.map(powerUp => {
          if (powerUp.respawnTime > 0) {
            return { ...powerUp, respawnTime: powerUp.respawnTime - 1 };
          }

          const collidingPlayer = players.find(p => 
            p.isAlive && 
            Math.sqrt(Math.pow(powerUp.x - p.x, 2) + Math.pow(powerUp.y - p.y, 2)) < 30
          );

          if (collidingPlayer) {
            setPlayers(prev => prev.map(p => {
              if (p.id === collidingPlayer.id) {
                return { ...p, powerUpActive: powerUp.type };
              }
              return p;
            }));

            return { ...powerUp, respawnTime: 600 }; // 30 second respawn
          }

          return powerUp;
        });
      });

      // Update explosions
      setExplosions(prev => prev.map(exp => ({
        ...exp,
        size: exp.size + 3,
        life: exp.life - 1
      })).filter(exp => exp.life > 0));

      // Update particles
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - 1
      })).filter(p => p.life > 0));

      // Ball regeneration
      setPlayers(prev => prev.map(p => {
        if (p.isAlive && p.ballCount < 3) {
          return { ...p, ballCount: p.ballCount + 0.01 }; // Slow regeneration
        }
        return p;
      }));

      // Check win condition
      const alivePlayers = players.filter(p => p.isAlive);
      if (alivePlayers.length === 1) {
        setWinner(`Player ${alivePlayers[0].id} Wins Round ${round}! 🏆`);
        setGameOver(true);
      } else if (alivePlayers.length === 0) {
        setWinner("Everyone's out! It's a tie! 🤝");
        setGameOver(true);
      }

      // Game timer
      setGameTime(prev => {
        if (prev <= 0.1) {
          const playerX = players.find(p => p.id === 'X');
          const playerO = players.find(p => p.id === 'O');

          if (playerX && playerO) {
            if (playerX.kills > playerO.kills) {
              setWinner('Player X Wins by Points! 🏆');
            } else if (playerO.kills > playerX.kills) {
              setWinner('Player O Wins by Points! 🏆');
            } else {
              setWinner('Time\'s up! It\'s a tie! ⏰');
            }
          }
          setGameOver(true);
          return 0;
        }
        return prev - 0.1;
      });

    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, keys, mobileControls, player, players, throwBall, round]);

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setGameTime(120);
    setRound(1);
    setPlayers([
      {
        id: 'X',
        x: 150,
        y: 300,
        lives: 3,
        isAlive: true,
        color: '#ff4444',
        hasShield: false,
        shieldCooldown: 0,
        dashCooldown: 0,
        ballCount: 3,
        powerUpActive: null,
        kills: 0
      },
      {
        id: 'O',
        x: 650,
        y: 300,
        lives: 3,
        isAlive: true,
        color: '#4444ff',
        hasShield: false,
        shieldCooldown: 0,
        dashCooldown: 0,
        ballCount: 3,
        powerUpActive: null,
        kills: 0
      }
    ]);
    setBalls([]);
    setPowerUps([]);
    setExplosions([]);
    setParticles([]);
  };

  const currentPlayer = players.find(p => p.id === player);

  return (
    <div className="game-container">
      <div className="game-overlay"></div>

      <div className="game-header">
        <h2 className="game-title">🥎 Dodgeball Arena Championship</h2>
        <div className="game-status">
          Room: {roomCode} | Player: {player} | Time: {gameTime.toFixed(1)}s | Round: {round}
        </div>
        <div style={{ fontSize: '1rem', marginTop: '5px' }}>
          Lives: {'❤️'.repeat(currentPlayer?.lives || 0)} | Balls: {Math.floor(currentPlayer?.ballCount || 0)} | Kills: {currentPlayer?.kills || 0}
        </div>
      </div>

      {!gameStarted && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '40px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ fontSize: '2rem', margin: '0 0 20px 0' }}>🥎 Dodgeball Arena!</h3>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            Dodge, throw, and survive! Use power-ups to gain advantages!
          </p>
          <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 30px' }}>
            ⚡ Enter Arena!
          </button>
        </div>
      )}

      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '40px',
          borderRadius: '20px',
          backdropFilter: 'blur(15px)'
        }}>
          <h3 style={{ fontSize: '3rem', margin: '0 0 20px 0', animation: 'victoryPulse 2s infinite' }}>
            {winner}
          </h3>
          <div style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            Final Stats:<br/>
            Player X: {players.find(p => p.id === 'X')?.kills || 0} kills<br/>
            Player O: {players.find(p => p.id === 'O')?.kills || 0} kills
          </div>
          <button onClick={resetGame} className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 30px' }}>
            🔄 New Match
          </button>
        </div>
      )}

      <div className="game-arena" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        {/* Arena floor with grid */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(45deg, #2a2a2a, #1a1a1a)',
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 100px)',
          borderRadius: '20px',
          border: '5px solid #FFD700'
        }} />

        {/* Center line */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '10px',
          bottom: '10px',
          width: '3px',
          background: 'linear-gradient(0deg, #FFD700, #FFA500)',
          transform: 'translateX(-50%)'
        }} />

        {/* Power-ups */}
        {powerUps.filter(p => p.respawnTime === 0).map(powerUp => (
          <div
            key={powerUp.id}
            className="power-up"
            style={{
              left: powerUp.x - 15,
              top: powerUp.y - 15,
              background: powerUp.color,
              border: '2px solid white',
              boxShadow: `0 0 15px ${powerUp.color}`,
              animation: 'float 2s ease-in-out infinite'
            }}
          >
            {powerUp.emoji}
          </div>
        ))}

        {/* Balls */}
        {balls.map(ball => (
          <div
            key={ball.id}
            style={{
              position: 'absolute',
              left: ball.x - ball.size / 2,
              top: ball.y - ball.size / 2,
              width: ball.size,
              height: ball.size,
              background: ball.type === 'explosive' ? 
                'radial-gradient(circle, #FF4500, #DC143C)' :
                ball.type === 'freeze' ?
                'radial-gradient(circle, #87CEEB, #4682B4)' :
                ball.type === 'multi' ?
                'radial-gradient(circle, #FF69B4, #DA70D6)' :
                'radial-gradient(circle, #8B4513, #654321)',
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: ball.type === 'explosive' ? 
                '0 0 15px #FF4500' : 
                ball.type === 'freeze' ?
                '0 0 15px #87CEEB' :
                '0 2px 8px rgba(0, 0, 0, 0.3)',
              animation: ball.type === 'explosive' ? 'pulse 0.5s infinite' : 'none'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: `${ball.size * 0.4}px`
            }}>
              {ball.type === 'explosive' ? '💥' :
               ball.type === 'freeze' ? '❄️' :
               ball.type === 'multi' ? '🎯' : '🥎'}
            </div>
          </div>
        ))}

        {/* Explosions */}
        {explosions.map((explosion, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: explosion.x - explosion.size / 2,
              top: explosion.y - explosion.size / 2,
              width: explosion.size,
              height: explosion.size,
              background: 'radial-gradient(circle, rgba(255, 69, 0, 0.8), rgba(255, 140, 0, 0.4), transparent)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />
        ))}

        {/* Particles */}
        {particles.map((particle, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: particle.x,
              top: particle.y,
              width: '4px',
              height: '4px',
              background: particle.color,
              borderRadius: '50%',
              opacity: particle.life / 20
            }}
          />
        ))}

        {/* Players */}
        {players.map(p => (
          <div
            key={p.id}
            className="player"
            style={{
              left: p.x - 20,
              top: p.y - 20,
              backgroundColor: p.color,
              border: p.id === player ? '3px solid #FFD700' : '3px solid white',
              zIndex: p.id === player ? 10 : 5,
              opacity: p.isAlive ? 1 : 0.3,
              boxShadow: p.hasShield ? 
                '0 0 20px #00CED1, inset 0 0 20px rgba(0, 206, 209, 0.3)' : 
                '0 5px 15px rgba(0, 0, 0, 0.3)',
              filter: !p.isAlive ? 'grayscale(100%)' : 'none'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '20px'
            }}>
              {p.powerUpActive === 'speed' ? '💨' :
               p.powerUpActive === 'triple' ? '⚡' :
               p.powerUpActive === 'explosive' ? '💥' :
               p.powerUpActive === 'freeze' ? '❄️' :
               p.powerUpActive === 'multi' ? '🎯' :
               p.hasShield ? '🛡️' : '🤾'}
            </div>

            {/* Lives indicator */}
            <div style={{
              position: 'absolute',
              top: '-25px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '12px',
              display: 'flex',
              gap: '2px'
            }}>
              {'❤️'.repeat(p.lives)}
            </div>
          </div>
        ))}

        {/* Cooldown indicators */}
        {currentPlayer && (
          <>
            {currentPlayer.shieldCooldown > 0 && (
              <div style={{
                position: 'absolute',
                left: currentPlayer.x - 30,
                top: currentPlayer.y - 45,
                fontSize: '12px',
                color: '#00CED1',
                fontWeight: 'bold'
              }}>
                🛡️ {(currentPlayer.shieldCooldown / 20).toFixed(1)}s
              </div>
            )}
            {currentPlayer.dashCooldown > 0 && (
              <div style={{
                position: 'absolute',
                left: currentPlayer.x + 20,
                top: currentPlayer.y - 45,
                fontSize: '12px',
                color: '#FFD700',
                fontWeight: 'bold'
              }}>
                💨 {(currentPlayer.dashCooldown / 20).toFixed(1)}s
              </div>
            )}
          </>
        )}
      </div>

      {/* Advanced Mobile Controls */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 60px)',
        gridTemplateRows: 'repeat(3, 60px)',
        gap: '5px',
        zIndex: 20
      }}>
        <div></div>
        <button
          className="mobile-control-btn"
          onTouchStart={() => handleMobileControl('up', true)}
          onTouchEnd={() => handleMobileControl('up', false)}
          onMouseDown={() => handleMobileControl('up', true)}
          onMouseUp={() => handleMobileControl('up', false)}
        >
          ⬆️
        </button>
        <div></div>

        <button
          className="mobile-control-btn"
          onTouchStart={() => handleMobileControl('left', true)}
          onTouchEnd={() => handleMobileControl('left', false)}
          onMouseDown={() => handleMobileControl('left', true)}
          onMouseUp={() => handleMobileControl('left', false)}
        >
          ⬅️
        </button>
        <div></div>
        <button
          className="mobile-control-btn"
          onTouchStart={() => handleMobileControl('right', true)}
          onTouchEnd={() => handleMobileControl('right', false)}
          onMouseDown={() => handleMobileControl('right', true)}
          onMouseUp={() => handleMobileControl('right', false)}
        >
          ➡️
        </button>

        <div></div>
        <button
          className="mobile-control-btn"
          onTouchStart={() => handleMobileControl('down', true)}
          onTouchEnd={() => handleMobileControl('down', false)}
          onMouseDown={() => handleMobileControl('down', true)}
          onMouseUp={() => handleMobileControl('down', false)}
        >
          ⬇️
        </button>
        <div></div>
      </div>

      {/* Action buttons */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 20
      }}>
        <button
          className="mobile-control-btn"
          onTouchStart={() => handleMobileControl('throw', true)}
          onTouchEnd={() => handleMobileControl('throw', false)}
          onMouseDown={() => handleMobileControl('throw', true)}
          onMouseUp={() => handleMobileControl('throw', false)}
          style={{
            background: (currentPlayer?.ballCount || 0) > 0 ? 
              'linear-gradient(135deg, #FF4500, #DC143C)' : 
              'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            width: '80px',
            height: '60px'
          }}
          disabled={!currentPlayer || currentPlayer.ballCount <= 0}
        >
          🥎
        </button>

        <button
          className="mobile-control-btn"
          onTouchStart={() => handleMobileControl('shield', true)}
          onTouchEnd={() => handleMobileControl('shield', false)}
          onMouseDown={() => handleMobileControl('shield', true)}
          onMouseUp={() => handleMobileControl('shield', false)}
          style={{
            background: currentPlayer?.shieldCooldown === 0 ? 
              'linear-gradient(135deg, #00CED1, #4682B4)' : 
              'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            width: '80px',
            height: '60px'
          }}
          disabled={!currentPlayer || currentPlayer.shieldCooldown > 0}
        >
          🛡️
        </button>

        <button
          className="mobile-control-btn"
          onTouchStart={() => handleMobileControl('dash', true)}
          onTouchEnd={() => handleMobileControl('dash', false)}
          onMouseDown={() => handleMobileControl('dash', true)}
          onMouseUp={() => handleMobileControl('dash', false)}
          style={{
            background: currentPlayer?.dashCooldown === 0 ? 
              'linear-gradient(135deg, #FFD700, #FFA500)' : 
              'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            width: '80px',
            height: '60px'
          }}
          disabled={!currentPlayer || currentPlayer.dashCooldown > 0}
        >
          💨
        </button>
      </div>

      {/* Game Stats */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '15px',
        borderRadius: '10px',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>🏆 Arena Stats</h4>
        {players.map(p => (
          <div key={p.id} style={{
            display: 'flex',
            alignItems: 'center',
            margin: '5px 0',
            color: p.id === player ? '#FFD700' : 'white'
          }}>
            <span style={{ marginRight: '10px' }}>
              {p.isAlive ? '🟢' : '💀'}
            </span>
            Player {p.id}: {p.kills} KO{'s'} | {'❤️'.repeat(p.lives)}
            {p.powerUpActive && ` | ${p.powerUpActive === 'speed' ? '💨' : p.powerUpActive === 'triple' ? '⚡' : p.powerUpActive === 'explosive' ? '💥' : p.powerUpActive === 'freeze' ? '❄️' : '🎯'}`}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DodgeballArena;