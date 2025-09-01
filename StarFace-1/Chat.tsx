import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* =============================
   Types
============================= */
interface Server {
  id: string;
  name: string;
  icon: string; // emoji
  channels: Channel[];
  members: Member[];
  roles: Role[];
  joinCode?: string;
  password?: string;
  owner?: string;
  audit?: AuditEvent[]; // basic audit feed
}
interface AuditEvent {
  id: string;
  at: number;
  who: string;
  action: string; // e.g. "created server", "pinned", etc.
  meta?: Record<string, any>;
}
interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  topic?: string;
  messages?: Message[];
  participants?: string[];
  pinnedIds?: string[];
}
interface Message {
  id: string;
  author: string;
  content: string;
  timestamp: number; // epoch
  avatar?: string;
  edited?: boolean;
  reactions?: Record<string, string[]>;
  replyToId?: string;
  attachments?: Attachment[];
}
interface Attachment {
  id: string;
  name: string;
  mime: string;
  dataUrl: string; // base64
}
interface Member {
  username: string;
  status: "online" | "away" | "busy" | "offline";
  role: string; // role id
  avatar?: string;
}
interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

/* =============================
   Theme (dark blue + yellow)
============================= */
const THEME = {
  bgGradient: "linear-gradient(135deg, #09132b 0%, #0a1f44 75%)",
  card: "#0a1f44",
  cardSoft: "#102a5f",
  input: "#1b2a5a",
  border: "#234a8a",
  textSoft: "#cfe2ff",
  textSubtle: "#9fb9ef",
  accent: "#FFD700",
  accentBtn: "linear-gradient(135deg, #ffcc00, #ff9900)",
  actionBtn: "linear-gradient(135deg, #00e7ff, #4facfe)",
  dangerBtn: "linear-gradient(135deg, #ff7a7a, #ff4d4d)",
  successBtn: "linear-gradient(135deg, #2de3a0, #11c48d)",
};

const statusDot: Record<Member["status"], string> = {
  online: "#34d399",
  away: "#fbbf24",
  busy: "#f87171",
  offline: "#71717a",
};

/* =============================
   Helpers & Storage
============================= */
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const ts = (n?: number) =>
  new Date(n ?? Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const EMOJIS = ["😀","😂","😍","😮","😎","😭","👍","❤️","🔥","🎉","🙏","💡","🌟","💬","🚀"];

// Enhanced online features
interface OnlineUser {
  username: string;
  status: Member["status"];
  lastSeen: number;
  isTyping: boolean;
  inVoiceCall?: string; // channel id
}

interface FriendRequest {
  id: string;
  from: string;
  to: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'declined';
}

interface VoiceCall {
  id: string;
  participants: string[];
  channelId: string;
  startTime: number;
  isActive: boolean;
}

const storageKey = (username: string) => `${username || "anon"}_servers_v4`;
const DIR_KEY = "global_servers_v2"; // server directory (demo-only, same device)
const ONLINE_USERS_KEY = "online_users_v1";
const FRIEND_REQUESTS_KEY = "friend_requests_v1";
const VOICE_CALLS_KEY = "voice_calls_v1";
type DirectoryEntry = { code: string; server: Server; password?: string };

function readDirectory(): Record<string, DirectoryEntry> {
  const raw = localStorage.getItem(DIR_KEY);
  return raw ? JSON.parse(raw) : {};
}
function writeDirectory(dir: Record<string, DirectoryEntry>) {
  localStorage.setItem(DIR_KEY, JSON.stringify(dir));
}
function putDirectoryEntry(entry: DirectoryEntry) {
  const dir = readDirectory();
  dir[entry.code] = entry;
  writeDirectory(dir);
}
function getDirectoryEntry(code: string) {
  const dir = readDirectory();
  return dir[code];
}

// Online user management
function getOnlineUsers(): Record<string, OnlineUser> {
  const raw = localStorage.getItem(ONLINE_USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}
function setOnlineUsers(users: Record<string, OnlineUser>) {
  localStorage.setItem(ONLINE_USERS_KEY, JSON.stringify(users));
}
function updateUserStatus(username: string, status: Member["status"], isTyping = false) {
  const users = getOnlineUsers();
  users[username] = {
    username,
    status,
    lastSeen: Date.now(),
    isTyping,
    inVoiceCall: users[username]?.inVoiceCall
  };
  setOnlineUsers(users);
}

// Friend request management
function getFriendRequests(): FriendRequest[] {
  const raw = localStorage.getItem(FRIEND_REQUESTS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function setFriendRequests(requests: FriendRequest[]) {
  localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));
}
function sendFriendRequest(from: string, to: string) {
  const requests = getFriendRequests();
  const existing = requests.find(r => r.from === from && r.to === to && r.status === 'pending');
  if (existing) return false;
  
  const request: FriendRequest = {
    id: uid(),
    from,
    to,
    timestamp: Date.now(),
    status: 'pending'
  };
  requests.push(request);
  setFriendRequests(requests);
  return true;
}

// Voice call management
function getVoiceCalls(): VoiceCall[] {
  const raw = localStorage.getItem(VOICE_CALLS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function setVoiceCalls(calls: VoiceCall[]) {
  localStorage.setItem(VOICE_CALLS_KEY, JSON.stringify(calls));
}
const genJoinCode = () =>
  "SF-" +
  Array.from({ length: 6 })
    .map(() => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)])
    .join("");

// relations (friends)
type Relations = { friends: string[]; outgoing: string[]; incoming: string[] };
const relKey = (u: string) => `${u}_relations`;
const readRelations = (u: string): Relations => {
  const raw = localStorage.getItem(relKey(u));
  if (raw) return JSON.parse(raw);
  const fresh = { friends: [], outgoing: [], incoming: [] };
  localStorage.setItem(relKey(u), JSON.stringify(fresh));
  return fresh;
};
const writeRelations = (u: string, r: Relations) => localStorage.setItem(relKey(u), JSON.stringify(r));

// DMs store (per user)
type DMStore = Record<string, Message[]>; // friend -> messages
const dmKey = (u: string) => `${u}_dms_v1`;
const readDMs = (u: string): DMStore => {
  const raw = localStorage.getItem(dmKey(u));
  return raw ? JSON.parse(raw) : {};
};
const writeDMs = (u: string, s: DMStore) => localStorage.setItem(dmKey(u), JSON.stringify(s));
function appendDM(a: string, b: string, m: Message) {
  const A = readDMs(a);
  const B = readDMs(b);
  A[b] = [...(A[b] || []), m];
  // mirror for the other user (so you can log in as them later on same device)
  B[a] = [...(B[a] || []), { ...m, author: a === m.author ? a : b }];
  writeDMs(a, A);
  writeDMs(b, B);
}

/* =============================
   Reusable UI helpers
============================= */
const btn = (bg: string, color = "#0a1f44"): React.CSSProperties => ({
  background: bg,
  color,
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
});
const tag: React.CSSProperties = {
  background: "#0f275b",
  color: "#dce8ff",
  border: `1px solid ${THEME.border}`,
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 12,
};
function copy(text: string) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

/* =============================
   Component
============================= */
export default function ChatPro() {
  const navigate = useNavigate();

  // Auth
  const [myUsername, setMyUsername] = useState<string>(() => localStorage.getItem("myUsername") || "");
  const [usernameInput, setUsernameInput] = useState("");
  const [userStatus, setUserStatus] = useState<Member["status"]>("online");

  // Core
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  // DM
  const [dmWith, setDmWith] = useState<string | null>(null);
  const [dmStore, setDmStore] = useState<DMStore>(() => (myUsername ? readDMs(myUsername) : {}));

  // Compose
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [draftFiles, setDraftFiles] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  // Typing
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const typingTimeoutRef = useRef<number | null>(null);

  // Voice
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // UI modals/drawers
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showPins, setShowPins] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Create server form
  const [newServerName, setNewServerName] = useState("");
  const [newServerPassword, setNewServerPassword] = useState("");
  const [newServerCode, setNewServerCode] = useState(genJoinCode());

  // Join server form
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  // Friends
  const [relations, setRelations] = useState<Relations>(() =>
    myUsername ? readRelations(myUsername) : { friends: [], outgoing: [], incoming: [] }
  );
  const [searchUser, setSearchUser] = useState("");

  // Enhanced online features
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>(() => getOnlineUsers());
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => getFriendRequests());
  const [voiceCalls, setVoiceCalls] = useState<VoiceCall[]>(() => getVoiceCalls());
  const [currentCall, setCurrentCall] = useState<VoiceCall | null>(null);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

  // Search
  const [searchText, setSearchText] = useState("");
  const [searchAuthor, setSearchAuthor] = useState("");

  // Toasts
  const [toasts, setToasts] = useState<{ id: string; text: string; kind?: "ok" | "warn" | "err" }[]>([]);

  // Scroll
  const endRef = useRef<HTMLDivElement | null>(null);

  /* -------- Load & bootstrap -------- */
  useEffect(() => {
    if (!myUsername) return;
    const raw = localStorage.getItem(storageKey(myUsername));
    if (raw) {
      const parsed: Server[] = JSON.parse(raw);
      setServers(parsed);
      setSelectedServerId(parsed[0]?.id || null);
      setSelectedChannelId(parsed[0]?.channels[0]?.id || null);
      setRelations(readRelations(myUsername));
      setDmStore(readDMs(myUsername));
      return;
    }

    const defaultServer: Server = {
      id: "default",
      name: "My Server",
      icon: "🌟",
      channels: [
        { id: "general-text", name: "general", type: "text", topic: "Say hello!", messages: [], pinnedIds: [] },
        { id: "random-text", name: "random", type: "text", messages: [], pinnedIds: [] },
        { id: "general-voice", name: "General Voice", type: "voice", participants: [] },
      ],
      members: [{ username: myUsername, status: "online", role: "admin", avatar: "" }],
      roles: [
        { id: "admin", name: "Admin", color: THEME.accent, permissions: ["all"] },
        { id: "member", name: "Member", color: "#4facfe", permissions: ["read", "write"] },
      ],
      owner: myUsername,
      joinCode: genJoinCode(),
      password: "",
      audit: [{ id: uid(), at: Date.now(), who: myUsername, action: "created server" }],
    };
    setServers([defaultServer]);
    setSelectedServerId(defaultServer.id);
    setSelectedChannelId(defaultServer.channels[0].id);
    putDirectoryEntry({ code: defaultServer.joinCode!, server: defaultServer, password: "" });
  }, [myUsername]);

  // persist
  useEffect(() => {
    if (!myUsername) return;
    localStorage.setItem(storageKey(myUsername), JSON.stringify(servers));
  }, [servers, myUsername]);

  // Online status management
  useEffect(() => {
    if (!myUsername) return;
    
    // Update user status every 5 seconds
    const statusInterval = setInterval(() => {
      updateUserStatus(myUsername, userStatus);
      setOnlineUsers(getOnlineUsers());
    }, 5000);

    // Clean up offline users (not seen in 2 minutes)
    const cleanupInterval = setInterval(() => {
      const users = getOnlineUsers();
      const now = Date.now();
      const updated = Object.fromEntries(
        Object.entries(users).filter(([_, user]) => now - user.lastSeen < 120000)
      );
      setOnlineUsers(updated);
      setOnlineUsers(updated);
    }, 30000);

    // Initial status update
    updateUserStatus(myUsername, userStatus);

    return () => {
      clearInterval(statusInterval);
      clearInterval(cleanupInterval);
    };
  }, [myUsername, userStatus]);

  // Friend requests polling
  useEffect(() => {
    if (!myUsername) return;
    
    const requestsInterval = setInterval(() => {
      setFriendRequests(getFriendRequests());
    }, 3000);

    return () => clearInterval(requestsInterval);
  }, [myUsername]);

  // auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [servers, selectedServerId, selectedChannelId, dmWith, dmStore]);

  /* -------- Derivations -------- */
  const currentServer = useMemo(() => servers.find((s) => s.id === selectedServerId), [servers, selectedServerId]);
  const currentChannel = useMemo(
    () => currentServer?.channels.find((c) => c.id === selectedChannelId),
    [currentServer, selectedChannelId]
  );
  const textChannels = currentServer?.channels.filter((c) => c.type === "text") ?? [];
  const voiceChannels = currentServer?.channels.filter((c) => c.type === "voice") ?? [];

  /* -------- Auth submit -------- */
  const handleSetUsername = () => {
    const u = usernameInput.trim();
    if (!u) return;
    localStorage.setItem("myUsername", u);
    setMyUsername(u);
    setRelations(readRelations(u));
    setDmStore(readDMs(u));
  };

  /* -------- Toasts -------- */
  const toast = (text: string, kind: "ok" | "warn" | "err" = "ok") => {
    const t = { id: uid(), text, kind };
    setToasts((p) => [...p, t]);
    window.setTimeout(() => {
      setToasts((p) => p.filter((x) => x.id !== t.id));
    }, 2500);
  };

  /* -------- Messaging (server text) -------- */
  const pushServers = (updater: (prev: Server[]) => Server[]) => setServers((prev) => updater(prev));

  const sendMessage = () => {
    if (dmWith) return sendDM();
    if (!draft.trim() && draftFiles.length === 0) return;
    if (!currentServer || !currentChannel || currentChannel.type !== "text") return;

    const base: Partial<Message> = editingId
      ? { edited: true }
      : { id: uid(), author: myUsername, timestamp: Date.now(), replyToId, attachments: draftFiles };

    pushServers((prev) =>
      prev.map((s) => {
        if (s.id !== currentServer.id) return s;
        return {
          ...s,
          channels: s.channels.map((c) => {
            if (c.id !== currentChannel.id || c.type !== "text") return c;
            const messages = [...(c.messages || [])];
            if (editingId) {
              const idx = messages.findIndex((m) => m.id === editingId);
              if (idx >= 0) messages[idx] = { ...messages[idx], content: draft, edited: true };
            } else {
              messages.push({ ...(base as Message), content: draft } as Message);
            }
            return { ...c, messages };
          }),
          audit: [
            ...(s.audit || []),
            { id: uid(), at: Date.now(), who: myUsername, action: editingId ? "edited message" : "sent message" },
          ],
        };
      })
    );

    setDraft("");
    setEditingId(null);
    setReplyToId(null);
    setDraftFiles([]);
    setShowEmoji(false);
  };

  const removeMessage = (id: string) => {
    if (dmWith) return; // keep DM delete out for now
    if (!currentServer || !currentChannel || currentChannel.type !== "text") return;
    pushServers((prev) =>
      prev.map((s) =>
        s.id === currentServer.id
          ? {
              ...s,
              channels: s.channels.map((c) =>
                c.id === currentChannel.id && c.type === "text"
                  ? { ...c, messages: (c.messages || []).filter((m) => m.id !== id) }
                  : c
              ),
              audit: [...(s.audit || []), { id: uid(), at: Date.now(), who: myUsername, action: "deleted message" }],
            }
          : s
      )
    );
  };

  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setDraft(m.content);
  };

  const addReaction = (id: string, emoji: string) => {
    if (dmWith) return;
    if (!currentServer || !currentChannel || currentChannel.type !== "text") return;
    pushServers((prev) =>
      prev.map((s) => {
        if (s.id !== currentServer.id) return s;
        return {
          ...s,
          channels: s.channels.map((c) => {
            if (c.id !== currentChannel.id || c.type !== "text") return c;
            const messages = (c.messages || []).map((m) => {
              if (m.id !== id) return m;
              const list = new Set([...(m.reactions?.[emoji] || [])]);
              if (list.has(myUsername)) list.delete(myUsername);
              else list.add(myUsername);
              const reactions = { ...(m.reactions || {}), [emoji]: Array.from(list) };
              return { ...m, reactions };
            });
            return { ...c, messages };
          }),
        };
      })
    );
  };

  const pinToggle = (id: string) => {
    if (!currentServer || !currentChannel || currentChannel.type !== "text") return;
    pushServers((prev) =>
      prev.map((s) => {
        if (s.id !== currentServer.id) return s;
        return {
          ...s,
          channels: s.channels.map((c) => {
            if (c.id !== currentChannel.id) return c;
            const pins = new Set(c.pinnedIds || []);
            pins.has(id) ? pins.delete(id) : pins.add(id);
            return { ...c, pinnedIds: Array.from(pins) };
          }),
          audit: [...(s.audit || []), { id: uid(), at: Date.now(), who: myUsername, action: "toggled pin" }],
        };
      })
    );
    toast("Pin state updated", "ok");
  };

  /* -------- Attachments -------- */
  const handleFiles = async (fl: FileList | null) => {
    if (!fl || fl.length === 0) return;
    const list: Attachment[] = [];
    for (const f of Array.from(fl)) {
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      list.push({ id: uid(), name: f.name, mime: f.type, dataUrl });
    }
    setDraftFiles((p) => [...p, ...list]);
    toast(`${list.length} attachment${list.length > 1 ? "s" : ""} added`, "ok");
  };

  /* -------- DMs -------- */
  const sendDM = () => {
    if (!dmWith) return;
    if (!draft.trim() && draftFiles.length === 0) return;
    const msg: Message = {
      id: uid(),
      author: myUsername,
      content: draft,
      timestamp: Date.now(),
      attachments: draftFiles,
    };
    appendDM(myUsername, dmWith, msg);
    setDmStore(readDMs(myUsername));
    setDraft("");
    setReplyToId(null);
    setDraftFiles([]);
    setShowEmoji(false);
  };

  /* -------- Channels & Servers -------- */
  const createChannel = (type: Channel["type"]) => {
    if (!currentServer) return;
    const name = prompt(`New ${type === "text" ? "text" : "voice"} channel name:`);
    if (!name) return;
    const topic = type === "text" ? prompt("Channel topic (optional):") || "" : undefined;
    const ch: Channel = {
      id: uid(),
      name,
      type,
      topic,
      ...(type === "text" ? { messages: [], pinnedIds: [] } : { participants: [] }),
    };
    pushServers((prev) =>
      prev.map((s) =>
        s.id === currentServer.id
          ? {
              ...s,
              channels: [...s.channels, ch],
              audit: [...(s.audit || []), { id: uid(), at: Date.now(), who: myUsername, action: "created channel", meta: { name } }],
            }
          : s
      )
    );
  };

  const renameChannel = () => {
    if (!currentServer || !currentChannel) return;
    const name = prompt("Rename channel", currentChannel.name);
    if (!name) return;
    pushServers((prev) =>
      prev.map((s) =>
        s.id === currentServer.id
          ? {
              ...s,
              channels: s.channels.map((c) => (c.id === currentChannel.id ? { ...c, name } : c)),
              audit: [...(s.audit || []), { id: uid(), at: Date.now(), who: myUsername, action: "renamed channel", meta: { name } }],
            }
          : s
      )
    );
  };

  const deleteChannel = () => {
    if (!currentServer || !currentChannel) return;
    if (!confirm(`Delete #${currentChannel.name}?`)) return;
    pushServers((prev) =>
      prev.map((s) =>
        s.id === currentServer.id
          ? {
              ...s,
              channels: s.channels.filter((c) => c.id !== currentChannel.id),
              audit: [...(s.audit || []), { id: uid(), at: Date.now(), who: myUsername, action: "deleted channel", meta: { name: currentChannel.name } }],
            }
          : s
      )
    );
    setSelectedChannelId(currentServer.channels.find((c) => c.id !== currentChannel.id)?.id || null);
  };

  /* -------- Create / Join / Settings -------- */
  const [showInvite, setShowInvite] = useState(false);
  const [inviteText, setInviteText] = useState("");

  const createServer = () => {
    if (!newServerName.trim()) return;
    const id = uid();
    const server: Server = {
      id,
      name: newServerName.trim(),
      icon: "🛡️",
      channels: [
        { id: `${id}-general`, name: "general", type: "text", topic: "Welcome!", messages: [], pinnedIds: [] },
        { id: `${id}-voice`, name: "General Voice", type: "voice", participants: [] },
      ],
      members: [{ username: myUsername, status: "online", role: "admin" }],
      roles: [
        { id: "admin", name: "Admin", color: THEME.accent, permissions: ["all"] },
        { id: "member", name: "Member", color: "#4facfe", permissions: ["read", "write"] },
      ],
      owner: myUsername,
      joinCode: newServerCode,
      password: newServerPassword,
      audit: [{ id: uid(), at: Date.now(), who: myUsername, action: "created server" }],
    };
    setServers((prev) => [...prev, server]);
    setSelectedServerId(id);
    setSelectedChannelId(server.channels[0].id);
    putDirectoryEntry({ code: newServerCode, server, password: newServerPassword });
    setInviteText(`Join my server: code ${newServerCode}${newServerPassword ? `, password "${newServerPassword}"` : ""}`);
    setShowInvite(true);
    // reset & close
    setNewServerName("");
    setNewServerPassword("");
    setNewServerCode(genJoinCode());
    setShowCreate(false);
    toast("Server created", "ok");
  };

  const joinServer = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    const entry = getDirectoryEntry(code);
    if (!entry) return void toast("Join code not found", "err");
    if ((entry.password || "") !== (joinPassword || "")) return void toast("Incorrect password", "err");

    if (servers.some((s) => s.id === entry.server.id)) {
      toast("You already joined this server", "warn");
      setShowJoin(false);
      return;
    }

    const copy: Server = JSON.parse(JSON.stringify(entry.server));
    if (!copy.members.find((m) => m.username === myUsername)) {
      copy.members.push({ username: myUsername, status: "online", role: "member" });
    }
    (copy.audit ||= []).push({ id: uid(), at: Date.now(), who: myUsername, action: "joined server" });
    setServers((prev) => [...prev, copy]);
    setSelectedServerId(copy.id);
    setSelectedChannelId(copy.channels[0]?.id || null);
    setJoinCode("");
    setJoinPassword("");
    setShowJoin(false);
    toast("Joined server", "ok");
  };

  const updateServerSettings = (updates: Partial<Server>) => {
    if (!currentServer) return;
    pushServers((prev) =>
      prev.map((s) =>
        s.id === currentServer.id
          ? {
              ...s,
              ...updates,
              audit: [...(s.audit || []), { id: uid(), at: Date.now(), who: myUsername, action: "updated server settings" }],
            }
          : s
      )
    );
    toast("Server settings updated", "ok");
  };
  const rotateJoinCode = () => {
    if (!currentServer) return;
    const newCode = genJoinCode();
    updateServerSettings({ joinCode: newCode });
    // update directory
    putDirectoryEntry({ code: newCode, server: { ...currentServer, joinCode: newCode }, password: currentServer.password });
    toast("Join code rotated", "ok");
  };
  const deleteServer = () => {
    if (!currentServer) return;
    if (!confirm(`Delete server "${currentServer.name}"? This cannot be undone.`)) return;
    setServers((prev) => prev.filter((s) => s.id !== currentServer.id));
    setSelectedServerId(null);
    setSelectedChannelId(null);
    toast("Server deleted", "ok");
  };
  const kickMember = (user: string) => {
    if (!currentServer) return;
    pushServers((prev) =>
      prev.map((s) =>
        s.id === currentServer.id
          ? {
              ...s,
              members: s.members.filter((m) => m.username !== user),
              audit: [...(s.audit || []), { id: uid(), at: Date.now(), who: myUsername, action: "kicked member", meta: { user } }],
            }
          : s
      )
    );
    toast(`Kicked ${user}`, "warn");
  };

  /* -------- Typing -------- */
  const notifyTyping = () => {
    const me = myUsername;
    setTypingUsers((prev) => ({ ...prev, [me]: Date.now() + 2000 }));
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      setTypingUsers((prev) => {
        const copy = { ...prev };
        delete copy[me];
        return copy;
      });
    }, 2000);
  };
  const visibleTypers = Object.entries(typingUsers)
    .filter(([, until]) => until > Date.now())
    .map(([u]) => u)
    .filter((u) => u !== myUsername);

  /* -------- Voice -------- */
  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      mediaStreamRef.current = stream;
      setIsVoiceOn(true);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const mic = ctx.createMediaStreamSource(stream);
      mic.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVoiceLevel(avg);
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      toast("Mic permission denied", "err");
    }
  };
  const stopVoice = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsVoiceOn(false);
    setIsMuted(false);
    setVoiceLevel(0);
  };
  const toggleMute = () => {
    const tracks = mediaStreamRef.current?.getAudioTracks();
    if (!tracks || !tracks.length) return;
    const next = !isMuted;
    tracks.forEach((t) => (t.enabled = !next));
    setIsMuted(next);
  };

  /* -------- Voice Calling -------- */
  const startVoiceCall = (channelId: string, participants: string[]) => {
    if (!myUsername) return;
    
    const call: VoiceCall = {
      id: uid(),
      participants: [myUsername, ...participants],
      channelId,
      startTime: Date.now(),
      isActive: true
    };
    
    const calls = getVoiceCalls();
    calls.push(call);
    setVoiceCalls(calls);
    setCurrentCall(call);
    
    // Update user status to show in call
    const users = getOnlineUsers();
    if (users[myUsername]) {
      users[myUsername].inVoiceCall = channelId;
      setOnlineUsers(users);
    }
    
    startVoice();
    toast("Voice call started", "ok");
  };

  const joinVoiceCall = (callId: string) => {
    if (!myUsername) return;
    
    const calls = getVoiceCalls();
    const call = calls.find(c => c.id === callId);
    if (!call) return;
    
    if (!call.participants.includes(myUsername)) {
      call.participants.push(myUsername);
      setVoiceCalls(calls);
    }
    
    setCurrentCall(call);
    
    // Update user status
    const users = getOnlineUsers();
    if (users[myUsername]) {
      users[myUsername].inVoiceCall = call.channelId;
      setOnlineUsers(users);
    }
    
    startVoice();
    toast("Joined voice call", "ok");
  };

  const endVoiceCall = () => {
    if (!currentCall || !myUsername) return;
    
    const calls = getVoiceCalls();
    const call = calls.find(c => c.id === currentCall.id);
    if (call) {
      call.participants = call.participants.filter(p => p !== myUsername);
      if (call.participants.length === 0) {
        call.isActive = false;
      }
      setVoiceCalls(calls);
    }
    
    // Update user status
    const users = getOnlineUsers();
    if (users[myUsername]) {
      delete users[myUsername].inVoiceCall;
      setOnlineUsers(users);
    }
    
    setCurrentCall(null);
    stopVoice();
    toast("Left voice call", "ok");
  };

  const handleFriendRequest = (requestId: string, action: 'accept' | 'decline') => {
    const requests = getFriendRequests();
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    
    request.status = action === 'accept' ? 'accepted' : 'declined';
    setFriendRequests(requests);
    
    if (action === 'accept') {
      acceptRequest(request.from);
    } else {
      declineRequest(request.from);
    }
  };

  /* -------- Friends -------- */
  const allUsers = JSON.parse(localStorage.getItem("users") || "[]") as any[];
  const others = allUsers.filter((u) => u.username !== myUsername);
  const filteredUsers = others.filter((u) => u.username.toLowerCase().includes(searchUser.trim().toLowerCase()));
  const sendRequest = (toUser: string) => {
    if (!myUsername || toUser === myUsername) return;
    const mine = readRelations(myUsername);
    const theirs = readRelations(toUser);
    if (mine.friends.includes(toUser) || mine.outgoing.includes(toUser)) return;
    
    // Send enhanced friend request
    const sent = sendFriendRequest(myUsername, toUser);
    if (!sent) {
      toast("Friend request already sent", "warn");
      return;
    }
    
    mine.outgoing = Array.from(new Set([...mine.outgoing, toUser]));
    theirs.incoming = Array.from(new Set([...theirs.incoming, myUsername]));
    writeRelations(myUsername, mine);
    writeRelations(toUser, theirs);
    setRelations(mine);
    setFriendRequests(getFriendRequests());
    toast("Friend request sent", "ok");
  };
  const cancelRequest = (toUser: string) => {
    const mine = readRelations(myUsername);
    const theirs = readRelations(toUser);
    mine.outgoing = mine.outgoing.filter((u) => u !== toUser);
    theirs.incoming = theirs.incoming.filter((u) => u !== myUsername);
    writeRelations(myUsername, mine);
    writeRelations(toUser, theirs);
    setRelations(mine);
    toast("Request canceled", "warn");
  };
  const acceptRequest = (fromUser: string) => {
    const mine = readRelations(myUsername);
    const theirs = readRelations(fromUser);
    mine.incoming = mine.incoming.filter((u) => u !== fromUser);
    theirs.outgoing = theirs.outgoing.filter((u) => u !== myUsername);
    mine.friends = Array.from(new Set([...mine.friends, fromUser]));
    theirs.friends = Array.from(new Set([...theirs.friends, myUsername]));
    writeRelations(myUsername, mine);
    writeRelations(fromUser, theirs);
    setRelations(mine);
    toast("Friend added", "ok");
  };
  const declineRequest = (fromUser: string) => {
    const mine = readRelations(myUsername);
    const theirs = readRelations(fromUser);
    mine.incoming = mine.incoming.filter((u) => u !== fromUser);
    theirs.outgoing = theirs.outgoing.filter((u) => u !== myUsername);
    writeRelations(myUsername, mine);
    writeRelations(fromUser, theirs);
    setRelations(mine);
    toast("Request declined", "warn");
  };
  const unfriend = (userB: string) => {
    const mine = readRelations(myUsername);
    const theirs = readRelations(userB);
    mine.friends = mine.friends.filter((u) => u !== userB);
    theirs.friends = theirs.friends.filter((u) => u !== myUsername);
    writeRelations(myUsername, mine);
    writeRelations(userB, theirs);
    setRelations(mine);
    toast("Unfriended", "warn");
  };

  /* -------- UI -------- */
  if (!myUsername) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: THEME.bgGradient, color: "#fff" }}>
        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 24, width: 360 }}>
          <div style={{ color: THEME.accent, fontWeight: 900, fontSize: 22, marginBottom: 8 }}>StarFace</div>
          <div style={{ color: THEME.textSoft, marginBottom: 12, fontStyle: "italic" }}>
            A safe social world for the next generation of young stars
          </div>
          <input
            placeholder="Pick a username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSetUsername()}
            style={{
              width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${THEME.border}`,
              background: THEME.input, color: "#fff", marginBottom: 10,
            }}
          />
          <button onClick={handleSetUsername} style={btn(THEME.accentBtn)}>Get Started</button>
        </div>
      </div>
    );
  }

  const currentDM = dmWith ? (dmStore[dmWith] || []) : [];

  // Message list & search/filter for server channel
  const channelMessages = (currentChannel?.messages || []);
  const searchActive = showSearch && (searchText.trim() || searchAuthor.trim());
  const searched = !searchActive ? channelMessages : channelMessages.filter((m) => {
    const okText = searchText.trim() ? m.content.toLowerCase().includes(searchText.trim().toLowerCase()) : true;
    const okAuthor = searchAuthor.trim() ? m.author.toLowerCase().includes(searchAuthor.trim().toLowerCase()) : true;
    return okText && okAuthor;
  });

  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateColumns: "80px 270px 1fr 300px", background: THEME.bgGradient, color: "#fff" }}>
      {/* Left rail */}
      <div style={{ borderRight: `1px solid ${THEME.border}`, background: "#06122a", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 12 }}>
        {/* Back/Home */}
        <button title="Back to Home" onClick={() => navigate("/")} style={{ ...btn(THEME.accentBtn), width: 56, height: 56, borderRadius: 16, padding: 0 }}>
          ⬅️
        </button>

        {/* Servers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {servers.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSelectedServerId(s.id); setSelectedChannelId(s.channels[0]?.id ?? null); setDmWith(null); }}
              title={`${s.name}${s.joinCode ? ` • ${s.joinCode}` : ""}`}
              style={{
                width: 56, height: 56, borderRadius: 16, border: `1px solid ${THEME.border}`,
                background: selectedServerId === s.id && !dmWith ? THEME.accent : THEME.cardSoft,
                color: selectedServerId === s.id && !dmWith ? "#0a1f44" : "#fff",
                fontSize: 22, cursor: "pointer",
              }}
            >
              {s.icon || "⭐"}
            </button>
          ))}
        </div>

        {/* Create + Join + Friends + Online */}
        <div style={{ marginTop: "auto", display: "grid", gap: 8, marginBottom: 12 }}>
          <button title="Create Server" onClick={() => setShowCreate(true)} style={{ ...btn(THEME.accentBtn), width: 56, height: 56, borderRadius: 16 }}>+</button>
          <button title="Join Server" onClick={() => setShowJoin(true)} style={{ ...btn(THEME.actionBtn, "#0a1f44"), width: 56, height: 56, borderRadius: 16 }}>🔑</button>
          <button title="Friends" onClick={() => setShowFriends(true)} style={{ ...btn(THEME.successBtn), width: 56, height: 56, borderRadius: 16 }}>👥</button>
          <button 
            title="Online Users" 
            onClick={() => setShowOnlineUsers(true)} 
            style={{ ...btn(THEME.actionBtn), width: 56, height: 56, borderRadius: 16, position: 'relative' }}
          >
            🌐
            {Object.keys(onlineUsers).length > 1 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: '#10b981', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 10, fontWeight: 'bold' }}>
                {Object.keys(onlineUsers).length - 1}
              </span>
            )}
          </button>
          <button 
            title="Friend Requests" 
            onClick={() => setShowFriendRequests(true)} 
            style={{ ...btn(THEME.accentBtn), width: 56, height: 56, borderRadius: 16, position: 'relative' }}
          >
            📮
            {friendRequests.filter(r => r.to === myUsername && r.status === 'pending').length > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: '#ff4757', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: 10, fontWeight: 'bold' }}>
                {friendRequests.filter(r => r.to === myUsername && r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Channel Sidebar */}
      <div style={{ borderRight: `1px solid ${THEME.border}`, background: THEME.card, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 900, color: THEME.accent }}>{currentServer?.name ?? "Select Server"}</div>
            <div style={{ marginTop: 2, fontSize: 12, color: THEME.textSoft }}>
              {currentServer?.members.length ?? 0} members{currentServer?.joinCode ? ` • Code: ${currentServer.joinCode}` : ""}
            </div>
          </div>
          {currentServer && (
            <button onClick={() => setShowServerSettings(true)} style={btn(THEME.cardSoft, "#fff")}>⚙️</button>
          )}
        </div>

        {/* Text */}
        <div style={{ padding: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: THEME.textSubtle, marginBottom: 6 }}>Text Channels</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {textChannels.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedChannelId(c.id); setDmWith(null); }}
                style={{
                  textAlign: "left", padding: "8px 10px", borderRadius: 8,
                  background: selectedChannelId === c.id && !dmWith ? THEME.cardSoft : "transparent",
                  color: selectedChannelId === c.id && !dmWith ? "#fff" : THEME.textSoft, border: `1px solid ${THEME.border}`,
                }}
              >
                # {c.name}
                {c.topic ? <div style={{ fontSize: 11, color: THEME.textSubtle }}>— {c.topic}</div> : null}
              </button>
            ))}
            <button onClick={() => createChannel("text")} style={{ ...btn(THEME.actionBtn), width: "100%" }}>
              + Add channel
            </button>
          </div>
        </div>

        {/* Voice */}
        <div style={{ padding: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: THEME.textSubtle, marginBottom: 6 }}>Voice Channels</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {voiceChannels.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedChannelId(c.id); setDmWith(null); }}
                style={{
                  textAlign: "left", padding: "8px 10px", borderRadius: 8,
                  background: selectedChannelId === c.id && !dmWith ? THEME.cardSoft : "transparent",
                  color: selectedChannelId === c.id && !dmWith ? "#fff" : THEME.textSoft, border: `1px solid ${THEME.border}`,
                }}
              >
                🔊 {c.name}
              </button>
            ))}
            <button onClick={() => createChannel("voice")} style={{ ...btn(THEME.actionBtn), width: "100%" }}>
              + Add voice channel
            </button>
          </div>
        </div>

        {/* DMs (friends) */}
        <div style={{ padding: 12, marginTop: "auto", borderTop: `1px solid ${THEME.border}` }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: THEME.textSubtle, marginBottom: 6 }}>Direct Messages</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
            {relations.friends.length === 0 && <div style={{ color: THEME.textSubtle, fontSize: 13 }}>No friends yet.</div>}
            {relations.friends.map((u) => (
              <button
                key={u}
                onClick={() => { setDmWith(u); setSelectedChannelId(null); }}
                style={{
                  textAlign: "left", padding: "8px 10px", borderRadius: 8,
                  background: dmWith === u ? THEME.cardSoft : "transparent",
                  color: dmWith === u ? "#fff" : THEME.textSoft, border: `1px solid ${THEME.border}`,
                }}
              >
                💬 {u}
              </button>
            ))}
          </div>
        </div>

        {/* User panel */}
        <div style={{ background: "#091a3a", padding: 10, borderTop: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: THEME.accent, color: "#0a1f44", display: "grid", placeItems: "center", fontWeight: 900 }}>
              {myUsername[0]?.toUpperCase()}
            </div>
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{myUsername}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11, color: THEME.textSoft }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: statusDot[userStatus] }} />
                {userStatus}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <select
              value={userStatus}
              onChange={(e) => setUserStatus(e.target.value as Member["status"])}
              style={{ background: THEME.cardSoft, color: "#fff", border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "4px 8px" }}
            >
              <option value="online">online</option>
              <option value="away">away</option>
              <option value="busy">busy</option>
              <option value="offline">offline</option>
            </select>
            {currentCall ? (
              <>
                <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"} style={{ ...btn(isMuted ? THEME.dangerBtn : THEME.cardSoft, "#fff") }}>
                  {isMuted ? "🔇" : "🎤"}
                </button>
                <button onClick={endVoiceCall} title="End Call" style={{ ...btn(THEME.dangerBtn, "#fff") }}>📞</button>
                <span style={{ fontSize: 12, color: THEME.textSoft }}>In call ({currentCall.participants.length})</span>
              </>
            ) : isVoiceOn ? (
              <>
                <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"} style={{ ...btn(isMuted ? THEME.dangerBtn : THEME.cardSoft, "#fff") }}>
                  {isMuted ? "🔇" : "🎤"}
                </button>
                <button onClick={stopVoice} title="Disconnect" style={{ ...btn(THEME.dangerBtn, "#fff") }}>📞</button>
              </>
            ) : (
              <button onClick={startVoice} title="Connect Voice" style={{ ...btn(THEME.actionBtn) }}>🎙️</button>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: "flex", minWidth: 0, flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${THEME.border}`, padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>
              {dmWith ? <>DM with {dmWith}</> : <>{currentChannel?.type === "text" && "#"} {currentChannel?.name ?? "—"}</>}
            </div>
            {!dmWith && currentChannel?.type === "text" && (
              <>
                <button onClick={renameChannel} style={btn(THEME.cardSoft, "#fff")}>Rename</button>
                <button onClick={deleteChannel} style={btn(THEME.dangerBtn, "#fff")}>Delete</button>
                <button onClick={() => setShowPins(true)} style={btn(THEME.accentBtn)}>📌 Pins</button>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!dmWith && currentChannel?.type === "text" && (
              <button onClick={() => setShowSearch((v) => !v)} style={btn(THEME.cardSoft, "#fff")}>🔎 Search</button>
            )}
            <button onClick={() => navigate("/")} style={btn(THEME.accentBtn)}>← Home</button>
          </div>
        </div>

        {/* Content */}
        {!dmWith && currentChannel?.type === "text" && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {(searchActive ? searched : channelMessages).map((m) => (
                <div key={m.id} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: THEME.accent, color: "#0a1f44", fontWeight: 900, display: "grid", placeItems: "center" }}>
                    {m.author[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800 }}>{m.author}</span>
                      <span style={{ fontSize: 12, color: THEME.textSoft }}>{ts(m.timestamp)}</span>
                      {m.edited && <span style={{ fontSize: 12, color: THEME.textSoft }}>(edited)</span>}
                      {currentChannel?.pinnedIds?.includes(m.id) && <span style={{ ...tag, borderRadius: 6 }}>📌 pinned</span>}
                    </div>
                    {m.replyToId && (
                      <div style={{ background: "#0f275b", border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "4px 8px", color: THEME.textSoft, fontSize: 12, margin: "4px 0" }}>
                        Replying to {currentChannel.messages?.find((x) => x.id === m.replyToId)?.author}
                      </div>
                    )}
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {/* Mentions highlight */}
                      {m.content.split(/(\s+)/).map((p, i) =>
                        /^@[\w-]+$/i.test(p) ? (
                          <span key={i} style={{ background: "#2a3f7d", padding: "2px 4px", borderRadius: 6 }}>{p}</span>
                        ) : (
                          <span key={i}>{p}</span>
                        )
                      )}
                    </div>

                    {/* Attachments */}
                    {m.attachments && m.attachments.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        {m.attachments.map((a) =>
                          a.mime.startsWith("image/") ? (
                            <img key={a.id} src={a.dataUrl} alt={a.name} style={{ maxWidth: 220, borderRadius: 10, border: `1px solid ${THEME.border}` }} />
                          ) : (
                            <a
                              key={a.id}
                              href={a.dataUrl}
                              download={a.name}
                              style={{ ...tag, textDecoration: "none" }}
                            >
                              ⬇ {a.name}
                            </a>
                          )
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6, color: THEME.textSoft, fontSize: 12 }}>
                      {m.author === myUsername && (
                        <>
                          <button onClick={() => startEdit(m)} style={btn(THEME.cardSoft, "#fff")}>Edit</button>
                          <button onClick={() => removeMessage(m.id)} style={btn(THEME.dangerBtn, "#fff")}>Delete</button>
                        </>
                      )}
                      <button onClick={() => setReplyToId(m.id)} style={btn(THEME.cardSoft, "#fff")}>Reply</button>
                      <button onClick={() => pinToggle(m.id)} style={btn(THEME.accentBtn)}>📌 Pin</button>
                      <div style={{ display: "flex", gap: 4 }}>
                        {EMOJIS.slice(0, 8).map((e) => (
                          <button key={e} onClick={() => addReaction(m.id, e)} style={{ ...btn("#0f275b", "#fff"), padding: "4px 8px" }}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reactions */}
                    {m.reactions && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        {Object.entries(m.reactions).map(([emoji, users]) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(m.id, emoji)}
                            style={{
                              borderRadius: 999, border: `1px solid ${THEME.border}`,
                              background: users.includes(myUsername) ? "#2a3f7d" : "#0f275b",
                              color: "#fff", padding: "4px 10px", fontSize: 12,
                            }}
                          >
                            {emoji} {users.length}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Composer */}
            <div style={{ borderTop: `1px solid ${THEME.border}`, padding: 12 }}>
              {replyToId && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f275b", border: `1px solid ${THEME.border}`, borderRadius: 10, padding: "6px 10px", fontSize: 12, marginBottom: 8 }}>
                  <div>Replying to <b>{currentChannel?.messages?.find((x) => x.id === replyToId)?.author}</b></div>
                  <button onClick={() => setReplyToId(null)} style={{ ...btn(THEME.cardSoft, "#fff"), padding: "4px 8px" }}>✕</button>
                </div>
              )}

              {/* attachments preview */}
              {draftFiles.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {draftFiles.map((a) =>
                    a.mime.startsWith("image/") ? (
                      <div key={a.id} style={{ position: "relative" }}>
                        <img src={a.dataUrl} alt={a.name} style={{ maxWidth: 140, borderRadius: 8, border: `1px solid ${THEME.border}` }} />
                        <button
                          onClick={() => setDraftFiles((p) => p.filter((x) => x.id !== a.id))}
                          style={{ position: "absolute", top: 4, right: 4, ...btn(THEME.dangerBtn, "#fff"), padding: "2px 6px" }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div key={a.id} style={{ ...tag, display: "inline-flex", alignItems: "center", gap: 6 }}>
                        📎 {a.name}
                        <button onClick={() => setDraftFiles((p) => p.filter((x) => x.id !== a.id))} style={{ ...btn(THEME.cardSoft, "#fff"), padding: "2px 6px" }}>
                          ✕
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <textarea
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); notifyTyping(); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    if (e.key === "Escape" && editingId) { setEditingId(null); setDraft(""); setDraftFiles([]); }
                  }}
                  placeholder={
                    editingId
                      ? "Edit your message… (Enter to save, Esc to cancel)"
                      : `Message ${dmWith ? `@${dmWith}` : `#${currentChannel?.name || ""}`} (Enter to send, Shift+Enter for newline)`
                  }
                  style={{
                    flex: 1, minHeight: 56, maxHeight: 180, resize: "vertical",
                    borderRadius: 12, border: `1px solid ${THEME.border}`, background: THEME.input, color: "#fff", padding: 12,
                  }}
                />
                <div style={{ display: "grid", gap: 8 }}>
                  <button onClick={() => fileInputRef.current?.click()} title="Attach" style={{ ...btn(THEME.cardSoft, "#fff") }}>📎</button>
                  <button onClick={() => setShowEmoji((v) => !v)} title="Emoji" style={{ ...btn(THEME.cardSoft, "#fff") }}>😊</button>
                  <button onClick={sendMessage} style={{ ...btn(THEME.accentBtn) }}>{editingId ? "Save" : "Send"}</button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  style={{ display: "none" }}
                />
              </div>
              {visibleTypers.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: THEME.textSoft }}>
                  {visibleTypers.join(", ")} typing…
                </div>
              )}

              {/* emoji tray */}
              {showEmoji && (
                <div style={{ marginTop: 8, padding: 8, background: THEME.cardSoft, border: `1px solid ${THEME.border}`, borderRadius: 12 }}>
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setDraft((v) => v + e)}
                      style={{ fontSize: 20, marginRight: 6, background: "transparent", border: "none", cursor: "pointer", color: "#fff" }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {dmWith && (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {currentDM.map((m) => (
                <div key={m.id} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: THEME.accent, color: "#0a1f44", fontWeight: 900, display: "grid", placeItems: "center" }}>
                    {m.author[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800 }}>{m.author}</span>
                      <span style={{ fontSize: 12, color: THEME.textSoft }}>{ts(m.timestamp)}</span>
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{m.content}</div>
                    {m.attachments?.length ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        {m.attachments.map((a) =>
                          a.mime.startsWith("image/") ? (
                            <img key={a.id} src={a.dataUrl} alt={a.name} style={{ maxWidth: 220, borderRadius: 10, border: `1px solid ${THEME.border}` }} />
                          ) : (
                            <a key={a.id} href={a.dataUrl} download={a.name} style={{ ...tag, textDecoration: "none" }}>⬇ {a.name}</a>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* DM composer reuses same UI */}
            <div style={{ borderTop: `1px solid ${THEME.border}`, padding: 12 }}>
              {/* attachments preview */}
              {draftFiles.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {draftFiles.map((a) =>
                    a.mime.startsWith("image/") ? (
                      <div key={a.id} style={{ position: "relative" }}>
                        <img src={a.dataUrl} alt={a.name} style={{ maxWidth: 140, borderRadius: 8, border: `1px solid ${THEME.border}` }} />
                        <button onClick={() => setDraftFiles((p) => p.filter((x) => x.id !== a.id))} style={{ position: "absolute", top: 4, right: 4, ...btn(THEME.dangerBtn, "#fff"), padding: "2px 6px" }}>✕</button>
                      </div>
                    ) : (
                      <div key={a.id} style={{ ...tag, display: "inline-flex", alignItems: "center", gap: 6 }}>
                        📎 {a.name}
                        <button onClick={() => setDraftFiles((p) => p.filter((x) => x.id !== a.id))} style={{ ...btn(THEME.cardSoft, "#fff"), padding: "2px 6px" }}>✕</button>
                      </div>
                    )
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <textarea
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); notifyTyping(); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDM(); }
                  }}
                  placeholder={`Message @${dmWith} (Enter to send, Shift+Enter for newline)`}
                  style={{ flex: 1, minHeight: 56, maxHeight: 180, resize: "vertical", borderRadius: 12, border: `1px solid ${THEME.border}`, background: THEME.input, color: "#fff", padding: 12 }}
                />
                <div style={{ display: "grid", gap: 8 }}>
                  <button onClick={() => fileInputRef.current?.click()} title="Attach" style={{ ...btn(THEME.cardSoft, "#fff") }}>📎</button>
                  <button onClick={() => setShowEmoji((v) => !v)} title="Emoji" style={{ ...btn(THEME.cardSoft, "#fff") }}>😊</button>
                  <button onClick={sendDM} style={{ ...btn(THEME.accentBtn) }}>Send</button>
                </div>
              </div>
              {showEmoji && (
                <div style={{ marginTop: 8, padding: 8, background: THEME.cardSoft, border: `1px solid ${THEME.border}`, borderRadius: 12 }}>
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setDraft((v) => v + e)} style={{ fontSize: 20, marginRight: 6, background: "transparent", border: "none", cursor: "pointer", color: "#fff" }}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
              <input ref={fileInputRef} type="file" multiple onChange={(e) => handleFiles(e.target.files)} style={{ display: "none" }} />
            </div>
          </>
        )}

        {currentChannel?.type === "voice" && !dmWith && (
          <div style={{ display: "grid", placeItems: "center", padding: 24 }}>
            {currentCall && currentCall.channelId === currentChannel.id ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#7ef7d4", marginBottom: 8 }}>🟢 In Voice Call ({currentCall.participants.length} participants)</div>
                <div style={{ marginBottom: 16 }}>
                  {currentCall.participants.map(p => (
                    <span key={p} style={{ display: "inline-block", margin: "0 4px", padding: "4px 8px", background: THEME.cardSoft, borderRadius: 8, fontSize: 12 }}>
                      {p} {onlineUsers[p]?.inVoiceCall === currentChannel.id ? "🎤" : "🔇"}
                    </span>
                  ))}
                </div>
                <div style={{ width: 280, height: 12, background: "#0f275b", borderRadius: 8, overflow: "hidden", border: `1px solid ${THEME.border}` }}>
                  <div style={{ height: "100%", width: `${Math.min(voiceLevel * 2, 100)}%`, background: "#43b581", transition: "width 100ms linear" }} />
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={toggleMute} style={{ ...btn(isMuted ? THEME.dangerBtn : THEME.actionBtn) }}>
                    {isMuted ? "🔇 Unmute" : "🎤 Mute"}
                  </button>
                  <button onClick={endVoiceCall} style={{ ...btn(THEME.dangerBtn) }}>📞 Leave Call</button>
                </div>
              </div>
            ) : !isVoiceOn ? (
              <div style={{ textAlign: "center" }}>
                <button 
                  onClick={() => startVoiceCall(currentChannel.id, Object.keys(onlineUsers).filter(u => u !== myUsername))} 
                  style={{ ...btn(THEME.actionBtn) }}
                >
                  🎤 Start Voice Call
                </button>
                {voiceCalls.filter(c => c.channelId === currentChannel.id && c.isActive).map(call => (
                  <div key={call.id} style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 14, color: THEME.textSoft, marginBottom: 8 }}>
                      Active call with {call.participants.filter(p => p !== myUsername).join(", ")}
                    </div>
                    <button onClick={() => joinVoiceCall(call.id)} style={{ ...btn(THEME.successBtn) }}>
                      📞 Join Call
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#7ef7d4", marginBottom: 8 }}>🟢 Connected</div>
                <div style={{ width: 280, height: 12, background: "#0f275b", borderRadius: 8, overflow: "hidden", border: `1px solid ${THEME.border}` }}>
                  <div style={{ height: "100%", width: `${Math.min(voiceLevel * 2, 100)}%`, background: "#43b581", transition: "width 100ms linear" }} />
                </div>
              </div>
            )}
          </div>
        )}

        {!currentChannel && !dmWith && (
          <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
            <div style={{ textAlign: "center", color: THEME.textSoft }}>
              <h2 style={{ color: "#fff" }}>Welcome{currentServer ? ` to ${currentServer.name}` : ""}!</h2>
              <p>Select a channel or open a DM.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right column: audit & tips */}
      <div style={{ borderLeft: `1px solid ${THEME.border}`, background: THEME.card, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 12, borderBottom: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: THEME.accent, fontWeight: 900 }}>Activity</div>
          <button onClick={() => { setShowInvite(true); setInviteText(`Join ${currentServer?.name}: ${currentServer?.joinCode}${currentServer?.password ? ` (pwd: ${currentServer?.password})` : ""}`); }} style={btn(THEME.accentBtn)}>🔗 Invite</button>
        </div>
        <div style={{ padding: 12, overflowY: "auto" }}>
          {(currentServer?.audit || []).slice().reverse().slice(0, 40).map((a) => (
            <div key={a.id} style={{ marginBottom: 8, color: THEME.textSoft, fontSize: 13 }}>
              <b style={{ color: "#fff" }}>{a.who}</b> {a.action} <span style={{ opacity: 0.8 }}>• {ts(a.at)}</span>
            </div>
          ))}
          {(!currentServer?.audit || currentServer.audit.length === 0) && (
            <div style={{ color: THEME.textSubtle, fontSize: 13 }}>No activity yet.</div>
          )}
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${THEME.border}`, color: THEME.textSubtle, fontSize: 13 }}>
          Tip: Use <span style={{ ...tag }}>@name</span> to mention someone. Click <span style={{ ...tag }}>📌 Pins</span> to see pinned posts.
        </div>
      </div>

      {/* ------- Create Server Modal ------- */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <h3 style={{ color: THEME.accent, marginBottom: 8 }}>Create Server</h3>
          <input
            placeholder="Server name"
            value={newServerName}
            onChange={(e) => setNewServerName(e.target.value)}
            style={inputStyle()}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              placeholder="Password (optional)"
              value={newServerPassword}
              onChange={(e) => setNewServerPassword(e.target.value)}
              style={inputStyle()}
            />
            <input
              placeholder="Join Code"
              value={newServerCode}
              onChange={(e) => setNewServerCode(e.target.value.toUpperCase())}
              style={{ ...inputStyle(), width: 160 }}
            />
            <button onClick={() => setNewServerCode(genJoinCode())} style={btn(THEME.actionBtn)}>Random</button>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={() => setShowCreate(false)} style={btn(THEME.cardSoft, "#fff")}>Cancel</button>
            <button onClick={createServer} style={btn(THEME.accentBtn)}>Create</button>
          </div>
        </Modal>
      )}

      {/* ------- Join Server Modal ------- */}
      {showJoin && (
        <Modal onClose={() => setShowJoin(false)}>
          <h3 style={{ color: THEME.accent, marginBottom: 8 }}>Join Server</h3>
          <input
            placeholder="Join Code (e.g. SF-AB12CD)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            style={inputStyle()}
          />
          <input
            type="password"
            placeholder="Password (if required)"
            value={joinPassword}
            onChange={(e) => setJoinPassword(e.target.value)}
            style={{ ...inputStyle(), marginTop: 8 }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={() => setShowJoin(false)} style={btn(THEME.cardSoft, "#fff")}>Cancel</button>
            <button onClick={joinServer} style={btn(THEME.actionBtn)}>Join</button>
          </div>
        </Modal>
      )}

      {/* ------- Pins ------- */}
      {showPins && currentChannel && (
        <Modal onClose={() => setShowPins(false)}>
          <h3 style={{ color: THEME.accent, marginBottom: 8 }}>Pinned in #{currentChannel.name}</h3>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {(currentChannel.pinnedIds || [])
              .map((id) => currentChannel.messages?.find((m) => m.id === id))
              .filter(Boolean)
              .map((m) => (
                <div key={(m as Message).id} style={{ border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 800 }}>{m!.author} <span style={{ color: THEME.textSoft, fontWeight: 400 }}>• {ts(m!.timestamp)}</span></div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{m!.content}</div>
                </div>
              ))}
            {(!currentChannel.pinnedIds || currentChannel.pinnedIds.length === 0) && (
              <div style={{ color: THEME.textSubtle }}>No pins yet.</div>
            )}
          </div>
        </Modal>
      )}

      {/* ------- Search ------- */}
      {showSearch && currentChannel && (
        <Modal onClose={() => setShowSearch(false)}>
          <h3 style={{ color: THEME.accent, marginBottom: 8 }}>Search in #{currentChannel.name}</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Text…" value={searchText} onChange={(e) => setSearchText(e.target.value)} style={inputStyle()} />
            <input placeholder="Author…" value={searchAuthor} onChange={(e) => setSearchAuthor(e.target.value)} style={inputStyle()} />
          </div>
          <div style={{ color: THEME.textSubtle, fontSize: 12, marginTop: 6 }}>Close to exit search.</div>
        </Modal>
      )}

      {/* ------- Server Settings ------- */}
      {showServerSettings && currentServer && (
        <Modal onClose={() => setShowServerSettings(false)}>
          <h3 style={{ color: THEME.accent, marginBottom: 8 }}>Server Settings</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 13, color: THEME.textSoft }}>Name</label>
            <input value={currentServer.name} onChange={(e) => updateServerSettings({ name: e.target.value })} style={inputStyle()} />
            <label style={{ fontSize: 13, color: THEME.textSoft }}>Icon (emoji)</label>
            <input value={currentServer.icon} onChange={(e) => updateServerSettings({ icon: e.target.value })} style={inputStyle()} />
            <label style={{ fontSize: 13, color: THEME.textSoft }}>Join Code</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={currentServer.joinCode} readOnly style={{ ...inputStyle(), flex: 1 }} />
              <button onClick={() => { copy(currentServer.joinCode || ""); toast("Code copied"); }} style={btn(THEME.cardSoft, "#fff")}>Copy</button>
              <button onClick={rotateJoinCode} style={btn(THEME.actionBtn)}>Rotate</button>
            </div>
            <label style={{ fontSize: 13, color: THEME.textSoft }}>Password (optional)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={currentServer.password || ""}
                onChange={(e) => updateServerSettings({ password: e.target.value })}
                style={{ ...inputStyle(), flex: 1 }}
              />
              <button onClick={() => updateServerSettings({ password: "" })} style={btn(THEME.cardSoft, "#fff")}>Clear</button>
            </div>

            <div style={{ marginTop: 8, fontWeight: 800, color: "#fff" }}>Members</div>
            <div style={{ maxHeight: 200, overflowY: "auto", border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 8 }}>
              {currentServer.members.map((m) => (
                <div key={m.username} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: THEME.accent, color: "#0a1f44", display: "grid", placeItems: "center", fontWeight: 900 }}>
                      {m.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.username}</div>
                      <div style={{ fontSize: 11, color: THEME.textSubtle }}>{m.role}</div>
                    </div>
                  </div>
                  {m.username !== currentServer.owner && (
                    <button onClick={() => kickMember(m.username)} style={btn(THEME.dangerBtn, "#fff")}>Kick</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <button onClick={() => setShowServerSettings(false)} style={btn(THEME.cardSoft, "#fff")}>Close</button>
              <button onClick={deleteServer} style={btn(THEME.dangerBtn, "#fff")}>Delete Server</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ------- Invite Modal ------- */}
      {showInvite && (
        <Modal onClose={() => setShowInvite(false)}>
          <h3 style={{ color: THEME.accent, marginBottom: 8 }}>Invite</h3>
          <textarea value={inviteText} readOnly style={{ ...inputStyle(), minHeight: 100 }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => { copy(inviteText); toast("Invite copied"); }} style={btn(THEME.cardSoft, "#fff")}>Copy</button>
            <button onClick={() => setShowInvite(false)} style={btn(THEME.accentBtn)}>Done</button>
          </div>
        </Modal>
      )}

      {/* ------- Online Users Drawer ------- */}
      {showOnlineUsers && (
        <div style={{ position: "fixed", top: 0, right: 0, height: "100%", width: 380, background: THEME.card, borderLeft: `1px solid ${THEME.border}`, zIndex: 60, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: THEME.accent, fontWeight: 900 }}>Online Users ({Object.keys(onlineUsers).length})</div>
            <button onClick={() => setShowOnlineUsers(false)} style={btn(THEME.cardSoft, "#fff")}>✕</button>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {Object.values(onlineUsers).map((user) => (
              <div key={user.username} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "8px 12px", background: THEME.cardSoft, borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: THEME.accent, color: "#0a1f44", display: "grid", placeItems: "center", fontWeight: 900 }}>
                    {user.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{user.username}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: THEME.textSubtle }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: statusDot[user.status] }} />
                      {user.status}
                      {user.isTyping && <span style={{ color: THEME.accent }}>✏️ typing</span>}
                      {user.inVoiceCall && <span style={{ color: "#10b981" }}>🎤 in call</span>}
                    </div>
                  </div>
                </div>
                {user.username !== myUsername && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setDmWith(user.username)} style={btn(THEME.actionBtn)}>💬</button>
                    <button onClick={() => sendRequest(user.username)} style={btn(THEME.successBtn)}>➕</button>
                  </div>
                )}
              </div>
            ))}
            {Object.keys(onlineUsers).length === 0 && (
              <div style={{ textAlign: "center", color: THEME.textSubtle, marginTop: 40 }}>No users online</div>
            )}
          </div>
        </div>
      )}

      {/* ------- Friend Requests Drawer ------- */}
      {showFriendRequests && (
        <div style={{ position: "fixed", top: 0, right: 0, height: "100%", width: 380, background: THEME.card, borderLeft: `1px solid ${THEME.border}`, zIndex: 60, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: THEME.accent, fontWeight: 900 }}>Friend Requests</div>
            <button onClick={() => setShowFriendRequests(false)} style={btn(THEME.cardSoft, "#fff")}>✕</button>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            <Section title="Incoming Requests">
              {friendRequests.filter(r => r.to === myUsername && r.status === 'pending').length === 0 ? (
                <Empty>No incoming requests</Empty>
              ) : (
                friendRequests.filter(r => r.to === myUsername && r.status === 'pending').map((request) => (
                  <div key={request.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "8px 12px", background: THEME.cardSoft, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{request.from}</div>
                      <div style={{ fontSize: 11, color: THEME.textSubtle }}>{ts(request.timestamp)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleFriendRequest(request.id, 'accept')} style={btn(THEME.successBtn)}>✓</button>
                      <button onClick={() => handleFriendRequest(request.id, 'decline')} style={btn(THEME.dangerBtn, "#fff")}>✕</button>
                    </div>
                  </div>
                ))
              )}
            </Section>
            
            <Section title="Sent Requests">
              {friendRequests.filter(r => r.from === myUsername && r.status === 'pending').length === 0 ? (
                <Empty>No sent requests</Empty>
              ) : (
                friendRequests.filter(r => r.from === myUsername && r.status === 'pending').map((request) => (
                  <div key={request.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "8px 12px", background: THEME.cardSoft, borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{request.to}</div>
                      <div style={{ fontSize: 11, color: THEME.textSubtle }}>Sent {ts(request.timestamp)}</div>
                    </div>
                    <span style={{ fontSize: 11, color: THEME.textSubtle }}>Pending...</span>
                  </div>
                ))
              )}
            </Section>
          </div>
        </div>
      )}

      {/* ------- Friends Drawer ------- */}
      {showFriends && (
        <div style={{ position: "fixed", top: 0, right: 0, height: "100%", width: 380, background: THEME.card, borderLeft: `1px solid ${THEME.border}`, zIndex: 60, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${THEME.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: THEME.accent, fontWeight: 900 }}>Friends</div>
            <button onClick={() => setShowFriends(false)} style={btn(THEME.cardSoft, "#fff")}>✕</button>
          </div>

          <div style={{ padding: 12, borderBottom: `1px solid ${THEME.border}` }}>
            <input placeholder="Find users by username…" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} style={inputStyle()} />
          </div>

          <Section title="Incoming">
            {relations.incoming.length === 0 ? (
              <Empty>Nothing here.</Empty>
            ) : (
              relations.incoming.map((u) => (
                <Row key={u}>
                  <span>{u}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => acceptRequest(u)} style={btn(THEME.actionBtn)}>Accept</button>
                    <button onClick={() => declineRequest(u)} style={btn(THEME.dangerBtn, "#fff")}>Decline</button>
                  </div>
                </Row>
              ))
            )}
          </Section>

          <Section title="Outgoing">
            {relations.outgoing.length === 0 ? (
              <Empty>Nothing here.</Empty>
            ) : (
              relations.outgoing.map((u) => (
                <Row key={u}>
                  <span>{u}</span>
                  <button onClick={() => cancelRequest(u)} style={btn(THEME.accentBtn)}>Cancel</button>
                </Row>
              ))
            )}
          </Section>

          <Section title="Friends" grow>
            {relations.friends.length === 0 ? (
              <Empty>No friends yet.</Empty>
            ) : (
              relations.friends.map((u) => (
                <Row key={u}>
                  <span>{u}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setDmWith(u)} style={btn(THEME.actionBtn)}>DM</button>
                    <button onClick={() => unfriend(u)} style={btn(THEME.accentBtn)}>Unfriend</button>
                  </div>
                </Row>
              ))
            )}
          </Section>

          <Section title="Discover">
            {filteredUsers.length === 0 ? (
              <Empty>No users found.</Empty>
            ) : (
              filteredUsers.map((u) => {
                const mine = readRelations(myUsername);
                const isFriend = mine.friends.includes(u.username);
                const isOutgoing = mine.outgoing.includes(u.username);
                const isIncoming = mine.incoming.includes(u.username);
                return (
                  <Row key={u.username}>
                    <span>{u.username}</span>
                    {isFriend ? (
                      <button onClick={() => unfriend(u.username)} style={btn(THEME.accentBtn)}>Unfriend</button>
                    ) : isOutgoing ? (
                      <button onClick={() => cancelRequest(u.username)} style={btn(THEME.accentBtn)}>Cancel</button>
                    ) : isIncoming ? (
                      <button onClick={() => acceptRequest(u.username)} style={btn(THEME.actionBtn)}>Accept</button>
                    ) : (
                      <button onClick={() => sendRequest(u.username)} style={btn(THEME.actionBtn)}>Add Friend</button>
                    )}
                  </Row>
                );
              })
            )}
          </Section>
        </div>
      )}

      {/* ------- Toasts ------- */}
      <div style={{ position: "fixed", bottom: 16, left: 16, display: "grid", gap: 8, zIndex: 80 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background:
                t.kind === "ok" ? THEME.successBtn : t.kind === "warn" ? THEME.accentBtn : THEME.dangerBtn,
              color: "#0a1f44",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 800,
              boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============================
   Small UI components
============================= */
function Modal(props: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "grid", placeItems: "center", zIndex: 70 }}>
      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 14, padding: 18, width: 520, maxWidth: "90vw" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={props.onClose} style={btn(THEME.cardSoft, "#fff")}>✕</button>
        </div>
        <div>{props.children}</div>
      </div>
    </div>
  );
}
function Section(props: { title: string; children: React.ReactNode; grow?: boolean }) {
  return (
    <div style={{ padding: 12, borderBottom: `1px solid ${THEME.border}`, flex: props.grow ? 1 : undefined, overflowY: props.grow ? "auto" : undefined }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{props.title}</div>
      {props.children}
    </div>
  );
}
function Row(props: { children: React.ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>{props.children}</div>;
}
function Empty(props: { children: React.ReactNode }) {
  return <div style={{ color: THEME.textSubtle, fontSize: 13 }}>{props.children}</div>;
}
const inputStyle = (): React.CSSProperties => ({
  width: "100%",
  background: THEME.input,
  color: "#fff",
  border: `1px solid ${THEME.border}`,
  borderRadius: 10,
  padding: 10,
});
