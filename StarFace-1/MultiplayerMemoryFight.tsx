
import React, { useState, useEffect, useCallback } from 'react';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  animating: boolean;
}

interface Props {
  roomCode: string;
  player: 'X' | 'O';
}

const MultiplayerMemoryFight: React.FC<Props> = ({ roomCode, player }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, type: string}>>([]);
  const [powerUps, setPowerUps] = useState<Array<{id: number, type: string, x: number, y: number}>>([]);

  const cardEmojis = ['🎮', '🚀', '⭐', '🎯', '🏆', '💎', '🔥', '⚡', '🎨', '🎪', '🎭', '🎲'];

  const createParticles = (x: number, y: number, type: string) => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 60,
      y: y + (Math.random() - 0.5) * 60,
      type
    }));
    
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1500);
  };

  const generateCards = useCallback(() => {
    const gameEmojis = cardEmojis.slice(0, 8);
    const cardPairs = [...gameEmojis, ...gameEmojis];
    const shuffledCards = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
        animating: false
      }));
    
    setCards(shuffledCards);
  }, []);

  const flipCard = (cardId: number) => {
    if (currentPlayer !== player || flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || card.animating) return;

    // Add flip animation
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, animating: true } : c
    ));

    setTimeout(() => {
      setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, isFlipped: true, animating: false } : c
      ));
      setFlippedCards(prev => [...prev, cardId]);
    }, 150);

    // Create flip particles
    const cardElement = document.getElementById(`card-${cardId}`);
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      createParticles(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        'flip'
      );
    }
  };

  const checkMatch = useCallback(() => {
    if (flippedCards.length !== 2) return;

    const [firstId, secondId] = flippedCards;
    const firstCard = cards.find(c => c.id === firstId);
    const secondCard = cards.find(c => c.id === secondId);

    if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
      // Match found!
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
        ));
        setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
        setCombo(prev => prev + 1);
        
        // Create match particles
        const firstElement = document.getElementById(`card-${firstId}`);
        const secondElement = document.getElementById(`card-${secondId}`);
        
        if (firstElement && secondElement) {
          const rect1 = firstElement.getBoundingClientRect();
          const rect2 = secondElement.getBoundingClientRect();
          createParticles(rect1.left + rect1.width / 2, rect1.top + rect1.height / 2, 'match');
          createParticles(rect2.left + rect2.width / 2, rect2.top + rect2.height / 2, 'match');
        }

        // Check if game is complete
        const updatedCards = cards.map(c => 
          c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
        );
        
        if (updatedCards.every(c => c.isMatched)) {
          setGameOver(true);
        }
      }, 500);
      
      setFlippedCards([]);
    } else {
      // No match - flip back after delay
      setTimeout(() => {
        setCards(prev => prev.map(c => 
          c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
        ));
        setFlippedCards([]);
        setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
        setCombo(0);
      }, 1000);
    }
  }, [flippedCards, cards, currentPlayer]);

  useEffect(() => {
    checkMatch();
  }, [flippedCards, checkMatch]);

  useEffect(() => {
    if (gameStarted && !gameOver && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
    }
  }, [gameStarted, gameOver, timeLeft]);

  useEffect(() => {
    if (gameStarted) {
      generateCards();
    }
  }, [gameStarted, generateCards]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScores({ X: 0, O: 0 });
    setCurrentPlayer('X');
    setTimeLeft(60);
    setCombo(0);
    setFlippedCards([]);
    setParticles([]);
    generateCards();
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setCards([]);
    setFlippedCards([]);
    setRound(prev => prev + 1);
    setCombo(0);
    setParticles([]);
  };

  if (!gameStarted) {
    return (
      <div style={containerStyle}>
        <div style={menuStyle}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            🧠 Memory Fight Arena
          </h2>
          <div style={gameInfoStyle}>
            <p>🎮 <strong>Room:</strong> {roomCode}</p>
            <p>🎯 <strong>You are:</strong> Player {player}</p>
            <p>⚡ <strong>Goal:</strong> Find matching pairs faster than your opponent!</p>
          </div>
          <button onClick={startGame} style={startButtonStyle}>
            🚀 Begin Memory Battle!
          </button>
        </div>
      </div>
    );
  }

  const winner = gameOver 
    ? (scores.X > scores.O ? 'X' : scores.O > scores.X ? 'O' : 'draw')
    : null;

  return (
    <div style={containerStyle}>
      {/* Particle Effects */}
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'fixed',
            left: particle.x,
            top: particle.y,
            width: particle.type === 'match' ? '12px' : '8px',
            height: particle.type === 'match' ? '12px' : '8px',
            borderRadius: '50%',
            backgroundColor: particle.type === 'match' ? '#ffd700' : '#4ecdc4',
            pointerEvents: 'none',
            zIndex: 1000,
            animation: `particleFade 1.5s ease-out forwards`,
            boxShadow: `0 0 10px ${particle.type === 'match' ? '#ffd700' : '#4ecdc4'}`
          }}
        />
      ))}

      <div style={headerStyle}>
        <h2 style={{ fontSize: '2rem', margin: '0 0 1rem 0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          🧠 Memory Fight Arena
        </h2>
        
        <div style={gameStatsStyle}>
          <div style={scoreboardStyle}>
            <div style={{ ...playerScoreStyle, color: player === 'X' ? '#ffd700' : '#ffffff' }}>
              ❌ You: {scores.X}
            </div>
            <div style={{ ...playerScoreStyle, color: player === 'O' ? '#ffd700' : '#ffffff' }}>
              ⭕ Opponent: {scores.O}
            </div>
          </div>
          
          <div style={statusRowStyle}>
            <div style={timerStyle}>
              ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div style={comboStyle}>
              {combo > 0 && `🔥 Combo x${combo}`}
            </div>
            <div style={roundStyle}>
              Round {round}
            </div>
          </div>
        </div>
      </div>

      <div style={gameAreaStyle}>
        {gameOver && (
          <div style={gameOverStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              {winner === 'draw' ? '🤝 Epic Draw!' : 
               winner === player ? '🏆 Victory!' : '😔 Defeat!'}
            </div>
            <div style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
              Final Score: {scores.X} - {scores.O}
            </div>
            <button onClick={resetGame} style={resetButtonStyle}>
              🔄 New Round
            </button>
          </div>
        )}

        {!gameOver && (
          <div style={turnIndicatorStyle}>
            {currentPlayer === player ? "🎯 Your Turn!" : `⏳ Player ${currentPlayer}'s Turn`}
          </div>
        )}

        <div style={cardGridStyle}>
          {cards.map((card) => (
            <div
              key={card.id}
              id={`card-${card.id}`}
              className="memory-card"
              onClick={() => flipCard(card.id)}
              style={{
                ...cardStyle,
                transform: card.animating ? 'rotateY(90deg) scale(1.1)' : 
                          card.isFlipped || card.isMatched ? 'rotateY(0deg)' : 'rotateY(0deg)',
                background: card.isFlipped || card.isMatched
                  ? 'linear-gradient(135deg, #667eea, #764ba2)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                boxShadow: card.isMatched 
                  ? '0 8px 32px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)'
                  : card.isFlipped
                  ? '0 8px 25px rgba(102, 126, 234, 0.4)'
                  : '0 4px 15px rgba(0, 0, 0, 0.2)',
                cursor: card.isMatched || card.isFlipped || currentPlayer !== player ? 'default' : 'pointer',
                opacity: card.isMatched ? 0.7 : 1,
              }}
            >
              <div style={{
                fontSize: '2.5rem',
                transform: card.isFlipped || card.isMatched ? 'scale(1)' : 'scale(0)',
                transition: 'transform 0.3s ease',
                filter: card.isMatched ? 'brightness(1.2)' : 'none'
              }}>
                {card.isFlipped || card.isMatched ? card.emoji : '❓'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>
        {`
          @keyframes particleFade {
            0% { opacity: 1; transform: scale(1) translateY(0); }
            100% { opacity: 0; transform: scale(0.3) translateY(-40px); }
          }

          .memory-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }

          .memory-card:before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.6s;
          }

          .memory-card:hover:before {
            left: 100%;
          }

          .memory-card:hover {
            transform: translateY(-3px) scale(1.02) !important;
          }

          .memory-card:active {
            transform: translateY(0) scale(0.98) !important;
          }

          @media (max-width: 768px) {
            .memory-card {
              min-height: 80px;
              border-radius: 12px;
            }
          }

          @media (max-width: 480px) {
            .memory-card {
              min-height: 70px;
              border-radius: 10px;
            }
          }
        `}
      </style>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
  backgroundSize: '400% 400%',
  animation: 'gradientShift 15s ease infinite',
  padding: '20px',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
};

const menuStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
  textAlign: 'center',
};

const gameInfoStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  marginBottom: '2rem',
  lineHeight: '1.6',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '2rem',
  position: 'relative',
  zIndex: 10,
};

const gameStatsStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '15px',
  padding: '20px',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  maxWidth: '600px',
  margin: '0 auto',
};

const scoreboardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '3rem',
  marginBottom: '1rem',
  flexWrap: 'wrap',
};

const playerScoreStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 'bold',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
};

const statusRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '2rem',
  flexWrap: 'wrap',
  fontSize: '1rem',
};

const timerStyle: React.CSSProperties = {
  color: '#ff6b6b',
  fontWeight: 'bold',
  fontSize: '1.1rem',
};

const comboStyle: React.CSSProperties = {
  color: '#ffd700',
  fontWeight: 'bold',
};

const roundStyle: React.CSSProperties = {
  color: '#4ecdc4',
  fontWeight: 'bold',
};

const gameAreaStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 10,
};

const gameOverStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.8)',
  borderRadius: '20px',
  padding: '2rem',
  textAlign: 'center',
  marginBottom: '2rem',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 215, 0, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
};

const turnIndicatorStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '1.3rem',
  fontWeight: 'bold',
  marginBottom: '2rem',
  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
};

const cardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: '15px',
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
};

const cardStyle: React.CSSProperties = {
  aspectRatio: '1',
  minHeight: '100px',
  borderRadius: '15px',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
};

const startButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #48bb78, #38a169)',
  color: 'white',
  border: 'none',
  borderRadius: '15px',
  padding: '20px 40px',
  fontSize: '1.3rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 8px 32px rgba(72, 187, 120, 0.4)',
  transition: 'all 0.3s ease',
  minWidth: '250px',
  minHeight: '60px',
};

const resetButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  color: 'white',
  border: 'none',
  borderRadius: '15px',
  padding: '15px 30px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 6px 25px rgba(102, 126, 234, 0.4)',
  transition: 'all 0.3s ease',
  minHeight: '50px',
};

export default MultiplayerMemoryFight;
