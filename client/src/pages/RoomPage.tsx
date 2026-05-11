import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../lib/socket';
import WaitingRoom from '../components/WaitingRoom';
import GameBoard from '../components/GameBoard';
import GameResult from '../components/GameResult';

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, gameResult } = useGameStore();

  useEffect(() => {
    if (!code) navigate('/');
  }, [code, navigate]);

  if (!room) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}>⏳</div>
        <div style={styles.loadingText}>连接房间中...</div>
      </div>
    );
  }

  if (gameResult) {
    return <GameResult result={gameResult} />;
  }

  if (room.gamePhase === 'waiting') {
    return <WaitingRoom room={room} roomCode={code!} />;
  }

  return <GameBoard room={room} />;
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  spinner: {
    fontSize: '48px',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: '18px',
  },
};
