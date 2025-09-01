// StarFace-1/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Home from "./Home";
import Profile from "./Profile";
import Login from "./Login";
import Register from "./Register";
import Chat from "./Chat";
import AvatarCreator from "./AvatarCreator";
import StarPlay from "./StarPlay";
import LearningLounge from "./LearningLounge";
import ParentControl from "./ParentControl";
import Social from "./Social";
import ServersMenu from "./ServersMenu";
import WorldsMenu from "./WorldsMenu";
import StarCraft3D from "./StarCraft3D";
import Quiz from "./Quiz";
import WordUnscramble from "./WordUnscramble";
import LogicPuzzle from "./LogicPuzzle";
import SpotTheDifference from "./SpotTheDifference";
import CreateContent from "./CreateContent";
import Leaderboard from "./Leaderboard";
import MainMenu from "./MainMenu";
import GameSettings from "./GameSettings"; // Assuming GameSettings component exists

/* ——— Helpers ——— */

const ScrollToTop: React.FC = () => {
  React.useEffect(() => {
    const unlisten = () => window.scrollTo(0, 0);
    // run once on mount
    unlisten();
    return () => {};
  }, []);
  return null;
};

/** Wrap ServersMenu so it can navigate back via router */
const ServersPage: React.FC = () => {
  const nav = useNavigate();
  return <ServersMenu onBack={() => nav("/")} />;
};

/** Wrap WorldsMenu so Play goes to StarCraft3D */
const WorldsPage: React.FC = () => {
  const nav = useNavigate();
  return (
    <WorldsMenu
      onBack={() => nav("/")}
      onPlayGame={() => nav("/starcraft3d")}
    />
  );
};

/** Wrap GameSettings for routing */
const GameSettingsPage: React.FC = () => {
  const nav = useNavigate();
  return <GameSettings onBack={() => nav("/")} />;
};

/** Wrap MainMenu so its buttons navigate to routes (no local screen state) */
const MainMenuPage: React.FC = () => {
  const nav = useNavigate();
  return (
    <MainMenu
      onPlayGame={() => nav("/starplay")} // Navigates to StarPlay which contains Multiplayer
      onSettings={() => nav("/settings")} // Navigate to the new settings route
      onFriends={() => nav("/social")}
      onServers={() => nav("/servers")}
      onWorlds={() => nav("/worlds")}
      onQuit={() => console.log("Quit pressed")}
      onJoinServer={() => nav("/servers")} // Assuming Join Server also leads to ServersMenu for now
    />
  );
};

/* ——— App ——— */

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Landing */}
        <Route path="/" element={<Home />} />
        {/* If you prefer MainMenu as the landing page, swap the two lines above/below */}
        {/* <Route path="/" element={<MainMenuPage />} /> */}

        {/* StarPlay page shows Multiplayer & Game grid (both sections) */}
        {/* Updated to navigate to StarPlay for Multiplayer */}
        <Route path="/starplay" element={<StarPlay />} />

        {/* Menus */}
        <Route path="/main" element={<MainMenuPage />} />
        <Route path="/servers" element={<ServersPage />} />
        <Route path="/worlds" element={<WorldsPage />} />
        <Route path="/settings" element={<GameSettingsPage />} /> {/* Added settings route */}

        {/* StarCraft 3D experience */}
        <Route path="/starcraft3d" element={<StarCraft3D />} />

        {/* Other app pages */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/avatar" element={<AvatarCreator />} />
        <Route path="/lounge" element={<LearningLounge />} />
        <Route path="/parent" element={<ParentControl />} />
        <Route path="/social" element={<Social />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/wordscramble" element={<WordUnscramble />} />
        <Route path="/logicpuzzle" element={<LogicPuzzle />} />
        <Route path="/spotthedifference" element={<SpotTheDifference />} />
        <Route path="/create" element={<CreateContent />} />
        <Route path="/leaderboard" element={<Leaderboard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;