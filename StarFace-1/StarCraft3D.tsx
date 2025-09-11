import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './StarCraft3D.css';

interface Player {
  id: string;
  x: number;
  y: number;
  z: number;
  name: string;
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  xp: number;
  level: number;
  oxygen: number;
  armor: number;
  gameMode: 'survival' | 'creative' | 'adventure' | 'spectator';
  rotationY: number; // Player rotation
}

interface Block {
  type: string;
  x: number;
  y: number;
  z: number;
  durability?: number;
}

interface Camera {
  mode: 'first_person' | 'third_person_back' | 'third_person_front';
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  distance: number; // For third person
}

interface Mob {
  id: string;
  type: 'zombie' | 'skeleton' | 'spider' | 'creeper' | 'cow' | 'pig' | 'sheep' | 'chicken' |
        'horse' | 'wolf' | 'cat' | 'enderman' | 'witch' | 'phantom' | 'iron_golem' |
        'villager' | 'bee' | 'warden' | 'ender_dragon' | 'blaze' | 'ghast' | 'piglin' |
        'hoglin' | 'strider' | 'axolotl' | 'glow_squid' | 'goat' | 'allay' | 'wither';
  x: number;
  y: number;
  z: number;
  health: number;
  hostile: boolean;
  aiState: 'idle' | 'wander' | 'chase' | 'flee' | 'attack' | 'defend' | 'trade';
}

interface Structure {
  type: string;
  x: number;
  z: number;
  loot: { [key: string]: number };
}

interface GameState {
  players: Player[];
  blocks: Block[];
  mobs: Mob[];
  selectedTool: string;
  inventory: { [key: string]: number };
  time: number;
  weather: 'clear' | 'rain' | 'thunder';
  dimension: 'overworld' | 'nether' | 'end';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  biome: string;
  structures: Structure[];
  redstoneCircuits: Array<{id: string, powered: boolean, components: any[]}>;
  fps: number;
  lastSave: number;
}

const StarCraft3D: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [camera, setCamera] = useState<Camera>({
    mode: 'first_person',
    x: 0,
    y: 70,
    z: 0,
    rotationX: 0,
    rotationY: 0,
    distance: 4
  });

  // State for managing pressed keys
  const [keys, setKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
  });

  const [gameState, setGameState] = useState<GameState>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('starcraft3d-gamestate');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        return { ...parsedState, fps: 0, lastSave: Date.now() };
      } catch (e) {
        console.warn('Failed to load saved game state');
      }
    }

    return {
      players: [{
        id: 'player1',
        x: 0,
        y: 70,
        z: 0,
        name: 'Player',
        health: 20,
        maxHealth: 20,
        hunger: 20,
        maxHunger: 20,
        xp: 0,
        level: 0,
        oxygen: 20,
        armor: 0,
        gameMode: 'survival',
        rotationY: 0
      }],
      blocks: initializeWorld(),
      mobs: generateMobs(),
      selectedTool: 'hand',
      inventory: {
        'oak_wood': 15,
        'stone': 12,
        'dirt': 25,
        'coal': 8,
        'iron': 5,
        'gold': 2,
        'diamond': 1,
        'bread': 8,
        'apple': 3,
        'beef': 4,
        'wooden_pickaxe': 1,
        'wooden_sword': 1,
        'wooden_axe': 1,
        'wooden_shovel': 1,
        'stick': 10,
        'torch': 20,
        'cobblestone': 30,
      },
      time: 6000,
      weather: 'clear',
      dimension: 'overworld',
      season: 'spring',
      biome: getBiomeAt(0, 0),
      structures: generateStructures(),
      redstoneCircuits: [],
      fps: 0,
      lastSave: Date.now()
    };
  });

  const [showInventory, setShowInventory] = useState(false);
  const [showCrafting, setShowCrafting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Update camera position based on player and camera mode
  useEffect(() => {
    const player = gameState.players[0];
    if (!player) return;

    setCamera(prev => {
      const newCamera = { ...prev };

      switch (prev.mode) {
        case 'first_person':
          newCamera.x = player.x;
          newCamera.y = player.y + 1.6; // Eye level
          newCamera.z = player.z;
          break;

        case 'third_person_back':
          const backOffsetX = Math.sin(player.rotationY) * prev.distance;
          const backOffsetZ = Math.cos(player.rotationY) * prev.distance;
          newCamera.x = player.x - backOffsetX;
          newCamera.y = player.y + 2;
          newCamera.z = player.z - backOffsetZ;
          break;

        case 'third_person_front':
          const frontOffsetX = Math.sin(player.rotationY) * prev.distance;
          const frontOffsetZ = Math.cos(player.rotationY) * prev.distance;
          newCamera.x = player.x + frontOffsetX;
          newCamera.y = player.y + 2;
          newCamera.z = player.z + frontOffsetZ;
          break;
      }

      return newCamera;
    });
  }, [gameState.players]);

  // Simulate loading process
  useEffect(() => {
    const loadingSteps = [
      { name: "Initializing 3D Engine", duration: 800 },
      { name: "Loading Textures", duration: 1200 },
      { name: "Generating World", duration: 1500 },
      { name: "Connecting to Server", duration: 600 },
      { name: "Loading Player Data", duration: 400 }
    ];

    let currentStep = 0;
    let currentProgress = 0;

    const loadNext = () => {
      if (currentStep >= loadingSteps.length) {
        setLoading(false);
        return;
      }

      const step = loadingSteps[currentStep];
      const increment = 100 / loadingSteps.length;

      setTimeout(() => {
        currentProgress += increment;
        setLoadingProgress(currentProgress);
        currentStep++;
        loadNext();
      }, step.duration);
    };

    loadNext();
  }, []);

  // 3D Projection and rendering
  const project3D = (x: number, y: number, z: number, camera: Camera, canvas: HTMLCanvasElement) => {
    const fov = 70 * Math.PI / 180; // Field of view
    const aspect = canvas.width / canvas.height;

    // Translate to camera space
    const dx = x - camera.x;
    const dy = y - camera.y;
    const dz = z - camera.z;

    // Apply camera rotation
    const cosY = Math.cos(camera.rotationY);
    const sinY = Math.sin(camera.rotationY);
    const cosX = Math.cos(camera.rotationX);
    const sinX = Math.sin(camera.rotationX);

    // Rotate around Y axis (horizontal)
    const rotatedX = dx * cosY - dz * sinY;
    const rotatedZ = dx * sinY + dz * cosY;

    // Rotate around X axis (vertical)
    const finalY = dy * cosX - rotatedZ * sinX;
    const finalZ = dy * sinX + rotatedZ * cosX;

    // Prevent division by zero
    if (finalZ <= 0.1) return null;

    // Project to screen space
    const screenX = (rotatedX / finalZ) / Math.tan(fov / 2) * canvas.width / 2 + canvas.width / 2;
    const screenY = (finalY / finalZ) / Math.tan(fov / 2) * canvas.height / 2 * aspect + canvas.height / 2;

    return {
      x: screenX,
      y: screenY,
      z: finalZ,
      distance: Math.sqrt(dx * dx + dy * dy + dz * dz)
    };
  };

  // Enhanced block drawing with detailed textures and lighting
  const drawBlock = (ctx: CanvasRenderingContext2D, block: Block, camera: Camera, canvas: HTMLCanvasElement) => {
    const size = 1; // Block size
    const corners = [];

    // Define 8 corners of the cube
    for (let i = 0; i < 8; i++) {
      const x = block.x + (i & 1 ? size : 0);
      const y = block.y + (i & 2 ? size : 0);
      const z = block.z + (i & 4 ? size : 0);

      const projected = project3D(x, y, z, camera, canvas);
      if (projected) {
        corners.push(projected);
      } else {
        return; // Skip if any corner is behind camera
      }
    }

    // Get enhanced block colors and properties
    const colors = getBlockColors(block.type);
    const distance = Math.sqrt((block.x - camera.x)**2 + (block.y - camera.y)**2 + (block.z - camera.z)**2);

    // Calculate lighting based on sun position and time
    const sunAngle = (gameState.time / 24000) * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const lightIntensity = Math.max(0.3, sunHeight);

    // Draw faces (back to front for proper depth)
    const faces = [
      { indices: [0, 1, 3, 2], color: colors.bottom, name: 'bottom', light: 0.6 },
      { indices: [4, 6, 7, 5], color: colors.top, name: 'top', light: 1.0 },
      { indices: [0, 2, 6, 4], color: colors.front, name: 'front', light: 0.9 },
      { indices: [1, 5, 7, 3], color: colors.back, name: 'back', light: 0.7 },
      { indices: [0, 4, 5, 1], color: colors.left, name: 'left', light: 0.8 },
      { indices: [2, 3, 7, 6], color: colors.right, name: 'right', light: 0.8 }
    ];

    // Sort faces by average Z depth (back to front)
    faces.forEach(face => {
      const avgZ = face.indices.reduce((sum, i) => sum + corners[i].z, 0) / 4;
      (face as any).avgZ = avgZ;
    });
    faces.sort((a, b) => (b as any).avgZ - (a as any).avgZ);

    // Draw each face with enhanced textures
    faces.forEach(face => {
      const lightedColor = adjustColorBrightness(face.color, face.light * lightIntensity);

      ctx.fillStyle = lightedColor;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = Math.max(0.5, 2 / distance);

      ctx.beginPath();
      face.indices.forEach((cornerIndex, i) => {
        const corner = corners[cornerIndex];
        if (i === 0) {
          ctx.moveTo(corner.x, corner.y);
        } else {
          ctx.lineTo(corner.x, corner.y);
        }
      });
      ctx.closePath();
      ctx.fill();

      // Add texture patterns
      drawBlockTexture(ctx, face, corners, colors.pattern, block.type);

      // Add glow effect for special blocks
      if (colors.glow) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = lightedColor;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.stroke();
      }
    });

    // Add ambient occlusion effect
    if (distance < 15) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, 0.1 - distance * 0.005)})`;
      ctx.beginPath();
      faces[0].indices.forEach((cornerIndex, i) => {
        const corner = corners[cornerIndex];
        if (i === 0) {
          ctx.moveTo(corner.x, corner.y);
        } else {
          ctx.lineTo(corner.x, corner.y);
        }
      });
      ctx.closePath();
      ctx.fill();
    }
  };

  // Draw detailed block textures
  const drawBlockTexture = (ctx: CanvasRenderingContext2D, face: any, corners: any[], pattern: string, blockType: string) => {
    const faceCorners = face.indices.map((i: number) => corners[i]);

    ctx.save();
    ctx.globalAlpha = 0.6;

    switch (pattern) {
      case 'grass':
        // Draw grass texture with small green dots
        for (let i = 0; i < 3; i++) {
          const x = faceCorners[0].x + Math.random() * (faceCorners[2].x - faceCorners[0].x);
          const y = faceCorners[0].y + Math.random() * (faceCorners[2].y - faceCorners[0].y);
          ctx.fillStyle = '#90EE90';
          ctx.fillRect(x, y, 1, 1);
        }
        break;

      case 'stone':
        // Draw stone cracks
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(faceCorners[0].x + 2, faceCorners[0].y + 2);
        ctx.lineTo(faceCorners[2].x - 2, faceCorners[2].y - 2);
        ctx.stroke();
        break;

      case 'wood':
        // Draw wood grain
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const y = faceCorners[0].y + i * (faceCorners[2].y - faceCorners[0].y) / 3;
          ctx.beginPath();
          ctx.moveTo(faceCorners[0].x, y);
          ctx.lineTo(faceCorners[1].x, y);
          ctx.stroke();
        }
        break;

      case 'water':
        // Animated water ripples
        const time = Date.now() * 0.003;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = faceCorners[0].x; x < faceCorners[2].x; x += 4) {
          const wave = Math.sin(x * 0.1 + time) * 2;
          ctx.moveTo(x, faceCorners[0].y + wave);
          ctx.lineTo(x + 2, faceCorners[0].y + wave);
        }
        ctx.stroke();
        break;

      case 'diamond':
      case 'emerald':
      case 'gold':
        // Sparkle effect for precious blocks
        for (let i = 0; i < 2; i++) {
          const x = faceCorners[0].x + Math.random() * (faceCorners[2].x - faceCorners[0].x);
          const y = faceCorners[0].y + Math.random() * (faceCorners[2].y - faceCorners[0].y);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(x, y, 1, 1);
        }
        break;

      case 'lava':
        // Animated lava bubbles
        const lavaTime = Date.now() * 0.005;
        for (let i = 0; i < 3; i++) {
          const x = faceCorners[0].x + Math.random() * (faceCorners[2].x - faceCorners[0].x);
          const y = faceCorners[0].y + Math.sin(lavaTime + i) * 2;
          ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }

    ctx.restore();
  };

  // Adjust color brightness for lighting
  const adjustColorBrightness = (color: string, factor: number) => {
    const hex = color.replace('#', '');
    const r = Math.min(255, Math.floor(parseInt(hex.substr(0, 2), 16) * factor));
    const g = Math.min(255, Math.floor(parseInt(hex.substr(2, 2), 16) * factor));
    const b = Math.min(255, Math.floor(parseInt(hex.substr(4, 2), 16) * factor));
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Enhanced block textures with detailed patterns and lighting
  const getBlockColors = (blockType: string) => {
    const baseColors: {[key: string]: {top: string, front: string, side: string, pattern?: string, glow?: boolean}} = {
      'grass': {
        top: '#4F7942',
        front: '#8B6F4D',
        side: '#654321',
        pattern: 'grass'
      },
      'dirt': {
        top: '#8B5A2B',
        front: '#8B5A2B',
        side: '#704214',
        pattern: 'dirt'
      },
      'stone': {
        top: '#696969',
        front: '#808080',
        side: '#5F5F5F',
        pattern: 'stone'
      },
      'cobblestone': {
        top: '#7F7F7F',
        front: '#87CEEB',
        side: '#6F6F6F',
        pattern: 'cobblestone'
      },
      'oak_wood': {
        top: '#DEB887',
        front: '#8B4513',
        side: '#A0522D',
        pattern: 'wood'
      },
      'oak_leaves': {
        top: '#228B22',
        front: '#32CD32',
        side: '#006400',
        pattern: 'leaves'
      },
      'sand': {
        top: '#F4A460',
        front: '#F4A460',
        side: '#CD853F',
        pattern: 'sand'
      },
      'water': {
        top: '#00CED1',
        front: '#4682B4',
        side: '#1E90FF',
        pattern: 'water',
        glow: true
      },
      'bedrock': {
        top: '#2F2F2F',
        front: '#2F2F2F',
        side: '#1C1C1C',
        pattern: 'bedrock'
      },
      'diamond': {
        top: '#B9F2FF',
        front: '#87CEEB',
        side: '#4169E1',
        pattern: 'diamond',
        glow: true
      },
      'gold': {
        top: '#FFD700',
        front: '#DAA520',
        side: '#B8860B',
        pattern: 'gold',
        glow: true
      },
      'iron': {
        top: '#C0C0C0',
        front: '#A9A9A9',
        side: '#808080',
        pattern: 'iron'
      },
      'coal': {
        top: '#2F2F2F',
        front: '#1C1C1C',
        side: '#0F0F0F',
        pattern: 'coal'
      },
      'lava': {
        top: '#FF4500',
        front: '#FF6347',
        side: '#DC143C',
        pattern: 'lava',
        glow: true
      },
      'obsidian': {
        top: '#0B0B0B',
        front: '#2F2F4F',
        side: '#191970',
        pattern: 'obsidian'
      },
      'emerald': {
        top: '#50C878',
        front: '#00FF7F',
        side: '#00CED1',
        pattern: 'emerald',
        glow: true
      }
    };

    const colors = baseColors[blockType] || baseColors['stone'];

    return {
      top: colors.top,
      bottom: shadeColor(colors.top, -0.4),
      front: colors.front,
      back: shadeColor(colors.front, -0.3),
      left: colors.side,
      right: shadeColor(colors.side, -0.2),
      pattern: colors.pattern || 'default',
      glow: colors.glow || false
    };
  };

  // Shade color helper
  const shadeColor = (color: string, percent: number) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  // Particle effects system
  const drawParticleEffects = (ctx: CanvasRenderingContext2D, camera: Camera, canvas: HTMLCanvasElement) => {
    const time = Date.now() * 0.001;
    const player = gameState.players[0];

    // Floating magical particles
    for (let i = 0; i < 30; i++) {
      const particleX = player.x + Math.sin(time + i) * 20 + Math.cos(time * 0.5 + i * 0.5) * 10;
      const particleY = player.y + 5 + Math.sin(time * 2 + i * 0.3) * 3;
      const particleZ = player.z + Math.cos(time + i) * 20 + Math.sin(time * 0.7 + i * 0.4) * 10;

      const projected = project3D(particleX, particleY, particleZ, camera, canvas);
      if (projected && projected.distance > 0 && projected.distance < 50) {
        const size = Math.max(1, 4 / projected.distance);
        const alpha = Math.max(0, 1 - projected.distance / 50);

        const colors = ['#FFD700', '#FF69B4', '#00CED1', '#90EE90', '#FF6347'];
        const color = colors[i % colors.length];

        ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.shadowBlur = size * 2;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Environmental effects based on biome
    if (gameState.biome.includes('Snow') || gameState.biome.includes('Ice')) {
      // Snow particles
      for (let i = 0; i < 50; i++) {
        const snowX = player.x + (Math.random() - 0.5) * 100;
        const snowY = player.y + 20 - (time * 10 + i * 0.5) % 25;
        const snowZ = player.z + (Math.random() - 0.5) * 100;

        const projected = project3D(snowX, snowY, snowZ, camera, canvas);
        if (projected && projected.distance > 0 && projected.distance < 80) {
          const size = Math.max(0.5, 2 / projected.distance);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(projected.x, projected.y, size, size);
        }
      }
    }

    if (gameState.weather === 'rain') {
      // Rain drops
      for (let i = 0; i < 100; i++) {
        const rainX = player.x + (Math.random() - 0.5) * 80;
        const rainY = player.y + 30 - (time * 20 + i) % 35;
        const rainZ = player.z + (Math.random() - 0.5) * 80;

        const projected = project3D(rainX, rainY, rainZ, camera, canvas);
        if (projected && projected.distance > 0 && projected.distance < 60) {
          const size = Math.max(0.5, 1 / projected.distance);
          ctx.fillStyle = 'rgba(135, 206, 235, 0.6)';
          ctx.fillRect(projected.x, projected.y, size * 0.5, size * 3);
        }
      }
    }

    // Fireflies at night
    if (gameState.time > 18000 || gameState.time < 6000) {
      for (let i = 0; i < 15; i++) {
        const fireflyX = player.x + Math.sin(time * 0.8 + i * 0.7) * 25;
        const fireflyY = player.y + 2 + Math.sin(time * 1.2 + i * 0.5) * 2;
        const fireflyZ = player.z + Math.cos(time * 0.6 + i * 0.8) * 25;

        const projected = project3D(fireflyX, fireflyY, fireflyZ, camera, canvas);
        if (projected && projected.distance > 0 && projected.distance < 40) {
          const size = Math.max(1, 3 / projected.distance);
          const pulse = Math.sin(time * 3 + i) * 0.5 + 0.5;

          ctx.fillStyle = `rgba(255, 255, 0, ${pulse * 0.8})`;
          ctx.shadowBlur = size * 3;
          ctx.shadowColor = '#FFFF00';
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }
  };

  // Enhanced 3D player model with detailed rendering
  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, camera: Camera, canvas: HTMLCanvasElement, isMainPlayer: boolean = false) => {
    // Don't draw main player in first person mode
    if (isMainPlayer && camera.mode === 'first_person') return;

    const time = Date.now() * 0.003;
    const walkAnimation = Math.sin(time * 4) * 0.1;

    const bodyParts = [
      // Head with face details
      { x: 0, y: 1.6, z: 0, w: 0.5, h: 0.5, d: 0.5, color: '#FFDBAC', type: 'head' },
      // Body with clothing texture
      { x: 0, y: 1.1, z: 0, w: 0.6, h: 0.8, d: 0.3, color: '#2E5BBA', type: 'body' },
      // Arms with movement
      { x: -0.4, y: 1.1 + walkAnimation, z: 0, w: 0.25, h: 0.8, d: 0.25, color: '#FFDBAC', type: 'arm' },
      { x: 0.4, y: 1.1 - walkAnimation, z: 0, w: 0.25, h: 0.8, d: 0.25, color: '#FFDBAC', type: 'arm' },
      // Legs with walking animation
      { x: -0.15, y: 0.5 - walkAnimation, z: 0, w: 0.25, h: 0.8, d: 0.25, color: '#1A4480', type: 'leg' },
      { x: 0.15, y: 0.5 + walkAnimation, z: 0, w: 0.25, h: 0.8, d: 0.25, color: '#1A4480', type: 'leg' },
      // Feet
      { x: -0.15, y: 0.1, z: 0.1, w: 0.3, h: 0.15, d: 0.4, color: '#8B4513', type: 'foot' },
      { x: 0.15, y: 0.1, z: 0.1, w: 0.3, h: 0.15, d: 0.4, color: '#8B4513', type: 'foot' },
    ];

    bodyParts.forEach(part => {
      const worldX = player.x + part.x;
      const worldY = player.y + part.y;
      const worldZ = player.z + part.z;

      const projected = project3D(worldX, worldY, worldZ, camera, canvas);
      if (projected && projected.distance > 0) {
        const size = Math.max(6, 25 / projected.distance);
        const lightFactor = Math.max(0.6, 1 - projected.distance / 50);

        // Main body part
        ctx.fillStyle = adjustColorBrightness(part.color, lightFactor);
        ctx.fillRect(projected.x - size * part.w, projected.y - size * part.h, size * part.w * 2, size * part.h * 2);

        // Add details based on body part type
        switch (part.type) {
          case 'head':
            // Eyes
            ctx.fillStyle = '#000000';
            ctx.fillRect(projected.x - size * 0.15, projected.y - size * 0.1, size * 0.1, size * 0.1);
            ctx.fillRect(projected.x + size * 0.05, projected.y - size * 0.1, size * 0.1, size * 0.1);
            // Nose
            ctx.fillStyle = '#FFB6AC';
            ctx.fillRect(projected.x - size * 0.02, projected.y, size * 0.04, size * 0.06);
            break;

          case 'body':
            // Clothing details
            ctx.strokeStyle = '#1A4480';
            ctx.lineWidth = Math.max(1, size * 0.05);
            ctx.strokeRect(projected.x - size * part.w, projected.y - size * part.h, size * part.w * 2, size * part.h * 2);
            break;

          case 'arm':
          case 'leg':
            // Joint shading
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(projected.x - size * part.w + 1, projected.y - size * part.h + 1, size * part.w * 2, size * part.h * 2);
            break;
        }

        // Add shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(projected.x - size * part.w + 2, projected.y - size * part.h + 2, size * part.w * 2, size * part.h * 2);
      }
    });

    // Player name tag
    if (!isMainPlayer && projected && projected.distance < 30) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(projected.x - 30, projected.y - 40, 60, 15);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, projected.x, projected.y - 30);
    }
  };

  // Enhanced 3D mob rendering with detailed models
  const drawMob = (ctx: CanvasRenderingContext2D, mob: Mob, camera: Camera, canvas: HTMLCanvasElement) => {
    const projected = project3D(mob.x, mob.y + 0.5, mob.z, camera, canvas);
    if (!projected || projected.distance > 60) return;

    const size = Math.max(4, 20 / projected.distance);
    const time = Date.now() * 0.002;
    const animationOffset = Math.sin(time + mob.x + mob.z) * 0.1;

    // Enhanced mob models
    const mobData: {[key: string]: {color: string, secondary?: string, hostile: boolean, parts: any[]}} = {
      'cow': {
        color: '#000000',
        secondary: '#FFFFFF',
        hostile: false,
        parts: [
          { x: 0, y: 0.3, size: 1.2, type: 'body' },
          { x: 0, y: 0.8, size: 0.8, type: 'head' },
          { x: -0.3, y: 0, size: 0.4, type: 'leg' },
          { x: 0.3, y: 0, size: 0.4, type: 'leg' }
        ]
      },
      'pig': {
        color: '#FFB6C1',
        hostile: false,
        parts: [
          { x: 0, y: 0.3, size: 1.0, type: 'body' },
          { x: 0, y: 0.7, size: 0.6, type: 'head' },
          { x: -0.2, y: 0, size: 0.3, type: 'leg' },
          { x: 0.2, y: 0, size: 0.3, type: 'leg' }
        ]
      },
      'sheep': {
        color: '#F5F5F5',
        hostile: false,
        parts: [
          { x: 0, y: 0.3, size: 1.1, type: 'body' },
          { x: 0, y: 0.7, size: 0.7, type: 'head' },
          { x: -0.2, y: 0, size: 0.3, type: 'leg' },
          { x: 0.2, y: 0, size: 0.3, type: 'leg' }
        ]
      },
      'chicken': {
        color: '#FFFFFF',
        secondary: '#FFD700',
        hostile: false,
        parts: [
          { x: 0, y: 0.2, size: 0.6, type: 'body' },
          { x: 0, y: 0.5, size: 0.4, type: 'head' },
          { x: 0, y: 0, size: 0.2, type: 'leg' }
        ]
      },
      'zombie': {
        color: '#228B22',
        secondary: '#8B7355',
        hostile: true,
        parts: [
          { x: 0, y: 0.5, size: 1.0, type: 'body' },
          { x: 0, y: 1.0, size: 0.6, type: 'head' },
          { x: -0.3 + animationOffset, y: 0.5, size: 0.4, type: 'arm' },
          { x: 0.3 - animationOffset, y: 0.5, size: 0.4, type: 'arm' },
          { x: -0.15, y: 0, size: 0.3, type: 'leg' },
          { x: 0.15, y: 0, size: 0.3, type: 'leg' }
        ]
      },
      'skeleton': {
        color: '#F5F5DC',
        hostile: true,
        parts: [
          { x: 0, y: 0.5, size: 0.8, type: 'body' },
          { x: 0, y: 1.0, size: 0.5, type: 'head' },
          { x: -0.25, y: 0.6, size: 0.3, type: 'arm' },
          { x: 0.25, y: 0.6, size: 0.3, type: 'arm' },
          { x: -0.1, y: 0, size: 0.25, type: 'leg' },
          { x: 0.1, y: 0, size: 0.25, type: 'leg' }
        ]
      },
      'spider': {
        color: '#2F2F2F',
        secondary: '#8B0000',
        hostile: true,
        parts: [
          { x: 0, y: 0.2, size: 1.0, type: 'body' },
          { x: 0, y: 0.4, size: 0.6, type: 'head' },
          // 8 legs
          { x: -0.4, y: 0, size: 0.2, type: 'leg' },
          { x: -0.3, y: 0, size: 0.2, type: 'leg' },
          { x: -0.2, y: 0, size: 0.2, type: 'leg' },
          { x: -0.1, y: 0, size: 0.2, type: 'leg' },
          { x: 0.1, y: 0, size: 0.2, type: 'leg' },
          { x: 0.2, y: 0, size: 0.2, type: 'leg' },
          { x: 0.3, y: 0, size: 0.2, type: 'leg' },
          { x: 0.4, y: 0, size: 0.2, type: 'leg' }
        ]
      },
      'creeper': {
        color: '#00FF00',
        secondary: '#228B22',
        hostile: true,
        parts: [
          { x: 0, y: 0.5, size: 0.8, type: 'body' },
          { x: 0, y: 1.0, size: 0.6, type: 'head' },
          { x: -0.2, y: 0, size: 0.3, type: 'leg' },
          { x: 0.2, y: 0, size: 0.3, type: 'leg' }
        ]
      }
    };

    const mobInfo = mobData[mob.type] || mobData['pig'];
    const lightFactor = Math.max(0.6, 1 - projected.distance / 40);

    // Draw mob parts
    mobInfo.parts.forEach(part => {
      const partX = projected.x + part.x * size;
      const partY = projected.y + part.y * size;
      const partSize = part.size * size;

      // Main part color
      ctx.fillStyle = adjustColorBrightness(mobInfo.color, lightFactor);
      ctx.fillRect(partX - partSize/2, partY - partSize/2, partSize, partSize);

      // Secondary color details
      if (mobInfo.secondary && part.type === 'head') {
        ctx.fillStyle = adjustColorBrightness(mobInfo.secondary, lightFactor);
        ctx.fillRect(partX - partSize/3, partY - partSize/3, partSize/2, partSize/2);
      }

      // Add part-specific details
      switch (part.type) {
        case 'head':
          if (mob.type === 'creeper') {
            // Creeper face
            ctx.fillStyle = '#000000';
            ctx.fillRect(partX - partSize/4, partY - partSize/6, partSize/8, partSize/4);
            ctx.fillRect(partX + partSize/8, partY - partSize/6, partSize/8, partSize/4);
            ctx.fillRect(partX - partSize/8, partY, partSize/4, partSize/6);
          } else if (mob.hostile) {
            // Red eyes for hostile mobs
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(partX - partSize/4, partY - partSize/6, partSize/8, partSize/8);
            ctx.fillRect(partX + partSize/8, partY - partSize/6, partSize/8, partSize/8);
          } else {
            // Normal eyes
            ctx.fillStyle = '#000000';
            ctx.fillRect(partX - partSize/4, partY - partSize/6, partSize/12, partSize/12);
            ctx.fillRect(partX + partSize/6, partY - partSize/6, partSize/12, partSize/12);
          }
          break;
      }

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(partX - partSize/2 + 1, partY - partSize/2 + 1, partSize, partSize);
    });

    // Health bar for hostile mobs
    if (mob.hostile && projected.distance < 25) {
      const barWidth = size * 1.5;
      const barHeight = 3;
      const healthPercent = mob.health / 20; // Assuming max health of 20

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(projected.x - barWidth/2, projected.y - size - 10, barWidth, barHeight);

      ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.25 ? '#FFFF00' : '#FF0000';
      ctx.fillRect(projected.x - barWidth/2, projected.y - size - 10, barWidth * healthPercent, barHeight);
    }

    // Floating damage numbers (if recently damaged)
    if (mob.hostile && Math.random() < 0.1) {
      ctx.fillStyle = '#FF4444';
      ctx.font = `${Math.max(8, size/2)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('1', projected.x + Math.random() * 10 - 5, projected.y - size - 15);
    }
  };

  // FPS tracking
  const [frameCount, setFrameCount] = useState(0);
  const [lastFpsUpdate, setLastFpsUpdate] = useState(Date.now());

  // Auto-save system
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const settings = JSON.parse(localStorage.getItem('starcraft3d-settings') || '{}');
      if (settings.world?.autoSave !== false) {
        localStorage.setItem('starcraft3d-gamestate', JSON.stringify({
          ...gameState,
          lastSave: Date.now()
        }));
        setGameState(prev => ({ ...prev, lastSave: Date.now() }));
      }
    }, (JSON.parse(localStorage.getItem('starcraft3d-settings') || '{}').world?.autoSaveInterval || 300) * 1000);

    return () => clearInterval(saveInterval);
  }, [gameState]);

  // Initialize canvas and 3D rendering
  useEffect(() => {
    if (loading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let lastFrameTime = performance.now();
    let frameCount = 0;

    const render = (currentTime: number) => {
      // Calculate FPS
      frameCount++;
      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= 1000) { // Update FPS every second
        const fps = Math.round((frameCount * 1000) / deltaTime);
        setGameState(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastFrameTime = currentTime;
      }
      // Clear screen with sky color
      const timeOfDay = gameState.time / 24000;
      let skyColor = '#87CEEB'; // Day sky

      if (timeOfDay < 0.25 || timeOfDay > 0.75) {
        skyColor = '#191970'; // Night sky
      } else if (timeOfDay < 0.3 || timeOfDay > 0.7) {
        skyColor = '#FF8C00'; // Sunrise/sunset
      }

      ctx.fillStyle = skyColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Enhanced cloud rendering with volumetric effect
      for (let i = 0; i < 25; i++) {
        const cloudX = (i * 60 + gameState.time * 0.02) % 300 - 150;
        const cloudZ = (i * 40) % 150 - 75;
        const cloudY = 85 + Math.sin(i + gameState.time * 0.001) * 8;

        const projected = project3D(gameState.players[0].x + cloudX, cloudY, gameState.players[0].z + cloudZ, camera, canvas);
        if (projected && projected.distance > 0) {
          const size = Math.max(15, 120 / projected.distance);
          const opacity = Math.max(0.3, 1 - projected.distance / 200);

          // Multi-layered clouds
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
          ctx.fillRect(projected.x - size * 1.2, projected.y - size * 0.6, size * 2.4, size * 1.2);

          ctx.fillStyle = `rgba(240, 240, 255, ${opacity * 0.8})`;
          ctx.fillRect(projected.x - size, projected.y - size * 0.5, size * 2, size);

          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.fillRect(projected.x - size * 0.8, projected.y - size * 0.4, size * 1.6, size * 0.8);
        }
      }

      // Add particle effects
      drawParticleEffects(ctx, camera, canvas);

      // Get nearby blocks for rendering
      const player = gameState.players[0];
      const renderDistance = 20;
      const nearbyBlocks = gameState.blocks.filter(block =>
        Math.abs(block.x - player.x) <= renderDistance &&
        Math.abs(block.z - player.z) <= renderDistance &&
        Math.abs(block.y - player.y) <= renderDistance
      );

      // Sort blocks by distance from camera (back to front)
      nearbyBlocks.sort((a, b) => {
        const distA = Math.sqrt((a.x - camera.x)**2 + (a.y - camera.y)**2 + (a.z - camera.z)**2);
        const distB = Math.sqrt((b.x - camera.x)**2 + (b.y - camera.y)**2 + (b.z - camera.z)**2);
        return distB - distA;
      });

      // Draw blocks
      nearbyBlocks.forEach(block => {
        drawBlock(ctx, block, camera, canvas);
      });

      // Draw mobs
      gameState.mobs.forEach(mob => {
        drawMob(ctx, mob, camera, canvas);
      });

      // Draw players
      gameState.players.forEach((p, index) => {
        drawPlayer(ctx, p, camera, canvas, index === 0);
      });

      // Draw crosshair (only in first person)
      if (camera.mode === 'first_person') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY);
        ctx.lineTo(centerX + 10, centerY);
        ctx.stroke();

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX, centerY + 10);
        ctx.stroke();
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loading, gameState, camera]);

  // Handle keyboard input with camera switching and movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys(prev => ({ ...prev, w: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys(prev => ({ ...prev, a: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys(prev => ({ ...prev, s: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys(prev => ({ ...prev, d: true }));
          break;
        case 'Space':
          e.preventDefault();
          setKeys(prev => ({ ...prev, space: true }));
          break;
        case 'ShiftLeft':
          setKeys(prev => ({ ...prev, shift: true }));
          break;
        case 'F5':
          // Cycle through camera modes
          setCamera(prev => ({
            ...prev,
            mode: prev.mode === 'first_person' ? 'third_person_back' :
                  prev.mode === 'third_person_back' ? 'third_person_front' : 'first_person'
          }));
          break;
        case 'Escape':
          setShowSettings(!showSettings);
          break;
        case 'e':
        case 'E':
          setShowInventory(!showInventory);
          break;
        case 'c':
        case 'C':
          setShowCrafting(!showCrafting);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys(prev => ({ ...prev, w: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys(prev => ({ ...prev, a: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys(prev => ({ ...prev, s: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys(prev => ({ ...prev, d: false }));
          break;
        case 'Space':
          setKeys(prev => ({ ...prev, space: false }));
          break;
        case 'ShiftLeft':
          setKeys(prev => ({ ...prev, shift: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Apply movement based on pressed keys
    const moveInterval = setInterval(() => {
      setGameState(prev => {
        const player = prev.players[0];
        let newX = player.x;
        let newY = player.y;
        let newZ = player.z;
        let newRotationY = player.rotationY;

        const moveSpeed = 0.5; // Adjusted movement speed

        if (keys.w) {
          newZ -= moveSpeed;
          newRotationY = 0;
        }
        if (keys.s) {
          newZ += moveSpeed;
          newRotationY = Math.PI;
        }
        if (keys.a) {
          newX -= moveSpeed;
          newRotationY = -Math.PI / 2;
        }
        if (keys.d) {
          newX += moveSpeed;
          newRotationY = Math.PI / 2;
        }
        if (keys.space) {
          newY += 1; // Jump
        }
        if (keys.shift) {
          newY = Math.max(1, newY - 1); // Crouch/Descend
        }

        return {
          ...prev,
          players: prev.players.map((p, i) => i === 0 ? { ...p, x: newX, y: newY, z: newZ, rotationY: newRotationY } : p)
        };
      });
    }, 50); // Update player position every 50ms

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(moveInterval);
    };
  }, [keys, loading, showSettings, showInventory, showCrafting, camera]);

  if (loading) {
    return (
      <div className="starcraft-container">
        <div className="loading-screen">
          <div className="loading-content">
            <h2>StarCraft 3D</h2>
            <p>Loading Minecraft-style world...</p>

            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <div style={{
                width: `${loadingProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>

            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              {Math.round(loadingProgress)}% Complete
            </p>

            <div className="loading-tips">
              <h4>💡 Controls:</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li>• WASD or arrow keys to move</li>
                <li>• Space to jump, Shift to crouch</li>
                <li>• F5 to switch camera view</li>
                <li>• E for inventory, C for crafting</li>
                <li>• Click to place/destroy blocks</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="starcraft-container">
      <canvas
        ref={canvasRef}
        className="game-viewport"
        style={{ cursor: camera.mode === 'first_person' ? 'none' : 'default' }}
      />

      {/* Enhanced HUD Overlay */}
      <div className="hud-overlay">
        {/* Top HUD */}
        <div className="top-hud">
          <div className="game-info">
            <div className="fps-display">FPS: {gameState.fps}</div>
            <div className="camera-mode">Camera: {camera.mode.replace('_', ' ')}</div>
            <div className="time-display">
              Time: {Math.floor(gameState.time / 1000)}:00 {gameState.time < 12000 ? 'AM' : 'PM'}
            </div>
            <div className="weather-display">Weather: {gameState.weather}</div>
            <div className="mode-display">Mode: {gameState.players[0].gameMode}</div>
            <div className="coordinates">
              X: {Math.floor(gameState.players[0].x)} Y: {Math.floor(gameState.players[0].y)} Z: {Math.floor(gameState.players[0].z)}
            </div>
            <div className="biome-display">Biome: {gameState.biome}</div>
            <div className="save-indicator">
              Last Save: {new Date(gameState.lastSave).toLocaleTimeString()}
            </div>
          </div>

          <div className="player-stats">
            <div className="health-bar">
              ❤️ <div className="bar">
                <div className="bar-fill health" style={{
                  width: `${(gameState.players[0].health / gameState.players[0].maxHealth) * 100}%`
                }} />
              </div>
              {gameState.players[0].health}/{gameState.players[0].maxHealth}
            </div>

            <div className="hunger-bar">
              🍖 <div className="bar">
                <div className="bar-fill hunger" style={{
                  width: `${(gameState.players[0].hunger / gameState.players[0].maxHunger) * 100}%`
                }} />
              </div>
              {gameState.players[0].hunger}/{gameState.players[0].maxHunger}
            </div>

            <div className="xp-bar">
              ⭐ <div className="bar">
                <div className="bar-fill xp" style={{
                  width: `${(gameState.players[0].xp % 100)}%`
                }} />
              </div>
              Level {gameState.players[0].level}
            </div>
          </div>
        </div>

        {/* Enhanced Hotbar */}
        <div className="hotbar">
          {['hand', 'wooden_pickaxe', 'wooden_sword', 'bow', 'oak_wood', 'stone', 'torch', 'bread', 'water_bucket'].map((item, index) => {
            const itemIcon = {
              'hand': '✋', 'wooden_pickaxe': '⛏️', 'wooden_sword': '🗡️', 'bow': '🏹',
              'oak_wood': '🪵', 'stone': '🗿', 'torch': '🕯️', 'bread': '🍞', 'water_bucket': '🪣'
            }[item] || item[0].toUpperCase();

            return (
              <div
                key={item}
                className={`hotbar-slot ${gameState.selectedTool === item ? 'selected' : ''}`}
                onClick={() => setGameState(prev => ({ ...prev, selectedTool: item }))}
              >
                <span className="hotbar-number">{index + 1}</span>
                <div className="item-icon">{itemIcon}</div>
                {gameState.inventory[item] && (
                  <span className="item-count">{gameState.inventory[item]}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Controls Help */}
        <div className="controls-help">
          <div className="control-hint">
            <span>WASD</span> Move
          </div>
          <div className="control-hint">
            <span>Space</span> Jump
          </div>
          <div className="control-hint">
            <span>Shift</span> Crouch
          </div>
          <div className="control-hint">
            <span>F5</span> Camera View
          </div>
          <div className="control-hint">
            <span>E</span> Inventory
          </div>
          <div className="control-hint">
            <span>C</span> Crafting
          </div>
        </div>
      </div>

      {/* Inventory Modal */}
      {showInventory && (
        <div className="modal-overlay" onClick={() => setShowInventory(false)}>
          <div className="modal-content inventory-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Inventory</h3>
              <button onClick={() => setShowInventory(false)}>×</button>
            </div>
            <div className="inventory-grid">
              {Object.entries(gameState.inventory).map(([item, count]) => (
                <div key={item} className="inventory-item">
                  <div className="item-icon">{item[0].toUpperCase()}</div>
                  <div className="item-name">{item}</div>
                  <div className="item-count">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Game Menu</h3>
              <button onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="settings-content">
              <button
                className="settings-btn"
                onClick={() => setShowSettings(false)}
              >
                Back to Game
              </button>
              <button
                className="settings-btn"
                onClick={() => navigate('/main')}
              >
                Main Menu
              </button>
              <button
                className="settings-btn danger"
                onClick={() => navigate('/')}
              >
                Exit Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced world generation
const generateChunk = (chunkX: number, chunkZ: number) => {
  const blocks: Block[] = [];
  const chunkSize = 16;

  for (let x = 0; x < chunkSize; x++) {
    for (let z = 0; z < chunkSize; z++) {
      const worldX = chunkX * chunkSize + x;
      const worldZ = chunkZ * chunkSize + z;

      const height = Math.floor(64 +
        Math.sin(worldX * 0.1) * 8 +
        Math.cos(worldZ * 0.1) * 6 +
        Math.sin(worldX * 0.05) * 4
      );

      // Generate terrain layers
      for (let y = 0; y <= height; y++) {
        let blockType = 'stone';

        if (y === 0) {
          blockType = 'bedrock';
        } else if (y === height) {
          blockType = 'grass';
        } else if (y > height - 4) {
          blockType = 'dirt';
        } else if (Math.random() < 0.02) {
          // Random ores
          blockType = Math.random() < 0.1 ? 'diamond' :
                     Math.random() < 0.3 ? 'gold' :
                     Math.random() < 0.5 ? 'iron' : 'coal';
        }

        blocks.push({ type: blockType, x: worldX, y, z: worldZ });
      }

      // Add trees
      if (height > 64 && Math.random() < 0.05) {
        const treeHeight = 4 + Math.floor(Math.random() * 3);
        for (let i = 1; i <= treeHeight; i++) {
          blocks.push({ type: 'oak_wood', x: worldX, y: height + i, z: worldZ });
        }
        // Add leaves
        for (let lx = -2; lx <= 2; lx++) {
          for (let lz = -2; lz <= 2; lz++) {
            for (let ly = 0; ly <= 2; ly++) {
              if (Math.abs(lx) + Math.abs(lz) <= 2 + ly && Math.random() < 0.7) {
                blocks.push({ type: 'oak_leaves', x: worldX + lx, y: height + treeHeight + ly, z: worldZ + lz });
              }
            }
          }
        }
      }
    }
  }

  return blocks;
};

// Biome definitions with all 50+ biomes
const BIOMES = [
  'Plains', 'Sunflower Plains', 'Forest', 'Flower Forest', 'Birch Forest',
  'Old Growth Birch Forest', 'Dark Forest', 'Taiga', 'Snowy Taiga',
  'Old Growth Pine Taiga', 'Old Growth Spruce Taiga', 'Savanna', 'Savanna Plateau',
  'Windswept Savanna', 'Jungle', 'Sparse Jungle', 'Bamboo Jungle', 'Desert',
  'Swamp', 'Mangrove Swamp', 'Snowy Plains', 'Ice Spikes', 'Snowy Slopes',
  'Jagged Peaks', 'Frozen Peaks', 'Stony Peaks', 'Grove', 'Meadow',
  'Cherry Grove', 'Beach', 'Snowy Beach', 'Stony Shore', 'River',
  'Frozen River', 'Ocean', 'Deep Ocean', 'Cold Ocean', 'Deep Cold Ocean',
  'Frozen Ocean', 'Deep Frozen Ocean', 'Lukewarm Ocean', 'Deep Lukewarm Ocean',
  'Warm Ocean', 'Mushroom Fields', 'Dripstone Caves', 'Lush Caves',
  'Nether Wastes', 'Crimson Forest', 'Warped Forest', 'Soul Sand Valley',
  'Basalt Deltas', 'The End', 'End Highlands', 'End Midlands', 'End Barrens',
  'Small End Islands'
];

const STRUCTURES = [
  { type: 'village', loot: { bread: 5, emerald: 2, iron_ingot: 3 } },
  { type: 'desert_temple', loot: { gold_ingot: 4, diamond: 1, emerald: 3 } },
  { type: 'jungle_temple', loot: { redstone: 8, sticky_piston: 2, diamond: 2 } },
  { type: 'ocean_monument', loot: { prismarine: 20, gold_block: 8, sponge: 3 } },
  { type: 'woodland_mansion', loot: { totem_of_undying: 1, diamond: 5, emerald_block: 2 } },
  { type: 'stronghold', loot: { ender_pearl: 3, blaze_rod: 2, books: 10 } },
  { type: 'abandoned_mineshaft', loot: { iron_ingot: 6, gold_ingot: 3, redstone: 5 } },
  { type: 'dungeon', loot: { iron_ingot: 3, bread: 4, bone: 8 } },
  { type: 'shipwreck', loot: { iron_nugget: 10, emerald: 2, treasure_map: 1 } },
  { type: 'buried_treasure', loot: { diamond: 3, gold_ingot: 8, emerald: 5 } },
  { type: 'pillager_outpost', loot: { crossbow: 1, arrow: 20, iron_ingot: 4 } },
  { type: 'ruined_portal', loot: { obsidian: 6, gold_nugget: 15, flint_and_steel: 1 } },
  { type: 'bastion_remnant', loot: { netherite_scrap: 1, gold_ingot: 12, crying_obsidian: 3 } },
  { type: 'nether_fortress', loot: { blaze_rod: 5, wither_skeleton_skull: 1, nether_wart: 8 } },
  { type: 'end_city', loot: { elytra: 1, shulker_shell: 2, chorus_fruit: 10 } },
  { type: 'ancient_city', loot: { echo_shard: 3, enchanted_golden_apple: 1, swift_sneak_book: 1 } },
  { type: 'igloo', loot: { golden_apple: 1, ice: 20, snow_block: 15 } },
  { type: 'witch_hut', loot: { brewing_stand: 1, cauldron: 1, mushroom: 8 } },
  { type: 'coral_reef', loot: { coral: 20, tropical_fish: 5, sea_pickle: 8 } },
  { type: 'ice_spikes_formation', loot: { packed_ice: 30, blue_ice: 5 } },
  { type: 'fossil', loot: { bone_block: 10, coal: 15 } },
  { type: 'geode', loot: { amethyst_shard: 8, amethyst_block: 3 } },
  { type: 'cherry_grove_shrine', loot: { cherry_log: 15, pink_petals: 20 } },
  { type: 'bamboo_temple', loot: { bamboo: 64, panda_spawn_egg: 1 } },
  { type: 'flower_meadow', loot: { flowers: 30, honey_bottle: 5 } },
  { type: 'mushroom_house', loot: { mushroom_stew: 8, red_mushroom: 15 } },
  { type: 'cactus_farm', loot: { cactus: 32, green_dye: 8 } },
  { type: 'kelp_forest', loot: { kelp: 50, sea_grass: 20 } },
  { type: 'bee_nest', loot: { honey_comb: 6, honey_bottle: 3 } },
  { type: 'spider_cave', loot: { string: 20, spider_eye: 8 } }
];

const getBiomeAt = (x: number, z: number): string => {
  // Simple biome generation based on coordinates and noise
  const biomeIndex = Math.abs((Math.sin(x * 0.01) + Math.cos(z * 0.01)) * BIOMES.length / 2);
  return BIOMES[Math.floor(biomeIndex) % BIOMES.length];
};

const generateStructures = (): Structure[] => {
  const structures: Structure[] = [];

  for (let i = 0; i < 30; i++) {
    const structureType = STRUCTURES[Math.floor(Math.random() * STRUCTURES.length)];
    const x = (Math.random() - 0.5) * 1000; // Spread structures across 1000x1000 area
    const z = (Math.random() - 0.5) * 1000;

    structures.push({
      type: structureType.type,
      x: Math.floor(x),
      z: Math.floor(z),
      loot: structureType.loot
    });
  }

  return structures;
};

const generateMobs = (): Mob[] => {
  const mobs: Mob[] = [];

  // Passive mobs
  for (let i = 0; i < 20; i++) {
    const mobTypes = ['cow', 'pig', 'sheep', 'chicken'];
    const type = mobTypes[Math.floor(Math.random() * mobTypes.length)] as any;
    mobs.push({
      id: `passive_${i}`,
      type,
      x: (Math.random() - 0.5) * 200,
      y: 71,
      z: (Math.random() - 0.5) * 200,
      health: 10,
      hostile: false,
      aiState: 'wander'
    });
  }

  // Hostile mobs
  for (let i = 0; i < 10; i++) {
    const mobTypes = ['zombie', 'skeleton', 'spider', 'creeper'];
    const type = mobTypes[Math.floor(Math.random() * mobTypes.length)] as any;
    mobs.push({
      id: `hostile_${i}`,
      type,
      x: (Math.random() - 0.5) * 300,
      y: 71,
      z: (Math.random() - 0.5) * 300,
      health: 20,
      hostile: true,
      aiState: 'wander'
    });
  }

  return mobs;
};

const initializeWorld = () => {
  const chunks: Block[] = [];
  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      chunks.push(...generateChunk(x, z));
    }
  }
  return chunks;
};

export default StarCraft3D;