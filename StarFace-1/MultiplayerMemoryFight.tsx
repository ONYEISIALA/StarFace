// MultiplayerMemoryFight.tsx (Enhanced)
import React, { useState } from 'react';

interface Card {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

const symbols = ['🍎', '🚀', '🐶', '🎵', '🌟', '⚽', '🎲', '🧩'];

const generateCards = () => {
  const doubleSymbols = [...symbols, ...symbols];
  const shuffled = doubleSymbols.sort(() => 0.5 - Math.random());
  return shuffled.map((symbol, index) => ({
    id: index,
    symbol,
    flipped: false,
    matched: false,
  }));
};

const MultiplayerMemoryFight: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [player, setPlayer] = useState<'A' | 'B' | null>(null);
  const [turn, setTurn] = useState<'A' | 'B'>('A');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);

  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    setRoomCode(code);
    setIsRoomCreated(true);
    setPlayer('A');
    setCards(generateCards());
  };

  const joinRoom = () => {
    if (roomCode.trim().length === 5) {
      setJoinedRoom(true);
      setPlayer('B');
      setCards(generateCards());
    }
  };

  const handleCardClick = (index: number) => {
    if (!player || player !== turn) return;
    const selectedCard = cards[index];
    if (selectedCard.flipped || selectedCard.matched) return;

    const updatedCards = [...cards];
    updatedCards[index].flipped = true;
    const newFlipped = [...flippedCards, index];

    setCards(updatedCards);
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setTimeout(() => {
        const [firstIdx, secondIdx] = newFlipped;
        const first = updatedCards[firstIdx];
        const second = updatedCards[secondIdx];

        if (first.symbol === second.symbol) {
          updatedCards[firstIdx].matched = true;
          updatedCards[secondIdx].matched = true;
          setMatchedCount(prev => prev + 1);
        } else {
          updatedCards[firstIdx].flipped = false;
          updatedCards[secondIdx].flipped = false;
        }

        setCards(updatedCards);
        setFlippedCards([]);
        setTurn(turn === 'A' ? 'B' : 'A');
      }, 1000);
    }
  };

  if (!player) {
    return (
      <div style={containerStyle}>
        <h2>🎯 Memory Fight Multiplayer</h2>
        <button onClick={createRoom} style={buttonStyle}>✨ Create Room</button>
        <p>OR</p>
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
      <h3>Room Code: <span style={{ color: '#FFD93D' }}>{roomCode}</span></h3>
      <h3>You are Player: {player}</h3>
      <h4>Turn: Player {turn}</h4>
      <div style={gridStyle}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            style={cardStyle(card)}
            onClick={() => handleCardClick(index)}
          >
            {card.flipped || card.matched ? card.symbol : '❓'}
          </div>
        ))}
      </div>
      <p>Matched Pairs: {matchedCount}</p>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 20,
  backgroundColor: '#1e1f22',
  minHeight: '100vh',
  color: '#ffffff',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 80px)',
  gap: '10px',
  justifyContent: 'center',
  marginTop: '20px',
};

const cardStyle = (card: Card): React.CSSProperties => ({
  width: '80px',
  height: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2rem',
  backgroundColor: card.matched ? '#10b981' : card.flipped ? '#3b82f6' : '#4b5563',
  color: 'white',
  borderRadius: '10px',
  cursor: card.matched ? 'default' : 'pointer',
  boxShadow: '0 0 8px rgba(0,0,0,0.3)',
});

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

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '16px',
  marginBottom: '10px'
};

export default MultiplayerMemoryFight;
