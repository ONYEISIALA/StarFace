import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WaitingRoom from './WaitingRoom';
import MultiplayerTicTacToe from './MultiplayerTicTacToe';
import MultiplayerMemoryFight from './MultiplayerMemoryFight';
import MultiplayerBottleFlip from './MultiplayerBottleFlip';
import StarCraft3D from './StarCraft3D';
import ColorSpread from './ColorSpread';
import ColorWars from './ColorWars';
import SpeedClick from './SpeedClick';
import NumberTap from './NumberTap';
import QuickMathDuel from './QuickMathDuel';
import ConnectFour from './ConnectFour';
import SocialDeduction from './SocialDeduction';
import RaceCars from './RaceCars';
import RedLightGreenLight from './RedLightGreenLight';
import BattleRoyale from './BattleRoyale';
import DodgeballArena from './DodgeballArena';
import ZombieSurvival from './ZombieSurvival';
import KingOfTheHill from './KingOfTheHill';
import FreezeTag from './FreezeTag';
import BombPass from './BombPass';
import ObstacleCourse from './ObstacleCourse';
// Import new games
import FloorIsLava from './FloorIsLava';
import WhackAMole from './WhackAMole';
import StackTower from './StackTower';
import PaintTheMap from './PaintTheMap';
// Import new games from changes
import ChickenRun from './ChickenRun';
import SpyHunt from './SpyHunt';
import SnowballFight from './SnowballFight';
import TrapRoom from './TrapRoom';
import RocketDodge from './RocketDodge';
import ColorSwitch from './ColorSwitch';

const StarPlay: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');
  const [player, setPlayer] = useState<'X' | 'O' | null>(null);
  const [gameSelected, setGameSelected] = useState<
    'tictactoe' | 'memoryfight' | 'bottleflip' | 'starcraft2d' | 'colorspread' | 'colorwars' | 'speedclick' | 'numbertap' | 'quickmath' | 'connectfour' | 'socialdeduction' | 'racecars' | 'redlightgreenlight' | 'battleroyale' | 'dodgeballarena' | 'zombiesurvival' | 'kingofthehill' | 'freezetag' | 'bombpass' | 'obstaclecourse' | 'floorislava' | 'whackamole' | 'stacktower' | 'paintthemap' | 'chickenrun' | 'spyhunt' | 'snowballfight' | 'traproom' | 'rocketdodge' | 'colorswitch' | null
  >(null);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    setRoomCode(code);
    setPlayer('X');
    setJoinedRoom(true);
  };

  const joinRoom = () => {
    if (roomCode.trim().length === 5) {
      setPlayer('O');
      setJoinedRoom(true);
    }
  };

  const handleGameSelect = (
    game: 'tictactoe' | 'memoryfight' | 'bottleflip' | 'starcraft2d' | 'colorspread' | 'colorwars' | 'speedclick' | 'numbertap' | 'quickmath' | 'connectfour' | 'socialdeduction' | 'racecars' | 'redlightgreenlight' | 'battleroyale' | 'dodgeballarena' | 'zombiesurvival' | 'kingofthehill' | 'freezetag' | 'bombpass' | 'obstaclecourse' | 'floorislava' | 'whackamole' | 'stacktower' | 'paintthemap' | 'chickenrun' | 'spyhunt' | 'snowballfight' | 'traproom' | 'rocketdodge' | 'colorswitch'
  ) => {
    setGameSelected(game);
    setInWaitingRoom(false);
    setGameStarted(true);
  };

  const resetGame = () => {
    setRoomCode('');
    setPlayer(null);
    setGameSelected(null);
    setJoinedRoom(false);
    setInWaitingRoom(false);
    setGameStarted(false);
  };

  const quitGame = () => {
    setGameSelected(null);
    setInWaitingRoom(false);
    setGameStarted(false);
  };

  const navigate = useNavigate();

  const startGame = () => {
    // Navigate to StarCraft main menu when two players connect
    navigate('/main');
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }

          .floating-elements {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
          }

          .floating-element {
            position: absolute;
            animation: float 6s ease-in-out infinite;
            opacity: 0.1;
            font-size: 2rem;
          }

          .game-grid:hover button {
            transform: translateY(-5px);
          }

          button:hover {
            box-shadow: 0 12px 40px rgba(255, 255, 255, 0.2) !important;
            transform: translateY(-8px) !important;
          }
        `}
      </style>

      {/* Floating Background Elements */}
      <div className="floating-elements">
        <div className="floating-element" style={{top: '10%', left: '10%', animationDelay: '0s'}}>🎮</div>
        <div className="floating-element" style={{top: '20%', right: '15%', animationDelay: '1s'}}>⭐</div>
        <div className="floating-element" style={{top: '60%', left: '5%', animationDelay: '2s'}}>🌟</div>
        <div className="floating-element" style={{bottom: '20%', right: '10%', animationDelay: '3s'}}>🎯</div>
        <div className="floating-element" style={{bottom: '10%', left: '20%', animationDelay: '4s'}}>🏆</div>
      </div>

      <div style={{position: 'relative', zIndex: 10}}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          marginBottom: '2rem'
        }}>🌟 StarPlay Multiplayer</h1>

      {player && (
        <>
          <p>Room Code: <strong>{roomCode}</strong></p>
          <p>You are Player: <strong>{player}</strong></p>
        </>
      )}

      {!player ? (
        <div>
          <button onClick={createRoom} style={buttonStyle}>🎮 Create Game Room</button>
          <p>OR</p>
          <input
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={5}
            style={inputStyle}
          />
          <button onClick={joinRoom} style={buttonStyle}>🔑 Join Room</button>
        </div>
      ) : !gameSelected ? (
        <div>
          <h2>Select a Game:</h2>
          <div style={{...gameGridStyle, position: 'relative', zIndex: 10}} className="game-grid">
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('tictactoe')}>
              ✖️ Tic Tac Toe
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('memoryfight')}>
              🧠 Memory Fight
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('bottleflip')}>
              🍾 Bottle Flip
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('colorwars')}>
              🎨 Color Wars
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('speedclick')}>
              ⚡ Speed Click
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('numbertap')}>
              🔢 Number Tap
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('quickmath')}>
              🧮 Quick Math
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('connectfour')}>
              🔴 Connect Four
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={offlineGameButtonStyle} onClick={() => navigate('/main')}>
              🎮 StarCraft3D
              <span style={offlineBadgeStyle}>💻 OFFLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('colorspread')}>
              🎨 Color Spread
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('socialdeduction')}>
              🕵️ Social Deduction
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('racecars')}>
              🏎️ Race Cars
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('redlightgreenlight')}>
              🚦 Red Light Green Light
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('battleroyale')}>
              ⚔️ Battle Royale
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('dodgeballarena')}>
              🥎 Dodgeball Arena
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('zombiesurvival')}>
              🧟 Zombie Survival
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('kingofthehill')}>
              👑 King of the Hill
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('freezetag')}>
              ❄️ Freeze Tag
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('bombpass')}>
              💣 Bomb Pass
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('obstaclecourse')}>
              🏃 Obstacle Course
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            {/* Add new games here */}
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('floorislava')}>
              🌋 Floor Is Lava
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('whackamole')}>
               🇲 🇲 Whack-a-Mole Online
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('stacktower')}>
              🏗️ Stack Tower
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('paintthemap')}>
              🗺️ Paint the Map
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            {/* New games added */}
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('chickenrun')}>
              🐔 Chicken Run
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('spyhunt')}>
              🕵️ Spy Hunt
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('snowballfight')}>
              ☃️ Snowball Fight
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('traproom')}>
              🪤 Trap Room
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('rocketdodge')}>
              🚀 Rocket Dodge
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
            <button style={onlineGameButtonStyle} onClick={() => handleGameSelect('colorswitch')}>
              🎨 Color Switch
              <span style={onlineBadgeStyle}>🌐 ONLINE</span>
            </button>
          </div>
        </div>
      ) : gameSelected ? (
        <>
          <button onClick={() => setShowInstructions(prev => !prev)} style={infoButtonStyle}>
            {showInstructions ? 'Hide' : 'Show'} Instructions
          </button>
          <div style={instructionBox}>
              <h3>📘 Game Instructions</h3>
              {gameSelected === 'tictactoe' && <p>🌐 <strong>ONLINE:</strong> Take turns placing X and O. First to align 3 wins! Play with real players worldwide!</p>}
              {gameSelected === 'memoryfight' && <p>🌐 <strong>ONLINE:</strong> Flip matching cards before your opponent does. Real-time multiplayer memory battle!</p>}
              {gameSelected === 'bottleflip' && <p>🌐 <strong>ONLINE:</strong> Click flip! Land as many as possible. Challenge real opponents online!</p>}
              {gameSelected === 'colorwars' && <p>🌐 <strong>ONLINE:</strong> Paint as much territory as possible in 2 minutes! Most coverage wins against real players!</p>}
              {gameSelected === 'speedclick' && <p>🌐 <strong>ONLINE:</strong> Click the shapes as fast as possible! First to 10 wins in real-time multiplayer!</p>}
              {gameSelected === 'numbertap' && <p>🌐 <strong>ONLINE:</strong> Tap numbers 1-25 in order as fast as possible! Race against real opponents!</p>}
              {gameSelected === 'quickmath' && <p>🌐 <strong>ONLINE:</strong> Solve math problems quickly! First to 10 correct answers wins against real players!</p>}
              {gameSelected === 'connectfour' && <p>🌐 <strong>ONLINE:</strong> Connect 4 pieces in a row (horizontal, vertical, or diagonal) to win! Real-time online gameplay!</p>}
              {gameSelected === 'starcraft2d' && <p>💻 <strong>OFFLINE:</strong> Use WASD to move around the 3D world. Click blocks to mine them, right-click to place blocks. Use E for inventory, 1-9 to select items. Build and explore in creative mode!</p>}
              {gameSelected === 'colorspread' && <p>🌐 <strong>ONLINE:</strong> Paint the board with your color. Real-time multiplayer color spreading battle!</p>}
              {gameSelected === 'socialdeduction' && <p>🌐 <strong>ONLINE:</strong> Work together as crewmates to complete tasks, or sabotage as an impostor! Vote out suspicious players in this Among Us style game!</p>}
              {gameSelected === 'racecars' && <p>🌐 <strong>ONLINE:</strong> Race against other players! Use WASD to control your car, collect power-ups, and complete 3 laps to win!</p>}
              {gameSelected === 'redlightgreenlight' && <p>🌐 <strong>ONLINE:</strong> Move on green light, freeze on red light! Reach the finish line without being caught moving during red light!</p>}
              {gameSelected === 'battleroyale' && <p>🌐 <strong>ONLINE:</strong> Last player standing wins! Stay in the safe zone, collect weapons and power-ups, and eliminate other players!</p>}
              {gameSelected === 'dodgeballarena' && <p>🌐 <strong>ONLINE:</strong> Throw balls at opponents while dodging theirs! Use power-ups like shields and triple throws to survive!</p>}
              {gameSelected === 'zombiesurvival' && <p>🌐 <strong>ONLINE:</strong> Survive as humans or infect everyone as zombies! Zombies get faster over time!</p>}
              {gameSelected === 'kingofthehill' && <p>🌐 <strong>ONLINE:</strong> Control the hill for the longest time! Push opponents off to claim victory!</p>}
              {gameSelected === 'freezetag' && <p>🌐 <strong>ONLINE:</strong> Tag players to freeze them or unfreeze teammates! Taggers win by freezing everyone!</p>}
              {gameSelected === 'bombpass' && <p>🌐 <strong>ONLINE:</strong> Pass the bomb before it explodes! Last player alive wins in this hot potato style game!</p>}
              {gameSelected === 'obstaclecourse' && <p>🌐 <strong>ONLINE:</strong> Navigate through moving obstacles and reach the finish line! Race against real players!</p>}
              {/* Add new game instructions here */}
              {gameSelected === 'floorislava' && <p>🌐 <strong>ONLINE:</strong> Jump between platforms as lava rises! Last survivor wins! Platforms sink when stepped on!</p>}
              {gameSelected === 'whackamole' && <p>🌐 <strong>ONLINE:</strong> Click moles as they pop up! Golden moles give bonus points, avoid bombs! Most points wins!</p>}
              {gameSelected === 'stacktower' && <p>🌐 <strong>ONLINE:</strong> Stack moving blocks to build the tallest tower! Time your drops perfectly or watch your tower crumble!</p>}
              {gameSelected === 'paintthemap' && <p>🌐 <strong>ONLINE:</strong> Move around to paint tiles with your color! Power-ups give special abilities. Most territory wins!</p>}
              {/* New game instructions */}
              {gameSelected === 'chickenrun' && <p>🌐 <strong>ONLINE:</strong> Cross busy roads, dodge traffic, hop on logs! First chicken to reach the finish line wins! Why did the chicken cross the road? To win the race!</p>}
              {gameSelected === 'spyhunt' && <p>🌐 <strong>ONLINE:</strong> Social deduction at its finest! Complete tasks as crewmate or sabotage as spy. Vote out suspicious players before they eliminate everyone!</p>}
              {gameSelected === 'snowballfight' && <p>🌐 <strong>ONLINE:</strong> Epic winter warfare! Charge snowballs for power, build forts for protection, collect power-ups! Last snowman standing wins!</p>}
              {gameSelected === 'traproom' && <p>🌐 <strong>ONLINE:</strong> Navigate deadly traps! Spikes, arrows, saws, and falling floors await. Find the key to unlock the exit or survive the longest!</p>}
              {gameSelected === 'rocketdodge' && <p>🌐 <strong>ONLINE:</strong> Missile mayhem! Dodge incoming rockets and explosions. Collect shields to survive longer. Last survivor wins!</p>}
              {gameSelected === 'colorswitch' && <p>🌐 <strong>ONLINE:</strong> Stay on the safe colored tiles! Wrong color tiles fall away. React quickly when colors change!</p>}
            </div>

          {gameSelected === 'tictactoe' && (
            <MultiplayerTicTacToe roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'memoryfight' && (
            <MultiplayerMemoryFight roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'bottleflip' && (
            <MultiplayerBottleFlip roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'colorwars' && (
            <ColorWars roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'speedclick' && (
            <SpeedClick roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'numbertap' && (
            <NumberTap roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'quickmath' && (
            <QuickMathDuel roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'connectfour' && (
            <ConnectFour roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'starcraft2d' && (
            <StarCraft3D />
          )}
          {gameSelected === 'colorspread' && (
            <ColorSpread roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'socialdeduction' && (
            <SocialDeduction roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'racecars' && (
            <RaceCars roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'redlightgreenlight' && (
            <RedLightGreenLight roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'battleroyale' && (
            <BattleRoyale roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'dodgeballarena' && (
            <DodgeballArena roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'zombiesurvival' && (
            <ZombieSurvival roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'kingofthehill' && (
            <KingOfTheHill roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'freezetag' && (
            <FreezeTag roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'bombpass' && (
            <BombPass roomCode={roomCode} player={player} />
          )}
          {gameSelected === 'obstaclecourse' && (
            <ObstacleCourse roomCode={roomCode} player={player} />
          )}
          {/* Add rendering for new games */}
          {gameSelected === 'floorislava' && <FloorIsLava roomCode={roomCode} player={player} />}
          {gameSelected === 'whackamole' && <WhackAMole roomCode={roomCode} player={player} />}
          {gameSelected === 'stacktower' && <StackTower roomCode={roomCode} player={player} />}
          {gameSelected === 'paintthemap' && <PaintTheMap roomCode={roomCode} player={player} />}
          {/* Rendering for new games */}
          {gameSelected === 'chickenrun' && <ChickenRun roomCode={roomCode} player={player} />}
          {gameSelected === 'spyhunt' && <SpyHunt roomCode={roomCode} player={player} />}
          {gameSelected === 'snowballfight' && <SnowballFight roomCode={roomCode} player={player} />}
          {gameSelected === 'traproom' && <TrapRoom roomCode={roomCode} player={player} />}
          {gameSelected === 'rocketdodge' && <RocketDodge roomCode={roomCode} player={player} />}
          {gameSelected === 'colorswitch' && <ColorSwitch roomCode={roomCode} player={player} />}

          <div style={gameActionsStyle}>
            <button onClick={quitGame} style={quitButtonStyle}>🚪 Quit Game</button>
            <button onClick={resetGame} style={resetButtonStyle}>🔁 Reset</button>
          </div>
        </>
      ) : null}
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 20,
  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 25%, #6366f1 50%, #a855f7 75%, #3b82f6 100%)',
  backgroundSize: '400% 400%',
  animation: 'gradientShift 15s ease infinite',
  minHeight: '100vh',
  color: '#ffffff',
  position: 'relative',
  overflow: 'hidden'
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: '8px',
  backgroundColor: '#6366f1',
  color: 'white',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  margin: '10px',
};

const gameButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#8b5cf6',
  fontSize: '1.2rem',
  minWidth: '200px',
  margin: '8px',
};

const onlineGameButtonStyle: React.CSSProperties = {
  ...gameButtonStyle,
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '15px 20px',
  position: 'relative',
  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  transform: 'translateY(0)',
};

const offlineGameButtonStyle: React.CSSProperties = {
  ...gameButtonStyle,
  background: 'linear-gradient(135deg, #4c1d95 0%, #6b21a8 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '15px 20px',
  position: 'relative',
  boxShadow: '0 8px 32px rgba(76, 29, 149, 0.3)',
  border: '2px solid rgba(255, 255, 255, 0.1)',
};

const onlineBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  backgroundColor: '#3b82f6',
  color: 'white',
  padding: '2px 6px',
  borderRadius: '10px',
  marginTop: '5px',
  fontWeight: 'bold',
};

const offlineBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  backgroundColor: '#a855f7',
  color: 'white',
  padding: '2px 6px',
  borderRadius: '10px',
  marginTop: '5px',
  fontWeight: 'bold',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '16px',
  marginBottom: '10px',
};

const resetButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#8b5cf6',
  marginTop: '20px',
};

const infoButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#6366f1',
};

const instructionBox: React.CSSProperties = {
  backgroundColor: '#333',
  padding: '15px',
  borderRadius: '8px',
  margin: '10px auto',
  maxWidth: '500px',
  textAlign: 'left',
};

const gameGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '15px',
  maxWidth: '800px',
  margin: '0 auto',
  padding: '20px',
};

const gameActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'center',
  marginTop: '20px',
};

const quitButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#a855f7',
};

export default StarPlay;