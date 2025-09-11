import React, { useEffect, useRef, useState } from 'react';

interface Props {
  roomCode?: string;
  player?: 'X' | 'O';
}

type BoardState = Record<string, string>;

const COLS = 50;
const ROWS = 30;
const CELL = 12;
const COLORS = ['#ff4757', '#3742fa', '#2ed573', '#ffa502', '#a55eea', '#26d0ce', '#fd79a8', '#fdcb6e'];

const getKey = (x: number, y: number) => `${x}_${y}`;

const ColorSpread: React.FC<Props> = ({ roomCode = 'local', player = 'X' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [board, setBoard] = useState<BoardState>({});
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [playersInRoom, setPlayersInRoom] = useState<Set<string>>(new Set([player]));
  const lastPainted = useRef<Set<string>>(new Set());
  const localStorageKey = `colorspread_${roomCode}`;
  const playerPresenceKey = `colorspread_players_${roomCode}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = COLS * CELL;
      canvas.height = ROWS * CELL;
    }

    // Load saved board state
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      try {
        setBoard(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load board state:', e);
      }
    }

    // Handle player presence
    const playerSet = new Set((localStorage.getItem(playerPresenceKey)?.split(',').filter(p => p) || []));
    playerSet.add(player);
    localStorage.setItem(playerPresenceKey, Array.from(playerSet).join(','));
    setPlayersInRoom(playerSet);

    window.addEventListener('storage', syncBoard);
    
    return () => {
      window.removeEventListener('storage', syncBoard);
      // Remove player from room when component unmounts
      const updatedSet = new Set((localStorage.getItem(playerPresenceKey)?.split(',').filter(p => p) || []));
      updatedSet.delete(player);
      if (updatedSet.size > 0) {
        localStorage.setItem(playerPresenceKey, Array.from(updatedSet).join(','));
      } else {
        localStorage.removeItem(playerPresenceKey);
      }
    };
  }, [roomCode, player]);

  const syncBoard = (e: StorageEvent) => {
    if (e.key === localStorageKey && e.newValue) {
      try {
        const newBoard = JSON.parse(e.newValue);
        setBoard(newBoard);
        drawBoard(newBoard);
      } catch (error) {
        console.error('Failed to sync board:', error);
      }
    }
    if (e.key === playerPresenceKey && e.newValue) {
      setPlayersInRoom(new Set(e.newValue.split(',').filter(p => p)));
    }
  };

  const drawBoard = (boardData: BoardState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#333';
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
    }

    // Draw colored cells
    for (const key in boardData) {
      const [x, y] = key.split('_').map(Number);
      if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
        ctx.fillStyle = boardData[key];
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        
        // Add subtle border to painted cells
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  };

  useEffect(() => {
    drawBoard(board);
  }, [board, showGrid]);

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
    const updated = { ...board };
    let hasChanges = false;

    for (let dx = -brushSize + 1; dx < brushSize; dx++) {
      for (let dy = -brushSize + 1; dy < brushSize; dy++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < brushSize) {
            const key = getKey(x, y);
            if (!lastPainted.current.has(key)) {
              lastPainted.current.add(key);
              updated[key] = selectedColor;
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
    setIsDrawing(true);
    lastPainted.current.clear();
    paint(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing) {
      paint(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPainted.current.clear();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPainted.current.clear();
    const touch = e.touches[0];
    paint(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isDrawing) {
      const touch = e.touches[0];
      paint(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
    lastPainted.current.clear();
  };

  const clearBoard = () => {
    if (window.confirm('Are you sure you want to clear the entire board?')) {
      const empty: BoardState = {};
      setBoard(empty);
      drawBoard(empty);
      localStorage.setItem(localStorageKey, JSON.stringify(empty));
    }
  };

  const fillWithColor = () => {
    const filled: BoardState = {};
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        filled[getKey(x, y)] = selectedColor;
      }
    }
    setBoard(filled);
    drawBoard(filled);
    localStorage.setItem(localStorageKey, JSON.stringify(filled));
  };

  const getRandomColor = () => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setSelectedColor(randomColor);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `colorspread_${roomCode}_${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const cellCount = Object.keys(board).length;
  const totalCells = COLS * ROWS;
  const coverage = ((cellCount / totalCells) * 100).toFixed(1);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>🎨 Color Spread</h2>
        <div style={infoStyle}>
          <span style={badgeStyle}>Room: {roomCode}</span>
          <span style={badgeStyle}>Player: {player}</span>
          <span style={badgeStyle}>Players: {playersInRoom.size}</span>
          <span style={badgeStyle}>Coverage: {coverage}%</span>
        </div>
      </div>

      <div style={controlsStyle}>
        <div style={colorSectionStyle}>
          <label style={labelStyle}>Color:</label>
          <div style={colorGridStyle}>
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                style={{
                  ...colorButtonStyle,
                  backgroundColor: color,
                  border: selectedColor === color ? '3px solid #fff' : '1px solid #444',
                  transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                }}
                title={color}
              />
            ))}
          </div>
          <button onClick={getRandomColor} style={actionButtonStyle}>
            🎲 Random
          </button>
        </div>

        <div style={toolSectionStyle}>
          <label style={labelStyle}>Brush Size: {brushSize}</label>
          <input
            type="range"
            min="1"
            max="5"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={sliderStyle}
          />
        </div>

        <div style={actionSectionStyle}>
          <button
            onClick={() => setShowGrid(!showGrid)}
            style={{
              ...actionButtonStyle,
              backgroundColor: showGrid ? '#10b981' : '#374151',
            }}
          >
            {showGrid ? '🔲' : '⬜'} Grid
          </button>
          <button onClick={fillWithColor} style={actionButtonStyle}>
            🪣 Fill
          </button>
          <button onClick={clearBoard} style={dangerButtonStyle}>
            🗑️ Clear
          </button>
          <button onClick={exportImage} style={actionButtonStyle}>
            💾 Export
          </button>
        </div>
      </div>

      <div style={canvasContainerStyle}>
        <canvas
          ref={canvasRef}
          style={canvasStyle}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      <div style={statsStyle}>
        <p>Painted Cells: {cellCount.toLocaleString()} / {totalCells.toLocaleString()}</p>
        <p>Click and drag to paint • Use different brush sizes • Toggle grid for precision</p>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  color: '#e2e8f0',
  minHeight: '100vh',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '20px',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '20px',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 10px 0',
  fontSize: '2rem',
  fontWeight: 'bold',
  background: 'linear-gradient(45deg, #f59e0b, #ef4444, #8b5cf6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const infoStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '10px',
  flexWrap: 'wrap',
};

const badgeStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '20px',
  background: '#334155',
  border: '1px solid #475569',
  fontSize: '14px',
  fontWeight: '500',
};

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  marginBottom: '20px',
  background: '#1e293b',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #334155',
};

const colorSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  flexWrap: 'wrap',
};

const labelStyle: React.CSSProperties = {
  fontWeight: '600',
  minWidth: '80px',
};

const colorGridStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
};

const colorButtonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
};

const toolSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
};

const sliderStyle: React.CSSProperties = {
  width: '150px',
  height: '6px',
  borderRadius: '3px',
  background: '#475569',
  outline: 'none',
  cursor: 'pointer',
};

const actionSectionStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const actionButtonStyle: React.CSSProperties = {
  background: '#374151',
  color: '#e2e8f0',
  border: '1px solid #4b5563',
  borderRadius: '8px',
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
};

const dangerButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: '#dc2626',
  borderColor: '#ef4444',
};

const canvasContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '20px',
  background: '#0f172a',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #334155',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

const canvasStyle: React.CSSProperties = {
  border: '2px solid #475569',
  borderRadius: '8px',
  cursor: 'crosshair',
  maxWidth: '100%',
  height: 'auto',
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
};

const statsStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '1.5',
};

export default ColorSpread;