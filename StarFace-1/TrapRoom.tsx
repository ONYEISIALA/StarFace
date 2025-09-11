import React, { useState, useEffect, useCallback } from 'react';

interface TrapRoomProps {
  roomCode: string;
  player: 'X' | 'O';
}

interface Player {
  id: string;
  x: number;
  y: number;
  isAlive: boolean;
  color: string;
  health: number;
  maxHealth: number;
  invulnerable: number;
  hasKey: boolean;
}

interface Trap {
  id: string;
  x: number;
  y: number;
  type: 'spike' | 'arrow' | 'falling_floor' | 'saw' | 'fire';
  active: boolean;
  cooldown: number;
  damage: number;
  size: number;
  emoji: string;
  pattern: number;
}

const TrapRoom: React.FC<TrapRoomProps> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [gameTime, setGameTime] = useState(0);

  const [players, setPlayers] = useState<Player[]>([
    { id: 'X', x: 100, y: 500, isAlive: true, color: '#ff4444', health: 100, maxHealth: 100, invulnerable: 0, hasKey: false },
    { id: 'O', x: 150, y: 500, isAlive: true, color: '#4444ff', health: 100, maxHealth: 100, invulnerable: 0, hasKey: false }
  ]);

  const [traps, setTraps] = useState<Trap[]>([
    { id: 'spike1', x: 200, y: 450, type: 'spike', active: false, cooldown: 0, damage: 25, size: 40, emoji: '⚡', pattern: 0 },
    { id: 'spike2', x: 350, y: 400, type: 'spike', active: false, cooldown: 0, damage: 25, size: 40, emoji: '⚡', pattern: 60 },
    { id: 'arrow1', x: 100, y: 300, type: 'arrow', active: false, cooldown: 0, damage: 20, size: 30, emoji: '🏹', pattern: 120 },
    { id: 'fire1', x: 500, y: 350, type: 'fire', active: false, cooldown: 0, damage: 15, size: 50, emoji: '🔥', pattern: 30 },
    { id: 'saw1', x: 300, y: 200, type: 'saw', active: false, cooldown: 0, damage: 35, size: 45, emoji: '⚙️', pattern: 90 },
    { id: 'floor1', x: 400, y: 250, type: 'falling_floor', active: false, cooldown: 0, damage: 40, size: 60, emoji: '🕳️', pattern: 180 }
  ]);

  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false
  });

  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number, life: number, color: string}>>([]);
  const [exitDoor, setExitDoor] = useState({ x: 650, y: 100, unlocked: false });

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

  // Placeholder functions for abilities that were intended to be added
  const speedBoost = useCallback(() => {}, []);
  const toggleInvisibility = useCallback(() => {}, []);
  const resetTrapCooldowns = useCallback(() => {}, []);
  const freezeOpponents = useCallback(() => {}, []);

  // Placeholder for activating traps, currently not implemented in this version
  const activateTrap = useCallback(() => {
    console.log("Activate trap action");
  }, []);

  // Placeholder for player movement, currently handled directly in the game loop
  const movePlayer = useCallback((dx: number, dy: number) => {
    console.log(`Move player by: ${dx}, ${dy}`);
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setGameTime(prev => prev + 0.1);

      // Update trap patterns
      setTraps(prevTraps => {
        return prevTraps.map(trap => {
          const newCooldown = Math.max(0, trap.cooldown - 1);
          const timeCycle = (gameTime * 10 + trap.pattern) % 240;
          const newActive = timeCycle < 60 && newCooldown === 0;

          return {
            ...trap,
            active: newActive,
            cooldown: newActive && trap.cooldown === 0 ? 30 : newCooldown
          };
        });
      });

      // Update players
      setPlayers(prevPlayers => {
        return prevPlayers.map(p => {
          if (p.id !== player || !p.isAlive) return p;

          let newX = p.x;
          let newY = p.y;
          let newHealth = p.health;
          let newInvulnerable = Math.max(0, p.invulnerable - 1);
          let newHasKey = p.hasKey;

          const isUp = keys['w'] || keys['arrowup'] || mobileControls.up;
          const isDown = keys['s'] || keys['arrowdown'] || mobileControls.down;
          const isLeft = keys['a'] || keys['arrowleft'] || mobileControls.left;
          const isRight = keys['d'] || keys['arrowright'] || mobileControls.right;

          const speed = 3;
          if (isUp) newY -= speed;
          if (isDown) newY += speed;
          if (isLeft) newX -= speed;
          if (isRight) newX += speed;

          // Boundary check
          newX = Math.max(20, Math.min(CANVAS_WIDTH - 20, newX));
          newY = Math.max(20, Math.min(CANVAS_HEIGHT - 20, newY));

          // Check trap collisions
          if (newInvulnerable === 0) {
            traps.forEach(trap => {
              if (trap.active) {
                const distance = Math.sqrt(
                  Math.pow(newX - trap.x, 2) + Math.pow(newY - trap.y, 2)
                );

                if (distance < trap.size / 2 + 15) {
                  newHealth -= trap.damage;
                  newInvulnerable = 60;

                  // Create damage particles
                  setParticles(prev => [...prev, ...Array(10).fill(0).map(() => ({
                    x: newX + Math.random() * 40 - 20,
                    y: newY + Math.random() * 40 - 20,
                    vx: Math.random() * 8 - 4,
                    vy: Math.random() * 8 - 4,
                    life: 30,
                    color: '#FF4444'
                  }))]);
                }
              }
            });
          }

          // Check for key pickup (random spawn)
          if (!newHasKey && Math.random() < 0.001) {
            newHasKey = true;
            setExitDoor(prev => ({ ...prev, unlocked: true }));
          }

          // Check exit door
          if (exitDoor.unlocked && Math.sqrt(Math.pow(newX - exitDoor.x, 2) + Math.pow(newY - exitDoor.y, 2)) < 40) {
            setWinner(`Player ${p.id} Escaped the Trap Room! 🚪`);
            setGameOver(true);
          }

          // Check death
          if (newHealth <= 0) {
            return { ...p, isAlive: false };
          }

          return { 
            ...p, 
            x: newX, 
            y: newY, 
            health: newHealth, 
            invulnerable: newInvulnerable,
            hasKey: newHasKey
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

      // Check survival win condition
      const alivePlayers = players.filter(p => p.isAlive);
      if (alivePlayers.length === 1 && !exitDoor.unlocked) {
        setWinner(`Player ${alivePlayers[0].id} Survived the Longest! 💀`);
        setGameOver(true);
      } else if (alivePlayers.length === 0) {
        setWinner("Everyone was trapped! 💀");
        setGameOver(true);
      }

    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, keys, mobileControls, player, players, traps, exitDoor.unlocked, gameTime]);

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setGameTime(0);
    setPlayers([
      { id: 'X', x: 100, y: 500, isAlive: true, color: '#ff4444', health: 100, maxHealth: 100, invulnerable: 0, hasKey: false },
      { id: 'O', x: 150, y: 500, isAlive: true, color: '#4444ff', health: 100, maxHealth: 100, invulnerable: 0, hasKey: false }
    ]);
    setExitDoor({ x: 650, y: 100, unlocked: false });
    setParticles([]);
  };

  const currentPlayer = players.find(p => p.id === player);

  return (
    <div className="game-container" style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}>
      <div className="game-overlay"></div>

      <div className="game-header">
        <h2 className="game-title">🪤 Trap Room Survival</h2>
        <div className="game-status">
          Room: {roomCode} | Player: {player} | Time: {gameTime.toFixed(1)}s
        </div>
        <div style={{ fontSize: '1rem', marginTop: '5px' }}>
          Health: {'❤️'.repeat(Math.max(0, Math.floor((currentPlayer?.health || 0) / 20)))} | 
          Key: {currentPlayer?.hasKey ? '🗝️' : '❌'} | 
          Status: {currentPlayer?.isAlive ? '🟢 Alive' : '💀 Trapped'}
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
          <h3 style={{ fontSize: '2rem', margin: '0 0 20px 0' }}>🪤 Welcome to the Trap Room!</h3>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            Navigate deadly traps! Find the key to unlock the exit door or be the last survivor!
          </p>
          <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 30px' }}>
            💀 Enter the Trap Room!
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
          <p style={{ fontSize: '1.5rem', marginBottom: '20px' }}>
            Survival Time: {gameTime.toFixed(1)} seconds
          </p>
          <button onClick={resetGame} className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 30px' }}>
            🔄 Try Again
          </button>
        </div>
      )}

      <div className="game-arena" style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}>
        {/* Dungeon background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #2c1810, #3d2817, #4a3423)',
          borderRadius: '20px',
          border: '5px solid #8B4513'
        }}>
          {/* Stone texture */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(139, 69, 19, 0.1) 0px, transparent 1px, transparent 20px, rgba(139, 69, 19, 0.1) 21px)',
            borderRadius: '15px'
          }} />
        </div>

        {/* Traps */}
        {traps.map(trap => (
          <div
            key={trap.id}
            style={{
              position: 'absolute',
              left: trap.x - trap.size / 2,
              top: trap.y - trap.size / 2,
              width: trap.size,
              height: trap.size,
              background: trap.active ? 
                'radial-gradient(circle, #FF4500, #DC143C)' :
                'radial-gradient(circle, #666, #333)',
              borderRadius: trap.type === 'saw' ? '50%' : '10px',
              border: '3px solid ' + (trap.active ? '#FF0000' : '#555'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${trap.size * 0.4}px`,
              boxShadow: trap.active ? 
                '0 0 20px #FF4500, 0 0 40px #FF0000' : 
                '0 4px 15px rgba(0, 0, 0, 0.3)',
              animation: trap.active ? 
                (trap.type === 'saw' ? 'spin 0.2s linear infinite' : 'pulse 0.5s ease infinite') : 
                'none',
              transform: trap.type === 'spike' && trap.active ? 'translateY(-10px)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            {trap.emoji}
          </div>
        ))}

        {/* Exit Door */}
        <div
          style={{
            position: 'absolute',
            left: exitDoor.x - 30,
            top: exitDoor.y - 40,
            width: '60px',
            height: '80px',
            background: exitDoor.unlocked ? 
              'linear-gradient(135deg, #FFD700, #FFA500)' :
              'linear-gradient(135deg, #8B4513, #654321)',
            borderRadius: '10px 10px 0 0',
            border: '3px solid ' + (exitDoor.unlocked ? '#FFD700' : '#333'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            boxShadow: exitDoor.unlocked ? 
              '0 0 25px #FFD700' : 
              '0 4px 15px rgba(0, 0, 0, 0.5)',
            animation: exitDoor.unlocked ? 'glow 1s ease infinite' : 'none'
          }}
        >
          🚪
        </div>

        {/* Particles */}
        {particles.map((particle, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: particle.x,
              top: particle.y,
              width: '6px',
              height: '6px',
              background: particle.color,
              borderRadius: '50%',
              opacity: particle.life / 30,
              filter: 'blur(1px)'
            }}
          />
        ))}

        {/* Players */}
        {players.map(p => (
          <div
            key={p.id}
            className="player"
            style={{
              left: p.x - 15,
              top: p.y - 15,
              backgroundColor: p.color,
              border: p.id === player ? '3px solid #FFD700' : '3px solid white',
              zIndex: p.id === player ? 10 : 5,
              opacity: p.isAlive ? (p.invulnerable > 0 ? 0.5 : 1) : 0.3,
              filter: !p.isAlive ? 'grayscale(100%)' : 'none',
              animation: p.invulnerable > 0 ? 'flash 0.3s infinite' : 'none'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '16px'
            }}>
              {p.isAlive ? '🏃' : '💀'}
            </div>

            {/* Health bar */}
            <div style={{
              position: 'absolute',
              top: '-25px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40px',
              height: '6px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(p.health / p.maxHealth) * 100}%`,
                height: '100%',
                background: p.health > 60 ? 
                  'linear-gradient(90deg, #32CD32, #228B22)' :
                  p.health > 30 ?
                  'linear-gradient(90deg, #FFD700, #FF8C00)' :
                  'linear-gradient(90deg, #FF4500, #DC143C)',
                borderRadius: '3px'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Controls */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
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
        <h4 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>🪤 Trap Status</h4>
        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
          Active Traps: {traps.filter(t => t.active).length}/{traps.length}
        </div>
        {players.map(p => (
          <div key={p.id} style={{
            margin: '5px 0',
            color: p.id === player ? '#FFD700' : 'white',
            fontSize: '12px'
          }}>
            Player {p.id}: {p.isAlive ? `${Math.floor(p.health)}❤️` : '💀'}
            {p.hasKey && ' 🗝️'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrapRoom;