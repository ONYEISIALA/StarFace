// MultiplayerTicTacToe.tsx (Enhanced UI with Game Info Panel)
import React, { useState } from 'react';

interface GameState {
  board: string[];
  currentPlayer: 'X' | 'O';
  winner: string | null;
}

const MultiplayerTicTacToe: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [player, setPlayer] = useState<'X' | 'O' | null>(null);
  const [game, setGame] = useState<GameState>({
    board: Array(9).fill(''),
    currentPlayer: 'X',
    winner: null,
  });

  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    setRoomCode(code);
    setIsRoomCreated(true);
    setPlayer('X');
  };

  const joinRoom = () => {
    if (roomCode.trim().length === 5) {
      setJoinedRoom(true);
      setPlayer('O');
    }
  };

  const checkWinner = (board: string[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const handleClick = (index: number) => {
    if (game.board[index] || game.winner || !player) return;
    if (game.currentPlayer !== player) return;

    const newBoard = [...game.board];
    newBoard[index] = game.currentPlayer;
    const winner = checkWinner(newBoard);
    setGame({
      board: newBoard,
      currentPlayer: game.currentPlayer === 'X' ? 'O' : 'X',
      winner,
    });
  };

  const resetGame = () => {
    setGame({ board: Array(9).fill(''), currentPlayer: 'X', winner: null });
  };

  if (!player) {
    return (
      <div style={containerStyle}>
        <h2>🎮 Multiplayer Tic Tac Toe</h2>
        <button onClick={createRoom} style={buttonStyle}>✨ Create Room</button>
        <p style={{ margin: '16px 0' }}>OR</p>
        <input
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          maxLength={5}
          style={inputStyle}
        />
        <button onClick={joinRoom} style={buttonStyle}>🚪 Join Room</button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={infoPanelStyle}>
        <h2>Room Code: <span style={{ color: '#00D8FF' }}>{roomCode}</span></h2>
        <h3>You are Player: <span style={{ color: player === 'X' ? '#F47FFF' : '#FFD93D' }}>{player}</span></h3>
        <h3>{game.winner ? `🏆 Winner: ${game.winner}` : `🎯 Turn: ${game.currentPlayer}`}</h3>
      </div>
      <div style={boardGridStyle}>
        {game.board.map((cell, index) => (
          <div
            key={index}
            onClick={() => handleClick(index)}
            style={{
              ...cellStyle,
              backgroundColor: cell === 'X' ? '#3b82f6' : cell === 'O' ? '#10b981' : '#eee',
              color: cell ? 'white' : 'black',
            }}
          >
            {cell}
          </div>
        ))}
      </div>
      {game.winner && <button onClick={resetGame} style={{ ...buttonStyle, marginTop: 20 }}>🔄 Play Again</button>}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 20,
  backgroundColor: '#1e1f22',
  minHeight: '100vh',
  color: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const infoPanelStyle: React.CSSProperties = {
  marginBottom: '20px'
};

const boardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 100px)',
  gap: '10px',
  justifyContent: 'center',
  marginTop: '10px',
};

const cellStyle: React.CSSProperties = {
  width: '100px',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2.5rem',
  borderRadius: '10px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: '0.3s ease',
  boxShadow: '0 0 6px rgba(255,255,255,0.1)'
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: '8px',
  backgroundColor: '#5865F2',
  color: 'white',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  margin: '10px'
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '16px',
  marginBottom: '10px',
  textAlign: 'center',
  textTransform: 'uppercase'
};

export default MultiplayerTicTacToe;
