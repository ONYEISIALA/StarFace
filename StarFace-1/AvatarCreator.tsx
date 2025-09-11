import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/** ---------- Theme ---------- */
const THEME = {
  bg: "linear-gradient(135deg, #0b1224 0%, #0f1f3a 60%, #132b53 100%)",
  card: "#0f1f3a",
  text: "#e6f0ff",
  textSoft: "#c7d7ff",
  border: "rgba(255,255,255,0.15)",
  accent: "#ffd700",
  focus: "#60a5fa",
  btnGrad: "linear-gradient(135deg, #ffcc00, #ff9900)",
  btnAction: "linear-gradient(135deg, #00e7ff, #4facfe)",
  btnDanger: "linear-gradient(135deg, #ff7a7a, #ff4d4d)",
};

/** ---------- Palettes ---------- */
const PALETTES: Record<string, string[]> = {
  Rainbow: ["#ff0000","#ff7f00","#ffff00","#00ff00","#00ffff","#0000ff","#8b00ff"],
  Pastel: ["#ffadad","#ffd6a5","#fdffb6","#caffbf","#9bf6ff","#a0c4ff","#bdb2ff","#ffc6ff"],
  Neon: ["#39ff14","#00ffff","#ff2079","#ffd300","#7df9ff","#fe019a","#ff073a"],
  Earth: ["#7f5539","#9c6644","#ddb892","#e6ccb2","#b08968","#a3b18a","#588157","#3a5a40"],
  Blues: ["#e2e8f0","#cfe2ff","#93c5fd","#60a5fa","#3b82f6","#1d4ed8","#1e3a8a"],
};

type EyesKind = "happy" | "wink" | "sleepy";
type MouthKind = "smile" | "grin" | "surprised";

interface Accessory {
  id: number;
  char: string;
  x: number;
  y: number;
  scale: number;      // 0.2 - 3
  rotationDeg: number;
}

interface AvatarState {
  // face style
  eyes: EyesKind;
  mouth: MouthKind;
  color: string;
  size: number;       // diameter in px
  showEyes: boolean;
  showMouth: boolean;

  // photo + accessories
  uploadedImg?: string | null; // dataURL
  accessories: Accessory[];
  selectedAccId?: number | null;
}

/** ---------- LocalStorage Key ---------- */
const LS_KEY = "avatar_creator_state_v5";

/** ---------- Accessory catalog ---------- */
const ACCESSORY_LIBRARY = [
  "👑","🎧","🕶️","😎","👓","🎩","🧢","👒",
  "🎀","👔","🧣","🧥",
  "💋","🧔","👨‍🎤",
  "⭐","✨","💫","⚡","🔥","🌙","🌟","💎","💥","🎉","🎈","🚀",
  "😺","🐾","🩷","💙","💚","🖤","📿","🪬"
];

/** ---------- Utils ---------- */
const randomOf = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const allSwatches = Object.values(PALETTES).flat();
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const toDeg = (rad: number) => (rad * 180) / Math.PI;

const newAccessory = (char: string, cx: number, cy: number): Accessory => ({
  id: Date.now() + Math.floor(Math.random() * 100000),
  char,
  x: cx,
  y: cy,
  scale: 1,
  rotationDeg: 0,
});

/** ---------- Component ---------- */
const AvatarCreator: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load initial state
  const initial: AvatarState =
    (() => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) return JSON.parse(raw) as AvatarState;
      } catch {}
      return {
        eyes: "happy",
        mouth: "smile",
        color: "#ffd6a5",
        size: 220,
        showEyes: true,
        showMouth: true,
        uploadedImg: null,
        accessories: [],
        selectedAccId: null,
      };
    })();

  const [state, setState] = useState<AvatarState>(initial);

  // Persist
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  // Load image element when uploadedImg changes
  useEffect(() => {
    if (!state.uploadedImg) {
      imgRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      draw(); // redraw when ready
    };
    img.src = state.uploadedImg;
  }, [state.uploadedImg]);

  /** ---------- Drawing ---------- */
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const size = state.size;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const r = size / 2;

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(r, r, r * 0.96, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Background photo or color
    if (imgRef.current) {
      const img = imgRef.current;
      const cw = size, ch = size;
      const ir = img.width / img.height;
      const cr = cw / ch;
      let dw = cw, dh = ch, dx = 0, dy = 0;

      if (ir > cr) {
        dh = ch;
        dw = dh * ir;
        dx = (cw - dw) / 2;
      } else {
        dw = cw;
        dh = dw / ir;
        dy = (ch - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = state.color;
      ctx.fillRect(0, 0, size, size);
    }

    ctx.restore();

    // Face features (independent)
    drawFace(ctx, size, {
      showEyes: state.showEyes,
      showMouth: state.showMouth,
      eyes: state.eyes,
      mouth: state.mouth,
    });

    // Accessories
    for (const acc of state.accessories) {
      drawAccessory(ctx, size, acc, acc.id === state.selectedAccId);
    }

    // Outer ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(r, r, r * 0.98, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = Math.max(2, size * 0.02);
    ctx.stroke();
    ctx.restore();
  };

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.size,
    state.color,
    state.eyes,
    state.mouth,
    state.showEyes,
    state.showMouth,
    state.accessories,
  ]);

  /** ---------- Face renderer (eyes/mouth can be hidden) ---------- */
  const drawFace = (
    ctx: CanvasRenderingContext2D,
    size: number,
    opts: { showEyes: boolean; showMouth: boolean; eyes: EyesKind; mouth: MouthKind }
  ) => {
    const r = size / 2;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = Math.max(2, size * 0.025);

    // Eyes
    if (opts.showEyes) {
      const eyeY = r * 0.65;
      const eyeDX = r * 0.42;
      const eyeR = Math.max(3, size * 0.035);

      const drawHappyEye = (x: number) => {
        ctx.beginPath();
        ctx.arc(x, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fill();
      };
      const drawWinkEye = (x: number) => {
        ctx.beginPath();
        ctx.moveTo(x - eyeR, eyeY);
        ctx.lineTo(x + eyeR, eyeY);
        ctx.stroke();
      };
      const drawSleepyEye = (x: number) => {
        ctx.beginPath();
        ctx.arc(x, eyeY, eyeR * 1.2, Math.PI * 0.15, Math.PI - Math.PI * 0.15);
        ctx.stroke();
      };

      const leftX = r - eyeDX;
      const rightX = r + eyeDX;
      const paintEye = (kind: EyesKind, x: number) => {
        if (kind === "happy") drawHappyEye(x);
        else if (kind === "wink") drawWinkEye(x);
        else drawSleepyEye(x);
      };

      // Left eye: if wink, keep left as happy so only one eye winks
      paintEye(opts.eyes === "wink" ? "happy" : opts.eyes, leftX);
      // Right eye: apply selected style
      paintEye(opts.eyes, rightX);
    }

    // Mouth
    if (opts.showMouth) {
      const mouthY = r * 1.25;
      const mouthW = r * 0.9;
      const mouthH = r * 0.55;

      ctx.beginPath();
      if (opts.mouth === "smile") {
        ctx.arc(r, mouthY, mouthW * 0.5, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      } else if (opts.mouth === "grin") {
        ctx.arc(r, mouthY, mouthW * 0.5, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // teeth
        const tY = mouthY - mouthH * 0.1;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(r - mouthW * 0.35, tY, mouthW * 0.7, mouthH * 0.3);
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = Math.max(1, size * 0.01);
        for (let i = 1; i <= 3; i++) {
          const x = r - mouthW * 0.35 + (mouthW * 0.7 * i) / 4;
          ctx.beginPath();
          ctx.moveTo(x, tY);
          ctx.lineTo(x, tY + mouthH * 0.3);
          ctx.stroke();
        }
      } else {
        const mR = mouthW * 0.18;
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.beginPath();
        ctx.arc(r, mouthY, mR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  /** ---------- Accessory renderer ---------- */
  const drawAccessory = (
    ctx: CanvasRenderingContext2D,
    size: number,
    acc: Accessory,
    selected: boolean
  ) => {
    const baseFont = size * 0.22;
    const fontSize = Math.max(14, baseFont * acc.scale);
    ctx.save();
    ctx.translate(acc.x, acc.y);
    ctx.rotate((acc.rotationDeg * Math.PI) / 180);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", system-ui, sans-serif`;
    ctx.fillText(acc.char, 0, 0);

    if (selected) {
      ctx.beginPath();
      const selR = fontSize * 0.6;
      ctx.arc(0, 0, selR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(96,165,250,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  };

  /** ---------- Actions ---------- */
  const randomize = () => {
    const kindsEyes: EyesKind[] = ["happy", "wink", "sleepy"];
    const kindsMouth: MouthKind[] = ["smile", "grin", "surprised"];
    const color = randomOf(allSwatches);
    setState((s) => ({
      ...s,
      eyes: randomOf(kindsEyes),
      mouth: randomOf(kindsMouth),
      color,
      showEyes: Math.random() > 0.3,  // sometimes hide for mix
      showMouth: Math.random() > 0.3,
    }));
  };

  const reset = () =>
    setState({
      eyes: "happy",
      mouth: "smile",
      color: "#ffd6a5",
      size: 220,
      showEyes: true,
      showMouth: true,
      uploadedImg: null,
      accessories: [],
      selectedAccId: null,
    });

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "avatar.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /** ---------- Upload handlers ---------- */
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setState((s) => ({ ...s, uploadedImg: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () =>
    setState((s) => ({ ...s, uploadedImg: null }));

  /** ---------- Accessory handlers ---------- */
  const addAccessory = (char: string) => {
    const c = state.size / 2;
    const acc = newAccessory(char, c, c);
    setState((s) => ({
      ...s,
      accessories: [...s.accessories, acc],
      selectedAccId: acc.id,
    }));
  };

  const removeSelectedAccessory = () => {
    if (!state.selectedAccId) return;
    setState((s) => ({
      ...s,
      accessories: s.accessories.filter((a) => a.id !== s.selectedAccId),
      selectedAccId: null,
    }));
  };

  const updateSelectedAccessory = (patch: Partial<Accessory>) => {
    if (!state.selectedAccId) return;
    setState((s) => ({
      ...s,
      accessories: s.accessories.map((a) =>
        a.id === s.selectedAccId ? { ...a, ...patch } : a
      ),
    }));
  };

  /** ---------- Drag & multi-touch gesture on canvas ---------- */
  const dragState = useRef<{
    draggingId: number | null;
    offsetX: number;
    offsetY: number;
  }>({ draggingId: null, offsetX: 0, offsetY: 0 });

  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gesture = useRef<{
    active: boolean;
    accId: number | null;
    startScale: number;
    startRot: number;       // degrees
    startDist: number;      // px
    startAngle: number;     // radians
  }>({ active: false, accId: null, startScale: 1, startRot: 0, startDist: 1, startAngle: 0 });

  const canvasToLocal = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (ev.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

  const getTwoPointers = () => {
    const arr = Array.from(activePointers.current.values());
    return arr.length >= 2 ? [arr[0], arr[1]] as const : null;
  };

  const dist = (a: {x:number;y:number}, b: {x:number;y:number}) => Math.hypot(a.x - b.x, a.y - b.y);
  const angle = (a: {x:number;y:number}, b: {x:number;y:number}) => Math.atan2(b.y - a.y, b.x - a.x);

  const hitTestAccessory = (x: number, y: number): number | null => {
    for (let i = state.accessories.length - 1; i >= 0; i--) {
      const a = state.accessories[i];
      const base = state.size * 0.12 * a.scale;
      const dx = x - a.x;
      const dy = y - a.y;
      if (Math.hypot(dx, dy) <= base) return a.id;
    }
    return null;
  };

  const onCanvasPointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    const pt = canvasToLocal(ev);
    activePointers.current.set(ev.pointerId, pt);

    const two = getTwoPointers();

    if (two && state.selectedAccId) {
      const acc = state.accessories.find(a => a.id === state.selectedAccId)!;
      gesture.current = {
        active: true,
        accId: acc.id,
        startScale: acc.scale,
        startRot: acc.rotationDeg,
        startDist: dist(two[0], two[1]),
        startAngle: angle(two[0], two[1]),
      };
      dragState.current.draggingId = null;
      return;
    }

    const hitId = hitTestAccessory(pt.x, pt.y);
    if (hitId) {
      const acc = state.accessories.find((a) => a.id === hitId)!;
      // bring to top on select
      setState((s) => ({
        ...s,
        selectedAccId: hitId,
        accessories: [...s.accessories.filter((a) => a.id !== hitId), acc],
      }));

      dragState.current.draggingId = hitId;
      dragState.current.offsetX = pt.x - acc.x;
      dragState.current.offsetY = pt.y - acc.y;
    } else {
      setState((s) => ({ ...s, selectedAccId: null }));
      dragState.current.draggingId = null;
    }
  };

  const onCanvasPointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = canvasToLocal(ev);
    if (activePointers.current.has(ev.pointerId)) {
      activePointers.current.set(ev.pointerId, pt);
    }

    const two = getTwoPointers();
    if (two && gesture.current.active && gesture.current.accId && state.selectedAccId === gesture.current.accId) {
      const d = dist(two[0], two[1]);
      const a = angle(two[0], two[1]);
      const scaleFactor = d / gesture.current.startDist;
      const deltaDeg = toDeg(a - gesture.current.startAngle);
      const newScale = clamp(gesture.current.startScale * scaleFactor, 0.2, 3);
      const newRot = gesture.current.startRot + deltaDeg;
      updateSelectedAccessory({ scale: newScale, rotationDeg: newRot });
      return;
    }

    if (dragState.current.draggingId) {
      const id = dragState.current.draggingId;
      setState((s) => ({
        ...s,
        accessories: s.accessories.map((a) =>
          a.id === id ? { ...a, x: pt.x - dragState.current.offsetX, y: pt.y - dragState.current.offsetY } : a
        ),
      }));
    }
  };

  const onCanvasPointerUp = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    activePointers.current.delete(ev.pointerId);
    (ev.target as HTMLElement).releasePointerCapture(ev.pointerId);

    const two = getTwoPointers();
    if (!two) {
      gesture.current.active = false;
      gesture.current.accId = null;
    }
    if (dragState.current.draggingId) {
      dragState.current.draggingId = null;
    }
  };

  /** ---------- UI Helpers ---------- */
  const ControlLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label style={{ display: "block", color: THEME.textSoft, fontWeight: 600, marginBottom: 8 }}>
      {children}
    </label>
  );

  const ringGradient = useMemo(
    () =>
      `conic-gradient(from 90deg at 50% 50%, ${THEME.accent}, #4facfe, #a78bfa, ${THEME.accent})`,
    []
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: THEME.bg,
        color: THEME.text,
        fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        padding: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 16px",
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          alignItems: "center",
          gap: 8,
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={pillBtn(THEME.btnAction)}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          ⬅ Back to Home
        </button>

        <h1 style={{ margin: 0, fontSize: 20, textAlign: "center" }}>
          🎨 Avatar Creator — Photo + Accessories
        </h1>

        <div style={{ display: "flex", gap: 8, justifySelf: "end", flexWrap: "wrap" }}>
          <button onClick={randomize} style={pillBtn(THEME.btnAction)}>✨ Randomize</button>
          <button onClick={downloadPNG} style={pillBtn(THEME.btnGrad)}>⬇ Download PNG</button>
          <button onClick={reset} style={pillBtn(THEME.btnDanger)}>♻ Reset</button>
        </div>
      </div>

      {/* Layout */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16,
        }}
      >
        {/* Preview Card */}
        <div style={card()}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              justifyItems: "center",
              gap: 14,
            }}
          >
            {/* Ring + Canvas */}
            <div
              style={{
                padding: 10,
                borderRadius: "50%",
                background: ringGradient,
                boxShadow:
                  "0 0 0 6px rgba(255,255,255,0.05), 0 25px 60px rgba(0,0,0,0.45)",
              }}
            >
              <div
                style={{
                  background: "#0b1224",
                  borderRadius: "50%",
                  padding: 10,
                }}
              >
                <canvas
                  ref={canvasRef}
                  aria-label="Avatar preview"
                  style={{ display: "block", borderRadius: "50%", touchAction: "none" }}
                  onPointerDown={onCanvasPointerDown}
                  onPointerMove={onCanvasPointerMove}
                  onPointerUp={onCanvasPointerUp}
                />
              </div>
            </div>

            {/* Size + Face toggles */}
            <div style={{ width: "min(520px, 95%)", display: "grid", gap: 10 }}>
              <div>
                <ControlLabel>Size: {state.size}px</ControlLabel>
                <input
                  type="range"
                  min={140}
                  max={360}
                  step={1}
                  value={state.size}
                  onChange={(e) => setState((s) => ({ ...s, size: Number(e.target.value) }))}
                  style={sliderStyle}
                />
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: THEME.textSoft }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={state.showEyes}
                    onChange={(e) => setState((s) => ({ ...s, showEyes: e.target.checked }))}
                  />
                  Show Eyes
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={state.showMouth}
                    onChange={(e) => setState((s) => ({ ...s, showMouth: e.target.checked }))}
                  />
                  Show Mouth
                </label>
              </div>

              <div style={{ color: THEME.textSoft, fontSize: 13, opacity: 0.9 }}>
                Tip: You can hide eyes or mouth independently — e.g. **hide eyes, keep mouth** or
                **hide mouth, keep eyes**. Drag accessories with one finger; use two fingers to
                rotate + pinch-zoom the selected accessory.
              </div>
            </div>
          </div>
        </div>

        {/* Controls Card */}
        <div style={card()}>
          <div
            style={{
              display: "grid",
              gap: 18,
              gridTemplateColumns: "1fr",
            }}
          >
            {/* Upload */}
            <div>
              <ControlLabel>Photo (from your gallery)</ControlLabel>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPickImage}
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    border: `1px solid ${THEME.border}`,
                    background: "rgba(255,255,255,0.04)",
                    color: THEME.textSoft,
                  }}
                />
                {state.uploadedImg && (
                  <button onClick={clearImage} style={pillBtn(THEME.btnDanger)}>🗑️ Remove photo</button>
                )}
              </div>
            </div>

            {/* Eyes (choose type even if hidden) */}
            <div>
              <ControlLabel>Eyes Style</ControlLabel>
              <div style={segmentedRow}>
                <SegmentedButton active={state.eyes === "happy"} onClick={() => setState((s) => ({ ...s, eyes: "happy" }))}>Happy</SegmentedButton>
                <SegmentedButton active={state.eyes === "wink"} onClick={() => setState((s) => ({ ...s, eyes: "wink" }))}>Wink</SegmentedButton>
                <SegmentedButton active={state.eyes === "sleepy"} onClick={() => setState((s) => ({ ...s, eyes: "sleepy" }))}>Sleepy</SegmentedButton>
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setState((s)=>({ ...s, showEyes: false }))}
                  style={pillBtn(THEME.btnDanger)}
                >
                  👁️ Hide Eyes
                </button>{" "}
                <button
                  onClick={() => setState((s)=>({ ...s, showEyes: true }))}
                  style={pillBtn(THEME.btnAction)}
                >
                  👁️ Show Eyes
                </button>
              </div>
            </div>

            {/* Mouth (choose type even if hidden) */}
            <div>
              <ControlLabel>Mouth Style</ControlLabel>
              <div style={segmentedRow}>
                <SegmentedButton active={state.mouth === "smile"} onClick={() => setState((s) => ({ ...s, mouth: "smile" }))}>Smile</SegmentedButton>
                <SegmentedButton active={state.mouth === "grin"} onClick={() => setState((s) => ({ ...s, mouth: "grin" }))}>Grin</SegmentedButton>
                <SegmentedButton active={state.mouth === "surprised"} onClick={() => setState((s) => ({ ...s, mouth: "surprised" }))}>Surprised</SegmentedButton>
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setState((s)=>({ ...s, showMouth: false }))}
                  style={pillBtn(THEME.btnDanger)}
                >
                  👄 Hide Mouth
                </button>{" "}
                <button
                  onClick={() => setState((s)=>({ ...s, showMouth: true }))}
                  style={pillBtn(THEME.btnAction)}
                >
                  👄 Show Mouth
                </button>
              </div>
            </div>

            {/* Base color (used when no photo) */}
            <div>
              <ControlLabel>Base Color</ControlLabel>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="color"
                  value={state.color}
                  onChange={(e) => setState((s) => ({ ...s, color: e.target.value }))}
                  style={{
                    width: 48,
                    height: 48,
                    background: "transparent",
                    border: `2px solid ${THEME.border}`,
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                  aria-label="Pick color"
                />
                <code
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${THEME.border}`,
                    padding: "8px 10px",
                    borderRadius: 8,
                    color: THEME.textSoft,
                  }}
                >
                  {state.color.toUpperCase()}
                </code>
              </div>
            </div>

            {/* Palettes */}
            <div style={{ display: "grid", gap: 14 }}>
              {Object.entries(PALETTES).map(([name, colors]) => (
                <div key={name}>
                  <div style={{ color: THEME.textSoft, marginBottom: 8, fontWeight: 600 }}>
                    {name}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {colors.map((hex) => (
                      <Swatch
                        key={hex + name}
                        color={hex}
                        active={state.color.toLowerCase() === hex.toLowerCase()}
                        onClick={() => setState((s) => ({ ...s, color: hex }))}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Accessory Library */}
            <div>
              <ControlLabel>Accessories — click to add (drag / pinch / rotate on canvas)</ControlLabel>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
                gap: 8,
              }}>
                {ACCESSORY_LIBRARY.map((g) => (
                  <button
                    key={g + Math.random()}
                    onClick={() => addAccessory(g)}
                    title={`Add ${g}`}
                    style={{
                      height: 44,
                      borderRadius: 10,
                      border: `1px solid ${THEME.border}`,
                      background: "rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      fontSize: 22,
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Accessory Controls */}
            {state.selectedAccId && (
              <div style={{ borderTop: `1px dashed ${THEME.border}`, paddingTop: 12 }}>
                <ControlLabel>Selected Accessory Controls</ControlLabel>
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <div style={{ color: THEME.textSoft, marginBottom: 6 }}>
                      Size ({getSelected(state)?.scale.toFixed(2)})
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={3}
                      step={0.02}
                      value={getSelected(state)?.scale ?? 1}
                      onChange={(e) => updateSelectedAccessory({ scale: Number(e.target.value) })}
                      style={sliderStyle}
                    />
                  </div>
                  <div>
                    <div style={{ color: THEME.textSoft, marginBottom: 6 }}>
                      Rotation: {Math.round(getSelected(state)?.rotationDeg ?? 0)}°
                    </div>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={getSelected(state)?.rotationDeg ?? 0}
                      onChange={(e) => updateSelectedAccessory({ rotationDeg: Number(e.target.value) })}
                      style={sliderStyle}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => updateSelectedAccessory({ rotationDeg: 0 })} style={pillBtn(THEME.btnAction)}>⟳ Reset Rotation</button>
                    <button onClick={removeSelectedAccessory} style={pillBtn(THEME.btnDanger)}>🗑️ Remove Accessory</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips Card */}
        <div style={card()}>
          <div style={{ color: THEME.textSoft, lineHeight: 1.6 }}>
            <b>Tips:</b> Toggle **Show Eyes** or **Show Mouth** anytime. Add accessories,
            tap to select, then use two fingers on the canvas to rotate and pinch-zoom.
            Increase overall <i>Size</i> before downloading for a sharper PNG.
          </div>
        </div>
      </div>
    </div>
  );
};

/** ---------- Helpers ---------- */

const pillBtn = (background: string) => ({
  background,
  color: "#09132b",
  border: "none",
  padding: "10px 14px",
  borderRadius: 999,
  fontWeight: 800,
  cursor: "pointer" as const,
  boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
  transition: "transform .15s ease",
});

const card = () => ({
  background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))",
  border: `1px solid ${THEME.border}`,
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
});

const segmentedRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const SegmentedButton: React.FC<
  React.PropsWithChildren<{ active?: boolean; onClick?: () => void }>
> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: "10px 14px",
      borderRadius: 12,
      border: `1px solid ${active ? THEME.focus : THEME.border}`,
      background: active ? "rgba(96,165,250,0.18)" : "rgba(255,255,255,0.04)",
      color: THEME.text,
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

const Swatch: React.FC<{ color: string; active?: boolean; onClick: () => void }> = ({
  color,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    title={color}
    aria-label={`Choose ${color}`}
    style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      border: active ? `2px solid ${THEME.focus}` : `2px solid ${THEME.border}`,
      outline: "none",
      background: color,
      cursor: "pointer",
      boxShadow: active ? "0 0 0 6px rgba(96,165,250,0.2)" : "none",
    }}
  />
);

const sliderStyle: React.CSSProperties = {
  width: "100%",
  appearance: "none",
  height: 6,
  borderRadius: 999,
  background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
  outline: "none",
} as const;

function getSelected(state: AvatarState) {
  return state.accessories.find((a) => a.id === state.selectedAccId) || null;
}

export default AvatarCreator;
