import React, { useEffect, useRef, useState } from 'react';

interface Props {
  roomCode: string;
  player: 'X' | 'O';
}

type BoardState = Record<string, string>;

const COLS = 40;
const ROWS = 25;
const CELL = 16;
const GAME_TIME = 120; // 2 minutes

const ColorWars: React.FC<Props> = ({ roomCode, player }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [board, setBoard] = useState<BoardState>({});
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [brushSize, setBrushSize] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPainted = useRef<Set<string>>(new Set());
  const localStorageKey = `colorwars_${roomCode}`;
  const gameStateKey = `colorwars_state_${roomCode}`;

  const playerColors = {
    X: '#ff4757', // Red
    O: '#3742fa'  // Blue
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = COLS * CELL;
      canvas.height = ROWS * CELL;
    }

    // Load saved state
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      try {
        setBoard(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load board state:', e);
      }
    }

    const gameState = localStorage.getItem(gameStateKey);
    if (gameState) {
      try {
        const state = JSON.parse(gameState);
        setGameStarted(state.started);
        setTimeLeft(state.timeLeft);
        setGameEnded(state.ended);
      } catch (e) {
        console.error('Failed to load game state:', e);
      }
    }

    window.addEventListener('storage', syncGame);
    return () => window.removeEventListener('storage', syncGame);
  }, [roomCode]);

  // Game timer
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setGameEnded(true);
          const state = { started: true, timeLeft: 0, ended: true };
          localStorage.setItem(gameStateKey, JSON.stringify(state));
        } else {
          const state = { started: true, timeLeft: newTime, ended: false };
          localStorage.setItem(gameStateKey, JSON.stringify(state));
        }
        return Math.max(0, newTime);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameEnded, gameStateKey]);

  const syncGame = (e: StorageEvent) => {
    if (e.key === localStorageKey && e.newValue) {
      try {
        const newBoard = JSON.parse(e.newValue);
        setBoard(newBoard);
        drawBoard(newBoard);
      } catch (error) {
        console.error('Failed to sync board:', error);
      }
    }
    if (e.key === gameStateKey && e.newValue) {
      try {
        const state = JSON.parse(e.newValue);
        setGameStarted(state.started);
        setTimeLeft(state.timeLeft);
        setGameEnded(state.ended);
      } catch (error) {
        console.error('Failed to sync game state:', error);
      }
    }
  };

  const drawBoard = (boardData: BoardState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with neutral background
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(canvas.width, y * CELL);
      ctx.stroke();
    }

    // Draw colored cells
    for (const key in boardData) {
      const [x, y] = key.split('_').map(Number);
      if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
        ctx.fillStyle = boardData[key];
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        
        // Add border
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  };

  useEffect(() => {
    drawBoard(board);
  }, [board]);

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(GAME_TIME);
    setGameEnded(false);
    const state = { started: true, timeLeft: GAME_TIME, ended: false };
    localStorage.setItem(gameStateKey, JSON.stringify(state));
  };

  const resetGame = () => {
    const emptyBoard: BoardState = {};
    setBoard(emptyBoard);
    setGameStarted(false);
    setGameEnded(false);
    setTimeLeft(GAME_TIME);
    localStorage.setItem(localStorageKey, JSON.stringify(emptyBoard));
    localStorage.removeItem(gameStateKey);
  };

  const screenToCell = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor(((clientX - rect.left) * scaleX) / CELL);
    const y = Math.floor(((clientY - rect.top) * scaleY) / CELL);
    
    return { 
      x: Math.max(0, Math.min(COLS - 1, x)), 
      y: Math.max(0, Math.min(ROWS - 1, y)) 
    };
  };

  const paintArea = (centerX: number, centerY: number) => {
    if (!gameStarted || gameEnded) return;

    const updated = { ...board };
    let hasChanges = false;

    for (let dx = -brushSize + 1; dx < brushSize; dx++) {
      for (let dy = -brushSize + 1; dy < brushSize; dy++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < brushSize) {
            const key = `${x}_${y}`;
            if (!lastPainted.current.has(key)) {
              lastPainted.current.add(key);
              updated[key] = playerColors[player];
              hasChanges = true;
            }
          }
        }
      }
    }

    if (hasChanges) {
      setBoard(updated);
      drawBoard(updated);
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
    }
  };

  const paint = (clientX: number, clientY: number) => {
    const { x, y } = screenToCell(clientX, clientY);
    paintArea(x, y);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!gameStarted || gameEnded) return;
    setIsDrawing(true);
    lastPainted.current.clear();
    paint(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing && gameStarted && !gameEnded) {
      paint(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPainted.current.clear();
  };

  // Calculate scores
  const playerXCells = Object.values(board).filter(color => color === playerColors.X).length;
  const playerOCells = Object.values(board).filter(color => color === playerColors.O).length;
  const totalCells = COLS * ROWS;
  const xPercentage = ((playerXCells / totalCells) * 100).toFixed(1);
  const oPercentage = ((playerOCells / totalCells) * 100).toFixed(1);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWinner = () => {
    if (playerXCells > playerOCells) return 'Player X';
    if (playerOCells > playerXCells) return 'Player O';
    return 'Tie';
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2>🎨 Color Wars</h2>
        <div style={infoStyle}>
          <span style={badgeStyle}>Room: {roomCode}</span>
          <span style={badgeStyle}>You: Player {player}</span>
          <span style={badgeStyle}>Time: {formatTime(timeLeft)}</span>
        </div>
      </div>

      <div style={scoresStyle}>
        <div style={{ ...scoreStyle, backgroundColor: playerColors.X }}>
          Player X: {playerXCells} cells ({xPercentage}%)
        </div>
        <div style={{ ...scoreStyle, backgroundColor: playerColors.O }}>
          Player O: {playerOCells} cells ({oPercentage}%)
        </div>
      </div>

      {!gameStarted && !gameEnded && (
        <div style={controlsStyle}>
          <button onClick={startGame} style={startButtonStyle}>
            🚀 Start Color War!
          </button>
        </div>
      )}

      {gameStarted && !gameEnded && (
        <div style={controlsStyle}>
          <label style={labelStyle}>Brush Size: {brushSize}</label>
          <input
            type="range"
            min="1"
            max="4"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={sliderStyle}
          />
        </div>
      )}

      {gameEnded && (
        <div style={resultStyle}>
          <h3>🏆 Game Over!</h3>
          <h4>Winner: {getWinner()}</h4>
          <button onClick={resetGame} style={resetButtonStyle}>
            🔄 Play Again
          </button>
        </div>
      )}

      <div style={canvasContainerStyle}>
        <canvas
          ref={canvasRef}
          style={canvasStyle}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div style={instructionsStyle}>
        <p>🎯 Paint as much territory as possible in {GAME_TIME / 60} minutes!</p>
        <p>🖱️ Click and drag to paint • Bigger brush = faster painting</p>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
  color: '#e2e8f0',
  minHeight: '100vh',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '20px',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
};

const infoStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  marginTop: '10px',
};

const badgeStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '20px',
  background: '#4a5568',
  border: '1px solid #718096',
  fontSize: '14px',
  fontWeight: '500',
};

const scoresStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '20px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const scoreStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: '8px',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '16px',
  minWidth: '200px',
  textAlign: 'center',
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '15px',
  marginBottom: '20px',
  flexWrap: 'wrap',
};

const labelStyle: React.CSSProperties = {
  fontWeight: '600',
};

const sliderStyle: React.CSSProperties = {
  width: '150px',
  height: '6px',
  borderRadius: '3px',
  background: '#4a5568',
  outline: 'none',
  cursor: 'pointer',
};

const startButtonStyle: React.CSSProperties = {
  background: '#48bb78',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '12px 24px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)',
};

const resetButtonStyle: React.CSSProperties = {
  background: '#ed8936',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 20px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '10px',
};

const resultStyle: React.CSSProperties = {
  textAlign: 'center',
  background: '#2d3748',
  padding: '20px',
  borderRadius: '12px',
  marginBottom: '20px',
  border: '2px solid #4a5568',
};

const canvasContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '20px',
  background: '#1a202c',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #4a5568',
};

const canvasStyle: React.CSSProperties = {
  border: '2px solid #718096',
  borderRadius: '8px',
  cursor: 'crosshair',
  maxWidth: '100%',
  height: 'auto',
};

const instructionsStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#a0aec0',
  fontSize: '14px',
  lineHeight: '1.5',
};

export default ColorWars;