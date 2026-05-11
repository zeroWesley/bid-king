import { useState } from 'react';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { GameRoomPublic, ROLE_INFO } from '../types/game';

interface Props {
  room: GameRoomPublic;
  roomCode: string;
}

export default function WaitingRoom({ room, roomCode }: Props) {
  const { myId } = useGameStore();
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === myId;
  const myPlayer = room.players.find(p => p.id === myId);
  const allReady = room.players.length >= 2 && room.players.every(p => p.isReady);

  const handleReady = () => {
    getSocket().emit('player_ready');
  };

  const handleStart = () => {
    getSocket().emit('start_game');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>🏺 竞拍之王</div>
        <div style={styles.roomInfo}>
          <span style={styles.roomLabel}>房间码</span>
          <span style={styles.roomCode}>{roomCode}</span>
          <button style={styles.copyBtn} onClick={copyCode}>
            {copied ? '✅ 已复制' : '📋 复制'}
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>玩家列表 ({room.players.length}/4)</h3>
          <div style={styles.playerList}>
            {room.players.map(player => {
              const roleInfo = ROLE_INFO[player.role];
              return (
                <div key={player.id} style={styles.playerCard}>
                  <div style={styles.playerLeft}>
                    <span style={styles.playerEmoji}>{roleInfo.emoji}</span>
                    <div>
                      <div style={styles.playerName}>
                        {player.name}
                        {player.id === myId && <span style={styles.youBadge}> (你)</span>}
                        {player.id === room.hostId && <span style={styles.hostBadge}> 👑</span>}
                      </div>
                      <div style={{ ...styles.playerRole, color: roleInfo.color }}>{roleInfo.name}</div>
                    </div>
                  </div>
                  <div style={player.isReady ? styles.readyBadge : styles.notReadyBadge}>
                    {player.isReady ? '✅ 已准备' : '⏳ 等待中'}
                  </div>
                </div>
              );
            })}
            {Array.from({ length: 4 - room.players.length }).map((_, i) => (
              <div key={`empty-${i}`} style={styles.emptySlot}>
                <span style={styles.emptyIcon}>👤</span>
                <span style={styles.emptyText}>等待玩家加入...</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>游戏规则</h3>
          <div style={styles.rulesList}>
            <div style={styles.ruleItem}>🎯 共 6 轮竞拍，每轮拍卖一个藏品组合包</div>
            <div style={styles.ruleItem}>💰 每位玩家初始资金 5000 金币</div>
            <div style={styles.ruleItem}>🔒 暗标竞拍：所有玩家同时提交密封出价</div>
            <div style={styles.ruleItem}>📊 信息分三阶段逐步揭示，善用角色技能</div>
            <div style={styles.ruleItem}>🏆 最终资产（藏品价值 + 剩余资金）最高者获胜</div>
            <div style={styles.ruleItem}>✨ 集齐3件同主题藏品可获得20%套装加成</div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        {!myPlayer?.isReady && (
          <button style={styles.readyBtn} onClick={handleReady}>
            ✅ 准备就绪
          </button>
        )}
        {myPlayer?.isReady && !isHost && (
          <div style={styles.waitingMsg}>等待房主开始游戏...</div>
        )}
        {isHost && (
          <button
            style={{ ...styles.startBtn, opacity: allReady ? 1 : 0.5 }}
            disabled={!allReady}
            onClick={handleStart}
          >
            {allReady ? '🚀 开始游戏' : `等待所有玩家准备 (${room.players.filter(p => p.isReady).length}/${room.players.length})`}
          </button>
        )}
      </div>
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
    padding: '20px 32px',
    borderBottom: '1px solid #1e293b',
    background: '#0f172a88',
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  roomInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  roomLabel: {
    color: '#64748b',
    fontSize: '13px',
  },
  roomCode: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '6px 16px',
    fontSize: '20px',
    fontWeight: 900,
    letterSpacing: '4px',
    color: '#f59e0b',
  },
  copyBtn: {
    background: '#334155',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 14px',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '13px',
  },
  content: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    padding: '32px',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
  },
  section: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '24px',
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: '16px',
    fontWeight: 700,
    marginTop: 0,
    marginBottom: '16px',
  },
  playerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  playerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#0f172a',
    borderRadius: '10px',
    padding: '12px 16px',
    border: '1px solid #334155',
  },
  playerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  playerEmoji: {
    fontSize: '24px',
  },
  playerName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#f1f5f9',
  },
  youBadge: {
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 400,
  },
  hostBadge: {
    fontSize: '14px',
  },
  playerRole: {
    fontSize: '12px',
    fontWeight: 600,
    marginTop: '2px',
  },
  readyBadge: {
    background: '#052e16',
    border: '1px solid #166534',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '12px',
    color: '#4ade80',
  },
  notReadyBadge: {
    background: '#1c1917',
    border: '1px solid #44403c',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '12px',
    color: '#78716c',
  },
  emptySlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#0f172a44',
    borderRadius: '10px',
    padding: '12px 16px',
    border: '1px dashed #334155',
  },
  emptyIcon: {
    fontSize: '24px',
    opacity: 0.3,
  },
  emptyText: {
    color: '#475569',
    fontSize: '14px',
  },
  rulesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  ruleItem: {
    color: '#94a3b8',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  footer: {
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'center',
    borderTop: '1px solid #1e293b',
  },
  readyBtn: {
    background: 'linear-gradient(135deg, #059669, #10b981)',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 48px',
    color: 'white',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  startBtn: {
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 48px',
    color: 'white',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  waitingMsg: {
    color: '#64748b',
    fontSize: '15px',
    padding: '14px',
  },
};
