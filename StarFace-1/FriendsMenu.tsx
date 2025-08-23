
import React, { useState } from 'react';
import './FriendsMenu.css';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-game';
  game?: string;
  lastSeen?: string;
}

interface FriendsMenuProps {
  onBack: () => void;
}

const FriendsMenu: React.FC<FriendsMenuProps> = ({ onBack }) => {
  const [friends] = useState<Friend[]>([
    {
      id: '1',
      name: 'Steve_Miner',
      avatar: '🧑‍🔧',
      status: 'online'
    },
    {
      id: '2',
      name: 'Alex_Builder',
      avatar: '👩‍🎨',
      status: 'in-game',
      game: 'Survival World'
    },
    {
      id: '3',
      name: 'Enderman_Hunter',
      avatar: '🦹‍♂️',
      status: 'offline',
      lastSeen: '2 hours ago'
    }
  ]);

  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'in-game': return '🎮';
      case 'offline': return '⚫';
      default: return '⚫';
    }
  };

  return (
    <div className="friends-menu">
      <div className="friends-background"></div>
      
      {/* Header */}
      <div className="friends-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="header-icons">
          <span className="icon">👥</span>
          <span className="icon">🌐</span>
          <span className="icon">📱</span>
        </div>
        <h1>Friends</h1>
      </div>

      <div className="friends-container">
        {/* Search Bar */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="add-friend-btn">+ Add Friend</button>
        </div>

        {/* Friends List */}
        <div className="friends-content">
          <div className="friends-list">
            {filteredFriends.length === 0 ? (
              <div className="no-friends">
                <p>Your friends are not playing Craftsman Crafty right now.</p>
              </div>
            ) : (
              filteredFriends.map(friend => (
                <div 
                  key={friend.id} 
                  className={`friend-item ${selectedFriend?.id === friend.id ? 'selected' : ''}`}
                  onClick={() => setSelectedFriend(friend)}
                >
                  <div className="friend-avatar">{friend.avatar}</div>
                  <div className="friend-info">
                    <div className="friend-name">{friend.name}</div>
                    <div className="friend-status">
                      {getStatusIcon(friend.status)}
                      {friend.status === 'in-game' ? `Playing ${friend.game}` : 
                       friend.status === 'offline' ? `Last seen ${friend.lastSeen}` : 
                       'Online'}
                    </div>
                  </div>
                  <div className="friend-actions">
                    {friend.status === 'online' || friend.status === 'in-game' ? (
                      <button className="action-btn invite">Join</button>
                    ) : null}
                    <button className="action-btn message">💬</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Friend Details */}
          {selectedFriend && (
            <div className="friend-details">
              <div className="detail-header">
                <div className="detail-avatar">{selectedFriend.avatar}</div>
                <div className="detail-info">
                  <h3>{selectedFriend.name}</h3>
                  <p className="detail-status">
                    {getStatusIcon(selectedFriend.status)}
                    {selectedFriend.status === 'in-game' ? `Playing ${selectedFriend.game}` : 
                     selectedFriend.status === 'offline' ? `Last seen ${selectedFriend.lastSeen}` : 
                     'Online'}
                  </p>
                </div>
              </div>

              <div className="detail-actions">
                <button className="detail-btn primary">
                  {selectedFriend.status === 'in-game' ? '🎮 Join Game' : '💬 Send Message'}
                </button>
                <button className="detail-btn">👀 View Profile</button>
                <button className="detail-btn">🎁 Send Gift</button>
                <button className="detail-btn danger">❌ Remove Friend</button>
              </div>

              <div className="detail-stats">
                <h4>Statistics</h4>
                <div className="stat-item">
                  <span>Games Played Together:</span>
                  <span>42</span>
                </div>
                <div className="stat-item">
                  <span>Time Played:</span>
                  <span>127 hours</span>
                </div>
                <div className="stat-item">
                  <span>Blocks Placed:</span>
                  <span>15,432</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsMenu;
