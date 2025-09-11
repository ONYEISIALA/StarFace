import React, { useState, useEffect, useCallback } from 'react';

interface FreezeTagProps {
  roomCode: string;
  player: 'X' | 'O';
}

interface PlayerState {
  id: string;
  x: number;
  y: number;
  frozen: boolean;
  isIt: boolean;
  color: string;
}

const FreezeTag: React.FC<FreezeTagProps> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<PlayerState[]>([
    { id: 'X', x: 100, y: 200, frozen: false, isIt: true, color: '#ff4444' },
    { id: 'O', x: 400, y: 200, frozen: false, isIt: false, color: '#4444ff' }
  ]);

  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [sprinting, setSprinting] = useState(false); // State for sprinting

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeys(prev => ({...prev, [e.key.toLowerCase()]: true}));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    setKeys(prev => ({...prev, [key]: false}));
    if (key === 'shift') { // Stop sprinting when shift key is released
      setSprinting(false);
    }
  }, []);


  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Game timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const frozenPlayers = players.filter(p => p.frozen && !p.isIt);
          const allFrozen = players.filter(p => !p.isIt).every(p => p.frozen);

          if (allFrozen) {
            setWinner('Tagger Wins! All players frozen!');
          } else {
            setWinner('Runners Win! Time ran out!');
          }
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, players]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setPlayers(prevPlayers => {
        return prevPlayers.map(p => {
          if (p.frozen && !p.isIt) return p;

          let newX = p.x;
          let newY = p.y;

          // Determine movement speed based on sprint state
          const moveSpeed = sprinting && p.id === player && !p.frozen ? 8 : 4;
          const aiSpeed = p.isIt ? 3 : 2;

          if (p.id === player && !p.frozen) {
            // Player movement
            if (keys['w'] || keys['arrowup']) newY = Math.max(30, newY - moveSpeed);
            if (keys['s'] || keys['arrowdown']) newY = Math.min(370, newY + moveSpeed);
            if (keys['a'] || keys['arrowleft']) newX = Math.max(30, newX - moveSpeed);
            if (keys['d'] || keys['arrowright']) newX = Math.min(470, newX + moveSpeed);
          } else if (!p.frozen) {
            // AI movement
            if (p.isIt) {
              // Chase unfrozen players
              const targets = prevPlayers.filter(pl => !pl.isIt && !pl.frozen);
              if (targets.length > 0) {
                const target = targets[0];
                const dx = target.x - newX;
                const dy = target.y - newY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                  newX += (dx / distance) * aiSpeed;
                  newY += (dy / distance) * aiSpeed;
                }
              }
            } else {
              // Run away from tagger
              const tagger = prevPlayers.find(pl => pl.isIt);
              if (tagger) {
                const dx = newX - tagger.x;
                const dy = newY - tagger.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0 && distance < 100) {
                  newX += (dx / distance) * aiSpeed;
                  newY += (dy / distance) * aiSpeed;
                }
              }
            }
          }

          return { ...p, x: newX, y: newY };
        });
      });

      // Check tagging
      setPlayers(prevPlayers => {
        const newPlayers = [...prevPlayers];
        const tagger = newPlayers.find(p => p.isIt);

        if (tagger) {
          for (let i = 0; i < newPlayers.length; i++) {
            const p = newPlayers[i];
            if (p.isIt || p.frozen) continue;

            const distance = Math.sqrt(
              Math.pow(tagger.x - p.x, 2) + Math.pow(tagger.y - p.y, 2)
            );

            if (distance < 25) {
              newPlayers[i] = { ...p, frozen: true };

              // Check if all players are frozen
              const allFrozen = newPlayers.filter(pl => !pl.isIt).every(pl => pl.frozen);
              if (allFrozen) {
                setWinner('Tagger Wins! All players frozen!');
                setGameOver(true);
              }
            }
          }
        }

        return newPlayers;
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, keys, player, sprinting]); // Add sprinting dependency

  // Player actions
  const movePlayer = useCallback((dx: number, dy: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === player && !p.frozen) {
        const moveSpeed = sprinting ? 8 : 4; // Apply sprint speed
        let newX = p.x + dx * moveSpeed;
        let newY = p.y + dy * moveSpeed;

        newX = Math.max(30, Math.min(470, newX));
        newY = Math.max(30, Math.min(370, newY));

        return { ...p, x: newX, y: newY };
      }
      return p;
    }));
  }, [player, sprinting]); // Include sprinting

  const tag = useCallback(() => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || !currentPlayer.isIt || currentPlayer.frozen) return;

    setPlayers(prev => prev.map(p => {
      if (p.isIt || p.frozen) return p;
      const distance = Math.sqrt(
        Math.pow(p.x - currentPlayer.x, 2) + Math.pow(p.y - currentPlayer.y, 2)
      );
      if (distance < 30) {
        return { ...p, frozen: true };
      }
      return p;
    }));
  }, [players, player]);

  const unfreezePlayer = useCallback(() => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || currentPlayer.frozen || currentPlayer.isIt) return;

    setPlayers(prev => prev.map(p => {
      if (p.frozen && !p.isIt) {
        const distance = Math.sqrt(
          Math.pow(p.x - currentPlayer.x, 2) + Math.pow(p.y - currentPlayer.y, 2)
        );

        if (distance < 30) {
          return { ...p, frozen: false };
        }
      }
      return p;
    }));
  }, [players, player]);

  // New abilities
  const longRangeTag = useCallback(() => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || !currentPlayer.isIt || currentPlayer.frozen) return;

    setPlayers(prev => prev.map(p => {
      if (p.isIt || p.frozen) return p;
      const distance = Math.sqrt(
        Math.pow(p.x - currentPlayer.x, 2) + Math.pow(p.y - currentPlayer.y, 2)
      );
      if (distance < 70) { // Increased range
        return { ...p, frozen: true };
      }
      return p;
    }));
  }, [players, player]);

  const unfreeze = useCallback(() => { // Renamed from unfreezePlayer to avoid conflict and for clarity
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || currentPlayer.frozen || currentPlayer.isIt) return;

    setPlayers(prev => prev.map(p => {
      if (p.frozen && !p.isIt) {
        const distance = Math.sqrt(
          Math.pow(p.x - currentPlayer.x, 2) + Math.pow(p.y - currentPlayer.y, 2)
        );
        if (distance < 50) { // Increased unfreeze range
          return { ...p, frozen: false };
        }
      }
      return p;
    }));
  }, [players, player]);

  const flashFreeze = useCallback(() => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || currentPlayer.frozen) return;

    // Temporary immunity for the player using flash freeze
    const immunityDuration = 3000; // 3 seconds
    const currentPlayers = [...players];
    const playerIndex = currentPlayers.findIndex(p => p.id === player);
    if (playerIndex !== -1) {
      currentPlayers[playerIndex] = { ...currentPlayers[playerIndex], frozen: true }; // Simulate being frozen momentarily
      setPlayers(currentPlayers);

      setTimeout(() => {
        setPlayers(prev => prev.map(p => {
          if (p.id === player) {
            return { ...p, frozen: false }; // Remove immunity
          }
          return p;
        }));
      }, immunityDuration);
    }
  }, [players, player]);

  const radarPing = useCallback(() => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || currentPlayer.frozen) return;

    console.log('Radar Ping: Nearby players revealed!');
    // In a real game, this would visually highlight nearby players on the screen.
    // For this example, we'll just log a message.
  }, [player]);

  const camouflage = useCallback(() => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || currentPlayer.frozen) return;

    const invisibilityDuration = 5000; // 5 seconds
    setPlayers(prev => prev.map(p => {
      if (p.id === player) {
        return { ...p, color: '#00000000' }; // Make player invisible
      }
      return p;
    }));

    setTimeout(() => {
      setPlayers(prev => prev.map(p => {
        if (p.id === player) {
          // Restore original color or a default if original is not known
          const originalColor = p.isIt ? '#ff0000' : '#4444ff'; // Example: setting based on isIt status
          return { ...p, color: originalColor };
        }
        return p;
      }));
    }, invisibilityDuration);
  }, [players, player]);


  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameOver || !gameStarted) return;

    const key = e.key.toLowerCase();
    switch (key) {
      case 'arrowleft':
      case 'a':
        movePlayer(-1, 0);
        break;
      case 'arrowright':
      case 'd':
        movePlayer(1, 0);
        break;
      case 'arrowup':
      case 'w':
        movePlayer(0, -1);
        break;
      case 'arrowdown':
      case 's':
        movePlayer(0, 1);
        break;
      case ' ':
      case 'enter':
        e.preventDefault();
        tag();
        break;
      // Special tag abilities
      case 'q':
        // Long range tag
        longRangeTag();
        break;
      case 'e':
        // Unfreeze nearby teammates
        unfreeze();
        break;
      case 'shift':
        // Sprint mode handled by keydown/keyup for continuous press
        break;
      case 'f':
        // Flash freeze - brief freeze immunity
        flashFreeze();
        break;
      case 'r':
        // Radar ping - reveal nearby players
        radarPing();
        break;
      case 'c':
        // Camouflage - temporary invisibility
        camouflage();
        break;
    }
  }, [gameOver, gameStarted, movePlayer, tag, longRangeTag, unfreeze, flashFreeze, radarPing, camouflage]);


  // --- Game Initialization and Reset ---
  const startGame = useCallback(() => {
    setGameStarted(true);
    // Randomly assign who is "it"
    const itPlayerId = Math.random() > 0.5 ? 'X' : 'O';
    setPlayers([
      { id: 'X', x: 100, y: 200, frozen: false, isIt: itPlayerId === 'X', color: itPlayerId === 'X' ? '#ff0000' : '#4444ff' },
      { id: 'O', x: 400, y: 200, frozen: false, isIt: itPlayerId === 'O', color: itPlayerId === 'O' ? '#ff0000' : '#4444ff' }
    ]);
    setTimeLeft(60); // Reset timer
    setGameOver(false); // Reset game over state
    setWinner(''); // Reset winner
  }, []);

  const resetGame = useCallback(() => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setTimeLeft(60);
    setPlayers([
      { id: 'X', x: 100, y: 200, frozen: false, isIt: true, color: '#ff4444' },
      { id: 'O', x: 400, y: 200, frozen: false, isIt: false, color: '#4444ff' }
    ]);
  }, []);

  // --- Render Logic ---
  return (
    <div style={containerStyle}>
      <h2>❄️ Freeze Tag</h2>
      <p>Room: <span style={roomCodeStyle}>{roomCode}</span></p>
      <p>You are: <span style={{color: players.find(p => p.id === player)?.color}}>
        {players.find(p => p.id === player)?.isIt ? '🏃 Tagger' : '🏃 Runner'}
      </span></p>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>❄️ Freeze Tag</h3>
          <div style={instructionsStyle}>
            <p>📋 <strong>Instructions:</strong></p>
            <p>🏃 <strong>Move:</strong> WASD or Arrow Keys</p>
            <p><strong>Sprint:</strong> Hold SHIFT</p>
            <p>🏷️ <strong>Tagger:</strong> Touch runners to freeze them</p>
            <p>🏃 <strong>Runners:</strong> Avoid the tagger, unfreeze teammates</p>
            <p>🤝 <strong>Unfreeze:</strong> SPACE near frozen teammate</p>
            <p>⚡ <strong>Flash Freeze:</strong> F (Temporary immunity)</p>
            <p>📡 <strong>Radar:</strong> R (Reveal nearby players)</p>
            <p>👻 <strong>Camouflage:</strong> C (Temporary invisibility)</p>
            <p>🎯 <strong>Long Range Tag:</strong> Q</p>
            <p>🆘 <strong>Unfreeze All Nearby:</strong> E</p>
          </div>
          <button onClick={startGame} style={buttonStyle}>🏁 Start Tag</button>
        </div>
      ) : (
        <div>
          <div style={gameInfoStyle}>
            <div style={timerStyle}>⏰ Time: {timeLeft}s</div>
            <div style={statusStyle}>
              Frozen: {players.filter(p => p.frozen).length} |
              Active: {players.filter(p => !p.frozen && !p.isIt).length}
            </div>
          </div>

          <div style={arenaStyle}>
            {players.map(p => (
              <div
                key={p.id}
                style={{
                  ...playerStyle,
                  left: p.x,
                  top: p.y,
                  backgroundColor: p.color,
                  opacity: p.frozen ? 0.5 : (p.id === player && keys['c'] ? 0.1 : 1), // Camouflage effect
                  border: p.isIt ? '3px solid #ff0000' : p.frozen ? '3px solid #00ffff' : '2px solid #fff'
                }}
              >
                <div style={playerIconStyle}>
                  {p.isIt ? '🏷️' : p.frozen ? '❄️' : '🏃'}
                </div>
                <div style={playerLabelStyle}>{p.id}</div>
              </div>
            ))}
          </div>

          <div style={controlsStyle}>
            {!players.find(p => p.id === player)?.isIt && !players.find(p => p.id === player)?.frozen && (
              <button onClick={unfreeze} style={unfreezeButtonStyle}>🤝 Unfreeze</button>
            )}
            <div style={instructionStyle}>
              {players.find(p => p.id === player)?.isIt
                ? '🏷️ Tag all runners!'
                : players.find(p => p.id === player)?.frozen
                ? '❄️ Frozen! Wait for rescue!'
                : '🏃 Avoid the tagger!'
              }
              {sprinting && players.find(p => p.id === player)?.id === player && !players.find(p => p.id === player)?.frozen && ' (Sprinting!)'}
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

// --- Styles ---
const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px',
  backgroundColor: '#0c4a6e',
  color: '#fff',
  minHeight: '100vh'
};

const roomCodeStyle: React.CSSProperties = {
  color: '#00ff88',
  fontWeight: 'bold'
};

const menuStyle: React.CSSProperties = {
  backgroundColor: '#0369a1',
  padding: '30px',
  borderRadius: '15px',
  margin: '20px auto',
  maxWidth: '600px'
};

const instructionsStyle: React.CSSProperties = {
  backgroundColor: '#0284c7',
  padding: '20px',
  borderRadius: '10px',
  margin: '20px 0',
  textAlign: 'left'
};

const buttonStyle: React.CSSProperties = {
  padding: '15px 30px',
  backgroundColor: '#0ea5e9',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const gameInfoStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '20px 0'
};

const timerStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ffd700'
};

const statusStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold'
};

const arenaStyle: React.CSSProperties = {
  position: 'relative',
  width: '500px',
  height: '400px',
  backgroundColor: '#64748b',
  border: '3px solid #0ea5e9',
  borderRadius: '10px',
  margin: '20px auto',
  overflow: 'hidden'
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

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '20px 0'
};

const unfreezeButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#10b981',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const instructionStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold'
};

const resultStyle: React.CSSProperties = {
  backgroundColor: '#0369a1',
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

export default FreezeTag;