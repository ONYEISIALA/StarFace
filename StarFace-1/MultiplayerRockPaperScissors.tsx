// MultiplayerRockPaperScissors.tsx
import React, { useState } from 'react';

const choices = ['Rock', 'Paper', 'Scissors'] as const;
type Choice = typeof choices[number];

interface PlayerState {
  choice: Choice | null;
  hasPlayed: boolean;
}

const MultiplayerRockPaperScissors: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [player, setPlayer] = useState<'A' | 'B' | null>(null);
  const [playerA, setPlayerA] = useState<PlayerState>({ choice: null, hasPlayed: false });
  const [playerB, setPlayerB] = useState<PlayerState>({ choice: null, hasPlayed: false });
  const [result, setResult] = useState('');

  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    setRoomCode(code);
    setIsRoomCreated(true);
    setPlayer('A');
  };

  const joinRoom = () => {
    if (roomCode.trim().length === 5) {
      setJoinedRoom(true);
      setPlayer('B');
    }
  };

  const getResult = (a: Choice, b: Choice) => {
    if (a === b) return 'Draw!';
    if (
      (a === 'Rock' && b === 'Scissors') ||
      (a === 'Paper' && b === 'Rock') ||
      (a === 'Scissors' && b === 'Paper')
    ) {
      return 'Player A Wins!';
    } else {
      return 'Player B Wins!';
    }
  };

  const makeChoice = (choice: Choice) => {
    if (!player) return;
    if (player === 'A') {
      setPlayerA({ choice, hasPlayed: true });
    } else {
      setPlayerB({ choice, hasPlayed: true });
    }
  };

  const resetGame = () => {
    setPlayerA({ choice: null, hasPlayed: false });
    setPlayerB({ choice: null, hasPlayed: false });
    setResult('');
  };

  if (!player) {
    return (
      <div style={containerStyle}>
        <h2>🪨📄✂️ Rock Paper Scissors</h2>
        <button onClick={createRoom} style={buttonStyle}>🎮 Create Room</button>
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

  if (playerA.hasPlayed && playerB.hasPlayed && !result) {
    const outcome = getResult(playerA.choice!, playerB.choice!);
    setResult(outcome);
  }

  return (
    <div style={containerStyle}>
      <h2>Room: <span style={{ color: '#FFD700' }}>{roomCode}</span></h2>
      <h3>You are Player {player}</h3>
      {result ? (
        <>
          <h3>🧠 Result: {result}</h3>
          <p>Player A chose: {playerA.choice}</p>
          <p>Player B chose: {playerB.choice}</p>
          <button onClick={resetGame} style={buttonStyle}>🔁 Play Again</button>
        </>
      ) : (
        <>
          <h3>Choose your move:</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {choices.map((c) => (
              <button key={c} onClick={() => makeChoice(c)} disabled={player === 'A' ? playerA.hasPlayed : playerB.hasPlayed} style={buttonStyle}>{c}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 20,
  backgroundColor: '#1f1f1f',
  color: 'white',
  minHeight: '100vh'
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#5865f2',
  color: 'white',
  fontWeight: 'bold',
  cursor: 'pointer',
  margin: '8px'
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '16px',
  marginBottom: '10px'
};

export default MultiplayerRockPaperScissors;
