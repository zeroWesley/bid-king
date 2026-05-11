import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GameResult as GameResultType } from '../types/game';

interface Props {
  result: GameResultType;
}

const RANK_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣'];

export default function GameResult({ result }: Props) {
  const navigate = useNavigate();
  const { myId, reset } = useGameStore();

  const handleBack = () => {
    reset();
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>🏆 游戏结束</div>
        <div style={styles.subtitle}>最终排名</div>

        <div style={styles.rankings}>
          {result.rankings.map((r) => {
            const isMe = r.playerId === myId;
            return (
              <div
                key={r.playerId}
                style={{
                  ...styles.rankRow,
                  background: isMe ? '#1e3a5f' : '#1e293b',
                  border: `1px solid ${isMe ? '#3b82f6' : '#334155'}`,
                }}
              >
                <div style={styles.rankEmoji}>{RANK_EMOJIS[r.rank - 1] || `${r.rank}`}</div>
                <div style={styles.rankInfo}>
                  <div style={styles.rankName}>
                    {r.playerName}
                    {isMe && <span style={styles.youBadge}> (你)</span>}
                  </div>
                  <div style={styles.rankDetails}>
                    💰 剩余 {r.coins} · 🏺 藏品 {r.artifactValue}
                  </div>
                </div>
                <div style={styles.rankTotal}>
                  <div style={styles.rankTotalValue}>{r.totalAssets}</div>
                  <div style={styles.rankTotalLabel}>总资产</div>
                </div>
              </div>
            );
          })}
        </div>

        {result.rankings[0] && (
          <div style={styles.winner}>
            🎉 恭喜 <strong>{result.rankings[0].playerName}</strong> 以 {result.rankings[0].totalAssets} 金币总资产获胜！
          </div>
        )}

        <button style={styles.backBtn} onClick={handleBack}>
          🏠 返回大厅
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Noto Sans SC", sans-serif',
    padding: '20px',
  },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 900,
    textAlign: 'center',
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginTop: '-10px',
  },
  rankings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  rankRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderRadius: '12px',
    padding: '16px',
  },
  rankEmoji: {
    fontSize: '28px',
    width: '36px',
    textAlign: 'center',
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: '4px',
  },
  youBadge: {
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 400,
  },
  rankDetails: {
    fontSize: '12px',
    color: '#64748b',
  },
  rankTotal: {
    textAlign: 'right',
  },
  rankTotalValue: {
    fontSize: '20px',
    fontWeight: 900,
    color: '#f59e0b',
  },
  rankTotalLabel: {
    fontSize: '11px',
    color: '#64748b',
  },
  winner: {
    background: '#1c1917',
    border: '1px solid #78350f',
    borderRadius: '12px',
    padding: '16px',
    color: '#fbbf24',
    fontSize: '14px',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  backBtn: {
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    color: 'white',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
