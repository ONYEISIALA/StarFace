import React from "react";
import { useNavigate } from "react-router-dom";
import "./MainMenu.css";

// Optional: fun rotating "splash" text like Minecraft
const SPLASHES = [
  "So blocky!","100% JavaScript!","Punch trees!",
  "Brand new chunks!","Now with stars ✨","Eat your apples!",
  "Creeper? ...nope.","Procedurally wow!"
];

const MainMenu: React.FC = () => {
  const nav = useNavigate();
  const [splash] = React.useState(
    SPLASHES[Math.floor(Math.random() * SPLASHES.length)]
  );

  return (
    <div className="mc-root">
      {/* background panorama */}
      <div className="mc-panorama" />

      {/* title + splash */}
      <header className="mc-header">
        <h1 className="mc-title">StarCraft 3D</h1>
        <div className="mc-splash">{splash}</div>
      </header>

      {/* main buttons */}
      <main className="mc-menu">
        <button className="mc-btn" onClick={() => nav("/worlds")}>
          Singleplayer
        </button>
        <button className="mc-btn" onClick={() => nav("/starplay")}>
          Multiplayer
        </button>
        <button className="mc-btn" onClick={() => nav("/servers")}>
          Join Server
        </button>
        <button className="mc-btn" onClick={() => alert("Coming soon!")}>
          Realms (Coming Soon)
        </button>

        <div className="mc-row">
          <button className="mc-btn small" onClick={() => nav("/settings")}>
            Options…
          </button>
          <button className="mc-btn small danger" onClick={() => window.close()}>
            Quit Game
          </button>
        </div>
      </main>

      {/* bottom left badge (like MC language/patch area) */}
      <footer className="mc-footer">
        <button className="mc-badge" onClick={() => nav("/profile")}>
          ⭐ StarFace
        </button>
        <span className="mc-version">v0.1 (Preview)</span>
      </footer>
    </div>
  );
};

export default MainMenu;
