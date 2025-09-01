
import React, { useState, useEffect } from 'react';

interface BombPassProps {
  roomCode: string;
  player: 'X' | 'O';
}

interface PlayerState {
  id: string;
  x: number;
  y: number;
  hasBomb: boolean;
  alive: boolean;
  color: string;
}

const BombPass: React.FC<BombPassProps> = ({ roomCode, player }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<PlayerState[]>([
    { id: 'X', x: 200, y: 150, hasBomb: true, alive: true, color: '#ff4444' },
    { id: 'O', x: 300, y: 250, hasBomb: false, alive: true, color: '#4444ff' }
  ]);
  
  const [bombTimer, setBombTimer] = useState(10);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');

  // Bomb timer countdown
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setBombTimer(prev => {
        if (prev <= 1) {
          // Bomb explodes!
          const bombHolder = players.find(p => p.hasBomb);
          if (bombHolder) {
            setPlayers(prevPlayers => 
              prevPlayers.map(p => 
                p.id === bombHolder.id ? { ...p, alive: false, hasBomb: false } : p
              )
            );
            
            const survivors = players.filter(p => p.alive && p.id !== bombHolder.id);
            if (survivors.length === 1) {
              setWinner(`Player ${survivors[0].id} Wins!`);
              setGameOver(true);
            } else {
              // Start new round
              setRound(prev => prev + 1);
              const newBombHolder = survivors[Math.floor(Math.random() * survivors.length)];
              setPlayers(prevPlayers => 
                prevPlayers.map(p => ({
                  ...p,
                  hasBomb: p.id === newBombHolder.id
                }))
              );
              return Math.max(3, 10 - round); // Timer gets faster each round
            }
          }
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, players, round]);

  const passBomb = () => {
    const currentPlayer = players.find(p => p.id === player);
    if (!currentPlayer || !currentPlayer.hasBomb || !currentPlayer.alive) return;

    const nearbyPlayers = players.filter(p => 
      p.id !== player && p.alive && 
      Math.sqrt(Math.pow(p.x - currentPlayer.x, 2) + Math.pow(p.y - currentPlayer.y, 2)) < 80
    );

    if (nearbyPlayers.length > 0) {
      const target = nearbyPlayers[0];
      setPlayers(prev => prev.map(p => ({
        ...p,
        hasBomb: p.id === target.id
      })));
    }
  };

  const startGame = () => {
    setGameStarted(true);
    // Randomly assign bomb
    const bombHolder = Math.random() > 0.5 ? 'X' : 'O';
    setPlayers([
      { id: 'X', x: 200, y: 150, hasBomb: bombHolder === 'X', alive: true, color: '#ff4444' },
      { id: 'O', x: 300, y: 250, hasBomb: bombHolder === 'O', alive: true, color: '#4444ff' }
    ]);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setWinner('');
    setRound(1);
    setBombTimer(10);
    setPlayers([
      { id: 'X', x: 200, y: 150, hasBomb: true, alive: true, color: '#ff4444' },
      { id: 'O', x: 300, y: 250, hasBomb: false, alive: true, color: '#4444ff' }
    ]);
  };

  return (
    <div style={containerStyle}>
      <h2>💣 Bomb Pass</h2>
      <p>Room: <span style={roomCodeStyle}>{roomCode}</span></p>
      <p>You are Player <span style={{color: player === 'X' ? '#ff4444' : '#4444ff'}}>{player}</span></p>

      {!gameStarted ? (
        <div style={menuStyle}>
          <h3>💣 Hot Potato</h3>
          <div style={instructionsStyle}>
            <p>📋 <strong>Instructions:</strong></p>
            <p>💣 <strong>Goal:</strong> Don't be holding the bomb when it explodes!</p>
            <p>🤝 <strong>Pass:</strong> SPACE when near another player</p>
            <p>⏰ <strong>Timer:</strong> Gets faster each round</p>
            <p>🏆 <strong>Win:</strong> Be the last player alive</p>
          </div>
          <button onClick={startGame} style={buttonStyle}>🏁 Start Game</button>
        </div>
      ) : (
        <div>
          <div style={gameInfoStyle}>
            <div style={timerStyle}>💣 Bomb: {bombTimer}s</div>
            <div style={roundStyle}>Round: {round}</div>
          </div>

          <div style={arenaStyle}>
            {players.map(p => (
              <div
                key={p.id}
                style={{
                  ...playerStyle,
                  left: p.x,
                  top: p.y,
                  backgroundColor: p.alive ? p.color : '#666',
                  opacity: p.alive ? 1 : 0.3,
                  border: p.hasBomb ? '3px solid #ff0000' : '2px solid #fff',
                  animation: p.hasBomb ? 'pulse 0.5s infinite' : 'none'
                }}
              >
                <div style={playerIconStyle}>
                  {!p.alive ? '💀' : p.hasBomb ? '💣' : '🏃'}
                </div>
                <div style={playerLabelStyle}>{p.id}</div>
              </div>
            ))}
          </div>

          <div style={controlsStyle}>
            <button 
              onClick={passBomb} 
              style={passButtonStyle}
              disabled={!players.find(p => p.id === player)?.hasBomb}
            >
              🤝 Pass Bomb
            </button>
            <div style={statusTextStyle}>
              {players.find(p => p.id === player)?.hasBomb 
                ? '💣 You have the bomb! Pass it quickly!' 
                : '🏃 Stay away from the bomb holder!'
              }
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
  backgroundColor: '#7f1d1d',
  color: '#fff',
  minHeight: '100vh'
};

const roomCodeStyle: React.CSSProperties = {
  color: '#00ff88',
  fontWeight: 'bold'
};

const menuStyle: React.CSSProperties = {
  backgroundColor: '#991b1b',
  padding: '30px',
  borderRadius: '15px',
  margin: '20px auto',
  maxWidth: '600px'
};

const instructionsStyle: React.CSSProperties = {
  backgroundColor: '#b91c1c',
  padding: '20px',
  borderRadius: '10px',
  margin: '20px 0',
  textAlign: 'left'
};

const buttonStyle: React.CSSProperties = {
  padding: '15px 30px',
  backgroundColor: '#dc2626',
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
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ff0000',
  animation: 'pulse 1s infinite'
};

const roundStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ffd700'
};

const arenaStyle: React.CSSProperties = {
  position: 'relative',
  width: '500px',
  height: '400px',
  backgroundColor: '#450a0a',
  border: '3px solid #dc2626',
  borderRadius: '10px',
  margin: '20px auto',
  overflow: 'hidden'
};

const playerStyle: React.CSSProperties = {
  position: 'absolute',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px'
};

const playerIconStyle: React.CSSProperties = {
  fontSize: '20px'
};

const playerLabelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '-25px',
  fontSize: '12px',
  fontWeight: 'bold'
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '20px 0'
};

const passButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#dc2626',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const statusTextStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold'
};

const resultStyle: React.CSSProperties = {
  backgroundColor: '#991b1b',
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

export default BombPass;
