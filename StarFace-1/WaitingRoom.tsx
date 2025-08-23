
import React, { useState, useEffect } from 'react';

interface WaitingRoomProps {
  roomCode: string;
  player: 'X' | 'O';
  gameType: string;
  onQuitGame: () => void;
  onGameStart: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ 
  roomCode, 
  player, 
  gameType, 
  onQuitGame, 
  onGameStart 
}) => {
  const [playersConnected, setPlayersConnected] = useState(1);
  const [waitingTime, setWaitingTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaitingTime(prev => prev + 1);
    }, 1000);

    // Simulate second player joining after 3-8 seconds
    const joinTimer = setTimeout(() => {
      setPlayersConnected(2);
      setTimeout(() => {
        onGameStart();
      }, 1500);
    }, Math.random() * 5000 + 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(joinTimer);
    };
  }, [onGameStart]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGameDisplayName = (game: string) => {
    const gameNames: { [key: string]: string } = {
      'tictactoe': 'Tic Tac Toe',
      'memoryfight': 'Memory Fight',
      'bottleflip': 'Bottle Flip',
      'colorwars': 'Color Wars',
      'speedclick': 'Speed Click',
      'numbertap': 'Number Tap',
      'quickmath': 'Quick Math',
      'connectfour': 'Connect Four',
      'starcraft2d': 'StarCraft',
      'colorspread': 'Color Spread'
    };
    return gameNames[game] || game;
  };

  return (
    <div style={containerStyle}>
      <div style={waitingCardStyle}>
        <h1 style={titleStyle}>🎮 Game Waiting Room</h1>
        
        <div style={gameInfoStyle}>
          <h2>{getGameDisplayName(gameType)}</h2>
          <p style={roomCodeStyle}>Room Code: <span style={codeStyle}>{roomCode}</span></p>
          <p style={playerStyle}>You are Player: <span style={playerBadgeStyle}>{player}</span></p>
        </div>

        <div style={statusSectionStyle}>
          <div style={playersStatusStyle}>
            <h3>Players Connected</h3>
            <div style={playerListStyle}>
              <div style={connectedPlayerStyle}>
                <span style={playerIconStyle}>👤</span>
                <span>Player {player} (You)</span>
                <span style={statusBadgeStyle}>Connected</span>
              </div>
              <div style={playersConnected >= 2 ? connectedPlayerStyle : waitingPlayerStyle}>
                <span style={playerIconStyle}>👤</span>
                <span>Player {player === 'X' ? 'O' : 'X'}</span>
                <span style={playersConnected >= 2 ? statusBadgeStyle : waitingBadgeStyle}>
                  {playersConnected >= 2 ? 'Connected' : 'Waiting...'}
                </span>
              </div>
            </div>
          </div>

          {playersConnected < 2 ? (
            <div style={waitingMessageStyle}>
              <div style={spinnerStyle}>⏳</div>
              <p>Waiting for another player to join...</p>
              <p style={timerStyle}>Waiting time: {formatTime(waitingTime)}</p>
              <p style={instructionStyle}>Share room code <strong>{roomCode}</strong> with a friend!</p>
            </div>
          ) : (
            <div style={startingMessageStyle}>
              <div style={checkmarkStyle}>✅</div>
              <p>All players connected!</p>
              <p>Starting game...</p>
            </div>
          )}
        </div>

        <button onClick={onQuitGame} style={quitButtonStyle}>
          🚪 Quit Game
        </button>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#1e1f22',
  color: '#ffffff',
  padding: '20px',
};

const waitingCardStyle: React.CSSProperties = {
  backgroundColor: '#2f3136',
  borderRadius: '15px',
  padding: '30px',
  maxWidth: '500px',
  width: '100%',
  textAlign: 'center',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
};

const titleStyle: React.CSSProperties = {
  marginBottom: '25px',
  color: '#ffffff',
};

const gameInfoStyle: React.CSSProperties = {
  marginBottom: '30px',
  padding: '20px',
  backgroundColor: '#36393f',
  borderRadius: '10px',
};

const roomCodeStyle: React.CSSProperties = {
  margin: '10px 0',
};

const codeStyle: React.CSSProperties = {
  backgroundColor: '#5865F2',
  padding: '5px 10px',
  borderRadius: '5px',
  fontFamily: 'monospace',
  fontWeight: 'bold',
};

const playerStyle: React.CSSProperties = {
  margin: '10px 0',
};

const playerBadgeStyle: React.CSSProperties = {
  backgroundColor: '#10b981',
  padding: '5px 10px',
  borderRadius: '5px',
  fontWeight: 'bold',
};

const statusSectionStyle: React.CSSProperties = {
  marginBottom: '30px',
};

const playersStatusStyle: React.CSSProperties = {
  marginBottom: '20px',
};

const playerListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '15px',
};

const connectedPlayerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px',
  backgroundColor: '#10b981',
  borderRadius: '8px',
};

const waitingPlayerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px',
  backgroundColor: '#4b5563',
  borderRadius: '8px',
};

const playerIconStyle: React.CSSProperties = {
  fontSize: '20px',
};

const statusBadgeStyle: React.CSSProperties = {
  backgroundColor: '#065f46',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
};

const waitingBadgeStyle: React.CSSProperties = {
  backgroundColor: '#374151',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
};

const waitingMessageStyle: React.CSSProperties = {
  padding: '20px',
  backgroundColor: '#36393f',
  borderRadius: '10px',
};

const startingMessageStyle: React.CSSProperties = {
  padding: '20px',
  backgroundColor: '#065f46',
  borderRadius: '10px',
};

const spinnerStyle: React.CSSProperties = {
  fontSize: '30px',
  marginBottom: '10px',
  animation: 'spin 1s linear infinite',
};

const checkmarkStyle: React.CSSProperties = {
  fontSize: '30px',
  marginBottom: '10px',
};

const timerStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '18px',
  color: '#facc15',
};

const instructionStyle: React.CSSProperties = {
  marginTop: '10px',
  fontSize: '14px',
  color: '#9ca3af',
};

const quitButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: '8px',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'background-color 0.3s',
};

export default WaitingRoom;
