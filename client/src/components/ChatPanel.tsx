import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../lib/socket';

export default function ChatPanel() {
  const { chatMessages } = useGameStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (!input.trim()) return;
    getSocket().emit('send_chat', input.trim());
    setInput('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>💬 聊天</div>
      <div style={styles.messages}>
        {chatMessages.length === 0 && (
          <div style={styles.empty}>暂无消息，说点什么吧...</div>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} style={styles.message}>
            <span style={styles.msgName}>{msg.playerName}：</span>
            <span style={styles.msgText}>{msg.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          placeholder="发送消息..."
          value={input}
          maxLength={100}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button style={styles.sendBtn} onClick={handleSend}>发送</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    minHeight: 0,
  },
  title: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '10px',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minHeight: '120px',
    maxHeight: '200px',
    background: '#0f172a',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '10px',
  },
  empty: {
    color: '#475569',
    fontSize: '12px',
    textAlign: 'center',
    marginTop: '20px',
  },
  message: {
    fontSize: '12px',
    lineHeight: 1.5,
  },
  msgName: {
    color: '#f59e0b',
    fontWeight: 600,
  },
  msgText: {
    color: '#94a3b8',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#f1f5f9',
    fontSize: '13px',
    outline: 'none',
  },
  sendBtn: {
    background: '#334155',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    color: '#94a3b8',
    fontSize: '13px',
    cursor: 'pointer',
  },
};
