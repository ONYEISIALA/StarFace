import React, { useState, useEffect, useCallback } from 'react';

interface KingOfTheHillProps {
  roomCode: string;
  player: 'X' | 'O';
}

interface PlayerState {
  id: string;
  x: number;
  y: number;
  timeOnHill: number;
  color: string;
  isSprinting?: boolean;
  isAnchored?: boolean;
  isShielded?: boolean;
}

const KingOfTheHill: React.FC<KingOfTheHillProps> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<PlayerState[]>([
    { id: 'X', x: 100, y: 200, timeOnHill: 0, color: '#ff4444', isSprinting: false, isAnchored: false, isShielded: false },
    { id: 'O', x: 400, y: 200, timeOnHill: 0, color: '#4444ff', isSprinting: false, isAnchored: false, isShielded: false }
  ]);

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const winTime = 10; // 10 seconds to win

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({...prev, [e.key.toLowerCase()]: true}));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    setKeys(prev => ({...prev, [key]: false}));

    // Handle abilities that are released on key up
    if (key === 'shift') { // Sprint
      setPlayers(prev => prev.map(p => p.id === player ? { ...p, isSprinting: false } : p));
    } else if (key === 'ctrl') { // Anchor
      setPlayers(prev => prev.map(p => p.id === player ? { ...p, isAnchored: false } : p));
    }
  }, [player]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Placeholder functions for new abilities
  const chargeAttack = useCallback(() => {}, []);
  const activateShield = useCallback(() => {
    setPlayers(prev => prev.map(p => p.id === player ? { ...p, isShielded: true } : p));
    setTimeout(() => {
      setPlayers(prev => prev.map(p => p.id === player ? { ...p, isShielded: false } : p));
    }, 3000); // Shield lasts for 3 seconds
  }, [player]);
  const groundPound = useCallback(() => {}, []);
  const rallyCry = useCallback(() => {}, []);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const hillCenter = { x: 250, y: 200, radius: 60 };
    const movementSpeed = 4;
    const sprintSpeed = 7;
    const pushForce = 30;
    const anchorResistance = 2; // Multiplier to push force

    const gameLoop = setInterval(() => {

      setPlayers((prevPlayers) => {
        return prevPlayers.map((p) => {
          let newX = p.x;
          let newY = p.y;
          const currentSpeed = (p.isSprinting && p.id === player) ? sprintSpeed : movementSpeed;
          const resistance = p.isAnchored ? anchorResistance : 1;

          // Player movement
          if (p.id === player) {
            if (keys['w'] || keys['arrowup']) newY = Math.max(30, newY - currentSpeed);
            if (keys['s'] || keys['arrowdown']) newY = Math.min(370, newY + currentSpeed);
            if (keys['a'] || keys['arrowleft']) newX = Math.max(30, newX - currentSpeed);
            if (keys['d'] || keys['arrowright']) newX = Math.min(470, newX + currentSpeed);
          } else {
            // AI movement - try to get to hill
            const dx = hillCenter.x - newX;
            const dy = hillCenter.y - newY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > hillCenter.radius) {
              newX += (dx / distance) * currentSpeed;
              newY += (dy / distance) * currentSpeed;
            }
          }

          // Check if player is on the hill
          const distanceFromHill = Math.sqrt(
            Math.pow(newX - hillCenter.x, 2) + Math.pow(newY - hillCenter.y, 2)
          );

          let newTimeOnHill = p.timeOnHill;
          if (distanceFromHill <= hillCenter.radius) {
            newTimeOnHill += 0.05; // 50ms increment

            if (newTimeOnHill >= winTime) {
              setWinner(`Player ${p.id} Wins! Controlled the hill for ${winTime} seconds!`);
              setGameOver(true);
            }
          }

          return { ...p, x: newX, y: newY, timeOnHill: newTimeOnHill };
        });
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, keys, player, chargeAttack, activateShield, groundPound, rallyCry]); // Include new abilities in dependencies

  const pushOpponents = () => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === player) return p;

      const distance = Math.sqrt(
        Math.pow(p.x - currentPlayer.x, 2) + Math.pow(p.y - currentPlayer.y, 2)
      );

      if (distance < 40 && !p.isShielded) {
        // Push away
        const dx = p.x - currentPlayer.x;
        const dy = p.y - currentPlayer.y;
        const pushDistance = Math.sqrt(dx * dx + dy * dy);
        const effectivePushForce = currentPlayer.isAnchored ? pushForce * anchorResistance : pushForce;

        return {
          ...p,
          x: Math.max(30, Math.min(470, p.x + (dx / pushDistance) * effectivePushForce)),
          y: Math.max(30, Math.min(370, p.y + (dy / pushDistance) * effectivePushForce))
        };
      }

      return p;
    }));
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setPlayers([
      { id: 'X', x: 100, y: 200, timeOnHill: 0, color: '#ff4444', isSprinting: false, isAnchored: false, isShielded: false },
      { id: 'O', x: 400, y: 200, timeOnHill: 0, color: '#4444ff', isSprinting: false, isAnchored: false, isShielded: false }
    ]);
  };

  return (
    <div style={containerStyle}>
      <h2>👑 King of the Hill</h2>
      <p>Room: <span style={roomCodeStyle}>{roomCode}</span></p>
      <p>You are Player <span style={{color: player === 'X' ? '#ff4444' : '#4444ff'}}>{player}</span></p>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>👑 King of the Hill</h3>
          <div style={instructionsStyle}>
            <p>📋 <strong>Instructions:</strong></p>
            <p>🏃 <strong>Move:</strong> WASD or Arrow Keys</p>
            <p>👊 <strong>Push:</strong> SPACE or ENTER (when near opponent)</p>
            <p>⚡ <strong>Special Abilities:</strong></p>
            <p>  Q: Charge Attack (Stronger Push)</p>
            <p>  E: Shield (Temporary Immunity)</p>
            <p>  SHIFT: Sprint (Faster Movement)</p>
            <p>  CTRL: Anchor (Resist Pushes)</p>
            <p>  F: Ground Pound (Area Push)</p>
            <p>  R: Rally Cry (Boost Allies)</p>
            <p>🎯 <strong>Goal:</strong> Stay on the hill for {winTime} seconds</p>
            <p>⚠️ <strong>Strategy:</strong> Use abilities to control the hill!</p>
          </div>
          <button onClick={startGame} style={buttonStyle}>🏁 Start Battle</button>
        </div>
      ) : (
        <div>
          <div style={arenaStyle}>
            {/* The Hill */}
            <div style={hillStyle}>
              <span style={hillLabelStyle}>👑 THE HILL 👑</span>
            </div>

            {/* Players */}
            {players.map(p => (
              <div
                key={p.id}
                style={{
                  ...playerStyle,
                  left: p.x,
                  top: p.y,
                  backgroundColor: p.color,
                  transform: p.isShielded ? 'scale(1.1)' : 'scale(1)', // Visual indicator for shield
                  transition: 'transform 0.3s ease'
                }}
              >
                <div style={playerIconStyle}>👤</div>
                <div style={playerLabelStyle}>{p.id}</div>
                <div style={timeDisplayStyle}>{p.timeOnHill.toFixed(1)}s</div>
                {p.isSprinting && <div style={{position: 'absolute', top: '-10px', fontSize: '8px', color: 'yellow'}}>SPRINT</div>}
                {p.isAnchored && <div style={{position: 'absolute', bottom: '-10px', fontSize: '8px', color: 'gray'}}>ANCHOR</div>}
              </div>
            ))}
          </div>

          <div style={controlsStyle}>
            <button onClick={pushOpponents} style={pushButtonStyle}>👊 Push</button>
            <div style={playerStatsStyle}>
              {players.map(p => (
                <div key={p.id} style={{color: p.color}}>
                  Player {p.id}: {p.timeOnHill.toFixed(1)}/{winTime}s
                </div>
              ))}
            </div>
          </div>

          {gameOver && (
            <div style={resultStyle}>
              <h3>🏆 Game Over!</h3>
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
  backgroundColor: '#2d1b69',
  color: '#fff',
  minHeight: '100vh'
};

const roomCodeStyle: React.CSSProperties = {
  color: '#00ff88',
  fontWeight: 'bold'
};

const menuStyle: React.CSSProperties = {
  backgroundColor: '#3730a3',
  padding: '30px',
  borderRadius: '15px',
  margin: '20px auto',
  maxWidth: '600px'
};

const instructionsStyle: React.CSSProperties = {
  backgroundColor: '#4338ca',
  padding: '20px',
  borderRadius: '10px',
  margin: '20px 0',
  textAlign: 'left'
};

const buttonStyle: React.CSSProperties = {
  padding: '15px 30px',
  backgroundColor: '#7c3aed',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const arenaStyle: React.CSSProperties = {
  position: 'relative',
  width: '500px',
  height: '400px',
  backgroundColor: '#6b7280',
  border: '3px solid #7c3aed',
  borderRadius: '10px',
  margin: '20px auto',
  overflow: 'hidden'
};

const hillStyle: React.CSSProperties = {
  position: 'absolute',
  left: 250 - 60,
  top: 200 - 60,
  width: 60 * 2,
  height: 60 * 2,
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 215, 0, 0.3)',
  border: '3px solid #ffd700',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const hillLabelStyle: React.CSSProperties = {
  fontWeight: 'bold',
  color: '#ffd700',
  fontSize: '12px'
};

const playerStyle: React.CSSProperties = {
  position: 'absolute',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px'
};

const playerIconStyle: React.CSSProperties = {
  fontSize: '16px'
};

const playerLabelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '-20px',
  fontSize: '10px',
  fontWeight: 'bold'
};

const timeDisplayStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-20px',
  fontSize: '10px',
  fontWeight: 'bold',
  color: '#ffd700'
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '20px 0'
};

const pushButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#dc2626',
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
  backgroundColor: '#3730a3',
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

export default KingOfTheHill;