import { create } from 'zustand';
import {
  GameRoomPublic, RoundStatePublic, RoundSettlement,
  GameResult, ChatMessage,
} from '../types/game';

interface GameStore {
  // Connection
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Player identity
  myId: string | null;
  myName: string;
  setMyId: (id: string) => void;
  setMyName: (name: string) => void;

  // Room
  room: GameRoomPublic | null;
  setRoom: (room: GameRoomPublic) => void;

  // Round
  roundState: RoundStatePublic | null;
  setRoundState: (round: RoundStatePublic) => void;

  // Settlement
  lastSettlement: RoundSettlement | null;
  setLastSettlement: (s: RoundSettlement) => void;

  // Game result
  gameResult: GameResult | null;
  setGameResult: (r: GameResult) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;

  // Skill result notification
  skillNotification: string | null;
  setSkillNotification: (msg: string | null) => void;

  // UI state
  showSettlement: boolean;
  setShowSettlement: (v: boolean) => void;

  // Reset
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  connected: false,
  setConnected: (v) => set({ connected: v }),

  myId: null,
  myName: '',
  setMyId: (id) => set({ myId: id }),
  setMyName: (name) => set({ myName: name }),

  room: null,
  setRoom: (room) => set({ room }),

  roundState: null,
  setRoundState: (round) => set({ roundState: round }),

  lastSettlement: null,
  setLastSettlement: (s) => set({ lastSettlement: s }),

  gameResult: null,
  setGameResult: (r) => set({ gameResult: r }),

  chatMessages: [],
  addChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-50), msg],
  })),

  skillNotification: null,
  setSkillNotification: (msg) => set({ skillNotification: msg }),

  showSettlement: false,
  setShowSettlement: (v) => set({ showSettlement: v }),

  reset: () => set({
    room: null,
    roundState: null,
    lastSettlement: null,
    gameResult: null,
    chatMessages: [],
    skillNotification: null,
    showSettlement: false,
  }),
}));
