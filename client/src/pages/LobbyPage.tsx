import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { RoleType, ROLE_INFO } from '../types/game';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { connected, setMyName } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType>('appraiser');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!playerName.trim()) { setError('请输入昵称'); return; }
    setLoading(true);
    setError('');
    const socket = getSocket();
    socket.emit('create_room', { playerName: playerName.trim(), role: selectedRole }, (code) => {
      setMyName(playerName.trim());
      setLoading(false);
      navigate(`/room/${code}`);
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) { setError('请输入昵称'); return; }
    if (!roomCode.trim()) { setError('请输入房间码'); return; }
    setLoading(true);
    setError('');
    const socket = getSocket();
    socket.emit('join_room', { roomCode: roomCode.trim().toUpperCase(), playerName: playerName.trim(), role: selectedRole }, (success, err) => {
      setLoading(false);
      if (success) {
        setMyName(playerName.trim());
        navigate(`/room/${roomCode.trim().toUpperCase()}`);
      } else {
        setError(err || '加入失败');
      }
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.title}>🏺 竞拍之王</div>
        <div style={styles.subtitle}>多人联机暗标竞拍策略游戏</div>
        <div style={styles.badge}>{connected ? '🟢 已连接' : '🔴 连接中...'}</div>
      </div>

      {mode === 'home' && (
        <div style={styles.card}>
          <button style={styles.btnPrimary} onClick={() => setMode('create')}>🎮 创建房间</button>
          <button style={styles.btnSecondary} onClick={() => setMode('join')}>🚪 加入房间</button>
        </div>
      )}

      {(mode === 'create' || mode === 'join') && (
        <div style={styles.card}>
          <button style={styles.backBtn} onClick={() => { setMode('home'); setError(''); }}>← 返回</button>
          <h2 style={styles.cardTitle}>{mode === 'create' ? '创建房间' : '加入房间'}</h2>

          <label style={styles.label}>你的昵称</label>
          <input
            style={styles.input}
            placeholder="输入昵称（最多10字）"
            value={playerName}
            maxLength={10}
            onChange={e => setPlayerName(e.target.value)}
          />

          {mode === 'join' && (
            <>
              <label style={styles.label}>房间码</label>
              <input
                style={styles.input}
                placeholder="输入6位房间码"
                value={roomCode}
                maxLength={6}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
              />
            </>
          )}

          <label style={styles.label}>选择角色</label>
          <div style={styles.roleGrid}>
            {(Object.keys(ROLE_INFO) as RoleType[]).map(role => {
              const info = ROLE_INFO[role];
              const isSelected = selectedRole === role;
              return (
                <div
                  key={role}
                  style={{
                    ...styles.roleCard,
                    borderColor: isSelected ? info.color : '#374151',
                    background: isSelected ? `${info.color}22` : '#1f2937',
                  }}
                  onClick={() => setSelectedRole(role)}
                >
                  <div style={styles.roleEmoji}>{info.emoji}</div>
                  <div style={{ ...styles.roleName, color: info.color }}>{info.name}</div>
                  <div style={styles.roleSkill}>⚡ {info.skill}</div>
                  <div style={styles.rolePassive}>🔮 {info.passive}</div>
                </div>
              );
            })}
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }}
            disabled={loading || !connected}
            onClick={mode === 'create' ? handleCreate : handleJoin}
          >
            {loading ? '处理中...' : mode === 'create' ? '🎮 创建房间' : '🚪 加入房间'}
          </button>
        </div>
      )}

      <div style={styles.footer}>
        <div style={styles.rules}>
          <span>💡 游戏规则：</span>
          <span>每局 6 轮竞拍 · 暗标出价 · 信息渐进揭示 · 资产最多者获胜</span>
        </div>
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
    alignItems: 'center',
    padding: '20px',
    fontFamily: '"Noto Sans SC", sans-serif',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '32px',
    marginTop: '40px',
  },
  title: {
    fontSize: '48px',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '16px',
    marginBottom: '12px',
  },
  badge: {
    display: 'inline-block',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '20px',
    padding: '4px 16px',
    fontSize: '13px',
    color: '#94a3b8',
  },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '600px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardTitle: {
    color: '#f1f5f9',
    fontSize: '20px',
    fontWeight: 700,
    margin: 0,
  },
  label: {
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '-8px',
  },
  input: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#f1f5f9',
    fontSize: '15px',
    outline: 'none',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  roleCard: {
    border: '2px solid',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  roleEmoji: {
    fontSize: '28px',
    marginBottom: '6px',
  },
  roleName: {
    fontSize: '15px',
    fontWeight: 700,
    marginBottom: '6px',
  },
  roleSkill: {
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '4px',
  },
  rolePassive: {
    fontSize: '11px',
    color: '#64748b',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    color: 'white',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnSecondary: {
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: '10px',
    padding: '14px',
    color: '#f1f5f9',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0,
    textAlign: 'left',
  },
  error: {
    background: '#450a0a',
    border: '1px solid #7f1d1d',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fca5a5',
    fontSize: '14px',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
  },
  rules: {
    color: '#475569',
    fontSize: '13px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
};
