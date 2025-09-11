
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  role: 'crewmate' | 'spy';
  isAlive: boolean;
  votedFor: string | null;
  hasVoted: boolean;
  tasks: Task[];
  completedTasks: number;
  totalTasks: number;
  sabotageActions: number;
  lastSeen: { x: number; y: number; time: number } | null;
  suspicionLevel: number;
  alibi: string[];
}

interface Task {
  id: string;
  type: 'wiring' | 'fuel' | 'download' | 'calibrate' | 'scan' | 'trash' | 'reactor';
  location: { x: number; y: number };
  completed: boolean;
  progress: number;
  timeToComplete: number;
}

interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  tasks: Task[];
  exits: { x: number; y: number; width: number; height: number }[];
  isSabotaged: boolean;
  lights: boolean;
}

interface Meeting {
  active: boolean;
  timeLeft: number;
  phase: 'discussion' | 'voting' | 'results';
  calledBy: string;
  reason: string;
  votes: Record<string, string>;
  discussionMessages: { player: string; message: string; time: number }[];
}

interface Sabotage {
  type: 'lights' | 'reactor' | 'doors' | 'comms';
  active: boolean;
  timeLeft: number;
  location: { x: number; y: number };
  severity: number;
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
  type: 'spark' | 'blood' | 'task' | 'sabotage';
}

const SpyHunt: React.FC<{ roomCode: string; player: string }> = ({ roomCode, player }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gamePhase, setGamePhase] = useState<'lobby' | 'playing' | 'meeting' | 'results'>('lobby');
  const [players, setPlayers] = useState<Player[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [meeting, setMeeting] = useState<Meeting>({
    active: false,
    timeLeft: 120,
    phase: 'discussion',
    calledBy: '',
    reason: '',
    votes: {},
    discussionMessages: []
  });
  const [sabotages, setSabotages] = useState<Sabotage[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [camera, setCamera] = useState({ x: 400, y: 300, shake: 0 });
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskProgress, setTaskProgress] = useState(0);
  const [winner, setWinner] = useState<string>('');
  const [killCooldown, setKillCooldown] = useState(0);
  const [sabotageCooldown, setSabotageCooldown] = useState(0);
  const [visionRadius, setVisionRadius] = useState(100);
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [fps, setFps] = useState(60);

  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 700;
  const PLAYER_SIZE = 25;
  const MOVE_SPEED = 3;

  // Initialize game
  useEffect(() => {
    const playerColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    const playerNames = ['Red', 'Cyan', 'Blue', 'Green', 'Yellow', 'Pink', 'Orange'];
    
    // Create rooms
    const gameRooms: Room[] = [
      {
        id: 'cafeteria',
        name: 'Cafeteria',
        x: 50,
        y: 50,
        width: 200,
        height: 150,
        color: '#8FBC8F',
        tasks: [],
        exits: [{ x: 250, y: 100, width: 20, height: 50 }],
        isSabotaged: false,
        lights: true
      },
      {
        id: 'admin',
        name: 'Admin',
        x: 300,
        y: 50,
        width: 150,
        height: 100,
        color: '#FFB6C1',
        tasks: [],
        exits: [{ x: 280, y: 150, width: 50, height: 20 }],
        isSabotaged: false,
        lights: true
      },
      {
        id: 'storage',
        name: 'Storage',
        x: 500,
        y: 50,
        width: 120,
        height: 120,
        color: '#DDA0DD',
        tasks: [],
        exits: [{ x: 480, y: 170, width: 50, height: 20 }],
        isSabotaged: false,
        lights: true
      },
      {
        id: 'electrical',
        name: 'Electrical',
        x: 50,
        y: 250,
        width: 150,
        height: 100,
        color: '#F0E68C',
        tasks: [],
        exits: [{ x: 200, y: 280, width: 20, height: 50 }],
        isSabotaged: false,
        lights: true
      },
      {
        id: 'reactor',
        name: 'Reactor',
        x: 300,
        y: 200,
        width: 180,
        height: 140,
        color: '#FF6347',
        tasks: [],
        exits: [{ x: 280, y: 300, width: 50, height: 20 }],
        isSabotaged: false,
        lights: true
      },
      {
        id: 'medbay',
        name: 'Medbay',
        x: 550,
        y: 250,
        width: 140,
        height: 120,
        color: '#87CEEB',
        tasks: [],
        exits: [{ x: 530, y: 320, width: 50, height: 20 }],
        isSabotaged: false,
        lights: true
      }
    ];

    // Create tasks for each room
    gameRooms.forEach(room => {
      const taskCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < taskCount; i++) {
        room.tasks.push({
          id: `${room.id}_task_${i}`,
          type: ['wiring', 'fuel', 'download', 'calibrate', 'scan', 'trash', 'reactor'][Math.floor(Math.random() * 7)] as Task['type'],
          location: {
            x: room.x + Math.random() * (room.width - 30) + 15,
            y: room.y + Math.random() * (room.height - 30) + 15
          },
          completed: false,
          progress: 0,
          timeToComplete: 3000
        });
      }
    });

    setRooms(gameRooms);

    // Initialize players
    const spyCount = Math.max(1, Math.floor(2 * 0.25)); // 25% spies
    const initialPlayers: Player[] = [];

    const playerCount = 6; // Simulate 6 players
    for (let i = 0; i < playerCount; i++) {
      const isMainPlayer = i === 0;
      const playerId = isMainPlayer ? player : `bot_${i}`;
      const isSpy = i < spyCount;
      
      // Assign tasks to crewmates
      const playerTasks: Task[] = [];
      if (!isSpy) {
        gameRooms.forEach(room => {
          room.tasks.forEach(task => {
            if (Math.random() < 0.4) { // 40% chance to get each task
              playerTasks.push({ ...task });
            }
          });
        });
      }

      initialPlayers.push({
        id: playerId,
        name: isMainPlayer ? `Player ${player}` : playerNames[i % playerNames.length],
        x: 150 + i * 30,
        y: 125,
        color: playerColors[i % playerColors.length],
        role: isSpy ? 'spy' : 'crewmate',
        isAlive: true,
        votedFor: null,
        hasVoted: false,
        tasks: playerTasks,
        completedTasks: 0,
        totalTasks: playerTasks.length,
        sabotageActions: 0,
        lastSeen: null,
        suspicionLevel: 0,
        alibi: []
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

  // Add particles
  const addParticles = useCallback((x: number, y: number, color: string, type: Particle['type'] = 'spark', count: number = 5) => {
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
          vy: p.vy + 0.1
        }))
        .filter(p => p.life > 0)
      );
    };

    const interval = setInterval(updateParticles, 16);
    return () => clearInterval(interval);
  }, [particles]);

  // Game timers and cooldowns
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      if (killCooldown > 0) setKillCooldown(prev => prev - 1);
      if (sabotageCooldown > 0) setSabotageCooldown(prev => prev - 1);

      // Update meeting timer
      if (meeting.active) {
        setMeeting(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            if (prev.phase === 'discussion') {
              return { ...prev, phase: 'voting', timeLeft: 30 };
            } else if (prev.phase === 'voting') {
              return { ...prev, phase: 'results', timeLeft: 10 };
            } else {
              // End meeting
              return {
                active: false,
                timeLeft: 120,
                phase: 'discussion',
                calledBy: '',
                reason: '',
                votes: {},
                discussionMessages: []
              };
            }
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }

      // Update sabotages
      setSabotages(prev => prev.map(s => ({
        ...s,
        timeLeft: s.timeLeft - 1
      })).filter(s => s.timeLeft > 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, meeting.active, killCooldown, sabotageCooldown]);

  // Bot AI behavior
  useEffect(() => {
    if (!gameStarted || gameOver || meeting.active) return;

    const botBehavior = () => {
      setPlayers(prev => prev.map(p => {
        if (p.id === player || !p.isAlive) return p;

        // Random movement for bots
        const moveX = (Math.random() - 0.5) * 4;
        const moveY = (Math.random() - 0.5) * 4;
        
        let newX = Math.max(20, Math.min(CANVAS_WIDTH - 20, p.x + moveX));
        let newY = Math.max(20, Math.min(CANVAS_HEIGHT - 20, p.y + moveY));

        // Bot task completion (crewmates)
        if (p.role === 'crewmate' && Math.random() < 0.001) {
          const incompleteTasks = p.tasks.filter(t => !t.completed);
          if (incompleteTasks.length > 0) {
            const taskToComplete = incompleteTasks[0];
            taskToComplete.completed = true;
            addParticles(newX, newY, p.color, 'task', 3);
            return {
              ...p,
              x: newX,
              y: newY,
              completedTasks: p.completedTasks + 1,
              tasks: p.tasks.map(t => t.id === taskToComplete.id ? taskToComplete : t)
            };
          }
        }

        // Bot killing behavior (spies)
        if (p.role === 'spy' && Math.random() < 0.0005) {
          const nearbyCrewmates = prev.filter(other => 
            other.id !== p.id && 
            other.isAlive && 
            other.role === 'crewmate' &&
            Math.sqrt(Math.pow(other.x - newX, 2) + Math.pow(other.y - newY, 2)) < 50
          );
          
          if (nearbyCrewmates.length > 0) {
            const target = nearbyCrewmates[0];
            // Kill target
            addParticles(target.x, target.y, '#FF0000', 'blood', 10);
            setCamera(prev => ({ ...prev, shake: 10 }));
            
            // Update target
            setPlayers(prevPlayers => prevPlayers.map(pl => 
              pl.id === target.id ? { ...pl, isAlive: false } : pl
            ));
          }
        }

        return { ...p, x: newX, y: newY };
      }));
    };

    const interval = setInterval(botBehavior, 100);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, meeting.active, player, addParticles]);

  // Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
      
      // Emergency meeting
      if (e.key.toLowerCase() === 'r' && !meeting.active) {
        callEmergencyMeeting('Emergency button pressed');
      }
      
      // Kill (spy only)
      if (e.key.toLowerCase() === 'q') {
        const currentPlayer = players.find(p => p.id === player);
        if (currentPlayer?.role === 'spy' && killCooldown <= 0) {
          attemptKill();
        }
      }
      
      // Sabotage (spy only)
      if (e.key.toLowerCase() === 'e') {
        const currentPlayer = players.find(p => p.id === player);
        if (currentPlayer?.role === 'spy' && sabotageCooldown <= 0) {
          performSabotage();
        }
      }
      
      // Use/Fix (crewmate task interaction)
      if (e.key.toLowerCase() === 'f') {
        interactWithTask();
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
  }, [players, player, meeting.active, killCooldown, sabotageCooldown]);

  // Player movement
  useEffect(() => {
    if (!gameStarted || gameOver || meeting.active) return;

    const movePlayer = () => {
      setPlayers(prev => prev.map(p => {
        if (p.id !== player || !p.isAlive) return p;

        let newX = p.x;
        let newY = p.y;

        // Enhanced WASD Movement Controls
        if (keys['a'] || keys['arrowleft']) newX = Math.max(PLAYER_SIZE, p.x - MOVE_SPEED);
        if (keys['d'] || keys['arrowright']) newX = Math.min(CANVAS_WIDTH - PLAYER_SIZE, p.x + MOVE_SPEED);
        if (keys['w'] || keys['arrowup']) newY = Math.max(PLAYER_SIZE, p.y - MOVE_SPEED);
        if (keys['s'] || keys['arrowdown']) newY = Math.min(CANVAS_HEIGHT - PLAYER_SIZE, p.y + MOVE_SPEED);

        // Update camera to follow player
        setCamera(prev => ({
          ...prev,
          x: newX,
          y: newY
        }));

        // Update player's alibi
        const currentRoom = rooms.find(room => 
          newX >= room.x && newX <= room.x + room.width &&
          newY >= room.y && newY <= room.y + room.height
        );

        if (currentRoom) {
          const alibi = `Was in ${currentRoom.name} at ${Date.now()}`;
          return {
            ...p,
            x: newX,
            y: newY,
            lastSeen: { x: newX, y: newY, time: Date.now() },
            alibi: [alibi, ...p.alibi].slice(0, 5) // Keep last 5 alibis
          };
        }

        return { ...p, x: newX, y: newY };
      }));
    };

    const interval = setInterval(movePlayer, 16);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, meeting.active, keys, player, rooms]);

  // Game actions
  const callEmergencyMeeting = (reason: string) => {
    setMeeting({
      active: true,
      timeLeft: 120,
      phase: 'discussion',
      calledBy: player,
      reason,
      votes: {},
      discussionMessages: []
    });
    setGamePhase('meeting');
  };

  const attemptKill = () => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || currentPlayer.role !== 'spy') return;

    const nearbyPlayers = players.filter(p => 
      p.id !== player && 
      p.isAlive &&
      p.role === 'crewmate' &&
      Math.sqrt(Math.pow(p.x - currentPlayer.x, 2) + Math.pow(p.y - currentPlayer.y, 2)) < 40
    );

    if (nearbyPlayers.length > 0) {
      const target = nearbyPlayers[0];
      setPlayers(prev => prev.map(p => 
        p.id === target.id ? { ...p, isAlive: false } : p
      ));
      addParticles(target.x, target.y, '#FF0000', 'blood', 15);
      setKillCooldown(25);
      setCamera(prev => ({ ...prev, shake: 15 }));
    }
  };

  const performSabotage = () => {
    const sabotageTypes: Sabotage['type'][] = ['lights', 'reactor', 'doors', 'comms'];
    const type = sabotageTypes[Math.floor(Math.random() * sabotageTypes.length)];
    
    const newSabotage: Sabotage = {
      type,
      active: true,
      timeLeft: type === 'reactor' ? 30 : 60,
      location: { x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT },
      severity: type === 'reactor' ? 3 : 1
    };

    setSabotages(prev => [...prev, newSabotage]);
    setSabotageCooldown(20);
    
    if (type === 'lights') {
      setVisionRadius(50);
      setTimeout(() => setVisionRadius(100), 15000);
    }
    
    addParticles(newSabotage.location.x, newSabotage.location.y, '#FF4444', 'sabotage', 12);
  };

  const interactWithTask = () => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || currentPlayer.role !== 'crewmate') return;

    // Find nearby tasks
    const nearbyTasks = currentPlayer.tasks.filter(task => {
      if (task.completed) return false;
      const distance = Math.sqrt(
        Math.pow(task.location.x - currentPlayer.x, 2) + 
        Math.pow(task.location.y - currentPlayer.y, 2)
      );
      return distance < 40;
    });

    if (nearbyTasks.length > 0) {
      const task = nearbyTasks[0];
      setCurrentTask(task);
      setTaskProgress(0);
    }
  };

  // Task completion
  useEffect(() => {
    if (!currentTask) return;

    const completeTask = () => {
      setTaskProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= 100) {
          // Task completed
          setPlayers(prev => prev.map(p => {
            if (p.id !== player) return p;
            const updatedTasks = p.tasks.map(t => 
              t.id === currentTask.id ? { ...t, completed: true } : t
            );
            return {
              ...p,
              tasks: updatedTasks,
              completedTasks: p.completedTasks + 1
            };
          }));
          addParticles(currentTask.location.x, currentTask.location.y, '#00FF00', 'task', 8);
          setCurrentTask(null);
          return 0;
        }
        return newProgress;
      });
    };

    const interval = setInterval(completeTask, 50);
    return () => clearInterval(interval);
  }, [currentTask, player]);

  // Win condition check
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const alivePlayers = players.filter(p => p.isAlive);
    const aliveCrewmates = alivePlayers.filter(p => p.role === 'crewmate');
    const aliveSpies = alivePlayers.filter(p => p.role === 'spy');

    // Spies win if equal or more than crewmates
    if (aliveSpies.length >= aliveCrewmates.length && aliveSpies.length > 0) {
      setGameOver(true);
      setWinner('Spies Win!');
    }
    // Crewmates win if all spies eliminated
    else if (aliveSpies.length === 0) {
      setGameOver(true);
      setWinner('Crewmates Win!');
    }
    // Crewmates win if all tasks completed
    else if (aliveCrewmates.every(p => p.completedTasks >= p.totalTasks)) {
      setGameOver(true);
      setWinner('Crewmates Win! All tasks completed!');
    }
  }, [players, gameStarted, gameOver]);

  // Render game
  const render = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updateFPS(currentTime);

    // Clear canvas with space background
    const gradient = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73) % CANVAS_WIDTH;
      const y = (i * 109) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }

    // Apply camera shake
    ctx.save();
    ctx.translate(
      Math.random() * camera.shake - camera.shake/2,
      Math.random() * camera.shake - camera.shake/2
    );

    // Draw rooms
    rooms.forEach(room => {
      // Room shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(room.x + 5, room.y + 5, room.width, room.height);
      
      // Room body
      ctx.fillStyle = room.lights ? room.color : room.color + '40';
      ctx.fillRect(room.x, room.y, room.width, room.height);
      
      // Room border
      ctx.strokeStyle = '#ffffff40';
      ctx.lineWidth = 2;
      ctx.strokeRect(room.x, room.y, room.width, room.height);
      
      // Room name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, room.x + room.width/2, room.y + 20);
      
      // Draw exits
      room.exits.forEach(exit => {
        ctx.fillStyle = '#333333';
        ctx.fillRect(exit.x, exit.y, exit.width, exit.height);
      });
      
      // Draw tasks in room
      room.tasks.forEach(task => {
        if (!task.completed) {
          const pulse = Math.sin(currentTime * 0.005) * 0.3 + 0.7;
          ctx.save();
          ctx.translate(task.location.x, task.location.y);
          ctx.scale(pulse, pulse);
          
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      });
    });

    // Draw sabotages
    sabotages.forEach(sabotage => {
      const pulse = Math.sin(currentTime * 0.01) * 0.5 + 0.5;
      ctx.save();
      ctx.translate(sabotage.location.x, sabotage.location.y);
      ctx.scale(pulse, pulse);
      
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️', 0, 5);
      ctx.restore();
    });

    // Draw players with vision limits
    const currentPlayer = players.find(p => p.id === player);
    if (currentPlayer) {
      // Draw vision circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(currentPlayer.x, currentPlayer.y, visionRadius, 0, Math.PI * 2);
      ctx.clip();
      
      players.forEach(p => {
        if (!p.isAlive) {
          // Draw dead body
          ctx.fillStyle = 'rgba(255,0,0,0.8)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, PLAYER_SIZE, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('💀', p.x, p.y + 5);
          return;
        }
        
        // Player shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(p.x + 3, p.y + 3, PLAYER_SIZE, 0, Math.PI * 2);
        ctx.fill();
        
        // Player body
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PLAYER_SIZE, 0, Math.PI * 2);
        ctx.fill();
        
        // Player outline
        ctx.strokeStyle = p.id === player ? '#FFFFFF' : 'rgba(255,255,255,0.6)';
        ctx.lineWidth = p.id === player ? 3 : 2;
        ctx.stroke();
        
        // Player visor
        ctx.fillStyle = 'rgba(200,200,255,0.8)';
        ctx.beginPath();
        ctx.arc(p.x + 8, p.y - 5, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Player name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, p.x, p.y - 35);
        
        // Role indicator (only for current player)
        if (p.id === player) {
          ctx.fillStyle = p.role === 'spy' ? '#FF0000' : '#00FF00';
          ctx.font = 'bold 10px Arial';
          ctx.fillText(p.role.toUpperCase(), p.x, p.y + 35);
        }
      });
      
      ctx.restore();
    }

    // Draw particles
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life;
      
      if (particle.type === 'blood') {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
      }
      
      ctx.restore();
    });

    // Draw current task progress
    if (currentTask) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(CANVAS_WIDTH/2 - 150, 50, 300, 60);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Completing ${currentTask.type}...`, CANVAS_WIDTH/2, 75);
      
      // Progress bar
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(CANVAS_WIDTH/2 - 100, 85, 200, 15);
      
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(CANVAS_WIDTH/2 - 100, 85, (taskProgress / 100) * 200, 15);
    }

    ctx.restore();

    // Reduce camera shake
    if (camera.shake > 0) {
      setCamera(prev => ({ ...prev, shake: prev.shake * 0.9 }));
    }

    animationRef.current = requestAnimationFrame(render);
  }, [players, rooms, sabotages, particles, currentTask, taskProgress, camera, visionRadius, updateFPS, player]);

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
    setGamePhase('playing');
    setWinner('');
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setGamePhase('lobby');
    setWinner('');
    setMeeting({
      active: false,
      timeLeft: 120,
      phase: 'discussion',
      calledBy: '',
      reason: '',
      votes: {},
      discussionMessages: []
    });
    setSabotages([]);
    setParticles([]);
    setCamera({ x: 400, y: 300, shake: 0 });
    setCurrentTask(null);
    setKillCooldown(0);
    setSabotageCooldown(0);
    setVisionRadius(100);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>🕵️ Enhanced Spy Hunt</h2>
        <div style={statsStyle}>
          <div>FPS: {fps}</div>
          <div>Room: {roomCode}</div>
          {gameStarted && (
            <>
              <div>Kill CD: {killCooldown}s</div>
              <div>Sabotage CD: {sabotageCooldown}s</div>
            </>
          )}
        </div>
      </div>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>🎮 Ready for Espionage?</h3>
          <p>Work together as crewmates or sabotage as a spy!</p>
          <p>Complete tasks, report bodies, call meetings, and vote!</p>
          <div style={controlsStyle}>
            <p><strong>Controls:</strong></p>
            <p>WASD - Move | F - Use/Fix | R - Emergency Meeting</p>
            <p>Q - Kill (Spy only) | E - Sabotage (Spy only)</p>
          </div>
          <button onClick={startGame} style={buttonStyle}>Start Mission!</button>
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
            
            {/* Game UI overlay */}
            <div style={uiOverlayStyle}>
              <div style={taskCounterStyle}>
                Tasks: {players.find(p => p.id === player)?.completedTasks || 0} / {players.find(p => p.id === player)?.totalTasks || 0}
              </div>
              
              {meeting.active && (
                <div style={meetingStyle}>
                  <h3>Emergency Meeting</h3>
                  <p>Called by: {meeting.calledBy}</p>
                  <p>Reason: {meeting.reason}</p>
                  <p>Time left: {meeting.timeLeft}s</p>
                  <p>Phase: {meeting.phase}</p>
                </div>
              )}
              
              {sabotages.length > 0 && (
                <div style={sabotageAlertStyle}>
                  {sabotages.map(s => (
                    <div key={s.type}>
                      ⚠️ {s.type.toUpperCase()} SABOTAGE - {s.timeLeft}s
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={scoreboardStyle}>
            {players.map(p => (
              <div key={p.id} style={{
                ...playerStatStyle,
                backgroundColor: p.id === player ? p.color + '40' : p.color + '20',
                opacity: p.isAlive ? 1 : 0.5
              }}>
                <div style={playerNameStyle}>{p.name} {p.id === player && '(You)'}</div>
                <div>Status: {p.isAlive ? '✅ Alive' : '💀 Dead'}</div>
                {p.role === 'crewmate' && <div>Tasks: {p.completedTasks}/{p.totalTasks}</div>}
                {p.role === 'spy' && p.id === player && <div>Role: 🔪 SPY</div>}
                <div>Suspicion: {p.suspicionLevel}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {gameOver && (
        <div style={gameOverStyle}>
          <h3>🏆 Mission Complete!</h3>
          <p>{winner}</p>
          <div style={finalScoresStyle}>
            <h4>Final Status:</h4>
            {players.map(p => (
              <div key={p.id} style={{ color: p.role === 'spy' ? '#ff6b6b' : '#4ecdc4' }}>
                {p.name}: {p.role} - {p.isAlive ? 'Survived' : 'Eliminated'}
                {p.role === 'crewmate' && ` (${p.completedTasks}/${p.totalTasks} tasks)`}
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
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
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
  fontSize: '14px'
};

const menuStyle: React.CSSProperties = {
  textAlign: 'center',
  background: 'rgba(0,0,0,0.7)',
  padding: '30px',
  borderRadius: '15px',
  backdropFilter: 'blur(20px)',
  maxWidth: '500px'
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
  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
};

const uiOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  left: '10px',
  pointerEvents: 'none'
};

const taskCounterStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.7)',
  padding: '10px',
  borderRadius: '8px',
  color: 'white',
  marginBottom: '10px'
};

const meetingStyle: React.CSSProperties = {
  background: 'rgba(255,0,0,0.8)',
  padding: '15px',
  borderRadius: '10px',
  color: 'white',
  marginBottom: '10px'
};

const sabotageAlertStyle: React.CSSProperties = {
  background: 'rgba(255,100,0,0.8)',
  padding: '10px',
  borderRadius: '8px',
  color: 'white'
};

const scoreboardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px',
  marginBottom: '20px',
  width: '100%',
  maxWidth: '1000px'
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
  backgroundColor: '#6366f1',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
};

export default SpyHunt;
