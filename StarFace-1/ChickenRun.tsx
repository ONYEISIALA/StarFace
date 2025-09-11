
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  score: number;
  lives: number;
  speed: number;
  powerUps: string[];
  invulnerable: boolean;
  checkpoints: number;
  deaths: number;
  style: 'chicken' | 'duck' | 'goose' | 'turkey';
}

interface Vehicle {
  id: string;
  type: 'car' | 'truck' | 'bus' | 'motorcycle' | 'police';
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  lane: number;
  size: { width: number; height: number };
  color: string;
  hazardLevel: number;
}

interface Log {
  id: string;
  x: number;
  y: number;
  width: number;
  speed: number;
  direction: 1 | -1;
  lane: number;
  isSinking: boolean;
  capacity: number;
  riders: string[];
}

interface PowerUp {
  id: string;
  type: 'speed' | 'shield' | 'jump' | 'freeze' | 'teleport' | 'extra_life';
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
  type: 'feather' | 'splash' | 'spark' | 'dust';
}

const ChickenRun: React.FC<{ roomCode: string; player: string }> = ({ roomCode, player }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [winner, setWinner] = useState<string>('');
  const [camera, setCamera] = useState({ y: 0, shake: 0 });
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [weather, setWeather] = useState<'sunny' | 'rain' | 'fog'>('sunny');
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [fps, setFps] = useState(60);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const LANE_HEIGHT = 60;
  const FINISH_LINE = -3000;
  const CHECKPOINT_DISTANCE = 500;

  const LANE_TYPES = [
    'grass', 'road', 'road', 'road', 'grass', 
    'water', 'water', 'grass', 'road', 'road', 
    'road', 'grass', 'water', 'water', 'water', 
    'grass', 'road', 'road', 'finish'
  ];

  // Initialize players
  useEffect(() => {
    const playerColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    const styles: Player['style'][] = ['chicken', 'duck', 'goose', 'turkey'];
    
    const initialPlayers: Player[] = [
      {
        id: player,
        name: `Player ${player}`,
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - 50,
        color: playerColors[0],
        score: 0,
        lives: 3,
        speed: 2,
        powerUps: [],
        invulnerable: false,
        checkpoints: 0,
        deaths: 0,
        style: styles[0]
      }
    ];

    if (player === 'X') {
      initialPlayers.push({
        id: 'O',
        name: 'Player O',
        x: CANVAS_WIDTH / 2 + 50,
        y: CANVAS_HEIGHT - 50,
        color: playerColors[1],
        score: 0,
        lives: 3,
        speed: 2,
        powerUps: [],
        invulnerable: false,
        checkpoints: 0,
        deaths: 0,
        style: styles[1]
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

  // Game timer and difficulty scaling
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        setDifficulty(Math.floor(newTime / 30) + 1);
        
        // Weather changes
        if (newTime % 60 === 0) {
          const weathers: typeof weather[] = ['sunny', 'rain', 'fog'];
          setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  // Spawn vehicles
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnVehicle = () => {
      const roadLanes = LANE_TYPES.map((type, index) => type === 'road' ? index : -1).filter(i => i !== -1);
      if (roadLanes.length === 0) return;

      const lane = roadLanes[Math.floor(Math.random() * roadLanes.length)];
      const types: Vehicle['type'][] = ['car', 'truck', 'bus', 'motorcycle', 'police'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const speeds = {
        car: 3 + difficulty * 0.5,
        truck: 2 + difficulty * 0.3,
        bus: 2.5 + difficulty * 0.4,
        motorcycle: 4 + difficulty * 0.7,
        police: 5 + difficulty * 0.8
      };

      const sizes = {
        car: { width: 40, height: 25 },
        truck: { width: 60, height: 30 },
        bus: { width: 70, height: 35 },
        motorcycle: { width: 25, height: 20 },
        police: { width: 45, height: 28 }
      };

      const colors = ['#ff4444', '#4444ff', '#44ff44', '#ffff44', '#ff44ff', '#44ffff'];
      
      const direction = Math.random() > 0.5 ? 1 : -1;
      const startX = direction > 0 ? -sizes[type].width : CANVAS_WIDTH;

      const newVehicle: Vehicle = {
        id: Date.now().toString() + Math.random(),
        type,
        x: startX,
        y: lane * LANE_HEIGHT + camera.y,
        speed: speeds[type],
        direction,
        lane,
        size: sizes[type],
        color: colors[Math.floor(Math.random() * colors.length)],
        hazardLevel: type === 'police' ? 2 : 1
      };

      setVehicles(prev => [...prev, newVehicle]);
    };

    const spawnRate = Math.max(300, 1000 - difficulty * 50);
    const interval = setInterval(spawnVehicle, spawnRate);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, difficulty, camera.y]);

  // Spawn logs
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnLog = () => {
      const waterLanes = LANE_TYPES.map((type, index) => type === 'water' ? index : -1).filter(i => i !== -1);
      if (waterLanes.length === 0) return;

      const lane = waterLanes[Math.floor(Math.random() * waterLanes.length)];
      const direction = Math.random() > 0.5 ? 1 : -1;
      const width = 80 + Math.random() * 60;
      const startX = direction > 0 ? -width : CANVAS_WIDTH;

      const newLog: Log = {
        id: Date.now().toString() + Math.random(),
        x: startX,
        y: lane * LANE_HEIGHT + camera.y,
        width,
        speed: 1 + difficulty * 0.2,
        direction,
        lane,
        isSinking: false,
        capacity: Math.floor(width / 30),
        riders: []
      };

      setLogs(prev => [...prev, newLog]);
    };

    const interval = setInterval(spawnLog, 2000 - difficulty * 100);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, difficulty, camera.y]);

  // Spawn power-ups
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnPowerUp = () => {
      const types: PowerUp['type'][] = ['speed', 'shield', 'jump', 'freeze', 'teleport', 'extra_life'];
      const newPowerUp: PowerUp = {
        id: Date.now().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        x: Math.random() * (CANVAS_WIDTH - 40) + 20,
        y: Math.random() * 300 + camera.y,
        duration: 10000,
        animation: 0
      };
      setPowerUps(prev => [...prev, newPowerUp]);
    };

    const interval = setInterval(spawnPowerUp, 8000);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, camera.y]);

  // Add particles
  const addParticles = useCallback((x: number, y: number, color: string, type: Particle['type'] = 'feather', count: number = 5) => {
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
          vy: p.vy + 0.2
        }))
        .filter(p => p.life > 0)
      );
    };

    const interval = setInterval(updateParticles, 16);
    return () => clearInterval(interval);
  }, [particles]);

  // Update game objects
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      // Update vehicles
      setVehicles(prev => prev.map(v => ({
        ...v,
        x: v.x + v.speed * v.direction * (weather === 'rain' ? 0.7 : 1)
      })).filter(v => v.x > -200 && v.x < CANVAS_WIDTH + 200));

      // Update logs
      setLogs(prev => prev.map(l => ({
        ...l,
        x: l.x + l.speed * l.direction,
        riders: l.riders.filter(playerId => {
          const p = players.find(player => player.id === playerId);
          if (!p) return false;
          return p.x >= l.x && p.x <= l.x + l.width && Math.abs(p.y - l.y) < 30;
        })
      })).filter(l => l.x > -300 && l.x < CANVAS_WIDTH + 300));

      // Update power-ups
      setPowerUps(prev => prev.map(p => ({
        ...p,
        duration: p.duration - 50,
        animation: p.animation + 0.1
      })).filter(p => p.duration > 0));
    };

    const interval = setInterval(gameLoop, 50);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, players, weather]);

  // Player movement and collision
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const movePlayer = () => {
      setPlayers(prev => prev.map(p => {
        if (p.id !== player) return p;

        let newX = p.x;
        let newY = p.y;
        const moveSpeed = p.powerUps.includes('speed') ? p.speed * 2 : p.speed;

        if (keys['a'] || keys['arrowleft']) newX = Math.max(20, p.x - moveSpeed);
        if (keys['d'] || keys['arrowright']) newX = Math.min(CANVAS_WIDTH - 20, p.x + moveSpeed);
        if (keys['w'] || keys['arrowup']) newY = p.y - moveSpeed;
        if (keys['s'] || keys['arrowdown']) newY = p.y + moveSpeed;

        // Update camera to follow player
        const targetCameraY = Math.max(FINISH_LINE, newY - CANVAS_HEIGHT / 2);
        setCamera(prev => ({ ...prev, y: targetCameraY }));

        // Check checkpoint progress
        const checkpointsPassed = Math.floor((CANVAS_HEIGHT - 50 - newY) / CHECKPOINT_DISTANCE);
        if (checkpointsPassed > p.checkpoints) {
          addParticles(newX, newY, p.color, 'spark', 10);
        }

        // Check win condition
        if (newY <= FINISH_LINE + 100 && !gameOver) {
          setGameOver(true);
          setWinner(p.name);
        }

        return {
          ...p,
          x: newX,
          y: newY,
          checkpoints: Math.max(p.checkpoints, checkpointsPassed),
          score: Math.max(p.score, checkpointsPassed * 100)
        };
      }));
    };

    const interval = setInterval(movePlayer, 16);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, keys, player, addParticles]);

  // Collision detection
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const checkCollisions = () => {
      const currentPlayer = players.find(p => p.id === player);
      if (!currentPlayer || currentPlayer.invulnerable) return;

      const currentLane = Math.floor((currentPlayer.y - camera.y) / LANE_HEIGHT);
      const laneType = LANE_TYPES[currentLane] || 'grass';

      // Vehicle collisions
      vehicles.forEach(vehicle => {
        const dx = currentPlayer.x - (vehicle.x + vehicle.size.width / 2);
        const dy = currentPlayer.y - vehicle.y;
        if (Math.abs(dx) < 25 && Math.abs(dy) < 25) {
          // Hit by vehicle
          if (!currentPlayer.powerUps.includes('shield')) {
            setPlayers(prev => prev.map(p => {
              if (p.id !== player) return p;
              const newLives = p.lives - 1;
              if (newLives <= 0) {
                setGameOver(true);
                setWinner('Game Over');
              }
              addParticles(p.x, p.y, p.color, 'feather', 15);
              setCamera(prev => ({ ...prev, shake: 15 }));
              return {
                ...p,
                lives: newLives,
                deaths: p.deaths + 1,
                y: CANVAS_HEIGHT - 50,
                x: CANVAS_WIDTH / 2,
                invulnerable: true
              };
            }));

            // Invulnerability period
            setTimeout(() => {
              setPlayers(prev => prev.map(p => 
                p.id === player ? { ...p, invulnerable: false } : p
              ));
            }, 2000);
          }
        }
      });

      // Water drowning
      if (laneType === 'water') {
        const onLog = logs.some(log => 
          currentPlayer.x >= log.x && 
          currentPlayer.x <= log.x + log.width && 
          Math.abs(currentPlayer.y - log.y) < 30
        );

        if (!onLog && !currentPlayer.powerUps.includes('shield')) {
          setPlayers(prev => prev.map(p => {
            if (p.id !== player) return p;
            addParticles(p.x, p.y, '#4444ff', 'splash', 10);
            return {
              ...p,
              lives: p.lives - 1,
              deaths: p.deaths + 1,
              y: CANVAS_HEIGHT - 50,
              x: CANVAS_WIDTH / 2
            };
          }));
        }
      }

      // Power-up collection
      powerUps.forEach(powerUp => {
        const dx = currentPlayer.x - powerUp.x;
        const dy = currentPlayer.y - powerUp.y;
        if (Math.sqrt(dx*dx + dy*dy) < 25) {
          collectPowerUp(powerUp.id);
        }
      });
    };

    const interval = setInterval(checkCollisions, 50);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, players, vehicles, logs, powerUps, camera.y, player, addParticles]);

  // Collect power-up
  const collectPowerUp = useCallback((powerUpId: string) => {
    const powerUp = powerUps.find(p => p.id === powerUpId);
    if (!powerUp) return;

    setPowerUps(prev => prev.filter(p => p.id !== powerUpId));
    
    switch (powerUp.type) {
      case 'speed':
        setPlayers(prev => prev.map(p => {
          if (p.id !== player) return p;
          return { ...p, powerUps: [...p.powerUps, 'speed'] };
        }));
        setTimeout(() => {
          setPlayers(prev => prev.map(p => ({
            ...p,
            powerUps: p.powerUps.filter(pu => pu !== 'speed')
          })));
        }, 8000);
        break;
      case 'shield':
        setPlayers(prev => prev.map(p => {
          if (p.id !== player) return p;
          return { ...p, powerUps: [...p.powerUps, 'shield'] };
        }));
        setTimeout(() => {
          setPlayers(prev => prev.map(p => ({
            ...p,
            powerUps: p.powerUps.filter(pu => pu !== 'shield')
          })));
        }, 10000);
        break;
      case 'extra_life':
        setPlayers(prev => prev.map(p => {
          if (p.id !== player) return p;
          return { ...p, lives: Math.min(5, p.lives + 1) };
        }));
        break;
      case 'teleport':
        setPlayers(prev => prev.map(p => {
          if (p.id !== player) return p;
          addParticles(p.x, p.y, '#00FFFF', 'spark', 10);
          const newY = Math.max(FINISH_LINE + 200, p.y - 200);
          addParticles(p.x, newY, '#00FFFF', 'spark', 10);
          return { ...p, y: newY };
        }));
        break;
    }

    addParticles(powerUp.x, powerUp.y, '#00FF00', 'spark', 8);
  }, [powerUps, player, addParticles]);

  // Key events
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

  // Render game
  const render = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updateFPS(currentTime);

    // Clear canvas with enhanced gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#98FB98');
    gradient.addColorStop(1, '#90EE90');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Add ground texture
    ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.fillRect(i, CANVAS_HEIGHT - 50, 20, 2);
    }

    // Weather effects
    if (weather === 'rain') {
      ctx.strokeStyle = 'rgba(200,200,255,0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = (Math.random() * CANVAS_HEIGHT + currentTime * 0.1) % CANVAS_HEIGHT;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 5, y + 10);
        ctx.stroke();
      }
    } else if (weather === 'fog') {
      ctx.fillStyle = 'rgba(200,200,200,0.3)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Apply camera shake
    ctx.save();
    ctx.translate(
      Math.random() * camera.shake - camera.shake/2,
      Math.random() * camera.shake - camera.shake/2
    );

    // Draw lanes
    for (let i = 0; i < LANE_TYPES.length; i++) {
      const y = i * LANE_HEIGHT - camera.y;
      const laneType = LANE_TYPES[i];
      
      let laneColor = '#98FB98';
      if (laneType === 'road') laneColor = '#444444';
      else if (laneType === 'water') laneColor = '#4169E1';
      else if (laneType === 'finish') laneColor = '#FFD700';
      
      ctx.fillStyle = laneColor;
      ctx.fillRect(0, y, CANVAS_WIDTH, LANE_HEIGHT);
      
      // Lane markings
      if (laneType === 'road') {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 10]);
        ctx.beginPath();
        ctx.moveTo(0, y + LANE_HEIGHT/2);
        ctx.lineTo(CANVAS_WIDTH, y + LANE_HEIGHT/2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw checkpoints
    for (let i = 1; i <= 10; i++) {
      const checkpointY = CANVAS_HEIGHT - 50 - i * CHECKPOINT_DISTANCE - camera.y;
      if (checkpointY > -50 && checkpointY < CANVAS_HEIGHT + 50) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(0, checkpointY);
        ctx.lineTo(CANVAS_WIDTH, checkpointY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Checkpoint ${i}`, 10, checkpointY - 5);
      }
    }

    // Draw vehicles
    vehicles.forEach(vehicle => {
      const screenY = vehicle.y - camera.y;
      if (screenY > -50 && screenY < CANVAS_HEIGHT + 50) {
        ctx.save();
        ctx.translate(vehicle.x + vehicle.size.width/2, screenY);
        if (vehicle.direction < 0) ctx.scale(-1, 1);
        
        // Vehicle shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-vehicle.size.width/2 + 3, 3, vehicle.size.width, vehicle.size.height);
        
        // Vehicle body
        ctx.fillStyle = vehicle.color;
        ctx.fillRect(-vehicle.size.width/2, 0, vehicle.size.width, vehicle.size.height);
        
        // Vehicle details
        ctx.fillStyle = '#333333';
        ctx.fillRect(-vehicle.size.width/2 + 5, 5, vehicle.size.width - 10, vehicle.size.height - 10);
        
        // Headlights
        ctx.fillStyle = '#FFFF99';
        ctx.fillRect(vehicle.size.width/2 - 3, 3, 3, 6);
        ctx.fillRect(vehicle.size.width/2 - 3, vehicle.size.height - 9, 3, 6);
        
        ctx.restore();
      }
    });

    // Draw logs
    logs.forEach(log => {
      const screenY = log.y - camera.y;
      if (screenY > -50 && screenY < CANVAS_HEIGHT + 50) {
        // Log shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(log.x + 3, screenY + 3, log.width, 25);
        
        // Log body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(log.x, screenY, log.width, 25);
        
        // Log texture
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(log.x, screenY + i * 8);
          ctx.lineTo(log.x + log.width, screenY + i * 8);
          ctx.stroke();
        }
      }
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
      const screenY = powerUp.y - camera.y;
      if (screenY > -30 && screenY < CANVAS_HEIGHT + 30) {
        const pulse = Math.sin(powerUp.animation) * 0.3 + 0.7;
        
        ctx.save();
        ctx.translate(powerUp.x, screenY);
        ctx.scale(pulse, pulse);
        
        // Power-up glow
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
        glowGradient.addColorStop(0, '#00FF0080');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(-25, -25, 50, 50);
        
        // Power-up icon
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(-15, -15, 30, 30);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const icons = {
          speed: '⚡',
          shield: '🛡️',
          jump: '🦘',
          freeze: '❄️',
          teleport: '🌀',
          extra_life: '❤️'
        };
        
        ctx.fillText(icons[powerUp.type], 0, 0);
        ctx.restore();
      }
    });

    // Draw players
    players.forEach(p => {
      const screenY = p.y - camera.y;
      
      ctx.save();
      ctx.translate(p.x, screenY);
      
      // Invulnerability effect
      if (p.invulnerable) {
        ctx.globalAlpha = Math.sin(currentTime * 0.02) * 0.3 + 0.7;
      }
      
      // Shield effect
      if (p.powerUps.includes('shield')) {
        const shieldGradient = ctx.createRadialGradient(0, 0, 15, 0, 0, 25);
        shieldGradient.addColorStop(0, 'rgba(0,255,255,0.5)');
        shieldGradient.addColorStop(1, 'rgba(0,255,255,0)');
        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Player shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(3, 3, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Player body (different styles)
      ctx.fillStyle = p.color;
      if (p.style === 'chicken') {
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(12, -5);
        ctx.lineTo(20, 0);
        ctx.lineTo(12, 5);
        ctx.closePath();
        ctx.fill();
        
        // Comb
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-5, -20, 10, 8);
      }
      
      // Player name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, 0, -30);
      
      // Lives indicator
      ctx.fillStyle = '#FF0000';
      for (let i = 0; i < p.lives; i++) {
        ctx.fillText('❤️', -10 + i * 8, -40);
      }
      
      ctx.restore();
    });

    // Draw particles
    particles.forEach(particle => {
      const screenY = particle.y - camera.y;
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.translate(particle.x, screenY);
      
      if (particle.type === 'feather') {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, particle.size, particle.size * 2, Math.PI/4, 0, Math.PI * 2);
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
  }, [players, vehicles, logs, powerUps, particles, camera, weather, updateFPS]);

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
    setTimeElapsed(0);
    setDifficulty(1);
    setWeather('sunny');
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setVehicles([]);
    setLogs([]);
    setPowerUps([]);
    setParticles([]);
    setCamera({ y: 0, shake: 0 });
    setTimeElapsed(0);
    setDifficulty(1);
    
    // Reset players
    setPlayers(prev => prev.map(p => ({
      ...p,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      lives: 3,
      score: 0,
      powerUps: [],
      invulnerable: false,
      checkpoints: 0,
      deaths: 0
    })));
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>🐔 Enhanced Chicken Run</h2>
        <div style={statsStyle}>
          <div>Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</div>
          <div>Difficulty: {difficulty}</div>
          <div>Weather: {weather}</div>
          <div>FPS: {fps}</div>
          <div>Room: {roomCode}</div>
        </div>
      </div>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>🎮 Ready to Cross?</h3>
          <p>Navigate through traffic and rivers to reach the finish line!</p>
          <p>Use WASD to move, avoid vehicles, ride logs across water!</p>
          <p>Collect power-ups and reach checkpoints for bonus points!</p>
          <button onClick={startGame} style={buttonStyle}>Start Crossing!</button>
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
          </div>

          <div style={scoreboardStyle}>
            {players.map(p => (
              <div key={p.id} style={{
                ...playerStatStyle,
                backgroundColor: p.id === player ? p.color + '40' : p.color + '20'
              }}>
                <div style={playerNameStyle}>{p.name} {p.id === player && '(You)'}</div>
                <div>Lives: {p.lives} ❤️</div>
                <div>Score: {p.score}</div>
                <div>Checkpoints: {p.checkpoints}</div>
                <div>Deaths: {p.deaths}</div>
                <div>Power-ups: {p.powerUps.length}</div>
              </div>
            ))}
          </div>

          <div style={controlsStyle}>
            <p>Use WASD to move your chicken!</p>
            <p>Avoid vehicles, ride logs, collect power-ups!</p>
            <p>Reach the golden finish line to win!</p>
          </div>
        </>
      )}

      {gameOver && (
        <div style={gameOverStyle}>
          <h3>🏆 Race Complete!</h3>
          <p>{winner === 'Game Over' ? '💀 Game Over!' : `🎉 Winner: ${winner}!`}</p>
          <div style={finalScoresStyle}>
            {players.map(p => (
              <div key={p.id}>
                {p.name}: {p.score} points ({p.checkpoints} checkpoints, {p.deaths} deaths)
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
  background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
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
  background: 'rgba(0,0,0,0.1)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
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

export default ChickenRun;
