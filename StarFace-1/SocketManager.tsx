
import { io, Socket } from 'socket.io-client';

export interface GameState {
  id: string;
  type: string;
  players: any[];
  gameData: any;
  status: 'waiting' | 'playing' | 'finished';
}

class SocketManager {
  private socket: Socket | null = null;
  private roomCode: string = '';
  private playerData: any = null;
  private gameStateCallbacks: ((state: GameState) => void)[] = [];

  connect() {
    // In a real implementation, this would connect to your Socket.IO server
    // For now, we'll simulate multiplayer locally
    this.socket = io('ws://localhost:3001', {
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to multiplayer server');
    });

    this.socket.on('gameStateUpdate', (gameState: GameState) => {
      this.gameStateCallbacks.forEach(callback => callback(gameState));
    });

    this.socket.on('playerJoined', (player: any) => {
      console.log('Player joined:', player);
    });

    this.socket.on('playerLeft', (player: any) => {
      console.log('Player left:', player);
    });
  }

  createRoom(gameType: string, playerData: any) {
    this.roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.playerData = playerData;
    
    if (this.socket) {
      this.socket.emit('createRoom', { roomCode: this.roomCode, gameType, playerData });
    }
    
    return this.roomCode;
  }

  joinRoom(roomCode: string, playerData: any) {
    this.roomCode = roomCode;
    this.playerData = playerData;
    
    if (this.socket) {
      this.socket.emit('joinRoom', { roomCode, playerData });
    }
  }

  updateGameState(gameData: any) {
    if (this.socket && this.roomCode) {
      this.socket.emit('updateGameState', { roomCode: this.roomCode, gameData });
    }
  }

  onGameStateUpdate(callback: (state: GameState) => void) {
    this.gameStateCallbacks.push(callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketManager = new SocketManager();
