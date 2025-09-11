
import React, { useState, useEffect } from 'react';

interface SocialDeductionProps {
  roomCode: string;
  player: 'X' | 'O';
}

type GamePhase = 'lobby' | 'tasks' | 'meeting' | 'voting' | 'results';
type PlayerRole = 'crewmate' | 'impostor';

interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  alive: boolean;
  tasksCompleted: number;
  voted: boolean;
}

const SocialDeduction: React.FC<SocialDeductionProps> = ({ roomCode, player }) => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [playerRole, setPlayerRole] = useState<PlayerRole>('crewmate');
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Player X', role: 'crewmate', alive: true, tasksCompleted: 0, voted: false },
    { id: '2', name: 'Player O', role: 'impostor', alive: true, tasksCompleted: 0, voted: false }
  ]);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [meetingCalled, setMeetingCalled] = useState(false);
  const [votes, setVotes] = useState<{[key: string]: string}>({});
  const [gameResult, setGameResult] = useState('');

  useEffect(() => {
    // Assign roles
    setPlayerRole(player === 'X' ? 'crewmate' : 'impostor');
  }, [player]);

  const completeTask = () => {
    if (playerRole === 'crewmate' && gamePhase === 'tasks') {
      setTasksCompleted(prev => {
        const newCount = prev + 1;
        if (newCount >= 5) {
          setGameResult('Crewmates Win! All tasks completed!');
          setGamePhase('results');
        }
        return newCount;
      });
    }
  };

  const callMeeting = () => {
    setGamePhase('meeting');
    setMeetingCalled(true);
  };

  const sabotage = () => {
    if (playerRole === 'impostor') {
      // Simulate sabotage
      setGamePhase('meeting');
      setMeetingCalled(true);
    }
  };

  const votePlayer = (targetId: string) => {
    if (gamePhase === 'voting') {
      setVotes(prev => ({...prev, [player]: targetId}));
      
      // Simulate voting completion
      setTimeout(() => {
        setGamePhase('results');
        if (targetId === '2' && playerRole === 'impostor') {
          setGameResult('Crewmates Win! Impostor eliminated!');
        } else {
          setGameResult('Impostors Win! Wrong player eliminated!');
        }
      }, 2000);
    }
  };

  const startGame = () => {
    setGamePhase('tasks');
  };

  const resetGame = () => {
    setGamePhase('lobby');
    setTasksCompleted(0);
    setMeetingCalled(false);
    setVotes({});
    setGameResult('');
  };

  return (
    <div style={containerStyle}>
      <h2>🚀 Social Deduction Game</h2>
      <p>Room: <span style={roomCodeStyle}>{roomCode}</span></p>
      <p>Role: <span style={playerRole === 'impostor' ? impostorStyle : crewmateStyle}>
        {playerRole === 'impostor' ? '🔪 Impostor' : '👷 Crewmate'}
      </span></p>

      {gamePhase === 'lobby' && (
        <div style={phaseContainerStyle}>
          <h3>Waiting for game to start...</h3>
          <p>Players: {players.length}/2</p>
          <button onClick={startGame} style={buttonStyle}>Start Game</button>
        </div>
      )}

      {gamePhase === 'tasks' && (
        <div style={phaseContainerStyle}>
          <h3>Complete Tasks or Find Impostors!</h3>
          {playerRole === 'crewmate' ? (
            <div>
              <p>Tasks completed: {tasksCompleted}/5</p>
              <div style={taskGridStyle}>
                <button onClick={completeTask} style={taskButtonStyle}>🔧 Fix Wiring</button>
                <button onClick={completeTask} style={taskButtonStyle}>⛽ Fuel Engine</button>
                <button onClick={completeTask} style={taskButtonStyle}>🗑️ Empty Trash</button>
                <button onClick={completeTask} style={taskButtonStyle}>📊 Upload Data</button>
              </div>
              <button onClick={callMeeting} style={emergencyButtonStyle}>🚨 Emergency Meeting</button>
            </div>
          ) : (
            <div>
              <p>Eliminate crewmates without being caught!</p>
              <button onClick={sabotage} style={sabotageButtonStyle}>⚡ Sabotage</button>
              <button onClick={callMeeting} style={emergencyButtonStyle}>🚨 Call Meeting</button>
            </div>
          )}
        </div>
      )}

      {gamePhase === 'meeting' && (
        <div style={phaseContainerStyle}>
          <h3>🗣️ Emergency Meeting</h3>
          <p>Discuss who you think the impostor is!</p>
          <button onClick={() => setGamePhase('voting')} style={buttonStyle}>Start Voting</button>
        </div>
      )}

      {gamePhase === 'voting' && (
        <div style={phaseContainerStyle}>
          <h3>🗳️ Vote to Eliminate</h3>
          <div style={playerListStyle}>
            {players.filter(p => p.alive).map(p => (
              <button 
                key={p.id} 
                onClick={() => votePlayer(p.id)} 
                style={voteButtonStyle}
              >
                Vote {p.name}
              </button>
            ))}
            <button onClick={() => votePlayer('skip')} style={skipButtonStyle}>Skip Vote</button>
          </div>
        </div>
      )}

      {gamePhase === 'results' && (
        <div style={phaseContainerStyle}>
          <h3>🏆 Game Over</h3>
          <p style={resultStyle}>{gameResult}</p>
          <button onClick={resetGame} style={buttonStyle}>Play Again</button>
        </div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px',
  backgroundColor: '#1a1a2e',
  color: '#eee',
  minHeight: '100vh'
};

const roomCodeStyle: React.CSSProperties = {
  color: '#00d4ff',
  fontWeight: 'bold'
};

const crewmateStyle: React.CSSProperties = {
  color: '#00ff00',
  fontWeight: 'bold'
};

const impostorStyle: React.CSSProperties = {
  color: '#ff0000',
  fontWeight: 'bold'
};

const phaseContainerStyle: React.CSSProperties = {
  backgroundColor: '#16213e',
  padding: '20px',
  borderRadius: '10px',
  margin: '20px 0'
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#00d4ff',
  color: '#1a1a2e',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
  margin: '5px'
};

const taskGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '10px',
  margin: '20px 0'
};

const taskButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#4caf50'
};

const emergencyButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#ff5722',
  fontSize: '18px'
};

const sabotageButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#9c27b0'
};

const playerListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  alignItems: 'center'
};

const voteButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#ff9800',
  minWidth: '150px'
};

const skipButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#607d8b'
};

const resultStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#00ff00'
};

export default SocialDeduction;
