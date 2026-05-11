import { useEffect } from 'react';
import { connectSocket, getSocket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';

export function useSocket() {
  const {
    setConnected, setMyId, setRoom, setRoundState,
    setLastSettlement, setGameResult, addChatMessage,
    setSkillNotification, setShowSettlement,
  } = useGameStore();

  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => {
      setConnected(true);
      setMyId(socket.id!);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('room_updated', (room) => {
      setRoom(room);
    });

    socket.on('round_started', (round) => {
      setRoundState(round);
      setShowSettlement(false);
    });

    socket.on('phase_changed', (data) => {
      useGameStore.setState((state) => ({
        roundState: state.roundState
          ? { ...state.roundState, phase: data.phase, phaseEndTime: data.endTime, highestBid: data.highestBid ?? state.roundState.highestBid }
          : null,
      }));
    });

    socket.on('bid_placed', (data) => {
      useGameStore.setState((state) => ({
        roundState: state.roundState
          ? { ...state.roundState, highestBid: data.highestBid, bidCount: data.bidCount }
          : null,
      }));
    });

    socket.on('round_settled', (settlement) => {
      setLastSettlement(settlement);
      setShowSettlement(true);
    });

    socket.on('game_finished', (result) => {
      setGameResult(result);
    });

    socket.on('chat_message', (msg) => {
      addChatMessage(msg);
    });

    socket.on('error', (msg) => {
      setSkillNotification(`❌ ${msg}`);
      setTimeout(() => setSkillNotification(null), 3000);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_updated');
      socket.off('round_started');
      socket.off('phase_changed');
      socket.off('bid_placed');
      socket.off('round_settled');
      socket.off('game_finished');
      socket.off('chat_message');
      socket.off('error');
    };
  }, []);

  return getSocket();
}
