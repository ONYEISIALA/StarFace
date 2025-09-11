import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Block {
  x: number;
  y: number;
  width: number;
  color: string;
}

const StackTower: React.FC<{ roomCode: string; player: string }> = ({ roomCode, player }) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [players, setPlayers] = useState<Player[]>([]);
  const [winner, setWinner] = useState<string>('');
  const [currentBlock, setCurrentBlock] = useState({ x: 400, width: 100, speed: 3, direction: 1 });
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [effects, setEffects] = useState({
    slowTime: false,
    perfectGuide: false,
    freezeOpponent: false
  });
  const [camera, setCamera] = useState({ y: 0, shake: 0 });
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [fps, setFps] = useState(60);
  const [isMobile, setIsMobile] = useState(false);

  const CANVAS_WIDTH = Math.min(window.innerWidth * 0.9, 800);
  const CANVAS_HEIGHT = Math.min(window.innerHeight * 0.7, 600);
  const BLOCK_HEIGHT = 20;
  const BASE_BLOCK_WIDTH = 120;

  // Initialize players
  useEffect(() => {
    const playerColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    const initialPlayers: Player[] = [
      {
        id: player,
        name: `Player ${player}`,
        score: 0,
        color: playerColors[0],
        blocks: 1,
        perfectDrops: 0,
        combo: 0,
        powerUps: [],
        tower: [{ width: BASE_BLOCK_WIDTH, height: BLOCK_HEIGHT, x: CANVAS_WIDTH / 2 - BASE_BLOCK_WIDTH / 2 }]
      }
    ];

    // Add opponent
    if (player === 'X') {
      initialPlayers.push({
        id: 'O',
        name: 'Player O',
        score: 0,
        color: playerColors[1],
        blocks: 1,
        perfectDrops: 0,
        combo: 0,
        powerUps: [],
        tower: [{ width: BASE_BLOCK_WIDTH, height: BLOCK_HEIGHT, x: CANVAS_WIDTH / 2 - BASE_BLOCK_WIDTH / 2 }]
      });
    }

    setPlayers(initialPlayers);
  }, [player]);

  // Mobile detection
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // FPS tracking
  const updateFPS = useCallback((currentTime: number) => {
    if (lastFrameTime > 0) {
      const deltaTime = currentTime - lastFrameTime;
      const currentFPS = 1000 / deltaTime;
      setFps(Math.round(currentFPS));
    }
    setLastFrameTime(currentTime);
  }, [lastFrameTime]);

  // Game timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          const highestScore = Math.max(...players.map(p => p.score));
          const winningPlayer = players.find(p => p.score === highestScore);
          setWinner(winningPlayer?.name || 'Tie');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, players]);

  // Spawn power-ups
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnPowerUp = () => {
      const types: PowerUp['type'][] = ['slow_time', 'perfect_guide', 'double_points', 'wide_block', 'freeze_opponent'];
      const newPowerUp: PowerUp = {
        id: Date.now().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        x: Math.random() * (CANVAS_WIDTH - 40) + 20,
        y: Math.random() * 200 + 100,
        duration: 10000
      };
      setPowerUps(prev => [...prev, newPowerUp]);
    };

    const interval = setInterval(spawnPowerUp, 8000);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  // Add particle effect
  const addParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color,
        size: Math.random() * 5 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Update moving block
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const updateBlock = () => {
      setCurrentBlock(prev => {
        let newX = prev.x + prev.speed * prev.direction * (effects.slowTime ? 0.3 : 1);
        let newDirection = prev.direction;

        if (newX <= 0 || newX >= CANVAS_WIDTH - prev.width) {
          newDirection = -prev.direction;
          newX = Math.max(0, Math.min(CANVAS_WIDTH - prev.width, newX));
        }

        return { ...prev, x: newX, direction: newDirection };
      });
    };

    const interval = setInterval(updateBlock, 16);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, effects.slowTime]);

  // Update particles
  useEffect(() => {
    if (particles.length === 0) return;

    const updateParticles = () => {
      setParticles(prev => prev
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02,
          vy: p.vy + 0.2
        }))
        .filter(p => p.life > 0)
      );
    };

    const interval = setInterval(updateParticles, 16);
    return () => clearInterval(interval);
  }, [particles]);

  // Drop block
  const dropBlock = useCallback(() => {
    if (!gameStarted || gameOver) return;

    setPlayers(prev => prev.map(p => {
      if (p.id !== player) return p;

      const lastBlock = p.tower[p.tower.length - 1];
      const overlap = Math.max(0, Math.min(
        currentBlock.x + currentBlock.width,
        lastBlock.x + lastBlock.width
      ) - Math.max(currentBlock.x, lastBlock.x));

      if (overlap <= 0) {
        // Game over for this player
        return p;
      }

      const newBlockX = Math.max(currentBlock.x, lastBlock.x);
      const newBlockWidth = overlap;
      const isPerfect = Math.abs(overlap - lastBlock.width) < 5;

      let points = Math.floor(overlap / 10);
      let combo = isPerfect ? p.combo + 1 : 0;

      if (isPerfect) {
        points *= 2;
        addParticles(newBlockX + newBlockWidth/2, CANVAS_HEIGHT - p.tower.length * BLOCK_HEIGHT, '#ffd700', 15);
        setCamera(prev => ({ ...prev, shake: 5 }));
      }

      if (p.powerUps.includes('double_points')) {
        points *= 2;
      }

      const newTower = [...p.tower, { width: newBlockWidth, height: BLOCK_HEIGHT, x: newBlockX }];

      // Update camera to follow tower
      if (newTower.length > 10) {
        setCamera(prev => ({ ...prev, y: (newTower.length - 10) * BLOCK_HEIGHT }));
      }

      return {
        ...p,
        tower: newTower,
        score: p.score + points + (combo * 10),
        blocks: p.blocks + 1,
        perfectDrops: isPerfect ? p.perfectDrops + 1 : p.perfectDrops,
        combo
      };
    }));

    // Reset block
    setCurrentBlock(prev => ({
      ...prev,
      width: effects.perfectGuide ? BASE_BLOCK_WIDTH : Math.max(60, prev.width - 2),
      speed: Math.min(8, prev.speed + 0.1)
    }));
  }, [gameStarted, gameOver, currentBlock, player, effects, addParticles]);

  // Collect power-up
  const collectPowerUp = useCallback((powerUpId: string) => {
    const powerUp = powerUps.find(p => p.id === powerUpId);
    if (!powerUp) return;

    setPowerUps(prev => prev.filter(p => p.id !== powerUpId));

    switch (powerUp.type) {
      case 'slow_time':
        setEffects(prev => ({ ...prev, slowTime: true }));
        setTimeout(() => setEffects(prev => ({ ...prev, slowTime: false })), 5000);
        break;
      case 'perfect_guide':
        setEffects(prev => ({ ...prev, perfectGuide: true }));
        setTimeout(() => setEffects(prev => ({ ...prev, perfectGuide: false })), 3000);
        break;
      case 'wide_block':
        setCurrentBlock(prev => ({ ...prev, width: Math.min(150, prev.width + 20) }));
        break;
      case 'freeze_opponent':
        setEffects(prev => ({ ...prev, freezeOpponent: true }));
        setTimeout(() => setEffects(prev => ({ ...prev, freezeOpponent: false })), 4000);
        break;
    }

    addParticles(powerUp.x + 20, powerUp.y + 20, '#00ff00', 8);
  }, [powerUps, addParticles]);

  // Render game
  const render = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updateFPS(currentTime);

    // Clear canvas with animated gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(0.3, '#1a1a2e');
    gradient.addColorStop(0.7, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Add animated stars
    for (let i = 0; i < 50; i++) {
      const x = (i * 137.5) % CANVAS_WIDTH;
      const y = (i * 77.3) % CANVAS_HEIGHT;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(Date.now() * 0.001 + i) * 0.1})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Draw blocks with enhanced 3D visuals
    players.forEach((p, index) => {
      p.tower.forEach((block, blockIndex) => {
        const y = CANVAS_HEIGHT - (blockIndex + 1) * BLOCK_HEIGHT;
        const blockX = block.x;
        const blockWidth = block.width;
        const depth = 8;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(blockX + depth, y + depth, blockWidth, BLOCK_HEIGHT);

        // Main block with gradient
        const blockGradient = ctx.createLinearGradient(blockX, y, blockX, y + BLOCK_HEIGHT);
        blockGradient.addColorStop(0, lightenColor(p.color, 0.4));
        blockGradient.addColorStop(0.5, p.color);
        blockGradient.addColorStop(1, darkenColor(p.color, 0.3));

        ctx.fillStyle = blockGradient;
        ctx.fillRect(blockX, y, blockWidth, BLOCK_HEIGHT);

        // 3D edges
        ctx.fillStyle = lightenColor(p.color, 0.2);
        ctx.fillRect(blockX, y, blockWidth, depth);
        ctx.fillRect(blockX + blockWidth, y, depth, BLOCK_HEIGHT + depth);

        // Border with glow
        ctx.strokeStyle = lightenColor(p.color, 0.6);
        ctx.lineWidth = 2;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.strokeRect(blockX, y, blockWidth, BLOCK_HEIGHT);
        ctx.shadowBlur = 0;

        // Block number with better styling
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText((blockIndex + 1).toString(), blockX + blockWidth/2, y + 15);
        ctx.fillText((blockIndex + 1).toString(), blockX + blockWidth/2, y + 15);
      });
    });

    // Draw current moving block with enhanced effects
    if (gameStarted && !gameOver) {
      const currentPlayer = players.find(p => p.id === player);
      if (currentPlayer) {
        const currentY = CANVAS_HEIGHT - (currentPlayer.tower.length + 1) * BLOCK_HEIGHT;
        const depth = 8;

        // Perfect guide line
        if (effects.perfectGuide) {
          const lastBlock = currentPlayer.tower[currentPlayer.tower.length - 1];
          ctx.strokeStyle = '#00ff0080';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(lastBlock.x, currentY, lastBlock.width, BLOCK_HEIGHT);
          ctx.setLineDash([]);
        }

        const glowIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.shadowColor = currentBlock.color;
        ctx.shadowBlur = 30 * glowIntensity;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(currentBlock.x + depth, currentY + depth, currentBlock.width, BLOCK_HEIGHT);

        // Main block
        const blockGradient = ctx.createLinearGradient(currentBlock.x, currentY, currentBlock.x, currentY + BLOCK_HEIGHT);
        blockGradient.addColorStop(0, lightenColor(currentBlock.color, 0.6));
        blockGradient.addColorStop(0.5, currentBlock.color);
        blockGradient.addColorStop(1, darkenColor(currentBlock.color, 0.2));

        ctx.fillStyle = blockGradient;
        ctx.fillRect(currentBlock.x, currentY, currentBlock.width, BLOCK_HEIGHT);

        // 3D edges
        ctx.fillStyle = lightenColor(currentBlock.color, 0.4);
        ctx.fillRect(currentBlock.x, currentY, currentBlock.width, depth);
        ctx.fillRect(currentBlock.x + currentBlock.width, currentY, depth, BLOCK_HEIGHT + depth);

        // Animated border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeRect(currentBlock.x, currentY, currentBlock.width, BLOCK_HEIGHT);
        ctx.shadowBlur = 0;

        // Drop indicator
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(currentBlock.x + currentBlock.width/2, currentBlock.y + 40);
        ctx.lineTo(currentBlock.x + currentBlock.width/2, CANVAS_HEIGHT - currentPlayer.tower.length * BLOCK_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw power-ups
    powerUps.forEach(powerUp => {
      const pulse = Math.sin(currentTime * 0.01) * 0.3 + 0.7;
      ctx.save();
      ctx.translate(powerUp.x + 20, powerUp.y + 20);
      ctx.scale(pulse, pulse);

      // Power-up glow
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
      glowGradient.addColorStop(0, '#00ff0060');
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(-25, -25, 50, 50);

      // Power-up icon
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(-15, -15, 30, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const icons = {
        slow_time: '⏰',
        perfect_guide: '🎯',
        double_points: '×2',
        wide_block: '📏',
        freeze_opponent: '❄️'
      };

      ctx.fillText(icons[powerUp.type], 0, 0);
      ctx.restore();
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
      ctx.restore();
    });

    ctx.restore();

    // Reduce camera shake
    if (camera.shake > 0) {
      setCamera(prev => ({ ...prev, shake: prev.shake * 0.9 }));
    }

    animationRef.current = requestAnimationFrame(render);
  }, [players, currentBlock, powerUps, particles, camera, effects, updateFPS, gameStarted, gameOver, player, isMobile]);

  // Start render loop
  useEffect(() => {
    if (canvasRef.current) {
      animationRef.current = requestAnimationFrame(render);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  // Event handlers
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.key === ' ' || e.code === 'Enter') && gameStarted && !gameOver && currentBlock) {
        e.preventDefault();
        dropBlock();
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!gameStarted || gameOver) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check power-up collection
      powerUps.forEach(powerUp => {
        if (x >= powerUp.x && x <= powerUp.x + 40 && y >= powerUp.y && y <= powerUp.y + 40) {
          collectPowerUp(powerUp.id);
        }
      });

      dropBlock();
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleClick);
    };
  }, [gameStarted, gameOver, dropBlock, collectPowerUp, powerUps]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(120);
    setWinner('');
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setTimeLeft(120);
    setWinner('');
    setCurrentBlock({ x: CANVAS_WIDTH / 2 - BASE_BLOCK_WIDTH / 2, width: BASE_BLOCK_WIDTH, speed: 3, direction: 1 });
    setCamera({ y: 0, shake: 0 });
    setPowerUps([]);
    setParticles([]);
    setEffects({ slowTime: false, perfectGuide: false, freezeOpponent: false });

    // Reset players
    setPlayers(prev => prev.map(p => ({
      ...p,
      score: 0,
      blocks: 1,
      perfectDrops: 0,
      combo: 0,
      powerUps: [],
      tower: [{ width: BASE_BLOCK_WIDTH, height: BLOCK_HEIGHT, x: CANVAS_WIDTH / 2 - BASE_BLOCK_WIDTH / 2 }]
    })));
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>🏗️ Enhanced Stack Tower Battle</h2>
        <div style={statsStyle}>
          <div>Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
          <div>FPS: {fps}</div>
          <div>Room: {roomCode}</div>
        </div>
      </div>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>🎮 Ready to Build?</h3>
          <p>Stack blocks perfectly to score bonus points!</p>
          <p>Collect power-ups for special abilities!</p>
          <button onClick={startGame} style={buttonStyle}>🏗️ Start Building!</button>
        </div>
      ) : (
        <>
          <div style={gameInfoStyle}>
            <div style={statsStyle}>
              <span>🏗️ Height: {players.find(p => p.id === player)?.tower.length || 0}</span>
              <span>⭐ Score: {players.find(p => p.id === player)?.score || 0}</span>
              <span>🎯 Perfect: {players.find(p => p.id === player)?.perfectDrops || 0}</span>
              <span>🔥 Combo: x{players.find(p => p.id === player)?.combo || 0}</span>
              <span>🏆 Best: {highScore}</span>
            </div>
          </div>

          <div style={gameAreaStyle}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={canvasStyle}
              onClick={() => gameStarted && !gameOver && currentBlock && dropBlock()}
            />
          </div>

          {isMobile && (
            <div style={mobileControlsStyle}>
              <button
                style={mobileDropButtonStyle}
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (gameStarted && !gameOver && currentBlock) {
                    dropBlock();
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (gameStarted && !gameOver && currentBlock) {
                    dropBlock();
                  }
                }}
              >
                📦 DROP BLOCK
              </button>
            </div>
          )}
        </>
      )}

      {gameOver && (
        <div style={gameOverStyle}>
          <h3>🏆 Game Complete!</h3>
          <p>Winner: {winner}</p>
          <div style={finalScoresStyle}>
            {players.map(p => (
              <div key={p.id}>
                {p.name}: {p.score} points ({p.blocks} blocks, {p.perfectDrops} perfect)
              </div>
            ))}
          </div>
          <button onClick={resetGame} style={buttonStyle}>Play Again</button>
        </div>
      )}
    </div>
  );
};

const darkenColor = (color: string, factor: number) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

  const lightenColor = (color: string, factor: number) => {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + (255 * factor));
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + (255 * factor));
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + (255 * factor));
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  };

// Enhanced styles with modern design
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  minHeight: '100vh',
  color: 'white',
  fontFamily: 'Arial, sans-serif'
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
  background: 'rgba(0,0,0,0.3)',
  padding: '15px',
  borderRadius: '10px',
  backdropFilter: 'blur(10px)'
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
  marginTop: '10px',
  fontSize: '14px'
};

const menuStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'rgba(0,0,0,0.5)',
  padding: '30px',
  borderRadius: '15px',
  backdropFilter: 'blur(20px)'
};

const gameInfoStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '800px',
  marginBottom: '20px',
  padding: '10px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '10px',
  backdropFilter: 'blur(10px)'
};


const gameAreaStyle: React.CSSProperties = {
  position: 'relative',
  marginBottom: '20px'
};

const canvasStyle: React.CSSProperties = {
  border: '3px solid rgba(255,255,255,0.3)',
  borderRadius: '10px',
  background: 'rgba(0,0,0,0.2)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
};

const effectsStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  left: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px'
};

const effectBadge: React.CSSProperties = {
  background: 'rgba(0,255,0,0.8)',
  color: 'white',
  padding: '5px 10px',
  borderRadius: '15px',
  fontSize: '12px',
  fontWeight: 'bold',
  boxShadow: '0 2px 10px rgba(0,255,0,0.3)'
};

const scoreboardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px',
  marginBottom: '20px',
  width: '100%',
  maxWidth: '800px'
};

const playerStatStyle: React.CSSProperties = {
  padding: '15px',
  borderRadius: '10px',
  textAlign: 'center',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)'
};

const playerNameStyle: React.CSSProperties = {
  fontWeight: 'bold',
  marginBottom: '8px',
  fontSize: '16px'
};

const controlsStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'rgba(0,0,0,0.3)',
  padding: '15px',
  borderRadius: '10px',
  marginBottom: '20px'
};

const gameOverStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'rgba(0,0,0,0.8)',
  padding: '30px',
  borderRadius: '15px',
  backdropFilter: 'blur(20px)',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 1000
};

const finalScoresStyle: React.CSSProperties = {
  margin: '20px 0',
  fontSize: '16px'
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: '16px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
};

const retryButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  borderRadius: "12px",
  background: "#FF6B35",
  color: "#fff",
  border: "none",
  fontSize: "1.1rem",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "all 0.3s ease",
  textShadow: "0 1px 2px rgba(0,0,0,0.3)"
};

const mobileControlsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "20px",
  padding: "20px",
  background: "rgba(0,0,0,0.3)",
  borderRadius: "15px 15px 0 0",
  backdropFilter: "blur(10px)"
};

const mobileDropButtonStyle: React.CSSProperties = {
  padding: "20px 40px",
  borderRadius: "20px",
  background: "linear-gradient(45deg, #FF6B35, #FF8E53)",
  color: "#fff",
  border: "3px solid #fff",
  fontSize: "1.4rem",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "all 0.3s ease",
  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
  boxShadow: "0 6px 20px rgba(255, 107, 53, 0.4)",
  userSelect: "none",
  touchAction: "manipulation"
};

export default StackTower;