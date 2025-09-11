
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  isAlive: boolean;
  hasBomb: boolean;
  powerUps: string[];
  score: number;
  eliminations: number;
  survivalTime: number;
  speed: number;
  size: number;
  shield: boolean;
  freeze: boolean;
  invisible: boolean;
  bombCount: number;
  kills: number;
  style: 'classic' | 'ninja' | 'robot' | 'alien';
}

interface Bomb {
  id: string;
  x: number;
  y: number;
  timeLeft: number;
  explosionRadius: number;
  type: 'standard' | 'mega' | 'cluster' | 'sticky' | 'remote';
  armed: boolean;
  blinkRate: number;
  carrier: string | null;
  bounceCount: number;
  velocity: { x: number; y: number };
  trail: { x: number; y: number; life: number }[];
}

interface PowerUp {
  id: string;
  type: 'speed' | 'shield' | 'freeze' | 'invisible' | 'defuse' | 'extra_bomb' | 'mega_bomb' | 'teleport';
  x: number;
  y: number;
  duration: number;
  animation: number;
  rarity: 'common' | 'rare' | 'legendary';
}

interface Explosion {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  particles: Particle[];
  shockwave: boolean;
  type: string;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'spark' | 'smoke' | 'debris' | 'fire';
}

interface GameMode {
  name: string;
  description: string;
  bombTimer: number;
  maxPlayers: number;
  powerUpSpawnRate: number;
  specialRules: string[];
}

const BombPass: React.FC<{ roomCode: string; player: string }> = ({ roomCode, player }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [gameMode, setGameMode] = useState<GameMode>({
    name: 'Classic',
    description: 'Pass the bomb before it explodes!',
    bombTimer: 15000,
    maxPlayers: 8,
    powerUpSpawnRate: 5000,
    specialRules: ['One bomb active', 'Last survivor wins']
  });
  const [winner, setWinner] = useState<string>('');
  const [round, setRound] = useState(1);
  const [roundTime, setRoundTime] = useState(0);
  const [camera, setCamera] = useState({ x: 400, y: 300, shake: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [fps, setFps] = useState(60);
  const [showMobileControls, setShowMobileControls] = useState(false);

  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 700;
  const PLAYER_SIZE = 30;
  const BOMB_SIZE = 25;
  const MOVE_SPEED = 4;

  const GAME_MODES: GameMode[] = [
    {
      name: 'Classic',
      description: 'Pass the bomb before it explodes!',
      bombTimer: 15000,
      maxPlayers: 8,
      powerUpSpawnRate: 5000,
      specialRules: ['One bomb active', 'Last survivor wins']
    },
    {
      name: 'Multi-Bomb Mayhem',
      description: 'Multiple bombs in play!',
      bombTimer: 12000,
      maxPlayers: 12,
      powerUpSpawnRate: 3000,
      specialRules: ['Multiple bombs', 'Faster pace', 'Chain explosions']
    },
    {
      name: 'Speed Demon',
      description: 'Fast-paced bomb passing!',
      bombTimer: 8000,
      maxPlayers: 6,
      powerUpSpawnRate: 2000,
      specialRules: ['Super fast bombs', 'Double speed', 'Quick reflexes needed']
    },
    {
      name: 'Cluster Chaos',
      description: 'Bombs split into smaller bombs!',
      bombTimer: 20000,
      maxPlayers: 10,
      powerUpSpawnRate: 4000,
      specialRules: ['Cluster bombs', 'Chain reactions', 'Area denial']
    }
  ];

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       window.innerWidth <= 768;
      setShowMobileControls(isMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize players
  useEffect(() => {
    const playerColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    const playerNames = ['Bomber', 'Blaster', 'Explosive', 'Dynamite', 'Firecracker', 'Sparkler', 'Rocket', 'Cannon'];
    const styles: Player['style'][] = ['classic', 'ninja', 'robot', 'alien'];
    
    const playerCount = Math.min(gameMode.maxPlayers, 8);
    const initialPlayers: Player[] = [];

    for (let i = 0; i < playerCount; i++) {
      const isMainPlayer = i === 0;
      const playerId = isMainPlayer ? player : `bot_${i}`;
      
      initialPlayers.push({
        id: playerId,
        name: isMainPlayer ? `Player ${player}` : playerNames[i % playerNames.length],
        x: 100 + (i % 4) * 200,
        y: 100 + Math.floor(i / 4) * 200,
        color: playerColors[i % playerColors.length],
        isAlive: true,
        hasBomb: i === 0,
        powerUps: [],
        score: 0,
        eliminations: 0,
        survivalTime: 0,
        speed: MOVE_SPEED,
        size: PLAYER_SIZE,
        shield: false,
        freeze: false,
        invisible: false,
        bombCount: 0,
        kills: 0,
        style: styles[i % styles.length]
      });
    }

    setPlayers(initialPlayers);

    // Create initial bomb
    if (initialPlayers.length > 0) {
      const initialBomb: Bomb = {
        id: 'initial_bomb',
        x: initialPlayers[0].x,
        y: initialPlayers[0].y,
        timeLeft: gameMode.bombTimer,
        explosionRadius: 80,
        type: 'standard',
        armed: true,
        blinkRate: 1,
        carrier: initialPlayers[0].id,
        bounceCount: 0,
        velocity: { x: 0, y: 0 },
        trail: []
      };
      setBombs([initialBomb]);
    }
  }, [player, gameMode]);

  // FPS tracking
  const updateFPS = useCallback((currentTime: number) => {
    if (lastFrameTime > 0) {
      const deltaTime = currentTime - lastFrameTime;
      const currentFPS = 1000 / deltaTime;
      setFps(Math.round(currentFPS));
    }
    setLastFrameTime(currentTime);
  }, [lastFrameTime]);

  // Add particles
  const addParticles = useCallback((x: number, y: number, count: number, type: Particle['type'] = 'spark', color: string = '#FF6B00') => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 8 + 3,
        type
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Game timers
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setRoundTime(prev => prev + 1);

      // Update bomb timers
      setBombs(prev => prev.map(bomb => ({
        ...bomb,
        timeLeft: bomb.timeLeft - 100,
        blinkRate: bomb.timeLeft < 3000 ? 0.1 : bomb.timeLeft < 5000 ? 0.3 : 1,
        trail: [
          { x: bomb.x, y: bomb.y, life: 1 },
          ...bomb.trail.map(t => ({ ...t, life: t.life - 0.1 })).filter(t => t.life > 0).slice(0, 10)
        ]
      })));

      // Update explosions
      setExplosions(prev => prev.map(exp => ({
        ...exp,
        radius: Math.min(exp.maxRadius, exp.radius + 3),
        life: exp.life - 0.05,
        particles: exp.particles.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02,
          vy: p.vy + 0.3
        })).filter(p => p.life > 0)
      })).filter(exp => exp.life > 0));

      // Update particles
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - 0.02,
        vy: p.vy + 0.2
      })).filter(p => p.life > 0));

      // Update power-ups
      setPowerUps(prev => prev.map(p => ({
        ...p,
        duration: p.duration - 100,
        animation: p.animation + 0.1
      })).filter(p => p.duration > 0));

      // Update player power-up effects
      setPlayers(prev => prev.map(p => ({
        ...p,
        survivalTime: p.isAlive ? p.survivalTime + 0.1 : p.survivalTime,
        // Remove expired power-ups
        powerUps: p.powerUps // Power-ups are managed separately
      })));
    }, 100);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  // Bomb explosion check
  useEffect(() => {
    bombs.forEach(bomb => {
      if (bomb.timeLeft <= 0 && bomb.armed) {
        explodeBomb(bomb);
      }
    });
  }, [bombs]);

  // Explode bomb
  const explodeBomb = useCallback((bomb: Bomb) => {
    // Create explosion
    const explosion: Explosion = {
      id: bomb.id + '_explosion',
      x: bomb.x,
      y: bomb.y,
      radius: 0,
      maxRadius: bomb.explosionRadius,
      life: 1,
      particles: [],
      shockwave: true,
      type: bomb.type
    };

    // Add explosion particles
    const explosionParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      explosionParticles.push({
        id: Math.random().toString(),
        x: bomb.x,
        y: bomb.y,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 1,
        maxLife: 1,
        color: ['#FF4444', '#FF8800', '#FFAA00', '#FFFF00'][Math.floor(Math.random() * 4)],
        size: Math.random() * 12 + 5,
        type: Math.random() < 0.3 ? 'fire' : 'spark'
      });
    }
    explosion.particles = explosionParticles;

    setExplosions(prev => [...prev, explosion]);
    addParticles(bomb.x, bomb.y, 50, 'fire', '#FF4444');
    setCamera(prev => ({ ...prev, shake: 20 }));

    // Check for player eliminations
    setPlayers(prev => prev.map(p => {
      if (!p.isAlive) return p;
      
      const distance = Math.sqrt(Math.pow(p.x - bomb.x, 2) + Math.pow(p.y - bomb.y, 2));
      if (distance < bomb.explosionRadius && !p.shield) {
        return { ...p, isAlive: false, hasBomb: false };
      }
      return p;
    }));

    // Handle cluster bombs
    if (bomb.type === 'cluster') {
      setTimeout(() => {
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const clusterBomb: Bomb = {
            id: `cluster_${bomb.id}_${i}`,
            x: bomb.x + Math.cos(angle) * 60,
            y: bomb.y + Math.sin(angle) * 60,
            timeLeft: 3000,
            explosionRadius: 40,
            type: 'standard',
            armed: true,
            blinkRate: 0.2,
            carrier: null,
            bounceCount: 0,
            velocity: { x: 0, y: 0 },
            trail: []
          };
          setBombs(prev => [...prev, clusterBomb]);
        }
      }, 500);
    }

    // Remove the exploded bomb
    setBombs(prev => prev.filter(b => b.id !== bomb.id));

    // Spawn new bomb if needed
    if (gameMode.name === 'Multi-Bomb Mayhem' && Math.random() < 0.7) {
      setTimeout(spawnNewBomb, 2000);
    } else if (gameMode.name !== 'Multi-Bomb Mayhem') {
      setTimeout(spawnNewBomb, 3000);
    }
  }, [gameMode, addParticles]);

  // Spawn new bomb
  const spawnNewBomb = useCallback(() => {
    const alivePlayers = players.filter(p => p.isAlive);
    if (alivePlayers.length > 1) {
      const randomPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      const newBomb: Bomb = {
        id: Date.now().toString(),
        x: randomPlayer.x,
        y: randomPlayer.y,
        timeLeft: gameMode.bombTimer,
        explosionRadius: 80,
        type: Math.random() < 0.1 ? 'cluster' : Math.random() < 0.05 ? 'mega' : 'standard',
        armed: true,
        blinkRate: 1,
        carrier: randomPlayer.id,
        bounceCount: 0,
        velocity: { x: 0, y: 0 },
        trail: []
      };
      
      setBombs(prev => [...prev, newBomb]);
      setPlayers(prev => prev.map(p => 
        p.id === randomPlayer.id ? { ...p, hasBomb: true } : p
      ));
    }
  }, [players, gameMode]);

  // Spawn power-ups
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnPowerUp = () => {
      const types: PowerUp['type'][] = ['speed', 'shield', 'freeze', 'invisible', 'defuse', 'extra_bomb', 'mega_bomb', 'teleport'];
      const rarities: PowerUp['rarity'][] = ['common', 'common', 'common', 'rare', 'rare', 'legendary'];
      
      const newPowerUp: PowerUp = {
        id: Date.now().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        x: Math.random() * (CANVAS_WIDTH - 60) + 30,
        y: Math.random() * (CANVAS_HEIGHT - 60) + 30,
        duration: 15000,
        animation: 0,
        rarity: rarities[Math.floor(Math.random() * rarities.length)]
      };
      setPowerUps(prev => [...prev, newPowerUp]);
    };

    const interval = setInterval(spawnPowerUp, gameMode.powerUpSpawnRate);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, gameMode]);

  // Bot AI
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const botBehavior = () => {
      setPlayers(prev => prev.map(p => {
        if (p.id === player || !p.isAlive || p.freeze) return p;

        // Bot movement logic
        let newX = p.x;
        let newY = p.y;
        
        // If bot has bomb, try to pass it
        if (p.hasBomb) {
          const nearbyPlayers = prev.filter(other => 
            other.id !== p.id && 
            other.isAlive &&
            Math.sqrt(Math.pow(other.x - p.x, 2) + Math.pow(other.y - p.y, 2)) < 60
          );
          
          if (nearbyPlayers.length > 0) {
            const target = nearbyPlayers[0];
            const dx = target.x - p.x;
            const dy = target.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 50) {
              // Pass bomb
              setBombs(prevBombs => prevBombs.map(bomb => 
                bomb.carrier === p.id ? { ...bomb, carrier: target.id } : bomb
              ));
              
              setPlayers(prevPlayers => prevPlayers.map(pl => {
                if (pl.id === p.id) return { ...pl, hasBomb: false };
                if (pl.id === target.id) return { ...pl, hasBomb: true };
                return pl;
              }));
              
              addParticles(p.x, p.y, 5, 'spark', '#00FF00');
            } else {
              // Move towards target
              newX = p.x + (dx / distance) * p.speed;
              newY = p.y + (dy / distance) * p.speed;
            }
          } else {
            // Random movement if no nearby players
            newX = p.x + (Math.random() - 0.5) * p.speed * 2;
            newY = p.y + (Math.random() - 0.5) * p.speed * 2;
          }
        } else {
          // If bot doesn't have bomb, avoid bomb carriers
          const bombCarriers = prev.filter(other => other.hasBomb && other.isAlive);
          
          if (bombCarriers.length > 0) {
            const nearest = bombCarriers.reduce((closest, current) => {
              const currentDist = Math.sqrt(Math.pow(current.x - p.x, 2) + Math.pow(current.y - p.y, 2));
              const closestDist = Math.sqrt(Math.pow(closest.x - p.x, 2) + Math.pow(closest.y - p.y, 2));
              return currentDist < closestDist ? current : closest;
            });
            
            const dx = p.x - nearest.x;
            const dy = p.y - nearest.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
              // Move away from bomb carrier
              newX = p.x + (dx / distance) * p.speed;
              newY = p.y + (dy / distance) * p.speed;
            }
          }
          
          // Move towards power-ups occasionally
          if (Math.random() < 0.1 && powerUps.length > 0) {
            const nearestPowerUp = powerUps.reduce((closest, current) => {
              const currentDist = Math.sqrt(Math.pow(current.x - p.x, 2) + Math.pow(current.y - p.y, 2));
              const closestDist = Math.sqrt(Math.pow(closest.x - p.x, 2) + Math.pow(closest.y - p.y, 2));
              return currentDist < closestDist ? current : closest;
            });
            
            const dx = nearestPowerUp.x - p.x;
            const dy = nearestPowerUp.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            newX = p.x + (dx / distance) * p.speed * 0.5;
            newY = p.y + (dy / distance) * p.speed * 0.5;
          }
        }

        // Keep within bounds
        newX = Math.max(p.size, Math.min(CANVAS_WIDTH - p.size, newX));
        newY = Math.max(p.size, Math.min(CANVAS_HEIGHT - p.size, newY));

        return { ...p, x: newX, y: newY };
      }));
    };

    const interval = setInterval(botBehavior, 100);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, player, powerUps, addParticles]);

  // Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
      
      // Pass bomb
      if (e.key.toLowerCase() === ' ' || e.key.toLowerCase() === 'spacebar') {
        passBomb();
      }
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

  // Player movement
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const movePlayer = () => {
      setPlayers(prev => prev.map(p => {
        if (p.id !== player || !p.isAlive || p.freeze) return p;

        let newX = p.x;
        let newY = p.y;

        // WASD and Arrow Key Support
        if (keys['a'] || keys['arrowleft']) newX = Math.max(p.size, p.x - p.speed);
        if (keys['d'] || keys['arrowright']) newX = Math.min(CANVAS_WIDTH - p.size, p.x + p.speed);
        if (keys['w'] || keys['arrowup']) newY = Math.max(p.size, p.y - p.speed);
        if (keys['s'] || keys['arrowdown']) newY = Math.min(CANVAS_HEIGHT - p.size, p.y + p.speed);

        // Update bomb position if carrying
        if (p.hasBomb) {
          setBombs(prevBombs => prevBombs.map(bomb => 
            bomb.carrier === p.id ? { ...bomb, x: newX, y: newY } : bomb
          ));
        }

        return { ...p, x: newX, y: newY };
      }));
    };

    const interval = setInterval(movePlayer, 16);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, keys, player]);

  // Pass bomb function
  const passBomb = useCallback(() => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || !currentPlayer.hasBomb) return;

    const nearbyPlayers = players.filter(p => 
      p.id !== player && 
      p.isAlive &&
      Math.sqrt(Math.pow(p.x - currentPlayer.x, 2) + Math.pow(p.y - currentPlayer.y, 2)) < 80
    );

    if (nearbyPlayers.length > 0) {
      const target = nearbyPlayers[0];
      
      setBombs(prev => prev.map(bomb => 
        bomb.carrier === player ? { ...bomb, carrier: target.id } : bomb
      ));
      
      setPlayers(prev => prev.map(p => {
        if (p.id === player) return { ...p, hasBomb: false };
        if (p.id === target.id) return { ...p, hasBomb: true };
        return p;
      }));
      
      addParticles(currentPlayer.x, currentPlayer.y, 8, 'spark', '#00FF00');
    }
  }, [players, player, addParticles]);

  // Power-up collection
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const checkPowerUpCollection = () => {
      const currentPlayer = players.find(p => p.id === player);
      if (!currentPlayer || !currentPlayer.isAlive) return;

      powerUps.forEach(powerUp => {
        const distance = Math.sqrt(
          Math.pow(powerUp.x - currentPlayer.x, 2) + 
          Math.pow(powerUp.y - currentPlayer.y, 2)
        );

        if (distance < 40) {
          collectPowerUp(powerUp.id, powerUp.type);
        }
      });
    };

    const interval = setInterval(checkPowerUpCollection, 50);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, players, powerUps, player]);

  // Collect power-up
  const collectPowerUp = useCallback((powerUpId: string, type: PowerUp['type']) => {
    setPowerUps(prev => prev.filter(p => p.id !== powerUpId));
    
    switch (type) {
      case 'speed':
        setPlayers(prev => prev.map(p => {
          if (p.id !== player) return p;
          return { ...p, speed: p.speed * 1.5, powerUps: [...p.powerUps, 'speed'] };
        }));
        setTimeout(() => {
          setPlayers(prev => prev.map(p => ({
            ...p,
            speed: MOVE_SPEED,
            powerUps: p.powerUps.filter(pu => pu !== 'speed')
          })));
        }, 10000);
        break;
      case 'shield':
        setPlayers(prev => prev.map(p => {
          if (p.id !== player) return p;
          return { ...p, shield: true, powerUps: [...p.powerUps, 'shield'] };
        }));
        setTimeout(() => {
          setPlayers(prev => prev.map(p => ({
            ...p,
            shield: false,
            powerUps: p.powerUps.filter(pu => pu !== 'shield')
          })));
        }, 8000);
        break;
      case 'teleport':
        setPlayers(prev => prev.map(p => {
          if (p.id !== player) return p;
          const newX = Math.random() * (CANVAS_WIDTH - 60) + 30;
          const newY = Math.random() * (CANVAS_HEIGHT - 60) + 30;
          addParticles(p.x, p.y, 10, 'spark', '#00FFFF');
          addParticles(newX, newY, 10, 'spark', '#00FFFF');
          return { ...p, x: newX, y: newY };
        }));
        break;
      case 'defuse':
        setBombs(prev => prev.map(bomb => ({
          ...bomb,
          timeLeft: bomb.timeLeft + 5000
        })));
        addParticles(currentPlayer?.x || 0, currentPlayer?.y || 0, 15, 'spark', '#00FF00');
        break;
    }
    
    const currentPlayer = players.find(p => p.id === player);
    addParticles(currentPlayer?.x || 0, currentPlayer?.y || 0, 12, 'spark', '#FFD700');
  }, [player, players, addParticles]);

  // Win condition check
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const alivePlayers = players.filter(p => p.isAlive);
    if (alivePlayers.length <= 1) {
      setGameOver(true);
      if (alivePlayers.length === 1) {
        setWinner(alivePlayers[0].name + ' Wins!');
        setPlayers(prev => prev.map(p => 
          p.id === alivePlayers[0].id ? { ...p, score: p.score + 100 } : p
        ));
      } else {
        setWinner('Draw - Everyone Eliminated!');
      }
    }
  }, [players, gameStarted, gameOver]);

  // Render game
  const render = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updateFPS(currentTime);

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#2C3E50');
    gradient.addColorStop(1, '#34495E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply camera shake
    ctx.save();
    ctx.translate(
      Math.random() * camera.shake - camera.shake/2,
      Math.random() * camera.shake - camera.shake/2
    );

    // Draw grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw explosions
    explosions.forEach(explosion => {
      // Explosion shockwave
      const shockwaveGradient = ctx.createRadialGradient(
        explosion.x, explosion.y, 0,
        explosion.x, explosion.y, explosion.radius
      );
      shockwaveGradient.addColorStop(0, `rgba(255,100,0,${explosion.life})`);
      shockwaveGradient.addColorStop(0.7, `rgba(255,200,0,${explosion.life * 0.5})`);
      shockwaveGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = shockwaveGradient;
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw explosion particles
      explosion.particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        
        if (particle.type === 'fire') {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
        }
        ctx.restore();
      });
    });

    // Draw bombs
    bombs.forEach(bomb => {
      // Bomb trail
      bomb.trail.forEach((trail, index) => {
        ctx.save();
        ctx.globalAlpha = trail.life * 0.3;
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, (bomb.trail.length - index) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Bomb danger zone
      if (bomb.timeLeft < 5000) {
        const dangerAlpha = Math.sin(currentTime * 0.01) * 0.3 + 0.3;
        ctx.save();
        ctx.globalAlpha = dangerAlpha;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, bomb.explosionRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Bomb shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(bomb.x + 3, bomb.y + 3, BOMB_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Bomb body
      const bombPulse = bomb.timeLeft < 3000 ? Math.sin(currentTime * bomb.blinkRate * 0.05) * 0.3 + 0.7 : 1;
      ctx.save();
      ctx.scale(bombPulse, bombPulse);
      ctx.translate(bomb.x / bombPulse, bomb.y / bombPulse);

      const bombGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, BOMB_SIZE);
      if (bomb.type === 'mega') {
        bombGradient.addColorStop(0, '#FF0000');
        bombGradient.addColorStop(1, '#AA0000');
      } else if (bomb.type === 'cluster') {
        bombGradient.addColorStop(0, '#FF8800');
        bombGradient.addColorStop(1, '#CC4400');
      } else {
        bombGradient.addColorStop(0, '#333333');
        bombGradient.addColorStop(1, '#111111');
      }
      
      ctx.fillStyle = bombGradient;
      ctx.beginPath();
      ctx.arc(0, 0, BOMB_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Bomb fuse
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-5, -BOMB_SIZE);
      ctx.lineTo(-8, -BOMB_SIZE - 10);
      ctx.stroke();

      // Fuse spark
      if (bomb.timeLeft < 5000) {
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(-8, -BOMB_SIZE - 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Timer display
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText((bomb.timeLeft / 1000).toFixed(1), 0, 35);

      ctx.restore();
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      const pulse = Math.sin(powerUp.animation) * 0.3 + 0.7;
      
      ctx.save();
      ctx.translate(powerUp.x, powerUp.y);
      ctx.scale(pulse, pulse);

      // Power-up glow based on rarity
      const glowColors = {
        common: '#00FF0040',
        rare: '#0088FF40',
        legendary: '#FF880040'
      };
      
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
      glowGradient.addColorStop(0, glowColors[powerUp.rarity]);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(-40, -40, 80, 80);

      // Power-up body
      const colors = {
        common: '#00FF00',
        rare: '#0088FF',
        legendary: '#FF8800'
      };
      
      ctx.fillStyle = colors[powerUp.rarity];
      ctx.fillRect(-20, -20, 40, 40);
      
      // Power-up icon
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const icons = {
        speed: '⚡',
        shield: '🛡️',
        freeze: '❄️',
        invisible: '👻',
        defuse: '🔧',
        extra_bomb: '💣',
        mega_bomb: '💥',
        teleport: '🌀'
      };
      
      ctx.fillText(icons[powerUp.type] || '?', 0, 0);
      ctx.restore();
    });

    // Draw players
    players.forEach(p => {
      if (!p.isAlive) {
        // Draw tombstone
        ctx.fillStyle = 'rgba(100,100,100,0.8)';
        ctx.fillRect(p.x - 15, p.y - 20, 30, 40);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💀', p.x, p.y + 5);
        return;
      }

      ctx.save();
      ctx.translate(p.x, p.y);

      // Player effects
      if (p.invisible && Math.sin(currentTime * 0.01) > 0) {
        ctx.globalAlpha = 0.3;
      }

      if (p.shield) {
        const shieldGradient = ctx.createRadialGradient(0, 0, 25, 0, 0, 35);
        shieldGradient.addColorStop(0, 'rgba(0,255,255,0.3)');
        shieldGradient.addColorStop(1, 'rgba(0,255,255,0)');
        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.fill();
      }

      if (p.freeze) {
        ctx.fillStyle = 'rgba(173,216,230,0.5)';
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
      }

      // Player shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(3, 3, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Player body based on style
      if (p.style === 'ninja') {
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size + 5, -p.size + 5, p.size * 2 - 10, p.size * 2 - 10);
      } else if (p.style === 'robot') {
        ctx.fillStyle = '#34495E';
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size + 3, -p.size + 3, p.size * 2 - 6, p.size * 2 - 6);
        // Robot antenna
        ctx.strokeStyle = '#ECF0F1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(0, -p.size - 10);
        ctx.stroke();
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.arc(0, -p.size - 10, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Classic circular style
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player outline
      ctx.strokeStyle = p.id === player ? '#FFFFFF' : 'rgba(255,255,255,0.6)';
      ctx.lineWidth = p.id === player ? 3 : 2;
      ctx.stroke();

      // Bomb indicator
      if (p.hasBomb) {
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💣', 0, -p.size - 20);
      }

      // Player name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, 0, p.size + 25);

      // Power-up indicators
      if (p.powerUps.length > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(-30, p.size + 30, 60, 15);
        ctx.fillStyle = '#00FF00';
        ctx.font = '12px Arial';
        ctx.fillText(p.powerUps.join(', '), 0, p.size + 42);
      }

      ctx.restore();
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      
      if (particle.type === 'fire') {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
      }
      ctx.restore();
    });

    ctx.restore();

    // Reduce camera shake
    if (camera.shake > 0) {
      setCamera(prev => ({ ...prev, shake: prev.shake * 0.9 }));
    }

    animationRef.current = requestAnimationFrame(render);
  }, [players, bombs, explosions, powerUps, particles, camera, updateFPS, player]);

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

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setWinner('');
    setRound(1);
    setRoundTime(0);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setBombs([]);
    setExplosions([]);
    setPowerUps([]);
    setParticles([]);
    setCamera({ x: 400, y: 300, shake: 0 });
    setRound(1);
    setRoundTime(0);
  };

  const handleMobileMove = (direction: string) => {
    setKeys(prev => ({ ...prev, [direction]: true }));
    setTimeout(() => {
      setKeys(prev => ({ ...prev, [direction]: false }));
    }, 100);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>💣 Enhanced Bomb Pass</h2>
        <div style={statsStyle}>
          <div>Mode: {gameMode.name}</div>
          <div>Round: {round}</div>
          <div>Time: {roundTime}s</div>
          <div>FPS: {fps}</div>
          <div>Room: {roomCode}</div>
        </div>
      </div>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>💥 Ready to Defuse?</h3>
          <p>Pass the bomb before it explodes!</p>
          
          <div style={gameModeSelector}>
            <h4>Select Game Mode:</h4>
            {GAME_MODES.map(mode => (
              <div
                key={mode.name}
                style={{
                  ...gameModeOption,
                  backgroundColor: gameMode.name === mode.name ? '#4CAF50' : 'rgba(255,255,255,0.1)'
                }}
                onClick={() => setGameMode(mode)}
              >
                <h5>{mode.name}</h5>
                <p>{mode.description}</p>
                <small>Rules: {mode.specialRules.join(', ')}</small>
              </div>
            ))}
          </div>
          
          <div style={controlsStyle}>
            <p><strong>Controls:</strong></p>
            <p>WASD - Move | SPACE - Pass Bomb</p>
            {showMobileControls && <p>Use on-screen controls for mobile</p>}
          </div>
          <button onClick={startGame} style={buttonStyle}>Start Bombing!</button>
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
            
            {/* Mobile controls */}
            {showMobileControls && (
              <div style={mobileControlsStyle}>
                <div style={dPadStyle}>
                  <div></div>
                  <button 
                    className="mobile-control-btn"
                    onTouchStart={() => handleMobileMove('w')}
                    onMouseDown={() => handleMobileMove('w')}
                    style={{ background: 'linear-gradient(135deg, #32CD32, #228B22)' }}
                  >
                    ⬆️
                  </button>
                  <div></div>
                  
                  <button 
                    className="mobile-control-btn"
                    onTouchStart={() => handleMobileMove('a')}
                    onMouseDown={() => handleMobileMove('a')}
                  >
                    ⬅️
                  </button>
                  <div></div>
                  <button 
                    className="mobile-control-btn"
                    onTouchStart={() => handleMobileMove('d')}
                    onMouseDown={() => handleMobileMove('d')}
                  >
                    ➡️
                  </button>
                  
                  <div></div>
                  <button 
                    className="mobile-control-btn"
                    onTouchStart={() => handleMobileMove('s')}
                    onMouseDown={() => handleMobileMove('s')}
                    style={{ background: 'linear-gradient(135deg, #DC143C, #8B0000)' }}
                  >
                    ⬇️
                  </button>
                  <div></div>
                </div>
                
                <button 
                  className="mobile-control-btn"
                  onTouchStart={passBomb}
                  onMouseDown={passBomb}
                  style={{
                    background: 'linear-gradient(135deg, #FF4500, #DC143C)',
                    width: '100px',
                    height: '80px',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  💣 PASS
                </button>
              </div>
            )}
          </div>

          <div style={scoreboardStyle}>
            {players.map(p => (
              <div key={p.id} style={{
                ...playerStatStyle,
                backgroundColor: p.id === player ? p.color + '40' : p.color + '20',
                opacity: p.isAlive ? 1 : 0.6
              }}>
                <div style={playerNameStyle}>{p.name} {p.id === player && '(You)'}</div>
                <div>Status: {p.isAlive ? '✅ Alive' : '💀 Dead'}</div>
                {p.hasBomb && <div>💣 HAS BOMB!</div>}
                <div>Score: {p.score}</div>
                <div>Eliminations: {p.eliminations}</div>
                <div>Survival: {p.survivalTime.toFixed(1)}s</div>
                {p.powerUps.length > 0 && <div>Powers: {p.powerUps.join(', ')}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {gameOver && (
        <div style={gameOverStyle}>
          <h3>💥 Game Over!</h3>
          <p>{winner}</p>
          <div style={finalScoresStyle}>
            <h4>Final Scores:</h4>
            {players.sort((a, b) => b.score - a.score).map((p, index) => (
              <div key={p.id} style={{ color: index === 0 ? '#FFD700' : 'white' }}>
                #{index + 1} {p.name}: {p.score} points
                ({p.eliminations} eliminations, {p.survivalTime.toFixed(1)}s survival)
              </div>
            ))}
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
  background: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
  minHeight: '100vh',
  color: 'white',
  fontFamily: 'Arial, sans-serif'
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
  background: 'rgba(0,0,0,0.5)',
  padding: '15px',
  borderRadius: '10px',
  backdropFilter: 'blur(10px)'
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
  marginTop: '10px',
  fontSize: '14px',
  flexWrap: 'wrap'
};

const menuStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'rgba(0,0,0,0.7)',
  padding: '30px',
  borderRadius: '15px',
  backdropFilter: 'blur(20px)',
  maxWidth: '800px',
  width: '100%'
};

const gameModeSelector: React.CSSProperties = {
  margin: '20px 0',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '15px'
};

const gameModeOption: React.CSSProperties = {
  padding: '15px',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textAlign: 'left'
};

const controlsStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  padding: '15px',
  borderRadius: '10px',
  margin: '20px 0',
  fontSize: '14px'
};

const gameAreaStyle: React.CSSProperties = {
  position: 'relative',
  marginBottom: '20px'
};

const canvasStyle: React.CSSProperties = {
  border: '3px solid rgba(255,255,255,0.3)',
  borderRadius: '10px',
  background: 'rgba(0,0,0,0.2)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  maxWidth: '100%',
  height: 'auto'
};

const mobileControlsStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: '40px',
  alignItems: 'center'
};

const dPadStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '60px 60px 60px',
  gridTemplateRows: '60px 60px 60px',
  gap: '5px'
};

const dPadButton: React.CSSProperties = {
  background: 'rgba(255,255,255,0.2)',
  border: '2px solid rgba(255,255,255,0.3)',
  color: 'white',
  fontSize: '20px',
  borderRadius: '10px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none'
};

const dPadMiddle: React.CSSProperties = {
  display: 'flex',
  gap: '5px',
  gridColumn: '1 / 4',
  gridRow: '2'
};

const passBombButton: React.CSSProperties = {
  background: '#E74C3C',
  border: '2px solid #C0392B',
  color: 'white',
  fontSize: '18px',
  fontWeight: 'bold',
  padding: '20px',
  borderRadius: '50%',
  width: '80px',
  height: '80px',
  cursor: 'pointer',
  userSelect: 'none'
};

const scoreboardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '15px',
  marginBottom: '20px',
  width: '100%',
  maxWidth: '1200px'
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

const gameOverStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'rgba(0,0,0,0.9)',
  padding: '30px',
  borderRadius: '15px',
  backdropFilter: 'blur(20px)',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 1000,
  maxWidth: '600px',
  maxHeight: '80vh',
  overflow: 'auto'
};

const finalScoresStyle: React.CSSProperties = {
  margin: '20px 0',
  fontSize: '14px'
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: '16px',
  backgroundColor: '#E74C3C',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
};

export default BombPass;
