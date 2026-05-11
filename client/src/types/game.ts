export type RoleType = 'appraiser' | 'merchant' | 'collector' | 'mystery';
export type RarityType = 'common' | 'fine' | 'rare' | 'legendary';
export type GamePhase = 'waiting' | 'info_reveal' | 'bidding' | 'settlement' | 'finished';
export type BidPhase = 'phase1' | 'phase2' | 'phase3';

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
  name?: string;
  theme: string;
  rarity: RarityType;
  imageUrl?: string;
  silhouetteUrl: string;
  trueValue?: number;
}

export interface ArtifactPublicPhased {
  id: string;
  name?: string;
  theme: string;
  rarity: RarityType;
  imageUrl?: string;
  silhouetteUrl: string;
  valueMin?: number;
  valueMax?: number;
  trueValue?: number;
}

export interface BundlePublic {
  id: string;
  theme: string;
  artifacts: ArtifactPublicPhased[];
  startingPrice: number;
  setBonus: { count: number; multiplier: number }[];
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

export interface ChatMessage {
  playerName: string;
  message: string;
  timestamp: number;
}

export const ROLE_INFO: Record<RoleType, { name: string; emoji: string; skill: string; passive: string; color: string }> = {
  appraiser: {
    name: '鉴定师',
    emoji: '🔍',
    skill: '精准估值：查看任意藏品的真实价值',
    passive: '经验之眼：自动获得价值区间提示',
    color: '#4f46e5',
  },
  merchant: {
    name: '商人',
    emoji: '💰',
    skill: '市场调研：查看其他玩家的出价',
    passive: '薄利多销：竞拍成功返还5%资金',
    color: '#059669',
  },
  collector: {
    name: '收藏家',
    emoji: '🏺',
    skill: '套装感知：查看套装完整度和加成',
    passive: '藏品共鸣：同主题藏品价值提升10%',
    color: '#d97706',
  },
  mystery: {
    name: '神秘人',
    emoji: '🎭',
    skill: '暗中观察：查看其他玩家资金范围',
    passive: '信息干扰：可发送虚假价值提示',
    color: '#7c3aed',
  },
};

export const THEME_NAMES: Record<string, string> = {
  ancient_study: '古典书房',
  pirate_treasure: '海盗宝藏',
  royal_palace: '皇家宫廷',
  mystic_forest: '神秘森林',
};

export const RARITY_COLORS: Record<RarityType, string> = {
  common: '#9ca3af',
  fine: '#22c55e',
  rare: '#3b82f6',
  legendary: '#f59e0b',
};

export const RARITY_NAMES: Record<RarityType, string> = {
  common: '普通',
  fine: '精良',
  rare: '稀有',
  legendary: '传说',
};
