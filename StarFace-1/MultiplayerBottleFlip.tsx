import React, { useEffect, useState } from 'react';

interface Props {
  roomCode: string;
  player: 'X' | 'O';
}

interface GameState {
  xScore: number;
  oScore: number;
  turn: 'X' | 'O';
  flips: number;
  gameOver: boolean;
  winner: string | null;
}

const MultiplayerBottleFlip: React.FC<Props> = ({ roomCode, player }) => {
  const [gameState, setGameState] = useState<GameState>({
    xScore: 0,
    oScore: 0,
    turn: 'X',
    flips: 0,
    gameOver: false,
    winner: null,
  });

  const [lastResult, setLastResult] = useState<'Success' | 'Fail' | null>(null);

  const updateLocalStorage = (updatedState: GameState) => {
    localStorage.setItem(roomCode, JSON.stringify(updatedState));
  };

  const readGameState = () => {
    const stored = localStorage.getItem(roomCode);
    if (stored) {
      setGameState(JSON.parse(stored));
    }
  };

  useEffect(() => {
    readGameState();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === roomCode && e.newValue) {
        setGameState(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [roomCode]);

  const flip = () => {
    if (gameState.turn !== player || gameState.gameOver) return;

    const success = Math.random() < 0.5;
    setLastResult(success ? 'Success' : 'Fail');

    const newState: GameState = { ...gameState };
    newState.flips++;

    if (player === 'X' && success) newState.xScore++;
    if (player === 'O' && success) newState.oScore++;

    if (newState.xScore >= 5) {
      newState.gameOver = true;
      newState.winner = 'Player X';
    } else if (newState.oScore >= 5) {
      newState.gameOver = true;
      newState.winner = 'Player O';
    } else {
      newState.turn = player === 'X' ? 'O' : 'X';
    }

    setGameState(newState);
    updateLocalStorage(newState);
  };

  const resetGame = () => {
    const resetState: GameState = {
      xScore: 0,
      oScore: 0,
      turn: 'X',
      flips: 0,
      gameOver: false,
      winner: null,
    };
    setGameState(resetState);
    setLastResult(null);
    updateLocalStorage(resetState);
  };

  return (
    <div style={containerStyle}>
      <h2>🍾 Bottle Flip — Local Multiplayer</h2>
      <p>Room: <strong>{roomCode}</strong> | You: <strong>{player}</strong></p>
      <p>Turn: {gameState.turn === player ? '👉 Your Turn' : '⏳ Waiting...'}</p>

      <div style={scoreBox}>
        <p>🎯 Player X Score: {gameState.xScore}</p>
        <p>🎯 Player O Score: {gameState.oScore}</p>
        <p>🔄 Total Flips: {gameState.flips}</p>
        {lastResult && <p>Last Flip: <strong>{lastResult}</strong></p>}
      </div>

      {!gameState.gameOver ? (
        <button onClick={flip} style={flipButton} disabled={gameState.turn !== player}>
          FLIP NOW!
        </button>
      ) : (
        <>
          <h3>{gameState.winner === `Player ${player}` ? '🎉 You Win!' : '😢 You Lost.'}</h3>
          <button onClick={resetGame} style={resetButton}>🔁 Reset</button>
        </>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#ffffff',
  padding: '30px',
  borderRadius: '10px',
  maxWidth: '500px',
  margin: '20px auto',
  textAlign: 'center'
};

const scoreBox: React.CSSProperties = {
  backgroundColor: '#111827',
  padding: '15px',
  borderRadius: '8px',
  marginBottom: '20px'
};

const flipButton: React.CSSProperties = {
  backgroundColor: '#34d399',
  color: 'white',
  border: 'none',
  padding: '16px 30px',
  fontSize: '18px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const resetButton: React.CSSProperties = {
  ...flipButton,
  backgroundColor: '#f87171'
};

export default MultiplayerBottleFlip;
