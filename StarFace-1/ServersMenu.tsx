
import React, { useState } from 'react';
import './ServersMenu.css';

interface Server {
  id: string;
  name: string;
  description: string;
  players: number;
  maxPlayers: number;
  ping: number;
  version: string;
  gameMode: string;
  featured: boolean;
}

interface ServersMenuProps {
  onBack: () => void;
}

const ServersMenu: React.FC<ServersMenuProps> = ({ onBack }) => {
  const [servers] = useState<Server[]>([
    {
      id: '1',
      name: 'uGGGa7s.uGGa7s Survival Server - v1.21.100',
      description: 'The best survival experience with custom features!',
      players: 137,
      maxPlayers: 200,
      ping: 45,
      version: 'v1.21.100',
      gameMode: 'Survival',
      featured: true
    },
    {
      id: '2',
      name: 'Creative Builders Paradise',
      description: 'Unlimited creative building with friends',
      players: 89,
      maxPlayers: 150,
      ping: 32,
      version: 'v1.21.100',
      gameMode: 'Creative',
      featured: false
    },
    {
      id: '3',
      name: 'PvP Arena Championship',
      description: 'Competitive PvP battles and tournaments',
      players: 156,
      maxPlayers: 200,
      ping: 78,
      version: 'v1.21.100',
      gameMode: 'PvP',
      featured: true
    }
  ]);

  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPingColor = (ping: number) => {
    if (ping < 50) return '#4CAF50';
    if (ping < 100) return '#FFC107';
    return '#F44336';
  };

  const getPlayerColor = (players: number, maxPlayers: number) => {
    const ratio = players / maxPlayers;
    if (ratio < 0.5) return '#4CAF50';
    if (ratio < 0.8) return '#FFC107';
    return '#F44336';
  };

  return (
    <div className="servers-menu">
      <div className="servers-background"></div>
      
      {/* Header */}
      <div className="servers-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="header-icons">
          <span className="icon">👥</span>
          <span className="icon">🌐</span>
          <span className="icon">⚙️</span>
        </div>
        <h1>Servers</h1>
        <button className="refresh-btn">🔄</button>
      </div>

      <div className="servers-container">
        {/* Search and Filters */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="filter-btn">🔽 Filter</button>
          <button className="add-server-btn">+ Add Server</button>
        </div>

        {/* More Servers Section */}
        <div className="more-servers-section">
          <div className="more-servers-header">
            <h3>More Servers</h3>
          </div>
          
          {/* Featured Server */}
          {servers.find(s => s.featured) && (
            <div className="featured-server">
              <div className="featured-label">⭐ Featured Server</div>
              <div className="featured-content">
                <div className="featured-info">
                  <h4>{servers.find(s => s.featured)?.name}</h4>
                  <p>{servers.find(s => s.featured)?.description}</p>
                </div>
                <div className="featured-stats">
                  <span style={{ color: getPlayerColor(
                    servers.find(s => s.featured)?.players || 0,
                    servers.find(s => s.featured)?.maxPlayers || 1
                  )}}>
                    {servers.find(s => s.featured)?.players}/{servers.find(s => s.featured)?.maxPlayers} ⚙️
                  </span>
                  <button className="edit-btn">✏️</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Servers List */}
        <div className="servers-content">
          <div className="servers-list">
            {filteredServers.length === 0 ? (
              <div className="no-servers">
                <p>No servers found matching your search.</p>
              </div>
            ) : (
              filteredServers.map(server => (
                <div 
                  key={server.id} 
                  className={`server-item ${selectedServer?.id === server.id ? 'selected' : ''}`}
                  onClick={() => setSelectedServer(server)}
                >
                  <div className="server-icon">🏠</div>
                  <div className="server-info">
                    <div className="server-name">
                      {server.featured && <span className="star">⭐</span>}
                      {server.name}
                    </div>
                    <div className="server-description">{server.description}</div>
                    <div className="server-meta">
                      <span className="game-mode">{server.gameMode}</span>
                      <span className="version">{server.version}</span>
                    </div>
                  </div>
                  <div className="server-stats">
                    <div 
                      className="player-count"
                      style={{ color: getPlayerColor(server.players, server.maxPlayers) }}
                    >
                      {server.players}/{server.maxPlayers}
                    </div>
                    <div 
                      className="ping"
                      style={{ color: getPingColor(server.ping) }}
                    >
                      {server.ping}ms
                    </div>
                    <button className="edit-btn">✏️</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Server Details */}
          {selectedServer && (
            <div className="server-details">
              <div className="detail-header">
                <div className="detail-icon">🏠</div>
                <div className="detail-info">
                  <h3>{selectedServer.name}</h3>
                  <p className="detail-description">{selectedServer.description}</p>
                </div>
              </div>

              <div className="detail-stats">
                <div className="stat-row">
                  <span>Players:</span>
                  <span style={{ color: getPlayerColor(selectedServer.players, selectedServer.maxPlayers) }}>
                    {selectedServer.players}/{selectedServer.maxPlayers}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Ping:</span>
                  <span style={{ color: getPingColor(selectedServer.ping) }}>
                    {selectedServer.ping}ms
                  </span>
                </div>
                <div className="stat-row">
                  <span>Version:</span>
                  <span>{selectedServer.version}</span>
                </div>
                <div className="stat-row">
                  <span>Game Mode:</span>
                  <span>{selectedServer.gameMode}</span>
                </div>
              </div>

              <div className="detail-actions">
                <button className="detail-btn primary">
                  🎮 Join Server
                </button>
                <button className="detail-btn">
                  📋 Copy Address
                </button>
                <button className="detail-btn">
                  ⭐ Add to Favorites
                </button>
                <button className="detail-btn">
                  📊 Server Info
                </button>
              </div>

              <div className="server-rules">
                <h4>Server Rules</h4>
                <ul>
                  <li>No griefing or stealing</li>
                  <li>Be respectful to other players</li>
                  <li>No spam in chat</li>
                  <li>Follow build guidelines</li>
                  <li>Have fun and enjoy!</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServersMenu;
