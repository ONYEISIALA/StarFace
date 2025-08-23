import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WaitingRoom from './WaitingRoom';
import MultiplayerTicTacToe from './MultiplayerTicTacToe';
import MultiplayerMemoryFight from './MultiplayerMemoryFight';
import MultiplayerBottleFlip from './MultiplayerBottleFlip';
import StarCraft3D from './StarCraft3D';
import ColorSpread from './ColorSpread';
import ColorWars from './ColorWars';
import SpeedClick from './SpeedClick';
import NumberTap from './NumberTap';
import QuickMathDuel from './QuickMathDuel';
import ConnectFour from './ConnectFour';

const StarPlay: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');
  const [player, setPlayer] = useState<'X' | 'O' | null>(null);
  const [gameSelected, setGameSelected] = useState<
    'tictactoe' | 'memoryfight' | 'bottleflip' | 'starcraft2d' | 'colorspread' | 'colorwars' | 'speedclick' | 'numbertap' | 'quickmath' | 'connectfour' | null
  >(null);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    setRoomCode(code);
    setPlayer('X');
    setJoinedRoom(true);
  };

  const joinRoom = () => {
    if (roomCode.trim().length === 5) {
      setPlayer('O');
      setJoinedRoom(true);
    }
  };

  const handleGameSelect = (
    game: 'tictactoe' | 'memoryfight' | 'bottleflip' | 'starcraft2d' | 'colorspread' | 'colorwars' | 'speedclick' | 'numbertap' | 'quickmath' | 'connectfour'
  ) => {
    setGameSelected(game);
    setInWaitingRoom(false);
    setGameStarted(true);
  };

  const resetGame = () => {
    setRoomCode('');
    setPlayer(null);
    setGameSelected(null);
    setJoinedRoom(false);
    setInWaitingRoom(false);
    setGameStarted(false);
  };

  const quitGame = () => {
    setGameSelected(null);
    setInWaitingRoom(false);
    setGameStarted(false);
  };

  const navigate = useNavigate();

  const startGame = () => {
    // Navigate to StarCraft main menu when two players connect
    navigate('/main');
  };

  return (
    <div style={containerStyle}>
      <h1>🌟 StarPlay Multiplayer</h1>

      {player && (
        <>
          <p>Room Code: <strong>{roomCode}</strong></p>
          <p>You are Player: <strong>{player}</strong></p>
        </>
      )}

      {!player ? (
        <div>
          <button onClick={createRoom} style={buttonStyle}>🎮 Create Game Room</button>
          <p>OR</p>
          <input
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={5}
            style={inputStyle}
          />
          <button onClick={joinRoom} style={buttonStyle}>🔑 Join Room</button>
        </div>
      ) : !gameSelected ? (
        <div>
          <h2>Select a Game:</h2>
          <div style={gameGridStyle}>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('tictactoe')}>
              ✖️ Tic Tac Toe
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('memoryfight')}>
              🧠 Memory Fight
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('bottleflip')}>
              🍾 Bottle Flip
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('colorwars')}>
              🎨 Color Wars
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('speedclick')}>
              ⚡ Speed Click
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('numbertap')}>
              🔢 Number Tap
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('quickmath')}>
              🧮 Quick Math
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('connectfour')}>
              🔴 Connect Four
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={offlineGameButtonStyle} onClick={() => handleGameSelect('starcraft2d')}>
              🎮 StarCraft3D
              <span style={offlineBadgeStyle}>💻 OFFLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('colorspread')}>
              🎨 Color Spread
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
          </div>
        </div>
      ) : gameSelected ? (
        <>
          <button onClick={() => setShowInstructions(prev => !prev)} style={infoButtonStyle}>
            {showInstructions ? 'Hide' : 'Show'} Instructions
          </button>
          {showInstructions && (
            <div style={instructionBox}>
              <h3>📘 Game Instructions</h3>
              {gameSelected === 'tictactoe' && <p>🌐 <strong>ONLINE:</strong> Take turns placing X and O. First to align 3 wins! Play with real players worldwide!</p>}
              {gameSelected === 'memoryfight' && <p>🌐 <strong>ONLINE:</strong> Flip matching cards before your opponent does. Real-time multiplayer memory battle!</p>}
              {gameSelected === 'bottleflip' && <p>🌐 <strong>ONLINE:</strong> Click flip! Land as many as possible. Challenge real opponents online!</p>}
              {gameSelected === 'colorwars' && <p>🌐 <strong>ONLINE:</strong> Paint as much territory as possible in 2 minutes! Most coverage wins against real players!</p>}
              {gameSelected === 'speedclick' && <p>🌐 <strong>ONLINE:</strong> Click the shapes as fast as possible! First to 10 wins in real-time multiplayer!</p>}
              {gameSelected === 'numbertap' && <p>🌐 <strong>ONLINE:</strong> Tap numbers 1-25 in order as fast as possible! Race against real opponents!</p>}
              {gameSelected === 'quickmath' && <p>🌐 <strong>ONLINE:</strong> Solve math problems quickly! First to 10 correct answers wins against real players!</p>}
              {gameSelected === 'connectfour' && <p>🌐 <strong>ONLINE:</strong> Connect 4 pieces in a row (horizontal, vertical, or diagonal) to win! Real-time online gameplay!</p>}
              {gameSelected === 'starcraft2d' && <p>💻 <strong>OFFLINE:</strong> Use WASD to move around the 3D world. Click blocks to mine them, right-click to place blocks. Use E for inventory, 1-9 to select items. Build and explore in creative mode!</p>}
              {gameSelected === 'colorspread' && <p>🌐 <strong>ONLINE:</strong> Paint the board with your color. Real-time multiplayer color spreading battle!</p>}
            </div>
          )}

          {gameSelected === 'tictactoe' && (
            <MultiplayerTicTacToe roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'memoryfight' && (
            <MultiplayerMemoryFight roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'bottleflip' && (
            <MultiplayerBottleFlip roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'colorwars' && (
            <ColorWars roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'speedclick' && (
            <SpeedClick roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'numbertap' && (
            <NumberTap roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'quickmath' && (
            <QuickMathDuel roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'connectfour' && (
            <ConnectFour roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'starcraft2d' && (
            <StarCraft3D />
          )}
          {gameSelected === 'colorspread' && (
            <ColorSpread roomCode={roomCode} player={player} />
          )}

          <div style={gameActionsStyle}>
            <button onClick={quitGame} style={quitButtonStyle}>🚪 Quit Game</button>
            <button onClick={resetGame} style={resetButtonStyle}>🔁 Reset</button>
          </div>
        </>
      ) : null}
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 20,
  backgroundColor: '#1e1f22',
  minHeight: '100vh',
  color: '#ffffff',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: '8px',
  backgroundColor: '#5865F2',
  color: 'white',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  margin: '10px',
};

const gameButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#10b981',
  fontSize: '1.2rem',
  minWidth: '200px',
  margin: '8px',
};

const onlineGameButtonStyle: React.CSSProperties = {
  ...gameButtonStyle,
  backgroundColor: '#3b82f6',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '15px 20px',
  position: 'relative',
};

const offlineGameButtonStyle: React.CSSProperties = {
  ...gameButtonStyle,
  backgroundColor: '#6b7280',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '15px 20px',
  position: 'relative',
};

const onlineBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  backgroundColor: '#10b981',
  color: 'white',
  padding: '2px 6px',
  borderRadius: '10px',
  marginTop: '5px',
  fontWeight: 'bold',
};

const offlineBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  backgroundColor: '#f59e0b',
  color: 'white',
  padding: '2px 6px',
  borderRadius: '10px',
  marginTop: '5px',
  fontWeight: 'bold',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '16px',
  marginBottom: '10px',
};

const resetButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#ef4444',
  marginTop: '20px',
};

const infoButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#facc15',
};

const instructionBox: React.CSSProperties = {
  backgroundColor: '#333',
  padding: '15px',
  borderRadius: '8px',
  margin: '10px auto',
  maxWidth: '500px',
  textAlign: 'left',
};

const gameGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '15px',
  maxWidth: '800px',
  margin: '0 auto',
  padding: '20px',
};

const gameActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'center',
  marginTop: '20px',
};

const quitButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#f59e0b',
};

export default StarPlay;
