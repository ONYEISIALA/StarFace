
import React, { useState } from 'react';
import './WorldsMenu.css';

interface World {
  id: string;
  name: string;
  description: string;
  size: string;
  gameMode: string;
  created: string;
  lastPlayed: string;
  featured: boolean;
  thumbnail: string;
}

interface WorldsMenuProps {
  onBack: () => void;
  onPlayGame: () => void;
}

const WorldsMenu: React.FC<WorldsMenuProps> = ({ onBack, onPlayGame }) => {
  // Create World Modal Styles
  const createWorldModalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  };

  const createWorldContentStyle: React.CSSProperties = {
    background: 'rgba(44, 24, 16, 0.95)',
    border: '3px solid #5D4E37',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
    color: 'white',
  };

  const createWorldFormStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  };

  const formGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  };

  const formRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid #5D4E37',
    borderRadius: '4px',
    color: 'white',
    fontSize: '14px',
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid #5D4E37',
    borderRadius: '4px',
    color: 'white',
    fontSize: '14px',
  };

  const checkboxGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  };

  const modalButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  };

  const cancelButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  };

  const createButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  };

  const [worlds, setWorlds] = useState<World[]>([
    {
      id: '1',
      name: 'Survival Island',
      description: 'A challenging survival world on a remote island',
      size: '256MB',
      gameMode: 'Survival',
      created: '2024-08-10',
      lastPlayed: '2024-08-16',
      featured: true,
      thumbnail: '🏝️'
    },
    {
      id: '2',
      name: 'Creative City',
      description: 'Unlimited resources for building your dream city',
      size: '512MB',
      gameMode: 'Creative',
      created: '2024-08-12',
      lastPlayed: '2024-08-15',
      featured: false,
      thumbnail: '🏙️'
    },
    {
      id: '3',
      name: 'Adventure Quest',
      description: 'Epic adventure with dungeons and treasures',
      size: '128MB',
      gameMode: 'Adventure',
      created: '2024-08-14',
      lastPlayed: '2024-08-16',
      featured: true,
      thumbnail: '⚔️'
    }
  ]);

  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateWorld, setShowCreateWorld] = useState(false);
  const [newWorldSettings, setNewWorldSettings] = useState({
    name: '',
    description: '',
    gameMode: 'survival',
    worldType: 'default',
    difficulty: 'normal',
    keepInventory: false,
    alwaysDay: false,
    mobSpawning: true,
    dropMobLoot: true,
    enableCommandBlocks: false,
    enableCheats: false,
    bonusChest: false,
    startingMap: false,
    hardcore: false,
    flatWorld: false,
    showCoordinates: false,
    generateStructures: true,
    seed: ''
  });

  const filteredWorlds = worlds.filter(world =>
    world.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    world.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGameModeColor = (gameMode: string) => {
    switch (gameMode) {
      case 'Survival': return '#F44336';
      case 'Creative': return '#4CAF50';
      case 'Adventure': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const createNewWorld = () => {
    if (!newWorldSettings.name.trim()) {
      alert('Please enter a world name');
      return;
    }

    const newWorld: World = {
      id: Date.now().toString(),
      name: newWorldSettings.name,
      description: newWorldSettings.description || `A ${newWorldSettings.gameMode} world`,
      size: '0MB',
      gameMode: newWorldSettings.gameMode.charAt(0).toUpperCase() + newWorldSettings.gameMode.slice(1),
      created: new Date().toISOString().split('T')[0],
      lastPlayed: new Date().toISOString().split('T')[0],
      featured: false,
      thumbnail: newWorldSettings.gameMode === 'creative' ? '🎨' : newWorldSettings.gameMode === 'survival' ? '⚔️' : '🌍'
    };

    setWorlds(prev => [...prev, newWorld]);
    
    // Save world settings and initial inventory state to localStorage
    const worldData = {
      settings: newWorldSettings,
      gameMode: newWorldSettings.gameMode, // Explicitly save game mode
      inventory: newWorldSettings.gameMode === 'survival' ? [] : ['stone', 'dirt', 'grass', 'wood', 'leaves', 'sand', 'coal_ore', 'iron_ore', 'diamond_ore'], // Empty for survival, full for creative
      playerData: {
        position: { x: 0, y: 64, z: 0 },
        health: 20,
        hunger: 20,
        experience: 0,
        gameMode: newWorldSettings.gameMode
      }
    };
    
    localStorage.setItem(`world-${newWorld.id}-data`, JSON.stringify(worldData));
    localStorage.setItem(`world-${newWorld.id}-settings`, JSON.stringify(newWorldSettings));
    
    setShowCreateWorld(false);
    setNewWorldSettings({
      name: '',
      description: '',
      gameMode: 'survival',
      worldType: 'default',
      difficulty: 'normal',
      keepInventory: false,
      alwaysDay: false,
      mobSpawning: true,
      dropMobLoot: true,
      enableCommandBlocks: false,
      enableCheats: false,
      bonusChest: false,
      startingMap: false,
      hardcore: false,
      flatWorld: false,
      showCoordinates: false,
      generateStructures: true,
      seed: ''
    });
    
    alert(`World "${newWorld.name}" created successfully! ${newWorldSettings.gameMode === 'survival' ? 'Starting with empty inventory.' : ''}`);
  };

  return (
    <div className="worlds-menu">
      <div className="worlds-background"></div>
      
      {/* Header */}
      <div className="worlds-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="header-icons">
          <span className="icon">🗺️</span>
          <span className="icon">🌍</span>
          <span className="icon">⚙️</span>
        </div>
        <h1>Worlds</h1>
        <button className="refresh-btn">🔄</button>
      </div>

      <div className="worlds-container">
        {/* Search and Actions */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search worlds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="filter-btn">🔽 Filter</button>
          <button className="create-world-btn" onClick={() => setShowCreateWorld(true)}>+ Create World</button>
        </div>

        {/* Featured Worlds Section */}
        <div className="featured-worlds-section">
          <div className="featured-worlds-header">
            <h3>Featured Worlds</h3>
          </div>
          
          <div className="featured-worlds-grid">
            {worlds.filter(w => w.featured).map(world => (
              <div key={world.id} className="featured-world-card">
                <div className="featured-thumbnail">{world.thumbnail}</div>
                <div className="featured-info">
                  <h4>{world.name}</h4>
                  <p>{world.description}</p>
                  <div className="featured-meta">
                    <span style={{ color: getGameModeColor(world.gameMode) }}>
                      {world.gameMode}
                    </span>
                    <span className="world-size">{world.size}</span>
                  </div>
                </div>
                <button className="play-btn" onClick={() => {
                  // Save the selected world's game mode to localStorage for the game to use
                  const worldData = {
                    gameMode: world.gameMode.toLowerCase(),
                    worldId: world.id,
                    worldName: world.name
                  };
                  localStorage.setItem('current-world', JSON.stringify(worldData));
                  onPlayGame();
                }}>▶️ Play</button>
              </div>
            ))}
          </div>
        </div>

        {/* Worlds List */}
        <div className="worlds-content">
          <div className="worlds-list">
            <h3>My Worlds</h3>
            {filteredWorlds.length === 0 ? (
              <div className="no-worlds">
                <p>No worlds found matching your search.</p>
              </div>
            ) : (
              filteredWorlds.map(world => (
                <div 
                  key={world.id} 
                  className={`world-item ${selectedWorld?.id === world.id ? 'selected' : ''}`}
                  onClick={() => setSelectedWorld(world)}
                >
                  <div className="world-thumbnail">{world.thumbnail}</div>
                  <div className="world-info">
                    <div className="world-name">
                      {world.featured && <span className="star">⭐</span>}
                      {world.name}
                    </div>
                    <div className="world-description">{world.description}</div>
                    <div className="world-meta">
                      <span 
                        className="game-mode"
                        style={{ backgroundColor: getGameModeColor(world.gameMode) + '40', color: getGameModeColor(world.gameMode) }}
                      >
                        {world.gameMode}
                      </span>
                      <span className="world-size">{world.size}</span>
                      <span className="last-played">Last played: {world.lastPlayed}</span>
                    </div>
                  </div>
                  <div className="world-actions">
                    <button className="action-btn play" onClick={() => {
                      // Save the selected world's game mode to localStorage for the game to use
                      const worldData = {
                        gameMode: world.gameMode.toLowerCase(),
                        worldId: world.id,
                        worldName: world.name
                      };
                      localStorage.setItem('current-world', JSON.stringify(worldData));
                      onPlayGame();
                    }}>▶️</button>
                    <button className="action-btn edit">✏️</button>
                    <button className="action-btn delete">🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* World Details */}
          {selectedWorld && (
            <div className="world-details">
              <div className="detail-header">
                <div className="detail-thumbnail">{selectedWorld.thumbnail}</div>
                <div className="detail-info">
                  <h3>{selectedWorld.name}</h3>
                  <p className="detail-description">{selectedWorld.description}</p>
                </div>
              </div>

              <div className="detail-stats">
                <div className="stat-row">
                  <span>Game Mode:</span>
                  <span style={{ color: getGameModeColor(selectedWorld.gameMode) }}>
                    {selectedWorld.gameMode}
                  </span>
                </div>
                <div className="stat-row">
                  <span>World Size:</span>
                  <span>{selectedWorld.size}</span>
                </div>
                <div className="stat-row">
                  <span>Created:</span>
                  <span>{selectedWorld.created}</span>
                </div>
                <div className="stat-row">
                  <span>Last Played:</span>
                  <span>{selectedWorld.lastPlayed}</span>
                </div>
              </div>

              <div className="detail-actions">
                <button className="detail-btn primary" onClick={() => {
                  // Save the selected world's game mode to localStorage for the game to use
                  const worldData = {
                    gameMode: selectedWorld.gameMode.toLowerCase(),
                    worldId: selectedWorld.id,
                    worldName: selectedWorld.name
                  };
                  localStorage.setItem('current-world', JSON.stringify(worldData));
                  onPlayGame();
                }}>
                  🎮 Play World
                </button>
                <button className="detail-btn">
                  📋 Duplicate
                </button>
                <button className="detail-btn">
                  📁 Export
                </button>
                <button className="detail-btn">
                  ⚙️ Settings
                </button>
                <button className="detail-btn danger">
                  🗑️ Delete
                </button>
              </div>

              <div className="world-screenshots">
                <h4>Screenshots</h4>
                <div className="screenshots-grid">
                  <div className="screenshot-placeholder">📷</div>
                  <div className="screenshot-placeholder">📷</div>
                  <div className="screenshot-placeholder">📷</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create World Modal */}
      {showCreateWorld && (
        <div style={createWorldModalStyle}>
          <div style={createWorldContentStyle}>
            <h2>Create New World</h2>
            
            <div style={createWorldFormStyle}>
              <div style={formGroupStyle}>
                <label>World Name *</label>
                <input
                  type="text"
                  value={newWorldSettings.name}
                  onChange={(e) => setNewWorldSettings(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter world name..."
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label>Description</label>
                <input
                  type="text"
                  value={newWorldSettings.description}
                  onChange={(e) => setNewWorldSettings(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter world description..."
                  style={inputStyle}
                />
              </div>

              <div style={formRowStyle}>
                <div style={formGroupStyle}>
                  <label>Game Mode</label>
                  <select
                    value={newWorldSettings.gameMode}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, gameMode: e.target.value }))}
                    style={selectStyle}
                  >
                    <option value="survival">Survival</option>
                    <option value="creative">Creative</option>
                    <option value="adventure">Adventure</option>
                    <option value="spectator">Spectator</option>
                  </select>
                </div>

                <div style={formGroupStyle}>
                  <label>Difficulty</label>
                  <select
                    value={newWorldSettings.difficulty}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, difficulty: e.target.value }))}
                    style={selectStyle}
                  >
                    <option value="peaceful">Peaceful</option>
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div style={formGroupStyle}>
                <label>World Type</label>
                <select
                  value={newWorldSettings.worldType}
                  onChange={(e) => setNewWorldSettings(prev => ({ ...prev, worldType: e.target.value }))}
                  style={selectStyle}
                >
                  <option value="default">Default</option>
                  <option value="superflat">Superflat</option>
                  <option value="large_biomes">Large Biomes</option>
                  <option value="amplified">Amplified</option>
                  <option value="single_biome">Single Biome</option>
                </select>
              </div>

              <div style={formGroupStyle}>
                <label>Seed (Optional)</label>
                <input
                  type="text"
                  value={newWorldSettings.seed}
                  onChange={(e) => setNewWorldSettings(prev => ({ ...prev, seed: e.target.value }))}
                  placeholder="Leave empty for random seed..."
                  style={inputStyle}
                />
              </div>

              <h3>Game Rules</h3>
              <div style={checkboxGridStyle}>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={newWorldSettings.keepInventory}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, keepInventory: e.target.checked }))}
                  />
                  Keep Inventory
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={newWorldSettings.alwaysDay}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, alwaysDay: e.target.checked }))}
                  />
                  Always Day
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={newWorldSettings.mobSpawning}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, mobSpawning: e.target.checked }))}
                  />
                  Mob Spawning
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={newWorldSettings.dropMobLoot}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, dropMobLoot: e.target.checked }))}
                  />
                  Drop Mob Loot
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={newWorldSettings.enableCommandBlocks}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, enableCommandBlocks: e.target.checked }))}
                  />
                  Enable Command Blocks
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={newWorldSettings.enableCheats}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, enableCheats: e.target.checked }))}
                  />
                  Enable Cheats
                </label>
              </div>

              <h3>Advanced Options</h3>
              <div style={checkboxGridStyle}>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={newWorldSettings.bonusChest}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, bonusChest: e.target.checked }))}
                  />
                  Bonus Chest
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={newWorldSettings.startingMap}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, startingMap: e.target.checked }))}
                  />
                  Starting Map
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={newWorldSettings.hardcore}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, hardcore: e.target.checked }))}
                  />
                  Hardcore Mode
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={newWorldSettings.showCoordinates}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, showCoordinates: e.target.checked }))}
                  />
                  Show Coordinates
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={newWorldSettings.generateStructures}
                    onChange={(e) => setNewWorldSettings(prev => ({ ...prev, generateStructures: e.target.checked }))}
                  />
                  Generate Structures
                </label>
              </div>
            </div>

            <div style={modalButtonsStyle}>
              <button onClick={() => setShowCreateWorld(false)} style={cancelButtonStyle}>
                Cancel
              </button>
              <button onClick={createNewWorld} style={createButtonStyle}>
                Create World
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldsMenu;
