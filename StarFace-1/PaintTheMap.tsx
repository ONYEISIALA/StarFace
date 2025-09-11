import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  score: number;
  speed: number;
  paintRadius: number;
  trail: { x: number; y: number; time: number }[];
  powerUps: string[];
  kills: number;
  territories: number;
  paintEfficiency: number;
}

interface PowerUp {
  id: string;
  type: 'speed_boost' | 'large_brush' | 'paint_bomb' | 'teleport' | 'shield' | 'territory_claim';
  x: number;
  y: number;
  duration: number;
  animation: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  type: 'paint' | 'spark' | 'territory';
}

interface Territory {
  id: string;
  owner: string;
  centerX: number;
  centerY: number;
  radius: number;
  color: string;
  bonus: number;
}

const PaintTheMap: React.FC<{ roomCode: string; player: string }> = ({ roomCode, player }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [paintedTiles, setPaintedTiles] = useState<Record<string, string>>({});
  const [players, setPlayers] = useState<Player[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [winner, setWinner] = useState<string>('');
  const [effects, setEffects] = useState({
    speedBoost: false,
    largeBrush: false,
    shield: false,
    territoryMode: false
  });
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1, shake: 0 });
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [fps, setFps] = useState(60);

  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 800;
  const GRID_SIZE = 8;
  const COLS = Math.floor(CANVAS_WIDTH / GRID_SIZE);
  const ROWS = Math.floor(CANVAS_HEIGHT / GRID_SIZE);

  // Initialize players
  useEffect(() => {
    const playerColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    const spawnPositions = [
      { x: 100, y: 100 },
      { x: CANVAS_WIDTH - 100, y: CANVAS_HEIGHT - 100 },
      { x: 100, y: CANVAS_HEIGHT - 100 },
      { x: CANVAS_WIDTH - 100, y: 100 }
    ];

    const initialPlayers: Player[] = [
      {
        id: player,
        name: `Player ${player}`,
        x: spawnPositions[0].x,
        y: spawnPositions[0].y,
        color: playerColors[0],
        score: 0,
        speed: 3,
        paintRadius: 25,
        trail: [],
        powerUps: [],
        kills: 0,
        territories: 0,
        paintEfficiency: 100
      }
    ];

    // Add opponent
    if (player === 'X') {
      initialPlayers.push({
        id: 'O',
        name: 'Player O',
        x: spawnPositions[1].x,
        y: spawnPositions[1].y,
        color: playerColors[1],
        score: 0,
        speed: 3,
        paintRadius: 25,
        trail: [],
        powerUps: [],
        kills: 0,
        territories: 0,
        paintEfficiency: 100
      });
    }

    setPlayers(initialPlayers);
  }, [player]);

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
          const scores = players.map(p => ({ name: p.name, score: p.score }));
          const highestScore = Math.max(...scores.map(s => s.score));
          const winningPlayer = scores.find(s => s.score === highestScore);
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
      const types: PowerUp['type'][] = ['speed_boost', 'large_brush', 'paint_bomb', 'teleport', 'shield', 'territory_claim'];
      const newPowerUp: PowerUp = {
        id: Date.now().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        x: Math.random() * (CANVAS_WIDTH - 60) + 30,
        y: Math.random() * (CANVAS_HEIGHT - 60) + 30,
        duration: 15000,
        animation: 0
      };
      setPowerUps(prev => [...prev, newPowerUp]);
    };

    const interval = setInterval(spawnPowerUp, 8000);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  // Add particles
  const addParticles = useCallback((x: number, y: number, color: string, type: 'paint' | 'spark' | 'territory' = 'paint', count: number = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color,
        size: Math.random() * 6 + 2,
        type
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

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
          vy: p.vy + 0.1,
          size: p.size * 0.99
        }))
        .filter(p => p.life > 0)
      );
    };

    const interval = setInterval(updateParticles, 16);
    return () => clearInterval(interval);
  }, [particles]);

  // Key event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Move players and paint
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setPlayers(prev => prev.map(p => {
        if (p.id !== player) return p;

        let newX = p.x;
        let newY = p.y;
        const speed = effects.speedBoost ? p.speed * 2 : p.speed;

        // Enhanced WASD and Arrow Key Support
        if (keys['w'] || keys['arrowup']) newY = Math.max(20, p.y - speed);
        if (keys['s'] || keys['arrowdown']) newY = Math.min(CANVAS_HEIGHT - 20, p.y + speed);
        if (keys['a'] || keys['arrowleft']) newX = Math.max(20, p.x - speed);
        if (keys['d'] || keys['arrowright']) newX = Math.min(CANVAS_WIDTH - 20, p.x + speed);

        // Update trail
        const newTrail = [...p.trail, { x: newX, y: newY, time: Date.now() }];
        const filteredTrail = newTrail.filter(t => Date.now() - t.time < 1000);

        return { ...p, x: newX, y: newY, trail: filteredTrail };
      }));

      // Paint tiles around current player
      const currentPlayer = players.find(p => p.id === player);
      if (currentPlayer) {
        const centerX = Math.floor(currentPlayer.x / GRID_SIZE);
        const centerY = Math.floor(currentPlayer.y / GRID_SIZE);
        const radius = Math.floor((effects.largeBrush ? currentPlayer.paintRadius * 1.5 : currentPlayer.paintRadius) / GRID_SIZE);

        setPaintedTiles(prev => {
          const newPainted = { ...prev };
          let paintedCount = 0;

          for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
              const x = centerX + dx;
              const y = centerY + dy;
              if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance <= radius) {
                  const key = `${x},${y}`;
                  if (newPainted[key] !== currentPlayer.color) {
                    newPainted[key] = currentPlayer.color;
                    paintedCount++;
                    if (Math.random() < 0.3) {
                      addParticles(x * GRID_SIZE + GRID_SIZE/2, y * GRID_SIZE + GRID_SIZE/2, currentPlayer.color, 'paint', 1);
                    }
                  }
                }
              }
            }
          }

          // Update player score based on painted tiles
          if (paintedCount > 0) {
            setPlayers(prev => prev.map(p => 
              p.id === player ? { ...p, score: p.score + paintedCount } : p
            ));
          }

          return newPainted;
        });
      }
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, keys, player, players, effects, addParticles]);

  // Update power-ups
  useEffect(() => {
    if (powerUps.length === 0) return;

    const updatePowerUps = () => {
      setPowerUps(prev => prev.map(p => ({
        ...p,
        duration: p.duration - 100,
        animation: p.animation + 0.1
      })).filter(p => p.duration > 0));
    };

    const interval = setInterval(updatePowerUps, 100);
    return () => clearInterval(interval);
  }, [powerUps]);

  // Collect power-up
  const collectPowerUp = useCallback((powerUpId: string) => {
    const powerUp = powerUps.find(p => p.id === powerUpId);
    if (!powerUp) return;

    setPowerUps(prev => prev.filter(p => p.id !== powerUpId));

    switch (powerUp.type) {
      case 'speed_boost':
        setEffects(prev => ({ ...prev, speedBoost: true }));
        setTimeout(() => setEffects(prev => ({ ...prev, speedBoost: false })), 8000);
        break;
      case 'large_brush':
        setEffects(prev => ({ ...prev, largeBrush: true }));
        setTimeout(() => setEffects(prev => ({ ...prev, largeBrush: false })), 10000);
        break;
      case 'paint_bomb':
        const currentPlayer = players.find(p => p.id === player);
        if (currentPlayer) {
          // Paint large area around player
          const centerX = Math.floor(currentPlayer.x / GRID_SIZE);
          const centerY = Math.floor(currentPlayer.y / GRID_SIZE);
          setPaintedTiles(prev => {
            const newPainted = { ...prev };
            for (let dx = -15; dx <= 15; dx++) {
              for (let dy = -15; dy <= 15; dy++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
                  const distance = Math.sqrt(dx*dx + dy*dy);
                  if (distance <= 15) {
                    newPainted[`${x},${y}`] = currentPlayer.color;
                  }
                }
              }
            }
            return newPainted;
          });
          addParticles(currentPlayer.x, currentPlayer.y, currentPlayer.color, 'spark', 20);
          setCamera(prev => ({ ...prev, shake: 15 }));
        }
        break;
      case 'teleport':
        setPlayers(prev => prev.map(p => {
          if (p.id !== player) return p;
          const newX = Math.random() * (CANVAS_WIDTH - 40) + 20;
          const newY = Math.random() * (CANVAS_HEIGHT - 40) + 20;
          addParticles(p.x, p.y, '#00FFFF', 'spark', 10);
          addParticles(newX, newY, '#00FFFF', 'spark', 10);
          return { ...p, x: newX, y: newY };
        }));
        break;
      case 'shield':
        setEffects(prev => ({ ...prev, shield: true }));
        setTimeout(() => setEffects(prev => ({ ...prev, shield: false })), 12000);
        break;
      case 'territory_claim':
        const player_obj = players.find(p => p.id === player);
        if (player_obj) {
          const newTerritory: Territory = {
            id: Date.now().toString(),
            owner: player,
            centerX: player_obj.x,
            centerY: player_obj.y,
            radius: 80,
            color: player_obj.color,
            bonus: 2
          };
          setTerritories(prev => [...prev, newTerritory]);
          addParticles(player_obj.x, player_obj.y, player_obj.color, 'territory', 15);
        }
        break;
    }

    addParticles(powerUp.x, powerUp.y, '#00FF00', 'spark', 8);
  }, [powerUps, players, player, addParticles]);

  // Check territory bonuses
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const checkTerritories = () => {
      const currentPlayer = players.find(p => p.id === player);
      if (!currentPlayer) return;

      territories.forEach(territory => {
        const distance = Math.sqrt(
          Math.pow(currentPlayer.x - territory.centerX, 2) + 
          Math.pow(currentPlayer.y - territory.centerY, 2)
        );

        if (distance <= territory.radius && territory.owner === player) {
          // Bonus points for being in own territory
          setPlayers(prev => prev.map(p => 
            p.id === player ? { ...p, score: p.score + territory.bonus } : p
          ));
        }
      });
    };

    const interval = setInterval(checkTerritories, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, players, territories, player]);

  // Render game
  const render = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updateFPS(currentTime);

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply camera shake
    ctx.save();
    ctx.translate(
      Math.random() * camera.shake - camera.shake/2,
      Math.random() * camera.shake - camera.shake/2
    );

    // Draw grid background
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE * 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE * 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw painted tiles with improved rendering
    Object.entries(paintedTiles).forEach(([key, color]) => {
      const [x, y] = key.split(',').map(Number);
      const pixelX = x * GRID_SIZE;
      const pixelY = y * GRID_SIZE;

      // Tile gradient
      const tileGradient = ctx.createRadialGradient(
        pixelX + GRID_SIZE/2, pixelY + GRID_SIZE/2, 0,
        pixelX + GRID_SIZE/2, pixelY + GRID_SIZE/2, GRID_SIZE
      );
      tileGradient.addColorStop(0, color);
      tileGradient.addColorStop(1, color + '80');

      ctx.fillStyle = tileGradient;
      ctx.fillRect(pixelX, pixelY, GRID_SIZE, GRID_SIZE);

      // Tile border
      ctx.strokeStyle = color + '40';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(pixelX, pixelY, GRID_SIZE, GRID_SIZE);
    });

    // Draw territories
    territories.forEach(territory => {
      ctx.save();
      ctx.globalAlpha = 0.3;
      const territoryGradient = ctx.createRadialGradient(
        territory.centerX, territory.centerY, 0,
        territory.centerX, territory.centerY, territory.radius
      );
      territoryGradient.addColorStop(0, territory.color + '60');
      territoryGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = territoryGradient;
      ctx.beginPath();
      ctx.arc(territory.centerX, territory.centerY, territory.radius, 0, Math.PI * 2);
      ctx.fill();

      // Territory border
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = territory.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Territory label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`+${territory.bonus}/s`, territory.centerX, territory.centerY);
    });

    // Draw player trails
    players.forEach(p => {
      if (p.trail.length < 2) return;

      ctx.strokeStyle = p.color + '60';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      p.trail.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    // Draw players with enhanced graphics
    players.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);

      // Player shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(3, 3, 20, 0, Math.PI * 2);
      ctx.fill();

      // Shield effect
      if (p.id === player && effects.shield) {
        const shieldGradient = ctx.createRadialGradient(0, 0, 15, 0, 0, 30);
        shieldGradient.addColorStop(0, 'rgba(0,255,255,0.5)');
        shieldGradient.addColorStop(1, 'rgba(0,255,255,0)');
        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player body
      const playerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      playerGradient.addColorStop(0, p.color);
      playerGradient.addColorStop(1, p.color + '80');
      ctx.fillStyle = playerGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      // Player border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Paint radius indicator
      if (p.id === player) {
        ctx.strokeStyle = p.color + '40';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const radius = effects.largeBrush ? p.paintRadius * 1.5 : p.paintRadius;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Player name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, 0, -35);

      // Speed effect
      if (p.id === player && effects.speedBoost) {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, 25 + i * 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();
    });

    // Draw power-ups with animations
    powerUps.forEach(powerUp => {
      const pulse = Math.sin(powerUp.animation) * 0.3 + 0.7;
      const alpha = Math.min(1, powerUp.duration / 5000);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(powerUp.x, powerUp.y);
      ctx.scale(pulse, pulse);

      // Power-up glow
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      glowGradient.addColorStop(0, '#00FF0080');
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(-30, -30, 60, 60);

      // Power-up icon
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(-20, -20, 40, 40);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const icons = {
        speed_boost: '⚡',
        large_brush: '🖌️',
        paint_bomb: '💣',
        teleport: '🌀',
        shield: '🛡️',
        territory_claim: '🏴'
      };

      ctx.fillText(icons[powerUp.type], 0, 0);
      ctx.restore();
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.translate(particle.x, particle.y);

      if (particle.type === 'territory') {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          const x = Math.cos(angle) * particle.size;
          const y = Math.sin(angle) * particle.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
      }

      ctx.restore();
    });

    ctx.restore();

    // Reduce camera shake
    if (camera.shake > 0) {
      setCamera(prev => ({ ...prev, shake: prev.shake * 0.9 }));
    }

    animationRef.current = requestAnimationFrame(render);
  }, [paintedTiles, players, powerUps, particles, territories, camera, effects, updateFPS]);

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

  // Check power-up collection
  useEffect(() => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer) return;

    powerUps.forEach(powerUp => {
      const distance = Math.sqrt(
        Math.pow(currentPlayer.x - powerUp.x, 2) + 
        Math.pow(currentPlayer.y - powerUp.y, 2)
      );

      if (distance < 30) {
        collectPowerUp(powerUp.id);
      }
    });
  }, [players, powerUps, player, collectPowerUp]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setTimeLeft(180);
    setWinner('');
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setTimeLeft(180);
    setWinner('');
    setPaintedTiles({});
    setPowerUps([]);
    setParticles([]);
    setTerritories([]);
    setCamera({ x: 0, y: 0, zoom: 1, shake: 0 });
    setEffects({
      speedBoost: false,
      largeBrush: false,
      shield: false,
      territoryMode: false
    });

    // Reset players
    const spawnPositions = [
      { x: 100, y: 100 },
      { x: CANVAS_WIDTH - 100, y: CANVAS_HEIGHT - 100 }
    ];

    setPlayers(prev => prev.map((p, index) => ({
      ...p,
      x: spawnPositions[index].x,
      y: spawnPositions[index].y,
      score: 0,
      trail: [],
      powerUps: [],
      kills: 0,
      territories: 0,
      paintEfficiency: 100
    })));
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>🎨 Enhanced Paint the Map Battle</h2>
        <div style={statsStyle}>
          <div>Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
          <div>FPS: {fps}</div>
          <div>Room: {roomCode}</div>
        </div>
      </div>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>🎮 Ready to Paint?</h3>
          <p>Move with WASD to paint the map with your color!</p>
          <p>Collect power-ups for special abilities!</p>
          <p>Claim territories for bonus points!</p>
          <button onClick={startGame} style={buttonStyle}>Start Painting!</button>
        </div>
      ) : (
        <>
          <div style={gameAreaStyle}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={canvasStyle}
            />

            {/* Active effects display */}
            {Object.entries(effects).some(([_, active]) => active) && (
              <div style={effectsStyle}>
                {effects.speedBoost && <div style={effectBadge}>⚡ SPEED BOOST</div>}
                {effects.largeBrush && <div style={effectBadge}>🖌️ LARGE BRUSH</div>}
                {effects.shield && <div style={effectBadge}>🛡️ SHIELD</div>}
              </div>
            )}
          </div>

          <div style={scoreboardStyle}>
            {players.map(p => {
              const paintedCount = Object.values(paintedTiles).filter(color => color === p.color).length;
              const percentage = ((paintedCount / (COLS * ROWS)) * 100).toFixed(1);

              return (
                <div key={p.id} style={{
                  ...playerStatStyle,
                  backgroundColor: p.id === player ? p.color + '40' : p.color + '20'
                }}>
                  <div style={playerNameStyle}>{p.name} {p.id === player && '(You)'}</div>
                  <div>Score: {p.score}</div>
                  <div>Territory: {percentage}%</div>
                  <div>Territories: {p.territories}</div>
                </div>
              );
            })}
          </div>

          <div style={controlsStyle}>
            <p>Use WASD or Arrow Keys to move and paint tiles!</p>
            <p>Walk over power-ups to collect them!</p>
            <p>Stay in your territories for bonus points!</p>
          </div>
        </>
      )}

      {gameOver && (
        <div style={gameOverStyle}>
          <h3>🏆 Game Complete!</h3>
          <p>Winner: {winner}</p>
          <div style={finalScoresStyle}>
            {players.map(p => {
              const paintedCount = Object.values(paintedTiles).filter(color => color === p.color).length;
              const percentage = ((paintedCount / (COLS * ROWS)) * 100).toFixed(1);

              return (
                <div key={p.id}>
                  {p.name}: {p.score} points ({percentage}% territory)
                </div>
              );
            })}
          </div>
          <button onClick={resetGame} style={buttonStyle}>Play Again</button>
        </div>
      )}
    </div>
  );
};

// Enhanced styles
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

export default PaintTheMap;