export type RoleType = 'appraiser' | 'merchant' | 'collector' | 'mystery';
export type RarityType = 'common' | 'fine' | 'rare' | 'legendary';
export type GamePhase = 'waiting' | 'info_reveal' | 'bidding' | 'settlement' | 'finished';
export type BidPhase = 'phase1' | 'phase2' | 'phase3';

export interface Artifact {
  id: string;
  name: string;
  theme: string;
  rarity: RarityType;
  trueValue: number;
  valueMin: number;
  valueMax: number;
  imageUrl: string;
  silhouetteUrl: string;
}

export interface ArtifactBundle {
  id: string;
  theme: string;
  artifacts: Artifact[];
  startingPrice: number;
  setBonus: { count: number; multiplier: number }[];
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  role: RoleType;
  coins: number;
  ownedArtifacts: Artifact[];
  skillUsed: boolean;
  isReady: boolean;
  isConnected: boolean;
}

export interface Bid {
  playerId: string;
  amount: number;
  timestamp: number;
}

export interface RoundState {
  roundNumber: number;
  bundle: ArtifactBundle;
  phase: BidPhase;
  phaseEndTime: number;
  bids: Record<string, number>; // playerId -> amount (hidden)
  highestBid: number; // revealed after first bid
  winner: string | null;
  revealedInfo: {
    phase1: boolean;
    phase2: boolean;
    phase3: boolean;
  };
}

export interface GameRoom {
  id: string;
  code: string;
  hostId: string;
  players: Player[];
  gamePhase: GamePhase;
  currentRound: number;
  totalRounds: number;
  roundState: RoundState | null;
  bundles: ArtifactBundle[];
  createdAt: number;
}

// Socket event payloads
export interface CreateRoomPayload {
  playerName: string;
  role: RoleType;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
  role: RoleType;
}

export interface PlaceBidPayload {
  amount: number;
}

export interface UseSkillPayload {
  targetArtifactId?: string;
}

export interface ServerToClientEvents {
  room_updated: (room: GameRoomPublic) => void;
  round_started: (round: RoundStatePublic) => void;
  phase_changed: (data: { phase: BidPhase; endTime: number; highestBid?: number }) => void;
  bid_placed: (data: { highestBid: number; bidCount: number }) => void;
  round_settled: (data: RoundSettlement) => void;
  game_finished: (data: GameResult) => void;
  skill_result: (data: SkillResult) => void;
  error: (message: string) => void;
  player_joined: (player: PlayerPublic) => void;
  player_left: (playerId: string) => void;
  chat_message: (data: { playerName: string; message: string; timestamp: number }) => void;
}

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomPayload, callback: (roomCode: string) => void) => void;
  join_room: (payload: JoinRoomPayload, callback: (success: boolean, error?: string) => void) => void;
  player_ready: () => void;
  start_game: () => void;
  place_bid: (payload: PlaceBidPayload) => void;
  use_skill: (payload: UseSkillPayload, callback: (result: SkillResult) => void) => void;
  send_chat: (message: string) => void;
}

// Public versions (no hidden info)
export interface PlayerPublic {
  id: string;
  name: string;
  role: RoleType;
  coins: number;
  ownedArtifacts: ArtifactPublic[];
  skillUsed: boolean;
  isReady: boolean;
  isConnected: boolean;
}

export interface ArtifactPublic {
  id: string;
  name: string;
  theme: string;
  rarity: RarityType;
  imageUrl: string;
  silhouetteUrl: string;
  trueValue?: number; // only revealed at settlement
}

export interface RoundStatePublic {
  roundNumber: number;
  bundle: BundlePublic;
  phase: BidPhase;
  phaseEndTime: number;
  highestBid: number;
  bidCount: number;
  myBid?: number;
  winner: string | null;
}

export interface BundlePublic {
  id: string;
  theme: string;
  artifacts: ArtifactPublicPhased[];
  startingPrice: number;
  setBonus: { count: number; multiplier: number }[];
}

export interface ArtifactPublicPhased {
  id: string;
  name?: string; // revealed in phase3
  theme: string;
  rarity: RarityType;
  imageUrl?: string; // revealed in phase3
  silhouetteUrl: string; // available in phase2+
  valueMin?: number; // revealed in phase2
  valueMax?: number; // revealed in phase2
  trueValue?: number; // revealed at settlement
}

export interface GameRoomPublic {
  id: string;
  code: string;
  hostId: string;
  players: PlayerPublic[];
  gamePhase: GamePhase;
  currentRound: number;
  totalRounds: number;
}

export interface RoundSettlement {
  winnerId: string | null;
  winnerName: string | null;
  winAmount: number;
  bundle: ArtifactPublic[];
  playerCoins: Record<string, number>;
  allBids: Record<string, number>;
}

export interface GameResult {
  rankings: Array<{
    rank: number;
    playerId: string;
    playerName: string;
    totalAssets: number;
    coins: number;
    artifactValue: number;
  }>;
}

export interface SkillResult {
  success: boolean;
  data?: unknown;
  message?: string;
}
