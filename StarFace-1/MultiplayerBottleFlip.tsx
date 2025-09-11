
import React, { useState, useEffect, useRef } from 'react';

interface Bottle {
  id: string;
  x: number;
  y: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  angularVelocity: number;
  isLanding: boolean;
  landed: boolean;
  successful: boolean;
  bounces: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

interface Props {
  roomCode: string;
  player: 'X' | 'O';
}

const MultiplayerBottleFlip: React.FC<Props> = ({ roomCode, player }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [attempts, setAttempts] = useState({ X: 0, O: 0 });
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [power, setPower] = useState(0);
  const [charging, setCharging] = useState(false);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [combo, setCombo] = useState(0);
  const [bestFlip, setBestFlip] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const GRAVITY = 0.8;
  const FRICTION = 0.98;
  const BOUNCE_DAMPING = 0.6;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const createParticles = (x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 5,
        color,
        life: 1,
        size: Math.random() * 4 + 2
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const updateParticles = () => {
    setParticles(prev => prev
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.3,
        vx: p.vx * 0.99,
        life: p.life - 0.02,
        size: p.size * 0.98
      }))
      .filter(p => p.life > 0 && p.size > 0.5)
    );
  };

  const flipBottle = (power: number) => {
    if (currentPlayer !== player || charging) return;

    const newBottle: Bottle = {
      id: `${Date.now()}-${Math.random()}`,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      rotation: 0,
      velocityX: (Math.random() - 0.5) * 2,
      velocityY: -power * 0.8 - 8,
      angularVelocity: (Math.random() - 0.5) * power * 0.5 + power * 0.3,
      isLanding: false,
      landed: false,
      successful: false,
      bounces: 0
    };

    setBottles(prev => [...prev, newBottle]);
    setAttempts(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
    createParticles(newBottle.x, newBottle.y, '#4ecdc4', 15);
    
    // Add screen shake effect
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translateX(${(Math.random() - 0.5) * 10}px)`;
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.style.transform = 'translateX(0)';
        }
      }, 100);
    }
  };

  const handleMouseDown = () => {
    if (currentPlayer !== player || gameOver) return;
    setCharging(true);
    const interval = setInterval(() => {
      setPower(prev => Math.min(prev + 2, 100));
    }, 50);
    
    return () => clearInterval(interval);
  };

  const handleMouseUp = () => {
    if (!charging || currentPlayer !== player) return;
    setCharging(false);
    flipBottle(power);
    setPower(0);
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  const updateBottles = () => {
    setBottles(prev => prev.map(bottle => {
      if (bottle.landed) return bottle;

      const newBottle = { ...bottle };
      
      // Apply physics
      newBottle.velocityY += GRAVITY;
      newBottle.x += newBottle.velocityX;
      newBottle.y += newBottle.velocityY;
      newBottle.rotation += newBottle.angularVelocity;
      
      // Apply friction
      newBottle.velocityX *= FRICTION;
      newBottle.angularVelocity *= FRICTION;

      // Ground collision
      if (newBottle.y >= CANVAS_HEIGHT - 80) {
        newBottle.y = CANVAS_HEIGHT - 80;
        newBottle.velocityY *= -BOUNCE_DAMPING;
        newBottle.velocityX *= BOUNCE_DAMPING;
        newBottle.angularVelocity *= BOUNCE_DAMPING;
        newBottle.bounces++;

        createParticles(newBottle.x, newBottle.y, '#ff6b6b', 8);

        // Check if bottle has settled
        if (Math.abs(newBottle.velocityY) < 2 && Math.abs(newBottle.angularVelocity) < 0.5) {
          newBottle.landed = true;
          newBottle.isLanding = true;
          
          // Check if flip was successful (bottle upright)
          const normalizedRotation = ((newBottle.rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const uprightTolerance = 0.5;
          
          if (Math.abs(normalizedRotation) < uprightTolerance || 
              Math.abs(normalizedRotation - Math.PI * 2) < uprightTolerance) {
            newBottle.successful = true;
            const points = Math.max(1, Math.floor((100 - newBottle.bounces * 10) / 10));
            setScores(prev => ({ ...prev, [currentPlayer === 'X' ? 'O' : 'X']: prev[currentPlayer === 'X' ? 'O' : 'X'] + points }));
            setCombo(prev => prev + 1);
            setBestFlip(prev => Math.max(prev, points));
            createParticles(newBottle.x, newBottle.y, '#ffd700', 20);
          } else {
            setCombo(0);
            createParticles(newBottle.x, newBottle.y, '#666', 5);
          }
        }
      }

      // Wall collisions
      if (newBottle.x < 25 || newBottle.x > CANVAS_WIDTH - 25) {
        newBottle.velocityX *= -0.8;
        newBottle.x = Math.max(25, Math.min(CANVAS_WIDTH - 25, newBottle.x));
      }

      return newBottle;
    }));
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ground with pattern
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
    
    // Ground pattern
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    for (let i = 0; i < CANVAS_WIDTH; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, CANVAS_HEIGHT - 50);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Draw particles
    particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw bottles
    bottles.forEach(bottle => {
      ctx.save();
      ctx.translate(bottle.x, bottle.y);
      ctx.rotate(bottle.rotation);
      
      // Bottle shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(-12, 32, 24, 8);
      
      // Bottle body
      if (bottle.successful) {
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
        glowGradient.addColorStop(0, '#ffd700');
        glowGradient.addColorStop(1, '#ff8c00');
        ctx.fillStyle = glowGradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffd700';
      } else if (bottle.landed && !bottle.successful) {
        ctx.fillStyle = '#666';
      } else {
        const bottleGradient = ctx.createLinearGradient(-15, -25, 15, 25);
        bottleGradient.addColorStop(0, '#4ecdc4');
        bottleGradient.addColorStop(0.5, '#44a08d');
        bottleGradient.addColorStop(1, '#3a8f7a');
        ctx.fillStyle = bottleGradient;
      }
      
      // Bottle shape
      ctx.fillRect(-12, -25, 24, 50);
      ctx.fillRect(-8, -30, 16, 10);
      
      // Bottle cap
      ctx.fillStyle = bottle.successful ? '#ff6b6b' : '#2d3748';
      ctx.fillRect(-8, -35, 16, 8);
      
      // Bottle highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(-10, -20, 4, 40);
      
      ctx.restore();
    });

    // Draw power meter if charging
    if (charging && currentPlayer === player) {
      const meterWidth = 200;
      const meterHeight = 20;
      const meterX = (CANVAS_WIDTH - meterWidth) / 2;
      const meterY = 50;
      
      // Meter background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(meterX - 5, meterY - 5, meterWidth + 10, meterHeight + 10);
      
      // Meter fill
      const fillWidth = (power / 100) * meterWidth;
      const powerGradient = ctx.createLinearGradient(meterX, meterY, meterX + fillWidth, meterY);
      powerGradient.addColorStop(0, '#4ecdc4');
      powerGradient.addColorStop(0.7, '#ffd700');
      powerGradient.addColorStop(1, '#ff6b6b');
      ctx.fillStyle = powerGradient;
      ctx.fillRect(meterX, meterY, fillWidth, meterHeight);
      
      // Power text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`POWER: ${Math.round(power)}%`, CANVAS_WIDTH / 2, meterY + meterHeight + 25);
    }
  };

  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = setInterval(() => {
      updateBottles();
      updateParticles();
      draw();
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameStarted, bottles, particles, charging, power, currentPlayer, player]);

  useEffect(() => {
    if (gameStarted && !gameOver && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
    }
  }, [gameStarted, gameOver, timeLeft]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setBottles([]);
    setParticles([]);
    setScores({ X: 0, O: 0 });
    setAttempts({ X: 0, O: 0 });
    setCurrentPlayer('X');
    setPower(0);
    setCharging(false);
    setTimeLeft(30);
    setCombo(0);
    setBestFlip(0);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setRound(prev => prev + 1);
    setBottles([]);
    setParticles([]);
  };

  if (!gameStarted) {
    return (
      <div style={containerStyle}>
        <div style={menuStyle}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            🍾 Bottle Flip Pro Arena
          </h2>
          <div style={gameInfoStyle}>
            <p>🎮 <strong>Room:</strong> {roomCode}</p>
            <p>🎯 <strong>You are:</strong> Player {player}</p>
            <p>⚡ <strong>Goal:</strong> Land bottles upright to score points!</p>
            <p>🎪 <strong>Controls:</strong> Hold to charge power, release to flip!</p>
          </div>
          <button onClick={startGame} style={startButtonStyle}>
            🚀 Start Flipping Battle!
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
      <div style={headerStyle}>
        <h2 style={{ fontSize: '2rem', margin: '0 0 1rem 0', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          🍾 Bottle Flip Pro Arena
        </h2>
        
        <div style={gameStatsStyle}>
          <div style={scoreboardStyle}>
            <div style={{ ...playerScoreStyle, color: player === 'X' ? '#ffd700' : '#ffffff' }}>
              🎯 You: {scores.X} ({attempts.X} attempts)
            </div>
            <div style={{ ...playerScoreStyle, color: player === 'O' ? '#ffd700' : '#ffffff' }}>
              🤖 Opponent: {scores.O} ({attempts.O} attempts)
            </div>
          </div>
          
          <div style={statusRowStyle}>
            <div style={timerStyle}>
              ⏱️ {timeLeft}s
            </div>
            {combo > 1 && (
              <div style={comboStyle}>
                🔥 Combo x{combo}
              </div>
            )}
            {bestFlip > 0 && (
              <div style={bestFlipStyle}>
                ⭐ Best: {bestFlip}pts
              </div>
            )}
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
               winner === player ? '🏆 Flipping Victory!' : '😔 Better luck next time!'}
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
            {currentPlayer === player ? "🎯 Your Turn! Hold to charge power!" : `⏳ Player ${currentPlayer}'s Turn`}
          </div>
        )}

        <div style={canvasContainerStyle}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={canvasStyle}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
          />
        </div>

        {/* Mobile Controls */}
        <div style={mobileControlsStyle}>
          <button
            className="mobile-control-btn"
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            disabled={currentPlayer !== player || gameOver}
            style={{
              ...mobileButtonStyle,
              opacity: currentPlayer === player && !gameOver ? 1 : 0.5,
            }}
          >
            🍾 FLIP!
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes particleFade {
            0% { opacity: 1; transform: scale(1) translateY(0); }
            100% { opacity: 0; transform: scale(0.3) translateY(-30px); }
          }

          @keyframes bottleGlow {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.3) drop-shadow(0 0 10px #ffd700); }
          }

          .mobile-control-btn {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          @media (max-width: 768px) {
            canvas {
              max-width: 100% !important;
              height: auto !important;
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
  maxWidth: '800px',
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

const bestFlipStyle: React.CSSProperties = {
  color: '#4ecdc4',
  fontWeight: 'bold',
};

const roundStyle: React.CSSProperties = {
  color: '#764ba2',
  fontWeight: 'bold',
};

const gameAreaStyle: React.CSSProperties = {
  maxWidth: '900px',
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

const canvasContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '2rem',
  borderRadius: '15px',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  border: '3px solid rgba(255, 255, 255, 0.2)',
};

const canvasStyle: React.CSSProperties = {
  maxWidth: '100%',
  height: 'auto',
  cursor: 'pointer',
  transition: 'transform 0.1s ease',
};

const mobileControlsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '20px',
  marginTop: '2rem',
};

const mobileButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
  color: 'white',
  border: 'none',
  borderRadius: '15px',
  padding: '20px 40px',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 8px 25px rgba(78, 205, 196, 0.4)',
  transition: 'all 0.3s ease',
  minWidth: '150px',
  minHeight: '70px',
  touchAction: 'manipulation',
  userSelect: 'none',
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
  minWidth: '280px',
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

export default MultiplayerBottleFlip;
