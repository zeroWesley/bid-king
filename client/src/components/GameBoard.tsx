import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../lib/socket';
import { GameRoomPublic, ROLE_INFO, THEME_NAMES, RARITY_COLORS, RARITY_NAMES } from '../types/game';
import SettlementModal from './SettlementModal';
import ChatPanel from './ChatPanel';

interface Props {
  room: GameRoomPublic;
}

export default function GameBoard({ room }: Props) {
  const { myId, roundState, showSettlement, skillNotification } = useGameStore();
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [skillLoading, setSkillLoading] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  const myPlayer = room.players.find(p => p.id === myId);

  useEffect(() => {
    if (!roundState) return;
    const update = () => {
      const left = Math.max(0, Math.ceil((roundState.phaseEndTime - Date.now()) / 1000));
      setTimeLeft(left);
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [roundState?.phaseEndTime]);

  const handleBid = () => {
    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount <= 0) return;
    getSocket().emit('place_bid', { amount });
    setBidAmount('');
  };

  const handleSkill = () => {
    setSkillLoading(true);
    getSocket().emit('use_skill', { targetArtifactId: selectedArtifactId || undefined }, (result) => {
      setSkillLoading(false);
      if (result.success) {
        useGameStore.getState().setSkillNotification(`✨ ${result.message}`);
      } else {
        useGameStore.getState().setSkillNotification(`❌ ${result.message}`);
      }
      setTimeout(() => useGameStore.getState().setSkillNotification(null), 4000);
    });
  };

  const phaseLabels: Record<string, string> = {
    phase1: '第一阶段：信息揭示',
    phase2: '第二阶段：出价竞拍',
    phase3: '第三阶段：最终出价',
  };

  const phaseColors: Record<string, string> = {
    phase1: '#3b82f6',
    phase2: '#f59e0b',
    phase3: '#ef4444',
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>🏺 竞拍之王</span>
          {roundState && (
            <span style={styles.roundBadge}>
              第 {roundState.roundNumber}/{room.totalRounds} 轮
            </span>
          )}
        </div>
        <div style={styles.headerRight}>
          {roundState && (
            <div style={{ ...styles.phaseBadge, background: phaseColors[roundState.phase] + '33', borderColor: phaseColors[roundState.phase] }}>
              <span style={{ color: phaseColors[roundState.phase] }}>{phaseLabels[roundState.phase]}</span>
              <span style={styles.timer}>⏱ {timeLeft}s</span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.main}>
        {/* Left: Bundle Info */}
        <div style={styles.leftPanel}>
          {roundState ? (
            <>
              <div style={styles.bundleHeader}>
                <div style={styles.themeTag}>
                  {THEME_NAMES[roundState.bundle.theme] || roundState.bundle.theme}
                </div>
                <div style={styles.startPrice}>起拍价：{roundState.bundle.startingPrice} 金币</div>
              </div>

              <div style={styles.artifactGrid}>
                {roundState.bundle.artifacts.map(artifact => (
                  <div
                    key={artifact.id}
                    style={{
                      ...styles.artifactCard,
                      borderColor: selectedArtifactId === artifact.id ? '#f59e0b' : RARITY_COLORS[artifact.rarity],
                      cursor: myPlayer?.role === 'appraiser' ? 'pointer' : 'default',
                    }}
                    onClick={() => myPlayer?.role === 'appraiser' && setSelectedArtifactId(artifact.id)}
                  >
                    <div style={styles.artifactImage}>
                      {artifact.imageUrl ? '🖼️' : '🌫️'}
                    </div>
                    <div style={{ ...styles.rarityBadge, color: RARITY_COLORS[artifact.rarity] }}>
                      {RARITY_NAMES[artifact.rarity]}
                    </div>
                    {artifact.name ? (
                      <div style={styles.artifactName}>{artifact.name}</div>
                    ) : (
                      <div style={styles.artifactUnknown}>???</div>
                    )}
                    {artifact.valueMin !== undefined && (
                      <div style={styles.valueRange}>
                        {artifact.valueMin} ~ {artifact.valueMax} 金币
                      </div>
                    )}
                    {artifact.trueValue !== undefined && (
                      <div style={styles.trueValue}>真实价值：{artifact.trueValue}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bid info */}
              <div style={styles.bidInfo}>
                <div style={styles.bidInfoItem}>
                  <span style={styles.bidInfoLabel}>当前最高出价</span>
                  <span style={styles.bidInfoValue}>{roundState.highestBid} 金币</span>
                </div>
                <div style={styles.bidInfoItem}>
                  <span style={styles.bidInfoLabel}>已出价人数</span>
                  <span style={styles.bidInfoValue}>{roundState.bidCount} / {room.players.length}</span>
                </div>
                {roundState.myBid !== undefined && (
                  <div style={styles.bidInfoItem}>
                    <span style={styles.bidInfoLabel}>我的出价</span>
                    <span style={{ ...styles.bidInfoValue, color: '#f59e0b' }}>{roundState.myBid} 金币</span>
                  </div>
                )}
              </div>

              {/* Bid input */}
              {room.gamePhase === 'bidding' && (
                <div style={styles.bidSection}>
                  <div style={styles.bidRow}>
                    <input
                      style={styles.bidInput}
                      type="number"
                      placeholder={`最低 ${roundState.bundle.startingPrice}`}
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      min={roundState.bundle.startingPrice}
                      max={myPlayer?.coins}
                    />
                    <button style={styles.bidBtn} onClick={handleBid}>
                      🔨 出价
                    </button>
                  </div>
                  <div style={styles.quickBids}>
                    {[1.0, 1.2, 1.5, 2.0].map(mult => {
                      const amount = Math.round(roundState.highestBid * mult);
                      return (
                        <button
                          key={mult}
                          style={styles.quickBidBtn}
                          onClick={() => setBidAmount(String(amount))}
                        >
                          {mult === 1.0 ? '最低' : `×${mult}`} {amount}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={styles.waitingRound}>
              <div style={styles.waitingIcon}>⏳</div>
              <div>等待下一轮开始...</div>
            </div>
          )}
        </div>

        {/* Right: Players + Skill + Chat */}
        <div style={styles.rightPanel}>
          {/* My status */}
          {myPlayer && (
            <div style={styles.myStatus}>
              <div style={styles.myStatusHeader}>
                <span style={styles.myRoleEmoji}>{ROLE_INFO[myPlayer.role].emoji}</span>
                <div>
                  <div style={styles.myName}>{myPlayer.name}</div>
                  <div style={{ color: ROLE_INFO[myPlayer.role].color, fontSize: '12px' }}>
                    {ROLE_INFO[myPlayer.role].name}
                  </div>
                </div>
                <div style={styles.myCoins}>💰 {myPlayer.coins}</div>
              </div>
              {/* Skill button */}
              <button
                style={{
                  ...styles.skillBtn,
                  opacity: myPlayer.skillUsed || skillLoading ? 0.5 : 1,
                  background: ROLE_INFO[myPlayer.role].color + '33',
                  borderColor: ROLE_INFO[myPlayer.role].color,
                  color: ROLE_INFO[myPlayer.role].color,
                }}
                disabled={myPlayer.skillUsed || skillLoading}
                onClick={handleSkill}
              >
                ⚡ {myPlayer.skillUsed ? '技能已使用' : ROLE_INFO[myPlayer.role].skill.split('：')[0]}
              </button>
              {skillNotification && (
                <div style={styles.skillNotif}>{skillNotification}</div>
              )}
            </div>
          )}

          {/* Players list */}
          <div style={styles.playersList}>
            <div style={styles.playersTitle}>玩家状态</div>
            {room.players.map(player => (
              <div key={player.id} style={styles.playerRow}>
                <span style={styles.playerRowEmoji}>{ROLE_INFO[player.role].emoji}</span>
                <div style={styles.playerRowInfo}>
                  <div style={styles.playerRowName}>
                    {player.name}
                    {player.id === myId && <span style={{ color: '#64748b', fontSize: '11px' }}> (你)</span>}
                  </div>
                  <div style={styles.playerRowCoins}>💰 {player.coins} 金币</div>
                </div>
                <div style={styles.playerRowArtifacts}>
                  🏺 {player.ownedArtifacts.length}
                </div>
              </div>
            ))}
          </div>

          {/* Chat */}
          <ChatPanel />
        </div>
      </div>

      {showSettlement && <SettlementModal />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Noto Sans SC", sans-serif',
    color: '#f1f5f9',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    background: '#0f172a',
    borderBottom: '1px solid #1e293b',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  roundBadge: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '20px',
    padding: '4px 14px',
    fontSize: '13px',
    color: '#94a3b8',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  phaseBadge: {
    border: '1px solid',
    borderRadius: '20px',
    padding: '6px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    fontWeight: 600,
  },
  timer: {
    color: '#f1f5f9',
    fontWeight: 700,
    fontSize: '15px',
  },
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '0',
    overflow: 'hidden',
  },
  leftPanel: {
    padding: '24px',
    overflowY: 'auto',
    borderRight: '1px solid #1e293b',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    overflowY: 'auto',
  },
  bundleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  themeTag: {
    background: '#312e81',
    border: '1px solid #4338ca',
    borderRadius: '20px',
    padding: '6px 16px',
    fontSize: '14px',
    color: '#a5b4fc',
    fontWeight: 600,
  },
  startPrice: {
    color: '#94a3b8',
    fontSize: '14px',
  },
  artifactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  artifactCard: {
    background: '#1e293b',
    border: '2px solid',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  artifactImage: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  rarityBadge: {
    fontSize: '11px',
    fontWeight: 700,
    marginBottom: '6px',
  },
  artifactName: {
    fontSize: '13px',
    color: '#f1f5f9',
    fontWeight: 600,
  },
  artifactUnknown: {
    fontSize: '18px',
    color: '#475569',
    fontWeight: 700,
  },
  valueRange: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '6px',
  },
  trueValue: {
    fontSize: '12px',
    color: '#f59e0b',
    fontWeight: 700,
    marginTop: '4px',
  },
  bidInfo: {
    display: 'flex',
    gap: '16px',
    background: '#1e293b',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  bidInfoItem: {
    flex: 1,
    textAlign: 'center',
  },
  bidInfoLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#64748b',
    marginBottom: '4px',
  },
  bidInfoValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#f1f5f9',
  },
  bidSection: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '16px',
  },
  bidRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  bidInput: {
    flex: 1,
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#f1f5f9',
    fontSize: '15px',
    outline: 'none',
  },
  bidBtn: {
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  quickBids: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  quickBidBtn: {
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '6px 12px',
    color: '#94a3b8',
    fontSize: '12px',
    cursor: 'pointer',
  },
  waitingRound: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
    gap: '16px',
    color: '#64748b',
    fontSize: '16px',
  },
  waitingIcon: {
    fontSize: '48px',
  },
  myStatus: {
    padding: '16px',
    borderBottom: '1px solid #1e293b',
    background: '#0f172a',
  },
  myStatusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  myRoleEmoji: {
    fontSize: '28px',
  },
  myName: {
    fontSize: '15px',
    fontWeight: 700,
  },
  myCoins: {
    marginLeft: 'auto',
    fontSize: '16px',
    fontWeight: 700,
    color: '#f59e0b',
  },
  skillBtn: {
    width: '100%',
    border: '1px solid',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    background: 'transparent',
    transition: 'opacity 0.2s',
  },
  skillNotif: {
    marginTop: '8px',
    background: '#1e293b',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: 1.5,
  },
  playersList: {
    padding: '16px',
    borderBottom: '1px solid #1e293b',
  },
  playersTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#64748b',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    borderBottom: '1px solid #1e293b',
  },
  playerRowEmoji: {
    fontSize: '20px',
  },
  playerRowInfo: {
    flex: 1,
  },
  playerRowName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#f1f5f9',
  },
  playerRowCoins: {
    fontSize: '11px',
    color: '#64748b',
  },
  playerRowArtifacts: {
    fontSize: '13px',
    color: '#94a3b8',
  },
};
