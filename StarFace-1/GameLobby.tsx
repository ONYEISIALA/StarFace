import React from 'react';
import { useParams } from 'react-router-dom';

const GamePlaceholder: React.FC = () => {
  const { gameId } = useParams();

  return (
    <div style={{ padding: '30px', textAlign: 'center' }}>
      <h1>🎮 {gameId?.replace(/-/g, ' ')} (Coming Soon)</h1>
      <p>This multiplayer game will be available soon. Stay tuned!</p>
    </div>
  );
};

export default GamePlaceholder;
