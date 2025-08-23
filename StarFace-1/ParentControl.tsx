import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * ParentalControl – Dark Blue + Yellow Edition
 * ---------------------------------------------------------
 * ✓ Always‑visible "Back to Home" button (top bar)
 * ✓ Polished dark‑blue UI with yellow accents
 * ✓ PIN create / verify / change
 * ✓ Screen‑time presets (5/15/30/60) + custom minutes
 * ✓ Timer persists across refresh; auto‑locks on expiry
 * ✓ Circular progress + countdown text
 * ✓ Optional web notification on expiry
 *
 * Storage keys:
 *  - parentalPassword: string (plaintext for demo)
 *  - parentalAllowedUntil: number (ms epoch)
 */

const KEYS = {
  password: "parentalPassword",
  allowedUntil: "parentalAllowedUntil",
} as const;

// ——— Theme (Dark Blue + Yellow)
const palette = {
  bg: "#0a1a2f",          // deep navy background
  card: "#102a4c",        // darker blue card
  cardSoft: "#0f2543",
  border: "#1b3d66",      // blue border
  text: "#eaf2ff",        // near‑white text
  subtext: "#b6c2d1",     // muted blue‑gray
  yellow: "#ffd60a",      // primary accent
  yellowDark: "#e6bf00",  // pressed/hover
  danger: "#ff4d4f",
  success: "#06d6a0",
};

type Step = "set" | "verify" | "granted";

const ParentalControl: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("set");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<string>("");

  const [minutesInput, setMinutesInput] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number>(0); // seconds
  const [running, setRunning] = useState<boolean>(false);

  const [showChange, setShowChange] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const tickRef = useRef<number | null>(null);

  // Helpers
  const now = () => Date.now();
  const getSavedPin = () => localStorage.getItem(KEYS.password) || "";
  const notify = (title: string, body?: string) => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") new Notification(title, { body });
      else if (Notification.permission !== "denied") Notification.requestPermission();
    }
  };

  const readAllowance = () => {
    const until = Number(localStorage.getItem(KEYS.allowedUntil) || 0);
    const remainingMs = until - now();
    if (remainingMs > 0) {
      setStep("granted");
      setTimeLeft(Math.ceil(remainingMs / 1000));
      setRunning(true);
    } else {
      localStorage.removeItem(KEYS.allowedUntil);
      setRunning(false);
      setTimeLeft(0);
      setStep(getSavedPin() ? "verify" : "set");
    }
  };

  // Init
  useEffect(() => {
    readAllowance();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEYS.allowedUntil) readAllowance();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Timer loop
  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(tickRef.current!);
          setRunning(false);
          localStorage.removeItem(KEYS.allowedUntil);
          setStep("verify");
          setMsg("🔒 Time expired. Re‑enter PIN to unlock.");
          notify("Screen time ended", "The session has been locked.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
    return () => clearInterval(tickRef.current!);
  }, [running]);

  // Actions
  const handleSetPin = () => {
    if (pin.length < 4) return setMsg("❗ PIN must be at least 4 digits/characters.");
    localStorage.setItem(KEYS.password, pin);
    setMsg("✅ PIN created.");
    setStep("granted");
    setPin("");
  };

  const handleVerify = () => {
    const saved = getSavedPin();
    if (pin === saved) {
      setMsg("");
      setStep("granted");
      setPin("");
    } else setMsg("❌ Wrong PIN.");
  };

  const startTimer = (mins: number) => {
    const seconds = Math.max(1, Math.floor(mins * 60));
    setMinutesInput(mins);
    setTimeLeft(seconds);
    setRunning(true);
    const until = now() + seconds * 1000;
    localStorage.setItem(KEYS.allowedUntil, String(until));
    setMsg("");
  };

  const lockNow = () => {
    setRunning(false);
    setTimeLeft(0);
    localStorage.removeItem(KEYS.allowedUntil);
    setStep("verify");
    setMsg("🔒 Locked.");
  };

  const handleChangePin = () => {
    const saved = getSavedPin();
    if (oldPin !== saved) return setMsg("❌ Old PIN is incorrect.");
    if (newPin.length < 4) return setMsg("❗ New PIN must be at least 4 characters.");
    localStorage.setItem(KEYS.password, newPin);
    setOldPin("");
    setNewPin("");
    setShowChange(false);
    setMsg("✅ PIN changed successfully.");
  };

  // Derived UI
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const total = Math.max(1, minutesInput * 60);
  const progress = timeLeft > 0 ? timeLeft / total : 0; // 0..1

  const circle = useMemo(() => {
    const r = 64;
    const c = 2 * Math.PI * r;
    return { r, c, offset: c * (1 - progress) };
  }, [progress]);

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, color: palette.text, padding: 24, fontFamily: "Inter, system-ui, Segoe UI, Roboto" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 680, margin: "0 auto 16px" }}>
        <button onClick={() => navigate("/")} style={backBtnStyle}>⬅️ Back to Home</button>
        {step === "granted" && (
          <button onClick={lockNow} style={dangerBtnStyle}>🔒 Lock Now</button>
        )}
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", background: palette.card, border: `1px solid ${palette.border}`, borderRadius: 18, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, background: palette.yellow, borderRadius: '50%' }} />
          Parental Control
        </h2>

        {/* Locked/Setup Flow */}
        {step !== "granted" && (
          <div>
            <input
              type="password"
              placeholder={step === "set" ? "Create PIN" : "Enter PIN"}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={inputStyle}
            />
            <button onClick={step === "set" ? handleSetPin : handleVerify} style={primaryBtnStyle}>
              {step === "set" ? "Save PIN" : "Unlock"}
            </button>
            <p style={{ color: msg.includes("✅") ? palette.success : palette.danger, minHeight: 22 }}>{msg}</p>
          </div>
        )}

        {/* Granted Area */}
        {step === "granted" && (
          <div>
            {/* Timer Card */}
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, alignItems: "center", marginTop: 8 }}>
              <div style={{ display: "grid", placeItems: "center", background: palette.cardSoft, border: `1px solid ${palette.border}`, borderRadius: 16, padding: 8 }}>
                <svg width={160} height={160} viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r={64} stroke={palette.border} strokeWidth={10} fill="none" />
                  <circle
                    cx="80"
                    cy="80"
                    r={circle.r}
                    stroke={palette.yellow}
                    strokeWidth={10}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={circle.c}
                    strokeDashoffset={circle.offset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={palette.text} fontSize="22" fontWeight={700}>
                    {minutes}:{String(seconds).padStart(2, "0")}
                  </text>
                </svg>
              </div>
              <div>
                <label style={{ color: palette.subtext, fontSize: 13 }}>Set Screen Time (minutes)</label>
                <div style={{ display: "flex", gap: 8, margin: "6px 0 10px" }}>
                  {[5, 15, 30, 60].map((m) => (
                    <button key={m} onClick={() => setMinutesInput(m)} style={chipStyle(minutesInput === m)}>{m}</button>
                  ))}
                  <input type="number" min={1} value={minutesInput} onChange={(e) => setMinutesInput(Math.max(1, Number(e.target.value)))} style={{ ...inputStyle, width: 110 }} />
                </div>

                {!running ? (
                  <button onClick={() => startTimer(minutesInput)} style={primaryBtnStyle}>Start Timer</button>
                ) : (
                  <p style={{ color: palette.subtext, margin: "8px 0" }}>⏳ Running… App will auto‑lock when time runs out.</p>
                )}
              </div>
            </div>

            {/* Change PIN */}
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px dashed ${palette.border}` }}>
              <button onClick={() => setShowChange((v) => !v)} style={ghostBtnStyle}>{showChange ? "Cancel" : "🔑 Change PIN"}</button>
              {showChange && (
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input type="password" placeholder="Old PIN" value={oldPin} onChange={(e) => setOldPin(e.target.value)} style={inputStyle} />
                  <input type="password" placeholder="New PIN (min 4)" value={newPin} onChange={(e) => setNewPin(e.target.value)} style={inputStyle} />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <button onClick={handleChangePin} style={primaryBtnStyle}>Save New PIN</button>
                  </div>
                </div>
              )}
            </div>

            <p style={{ color: msg.includes("✅") ? palette.success : palette.danger, minHeight: 22, marginTop: 8 }}>{msg}</p>
            <small style={{ color: palette.subtext }}>Tip: For production, store only hashes and enforce checks on a backend.</small>
          </div>
        )}
      </div>
    </div>
  );
};

// ——— Styles
const backBtnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${palette.yellow}`,
  background: "transparent",
  color: palette.text,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "none",
  background: `linear-gradient(90deg, ${palette.yellow}, ${palette.yellowDark})`,
  color: "#1a1a1a",
  cursor: "pointer",
  width: "100%",
  fontWeight: 700,
};

const dangerBtnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${palette.danger}`,
  background: "transparent",
  color: palette.danger,
  cursor: "pointer",
};

const ghostBtnStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: `1px solid ${palette.border}`,
  background: palette.card,
  color: palette.text,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${palette.border}`,
  background: palette.bg,
  color: palette.text,
  outline: "none",
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: "6px 10px",
  borderRadius: 999,
  border: `1px solid ${active ? palette.yellow : palette.border}`,
  background: active ? `${palette.yellow}22` : palette.card,
  color: active ? palette.text : palette.subtext,
  cursor: "pointer",
});

export default ParentalControl;
