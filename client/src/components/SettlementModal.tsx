import { useGameStore } from '../store/gameStore';
import { RARITY_COLORS, RARITY_NAMES } from '../types/game';

export default function SettlementModal() {
  const { lastSettlement, room, myId, setShowSettlement } = useGameStore();
  if (!lastSettlement || !room) return null;

  const isWinner = lastSettlement.winnerId === myId;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          {lastSettlement.winnerId ? (
            <>
              <div style={styles.trophy}>🏆</div>
              <div style={styles.title}>
                {isWinner ? '🎉 恭喜你赢得本轮！' : `${lastSettlement.winnerName} 赢得本轮`}
              </div>
              <div style={styles.winAmount}>出价：{lastSettlement.winAmount} 金币</div>
            </>
          ) : (
            <>
              <div style={styles.trophy}>😶</div>
              <div style={styles.title}>本轮无人出价</div>
            </>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>本轮藏品</div>
          <div style={styles.artifactList}>
            {lastSettlement.bundle.map(artifact => (
              <div key={artifact.id} style={styles.artifactItem}>
                <span style={{ color: RARITY_COLORS[artifact.rarity], fontSize: '11px', fontWeight: 700 }}>
                  [{RARITY_NAMES[artifact.rarity]}]
                </span>
                <span style={styles.artifactName}>{artifact.name}</span>
                <span style={styles.artifactValue}>💎 {artifact.trueValue} 金币</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>所有出价</div>
          <div style={styles.bidList}>
            {Object.entries(lastSettlement.allBids).map(([playerId, amount]) => {
              const player = room.players.find(p => p.id === playerId);
              return (
                <div key={playerId} style={styles.bidItem}>
                  <span style={styles.bidPlayerName}>{player?.name || '未知'}</span>
                  <span style={{ ...styles.bidAmount, color: playerId === lastSettlement.winnerId ? '#f59e0b' : '#94a3b8' }}>
                    {amount} 金币 {playerId === lastSettlement.winnerId ? '👑' : ''}
                  </span>
                </div>
              );
            })}
            {Object.keys(lastSettlement.allBids).length === 0 && (
              <div style={{ color: '#64748b', fontSize: '13px' }}>无人出价</div>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>当前资金</div>
          <div style={styles.coinList}>
            {Object.entries(lastSettlement.playerCoins).map(([playerId, coins]) => {
              const player = room.players.find(p => p.id === playerId);
              return (
                <div key={playerId} style={styles.coinItem}>
                  <span style={styles.coinPlayerName}>{player?.name || '未知'}</span>
                  <span style={styles.coinAmount}>💰 {coins} 金币</span>
                </div>
              );
            })}
          </div>
        </div>

        <button style={styles.closeBtn} onClick={() => setShowSettlement(false)}>
          继续游戏 →
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: '#00000088',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '20px',
    padding: '32px',
    width: '480px',
    maxHeight: '80vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    textAlign: 'center',
  },
  trophy: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: '4px',
  },
  winAmount: {
    color: '#f59e0b',
    fontSize: '15px',
  },
  section: {
    background: '#0f172a',
    borderRadius: '12px',
    padding: '16px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '12px',
  },
  artifactList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  artifactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  artifactName: {
    flex: 1,
    fontSize: '13px',
    color: '#f1f5f9',
  },
  artifactValue: {
    fontSize: '13px',
    color: '#f59e0b',
    fontWeight: 600,
  },
  bidList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  bidItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidPlayerName: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  bidAmount: {
    fontSize: '14px',
    fontWeight: 600,
  },
  coinList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  coinItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinPlayerName: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  coinAmount: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#f59e0b',
  },
  closeBtn: {
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    color: 'white',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
