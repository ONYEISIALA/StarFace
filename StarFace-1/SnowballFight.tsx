import React, { useState, useEffect, useCallback } from 'react';

interface SnowballFightProps {
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
  snowballs: number;
  charging: boolean;
  chargeTime: number;
  hasFort: boolean;
  fortHealth: number;
  kills: number;
  powerUp: string | null;
  frozen: boolean;
  frozenTime: number;
  aimAngle: number; // Added for aiming
}

interface Snowball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  power: number;
  thrower: string;
  size: number;
  trail: Array<{x: number, y: number}>;
}

interface Fort {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  owner: string;
}

interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'rapid' | 'giant' | 'shield' | 'freeze' | 'multi';
  emoji: string;
  color: string;
}

const SnowballFight: React.FC<SnowballFightProps> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [gameTime, setGameTime] = useState(180);

  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 700 });

  // Update canvas size for mobile
  useEffect(() => {
    const updateCanvasSize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const maxWidth = Math.min(window.innerWidth - 40, 600);
        const maxHeight = Math.min(window.innerHeight - 200, 400);
        setCanvasSize({ width: maxWidth, height: maxHeight });
      } else {
        setCanvasSize({ width: 1000, height: 700 });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const CANVAS_WIDTH = canvasSize.width;
  const CANVAS_HEIGHT = canvasSize.height;

  const [players, setPlayers] = useState<Player[]>([
    {
      id: 'X',
      x: 150,
      y: 300,
      lives: 5,
      isAlive: true,
      color: '#ff4444',
      snowballs: 10,
      charging: false,
      chargeTime: 0,
      hasFort: false,
      fortHealth: 0,
      kills: 0,
      powerUp: null,
      frozen: false,
      frozenTime: 0,
      aimAngle: 0 // Initial aim angle
    },
    {
      id: 'O',
      x: 650,
      y: 300,
      lives: 5,
      isAlive: true,
      color: '#4444ff',
      snowballs: 10,
      charging: false,
      chargeTime: 0,
      hasFort: false,
      fortHealth: 0,
      kills: 0,
      powerUp: null,
      frozen: false,
      frozenTime: 0,
      aimAngle: Math.PI // Initial aim angle
    }
  ]);

  const [snowballs, setSnowballs] = useState<Snowball[]>([]);
  const [forts, setForts] = useState<Fort[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [snowParticles, setSnowParticles] = useState<Array<{x: number, y: number, vx: number, vy: number, size: number}>>([]);

  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
    throw: false,
    charge: false,
    buildFort: false
  });

  // Generate snow particles for atmosphere
  useEffect(() => {
    const generateSnow = () => {
      setSnowParticles(prev => {
        const newParticles = [...prev];
        if (newParticles.length < 50) {
          for (let i = 0; i < 5; i++) {
            newParticles.push({
              x: Math.random() * CANVAS_WIDTH,
              y: -10,
              vx: Math.random() * 2 - 1,
              vy: Math.random() * 2 + 1,
              size: Math.random() * 4 + 2
            });
          }
        }
        return newParticles.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy
        })).filter(p => p.y < CANVAS_HEIGHT + 10);
      });
    };

    const snowInterval = setInterval(generateSnow, 200);
    return () => clearInterval(snowInterval);
  }, [CANVAS_WIDTH, CANVAS_HEIGHT]);

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

  const throwSnowball = useCallback((playerId: string, targetX: number, targetY: number, power: number = 1) => {
    const thrower = players.find(p => p.id === playerId);
    if (!thrower || !thrower.isAlive || thrower.snowballs <= 0 || thrower.frozen) return;

    const angle = Math.atan2(targetY - thrower.y, targetX - thrower.x);
    const speed = 6 + power * 2;

    let ballsToThrow = 1;
    let ballSize = 15 + power * 5;

    if (thrower.powerUp === 'multi') {
      ballsToThrow = 5;
    } else if (thrower.powerUp === 'giant') {
      ballSize = 30;
    }

    const newSnowballs: Snowball[] = [];
    for (let i = 0; i < ballsToThrow; i++) {
      const spreadAngle = ballsToThrow > 1 ? angle + (i - (ballsToThrow - 1) / 2) * 0.4 : angle;
      newSnowballs.push({
        id: `snowball-${Date.now()}-${i}`,
        x: thrower.x,
        y: thrower.y,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed,
        power: power,
        thrower: playerId,
        size: ballSize,
        trail: []
      });
    }

    setSnowballs(prev => [...prev, ...newSnowballs]);

    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { 
        ...p, 
        snowballs: p.snowballs - 1,
        powerUp: null,
        charging: false,
        chargeTime: 0
      } : p
    ));
  }, [players]);

  const buildFort = useCallback((playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player || player.hasFort) return;

    setForts(prev => [...prev, {
      id: `fort-${playerId}`,
      x: player.x - 30,
      y: player.y - 30,
      health: 100,
      maxHealth: 100,
      owner: playerId
    }]);

    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, hasFort: true, fortHealth: 100 } : p
    ));
  }, [players]);

  // Renamed buildFort to buildSnowFort to avoid conflict with the callback name
  const buildSnowFort = useCallback(() => {
    const playerObj = players.find(p => p.id === player);
    if (playerObj && !playerObj.hasFort) {
      buildFort(player);
    }
  }, [players, player, buildFort]);


  useEffect(() => {
    if (!gameStarted || gameOver) return;

    // Spawn power-ups
    if (Math.random() < 0.003) {
      const powerUpTypes = [
        { type: 'rapid', emoji: '⚡', color: '#FFD700' },
        { type: 'giant', emoji: '🏔️', color: '#87CEEB' },
        { type: 'shield', emoji: '🛡️', color: '#00CED1' },
        { type: 'freeze', emoji: '❄️', color: '#B0E0E6' },
        { type: 'multi', emoji: '🎯', color: '#FF69B4' }
      ];

      const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

      setPowerUps(prev => [...prev, {
        id: `powerup-${Date.now()}`,
        x: Math.random() * (CANVAS_WIDTH - 100) + 50,
        y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
        type: powerUpType.type as any,
        emoji: powerUpType.emoji,
        color: powerUpType.color
      }]);
    }

    const gameLoop = setInterval(() => {
      setGameTime(prev => {
        if (prev <= 0) {
          const playerX = players.find(p => p.id === 'X');
          const playerO = players.find(p => p.id === 'O');

          if (playerX && playerO) {
            if (playerX.kills > playerO.kills) {
              setWinner('Player X Wins by Eliminations! 🏆');
            } else if (playerO.kills > playerX.kills) {
              setWinner('Player O Wins by Eliminations! 🏆');
            } else {
              setWinner('Time\'s up! It\'s a tie! ⏰');
            }
          }
          setGameOver(true);
          return 0;
        }
        return prev - 0.1;
      });

      // Update players
      setPlayers(prevPlayers => {
        return prevPlayers.map(p => {
          if (p.id !== player || !p.isAlive) return p;

          let newX = p.x;
          let newY = p.y;
          let newCharging = p.charging;
          let newChargeTime = p.chargeTime;
          let newFrozen = p.frozen;
          let newFrozenTime = Math.max(0, p.frozenTime - 1);
          let newAimAngle = p.aimAngle; // Keep existing aim angle

          if (newFrozenTime === 0) newFrozen = false;

          if (!newFrozen) {
            const isUp = keys['w'] || keys['arrowup'] || mobileControls.up;
            const isDown = keys['s'] || keys['arrowdown'] || mobileControls.down;
            const isLeft = keys['a'] || keys['arrowleft'] || mobileControls.left;
            const isRight = keys['d'] || keys['arrowright'] || mobileControls.right;
            const isThrow = keys[' '] || keys['enter'] || mobileControls.throw; // Added Enter for throwing
            const isCharge = keys['c'] || mobileControls.charge; // WASD keys removed for aiming, replaced with specific keys
            const isBuildFort = keys['f'] || mobileControls.buildFort;

            const speed = p.powerUp === 'rapid' ? 6 : 4;

            if (isUp) newY -= speed;
            if (isDown) newY += speed;
            if (isLeft) newX -= speed;
            if (isRight) newX += speed;

            // Boundary check
            newX = Math.max(20, Math.min(CANVAS_WIDTH - 20, newX));
            newY = Math.max(20, Math.min(CANVAS_HEIGHT - 20, newY));

            // Charging snowball
            if (isCharge && p.snowballs > 0) {
              newCharging = true;
              newChargeTime = Math.min(60, newChargeTime + 1);
            } else if (newCharging) {
              // Release charged snowball based on aimAngle
              const targetX = p.x + Math.cos(p.aimAngle) * 1000; // Aim at a distant point
              const targetY = p.y + Math.sin(p.aimAngle) * 1000;
              const power = Math.floor(newChargeTime / 20) + 1;
              throwSnowball(p.id, targetX, targetY, power);
              newCharging = false;
              newChargeTime = 0;
            }

            // Quick throw based on aimAngle
            if (isThrow && !newCharging && p.snowballs > 0) {
              const targetX = p.x + Math.cos(p.aimAngle) * 1000; // Aim at a distant point
              const targetY = p.y + Math.sin(p.aimAngle) * 1000;
              throwSnowball(p.id, targetX, targetY, 1);
            }

            // Build fort
            if (isBuildFort && !p.hasFort) {
              buildFort(p.id);
            }
          }

          // Power-up collection
          setPowerUps(prevPowerUps => {
            return prevPowerUps.filter(powerUp => {
              if (Math.sqrt(Math.pow(powerUp.x - newX, 2) + Math.pow(powerUp.y - newY, 2)) < 25) {
                // Apply power-up effect based on type
                switch (powerUp.type) {
                  case 'rapid':
                    setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, powerUp: 'rapid' } : pl));
                    break;
                  case 'giant':
                    setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, powerUp: 'giant' } : pl));
                    break;
                  case 'shield':
                    setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, powerUp: 'shield' } : pl)); // Shield not implemented yet
                    break;
                  case 'freeze':
                    setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, powerUp: 'freeze', frozen: true, frozenTime: 120 } : pl));
                    break;
                  case 'multi':
                    setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, powerUp: 'multi' } : pl));
                    break;
                  default:
                    break;
                }
                return false; // Remove power-up after collection
              }
              return true;
            });
          });

          return { 
            ...p, 
            x: newX, 
            y: newY, 
            charging: newCharging, 
            chargeTime: newChargeTime,
            frozen: newFrozen,
            frozenTime: newFrozenTime,
            aimAngle: newAimAngle // Update aim angle
          };
        });
      });

      // Update snowballs
      setSnowballs(prevSnowballs => {
        return prevSnowballs.map(ball => {
          let newX = ball.x + ball.vx;
          let newY = ball.y + ball.vy;

          // Add to trail
          const newTrail = [...ball.trail, { x: ball.x, y: ball.y }];
          if (newTrail.length > 8) newTrail.shift();

          // Wall bouncing with power loss
          if (newX <= ball.size || newX >= CANVAS_WIDTH - ball.size) {
            ball.vx = -ball.vx * 0.7;
            ball.power *= 0.8;
          }
          if (newY <= ball.size || newY >= CANVAS_HEIGHT - ball.size) {
            ball.vy = -ball.vy * 0.7;
            ball.power *= 0.8;
          }

          newX = Math.max(ball.size, Math.min(CANVAS_WIDTH - ball.size, newX));
          newY = Math.max(ball.size, Math.min(CANVAS_HEIGHT - ball.size, newY));

          // Player collision
          players.forEach(targetPlayer => {
            if (targetPlayer.isAlive && ball.thrower !== targetPlayer.id && !targetPlayer.frozen) {
              const distance = Math.sqrt(
                Math.pow(newX - targetPlayer.x, 2) + Math.pow(newY - targetPlayer.y, 2)
              );

              if (distance < ball.size + 15) {
                // Check if player is behind fort
                const playerFort = forts.find(f => f.owner === targetPlayer.id);
                let hitFort = false;

                if (playerFort && 
                    newX >= playerFort.x && newX <= playerFort.x + 60 &&
                    newY >= playerFort.y && newY <= playerFort.y + 60) {
                  // Hit fort instead
                  setForts(prev => prev.map(f => 
                    f.id === playerFort.id ? { ...f, health: f.health - ball.power * 20 } : f
                  ));
                  hitFort = true;
                } else {
                  // Hit player
                  setPlayers(prev => prev.map(p => {
                    if (p.id === targetPlayer.id) {
                      const newLives = p.lives - ball.power;
                      const newIsAlive = newLives > 0;

                      // Freeze effect
                      if (ball.power > 2) {
                        return { 
                          ...p, 
                          lives: newLives, 
                          isAlive: newIsAlive,
                          frozen: true,
                          frozenTime: 60 
                        };
                      }

                      return { ...p, lives: newLives, isAlive: newIsAlive };
                    } else if (p.id === ball.thrower && !targetPlayer.isAlive && targetPlayer.lives <= 0) {
                      return { ...p, kills: p.kills + 1 };
                    }
                    return p;
                  }));
                }

                // Remove snowball on any collision
                setSnowballs(prev => prev.filter(b => b.id !== ball.id));
              }
            }
          });

          return { ...ball, x: newX, y: newY, trail: newTrail };
        }).filter(ball => ball.power > 0.2); // Remove weak snowballs
      });

      // Remove destroyed forts
      setForts(prev => prev.filter(fort => fort.health > 0));

      // Snowball regeneration
      setPlayers(prev => prev.map(p => {
        if (p.isAlive && p.snowballs < 10) {
          return { ...p, snowballs: Math.min(10, p.snowballs + 0.05) };
        }
        return p;
      }));

      // Check win condition
      const alivePlayers = players.filter(p => p.isAlive);
      if (alivePlayers.length === 1) {
        setWinner(`Player ${alivePlayers[0].id} Wins the Snowball Fight! ❄️🏆`);
        setGameOver(true);
      }

    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, keys, mobileControls, player, players, throwSnowball, buildFort, forts, CANVAS_WIDTH, CANVAS_HEIGHT]);

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setGameTime(180);
    setPlayers([
      {
        id: 'X',
        x: CANVAS_WIDTH * 0.15,
        y: CANVAS_HEIGHT / 2,
        lives: 5,
        isAlive: true,
        color: '#ff4444',
        snowballs: 10,
        charging: false,
        chargeTime: 0,
        hasFort: false,
        fortHealth: 0,
        kills: 0,
        powerUp: null,
        frozen: false,
        frozenTime: 0,
        aimAngle: 0
      },
      {
        id: 'O',
        x: CANVAS_WIDTH * 0.85,
        y: CANVAS_HEIGHT / 2,
        lives: 5,
        isAlive: true,
        color: '#4444ff',
        snowballs: 10,
        charging: false,
        chargeTime: 0,
        hasFort: false,
        fortHealth: 0,
        kills: 0,
        powerUp: null,
        frozen: false,
        frozenTime: 0,
        aimAngle: Math.PI
      }
    ]);
    setSnowballs([]);
    setForts([]);
    setPowerUps([]);
  };

  const currentPlayer = players.find(p => p.id === player);

  return (
    <div className="game-container" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div className="game-overlay"></div>

      <div className="game-header">
        <h2 className="game-title">❄️ Epic Snowball Fight</h2>
        <div className="game-status">
          Room: {roomCode} | Player: {player} | Time: {gameTime.toFixed(1)}s
        </div>
        <div style={{ fontSize: '1rem', marginTop: '5px' }}>
          Lives: {'❤️'.repeat(currentPlayer?.lives || 0)} | Snowballs: {Math.floor(currentPlayer?.snowballs || 0)} | Kills: {currentPlayer?.kills || 0}
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
          <h3 style={{ fontSize: '2rem', margin: '0 0 20px 0' }}>❄️ Winter Warfare!</h3>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            Charge snowballs for power! Build forts for protection! Last one standing wins!
          </p>
          <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 30px' }}>
            ❄️ Let it Snow!
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
          <button onClick={resetGame} className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 30px' }}>
            🔄 New Fight
          </button>
        </div>
      )}

      <div className="game-arena" style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px`, position: 'relative', margin: '0 auto' }}>
        {/* Winter battlefield */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #E6F3FF, #CCE7FF, #B3DBFF)',
          borderRadius: '20px',
          border: '5px solid #87CEEB',
          overflow: 'hidden'
        }}>
          {/* Snow ground texture */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '100px',
            background: 'linear-gradient(0deg, #FFFFFF, rgba(255, 255, 255, 0.8))',
            borderRadius: '0 0 15px 15px'
          }} />
        </div>

        {/* Falling snow */}
        {snowParticles.map((snow, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: snow.x,
              top: snow.y,
              width: snow.size,
              height: snow.size,
              background: 'white',
              borderRadius: '50%',
              opacity: 0.8,
              pointerEvents: 'none'
            }}
          />
        ))}

        {/* Forts */}
        {forts.map(fort => (
          <div
            key={fort.id}
            style={{
              position: 'absolute',
              left: fort.x,
              top: fort.y,
              width: '60px',
              height: '60px',
              background: `linear-gradient(135deg, #D3D3D3, #A9A9A9)`,
              border: '3px solid #778899',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            🏰

            {/* Health bar */}
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '8px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(fort.health / fort.maxHealth) * 100}%`,
                height: '100%',
                background: fort.health > 50 ? 
                  'linear-gradient(90deg, #32CD32, #228B22)' :
                  'linear-gradient(90deg, #FFD700, #FF4500)',
                borderRadius: '4px'
              }} />
            </div>
          </div>
        ))}

        {/* Power-ups */}
        {powerUps.map(powerUp => (
          <div
            key={powerUp.id}
            className="power-up"
            style={{
              position: 'absolute',
              left: powerUp.x - 15,
              top: powerUp.y - 15,
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              borderRadius: '50%',
              background: powerUp.color,
              border: '2px solid white',
              boxShadow: `0 0 15px ${powerUp.color}`,
              animation: 'float 2s ease-in-out infinite'
            }}
          >
            {powerUp.emoji}
          </div>
        ))}

        {/* Snowballs */}
        {snowballs.map(ball => (
          <div key={ball.id}>
            {/* Trail */}
            {ball.trail.map((point, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: point.x - 2,
                  top: point.y - 2,
                  width: '4px',
                  height: '4px',
                  background: 'white',
                  opacity: (index / ball.trail.length) * 0.7,
                  borderRadius: '50%'
                }}
              />
            ))}

            {/* Snowball */}
            <div
              style={{
                position: 'absolute',
                left: ball.x - ball.size / 2,
                top: ball.y - ball.size / 2,
                width: ball.size,
                height: ball.size,
                background: `radial-gradient(circle, white, #E6E6FA)`,
                borderRadius: '50%',
                border: '2px solid #B0C4DE',
                boxShadow: `0 0 ${ball.power * 5}px rgba(255, 255, 255, 0.8)`,
                zIndex: 6
              }}
            >
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: `${ball.size * 0.4}px`
              }}>
                ⚪
              </div>
            </div>
          </div>
        ))}

        {/* Players */}
        {players.map(p => (
          <div
            key={p.id}
            className="player"
            style={{
              position: 'absolute',
              left: p.x - 20,
              top: p.y - 20,
              width: '40px',
              height: '40px',
              backgroundColor: p.color,
              border: p.id === player ? '3px solid #FFD700' : '3px solid white',
              zIndex: p.id === player ? 10 : 5,
              opacity: p.isAlive ? (p.frozen ? 0.5 : 1) : 0.3,
              filter: p.frozen ? 'hue-rotate(200deg)' : (!p.isAlive ? 'grayscale(100%)' : 'none'),
              boxShadow: p.charging ? 
                `0 0 ${p.chargeTime}px #FFD700` : 
                '0 5px 15px rgba(0, 0, 0, 0.3)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '20px'
            }}>
              {p.frozen ? '🧊' : p.charging ? '⚡' : '⛄'}
            </div>

            {/* Charge indicator */}
            {p.charging && (
              <div style={{
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40px',
                height: '8px',
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(p.chargeTime / 60) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #FFD700, #FF4500)',
                  borderRadius: '4px'
                }} />
              </div>
            )}
            
            {/* Aim indicator */}
            {p.id === player && !p.charging && (
              <div style={{
                position: 'absolute',
                top: '45px',
                left: '50%',
                width: '4px',
                height: '30px',
                background: '#FFD700',
                transformOrigin: 'bottom center',
                transform: `translateX(-50%) rotate(${p.aimAngle}rad)`
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Mobile Controls */}
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
        {/* Aiming controls */}
        <button
          className="mobile-control-btn"
          onTouchStart={() => setPlayers(prev => prev.map(p => p.id === player ? { ...p, aimAngle: p.aimAngle - Math.PI / 4 } : p))}
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        >
          <span role="img" aria-label="aim-left">↩️</span>
        </button>
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

      {/* Action Controls */}
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
            background: (currentPlayer?.snowballs || 0) > 0 ? 
              'linear-gradient(135deg, #87CEEB, #4682B4)' : 
              'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            width: '80px',
            height: '60px'
          }}
          disabled={!currentPlayer || currentPlayer.snowballs <= 0 || currentPlayer.frozen}
        >
          ⚪
        </button>

        <button
          className="mobile-control-btn"
          onTouchStart={() => handleMobileControl('charge', true)}
          onTouchEnd={() => handleMobileControl('charge', false)}
          onMouseDown={() => handleMobileControl('charge', true)}
          onMouseUp={() => handleMobileControl('charge', false)}
          style={{
            background: (currentPlayer?.snowballs || 0) > 0 ? 
              'linear-gradient(135deg, #FFD700, #FFA500)' : 
              'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            width: '80px',
            height: '60px'
          }}
          disabled={!currentPlayer || currentPlayer.snowballs <= 0 || currentPlayer.frozen}
        >
          ⚡
        </button>

        <button
          className="mobile-control-btn"
          onClick={() => buildFort(player)}
          style={{
            background: !currentPlayer?.hasFort ? 
              'linear-gradient(135deg, #8B4513, #A0522D)' : 
              'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            width: '80px',
            height: '60px'
          }}
          disabled={!currentPlayer || currentPlayer.hasFort}
        >
          🏰
        </button>
      </div>
    </div>
  );
};

export default SnowballFight;