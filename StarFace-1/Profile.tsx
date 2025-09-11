import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Upgrades:
 * - Modern color palette with soft gradient header and elevated cards
 * - "Back to Home" button kept and refined
 * - Credential Center: change username & password with a 21-day (3 weeks) cooldown
 * - Friendly countdown showing when the next change is allowed
 * - LocalStorage keys used:
 *    - myUsername (string) — active session username
 *    - auth (object JSON) — { username, password, lastChangeISO }
 *    - social_posts (array JSON)
 *    - followers (object map of username -> [followers])
 */

const COOLDOWN_DAYS = 21; // 3 weeks

const Profile: React.FC = () => {
  const navigate = useNavigate();

  // UI palette
  const palette = useMemo(
    () => ({
      bg: "#0b1220",
      card: "#0f172a",
      soft: "#111827",
      border: "#1f2937",
      text: "#e5e7eb",
      subtext: "#9ca3af",
      primary: "#7c3aed", // violet
      primaryAccent: "#22d3ee", // cyan
      danger: "#ef4444",
      success: "#10b981",
    }),
    []
  );

  const [username, setUsername] = useState("Guest");
  const [avatar, setAvatar] = useState("🙂");
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState(0);
  const [followers, setFollowers] = useState<string[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);

  // Credential Center state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [lastChangeISO, setLastChangeISO] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Helpers
  const parseAuth = () => {
    const raw = localStorage.getItem("auth");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saveAuth = (data: { username: string; password: string; lastChangeISO: string }) => {
    localStorage.setItem("auth", JSON.stringify(data));
  };

  const now = () => new Date();

  const msUntilAllowed = useMemo(() => {
    if (!lastChangeISO) return 0; // allow immediately if never changed
    const last = new Date(lastChangeISO);
    const next = new Date(last.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    return Math.max(0, next.getTime() - now().getTime());
  }, [lastChangeISO]);

  const formatRemaining = (ms: number) => {
    if (ms <= 0) return "Now";
    const totalHours = Math.ceil(ms / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days <= 0) return `${hours}h`;
    return `${days}d ${hours}h`;
  };

  const canChangeCredentials = msUntilAllowed <= 0;

  useEffect(() => {
    // Initialize from storage
    const storedUsername = localStorage.getItem("myUsername") || "Guest";
    setUsername(storedUsername);

    // Ensure auth object exists
    const auth = parseAuth();
    if (!auth) {
      const bootstrap = {
        username: storedUsername,
        password: "", // no password set yet
        lastChangeISO: null as unknown as string,
      };
      // Store with null converted to empty string to keep type
      localStorage.setItem(
        "auth",
        JSON.stringify({ ...bootstrap, lastChangeISO: "" })
      );
      setLastChangeISO(null);
    } else {
      setLastChangeISO(auth.lastChangeISO || null);
      setNewUsername(auth.username || storedUsername);
    }

    const postsRaw = localStorage.getItem("social_posts");
    const posts = postsRaw ? JSON.parse(postsRaw) : [];
    const mine = posts.filter((p: any) => p.username === storedUsername);
    setMyPosts(mine);

    const totalLikes = mine.reduce((sum: number, p: any) => sum + (p.likes || 0), 0);
    const totalViews = mine.reduce((sum: number, p: any) => sum + (p.views || 0), 0);
    const totalComments = mine.reduce((sum: number, p: any) => sum + ((p.comments && p.comments.length) || 0), 0);

    setLikes(totalLikes);
    setViews(totalViews);
    setComments(totalComments);

    const followData = JSON.parse(localStorage.getItem("followers") || "{}");
    const userFollowers = followData[storedUsername] || [];
    setFollowers(userFollowers);

    // Listen for storage changes (another tab / page action)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "social_posts" || e.key === "followers" || e.key === "auth" || e.key === "myUsername") {
        window.location.reload();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("myUsername");
    navigate("/login");
  };

  const handleCredentialSave = () => {
    setMessage(null);
    // Validate cooldown
    if (!canChangeCredentials) {
      return setMessage({ type: "error", text: "You can only update credentials once every 3 weeks." });
    }

    // Basic validation
    if (!newUsername || newUsername.trim().length < 3) {
      return setMessage({ type: "error", text: "Username should be at least 3 characters." });
    }
    if (newPassword && newPassword.length < 6) {
      return setMessage({ type: "error", text: "Password should be at least 6 characters." });
    }

    // Verify current password (if one exists)
    const auth = parseAuth();
    const existingPassword = auth?.password || "";
    if (existingPassword && currentPassword !== existingPassword) {
      return setMessage({ type: "error", text: "Current password is incorrect." });
    }

    // Save
    const nextAuth = {
      username: newUsername.trim(),
      password: newPassword || existingPassword || "",
      lastChangeISO: new Date().toISOString(),
    };
    saveAuth(nextAuth);

    // Sync the session username key used elsewhere in the app
    localStorage.setItem("myUsername", nextAuth.username);
    setUsername(nextAuth.username);
    setLastChangeISO(nextAuth.lastChangeISO);
    setCurrentPassword("");
    setNewPassword("");

    setMessage({ type: "success", text: "Credentials updated successfully." });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(1200px 600px at 10% -10%, ${palette.primary}22, transparent), radial-gradient(800px 400px at 90% 10%, ${palette.primaryAccent}22, transparent), ${palette.bg}`,
      color: palette.text,
      padding: "24px",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    }}>
      {/* Top Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: 1040,
        margin: "0 auto 16px",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 12,
            background: "linear-gradient(90deg, #1f2937, #111827)",
            border: `1px solid ${palette.border}`,
            color: palette.text,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          }}
        >
          <span style={{ fontSize: 18 }}>⬅️</span> Back to Home
        </button>

        <button
          onClick={handleSignOut}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            background: palette.danger,
            border: "none",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(239,68,68,0.35)",
          }}
        >
          🚪 Sign Out
        </button>
      </div>

      {/* Header Card */}
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          background: "linear-gradient(135deg, #1f2937, #0f172a)",
          padding: 24,
          borderRadius: 20,
          border: `1px solid ${palette.border}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 30px rgba(0,0,0,0.35)",
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 48,
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${palette.primary}33, ${palette.primaryAccent}33)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${palette.border}`,
          }}>
            {avatar}
          </div>
          <div>
            <h2 style={{ margin: 0, letterSpacing: 0.2 }}>{username}</h2>
            <p style={{ color: palette.subtext, marginTop: 6 }}>Welcome to your profile</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}>
          <StatCard palette={palette} icon="❤️" label="Likes" value={likes} />
          <StatCard palette={palette} icon="👁️" label="Views" value={views} />
          <StatCard palette={palette} icon="💬" label="Comments" value={comments} />
          <StatCard palette={palette} icon="👥" label="Followers" value={followers.length} />
        </div>

        {/* Credential Center */}
        <div style={{
          background: palette.card,
          border: `1px solid ${palette.border}`,
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          marginBottom: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>🔐 Credential Center</h3>
            <small style={{ color: palette.subtext }}>
              {canChangeCredentials ? (
                <span>Next change: <b>Now</b></span>
              ) : (
                <span>Next change in: <b>{formatRemaining(msUntilAllowed)}</b></span>
              )}
            </small>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: palette.subtext }}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                style={inputStyle(palette)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: palette.subtext }}>New Username</label>
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="New username"
                style={inputStyle(palette)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: palette.subtext }}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                style={inputStyle(palette)}
              />
            </div>
          </div>

          {message && (
            <div
              role="status"
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${message.type === "success" ? "#064e3b" : "#7f1d1d"}`,
                background: message.type === "success" ? "#064e3b55" : "#7f1d1d55",
                color: "#fff",
                fontSize: 14,
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button
              disabled={!canChangeCredentials}
              onClick={handleCredentialSave}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                cursor: canChangeCredentials ? "pointer" : "not-allowed",
                border: `1px solid ${canChangeCredentials ? palette.primary : palette.border}`,
                background: canChangeCredentials
                  ? `linear-gradient(90deg, ${palette.primary}, ${palette.primaryAccent})`
                  : "#1f2937",
                color: "#fff",
                opacity: canChangeCredentials ? 1 : 0.5,
                boxShadow: canChangeCredentials ? "0 8px 24px rgba(124,58,237,0.35)" : "none",
              }}
            >
              Save Changes
            </button>
          </div>

          <small style={{ color: palette.subtext, display: "block", marginTop: 10 }}>
            Security note: This demo stores passwords in <em>localStorage</em> for simplicity. In production, use a backend and never store plaintext passwords in the browser.
          </small>
        </div>

        {/* Posts */}
        <div style={{
          background: palette.card,
          border: `1px solid ${palette.border}`,
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          marginBottom: 60,
        }}>
          <h3 style={{ marginTop: 0 }}>📝 My Posts ({myPosts.length})</h3>
          {myPosts.length === 0 ? (
            <p style={{ color: palette.subtext }}>No posts yet. Start sharing!</p>
          ) : (
            myPosts.map((post, idx) => (
              <div
                key={idx}
                style={{
                  background: palette.soft,
                  padding: 16,
                  borderRadius: 14,
                  marginBottom: 14,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <div style={{ fontSize: 12, color: palette.subtext }}>{post.timestamp}</div>
                <p style={{ fontSize: 16, margin: "10px 0" }}>{post.content}</p>
                <div style={{ fontSize: 14, color: palette.subtext, display: "flex", gap: 16 }}>
                  <span>❤️ {post.likes || 0}</span>
                  <span>👁️ {post.views || 0}</span>
                  <span>💬 {(post.comments && post.comments.length) || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

// Reusable stat card component
const StatCard = ({
  palette,
  icon,
  label,
  value,
}: {
  palette: any;
  icon: string;
  label: string;
  value: number;
}) => (
  <div style={{
    background: "linear-gradient(135deg, #111827, #0b1220)",
    padding: 18,
    borderRadius: 18,
    textAlign: "center",
    border: `1px solid ${palette.border}`,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  }}>
    <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontWeight: 700, fontSize: 20 }}>{value}</div>
    <div style={{ fontSize: 13, color: palette.subtext }}>{label}</div>
  </div>
);

// Input style helper
const inputStyle = (palette: any): React.CSSProperties => ({
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  background: "#0b1020",
  color: "#e5e7eb",
  outline: "none",
});
