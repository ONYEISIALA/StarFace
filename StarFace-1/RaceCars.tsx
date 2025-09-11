import React, { useState, useEffect, useCallback } from 'react';

interface RaceCarsProps {
  roomCode: string;
  player: 'X' | 'O';
}

interface Car {
  id: string;
  x: number;
  y: number;
  speed: number;
  angle: number;
  lap: number;
  checkpoints: boolean[];
  boostCooldown: number;
  shieldActive: boolean;
  color: string;
  trail: Array<{x: number, y: number}>;
  crashed: boolean;
  nitroCharges: number;
}

interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'speed' | 'shield' | 'nitro' | 'missile';
  emoji: string;
  color: string;
  collected: boolean;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'oil' | 'barrier' | 'spike';
}

const RaceCars: React.FC<RaceCarsProps> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [raceTime, setRaceTime] = useState(0);
  const [countdown, setCountdown] = useState(3);

  const [cars, setCars] = useState<Car[]>([
    {
      id: 'X',
      x: 100,
      y: 300,
      speed: 0,
      angle: 0,
      lap: 0,
      checkpoints: [false, false, false, false],
      boostCooldown: 0,
      shieldActive: false,
      color: '#ff4444',
      trail: [],
      crashed: false,
      nitroCharges: 3
    },
    {
      id: 'O',
      x: 100,
      y: 340,
      speed: 0,
      angle: 0,
      lap: 0,
      checkpoints: [false, false, false, false],
      boostCooldown: 0,
      shieldActive: false,
      color: '#4444ff',
      trail: [],
      crashed: false,
      nitroCharges: 3
    }
  ]);

  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number, life: number, color: string}>>([]);

  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [mobileControls, setMobileControls] = useState({
    accelerate: false,
    brake: false,
    left: false,
    right: false,
    boost: false
  });

  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });

  // Update canvas size for mobile
  useEffect(() => {
    const updateCanvasSize = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const maxWidth = Math.min(window.innerWidth - 40, 600);
        const maxHeight = Math.min(window.innerHeight - 200, 400);
        setCanvasSize({ width: maxWidth, height: maxHeight });
      } else {
        setCanvasSize({ width: 1200, height: 800 });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const CANVAS_WIDTH = canvasSize.width;
  const CANVAS_HEIGHT = canvasSize.height;

  // Race track checkpoints
  const checkpoints = [
    { x: 500, y: 150, width: 20, height: 80 },
    { x: 650, y: 350, width: 80, height: 20 },
    { x: 300, y: 450, width: 20, height: 80 },
    { x: 50, y: 250, width: 80, height: 20 }
  ];

  const generatePowerUps = useCallback(() => {
    const powerUpTypes = [
      { type: 'speed', emoji: '⚡', color: '#FFD700' },
      { type: 'shield', emoji: '🛡️', color: '#00CED1' },
      { type: 'nitro', emoji: '🔥', color: '#FF4500' },
      { type: 'missile', emoji: '🚀', color: '#DC143C' }
    ];

    const newPowerUps: PowerUp[] = [];
    for (let i = 0; i < 6; i++) {
      const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      newPowerUps.push({
        id: `powerup-${i}`,
        x: 150 + Math.random() * 500,
        y: 150 + Math.random() * 300,
        type: powerUpType.type as 'speed' | 'shield' | 'nitro' | 'missile',
        emoji: powerUpType.emoji,
        color: powerUpType.color,
        collected: false
      });
    }
    setPowerUps(newPowerUps);
  }, []);

  const generateObstacles = useCallback(() => {
    const newObstacles: Obstacle[] = [
      { id: 'oil1', x: 200, y: 200, width: 30, height: 30, type: 'oil' },
      { id: 'oil2', x: 450, y: 300, width: 30, height: 30, type: 'oil' },
      { id: 'barrier1', x: 350, y: 180, width: 15, height: 60, type: 'barrier' },
      { id: 'barrier2', x: 550, y: 380, width: 60, height: 15, type: 'barrier' },
      { id: 'spike1', x: 300, y: 350, width: 25, height: 25, type: 'spike' },
      { id: 'spike2', x: 600, y: 200, width: 25, height: 25, type: 'spike' }
    ];
    setObstacles(newObstacles);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
  }, []);

  const handleMobileControl = (control: keyof typeof mobileControls, isPressed: boolean) => {
    setMobileControls(prev => ({ ...prev, [control]: isPressed }));
  };

  // Placeholder for playHorn function
  const playHorn = useCallback(() => {
    console.log("Horn sound played!");
  }, []);


  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      generatePowerUps();
      generateObstacles();
    }
  }, [gameStarted, gameOver, generatePowerUps, generateObstacles]);

  // Countdown before race starts
  useEffect(() => {
    if (gameStarted && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, countdown]);

  // Main game loop
  useEffect(() => {
    if (!gameStarted || gameOver || countdown > 0) return;

    const gameLoop = setInterval(() => {
      setRaceTime(prev => prev + 0.1);

      // Update cars
      setCars(prevCars => {
        return prevCars.map(car => {
          if (car.id !== player || car.crashed) return car;

          let newSpeed = car.speed;
          let newAngle = car.angle;
          let newX = car.x;
          let newY = car.y;
          let newBoostCooldown = Math.max(0, car.boostCooldown - 1);
          let newShieldActive = car.shieldActive && car.boostCooldown > 0;
          let newNitroCharges = car.nitroCharges;
          let newCrashed = car.crashed;

          const isAccelerating = keys['w'] || keys['arrowup'] || mobileControls.accelerate;
          const isBraking = keys['s'] || keys['arrowdown'] || mobileControls.brake;
          const isTurningLeft = keys['a'] || keys['arrowleft'] || mobileControls.left;
          const isTurningRight = keys['d'] || keys['arrowright'] || mobileControls.right;
          const isBoosting = keys[' '] || mobileControls.boost;

          // Acceleration and braking
          if (isAccelerating) {
            newSpeed = Math.min(8, newSpeed + 0.3);
          } else if (isBraking) {
            newSpeed = Math.max(-3, newSpeed - 0.5);
          } else {
            newSpeed *= 0.95; // Natural deceleration
          }

          // Boost/Nitro
          if (isBoosting && newBoostCooldown === 0 && newNitroCharges > 0) {
            newSpeed = Math.min(15, newSpeed + 5);
            newBoostCooldown = 60; // 3 seconds cooldown
            newNitroCharges--;

            // Add boost particles
            setParticles(prev => [...prev, ...Array(10).fill(0).map(() => ({
              x: newX + Math.random() * 20 - 10,
              y: newY + Math.random() * 20 - 10,
              vx: Math.random() * 4 - 2,
              vy: Math.random() * 4 - 2,
              life: 30,
              color: '#FF4500'
            }))]);
          }

          // Steering (only when moving)
          if (Math.abs(newSpeed) > 0.5) {
            if (isTurningLeft) newAngle -= 0.08 * Math.abs(newSpeed);
            if (isTurningRight) newAngle += 0.08 * Math.abs(newSpeed);
          }

          // Movement
          newX += Math.cos(newAngle) * newSpeed;
          newY += Math.sin(newAngle) * newSpeed;

          // Track boundaries with bouncing
          if (newX < 20) {
            newX = 20;
            newSpeed *= -0.5;
            newAngle = Math.PI - newAngle;
          }
          if (newX > 780) {
            newX = 780;
            newSpeed *= -0.5;
            newAngle = Math.PI - newAngle;
          }
          if (newY < 20) {
            newY = 20;
            newSpeed *= -0.5;
            newAngle = -newAngle;
          }
          if (newY > 580) {
            newY = 580;
            newSpeed *= -0.5;
            newAngle = -newAngle;
          }

          // Obstacle collision
          obstacles.forEach(obstacle => {
            if (newX >= obstacle.x && newX <= obstacle.x + obstacle.width &&
                newY >= obstacle.y && newY <= obstacle.y + obstacle.height) {
              if (obstacle.type === 'oil') {
                newAngle += (Math.random() - 0.5) * 0.5; // Slip
                newSpeed *= 0.7;
              } else if (obstacle.type === 'barrier' && !newShieldActive) {
                newSpeed = 0;
                newCrashed = true;
                setTimeout(() => {
                  setCars(prev => prev.map(c => c.id === car.id ? {...c, crashed: false} : c));
                }, 2000);
              } else if (obstacle.type === 'spike' && !newShieldActive) {
                newSpeed *= 0.3;
              }
            }
          });

          // Power-up collection
          setPowerUps(prevPowerUps => {
            return prevPowerUps.map(powerUp => {
              if (!powerUp.collected &&
                  Math.sqrt(Math.pow(powerUp.x - newX, 2) + Math.pow(powerUp.y - newY, 2)) < 25) {

                switch (powerUp.type) {
                  case 'speed':
                    newSpeed = Math.min(12, newSpeed + 3);
                    break;
                  case 'shield':
                    newShieldActive = true;
                    newBoostCooldown = 180; // 9 seconds
                    break;
                  case 'nitro':
                    newNitroCharges = Math.min(5, newNitroCharges + 2);
                    break;
                  case 'missile':
                    // Launch missile at other players
                    break;
                }

                return { ...powerUp, collected: true };
              }
              return powerUp;
            });
          });

          // Checkpoint system
          const newCheckpoints = [...car.checkpoints];
          let newLap = car.lap;

          checkpoints.forEach((checkpoint, index) => {
            if (newX >= checkpoint.x && newX <= checkpoint.x + checkpoint.width &&
                newY >= checkpoint.y && newY <= checkpoint.y + checkpoint.height) {
              if (!newCheckpoints[index]) {
                newCheckpoints[index] = true;

                // Check if lap completed
                if (newCheckpoints.every(cp => cp) && index === 0) {
                  newLap++;
                  newCheckpoints.fill(false);

                  if (newLap >= 3) {
                    setWinner(`Player ${car.id} Wins! 🏆`);
                    setGameOver(true);
                  }
                }
              }
            }
          });

          // Update trail
          const newTrail = [...car.trail, { x: newX, y: newY }];
          if (newTrail.length > 15) newTrail.shift();

          return {
            ...car,
            x: newX,
            y: newY,
            speed: newSpeed,
            angle: newAngle,
            lap: newLap,
            checkpoints: newCheckpoints,
            boostCooldown: newBoostCooldown,
            shieldActive: newShieldActive,
            trail: newTrail,
            crashed: newCrashed,
            nitroCharges: newNitroCharges
          };
        });
      });

      // Update particles
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - 1
      })).filter(p => p.life > 0));

    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, countdown, keys, mobileControls, player, obstacles]);

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setRaceTime(0);
    setCountdown(3);
    setCars([
      {
        id: 'X',
        x: 100,
        y: 300,
        speed: 0,
        angle: 0,
        lap: 0,
        checkpoints: [false, false, false, false],
        boostCooldown: 0,
        shieldActive: false,
        color: '#ff4444',
        trail: [],
        crashed: false,
        nitroCharges: 3
      },
      {
        id: 'O',
        x: 100,
        y: 340,
        speed: 0,
        angle: 0,
        lap: 0,
        checkpoints: [false, false, false, false],
        boostCooldown: 0,
        shieldActive: false,
        color: '#4444ff',
        trail: [],
        crashed: false,
        nitroCharges: 3
      }
    ]);
    setPowerUps([]);
    setObstacles([]);
    setParticles([]);
  };

  const currentCar = cars.find(c => c.id === player);

  return (
    <div className="game-container">
      <div className="game-overlay"></div>

      <div className="game-header">
        <h2 className="game-title">🏎️ Turbo Race Championship</h2>
        <div className="game-status">
          Room: {roomCode} | Player: {player} | Time: {raceTime.toFixed(1)}s
        </div>
        <div style={{ fontSize: '1rem', marginTop: '5px' }}>
          Lap: {(currentCar?.lap || 0) + 1}/3 | Speed: {Math.abs(currentCar?.speed || 0).toFixed(1)} | Nitro: {currentCar?.nitroCharges || 0}
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
          <h3 style={{ fontSize: '2rem', margin: '0 0 20px 0' }}>🏁 Formula StarFace!</h3>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            Race for 3 laps! Use WASD to drive, SPACE for nitro boost!
          </p>
          <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 30px' }}>
            🚗 Start Engines!
          </button>
        </div>
      )}

      {countdown > 0 && gameStarted && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '6rem',
          fontWeight: 'bold',
          color: '#FFD700',
          textShadow: '0 0 20px #FFD700',
          zIndex: 15,
          animation: 'pulse 1s infinite'
        }}>
          {countdown}
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
          <p style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
            Race Time: {raceTime.toFixed(1)} seconds
          </p>
          <button onClick={resetGame} className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 30px' }}>
            🔄 Race Again
          </button>
        </div>
      )}

      <div className="game-arena" style={{ position: 'relative', overflow: 'hidden', width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}>
        {/* Race track */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(45deg, #228B22, #32CD32)',
          borderRadius: '20px'
        }}>
          {/* Track surface */}
          <div style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            right: '40px',
            bottom: '40px',
            background: 'repeating-linear-gradient(90deg, #444 0px, #444 10px, #555 10px, #555 20px)',
            borderRadius: '15px',
            border: '5px solid #FFD700'
          }} />

          {/* Start/Finish line */}
          <div style={{
            position: 'absolute',
            left: '80px',
            top: '280px',
            width: '40px',
            height: '80px',
            background: 'repeating-linear-gradient(0deg, white 0px, white 10px, black 10px, black 20px)',
            border: '2px solid #FFD700'
          }} />
        </div>

        {/* Checkpoints */}
        {checkpoints.map((checkpoint, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: checkpoint.x,
              top: checkpoint.y,
              width: checkpoint.width,
              height: checkpoint.height,
              background: currentCar?.checkpoints[index] ?
                'linear-gradient(45deg, #32CD32, #228B22)' :
                'linear-gradient(45deg, #FFD700, #FFA500)',
              border: '2px solid white',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'white'
            }}
          >
            {index + 1}
          </div>
        ))}

        {/* Obstacles */}
        {obstacles.map(obstacle => (
          <div
            key={obstacle.id}
            style={{
              position: 'absolute',
              left: obstacle.x,
              top: obstacle.y,
              width: obstacle.width,
              height: obstacle.height,
              background: obstacle.type === 'oil' ?
                'radial-gradient(circle, #1a1a1a, #333)' :
                obstacle.type === 'barrier' ?
                'linear-gradient(45deg, #8B4513, #654321)' :
                'linear-gradient(45deg, #DC143C, #8B0000)',
              borderRadius: obstacle.type === 'oil' ? '50%' : '5px',
              border: '2px solid #666',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            {obstacle.type === 'oil' && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '16px'
              }}>
                🛢️
              </div>
            )}
            {obstacle.type === 'spike' && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '16px'
              }}>
                ⚠️
              </div>
            )}
          </div>
        ))}

        {/* Power-ups */}
        {powerUps.filter(p => !p.collected).map(powerUp => (
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

        {/* Car trails */}
        {cars.map(car => (
          <div key={`trail-${car.id}`}>
            {car.trail.map((point, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: point.x - 2,
                  top: point.y - 2,
                  width: '4px',
                  height: '4px',
                  background: car.color,
                  opacity: index / car.trail.length * 0.5,
                  borderRadius: '50%'
                }}
              />
            ))}
          </div>
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
              opacity: particle.life / 30
            }}
          />
        ))}

        {/* Cars */}
        {cars.map(car => (
          <div
            key={car.id}
            style={{
              position: 'absolute',
              left: car.x - 15,
              top: car.y - 10,
              width: '30px',
              height: '20px',
              background: car.shieldActive ?
                `linear-gradient(45deg, ${car.color}, #00CED1)` :
                `linear-gradient(45deg, ${car.color}, ${car.color}dd)`,
              borderRadius: '8px',
              border: car.id === player ? '3px solid #FFD700' : '2px solid white',
              transform: `rotate(${car.angle}rad)`,
              boxShadow: car.shieldActive ?
                '0 0 20px #00CED1' :
                '0 2px 8px rgba(0, 0, 0, 0.3)',
              filter: car.crashed ? 'grayscale(100%)' : 'none',
              opacity: car.crashed ? 0.5 : 1,
              transition: 'opacity 0.3s ease',
              zIndex: car.id === player ? 10 : 5
            }}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '12px'
            }}>
              🏎️
            </div>

            {/* Speed indicator */}
            {Math.abs(car.speed) > 3 && (
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px'
              }}>
                💨
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Advanced Mobile Controls */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '15px',
        zIndex: 20
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 60px)',
          gridTemplateRows: 'repeat(3, 60px)',
          gap: '5px'
        }}>
          <div></div>
          <button
            className="mobile-control-btn"
            onTouchStart={() => handleMobileControl('accelerate', true)}
            onTouchEnd={() => handleMobileControl('accelerate', false)}
            onMouseDown={() => handleMobileControl('accelerate', true)}
            onMouseUp={() => handleMobileControl('accelerate', false)}
            style={{
              background: 'linear-gradient(135deg, #32CD32, #228B22)',
              fontSize: '24px'
            }}
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
            onTouchStart={() => handleMobileControl('brake', true)}
            onTouchEnd={() => handleMobileControl('brake', false)}
            onMouseDown={() => handleMobileControl('brake', true)}
            onMouseUp={() => handleMobileControl('brake', false)}
            style={{
              background: 'linear-gradient(135deg, #DC143C, #8B0000)'
            }}
          >
            ⬇️
          </button>
          <div></div>
        </div>

        <button
          className="mobile-control-btn"
          onTouchStart={() => handleMobileControl('boost', true)}
          onTouchEnd={() => handleMobileControl('boost', false)}
          onMouseDown={() => handleMobileControl('boost', true)}
          onMouseUp={() => handleMobileControl('boost', false)}
          style={{
            background: currentCar?.boostCooldown === 0 && (currentCar?.nitroCharges || 0) > 0 ?
              'linear-gradient(135deg, #FFD700, #FFA500)' :
              'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            width: '80px',
            height: '80px',
            fontSize: '32px'
          }}
          disabled={!currentCar || currentCar.boostCooldown > 0 || currentCar.nitroCharges <= 0}
        >
          🚀
        </button>
      </div>

      {/* Race HUD */}
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
        <h4 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>🏁 Race Status</h4>
        {cars.map(car => (
          <div key={car.id} style={{
            display: 'flex',
            alignItems: 'center',
            margin: '5px 0',
            color: car.id === player ? '#FFD700' : 'white'
          }}>
            <span style={{ marginRight: '10px' }}>
              {car.lap >= 3 ? '🏆' : car.lap >= 2 ? '🥈' : car.lap >= 1 ? '🥉' : '🏎️'}
            </span>
            Player {car.id}: Lap {car.lap + 1}/3
            {car.shieldActive && ' 🛡️'}
            {car.crashed && ' 💥'}
          </div>
        ))}

        {currentCar && (
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            Nitro: {'🔥'.repeat(currentCar.nitroCharges)}<br/>
            {currentCar.boostCooldown > 0 && `Cooldown: ${(currentCar.boostCooldown / 20).toFixed(1)}s`}
          </div>
        )}
      </div>
    </div>
  );
};

export default RaceCars;