
import React, { useState, useEffect } from 'react';
import './GameSettings.css';

interface GameSettingsProps {
  onBack: () => void;
}

interface Settings {
  performance: {
    maxFPS: number;
    renderDistance: number;
    particleQuality: 'low' | 'medium' | 'high';
    shadowQuality: 'off' | 'low' | 'medium' | 'high';
    enableVSync: boolean;
    antialiasing: boolean;
    textureQuality: 'low' | 'medium' | 'high' | 'ultra';
    enableMultiCore: boolean;
    enableGPUAcceleration: boolean;
    chunkLoadingSpeed: 'slow' | 'normal' | 'fast';
  };
  video: {
    brightness: number;
    hideHand: boolean;
    hidePaper: boolean;
    hideHUD: boolean;
    screenAnimations: boolean;
    hudOpacity: number;
    fov: number;
    fullscreen: boolean;
    windowedMode: 'windowed' | 'borderless' | 'fullscreen';
  };
  controls: {
    type: 'touch' | 'controller' | 'keyboard';
    touchSensitivity: number;
    invertYAxis: boolean;
    lefty: boolean;
    splitControls: boolean;
    swapJumpSneak: boolean;
    buttonSize: number;
    autoJump: boolean;
    mouseSensitivity: number;
    keyBindings: {
      forward: string;
      backward: string;
      left: string;
      right: string;
      jump: string;
      crouch: string;
      sprint: string;
      inventory: string;
      chat: string;
      drop: string;
    };
  };
  audio: {
    music: number;
    sound: number;
    ambientSounds: number;
    uiSounds: number;
    enableTextToSpeech: boolean;
    enableUIScreenReader: boolean;
    enableTextToSpeechChat: boolean;
    enableOpenChatMessage: boolean;
  };
  world: {
    autoSave: boolean;
    autoSaveInterval: number;
    keepInventory: boolean;
    alwaysDay: boolean;
    mobSpawning: boolean;
    dropMobLoot: boolean;
    enableCommandBlocks: boolean;
    showCoordinates: boolean;
    showDaysPlayed: boolean;
    startingMap: boolean;
    bonusChest: boolean;
    hardcore: boolean;
    difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
    enableCheats: boolean;
    flatWorld: boolean;
    generateStructures: boolean;
    spawnRadius: number;
    worldBorder: number;
    enableExperiments: boolean;
    enableAddons: boolean;
    customSeed: string;
    worldType: 'default' | 'superflat' | 'large_biomes' | 'amplified';
    biomeSize: 'small' | 'normal' | 'large';
    oreGeneration: 'low' | 'normal' | 'high';
  };
  gameplay: {
    tooltips: boolean;
    reducedDebugInfo: boolean;
    enableSubtitles: boolean;
    chatSettings: 'shown' | 'commands_only' | 'hidden';
    autoText: boolean;
    narratorHotkey: boolean;
  };
}

const GameSettings: React.FC<GameSettingsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'video' | 'controls' | 'audio' | 'world' | 'gameplay'>('performance');
  const [settings, setSettings] = useState<Settings>(() => {
    // Load settings from localStorage if available
    const saved = localStorage.getItem('starcraft3d-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
    
    // Default settings
    return {
      performance: {
        maxFPS: 60,
        renderDistance: 8,
        particleQuality: 'medium',
        shadowQuality: 'medium',
        enableVSync: true,
        antialiasing: true,
        textureQuality: 'high',
        enableMultiCore: true,
        enableGPUAcceleration: true,
        chunkLoadingSpeed: 'normal',
      },
      video: {
        brightness: 50,
        hideHand: false,
        hidePaper: false,
        hideHUD: false,
        screenAnimations: true,
        hudOpacity: 100,
        fov: 70,
        fullscreen: false,
        windowedMode: 'windowed',
      },
      controls: {
        type: 'keyboard',
        touchSensitivity: 60,
        invertYAxis: false,
        lefty: false,
        splitControls: false,
        swapJumpSneak: false,
        buttonSize: 100,
        autoJump: false,
        mouseSensitivity: 100,
        keyBindings: {
          forward: 'KeyW',
          backward: 'KeyS',
          left: 'KeyA',
          right: 'KeyD',
          jump: 'Space',
          crouch: 'ShiftLeft',
          sprint: 'ControlLeft',
          inventory: 'KeyE',
          chat: 'KeyT',
          drop: 'KeyQ',
        },
      },
      audio: {
        music: 100,
        sound: 100,
        ambientSounds: 100,
        uiSounds: 100,
        enableTextToSpeech: false,
        enableUIScreenReader: false,
        enableTextToSpeechChat: false,
        enableOpenChatMessage: false,
      },
      world: {
        autoSave: true,
        autoSaveInterval: 300,
        keepInventory: false,
        alwaysDay: false,
        mobSpawning: true,
        dropMobLoot: true,
        enableCommandBlocks: false,
        showCoordinates: false,
        showDaysPlayed: false,
        startingMap: false,
        bonusChest: false,
        hardcore: false,
        difficulty: 'normal',
        enableCheats: false,
        flatWorld: false,
        generateStructures: true,
        spawnRadius: 10,
        worldBorder: 59999968,
        enableExperiments: false,
        enableAddons: false,
        customSeed: '',
        worldType: 'default',
        biomeSize: 'normal',
        oreGeneration: 'normal',
      },
      gameplay: {
        tooltips: true,
        reducedDebugInfo: false,
        enableSubtitles: false,
        chatSettings: 'shown',
        autoText: false,
        narratorHotkey: false,
      },
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('starcraft3d-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (category: keyof Settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const resetToDefault = (category: keyof Settings) => {
    const defaults = {
      performance: {
        maxFPS: 60,
        renderDistance: 8,
        particleQuality: 'medium' as const,
        shadowQuality: 'medium' as const,
        enableVSync: true,
        antialiasing: true,
        textureQuality: 'high' as const,
        enableMultiCore: true,
        enableGPUAcceleration: true,
        chunkLoadingSpeed: 'normal' as const,
      },
      video: {
        brightness: 50,
        hideHand: false,
        hidePaper: false,
        hideHUD: false,
        screenAnimations: true,
        hudOpacity: 100,
        fov: 70,
        fullscreen: false,
        windowedMode: 'windowed' as const,
      },
      controls: {
        type: 'keyboard' as const,
        touchSensitivity: 60,
        invertYAxis: false,
        lefty: false,
        splitControls: false,
        swapJumpSneak: false,
        buttonSize: 100,
        autoJump: false,
        mouseSensitivity: 100,
        keyBindings: {
          forward: 'KeyW',
          backward: 'KeyS',
          left: 'KeyA',
          right: 'KeyD',
          jump: 'Space',
          crouch: 'ShiftLeft',
          sprint: 'ControlLeft',
          inventory: 'KeyE',
          chat: 'KeyT',
          drop: 'KeyQ',
        },
      },
      audio: {
        music: 100,
        sound: 100,
        ambientSounds: 100,
        uiSounds: 100,
        enableTextToSpeech: false,
        enableUIScreenReader: false,
        enableTextToSpeechChat: false,
        enableOpenChatMessage: false,
      },
      world: {
        autoSave: true,
        autoSaveInterval: 300,
        keepInventory: false,
        alwaysDay: false,
        mobSpawning: true,
        dropMobLoot: true,
        enableCommandBlocks: false,
        showCoordinates: false,
        showDaysPlayed: false,
        startingMap: false,
        bonusChest: false,
        hardcore: false,
        difficulty: 'normal' as const,
        enableCheats: false,
        flatWorld: false,
        generateStructures: true,
        spawnRadius: 10,
        worldBorder: 59999968,
        enableExperiments: false,
        enableAddons: false,
        customSeed: '',
        worldType: 'default' as const,
        biomeSize: 'normal' as const,
        oreGeneration: 'normal' as const,
      },
      gameplay: {
        tooltips: true,
        reducedDebugInfo: false,
        enableSubtitles: false,
        chatSettings: 'shown' as const,
        autoText: false,
        narratorHotkey: false,
      },
    };

    setSettings(prev => ({
      ...prev,
      [category]: defaults[category]
    }));
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'starcraft3d-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAllData = () => {
    const allData = {
      settings,
      worlds: JSON.parse(localStorage.getItem('starcraft3d-worlds') || '[]'),
      achievements: JSON.parse(localStorage.getItem('starcraft3d-achievements') || '[]'),
      statistics: JSON.parse(localStorage.getItem('starcraft3d-statistics') || '{}')
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'starcraft3d-complete-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveProgress = () => {
    // Auto-save all progress
    localStorage.setItem('starcraft3d-last-save', new Date().toISOString());
    alert('Progress saved successfully!');
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSettings(imported);
          alert('Settings imported successfully!');
        } catch (error) {
          alert('Error importing settings file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="game-settings">
      <div className="settings-background"></div>
      
      {/* Header */}
      <div className="settings-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Main Menu
        </button>
        <h1>Game Settings</h1>
        <div className="settings-actions">
          <button className="export-btn" onClick={saveProgress}>
            💾 Save Progress
          </button>
          <button className="export-btn" onClick={exportSettings}>
            📤 Export Settings
          </button>
          <button className="export-btn" onClick={exportAllData}>
            📦 Backup All Data
          </button>
          <label className="import-btn">
            📥 Import Settings
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="settings-container">
        {/* Sidebar */}
        <div className="settings-sidebar">
          <div className="category-icons">
            <button 
              className={`category-icon ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
              title="Performance"
            >
              ⚡
            </button>
            <button 
              className={`category-icon ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveTab('video')}
              title="Video"
            >
              🖥️
            </button>
            <button 
              className={`category-icon ${activeTab === 'controls' ? 'active' : ''}`}
              onClick={() => setActiveTab('controls')}
              title="Controls"
            >
              🎮
            </button>
            <button 
              className={`category-icon ${activeTab === 'audio' ? 'active' : ''}`}
              onClick={() => setActiveTab('audio')}
              title="Audio"
            >
              🔊
            </button>
            <button 
              className={`category-icon ${activeTab === 'world' ? 'active' : ''}`}
              onClick={() => setActiveTab('world')}
              title="World"
            >
              🌍
            </button>
            <button 
              className={`category-icon ${activeTab === 'gameplay' ? 'active' : ''}`}
              onClick={() => setActiveTab('gameplay')}
              title="Gameplay"
            >
              🎯
            </button>
          </div>
        </div>

        {/* Main Settings Panel */}
        <div className="settings-main">
          {activeTab === 'performance' && (
            <div className="settings-section">
              <h2>Performance Settings</h2>
              
              <div className="setting-item">
                <label>Max FPS: {settings.performance.maxFPS === 0 ? 'Unlimited' : settings.performance.maxFPS}</label>
                <select
                  value={settings.performance.maxFPS}
                  onChange={(e) => updateSetting('performance', 'maxFPS', parseInt(e.target.value))}
                  className="dropdown"
                >
                  <option value={15}>15 FPS</option>
                  <option value={30}>30 FPS</option>
                  <option value={60}>60 FPS</option>
                  <option value={75}>75 FPS</option>
                  <option value={90}>90 FPS</option>
                  <option value={120}>120 FPS</option>
                  <option value={144}>144 FPS</option>
                  <option value={165}>165 FPS</option>
                  <option value={240}>240 FPS</option>
                  <option value={0}>Unlimited</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Chunk Loading Speed</label>
                <select
                  value={settings.performance.chunkLoadingSpeed}
                  onChange={(e) => updateSetting('performance', 'chunkLoadingSpeed', e.target.value)}
                  className="dropdown"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Enable Multi-Core Processing</label>
                <input
                  type="checkbox"
                  checked={settings.performance.enableMultiCore}
                  onChange={(e) => updateSetting('performance', 'enableMultiCore', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Enable GPU Acceleration</label>
                <input
                  type="checkbox"
                  checked={settings.performance.enableGPUAcceleration}
                  onChange={(e) => updateSetting('performance', 'enableGPUAcceleration', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Render Distance: {settings.performance.renderDistance} chunks</label>
                <input
                  type="range"
                  min="2"
                  max="32"
                  value={settings.performance.renderDistance}
                  onChange={(e) => updateSetting('performance', 'renderDistance', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <div className="setting-item">
                <label>Particle Quality</label>
                <select
                  value={settings.performance.particleQuality}
                  onChange={(e) => updateSetting('performance', 'particleQuality', e.target.value)}
                  className="dropdown"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Shadow Quality</label>
                <select
                  value={settings.performance.shadowQuality}
                  onChange={(e) => updateSetting('performance', 'shadowQuality', e.target.value)}
                  className="dropdown"
                >
                  <option value="off">Off</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Texture Quality</label>
                <select
                  value={settings.performance.textureQuality}
                  onChange={(e) => updateSetting('performance', 'textureQuality', e.target.value)}
                  className="dropdown"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Enable VSync</label>
                <input
                  type="checkbox"
                  checked={settings.performance.enableVSync}
                  onChange={(e) => updateSetting('performance', 'enableVSync', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Antialiasing</label>
                <input
                  type="checkbox"
                  checked={settings.performance.antialiasing}
                  onChange={(e) => updateSetting('performance', 'antialiasing', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <button 
                className="reset-button"
                onClick={() => resetToDefault('performance')}
              >
                Reset Performance Settings
              </button>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="settings-section">
              <h2>Video Settings</h2>
              
              <div className="setting-item">
                <label>Brightness: {settings.video.brightness}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.video.brightness}
                  onChange={(e) => updateSetting('video', 'brightness', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <div className="setting-item">
                <label>FOV: {settings.video.fov}°</label>
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={settings.video.fov}
                  onChange={(e) => updateSetting('video', 'fov', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <div className="setting-item">
                <label>HUD Opacity: {settings.video.hudOpacity}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.video.hudOpacity}
                  onChange={(e) => updateSetting('video', 'hudOpacity', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <div className="setting-item">
                <label>Window Mode</label>
                <select
                  value={settings.video.windowedMode}
                  onChange={(e) => updateSetting('video', 'windowedMode', e.target.value)}
                  className="dropdown"
                >
                  <option value="windowed">Windowed</option>
                  <option value="borderless">Borderless Windowed</option>
                  <option value="fullscreen">Fullscreen</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Hide Hand</label>
                <input
                  type="checkbox"
                  checked={settings.video.hideHand}
                  onChange={(e) => updateSetting('video', 'hideHand', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Hide HUD</label>
                <input
                  type="checkbox"
                  checked={settings.video.hideHUD}
                  onChange={(e) => updateSetting('video', 'hideHUD', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Screen Animations</label>
                <input
                  type="checkbox"
                  checked={settings.video.screenAnimations}
                  onChange={(e) => updateSetting('video', 'screenAnimations', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <button 
                className="reset-button"
                onClick={() => resetToDefault('video')}
              >
                Reset Video Settings
              </button>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="settings-section">
              <h2>Controls</h2>
              
              <div className="control-type-tabs">
                <button 
                  className={settings.controls.type === 'keyboard' ? 'active' : ''}
                  onClick={() => updateSetting('controls', 'type', 'keyboard')}
                >
                  Keyboard & Mouse
                </button>
                <button 
                  className={settings.controls.type === 'controller' ? 'active' : ''}
                  onClick={() => updateSetting('controls', 'type', 'controller')}
                >
                  Controller
                </button>
                <button 
                  className={settings.controls.type === 'touch' ? 'active' : ''}
                  onClick={() => updateSetting('controls', 'type', 'touch')}
                >
                  Touch
                </button>
              </div>

              <div className="setting-item">
                <label>Mouse Sensitivity: {settings.controls.mouseSensitivity}%</label>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={settings.controls.mouseSensitivity}
                  onChange={(e) => updateSetting('controls', 'mouseSensitivity', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <div className="setting-item">
                <label>Invert Y-Axis</label>
                <input
                  type="checkbox"
                  checked={settings.controls.invertYAxis}
                  onChange={(e) => updateSetting('controls', 'invertYAxis', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Auto Jump</label>
                <input
                  type="checkbox"
                  checked={settings.controls.autoJump}
                  onChange={(e) => updateSetting('controls', 'autoJump', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <h3>Key Bindings</h3>
              {Object.entries(settings.controls.keyBindings).map(([action, key]) => (
                <div key={action} className="setting-item">
                  <label>{action.charAt(0).toUpperCase() + action.slice(1)}:</label>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => updateSetting('controls', 'keyBindings', {...settings.controls.keyBindings, [action]: e.target.value})}
                    className="key-input"
                    placeholder="Press a key..."
                  />
                </div>
              ))}

              <button 
                className="reset-button"
                onClick={() => resetToDefault('controls')}
              >
                Reset Controls
              </button>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="settings-section">
              <h2>Audio Settings</h2>
              
              <div className="setting-item">
                <label>Master Volume: {settings.audio.sound}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.sound}
                  onChange={(e) => updateSetting('audio', 'sound', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <div className="setting-item">
                <label>Music: {settings.audio.music}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.music}
                  onChange={(e) => updateSetting('audio', 'music', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <div className="setting-item">
                <label>Ambient Sounds: {settings.audio.ambientSounds}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.ambientSounds}
                  onChange={(e) => updateSetting('audio', 'ambientSounds', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <div className="setting-item">
                <label>UI Sounds: {settings.audio.uiSounds}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.uiSounds}
                  onChange={(e) => updateSetting('audio', 'uiSounds', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <h3>Accessibility</h3>
              
              <div className="setting-item">
                <label>Enable Text To Speech</label>
                <input
                  type="checkbox"
                  checked={settings.audio.enableTextToSpeech}
                  onChange={(e) => updateSetting('audio', 'enableTextToSpeech', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Enable UI Screen Reader</label>
                <input
                  type="checkbox"
                  checked={settings.audio.enableUIScreenReader}
                  onChange={(e) => updateSetting('audio', 'enableUIScreenReader', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <button 
                className="reset-button"
                onClick={() => resetToDefault('audio')}
              >
                Reset Audio Settings
              </button>
            </div>
          )}

          {activeTab === 'world' && (
            <div className="settings-section">
              <h2>World Settings</h2>
              
              <h3>Save Settings</h3>
              <div className="setting-item">
                <label>Auto Save</label>
                <input
                  type="checkbox"
                  checked={settings.world.autoSave}
                  onChange={(e) => updateSetting('world', 'autoSave', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Auto Save Interval: {settings.world.autoSaveInterval}s</label>
                <input
                  type="range"
                  min="60"
                  max="1800"
                  step="60"
                  value={settings.world.autoSaveInterval}
                  onChange={(e) => updateSetting('world', 'autoSaveInterval', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <h3>Game Rules</h3>
              <div className="setting-item">
                <label>Difficulty</label>
                <select
                  value={settings.world.difficulty}
                  onChange={(e) => updateSetting('world', 'difficulty', e.target.value)}
                  className="dropdown"
                >
                  <option value="peaceful">Peaceful</option>
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Keep Inventory</label>
                <input
                  type="checkbox"
                  checked={settings.world.keepInventory}
                  onChange={(e) => updateSetting('world', 'keepInventory', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Always Day</label>
                <input
                  type="checkbox"
                  checked={settings.world.alwaysDay}
                  onChange={(e) => updateSetting('world', 'alwaysDay', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Mob Spawning</label>
                <input
                  type="checkbox"
                  checked={settings.world.mobSpawning}
                  onChange={(e) => updateSetting('world', 'mobSpawning', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Drop Mob Loot</label>
                <input
                  type="checkbox"
                  checked={settings.world.dropMobLoot}
                  onChange={(e) => updateSetting('world', 'dropMobLoot', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Enable Command Blocks</label>
                <input
                  type="checkbox"
                  checked={settings.world.enableCommandBlocks}
                  onChange={(e) => updateSetting('world', 'enableCommandBlocks', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Enable Cheats</label>
                <input
                  type="checkbox"
                  checked={settings.world.enableCheats}
                  onChange={(e) => updateSetting('world', 'enableCheats', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <h3>Display</h3>
              <div className="setting-item">
                <label>Show Coordinates</label>
                <input
                  type="checkbox"
                  checked={settings.world.showCoordinates}
                  onChange={(e) => updateSetting('world', 'showCoordinates', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Show Days Played</label>
                <input
                  type="checkbox"
                  checked={settings.world.showDaysPlayed}
                  onChange={(e) => updateSetting('world', 'showDaysPlayed', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <h3>World Generation</h3>
              <div className="setting-item">
                <label>Starting Map</label>
                <input
                  type="checkbox"
                  checked={settings.world.startingMap}
                  onChange={(e) => updateSetting('world', 'startingMap', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Bonus Chest</label>
                <input
                  type="checkbox"
                  checked={settings.world.bonusChest}
                  onChange={(e) => updateSetting('world', 'bonusChest', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Hardcore Mode</label>
                <input
                  type="checkbox"
                  checked={settings.world.hardcore}
                  onChange={(e) => updateSetting('world', 'hardcore', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <h3>World Generation</h3>
              <div className="setting-item">
                <label>World Type</label>
                <select
                  value={settings.world.worldType}
                  onChange={(e) => updateSetting('world', 'worldType', e.target.value)}
                  className="dropdown"
                >
                  <option value="default">Default</option>
                  <option value="superflat">Superflat</option>
                  <option value="large_biomes">Large Biomes</option>
                  <option value="amplified">Amplified</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Flat World</label>
                <input
                  type="checkbox"
                  checked={settings.world.flatWorld}
                  onChange={(e) => updateSetting('world', 'flatWorld', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Generate Structures</label>
                <input
                  type="checkbox"
                  checked={settings.world.generateStructures}
                  onChange={(e) => updateSetting('world', 'generateStructures', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Biome Size</label>
                <select
                  value={settings.world.biomeSize}
                  onChange={(e) => updateSetting('world', 'biomeSize', e.target.value)}
                  className="dropdown"
                >
                  <option value="small">Small</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Ore Generation</label>
                <select
                  value={settings.world.oreGeneration}
                  onChange={(e) => updateSetting('world', 'oreGeneration', e.target.value)}
                  className="dropdown"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Custom Seed</label>
                <input
                  type="text"
                  value={settings.world.customSeed}
                  onChange={(e) => updateSetting('world', 'customSeed', e.target.value)}
                  placeholder="Leave empty for random seed"
                  className="key-input"
                />
              </div>

              <div className="setting-item">
                <label>Spawn Radius: {settings.world.spawnRadius} blocks</label>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={settings.world.spawnRadius}
                  onChange={(e) => updateSetting('world', 'spawnRadius', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <div className="setting-item">
                <label>World Border: {settings.world.worldBorder} blocks</label>
                <input
                  type="range"
                  min="1"
                  max="59999968"
                  step="1000"
                  value={settings.world.worldBorder}
                  onChange={(e) => updateSetting('world', 'worldBorder', parseInt(e.target.value))}
                  className="slider"
                />
              </div>

              <h3>Experiments & Add-ons</h3>
              <div className="setting-item">
                <label>Enable Experiments</label>
                <input
                  type="checkbox"
                  checked={settings.world.enableExperiments}
                  onChange={(e) => updateSetting('world', 'enableExperiments', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Enable Add-ons</label>
                <input
                  type="checkbox"
                  checked={settings.world.enableAddons}
                  onChange={(e) => updateSetting('world', 'enableAddons', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <button 
                className="reset-button"
                onClick={() => resetToDefault('world')}
              >
                Reset World Settings
              </button>
            </div>
          )}

          {activeTab === 'gameplay' && (
            <div className="settings-section">
              <h2>Gameplay Settings</h2>
              
              <div className="setting-item">
                <label>Show Tooltips</label>
                <input
                  type="checkbox"
                  checked={settings.gameplay.tooltips}
                  onChange={(e) => updateSetting('gameplay', 'tooltips', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Reduced Debug Info</label>
                <input
                  type="checkbox"
                  checked={settings.gameplay.reducedDebugInfo}
                  onChange={(e) => updateSetting('gameplay', 'reducedDebugInfo', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Enable Subtitles</label>
                <input
                  type="checkbox"
                  checked={settings.gameplay.enableSubtitles}
                  onChange={(e) => updateSetting('gameplay', 'enableSubtitles', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Chat Settings</label>
                <select
                  value={settings.gameplay.chatSettings}
                  onChange={(e) => updateSetting('gameplay', 'chatSettings', e.target.value)}
                  className="dropdown"
                >
                  <option value="shown">Shown</option>
                  <option value="commands_only">Commands Only</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Auto Text</label>
                <input
                  type="checkbox"
                  checked={settings.gameplay.autoText}
                  onChange={(e) => updateSetting('gameplay', 'autoText', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <div className="setting-item">
                <label>Narrator Hotkey</label>
                <input
                  type="checkbox"
                  checked={settings.gameplay.narratorHotkey}
                  onChange={(e) => updateSetting('gameplay', 'narratorHotkey', e.target.checked)}
                  className="checkbox"
                />
              </div>

              <button 
                className="reset-button"
                onClick={() => resetToDefault('gameplay')}
              >
                Reset Gameplay Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameSettings;
