import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import './StarCraft3D.css';

const StarCraft3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showCrafting, setCraftingShow] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [gameMode, setGameMode] = useState('survival');
  const [inventory, setInventory] = useState<{[key: string]: number}>({});
  const [selectedBlock, setSelectedBlock] = useState(0);
  const [playerHealth, setPlayerHealth] = useState(20);
  const [playerHunger, setPlayerHunger] = useState(20);
  const [playerXP, setPlayerXP] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [showDebug, setShowDebug] = useState(false);
  const [gameTime, setGameTime] = useState(6000); // 6000 = sunrise
  const [weather, setWeather] = useState<'clear' | 'rain' | 'storm' | 'snow'>('clear');
  const [season, setSeason] = useState<'spring' | 'summer' | 'autumn' | 'winter'>('spring');
  const [currentBiome, setCurrentBiome] = useState('plains');
  const [achievements, setAchievements] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [fps, setFPS] = useState(60);
  const [mobs, setMobs] = useState<any[]>([]);
  const [showMinimap, setShowMinimap] = useState(true);
  const [oxygen, setOxygen] = useState(300);
  const [armor, setArmor] = useState(0);

  // Voice related state and refs
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const toast = (message: string, type: 'err' | 'info' = 'info') => {
    setChatMessages(prev => [...prev, `${type === 'err' ? '❗' : 'ℹ️'} ${message}`]);
  };

  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<PointerLockControls>();
  const terrainRef = useRef<THREE.Group>();
  const playerRef = useRef<THREE.Object3D>();
  const placedBlocksRef = useRef<THREE.Object3D[]>([]);
  const mobsRef = useRef<THREE.Object3D[]>([]);
  const particleSystemRef = useRef<THREE.Points>();
  const soundRef = useRef<{[key: string]: HTMLAudioElement}>({});

  // Movement state
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    canJump: false,
    sprint: false,
    sneak: false
  });

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  // Enhanced block types with tools and materials
  const blockTypes = [
    { name: 'Grass', icon: '🟩', color: '#7CB518', hardness: 0.6, tool: 'shovel', drops: ['dirt'] },
    { name: 'Stone', icon: '🪨', color: '#808080', hardness: 1.5, tool: 'pickaxe', drops: ['cobblestone'] },
    { name: 'Wood', icon: '🟫', color: '#8B4513', hardness: 2.0, tool: 'axe', drops: ['wood_planks'] },
    { name: 'Sand', icon: '🟨', color: '#F4E4BC', hardness: 0.5, tool: 'shovel', drops: ['sand'] },
    { name: 'Dirt', icon: '🟤', color: '#8B7355', hardness: 0.5, tool: 'shovel', drops: ['dirt'] },
    { name: 'Water', icon: '🟦', color: '#4169E1', hardness: 0, tool: 'bucket', drops: [] },
    { name: 'Lava', icon: '🟧', color: '#FF4500', hardness: 0, tool: 'bucket', drops: [] },
    { name: 'Diamond', icon: '💎', color: '#B9F2FF', hardness: 5.0, tool: 'pickaxe', drops: ['diamond'] },
    { name: 'Gold', icon: '🟡', color: '#FFD700', hardness: 3.0, tool: 'pickaxe', drops: ['gold_ingot'] },
    { name: 'Iron', icon: '⚪', color: '#C0C0C0', hardness: 3.0, tool: 'pickaxe', drops: ['iron_ingot'] },
    { name: 'Coal', icon: '⚫', color: '#36454F', hardness: 3.0, tool: 'pickaxe', drops: ['coal'] },
    { name: 'Emerald', icon: '💚', color: '#50C878', hardness: 5.0, tool: 'pickaxe', drops: ['emerald'] },
    { name: 'Obsidian', icon: '🖤', color: '#0B0B0B', hardness: 50.0, tool: 'diamond_pickaxe', drops: ['obsidian'] },
    { name: 'Ice', icon: '🧊', color: '#B6DFF', hardness: 0.5, tool: 'pickaxe', drops: [] },
    { name: 'Snow', icon: '❄️', color: '#FFFAFA', hardness: 0.1, tool: 'shovel', drops: ['snowball'] }
  ];

  // Tools and items
  const tools = [
    { name: 'Wooden Pickaxe', icon: '⛏️', durability: 59, efficiency: 1.0, materials: ['wood_planks', 'stick'] },
    { name: 'Stone Pickaxe', icon: '🪨⛏️', durability: 131, efficiency: 1.5, materials: ['cobblestone', 'stick'] },
    { name: 'Iron Pickaxe', icon: '⚪⛏️', durability: 250, efficiency: 2.0, materials: ['iron_ingot', 'stick'] },
    { name: 'Diamond Pickaxe', icon: '💎⛏️', durability: 1561, efficiency: 3.0, materials: ['diamond', 'stick'] },
    { name: 'Wooden Axe', icon: '🪓', durability: 59, efficiency: 1.0, materials: ['wood_planks', 'stick'] },
    { name: 'Sword', icon: '⚔️', durability: 250, efficiency: 1.0, materials: ['iron_ingot', 'stick'] },
    { name: 'Bow', icon: '🏹', durability: 384, efficiency: 1.0, materials: ['stick', 'string'] },
    { name: 'Shield', icon: '🛡️', durability: 336, efficiency: 1.0, materials: ['wood_planks', 'iron_ingot'] }
  ];

  // Crafting recipes
  const craftingRecipes = [
    { result: 'Wooden Pickaxe', materials: { 'wood_planks': 3, 'stick': 2 }, icon: '⛏️' },
    { result: 'Stone Pickaxe', materials: { 'cobblestone': 3, 'stick': 2 }, icon: '🪨⛏️' },
    { result: 'Iron Pickaxe', materials: { 'iron_ingot': 3, 'stick': 2 }, icon: '⚪⛏️' },
    { result: 'Diamond Pickaxe', materials: { 'diamond': 3, 'stick': 2 }, icon: '💎⛏️' },
    { result: 'Wooden Axe', materials: { 'wood_planks': 3, 'stick': 2 }, icon: '🪓' },
    { result: 'Sword', materials: { 'iron_ingot': 2, 'stick': 1 }, icon: '⚔️' },
    { result: 'Bow', materials: { 'stick': 3, 'string': 3 }, icon: '🏹' },
    { result: 'Shield', materials: { 'wood_planks': 6, 'iron_ingot': 1 }, icon: '🛡️' },
    { result: 'Torch', materials: { 'coal': 1, 'stick': 1 }, icon: '🕯️', count: 4 },
    { result: 'Bread', materials: { 'wheat': 3 }, icon: '🍞' },
    { result: 'Chest', materials: { 'wood_planks': 8 }, icon: '📦' }
  ];

  // Mob types
  const mobTypes = [
    { name: 'Zombie', icon: '🧟', health: 20, hostile: true, drops: ['rotten_flesh'] },
    { name: 'Skeleton', icon: '💀', health: 20, hostile: true, drops: ['bone', 'arrow'] },
    { name: 'Spider', icon: '🕷️', health: 16, hostile: true, drops: ['string'] },
    { name: 'Creeper', icon: '💚', health: 20, hostile: true, drops: ['gunpowder'] },
    { name: 'Cow', icon: '🐄', health: 10, hostile: false, drops: ['beef', 'leather'] },
    { name: 'Pig', icon: '🐷', health: 10, hostile: false, drops: ['pork'] },
    { name: 'Chicken', icon: '🐔', health: 4, hostile: false, drops: ['chicken', 'feather'] },
    { name: 'Sheep', icon: '🐑', health: 8, hostile: false, drops: ['wool', 'mutton'] }
  ];

  // Biome definitions
  const biomes = {
    plains: { name: 'Plains', color: '#7CB518', blocks: ['grass', 'dirt', 'stone'], mobs: ['cow', 'pig', 'chicken'] },
    desert: { name: 'Desert', color: '#F4E4BC', blocks: ['sand', 'sandstone'], mobs: ['spider'] },
    forest: { name: 'Forest', color: '#228B22', blocks: ['grass', 'wood', 'leaves'], mobs: ['wolf', 'rabbit'] },
    mountains: { name: 'Mountains', color: '#808080', blocks: ['stone', 'coal', 'iron'], mobs: ['goat'] },
    ocean: { name: 'Ocean', color: '#4169E1', blocks: ['water', 'sand'], mobs: ['fish', 'squid'] },
    tundra: { name: 'Tundra', color: '#FFFAFA', blocks: ['snow', 'ice'], mobs: ['polar_bear'] }
  };

  // Initialize game with enhanced features
  useEffect(() => {
    const worldData = localStorage.getItem('current-world');
    if (worldData) {
      const world = JSON.parse(worldData);
      setGameMode(world.gameMode || 'survival');

      const savedWorldData = localStorage.getItem(`world-${world.worldId}-data`);
      if (savedWorldData) {
        const data = JSON.parse(savedWorldData);
        setInventory(data.inventory || {});
        setAchievements(data.achievements || []);
        if (data.playerData) {
          setPlayerHealth(data.playerData.health || 20);
          setPlayerHunger(data.playerData.hunger || 20);
          setPlayerXP(data.playerData.xp || 0);
          setPlayerLevel(data.playerData.level || 1);
        }
      } else if (world.gameMode === 'creative') {
        // Creative mode gets all blocks
        const creativeInventory: {[key: string]: number} = {};
        blockTypes.forEach(block => {
          creativeInventory[block.name.toLowerCase()] = 999;
        });
        tools.forEach(tool => {
          creativeInventory[tool.name.toLowerCase()] = 1;
        });
        setInventory(creativeInventory);
      } else {
        // Survival mode starts with basic items
        setInventory({
          'wood_planks': 10,
          'stick': 5,
          'bread': 3
        });
      }
    }

    // Initialize sound effects
    const loadSounds = () => {
      const sounds = ['break', 'place', 'step', 'hurt', 'eat', 'craft'];
      sounds.forEach(sound => {
        const audio = new Audio(`data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Lsx2UgCDOO1vTTgjMGHmnA7+OZURE`);
        soundRef.current[sound] = audio;
      });
    };

    loadSounds();

    // Game tick for day/night cycle, weather, and other systems
    const gameTickInterval = setInterval(() => {
      setGameTime(prev => (prev + 1) % 24000); // 24000 ticks = 1 day

      // Weather changes
      if (Math.random() < 0.001) {
        const weathers: Array<'clear' | 'rain' | 'storm' | 'snow'> = ['clear', 'rain', 'storm', 'snow'];
        setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
      }

      // Season changes (every 7 days)
      if (gameTime % 168000 === 0) {
        const seasons: Array<'spring' | 'summer' | 'autumn' | 'winter'> = ['spring', 'summer', 'autumn', 'winter'];
        setSeason(prev => {
          const currentIndex = seasons.indexOf(prev);
          return seasons[(currentIndex + 1) % seasons.length];
        });
      }

      // Hunger and health regeneration
      if (gameMode === 'survival') {
        setPlayerHunger(prev => Math.max(0, prev - 0.1));
        setPlayerHealth(prev => {
          if (playerHunger > 18) return Math.min(20, prev + 0.1);
          if (playerHunger === 0) return Math.max(0, prev - 0.1);
          return prev;
        });
      }

      // Spawn mobs occasionally
      if (Math.random() < 0.01 && mobs.length < 10) {
        spawnMob();
      }
    }, 100);

    return () => {
      clearInterval(gameTickInterval);
    };
  }, [gameMode, playerHunger, mobs.length]);

  // Enhanced texture creation with better patterns
  const textureCache = useRef<Map<string, THREE.Texture>>(new Map());

  const createBlockTexture = useCallback((color: string, blockType: string) => {
    const cacheKey = `${color}-${blockType}`;
    if (textureCache.current.has(cacheKey)) {
      return textureCache.current.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;

    // Base color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 16, 16);

    // Enhanced texture patterns
    switch (blockType) {
      case 'grass':
        // Grass texture with more detail
        for (let i = 0; i < 10; i++) {
          const x = Math.floor(Math.random() * 16);
          const y = Math.floor(Math.random() * 16);
          ctx.fillStyle = `rgb(${Math.floor(100 + Math.random() * 30)}, ${Math.floor(150 + Math.random() * 40)}, 20)`;
          ctx.fillRect(x, y, 1, 1);
        }
        // Add some darker spots
        for (let i = 0; i < 5; i++) {
          const x = Math.floor(Math.random() * 16);
          const y = Math.floor(Math.random() * 16);
          ctx.fillStyle = `rgb(${Math.floor(80 + Math.random() * 20)}, ${Math.floor(120 + Math.random() * 20)}, 15)`;
          ctx.fillRect(x, y, 1, 1);
        }
        break;
      case 'stone':
        // More detailed stone pattern
        for (let i = 0; i < 8; i++) {
          const x = Math.floor(Math.random() * 16);
          const y = Math.floor(Math.random() * 16);
          const size = Math.floor(Math.random() * 3) + 1;
          ctx.fillStyle = `rgb(${Math.floor(90 + Math.random() * 60)}, ${Math.floor(90 + Math.random() * 60)}, ${Math.floor(90 + Math.random() * 60)})`;
          ctx.fillRect(x, y, size, size);
        }
        break;
      case 'wood':
        // Wood grain pattern
        for (let y = 0; y < 16; y += 2) {
          ctx.fillStyle = `rgb(${Math.floor(120 + Math.random() * 20)}, ${Math.floor(80 + Math.random() * 20)}, ${Math.floor(40 + Math.random() * 20)})`;
          ctx.fillRect(0, y, 16, 1);
        }
        break;
      case 'diamond':
        // Sparkling diamond effect
        for (let i = 0; i < 6; i++) {
          const x = Math.floor(Math.random() * 16);
          const y = Math.floor(Math.random() * 16);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(x, y, 1, 1);
        }
        break;
      case 'water':
        // Animated water effect (simplified)
        ctx.fillStyle = '#4169E1';
        for (let i = 0; i < 4; i++) {
          const x = Math.floor(Math.random() * 16);
          const y = Math.floor(Math.random() * 16);
          ctx.fillStyle = `rgb(65, ${Math.floor(100 + Math.random() * 55)}, ${Math.floor(200 + Math.random() * 55)})`;
          ctx.fillRect(x, y, 2, 2);
        }
        break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    textureCache.current.set(cacheKey, texture);
    return texture;
  }, []);

  // Enhanced terrain generation with biomes
  const generateTerrain = useCallback(() => {
    const terrainGroup = new THREE.Group();
    const chunkSize = 16;
    const worldSize = 8; // 8x8 chunks = 128x128 blocks

    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = {};

    blockTypes.forEach(blockType => {
      const key = blockType.name.toLowerCase();
      materials[key] = new THREE.MeshLambertMaterial({ 
        map: createBlockTexture(blockType.color, key) 
      });
    });

    // Generate terrain with biomes
    for (let chunkX = 0; chunkX < worldSize; chunkX++) {
      for (let chunkZ = 0; chunkZ < worldSize; chunkZ++) {
        for (let x = 0; x < chunkSize; x++) {
          for (let z = 0; z < chunkSize; z++) {
            const worldX = chunkX * chunkSize + x - (worldSize * chunkSize) / 2;
            const worldZ = chunkZ * chunkSize + z - (worldSize * chunkSize) / 2;

            // Determine biome based on position
            const temperature = Math.sin(worldX * 0.01) * 0.5 + 0.5;
            const humidity = Math.cos(worldZ * 0.01) * 0.5 + 0.5;

            let biome = 'plains';
            if (temperature < 0.3) biome = 'tundra';
            else if (temperature > 0.7 && humidity < 0.3) biome = 'desert';
            else if (humidity > 0.7) biome = 'ocean';
            else if (temperature > 0.5 && humidity > 0.5) biome = 'forest';

            // Generate height with more variation
            const height = Math.floor(
              Math.sin(worldX * 0.05) * Math.cos(worldZ * 0.05) * 10 +
              Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1) * 5 +
              Math.random() * 3 + 15
            );

            // Generate blocks based on biome
            for (let y = Math.max(0, height - 5); y <= height; y++) {
              let blockType = 'stone';

              if (biome === 'desert') {
                if (y >= height - 3) blockType = 'sand';
              } else if (biome === 'tundra') {
                if (y === height) blockType = 'snow';
                else if (y >= height - 2) blockType = 'dirt';
              } else if (biome === 'ocean' && height < 12) {
                if (y <= 12) blockType = 'water';
                else blockType = 'sand';
              } else {
                if (y === height && height > 12) blockType = 'grass';
                else if (y > height - 3 && height > 12) blockType = 'dirt';
              }

              // Add ore generation
              if (blockType === 'stone' && Math.random() < 0.1) {
                const oreRand = Math.random();
                if (oreRand < 0.05) blockType = 'coal';
                else if (oreRand < 0.08) blockType = 'iron';
                else if (oreRand < 0.09) blockType = 'gold';
                else if (oreRand < 0.095) blockType = 'diamond';
              }

              const block = new THREE.Mesh(blockGeometry, materials[blockType]);
              block.position.set(worldX, y, worldZ);
              block.castShadow = true;
              block.receiveShadow = true;
              block.userData = { blockType, biome };
              terrainGroup.add(block);
            }
          }
        }
      }
    }

    return terrainGroup;
  }, [createBlockTexture, blockTypes]);

  // Spawn mob function
  const spawnMob = useCallback(() => {
    if (!sceneRef.current || !playerRef.current) return;

    const mobType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
    const mobGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const mobMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const mob = new THREE.Mesh(mobGeometry, mobMaterial);

    // Spawn near player but not too close
    const playerPos = playerRef.current.position;
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 30;
    mob.position.set(
      playerPos.x + Math.cos(angle) * distance,
      20,
      playerPos.z + Math.sin(angle) * distance
    );

    mob.userData = { 
      type: mobType.name,
      health: mobType.health,
      hostile: mobType.hostile,
      drops: mobType.drops,
      lastUpdate: Date.now(),
      velocity: new THREE.Vector3()
    };

    sceneRef.current.add(mob);
    mobsRef.current.push(mob);
    setMobs(prev => [...prev, mob.userData]);
  }, [mobTypes]);

  // Create particle system for weather effects
  const createParticleSystem = useCallback(() => {
    const particleCount = weather === 'rain' ? 1000 : weather === 'snow' ? 500 : 0;

    if (particleCount === 0) return null;

    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 100 + 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = weather === 'rain' ? -0.5 : -0.1;
      velocities[i * 3 + 2] = 0;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      color: weather === 'rain' ? 0x0000ff : 0xffffff,
      size: weather === 'rain' ? 0.1 : 0.5,
      transparent: true,
      opacity: 0.6
    });

    return new THREE.Points(particles, material);
  }, [weather]);

  // Enhanced place block function with sound
  const placeBlock = useCallback((position: THREE.Vector3) => {
    if (gameMode === 'survival' && Object.keys(inventory).length === 0) return;

    const blockType = blockTypes[selectedBlock];
    const inventoryKey = blockType.name.toLowerCase();

    if (gameMode === 'survival' && (!inventory[inventoryKey] || inventory[inventoryKey] <= 0)) {
      return;
    }

    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const texture = createBlockTexture(blockType.color, blockType.name.toLowerCase());
    const material = new THREE.MeshLambertMaterial({ map: texture });

    const block = new THREE.Mesh(blockGeometry, material);
    block.position.copy(position);
    block.position.y = Math.floor(block.position.y) + 0.5;
    block.position.x = Math.floor(block.position.x) + 0.5;
    block.position.z = Math.floor(block.position.z) + 0.5;

    block.castShadow = true;
    block.receiveShadow = true;
    block.userData = { blockType: blockType.name.toLowerCase() };

    if (sceneRef.current) {
      sceneRef.current.add(block);
      placedBlocksRef.current.push(block);

      // Play sound
      if (soundRef.current.place) {
        soundRef.current.place.currentTime = 0;
        soundRef.current.place.play().catch(() => {});
      }

      // Update inventory in survival mode
      if (gameMode === 'survival') {
        setInventory(prev => ({
          ...prev,
          [inventoryKey]: prev[inventoryKey] - 1
        }));
      }

      // Check for achievements
      checkAchievements('block_placed', blockType.name);
    }
  }, [inventory, gameMode, selectedBlock, blockTypes, createBlockTexture]);

  // Break block function with drops
  const breakBlock = useCallback((block: THREE.Object3D) => {
    if (!sceneRef.current) return;

    const blockData = block.userData;
    const blockType = blockTypes.find(bt => bt.name.toLowerCase() === blockData.blockType);

    if (blockType) {
      // Add drops to inventory
      if (gameMode === 'survival') {
        blockType.drops.forEach(drop => {
          setInventory(prev => ({
            ...prev,
            [drop]: (prev[drop] || 0) + 1
          }));
        });

        // Add XP
        setPlayerXP(prev => prev + Math.floor(Math.random() * 5) + 1);
      }

      // Play sound
      if (soundRef.current.break) {
        soundRef.current.break.currentTime = 0;
        soundRef.current.break.play().catch(() => {});
      }

      // Check for achievements
      checkAchievements('block_broken', blockType.name);
    }

    sceneRef.current.remove(block);
    const index = placedBlocksRef.current.indexOf(block);
    if (index > -1) {
      placedBlocksRef.current.splice(index, 1);
    }
  }, [gameMode, blockTypes]);

  // Achievement system
  const checkAchievements = useCallback((action: string, item: string) => {
    const newAchievements: string[] = [];

    if (action === 'block_placed' && item === 'Stone' && !achievements.includes('first_stone')) {
      newAchievements.push('first_stone');
    }
    if (action === 'block_broken' && item === 'Diamond' && !achievements.includes('diamonds')) {
      newAchievements.push('diamonds');
    }
    if (action === 'craft' && item === 'Wooden Pickaxe' && !achievements.includes('getting_wood')) {
      newAchievements.push('getting_wood');
    }

    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      setChatMessages(prev => [...prev, `🏆 Achievement unlocked: ${newAchievements[0]}`]);
    }
  }, [achievements]);

  // Crafting function
  const craftItem = useCallback((recipe: any) => {
    // Check if player has required materials
    const canCraft = Object.entries(recipe.materials).every(([material, required]: [string, any]) => {
      return inventory[material] && inventory[material] >= required;
    });

    if (!canCraft) return;

    // Remove materials from inventory
    const newInventory = { ...inventory };
    Object.entries(recipe.materials).forEach(([material, required]: [string, any]) => {
      newInventory[material] -= required;
      if (newInventory[material] <= 0) {
        delete newInventory[material];
      }
    });

    // Add crafted item
    const resultKey = recipe.result.toLowerCase().replace(/\s+/g, '_');
    newInventory[resultKey] = (newInventory[resultKey] || 0) + (recipe.count || 1);

    setInventory(newInventory);

    // Play sound
    if (soundRef.current.craft) {
      soundRef.current.craft.currentTime = 0;
      soundRef.current.craft.play().catch(() => {});
    }

    checkAchievements('craft', recipe.result);
  }, [inventory]);

  // Enhanced keyboard controls
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
        moveState.current.forward = true;
        break;
      case 'KeyS':
        moveState.current.backward = true;
        break;
      case 'KeyA':
        moveState.current.left = true;
        break;
      case 'KeyD':
        moveState.current.right = true;
        break;
      case 'Space':
        event.preventDefault();
        if (moveState.current.canJump) {
          velocity.current.y += 12;
          moveState.current.canJump = false;
        }
        break;
      case 'ShiftLeft':
        moveState.current.sprint = true;
        break;
      case 'ControlLeft':
        moveState.current.sneak = true;
        break;
      case 'KeyE':
        setShowInventory(prev => !prev);
        break;
      case 'KeyC':
        setCraftingShow(prev => !prev);
        break;
      case 'KeyT':
        setShowChat(prev => !prev);
        break;
      case 'KeyF':
        setShowDebug(prev => !prev);
        break;
      case 'KeyM':
        setShowMinimap(prev => !prev);
        break;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
      case 'Digit9':
        const slot = parseInt(event.code.slice(-1)) - 1;
        if (slot < blockTypes.length) {
          setSelectedBlock(slot);
        }
        break;
      case 'Escape':
        if (showInventory) setShowInventory(false);
        else if (showCrafting) setCraftingShow(false);
        else if (showChat) setShowChat(false);
        else if (controlsRef.current && controlsRef.current.isLocked) {
          document.exitPointerLock();
        }
        break;
    }
  }, [showInventory, showCrafting, showChat]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'KeyW':
        moveState.current.forward = false;
        break;
      case 'KeyS':
        moveState.current.backward = false;
        break;
      case 'KeyA':
        moveState.current.left = false;
        break;
      case 'KeyD':
        moveState.current.right = false;
        break;
      case 'ShiftLeft':
        moveState.current.sprint = false;
        break;
      case 'ControlLeft':
        moveState.current.sneak = false;
        break;
    }
  }, []);

  // Enhanced mouse controls
  const handleMouseClick = useCallback((event: MouseEvent) => {
    if (!controlsRef.current || !controlsRef.current.isLocked) return;

    const raycaster = new THREE.Raycaster();
    if (cameraRef.current) {
      raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);

      const intersects = raycaster.intersectObjects([
        ...placedBlocksRef.current,
        ...(terrainRef.current ? terrainRef.current.children : []),
        ...mobsRef.current
      ]);

      if (intersects.length > 0) {
        const intersection = intersects[0];

        if (event.button === 0) {
          // Left click - break block or attack mob
          if (mobsRef.current.includes(intersection.object as THREE.Object3D)) {
            // Attack mob
            const mob = intersection.object as THREE.Object3D;
            mob.userData.health -= 5;
            if (mob.userData.health <= 0) {
              // Mob died, give drops
              mob.userData.drops.forEach((drop: string) => {
                setInventory(prev => ({
                  ...prev,
                  [drop]: (prev[drop] || 0) + 1
                }));
              });
              sceneRef.current?.remove(mob);
              const index = mobsRef.current.indexOf(mob);
              if (index > -1) mobsRef.current.splice(index, 1);
            }
          } else {
            // Break block
            breakBlock(intersection.object);
          }
        } else if (event.button === 2) {
          // Right click - place block
          const placePosition = intersection.point.clone();
          placePosition.add(intersection.face!.normal);
          placeBlock(placePosition);
        }
      }
    }
  }, [placeBlock, breakBlock]);

  // Chat system
  const handleChatSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      setChatMessages(prev => [...prev, `<Player> ${chatInput}`]);
      setChatInput('');
      setShowChat(false);
    }
  }, [chatInput]);

  // Voice system
  const startVoice = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn("Media devices not supported");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      mediaStreamRef.current = stream;
      setIsVoiceOn(true);

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.warn("AudioContext not supported");
        return;
      }

      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const mic = ctx.createMediaStreamSource(stream);
      mic.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        if (!mediaStreamRef.current) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVoiceLevel(avg);
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (error) {
      console.error("Voice setup failed:", error);
      setIsVoiceOn(false);
    }
  };

  const stopVoice = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsVoiceOn(false);
    setVoiceLevel(0);
  }, []);

  // Main Three.js setup and game loop
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      powerPreference: "high-performance",
      alpha: false
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87CEEB);

    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Enhanced lighting system
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Pointer lock controls
    const controls = new PointerLockControls(camera, renderer.domElement);
    controlsRef.current = controls;
    scene.add(controls.object);

    const player = controls.object;
    playerRef.current = player;
    player.position.set(0, 50, 0);

    // Generate terrain
    const terrain = generateTerrain();
    terrainRef.current = terrain;
    scene.add(terrain);

    // Add weather particles
    const particles = createParticleSystem();
    if (particles) {
      particleSystemRef.current = particles;
      scene.add(particles);
    }

    // Event listeners
    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      // Don't automatically set isLocked to false if pointer lock is lost
      // This allows the game to continue working without pointer lock
      if (!locked) {
        Object.keys(moveState.current).forEach(key => {
          moveState.current[key as keyof typeof moveState.current] = false;
        });
      }
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    renderer.domElement.addEventListener('mousedown', handleMouseClick);
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // Enhanced animation loop with FPS counter
    const clock = new THREE.Clock();
    let animationId: number;
    let lastTime = 0;
    let frameCount = 0;
    let lastFPSUpdate = 0;

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);

      // FPS calculation
      frameCount++;
      if (currentTime - lastFPSUpdate > 1000) {
        setFPS(frameCount);
        frameCount = 0;
        lastFPSUpdate = currentTime;
      }

      const delta = Math.min(clock.getDelta(), 0.1);

      if (controls.isLocked) {
        // Enhanced movement system
        velocity.current.y -= 30 * delta; // Gravity

        direction.current.z = Number(moveState.current.forward) - Number(moveState.current.backward);
        direction.current.x = Number(moveState.current.right) - Number(moveState.current.left);
        direction.current.normalize();

        let speed = moveState.current.sprint ? 25 : 15;
        if (moveState.current.sneak) speed *= 0.3;

        if (moveState.current.forward || moveState.current.backward) {
          velocity.current.z -= direction.current.z * speed * delta;
        }
        if (moveState.current.left || moveState.current.right) {
          velocity.current.x -= direction.current.x * speed * delta;
        }

        // Apply movement
        controls.moveRight(-velocity.current.x * delta);
        controls.moveForward(-velocity.current.z * delta);

        const playerObject = controls.object;
        playerObject.position.y += velocity.current.y * delta;

        // Enhanced collision detection
        const minHeight = 15;
        if (playerObject.position.y <= minHeight) {
          velocity.current.y = 0;
          playerObject.position.y = minHeight;
          moveState.current.canJump = true;
        }

        // World boundaries
        const worldLimit = 60;
        if (Math.abs(playerObject.position.x) > worldLimit) {
          playerObject.position.x = Math.sign(playerObject.position.x) * worldLimit;
        }
        if (Math.abs(playerObject.position.z) > worldLimit) {
          playerObject.position.z = Math.sign(playerObject.position.z) * worldLimit;
        }

        // Determine current biome
        const x = Math.floor(playerObject.position.x);
        const z = Math.floor(playerObject.position.z);
        const temperature = Math.sin(x * 0.01) * 0.5 + 0.5;
        const humidity = Math.cos(z * 0.01) * 0.5 + 0.5;

        let biome = 'plains';
        if (temperature < 0.3) biome = 'tundra';
        else if (temperature > 0.7 && humidity < 0.3) biome = 'desert';
        else if (humidity > 0.7) biome = 'ocean';
        else if (temperature > 0.5 && humidity > 0.5) biome = 'forest';

        setCurrentBiome(biome);

        // Update mob AI
        mobsRef.current.forEach(mob => {
          if (mob.userData.hostile && Math.random() < 0.01) {
            // Simple AI: move towards player
            const direction = new THREE.Vector3()
              .subVectors(playerObject.position, mob.position)
              .normalize();
            mob.position.add(direction.multiplyScalar(0.1));
          }
        });

        // Update particle system
        if (particleSystemRef.current) {
          const positions = particleSystemRef.current.geometry.attributes.position.array as Float32Array;
          const velocities = particleSystemRef.current.geometry.attributes.velocity.array as Float32Array;

          for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += velocities[i + 1];
            if (positions[i + 1] < 0) {
              positions[i + 1] = 100;
            }
          }
          particleSystemRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Air resistance
        velocity.current.x *= 0.8;
        velocity.current.z *= 0.8;

        // Update lighting based on time of day
        const dayTime = gameTime % 24000;
        const lightIntensity = Math.max(0.2, Math.sin((dayTime / 24000) * Math.PI * 2));
        directionalLight.intensity = lightIntensity;

        // Change sky color based on time
        let skyColor = 0x87CEEB; // Day blue
        if (dayTime > 22000 || dayTime < 2000) {
          skyColor = 0x191970; // Night blue
        } else if ((dayTime > 20000 && dayTime < 22000) || (dayTime > 2000 && dayTime < 4000)) {
          skyColor = 0xFF6347; // Sunset/sunrise orange
        }
        renderer.setClearColor(skyColor);
        scene.fog = new THREE.Fog(skyColor, 50, 200);
      }

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    animate(0);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('mousedown', handleMouseClick);

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
      stopVoice(); // Clean up voice resources
    };
  }, [generateTerrain, createParticleSystem, handleKeyDown, handleKeyUp, handleMouseClick, gameTime, weather, stopVoice]);

  // Get time display
  const getTimeDisplay = () => {
    const dayTime = gameTime % 24000;
    const hour = Math.floor((dayTime / 1000) + 6) % 24;
    const minute = Math.floor((dayTime % 1000) / 16.67);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Get weather emoji
  const getWeatherEmoji = () => {
    switch (weather) {
      case 'rain': return '🌧️';
      case 'storm': return '⛈️';
      case 'snow': return '❄️';
      default: return '☀️';
    }
  };

  return (
    <div className="starcraft-container">
      <div 
        ref={mountRef} 
        className="game-viewport"
        onClick={() => {
          if (isLocked && !document.pointerLockElement && rendererRef.current?.domElement) {
            rendererRef.current.domElement.requestPointerLock?.().catch(() => {
              console.log('Pointer lock request failed');
            });
          }
        }}
      />

      {!isLocked && (
        <div className="loading-screen">
          <div className="loading-content">
            <h2>🌟 StarCraft 3D Enhanced</h2>
            <p>Welcome to the ultimate block building experience!</p>
            <button 
              onClick={() => {
                const canvas = rendererRef.current?.domElement;
                if (canvas) {
                  // Try to request pointer lock, but start game regardless
                  canvas.requestPointerLock?.().catch(() => {
                    console.log('Pointer lock not supported or denied, starting without it');
                  });
                  // Always start the game
                  setIsLocked(true);
                } else {
                  // Fallback: just start the game
                  setIsLocked(true);
                }
              }}
              style={{
                padding: '15px 30px',
                background: 'linear-gradient(145deg, #7CB518, #5a9e0c)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                marginRight: '10px'
              }}
            >
              🚀 Start Adventure
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              style={{
                padding: '15px 30px',
                background: 'linear-gradient(145deg, #666, #444)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              ⚙️ Settings
            </button>

            <div className="loading-features">
              <h4>✨ New Features:</h4>
              <ul>
                <li>🌤️ Dynamic Weather & Day/Night Cycle</li>
                <li>🗺️ Multiple Biomes (Plains, Desert, Forest, Mountains, Ocean, Tundra)</li>
                <li>👾 Hostile & Peaceful Mobs</li>
                <li>🔨 Advanced Crafting System</li>
                <li>🎒 Full Inventory Management</li>
                <li>🏆 Achievement System</li>
                <li>💬 Chat System</li>
                <li>🗺️ Mini-map</li>
                <li>🔊 Sound Effects</li>
                <li>⛏️ Tools & Weapons</li>
                <li>💎 Ore Generation</li>
                <li>❤️ Health & Hunger System</li>
              </ul>
            </div>

            <div className="loading-tips">
              <h4>🎮 Controls:</h4>
              <ul>
                <li>WASD - Move | Mouse - Look | Space - Jump</li>
                <li>Shift - Sprint | Ctrl - Sneak</li>
                <li>E - Inventory | C - Crafting | T - Chat</li>
                <li>F - Debug Info | M - Mini-map</li>
                <li>1-9 - Select Items</li>
                <li>Left Click - Break/Attack | Right Click - Place</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="hud-overlay">
          {/* Top HUD */}
          <div className="top-hud">
            <div className="game-info">
              <div className="time-display">🕐 {getTimeDisplay()}</div>
              <div className="weather-display">{getWeatherEmoji()} {weather.charAt(0).toUpperCase() + weather.slice(1)}</div>
              <div className="mode-display">🎮 {gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}</div>
              <div className="fps-display">⚡ {fps} FPS</div>
              <div className="season-display">🍃 {season.charAt(0).toUpperCase() + season.slice(1)}</div>
              <div className="biome-info">🗺️ {biomes[currentBiome]?.name || currentBiome}</div>
            </div>

            <div className="player-stats">
              <div className="health-bar">
                ❤️ Health
                <div className="bar">
                  <div className="bar-fill health" style={{ width: `${(playerHealth / 20) * 100}%` }} />
                </div>
              </div>
              <div className="hunger-bar">
                🍖 Hunger
                <div className="bar">
                  <div className="bar-fill hunger" style={{ width: `${(playerHunger / 20) * 100}%` }} />
                </div>
              </div>
              <div className="xp-bar">
                ⭐ Level {playerLevel}
                <div className="bar">
                  <div className="bar-fill xp" style={{ width: `${(playerXP % 100)}%` }} />
                </div>
              </div>
              {gameMode === 'survival' && (
                <>
                  <div className="oxygen-bar">
                    💨 O₂: {Math.floor(oxygen)}
                  </div>
                  <div className="armor-bar">
                    🛡️ {armor}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Crosshair */}
          <div className="crosshair">
            <div className="crosshair-line horizontal" />
            <div className="crosshair-line vertical" />
          </div>

          {/* Hotbar */}
          <div className="hotbar">
            {blockTypes.slice(0, 9).map((block, index) => {
              const inventoryCount = inventory[block.name.toLowerCase()] || 0;
              return (
                <div
                  key={index}
                  className={`hotbar-slot ${selectedBlock === index ? 'selected' : ''}`}
                  onClick={() => setSelectedBlock(index)}
                >
                  <div className="item-icon">{block.icon}</div>
                  {gameMode === 'survival' && (
                    <div className="item-count">{inventoryCount}</div>
                  )}
                  {gameMode === 'creative' && (
                    <div className="item-count">∞</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Item Info */}
          {blockTypes[selectedBlock] && (
            <div className="selected-item-info">
              <div className="item-name">{blockTypes[selectedBlock].name}</div>
              <div className="item-type">Block</div>
            </div>
          )}

          {/* Mini Map */}
          {showMinimap && (
            <div className="minimap">
              <div className="minimap-header">🗺️ Mini Map</div>
              <div className="minimap-content">
                <div className="player-dot" />
                <div className="coordinates">
                  {playerRef.current && (
                    <>X: {Math.floor(playerRef.current.position.x)} Z: {Math.floor(playerRef.current.position.z)}</>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Debug Info */}
          {showDebug && playerRef.current && (
            <div className="debug-info">
              <h4>🔧 Debug Info</h4>
              <div>Position: {playerRef.current.position.x.toFixed(1)}, {playerRef.current.position.y.toFixed(1)}, {playerRef.current.position.z.toFixed(1)}</div>
              <div>Biome: {currentBiome}</div>
              <div>Game Time: {gameTime}</div>
              <div>Weather: {weather}</div>
              <div>Season: {season}</div>
              <div>Placed Blocks: {placedBlocksRef.current.length}</div>
              <div>Active Mobs: {mobsRef.current.length}</div>
              <div>Achievements: {achievements.length}</div>
            </div>
          )}

          {/* Chat */}
          {showChat && (
            <div className="chat-overlay">
              <div className="chat-messages">
                {chatMessages.slice(-5).map((msg, index) => (
                  <div key={index} className="chat-message">{msg}</div>
                ))}
              </div>
              <form onSubmit={handleChatSubmit} className="chat-input-container">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  autoFocus
                />
                <button type="submit">Send</button>
              </form>
            </div>
          )}

          {/* Controls Help */}
          <div className="controls-help">
            <div className="control-hint">
              <span>WASD</span><span>Move</span>
            </div>
            <div className="control-hint">
              <span>Space</span><span>Jump</span>
            </div>
            <div className="control-hint">
              <span>Shift</span><span>Sprint</span>
            </div>
            <div className="control-hint">
              <span>E</span><span>Inventory</span>
            </div>
            <div className="control-hint">
              <span>C</span><span>Crafting</span>
            </div>
            <div className="control-hint">
              <span>T</span><span>Chat</span>
            </div>
            <div className="control-hint">
              <span>F</span><span>Debug</span>
            </div>
            <div className="control-hint">
              <span>M</span><span>Map</span>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <div className="modal-overlay">
          <div className="inventory-modal">
            <div className="modal-header">
              <h3>🎒 Inventory</h3>
              <button onClick={() => setShowInventory(false)}>×</button>
            </div>
            <div className="inventory-grid">
              {Object.entries(inventory).map(([item, count]) => (
                <div key={item} className="inventory-item">
                  <div className="item-icon">
                    {blockTypes.find(b => b.name.toLowerCase() === item)?.icon || 
                     tools.find(t => t.name.toLowerCase().replace(/\s+/g, '_') === item)?.icon || '📦'}
                  </div>
                  <div className="item-info">
                    <div className="item-name">{item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    <div className="item-count">×{count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Crafting Modal */}
      {showCrafting && (
        <div className="modal-overlay">
          <div className="crafting-modal">
            <div className="modal-header">
              <h3>🔨 Crafting</h3>
              <button onClick={() => setCraftingShow(false)}>×</button>
            </div>
            <div className="crafting-recipes">
              {craftingRecipes.map((recipe, index) => {
                const canCraft = Object.entries(recipe.materials).every(([material, required]: [string, any]) => {
                  return inventory[material] && inventory[material] >= required;
                });

                return (
                  <div 
                    key={index} 
                    className={`recipe-item ${canCraft ? 'craftable' : 'disabled'}`}
                    onClick={() => canCraft && craftItem(recipe)}
                  >
                    <div className="recipe-result">
                      <div className="item-icon">{recipe.icon}</div>
                      <div className="item-name">{recipe.result}</div>
                    </div>
                    <div className="recipe-materials">
                      {Object.entries(recipe.materials).map(([material, required]: [string, any]) => {
                        const available = inventory[material] || 0;
                        return (
                          <div key={material} className="material-requirement">
                            <span className={available >= required ? 'available' : 'missing'}>
                              {material.replace(/_/g, ' ')}: {available}/{required}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="settings-modal">
            <div className="modal-header">
              <h3>⚙️ Game Settings</h3>
              <button onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="settings-content">
              <div className="setting-group">
                <h4>🎮 Game Mode</h4>
                <div className="game-modes">
                  <button 
                    className={`mode-button ${gameMode === 'survival' ? 'active' : ''}`}
                    onClick={() => setGameMode('survival')}
                  >
                    Survival
                  </button>
                  <button 
                    className={`mode-button ${gameMode === 'creative' ? 'active' : ''}`}
                    onClick={() => setGameMode('creative')}
                  >
                    Creative
                  </button>
                </div>
              </div>

              <div className="setting-group">
                <h4>🔧 Display</h4>
                <label>
                  <input
                    type="checkbox"
                    checked={showDebug}
                    onChange={(e) => setShowDebug(e.target.checked)}
                  />
                  Show Debug Info
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showMinimap}
                    onChange={(e) => setShowMinimap(e.target.checked)}
                  />
                  Show Mini-map
                </label>
              </div>

              <div className="setting-group">
                <h4>🌤️ World</h4>
                <label>
                  Weather:
                  <select
                    value={weather}
                    onChange={(e) => setWeather(e.target.value as any)}
                  >
                    <option value="clear">Clear</option>
                    <option value="rain">Rain</option>
                    <option value="storm">Storm</option>
                    <option value="snow">Snow</option>
                  </select>
                </label>
                <label>
                  Season:
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value as any)}
                  >
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="autumn">Autumn</option>
                    <option value="winter">Winter</option>
                  </select>
                </label>
              </div>

              <div className="setting-group">
                <h4>🏆 Progress</h4>
                <div>Achievements: {achievements.length}</div>
                <div>Player Level: {playerLevel}</div>
                <div>XP: {playerXP}</div>
                <button 
                  className="reset-button"
                  onClick={() => {
                    setAchievements([]);
                    setPlayerLevel(1);
                    setPlayerXP(0);
                    setPlayerHealth(20);
                    setPlayerHunger(20);
                  }}
                >
                  Reset Progress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StarCraft3D;