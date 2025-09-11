
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  isAlive: boolean;
  onPlatform: boolean;
  score: number;
  jumps: number;
  survivalTime: number;
  speed: number;
  jumpPower: number;
  size: number;
  powerUps: string[];
  lastPlatform: string | null;
  platformStreak: number;
  comboMultiplier: number;
  style: 'human' | 'cat' | 'frog' | 'ninja';
}

interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'crumbling' | 'moving' | 'spring' | 'ice' | 'lava' | 'cloud';
  health: number;
  maxHealth: number;
  velocity: { x: number; y: number };
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  animation: number;
  special: boolean;
  respawnTime: number;
}

interface LavaBubble {
  id: string;
  x: number;
  y: number;
  size: number;
  velocity: { x: number; y: number };
  life: number;
  dangerous: boolean;
}

interface PowerUp {
  id: string;
  type: 'double_jump' | 'speed' | 'shield' | 'platform_spawn' | 'freeze_lava' | 'super_jump';
  x: number;
  y: number;
  duration: number;
  animation: number;
  rarity: 'common' | 'rare' | 'legendary';
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
  type: 'lava' | 'steam' | 'spark' | 'bubble' | 'debris';
}

const FloorIsLava: React.FC<{ roomCode: string; player: string }> = ({ roomCode, player }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [lavaBubbles, setLavaBubbles] = useState<LavaBubble[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [lavaLevel, setLavaLevel] = useState(650);
  const [gameTime, setGameTime] = useState(0);
  const [winner, setWinner] = useState<string>('');
  const [difficulty, setDifficulty] = useState(1);
  const [camera, setCamera] = useState({ x: 400, y: 300, shake: 0, followPlayer: true });
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [fps, setFps] = useState(60);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [doubleJumpAvailable, setDoubleJumpAvailable] = useState<Record<string, number>>({});

  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 700;
  const PLAYER_SIZE = 25;
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const MOVE_SPEED = 5;
  const LAVA_RISE_SPEED = 0.3;

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

  // Initialize players and platforms
  useEffect(() => {
    const playerColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const playerNames = ['Jumper', 'Hopper', 'Leaper', 'Bouncer', 'Springer', 'Vaulter'];
    const styles: Player['style'][] = ['human', 'cat', 'frog', 'ninja'];
    
    const playerCount = 6;
    const initialPlayers: Player[] = [];

    for (let i = 0; i < playerCount; i++) {
      const isMainPlayer = i === 0;
      const playerId = isMainPlayer ? player : `bot_${i}`;
      
      initialPlayers.push({
        id: playerId,
        name: isMainPlayer ? `Player ${player}` : playerNames[i % playerNames.length],
        x: 100 + i * 150,
        y: 200,
        color: playerColors[i % playerColors.length],
        isAlive: true,
        onPlatform: false,
        score: 0,
        jumps: 0,
        survivalTime: 0,
        speed: MOVE_SPEED,
        jumpPower: JUMP_FORCE,
        size: PLAYER_SIZE,
        powerUps: [],
        lastPlatform: null,
        platformStreak: 0,
        comboMultiplier: 1,
        style: styles[i % styles.length]
      });
    }

    // Generate initial platforms
    const initialPlatforms: Platform[] = [];
    const platformTypes: Platform['type'][] = ['normal', 'crumbling', 'moving', 'spring', 'ice', 'cloud'];
    
    // Starting platform
    initialPlatforms.push({
      id: 'start_platform',
      x: 50,
      y: 250,
      width: 200,
      height: 20,
      type: 'normal',
      health: 100,
      maxHealth: 100,
      velocity: { x: 0, y: 0 },
      bounds: { minX: 50, maxX: 250, minY: 250, maxY: 250 },
      animation: 0,
      special: false,
      respawnTime: 0
    });

    // Generate random platforms
    for (let i = 0; i < 25; i++) {
      const type = platformTypes[Math.floor(Math.random() * platformTypes.length)];
      const x = Math.random() * (CANVAS_WIDTH - 150) + 50;
      const y = 100 + i * 80 + Math.random() * 100;
      const width = type === 'cloud' ? 120 + Math.random() * 80 : 80 + Math.random() * 60;
      const height = type === 'spring' ? 30 : 20;
      
      let velocity = { x: 0, y: 0 };
      let bounds = { minX: x, maxX: x, minY: y, maxY: y };
      
      if (type === 'moving') {
        velocity = { 
          x: (Math.random() - 0.5) * 3, 
          y: Math.random() < 0.3 ? (Math.random() - 0.5) * 2 : 0 
        };
        bounds = {
          minX: Math.max(0, x - 150),
          maxX: Math.min(CANVAS_WIDTH - width, x + 150),
          minY: Math.max(0, y - 100),
          maxY: Math.min(600, y + 100)
        };
      }
      
      initialPlatforms.push({
        id: `platform_${i}`,
        x,
        y,
        width,
        height,
        type,
        health: type === 'crumbling' ? 50 : 100,
        maxHealth: type === 'crumbling' ? 50 : 100,
        velocity,
        bounds,
        animation: 0,
        special: Math.random() < 0.15,
        respawnTime: 0
      });
    }

    setPlayers(initialPlayers);
    setPlatforms(initialPlatforms);
    setDoubleJumpAvailable(
      initialPlayers.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
    );
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

  // Add particles
  const addParticles = useCallback((x: number, y: number, count: number, type: Particle['type'] = 'spark', color: string = '#FF6B00') => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 6 + 2,
        type
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Game timer and difficulty scaling
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setGameTime(prev => {
        const newTime = prev + 1;
        setDifficulty(Math.floor(newTime / 30) + 1);
        
        // Increase lava level
        setLavaLevel(prev => Math.max(100, prev - LAVA_RISE_SPEED * difficulty));
        
        return newTime;
      });
      
      // Update player survival time
      setPlayers(prev => prev.map(p => ({
        ...p,
        survivalTime: p.isAlive ? p.survivalTime + 1 : p.survivalTime
      })));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, difficulty]);

  // Spawn lava bubbles
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnBubble = () => {
      const newBubble: LavaBubble = {
        id: Date.now().toString(),
        x: Math.random() * CANVAS_WIDTH,
        y: lavaLevel + Math.random() * 50,
        size: 15 + Math.random() * 25,
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: -(Math.random() * 8 + 3)
        },
        life: 1,
        dangerous: Math.random() < 0.3
      };
      setLavaBubbles(prev => [...prev, newBubble]);
    };

    const interval = setInterval(spawnBubble, 500 - difficulty * 20);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, lavaLevel, difficulty]);

  // Spawn power-ups
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnPowerUp = () => {
      const validPlatforms = platforms.filter(p => p.health > 0 && p.y > lavaLevel + 100);
      if (validPlatforms.length === 0) return;

      const platform = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
      const types: PowerUp['type'][] = ['double_jump', 'speed', 'shield', 'platform_spawn', 'freeze_lava', 'super_jump'];
      const rarities: PowerUp['rarity'][] = ['common', 'common', 'rare', 'rare', 'legendary', 'legendary'];
      
      const newPowerUp: PowerUp = {
        id: Date.now().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        x: platform.x + platform.width / 2,
        y: platform.y - 40,
        duration: 20000,
        animation: 0,
        rarity: rarities[Math.floor(Math.random() * rarities.length)]
      };
      setPowerUps(prev => [...prev, newPowerUp]);
    };

    const interval = setInterval(spawnPowerUp, 8000 - difficulty * 300);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, platforms, lavaLevel, difficulty]);

  // Update game objects
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      // Update platforms
      setPlatforms(prev => prev.map(platform => {
        let newX = platform.x + platform.velocity.x;
        let newY = platform.y + platform.velocity.y;
        let newVelX = platform.velocity.x;
        let newVelY = platform.velocity.y;

        // Handle moving platforms
        if (platform.type === 'moving') {
          if (newX <= platform.bounds.minX || newX + platform.width >= platform.bounds.maxX) {
            newVelX = -newVelX;
          }
          if (newY <= platform.bounds.minY || newY >= platform.bounds.maxY) {
            newVelY = -newVelY;
          }
        }

        // Handle crumbling platforms
        let newHealth = platform.health;
        if (platform.type === 'crumbling' && platform.health < platform.maxHealth) {
          newHealth = Math.max(0, platform.health - 0.5);
          if (newHealth <= 0) {
            addParticles(platform.x + platform.width/2, platform.y, 10, 'debris', '#8B4513');
          }
        }

        // Handle respawning platforms
        let respawnTime = platform.respawnTime;
        if (platform.health <= 0) {
          respawnTime = Math.max(0, respawnTime - 50);
          if (respawnTime <= 0 && Math.random() < 0.001) {
            newHealth = platform.maxHealth;
            addParticles(platform.x + platform.width/2, platform.y, 5, 'spark', '#00FF00');
          }
        }

        return {
          ...platform,
          x: newX,
          y: newY,
          velocity: { x: newVelX, y: newVelY },
          health: newHealth,
          animation: platform.animation + 0.1,
          respawnTime: platform.health <= 0 ? (respawnTime > 0 ? respawnTime : 5000) : 0
        };
      }));

      // Update lava bubbles
      setLavaBubbles(prev => prev.map(bubble => ({
        ...bubble,
        x: bubble.x + bubble.velocity.x,
        y: bubble.y + bubble.velocity.y,
        velocity: {
          x: bubble.velocity.x * 0.99,
          y: bubble.velocity.y + 0.3
        },
        life: bubble.life - 0.01,
        size: bubble.size * 0.995
      })).filter(bubble => bubble.life > 0 && bubble.size > 5));

      // Update power-ups
      setPowerUps(prev => prev.map(p => ({
        ...p,
        duration: p.duration - 50,
        animation: p.animation + 0.1
      })).filter(p => p.duration > 0));

      // Update particles
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - 0.02,
        vy: p.vy + (p.type === 'bubble' ? -0.1 : 0.2)
      })).filter(p => p.life > 0));
    };

    const interval = setInterval(gameLoop, 50);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, addParticles]);

  // Player physics and AI
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const physicsLoop = () => {
      setPlayers(prev => prev.map(p => {
        if (!p.isAlive) return p;

        let newX = p.x;
        let newY = p.y;
        let newVelY = 0;
        let onPlatform = false;

        // Handle player input (for main player only)
        if (p.id === player) {
          if (keys['a'] || keys['arrowleft']) newX = Math.max(p.size, p.x - p.speed);
          if (keys['d'] || keys['arrowright']) newX = Math.min(CANVAS_WIDTH - p.size, p.x + p.speed);
        } else {
          // Bot AI behavior
          const nearestPlatformAbove = platforms
            .filter(platform => 
              platform.health > 0 && 
              platform.y < p.y - 20 &&
              platform.y > lavaLevel + 50 &&
              Math.abs(platform.x + platform.width/2 - p.x) < 200
            )
            .sort((a, b) => {
              const distA = Math.sqrt(Math.pow(a.x + a.width/2 - p.x, 2) + Math.pow(a.y - p.y, 2));
              const distB = Math.sqrt(Math.pow(b.x + b.width/2 - p.x, 2) + Math.pow(b.y - p.y, 2));
              return distA - distB;
            })[0];

          if (nearestPlatformAbove) {
            const targetX = nearestPlatformAbove.x + nearestPlatformAbove.width/2;
            if (Math.abs(targetX - p.x) > 30) {
              newX = p.x + (targetX > p.x ? p.speed : -p.speed);
            }
            
            // Jump if platform is reachable
            if (Math.abs(targetX - p.x) < 50 && nearestPlatformAbove.y < p.y - 40) {
              // Simulate jump key press for bot
              if (Math.random() < 0.3) {
                newVelY = p.jumpPower;
                setPlayers(prevPlayers => prevPlayers.map(pl => 
                  pl.id === p.id ? { ...pl, jumps: pl.jumps + 1 } : pl
                ));
              }
            }
          } else {
            // Move towards center if no good platform found
            const centerX = CANVAS_WIDTH / 2;
            if (Math.abs(centerX - p.x) > 50) {
              newX = p.x + (centerX > p.x ? p.speed : -p.speed);
            }
          }
          
          // Emergency jump if getting close to lava
          if (p.y > lavaLevel - 100 && Math.random() < 0.8) {
            newVelY = p.jumpPower * 1.2;
          }
        }

        // Apply gravity
        newY += GRAVITY;

        // Check platform collisions
        platforms.forEach(platform => {
          if (platform.health <= 0) return;
          
          // Check if player is landing on platform
          if (newX + p.size > platform.x && 
              newX - p.size < platform.x + platform.width &&
              newY + p.size > platform.y &&
              newY + p.size < platform.y + platform.height + 10 &&
              p.y + p.size <= platform.y) {
            
            newY = platform.y - p.size;
            onPlatform = true;
            newVelY = 0;

            // Platform-specific effects
            if (platform.type === 'spring') {
              newVelY = p.jumpPower * 1.8;
              addParticles(newX, newY, 8, 'spark', '#00FF00');
              setPlayers(prevPlayers => prevPlayers.map(pl => 
                pl.id === p.id ? { ...pl, jumps: pl.jumps + 1 } : pl
              ));
            } else if (platform.type === 'crumbling') {
              setPlatforms(prevPlatforms => prevPlatforms.map(plt => 
                plt.id === platform.id ? { ...plt, health: plt.health - 2 } : plt
              ));
            }

            // Update platform streak and combo
            if (platform.id !== p.lastPlatform) {
              const newStreak = p.platformStreak + 1;
              const newMultiplier = Math.min(5, Math.floor(newStreak / 3) + 1);
              setPlayers(prevPlayers => prevPlayers.map(pl => 
                pl.id === p.id ? { 
                  ...pl, 
                  lastPlatform: platform.id,
                  platformStreak: newStreak,
                  comboMultiplier: newMultiplier,
                  score: pl.score + (10 * newMultiplier)
                } : pl
              ));

              if (newMultiplier > 1) {
                addParticles(newX, newY - 30, 5, 'spark', '#FFD700');
              }
            }

            // Reset double jump when landing
            if (p.id === player) {
              setDoubleJumpAvailable(prev => ({ ...prev, [p.id]: p.powerUps.includes('double_jump') ? 1 : 0 }));
            }
          }
        });

        // Apply jump velocity
        newY += newVelY;

        // Check lava collision
        if (newY + p.size >= lavaLevel && p.isAlive) {
          addParticles(newX, lavaLevel, 15, 'lava', '#FF4444');
          setCamera(prev => ({ ...prev, shake: 10 }));
          return { ...p, isAlive: false };
        }

        // Check lava bubble collisions
        lavaBubbles.forEach(bubble => {
          if (bubble.dangerous) {
            const distance = Math.sqrt(Math.pow(bubble.x - newX, 2) + Math.pow(bubble.y - newY, 2));
            if (distance < bubble.size + p.size && p.isAlive && !p.powerUps.includes('shield')) {
              addParticles(newX, newY, 10, 'lava', '#FF6600');
              setPlayers(prevPlayers => prevPlayers.map(pl => 
                pl.id === p.id ? { ...pl, isAlive: false } : pl
              ));
            }
          }
        });

        return { 
          ...p, 
          x: newX, 
          y: newY, 
          onPlatform,
          // Reset streak if fell off platforms
          platformStreak: onPlatform ? p.platformStreak : 0,
          comboMultiplier: onPlatform ? p.comboMultiplier : 1
        };
      }));
    };

    const interval = setInterval(physicsLoop, 16);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, keys, player, platforms, lavaBubbles, lavaLevel, addParticles]);

  // Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
      
      // Jump - Enhanced WASD Support
      if ((e.key.toLowerCase() === ' ' || e.key.toLowerCase() === 'w' || e.key.toLowerCase() === 'arrowup') && gameStarted && !gameOver) {
        const currentPlayer = players.find(p => p.id === player);
        if (currentPlayer && currentPlayer.isAlive) {
          const canJump = currentPlayer.onPlatform || doubleJumpAvailable[player] > 0;
          
          if (canJump) {
            setPlayers(prev => prev.map(p => {
              if (p.id !== player) return p;
              return { ...p, jumps: p.jumps + 1 };
            }));

            // Use double jump if in air
            if (!currentPlayer.onPlatform && doubleJumpAvailable[player] > 0) {
              setDoubleJumpAvailable(prev => ({ ...prev, [player]: prev[player] - 1 }));
              addParticles(currentPlayer.x, currentPlayer.y, 8, 'spark', '#00FFFF');
            }
          }
        }
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
  }, [players, player, doubleJumpAvailable, gameStarted, gameOver, addParticles]);

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

        if (distance < 30) {
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
      case 'double_jump':
        setPlayers(prev => prev.map(p => {
          if (p.id !== player) return p;
          return { ...p, powerUps: [...p.powerUps, 'double_jump'] };
        }));
        setDoubleJumpAvailable(prev => ({ ...prev, [player]: 2 }));
        setTimeout(() => {
          setPlayers(prev => prev.map(p => ({
            ...p,
            powerUps: p.powerUps.filter(pu => pu !== 'double_jump')
          })));
        }, 15000);
        break;
      case 'super_jump':
        setPlayers(prev => prev.map(p => {
          if (p.id !== player) return p;
          return { ...p, jumpPower: p.jumpPower * 1.5, powerUps: [...p.powerUps, 'super_jump'] };
        }));
        setTimeout(() => {
          setPlayers(prev => prev.map(p => ({
            ...p,
            jumpPower: JUMP_FORCE,
            powerUps: p.powerUps.filter(pu => pu !== 'super_jump')
          })));
        }, 12000);
        break;
      case 'freeze_lava':
        setLavaLevel(prev => prev + 50);
        addParticles(currentPlayer?.x || 0, lavaLevel, 20, 'steam', '#00FFFF');
        break;
      case 'platform_spawn':
        const currentPlayer = players.find(p => p.id === player);
        if (currentPlayer) {
          const newPlatform: Platform = {
            id: `emergency_${Date.now()}`,
            x: currentPlayer.x - 50,
            y: currentPlayer.y + 60,
            width: 100,
            height: 20,
            type: 'normal',
            health: 100,
            maxHealth: 100,
            velocity: { x: 0, y: 0 },
            bounds: { minX: 0, maxX: CANVAS_WIDTH, minY: 0, maxY: CANVAS_HEIGHT },
            animation: 0,
            special: true,
            respawnTime: 0
          };
          setPlatforms(prev => [...prev, newPlatform]);
          addParticles(newPlatform.x + 50, newPlatform.y, 10, 'spark', '#00FF00');
        }
        break;
    }
    
    addParticles(currentPlayer?.x || 0, (currentPlayer?.y || 0) - 20, 12, 'spark', '#FFD700');
  }, [player, players, lavaLevel]);

  // Camera follow player
  useEffect(() => {
    if (!camera.followPlayer) return;
    
    const currentPlayer = players.find(p => p.id === player);
    if (currentPlayer && currentPlayer.isAlive) {
      setCamera(prev => ({
        ...prev,
        x: currentPlayer.x,
        y: Math.max(200, Math.min(500, currentPlayer.y))
      }));
    }
  }, [players, player, camera.followPlayer]);

  // Win condition check
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const alivePlayers = players.filter(p => p.isAlive);
    if (alivePlayers.length <= 1) {
      setGameOver(true);
      if (alivePlayers.length === 1) {
        setWinner(alivePlayers[0].name + ' Survives!');
      } else {
        setWinner('No Survivors - Lava Wins!');
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

    // Clear canvas with volcanic sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#FF6B35');
    skyGradient.addColorStop(0.6, '#F7931E');
    skyGradient.addColorStop(1, '#FF4444');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply camera shake
    ctx.save();
    ctx.translate(
      Math.random() * camera.shake - camera.shake/2,
      Math.random() * camera.shake - camera.shake/2
    );

    // Draw lava
    const lavaGradient = ctx.createLinearGradient(0, lavaLevel - 50, 0, CANVAS_HEIGHT);
    lavaGradient.addColorStop(0, '#FF6600');
    lavaGradient.addColorStop(0.3, '#FF3300');
    lavaGradient.addColorStop(1, '#CC0000');
    ctx.fillStyle = lavaGradient;
    ctx.fillRect(0, lavaLevel, CANVAS_WIDTH, CANVAS_HEIGHT - lavaLevel);

    // Draw lava surface animation
    ctx.strokeStyle = '#FFAA00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      const waveHeight = Math.sin((x + currentTime * 0.01) * 0.02) * 8;
      ctx.lineTo(x, lavaLevel + waveHeight);
    }
    ctx.stroke();

    // Draw lava bubbles
    lavaBubbles.forEach(bubble => {
      ctx.save();
      ctx.globalAlpha = bubble.life;
      
      if (bubble.dangerous) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      const bubbleGradient = ctx.createRadialGradient(
        bubble.x, bubble.y, 0,
        bubble.x, bubble.y, bubble.size
      );
      bubbleGradient.addColorStop(0, bubble.dangerous ? '#FF4444AA' : '#FF8800AA');
      bubbleGradient.addColorStop(1, bubble.dangerous ? '#AA0000AA' : '#CC4400AA');
      ctx.fillStyle = bubbleGradient;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw platforms
    platforms.forEach(platform => {
      if (platform.health <= 0) return;

      ctx.save();
      ctx.globalAlpha = platform.health / platform.maxHealth;

      // Platform shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(platform.x + 3, platform.y + 3, platform.width, platform.height);

      // Platform body based on type
      let platformColor = '#8B4513';
      switch (platform.type) {
        case 'crumbling':
          platformColor = `rgb(${139 + (100 - platform.health)}, 69, 19)`;
          break;
        case 'moving':
          platformColor = '#4169E1';
          break;
        case 'spring':
          platformColor = '#32CD32';
          break;
        case 'ice':
          platformColor = '#87CEEB';
          break;
        case 'cloud':
          platformColor = '#F0F8FF';
          break;
        case 'lava':
          platformColor = '#FF4500';
          break;
        default:
          platformColor = '#8B4513';
      }

      ctx.fillStyle = platformColor;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

      // Platform border
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

      // Special platform effects
      if (platform.type === 'spring') {
        const bounce = Math.sin(platform.animation) * 3;
        ctx.fillStyle = '#228B22';
        ctx.fillRect(platform.x, platform.y + bounce, platform.width, platform.height - bounce);
      } else if (platform.type === 'ice') {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);
        ctx.restore();
      }

      // Special platform indicator
      if (platform.special) {
        const pulse = Math.sin(platform.animation) * 0.3 + 0.7;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.strokeRect(platform.x - 2, platform.y - 2, platform.width + 4, platform.height + 4);
        ctx.restore();
      }

      ctx.restore();
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      const pulse = Math.sin(powerUp.animation) * 0.3 + 0.7;
      
      ctx.save();
      ctx.translate(powerUp.x, powerUp.y);
      ctx.scale(pulse, pulse);

      // Power-up glow
      const glowColors = {
        common: '#00FF0060',
        rare: '#0088FF60',
        legendary: '#FF880060'
      };
      
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      glowGradient.addColorStop(0, glowColors[powerUp.rarity]);
      glowGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(-30, -30, 60, 60);

      // Power-up body
      const colors = {
        common: '#00FF00',
        rare: '#0088FF',
        legendary: '#FF8800'
      };
      
      ctx.fillStyle = colors[powerUp.rarity];
      ctx.fillRect(-15, -15, 30, 30);
      
      // Power-up icon
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const icons = {
        double_jump: '🦘',
        speed: '⚡',
        shield: '🛡️',
        platform_spawn: '🏗️',
        freeze_lava: '❄️',
        super_jump: '🚀'
      };
      
      ctx.fillText(icons[powerUp.type] || '?', 0, 0);
      ctx.restore();
    });

    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life;
      
      if (particle.type === 'bubble') {
        const bubbleGradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        bubbleGradient.addColorStop(0, particle.color);
        bubbleGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = bubbleGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
      }
      ctx.restore();
    });

    // Draw players
    players.forEach(p => {
      if (!p.isAlive) {
        // Draw player ghost/remains
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👻', p.x, p.y + 5);
        ctx.restore();
        return;
      }

      ctx.save();
      ctx.translate(p.x, p.y);

      // Power-up effects
      if (p.powerUps.includes('shield')) {
        const shieldGradient = ctx.createRadialGradient(0, 0, p.size, 0, 0, p.size + 10);
        shieldGradient.addColorStop(0, 'rgba(0,255,255,0.3)');
        shieldGradient.addColorStop(1, 'rgba(0,255,255,0)');
        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.arc(0, 0, p.size + 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(3, 3, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Player body based on style
      if (p.style === 'frog') {
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size - 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Frog eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-8, -10, 5, 0, Math.PI * 2);
        ctx.arc(8, -10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-8, -10, 2, 0, Math.PI * 2);
        ctx.arc(8, -10, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.style === 'ninja') {
        ctx.fillStyle = '#2C2C2C';
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size + 3, -p.size + 3, p.size * 2 - 6, p.size * 2 - 6);
        
        // Ninja eyes
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-8, -8, 4, 2);
        ctx.fillRect(4, -8, 4, 2);
      } else {
        // Default circular style
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player outline
      ctx.strokeStyle = p.id === player ? '#FFFFFF' : 'rgba(255,255,255,0.6)';
      ctx.lineWidth = p.id === player ? 3 : 2;
      ctx.stroke();

      // Player name and stats
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, 0, -p.size - 15);

      // Combo multiplier indicator
      if (p.comboMultiplier > 1) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`x${p.comboMultiplier}`, 0, p.size + 20);
      }

      // Double jump indicator
      if (p.id === player && doubleJumpAvailable[player] > 0) {
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`DJ: ${doubleJumpAvailable[player]}`, p.size + 15, 0);
      }

      ctx.restore();
    });

    ctx.restore();

    // UI Overlay - Lava level warning
    if (lavaLevel > 450) {
      const warningAlpha = Math.sin(currentTime * 0.02) * 0.3 + 0.3;
      ctx.save();
      ctx.globalAlpha = warningAlpha;
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 50);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ LAVA RISING! ⚠️', CANVAS_WIDTH/2, 30);
      ctx.restore();
    }

    // Reduce camera shake
    if (camera.shake > 0) {
      setCamera(prev => ({ ...prev, shake: prev.shake * 0.9 }));
    }

    animationRef.current = requestAnimationFrame(render);
  }, [players, platforms, lavaBubbles, powerUps, particles, lavaLevel, camera, doubleJumpAvailable, updateFPS, player]);

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
    setGameTime(0);
    setDifficulty(1);
    setLavaLevel(650);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setLavaBubbles([]);
    setPowerUps([]);
    setParticles([]);
    setCamera({ x: 400, y: 300, shake: 0, followPlayer: true });
    setGameTime(0);
    setDifficulty(1);
    setLavaLevel(650);
  };

  const handleMobileMove = (direction: string) => {
    setKeys(prev => ({ ...prev, [direction]: true }));
    setTimeout(() => {
      setKeys(prev => ({ ...prev, [direction]: false }));
    }, 100);
  };

  const handleMobileJump = () => {
    const currentPlayer = players.find(p => p.id === player);
    if (currentPlayer && currentPlayer.isAlive) {
      const canJump = currentPlayer.onPlatform || doubleJumpAvailable[player] > 0;
      
      if (canJump) {
        setPlayers(prev => prev.map(p => {
          if (p.id !== player) return p;
          return { ...p, jumps: p.jumps + 1 };
        }));

        if (!currentPlayer.onPlatform && doubleJumpAvailable[player] > 0) {
          setDoubleJumpAvailable(prev => ({ ...prev, [player]: prev[player] - 1 }));
          addParticles(currentPlayer.x, currentPlayer.y, 8, 'spark', '#00FFFF');
        }
      }
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>🌋 Enhanced Floor is Lava</h2>
        <div style={statsStyle}>
          <div>Time: {Math.floor(gameTime / 60)}:{(gameTime % 60).toString().padStart(2, '0')}</div>
          <div>Difficulty: {difficulty}</div>
          <div>Lava Level: {Math.max(0, Math.round((700 - lavaLevel) / 7))}%</div>
          <div>FPS: {fps}</div>
          <div>Room: {roomCode}</div>
        </div>
      </div>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>🔥 Ready to Jump?</h3>
          <p>Stay above the rising lava by jumping between platforms!</p>
          <div style={controlsStyle}>
            <p><strong>Controls:</strong></p>
            <p>A/D - Move Left/Right | W/SPACE - Jump</p>
            <p>Collect power-ups and chain platform combos for bonus points!</p>
            {showMobileControls && <p>Use on-screen controls for mobile</p>}
          </div>
          <button onClick={startGame} style={buttonStyle}>Start Jumping!</button>
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
                <button style={moveButton} onTouchStart={() => handleMobileMove('a')}>
                  ← Left
                </button>
                <button style={jumpButton} onTouchStart={handleMobileJump}>
                  🦘 JUMP
                </button>
                <button style={moveButton} onTouchStart={() => handleMobileMove('d')}>
                  Right →
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
                <div>Status: {p.isAlive ? '🔥 Alive' : '💀 Burned'}</div>
                <div>Score: {p.score}</div>
                <div>Jumps: {p.jumps}</div>
                <div>Survival: {p.survivalTime}s</div>
                <div>Combo: x{p.comboMultiplier}</div>
                {p.powerUps.length > 0 && <div>Powers: {p.powerUps.join(', ')}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {gameOver && (
        <div style={gameOverStyle}>
          <h3>🌋 Game Over!</h3>
          <p>{winner}</p>
          <div style={finalScoresStyle}>
            <h4>Final Scores:</h4>
            {players.sort((a, b) => b.score - a.score).map((p, index) => (
              <div key={p.id} style={{ color: index === 0 ? '#FFD700' : 'white' }}>
                #{index + 1} {p.name}: {p.score} points
                ({p.jumps} jumps, {p.survivalTime}s survival)
              </div>
            ))}
          </div>
          <button onClick={resetGame} style={buttonStyle}>Jump Again</button>
        </div>
      )}
    </div>
  );
};

// Enhanced mobile-first styles
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '10px',
  background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FF4444 100%)',
  minHeight: '100vh',
  color: 'white',
  fontFamily: 'Arial, sans-serif'
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '15px',
  background: 'rgba(0,0,0,0.5)',
  padding: '10px',
  borderRadius: '10px',
  backdropFilter: 'blur(10px)',
  width: '100%',
  maxWidth: '1000px'
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  justifyContent: 'center',
  marginTop: '10px',
  fontSize: '14px',
  flexWrap: 'wrap'
};

const menuStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'rgba(0,0,0,0.7)',
  padding: '20px',
  borderRadius: '15px',
  backdropFilter: 'blur(20px)',
  maxWidth: '500px',
  width: '90%'
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
  marginBottom: '15px'
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
  gap: '15px',
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'center'
};

const moveButton: React.CSSProperties = {
  background: 'rgba(255,255,255,0.2)',
  border: '2px solid rgba(255,255,255,0.3)',
  color: 'white',
  fontSize: '16px',
  padding: '15px 20px',
  borderRadius: '10px',
  cursor: 'pointer',
  userSelect: 'none',
  minWidth: '80px'
};

const jumpButton: React.CSSProperties = {
  background: '#FF6600',
  border: '2px solid #CC4400',
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '10px',
  marginBottom: '15px',
  width: '100%',
  maxWidth: '1000px'
};

const playerStatStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: '10px',
  textAlign: 'center',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
  fontSize: '13px'
};

const playerNameStyle: React.CSSProperties = {
  fontWeight: 'bold',
  marginBottom: '6px',
  fontSize: '15px'
};

const gameOverStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'rgba(0,0,0,0.9)',
  padding: '20px',
  borderRadius: '15px',
  backdropFilter: 'blur(20px)',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 1000,
  maxWidth: '90%',
  maxHeight: '80vh',
  overflow: 'auto'
};

const finalScoresStyle: React.CSSProperties = {
  margin: '15px 0',
  fontSize: '14px'
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: '16px',
  backgroundColor: '#FF6600',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(255, 102, 0, 0.3)'
};

export default FloorIsLava;
