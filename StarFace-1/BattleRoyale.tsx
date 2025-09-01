
import React, { useState, useEffect, useCallback } from 'react';

interface BattleRoyaleProps {
  roomCode: string;
  player: 'X' | 'O';
}

interface PlayerState {
  id: string;
  x: number;
  y: number;
  health: number;
  weapon: string;
  alive: boolean;
  kills: number;
  color: string;
}

interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'weapon' | 'health' | 'armor';
  icon: string;
}

const BattleRoyale: React.FC<BattleRoyaleProps> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<PlayerState[]>([
    { id: 'X', x: 100, y: 100, health: 100, weapon: '👊', alive: true, kills: 0, color: '#ff4444' },
    { id: 'O', x: 300, y: 300, health: 100, weapon: '👊', alive: true, kills: 0, color: '#4444ff' }
  ]);
  
  const [powerUps, setPowerUps] = useState<PowerUp[]>([
    { id: '1', x: 200, y: 150, type: 'weapon', icon: '🔫' },
    { id: '2', x: 350, y: 200, type: 'health', icon: '💊' },
    { id: '3', x: 150, y: 300, type: 'armor', icon: '🛡️' }
  ]);

  const [safeZone, setSafeZone] = useState({ x: 200, y: 200, radius: 250 });
  const [stormTimer, setStormTimer] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [keys, setKeys] = useState<{[key: string]: boolean}>({});

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({...prev, [e.key.toLowerCase()]: true}));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({...prev, [e.key.toLowerCase()]: false}));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Storm timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setStormTimer(prev => {
        if (prev <= 1) {
          setSafeZone(current => ({
            ...current,
            radius: Math.max(50, current.radius * 0.8)
          }));
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setPlayers(prevPlayers => {
        return prevPlayers.map(p => {
          if (!p.alive) return p;

          let newX = p.x;
          let newY = p.y;
          let newHealth = p.health;

          // Player movement
          if (p.id === player) {
            if (keys['w'] || keys['arrowup']) newY = Math.max(10, newY - 3);
            if (keys['s'] || keys['arrowdown']) newY = Math.min(390, newY + 3);
            if (keys['a'] || keys['arrowleft']) newX = Math.max(10, newX - 3);
            if (keys['d'] || keys['arrowright']) newX = Math.min(490, newX + 3);
          } else {
            // AI movement for other player
            const centerX = safeZone.x;
            const centerY = safeZone.y;
            if (newX < centerX) newX += 1;
            if (newX > centerX) newX -= 1;
            if (newY < centerY) newY += 1;
            if (newY > centerY) newY -= 1;
          }

          // Check if player is outside safe zone
          const distanceFromCenter = Math.sqrt(
            Math.pow(newX - safeZone.x, 2) + Math.pow(newY - safeZone.y, 2)
          );
          
          if (distanceFromCenter > safeZone.radius) {
            newHealth = Math.max(0, newHealth - 2);
          }

          // Check if player died
          if (newHealth <= 0) {
            const alivePlayers = prevPlayers.filter(pl => pl.alive && pl.id !== p.id);
            if (alivePlayers.length === 1 && !gameOver) {
              setWinner(`Player ${alivePlayers[0].id} Wins!`);
              setGameOver(true);
            }
            return { ...p, alive: false, health: 0 };
          }

          return { ...p, x: newX, y: newY, health: newHealth };
        });
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, keys, player, safeZone]);

  const attack = () => {
    if (!gameStarted || gameOver) return;
    
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || !currentPlayer.alive) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === player || !p.alive) return p;
      
      const distance = Math.sqrt(
        Math.pow(p.x - currentPlayer.x, 2) + Math.pow(p.y - currentPlayer.y, 2)
      );
      
      if (distance < 50) {
        const damage = currentPlayer.weapon === '🔫' ? 30 : 20;
        const newHealth = Math.max(0, p.health - damage);
        
        if (newHealth <= 0) {
          // Player killed
          return { ...p, health: 0, alive: false };
        }
        
        return { ...p, health: newHealth };
      }
      
      return p;
    }));
  };

  const collectPowerUp = (playerId: string, powerUpId: string) => {
    const powerUp = powerUps.find(p => p.id === powerUpId);
    if (!powerUp) return;

    setPowerUps(prev => prev.filter(p => p.id !== powerUpId));
    
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      
      switch (powerUp.type) {
        case 'weapon':
          return { ...p, weapon: '🔫' };
        case 'health':
          return { ...p, health: Math.min(100, p.health + 50) };
        case 'armor':
          return { ...p, health: Math.min(150, p.health + 25) };
        default:
          return p;
      }
    }));
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setStormTimer(30);
    setSafeZone({ x: 200, y: 200, radius: 250 });
    setPlayers([
      { id: 'X', x: 100, y: 100, health: 100, weapon: '👊', alive: true, kills: 0, color: '#ff4444' },
      { id: 'O', x: 300, y: 300, health: 100, weapon: '👊', alive: true, kills: 0, color: '#4444ff' }
    ]);
    setPowerUps([
      { id: '1', x: 200, y: 150, type: 'weapon', icon: '🔫' },
      { id: '2', x: 350, y: 200, type: 'health', icon: '💊' },
      { id: '3', x: 150, y: 300, type: 'armor', icon: '🛡️' }
    ]);
  };

  return (
    <div style={containerStyle}>
      <h2>⚔️ Battle Royale</h2>
      <p>Room: <span style={roomCodeStyle}>{roomCode}</span></p>
      <p>You are Player <span style={{color: player === 'X' ? '#ff4444' : '#4444ff'}}>{player}</span></p>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>🎮 Battle Royale</h3>
          <div style={instructionsStyle}>
            <p>📋 <strong>Instructions:</strong></p>
            <p>🏃 <strong>Move:</strong> WASD or Arrow Keys</p>
            <p>⚔️ <strong>Attack:</strong> SPACE (close range)</p>
            <p>🎯 <strong>Goal:</strong> Be the last player standing</p>
            <p>⚠️ <strong>Storm:</strong> Stay in the safe zone or take damage!</p>
            <p>📦 <strong>Power-ups:</strong> Collect weapons, health, and armor</p>
          </div>
          <button onClick={startGame} style={buttonStyle}>🏁 Start Battle</button>
        </div>
      ) : (
        <div>
          <div style={gameInfoStyle}>
            <div style={stormInfoStyle}>
              <span>🌪️ Storm shrinking in: {stormTimer}s</span>
              <span>Safe zone radius: {Math.round(safeZone.radius)}m</span>
            </div>
          </div>

          <div style={battleArenaStyle}>
            {/* Safe zone */}
            <div
              style={{
                ...safeZoneStyle,
                width: safeZone.radius * 2,
                height: safeZone.radius * 2,
                left: safeZone.x - safeZone.radius,
                top: safeZone.y - safeZone.radius
              }}
            />

            {/* Players */}
            {players.map(p => (
              <div
                key={p.id}
                style={{
                  ...playerTokenStyle,
                  left: p.x,
                  top: p.y,
                  backgroundColor: p.alive ? p.color : '#666',
                  opacity: p.alive ? 1 : 0.3
                }}
              >
                <div style={playerIconStyle}>{p.alive ? '🏃' : '💀'}</div>
                <div style={playerLabelStyle}>{p.id}</div>
                <div style={healthBarStyle}>
                  <div style={{
                    ...healthFillStyle,
                    width: `${(p.health / 100) * 100}%`,
                    backgroundColor: p.health > 50 ? '#00ff00' : p.health > 25 ? '#ffff00' : '#ff0000'
                  }} />
                </div>
                <div style={weaponIconStyle}>{p.weapon}</div>
              </div>
            ))}

            {/* Power-ups */}
            {powerUps.map(powerUp => (
              <div
                key={powerUp.id}
                style={{
                  ...powerUpTokenStyle,
                  left: powerUp.x,
                  top: powerUp.y
                }}
                onClick={() => {
                  const currentPlayer = players.find(p => p.id === player);
                  if (currentPlayer) {
                    const distance = Math.sqrt(
                      Math.pow(powerUp.x - currentPlayer.x, 2) + Math.pow(powerUp.y - currentPlayer.y, 2)
                    );
                    if (distance < 30) {
                      collectPowerUp(player, powerUp.id);
                    }
                  }
                }}
              >
                {powerUp.icon}
              </div>
            ))}
          </div>

          <div style={controlsStyle}>
            <button 
              onClick={attack} 
              style={attackButtonStyle}
              onMouseDown={() => attack()}
            >
              ⚔️ Attack
            </button>
            <div style={playerStatsStyle}>
              {players.map(p => (
                <div key={p.id} style={{color: p.color}}>
                  Player {p.id}: {p.alive ? `${p.health} HP` : 'Eliminated'}
                </div>
              ))}
            </div>
          </div>

          {gameOver && (
            <div style={resultStyle}>
              <h3>🏆 Battle Over!</h3>
              <p style={winnerStyle}>{winner}</p>
              <button onClick={resetGame} style={buttonStyle}>🔄 Play Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px',
  backgroundColor: '#0f0f23',
  color: '#fff',
  minHeight: '100vh'
};

const roomCodeStyle: React.CSSProperties = {
  color: '#00ff88',
  fontWeight: 'bold'
};

const menuStyle: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  padding: '30px',
  borderRadius: '15px',
  margin: '20px auto',
  maxWidth: '600px'
};

const instructionsStyle: React.CSSProperties = {
  backgroundColor: '#16213e',
  padding: '20px',
  borderRadius: '10px',
  margin: '20px 0',
  textAlign: 'left'
};

const buttonStyle: React.CSSProperties = {
  padding: '15px 30px',
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const gameInfoStyle: React.CSSProperties = {
  margin: '20px 0'
};

const stormInfoStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#ff6b35'
};

const battleArenaStyle: React.CSSProperties = {
  position: 'relative',
  width: '500px',
  height: '400px',
  backgroundColor: '#2c3e50',
  border: '3px solid #e74c3c',
  borderRadius: '10px',
  margin: '20px auto',
  overflow: 'hidden'
};

const safeZoneStyle: React.CSSProperties = {
  position: 'absolute',
  border: '2px solid #00ff88',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 255, 136, 0.1)',
  pointerEvents: 'none'
};

const playerTokenStyle: React.CSSProperties = {
  position: 'absolute',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  border: '2px solid #fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const playerIconStyle: React.CSSProperties = {
  fontSize: '16px'
};

const playerLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'bold',
  position: 'absolute',
  top: '-15px'
};

const healthBarStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '-8px',
  width: '36px',
  height: '4px',
  backgroundColor: '#333',
  borderRadius: '2px'
};

const healthFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.3s ease'
};

const weaponIconStyle: React.CSSProperties = {
  position: 'absolute',
  right: '-8px',
  top: '-8px',
  fontSize: '10px'
};

const powerUpTokenStyle: React.CSSProperties = {
  position: 'absolute',
  width: '25px',
  height: '25px',
  borderRadius: '50%',
  backgroundColor: '#f39c12',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  cursor: 'pointer',
  animation: 'pulse 2s infinite'
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '20px 0'
};

const attackButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const playerStatsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  fontSize: '14px',
  fontWeight: 'bold'
};

const resultStyle: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  padding: '20px',
  borderRadius: '10px',
  margin: '20px auto',
  maxWidth: '400px'
};

const winnerStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#ffd700'
};

export default BattleRoyale;
