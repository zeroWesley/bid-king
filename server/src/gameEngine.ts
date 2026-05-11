import { v4 as uuidv4 } from 'uuid';
import {
  GameRoom, Player, RoundState, ArtifactBundle,
  RoleType, GamePhase, BidPhase,
  GameRoomPublic, PlayerPublic, RoundStatePublic, BundlePublic,
  ArtifactPublicPhased, RoundSettlement, GameResult, SkillResult,
} from './types';
import { generateBundles } from './gameData';

const PHASE_DURATIONS = {
  phase1: 30_000,
  phase2: 45_000,
  phase3: 30_000,
};

const INITIAL_COINS = 5000;
const TOTAL_ROUNDS = 6;

export function createRoom(hostId: string, hostName: string, hostRole: RoleType): GameRoom {
  const code = generateRoomCode();
  const host: Player = {
    id: hostId,
    socketId: hostId,
    name: hostName,
    role: hostRole,
    coins: INITIAL_COINS,
    ownedArtifacts: [],
    skillUsed: false,
    isReady: false,
    isConnected: true,
  };

  return {
    id: uuidv4(),
    code,
    hostId,
    players: [host],
    gamePhase: 'waiting',
    currentRound: 0,
    totalRounds: TOTAL_ROUNDS,
    roundState: null,
    bundles: generateBundles(TOTAL_ROUNDS),
    createdAt: Date.now(),
  };
}

export function addPlayer(room: GameRoom, playerId: string, playerName: string, role: RoleType): boolean {
  if (room.players.length >= 4) return false;
  if (room.gamePhase !== 'waiting') return false;
  if (room.players.find(p => p.id === playerId)) return false;

  room.players.push({
    id: playerId,
    socketId: playerId,
    name: playerName,
    role,
    coins: INITIAL_COINS,
    ownedArtifacts: [],
    skillUsed: false,
    isReady: false,
    isConnected: true,
  });
  return true;
}

export function setPlayerReady(room: GameRoom, playerId: string): void {
  const player = room.players.find(p => p.id === playerId);
  if (player) player.isReady = true;
}

export function canStartGame(room: GameRoom, requesterId: string): boolean {
  return (
    room.hostId === requesterId &&
    room.players.length >= 2 &&
    room.players.every(p => p.isReady) &&
    room.gamePhase === 'waiting'
  );
}

export function startGame(room: GameRoom): void {
  room.gamePhase = 'info_reveal';
  room.currentRound = 1;
  startRound(room);
}

export function startRound(room: GameRoom): void {
  const bundle = room.bundles[room.currentRound - 1];
  room.roundState = {
    roundNumber: room.currentRound,
    bundle,
    phase: 'phase1',
    phaseEndTime: Date.now() + PHASE_DURATIONS.phase1,
    bids: {},
    highestBid: bundle.startingPrice,
    winner: null,
    revealedInfo: { phase1: true, phase2: false, phase3: false },
  };
  room.gamePhase = 'info_reveal';
}

export function advancePhase(room: GameRoom): BidPhase | 'settlement' {
  if (!room.roundState) return 'settlement';
  const { phase } = room.roundState;

  if (phase === 'phase1') {
    room.roundState.phase = 'phase2';
    room.roundState.phaseEndTime = Date.now() + PHASE_DURATIONS.phase2;
    room.roundState.revealedInfo.phase2 = true;
    room.gamePhase = 'bidding';
    return 'phase2';
  } else if (phase === 'phase2') {
    room.roundState.phase = 'phase3';
    room.roundState.phaseEndTime = Date.now() + PHASE_DURATIONS.phase3;
    room.roundState.revealedInfo.phase3 = true;
    return 'phase3';
  } else {
    return 'settlement';
  }
}

export function placeBid(room: GameRoom, playerId: string, amount: number): boolean {
  if (!room.roundState) return false;
  if (room.gamePhase !== 'bidding') return false;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return false;
  if (player.coins < amount) return false;
  if (amount < room.roundState.bundle.startingPrice) return false;

  room.roundState.bids[playerId] = amount;
  if (amount > room.roundState.highestBid) {
    room.roundState.highestBid = amount;
  }
  return true;
}

export function settleRound(room: GameRoom): RoundSettlement {
  if (!room.roundState) throw new Error('No round state');

  const { bids, bundle } = room.roundState;
  
  // Find winner (highest bid)
  let winnerId: string | null = null;
  let winAmount = 0;
  
  for (const [playerId, amount] of Object.entries(bids)) {
    if (amount > winAmount) {
      winAmount = amount;
      winnerId = playerId;
    }
  }

  // Transfer artifacts and coins
  if (winnerId) {
    const winner = room.players.find(p => p.id === winnerId);
    if (winner) {
      winner.coins -= winAmount;
      winner.ownedArtifacts.push(...bundle.artifacts);
    }
  }

  const winnerPlayer = winnerId ? room.players.find(p => p.id === winnerId) : null;
  const playerCoins: Record<string, number> = {};
  room.players.forEach(p => { playerCoins[p.id] = p.coins; });

  const settlement: RoundSettlement = {
    winnerId,
    winnerName: winnerPlayer?.name ?? null,
    winAmount,
    bundle: bundle.artifacts.map(a => ({
      id: a.id,
      name: a.name,
      theme: a.theme,
      rarity: a.rarity,
      imageUrl: a.imageUrl,
      silhouetteUrl: a.silhouetteUrl,
      trueValue: a.trueValue,
    })),
    playerCoins,
    allBids: { ...bids },
  };

  // Reset skill usage for next round
  room.players.forEach(p => { p.skillUsed = false; });

  // Advance round
  if (room.currentRound >= room.totalRounds) {
    room.gamePhase = 'finished';
  } else {
    room.currentRound++;
    room.gamePhase = 'settlement';
  }

  return settlement;
}

export function getGameResult(room: GameRoom): GameResult {
  const rankings = room.players.map(player => {
    const artifactValue = calculateArtifactValue(player.ownedArtifacts);
    return {
      playerId: player.id,
      playerName: player.name,
      coins: player.coins,
      artifactValue,
      totalAssets: player.coins + artifactValue,
      rank: 0,
    };
  });

  rankings.sort((a, b) => b.totalAssets - a.totalAssets);
  rankings.forEach((r, i) => { r.rank = i + 1; });

  return { rankings };
}

function calculateArtifactValue(artifacts: { theme: string; trueValue: number }[]): number {
  const themeGroups: Record<string, number> = {};
  let total = 0;

  for (const artifact of artifacts) {
    total += artifact.trueValue;
    themeGroups[artifact.theme] = (themeGroups[artifact.theme] || 0) + 1;
  }

  // Apply set bonuses
  for (const [, count] of Object.entries(themeGroups)) {
    if (count >= 5) total *= 1.5;
    else if (count >= 3) total *= 1.2;
  }

  return Math.round(total);
}

export function useSkill(room: GameRoom, playerId: string, targetArtifactId?: string): SkillResult {
  const player = room.players.find(p => p.id === playerId);
  if (!player) return { success: false, message: '玩家不存在' };
  if (player.skillUsed) return { success: false, message: '本轮技能已使用' };
  if (!room.roundState) return { success: false, message: '游戏未开始' };

  const bundle = room.roundState.bundle;

  switch (player.role) {
    case 'appraiser': {
      // Reveal true value of one artifact
      const artifact = targetArtifactId
        ? bundle.artifacts.find(a => a.id === targetArtifactId)
        : bundle.artifacts[0];
      if (!artifact) return { success: false, message: '藏品不存在' };
      player.skillUsed = true;
      return { success: true, data: { artifactId: artifact.id, trueValue: artifact.trueValue }, message: `精准估值：${artifact.name} 真实价值 ${artifact.trueValue} 金币` };
    }
    case 'merchant': {
      // Reveal other players' last bids
      const otherBids: Record<string, number> = {};
      for (const [pid, amount] of Object.entries(room.roundState.bids)) {
        if (pid !== playerId) otherBids[pid] = amount;
      }
      player.skillUsed = true;
      return { success: true, data: { bids: otherBids }, message: '市场调研：已获取其他玩家出价信息' };
    }
    case 'collector': {
      // Reveal set bonus info
      const themeCount = bundle.artifacts.filter(a => a.theme === bundle.theme).length;
      player.skillUsed = true;
      return { success: true, data: { theme: bundle.theme, artifactCount: themeCount, setBonus: bundle.setBonus }, message: `套装感知：本组合包含 ${themeCount} 件同主题藏品` };
    }
    case 'mystery': {
      // Get rough coin ranges of other players
      const coinRanges: Record<string, string> = {};
      for (const p of room.players) {
        if (p.id !== playerId) {
          const coins = p.coins;
          const range = coins < 1000 ? '0-1000' : coins < 2000 ? '1000-2000' : coins < 3500 ? '2000-3500' : '3500+';
          coinRanges[p.id] = range;
        }
      }
      player.skillUsed = true;
      return { success: true, data: { coinRanges }, message: '暗中观察：已获取其他玩家资金范围' };
    }
    default:
      return { success: false, message: '未知角色' };
  }
}

// Public view helpers
export function toPublicRoom(room: GameRoom): GameRoomPublic {
  return {
    id: room.id,
    code: room.code,
    hostId: room.hostId,
    players: room.players.map(toPublicPlayer),
    gamePhase: room.gamePhase,
    currentRound: room.currentRound,
    totalRounds: room.totalRounds,
  };
}

export function toPublicPlayer(player: Player): PlayerPublic {
  return {
    id: player.id,
    name: player.name,
    role: player.role,
    coins: player.coins,
    ownedArtifacts: player.ownedArtifacts.map(a => ({
      id: a.id,
      name: a.name,
      theme: a.theme,
      rarity: a.rarity,
      imageUrl: a.imageUrl,
      silhouetteUrl: a.silhouetteUrl,
      trueValue: a.trueValue,
    })),
    skillUsed: player.skillUsed,
    isReady: player.isReady,
    isConnected: player.isConnected,
  };
}

export function toPublicRound(roundState: RoundState, playerId: string): RoundStatePublic {
  const { bundle, phase, revealedInfo } = roundState;

  const publicArtifacts: ArtifactPublicPhased[] = bundle.artifacts.map(a => ({
    id: a.id,
    theme: a.theme,
    rarity: a.rarity,
    silhouetteUrl: a.silhouetteUrl,
    ...(revealedInfo.phase2 ? { valueMin: a.valueMin, valueMax: a.valueMax } : {}),
    ...(revealedInfo.phase3 ? { name: a.name, imageUrl: a.imageUrl } : {}),
  }));

  const publicBundle: BundlePublic = {
    id: bundle.id,
    theme: bundle.theme,
    artifacts: publicArtifacts,
    startingPrice: bundle.startingPrice,
    setBonus: bundle.setBonus,
  };

  return {
    roundNumber: roundState.roundNumber,
    bundle: publicBundle,
    phase,
    phaseEndTime: roundState.phaseEndTime,
    highestBid: roundState.highestBid,
    bidCount: Object.keys(roundState.bids).length,
    myBid: roundState.bids[playerId],
    winner: roundState.winner,
  };
}

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
