import React, { useState, useEffect, useCallback } from 'react';

interface ColorSwitchProps {
  roomCode: string;
  player: 'X' | 'O';
}

interface Player {
  id: string;
  x: number;
  y: number;
  isAlive: boolean;
  color: string;
  score: number;
  currentTile: string | null;
}

interface FloorTile {
  x: number;
  y: number;
  color: string;
  safe: boolean;
  falling: boolean;
  id: string;
}

const ColorSwitch: React.FC<ColorSwitchProps> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [gameTime, setGameTime] = useState(0);
  const [round, setRound] = useState(1);
  const [nextChangeTime, setNextChangeTime] = useState(5);
  const [currentSafeColor, setCurrentSafeColor] = useState('red');

  const colors = ['red', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  const colorNames = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Cyan'];

  const [players, setPlayers] = useState<Player[]>([
    { id: 'X', x: 250, y: 450, isAlive: true, color: '#ff4444', score: 0, currentTile: null },
    { id: 'O', x: 550, y: 450, isAlive: true, color: '#4444ff', score: 0, currentTile: null }
  ]);

  const [floorTiles, setFloorTiles] = useState<FloorTile[]>([]);

  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [mobileControls, setMobileControls] = useState({
    up: false,
    down: false,
    left: false,
    right: false
  });

  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number, life: number, color: string}>>([]);

  // Initialize canvas size and update for mobile
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


  // Initialize floor tiles
  useEffect(() => {
    const tiles: FloorTile[] = [];
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 16; col++) {
        tiles.push({
          x: col * 50,
          y: 100 + row * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
          safe: false,
          falling: false,
          id: `tile-${row}-${col}`
        });
      }
    }
    setFloorTiles(tiles);
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

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Dummy functions to satisfy the compiler, they should be implemented based on game logic
  const movePlayer = useCallback((dx: number, dy: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === player && p.isAlive) {
        let newX = p.x + dx * 4; // Adjust speed as needed
        let newY = p.y + dy * 4; // Adjust speed as needed

        // Boundary check
        newX = Math.max(10, Math.min(CANVAS_WIDTH - 10, newX));
        newY = Math.max(90, Math.min(CANVAS_HEIGHT - 10, newY));
        
        return { ...p, x: newX, y: newY };
      }
      return p;
    }));
  }, [player, CANVAS_WIDTH, CANVAS_HEIGHT]);

  const jump = useCallback(() => {
    // Implement jump logic if needed
    console.log('Jump!');
  }, []);

  const switchColor = useCallback(() => {
    setPlayers(prev => prev.map(p => {
      if (p.id === player && p.isAlive) {
        const currentPlayerColorIndex = colors.indexOf(p.color);
        const nextColorIndex = (currentPlayerColorIndex + 1) % colors.length;
        return { ...p, color: colors[nextColorIndex] };
      }
      return p;
    }));
  }, [player, colors]);


  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setGameTime(prev => prev + 0.1);
      setNextChangeTime(prev => {
        if (prev <= 0.1) {
          // Change safe color
          const newSafeColor = colors[Math.floor(Math.random() * colors.length)];
          setCurrentSafeColor(newSafeColor);
          setRound(prev => prev + 1);

          // Update floor tiles
          setFloorTiles(prevTiles => {
            return prevTiles.map(tile => ({
              ...tile,
              safe: tile.color === newSafeColor,
              falling: tile.color !== newSafeColor
            }));
          });

          return Math.max(2, 6 - Math.floor(round / 3)); // Decrease time between changes
        }
        return prev - 0.1;
      });

      // Update falling tiles
      setFloorTiles(prevTiles => {
        return prevTiles.map(tile => {
          if (tile.falling) {
            return { ...tile, y: tile.y + 5 };
          }
          return tile;
        }).filter(tile => tile.y < CANVAS_HEIGHT); // Remove fallen tiles
      });

      // Update players
      setPlayers(prevPlayers => {
        return prevPlayers.map(p => {
          if (p.id !== player || !p.isAlive) return p;

          let newX = p.x;
          let newY = p.y;

          const isUp = keys['w'] || keys['arrowup'] || mobileControls.up;
          const isDown = keys['s'] || keys['arrowdown'] || mobileControls.down;
          const isLeft = keys['a'] || keys['arrowleft'] || mobileControls.left;
          const isRight = keys['d'] || keys['arrowright'] || mobileControls.right;

          const speed = 4;
          if (isUp) newY -= speed;
          if (isDown) newY += speed;
          if (isLeft) newX -= speed;
          if (isRight) newX += speed;

          // Boundary check
          newX = Math.max(10, Math.min(CANVAS_WIDTH - 10, newX));
          newY = Math.max(90, Math.min(CANVAS_HEIGHT - 10, newY));

          // Check which tile player is on
          const currentTile = floorTiles.find(tile => 
            newX >= tile.x && newX <= tile.x + 50 &&
            newY >= tile.y && newY <= tile.y + 40 &&
            !tile.falling
          );

          // Check if player is on safe ground
          if (!currentTile || (currentTile && !currentTile.safe && nextChangeTime < 4)) {
            if (newY > CANVAS_HEIGHT - 20) { // Fell off the bottom
              setParticles(prev => [...prev, ...Array(15).fill(0).map(() => ({
                x: newX + Math.random() * 40 - 20,
                y: newY + Math.random() * 40 - 20,
                vx: Math.random() * 8 - 4,
                vy: Math.random() * 8 - 4,
                life: 30,
                color: '#FF4444'
              }))]);

              return { ...p, isAlive: false };
            }
          }

          return { 
            ...p, 
            x: newX, 
            y: newY, 
            currentTile: currentTile?.id || null,
            score: p.score + (currentTile?.safe ? 1 : 0)
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

      // Check win condition
      const alivePlayers = players.filter(p => p.isAlive);
      if (alivePlayers.length === 1) {
        setWinner(`Player ${alivePlayers[0].id} Survived Color Switch! 🎨`);
        setGameOver(true);
      } else if (alivePlayers.length === 0) {
        setWinner("Everyone fell! 🌈");
        setGameOver(true);
      }

    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, keys, mobileControls, player, players, floorTiles, nextChangeTime, round, colors, movePlayer, jump, switchColor]); // Added dependencies

  const startGame = () => {
    setGameStarted(true);
    // Set initial safe color
    const initialColor = colors[0];
    setCurrentSafeColor(initialColor);
    setFloorTiles(prev => prev.map(tile => ({
      ...tile,
      safe: tile.color === initialColor
    })));
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setGameTime(0);
    setRound(1);
    setNextChangeTime(5);
    setPlayers([
      { id: 'X', x: 250, y: 450, isAlive: true, color: '#ff4444', score: 0, currentTile: null },
      { id: 'O', x: 550, y: 450, isAlive: true, color: '#4444ff', score: 0, currentTile: null }
    ]);

    // Reset floor
    const tiles: FloorTile[] = [];
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 16; col++) {
        tiles.push({
          x: col * 50,
          y: 100 + row * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
          safe: false,
          falling: false,
          id: `tile-${row}-${col}`
        });
      }
    }
    setFloorTiles(tiles);
    setParticles([]);
  };

  const currentPlayer = players.find(p => p.id === player);
  const safeColorName = colorNames[colors.indexOf(currentSafeColor)];

  return (
    <div className="game-container">
      <div className="game-overlay"></div>

      <div className="game-header">
        <h2 className="game-title">🎨 Color Switch Survival</h2>
        <div className="game-status">
          Room: {roomCode} | Player: {player} | Round: {round}
        </div>
        <div style={{ fontSize: '1rem', marginTop: '5px' }}>
          Safe Color: <span style={{ color: currentSafeColor, fontWeight: 'bold' }}>{safeColorName}</span> | 
          Next Change: {nextChangeTime.toFixed(1)}s | 
          Score: {currentPlayer?.score || 0}
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
          <h3 style={{ fontSize: '2rem', margin: '0 0 20px 0' }}>🎨 Color Switch Challenge!</h3>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            Stay on the safe colored tiles! Wrong color tiles will fall away!
          </p>
          <button onClick={startGame} className="btn-primary" style={{ fontSize: '1.5rem', padding: '15px 30px' }}>
            🌈 Start Switching!
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
            Final Score: {currentPlayer?.score || 0} | Rounds: {round}
          </p>
          <button onClick={resetGame} className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 30px' }}>
            🔄 Try Again
          </button>
        </div>
      )}

      <div className="game-arena" style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}>
        {/* Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #000428, #004e92)',
          borderRadius: '20px',
          border: '5px solid #FFD700'
        }} />

        {/* Safe color indicator */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: currentSafeColor,
          width: '200px',
          height: '40px',
          borderRadius: '20px',
          border: '3px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          boxShadow: '0 0 20px ' + currentSafeColor,
          zIndex: 8
        }}>
          SAFE: {safeColorName}
        </div>

        {/* Countdown warning */}
        {nextChangeTime <= 2 && (
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#FF4444',
            animation: 'pulse 0.5s ease infinite',
            zIndex: 9
          }}>
            ⚠️ CHANGING IN {Math.ceil(nextChangeTime)}! ⚠️
          </div>
        )}

        {/* Floor tiles */}
        {floorTiles.map(tile => (
          <div
            key={tile.id}
            style={{
              position: 'absolute',
              left: tile.x,
              top: tile.y,
              width: '48px',
              height: '38px',
              backgroundColor: tile.color,
              border: tile.safe ? '2px solid #FFD700' : '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '5px',
              opacity: tile.falling ? 0.5 : 1,
              transform: tile.falling ? 'rotateX(45deg)' : 'none',
              transition: tile.falling ? 'all 0.5s ease' : 'border 0.3s ease',
              boxShadow: tile.safe ? 
                '0 0 15px #FFD700, inset 0 0 10px rgba(255, 215, 0, 0.3)' : 
                '0 2px 8px rgba(0, 0, 0, 0.3)',
              zIndex: tile.safe ? 4 : 2
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
              width: '6px',
              height: '6px',
              background: particle.color,
              borderRadius: '50%',
              opacity: particle.life / 30
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
              opacity: p.isAlive ? 1 : 0.3,
              filter: !p.isAlive ? 'grayscale(100%)' : 'none',
              animation: nextChangeTime <= 1 ? 'shake 0.2s infinite' : 'none'
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
        <h4 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>🎨 Color Stats</h4>
        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
          Safe Tiles: {floorTiles.filter(t => t.safe && !t.falling).length}
        </div>
        {players.map(p => (
          <div key={p.id} style={{
            margin: '5px 0',
            color: p.id === player ? '#FFD700' : 'white',
            fontSize: '12px'
          }}>
            Player {p.id}: {p.isAlive ? `${p.score} pts` : '💀'}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorSwitch;