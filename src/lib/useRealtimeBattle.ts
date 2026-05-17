import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../store/useAuth';
import { useQuestions } from './useData';
import toast from 'react-hot-toast';
import type { QuizQuestion } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function stableHashNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickQuestions(pool: QuizQuestion[], seed: string, count: number): QuizQuestion[] {
  const seeded = [...pool].map((q, idx) => ({
    q,
    k: stableHashNumber(`${seed}:${q.id}:${idx}`),
  }));

  return seeded
    .sort((a, b) => a.k - b.k)
    .slice(0, count)
    .map((x) => x.q);
}

declare global {
  interface Window {
    __quizgoal_queue_cleanup?: (() => void) | null;
  }
}

export interface BattleOpponent {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface BattleAnswer {
  questionIndex: number;
  selectedIndex: number;
  isCorrect: boolean;
  points: number;
  responseTimeMs: number;
}

export type BattlePhase = 'idle' | 'searching' | 'matched' | 'playing' | 'result';

type JoinQueueResult =
  | { status: 'waiting' }
  | { status: 'matched'; battle_id: string; player_one: string; player_two: string }
  | { error: string };

type MatchedPayload = { battle_id: string; player_one: string; player_two: string };

export function useRealtimeBattle() {
  const { profile } = useAuth();
  const { data: allQuestions } = useQuestions();

  const [phase, setPhase] = useState<BattlePhase>('idle');
  const [battleId, setBattleId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<BattleOpponent | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [myAnswers, setMyAnswers] = useState<BattleAnswer[]>([]);
  const [opponentAnswers, setOpponentAnswers] = useState<BattleAnswer[]>([]);
  const [opponentProgress, setOpponentProgress] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const queueChannelRef = useRef<RealtimeChannel | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unsubscribeBattle = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const leaveQueue = useCallback(async () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (queueChannelRef.current) {
      supabase.removeChannel(queueChannelRef.current);
      queueChannelRef.current = null;
    }

    window.__quizgoal_queue_cleanup = null;

    try {
      await supabase.rpc('leave_battle_queue');
    } catch (error: unknown) {
      console.error('leave_battle_queue failed:', getErrorMessage(error));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void leaveQueue();
      unsubscribeBattle();
    };
  }, [leaveQueue, unsubscribeBattle]);

  const subscribeBattle = useCallback(
    (bId: string, p1: string, p2: string) => {
      const channel = supabase.channel(`battle:${bId}`, {
        config: { broadcast: { self: true } },
      });

      channel.on('broadcast', { event: 'answer' }, (payload) => {
        const incoming = payload.payload as unknown as { userId?: string } & Partial<BattleAnswer>;
        if (!incoming.userId || incoming.userId === profile?.id) return;
        if (typeof incoming.questionIndex !== 'number') return;
        if (typeof incoming.selectedIndex !== 'number') return;

        const answer: BattleAnswer = {
          questionIndex: incoming.questionIndex,
          selectedIndex: incoming.selectedIndex,
          isCorrect: Boolean(incoming.isCorrect),
          points: Number(incoming.points || 0),
          responseTimeMs: Number(incoming.responseTimeMs || 0),
        };

        setOpponentAnswers((prev) => {
          if (prev.some((a) => a.questionIndex === answer.questionIndex)) return prev;
          return [...prev, answer];
        });
        setOpponentScore((prev) => prev + answer.points);
        setOpponentProgress((prev) => prev + 1);
      });

      channel.on('broadcast', { event: 'finish' }, (payload) => {
        const incoming = payload.payload as unknown as { userId?: string; finalScore?: number };
        if (!incoming.userId || incoming.userId === profile?.id) return;
        setOpponentScore(Number(incoming.finalScore || 0));
      });

      channel.subscribe();
      channelRef.current = channel;

      const oppId = p1 === profile?.id ? p2 : p1;
      void supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', oppId)
        .single()
        .then(({ data, error }) => {
          if (error) return;
          if (!data) return;
          setOpponent({
            id: (data as { id: string }).id,
            username: (data as { username: string }).username,
            avatar_url: (data as { avatar_url?: string }).avatar_url,
          });
        });
    },
    [profile?.id]
  );

  const broadcastAnswer = useCallback(
    (answer: BattleAnswer) => {
      if (!channelRef.current || !battleId) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'answer',
        payload: { userId: profile?.id, ...answer },
      });
    },
    [battleId, profile?.id]
  );

  const broadcastFinish = useCallback(
    (finalScore: number) => {
      if (!channelRef.current || !battleId) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'finish',
        payload: { userId: profile?.id, finalScore },
      });
    },
    [battleId, profile?.id]
  );

  const onMatched = useCallback(
    async (matchData: MatchedPayload) => {
      setPhase('matched');

      const bId = matchData.battle_id;
      const p1 = matchData.player_one;
      const p2 = matchData.player_two;

      if (!bId || !p1 || !p2) {
        toast.error('Failed to create battle');
        setPhase('idle');
        return;
      }

      setBattleId(bId);
      subscribeBattle(bId, p1, p2);

      const pool = (allQuestions ?? []) as QuizQuestion[];
      setQuestions(pickQuestions(pool, bId, 7));
      setCurrentQ(0);
      setPhase('playing');
    },
    [allQuestions, subscribeBattle]
  );

  const findMatch = useCallback(async () => {
    if (!profile) return;

    setPhase('searching');
    setMyScore(0);
    setOpponentScore(0);
    setMyAnswers([]);
    setOpponentAnswers([]);
    setOpponentProgress(0);

    const { data, error } = await supabase.rpc('join_battle_queue', { p_mode: '1v1' });
    if (error) {
      toast.error(error.message);
      setPhase('idle');
      return;
    }

    const result = (data ?? null) as unknown as JoinQueueResult | null;
    if (!result || 'error' in result) {
      toast.error(result && 'error' in result ? result.error : 'Failed to join queue');
      setPhase('idle');
      return;
    }

    if (result.status === 'waiting') {
      const queueChan = supabase.channel(`battle:queue:${profile.id}`, {
        config: { broadcast: { self: false } },
      });

      queueChan.on('broadcast', { event: 'matched' }, (payload) => {
        const p = payload.payload as unknown as Partial<MatchedPayload>;
        if (!p.battle_id || !p.player_one || !p.player_two) return;
        void leaveQueue();
        void onMatched({ battle_id: p.battle_id, player_one: p.player_one, player_two: p.player_two });
      });

      queueChan.subscribe();
      queueChannelRef.current = queueChan;

      pollTimerRef.current = setInterval(async () => {
        const { data: battles, error: battlesError } = await supabase
          .from('quiz_battles')
          .select('*')
          .or(`player_one.eq.${profile.id},player_two.eq.${profile.id}`)
          .eq('status', 'playing')
          .order('created_at', { ascending: false })
          .limit(1);
        if (battlesError) return;
        const rows = (battles ?? []) as unknown as Array<{ id: string; player_one: string; player_two: string }>;
        if (rows.length > 0) {
          const b = rows[0];
          void leaveQueue();
          void onMatched({ battle_id: b.id, player_one: b.player_one, player_two: b.player_two });
        }
      }, 3000);

      window.__quizgoal_queue_cleanup = () => {
        void leaveQueue();
      };
    } else if (result.status === 'matched') {
      const notifyChan = supabase.channel(`battle:queue:${result.player_one}`, {
        config: { broadcast: { self: false } },
      });

      notifyChan.subscribe(() => {
        void notifyChan.send({
          type: 'broadcast',
          event: 'matched',
          payload: { battle_id: result.battle_id, player_one: result.player_one, player_two: result.player_two },
        });
        supabase.removeChannel(notifyChan);
      });

      await onMatched({ battle_id: result.battle_id, player_one: result.player_one, player_two: result.player_two });
    }
  }, [leaveQueue, onMatched, profile]);

  const submitAnswer = useCallback(
    async (questionId: string, selectedIndex: number, responseTimeMs: number, questionIndex: number) => {
      if (!battleId) return null;

      const { data, error } = await supabase.rpc('submit_quiz_answer', {
        p_battle_id: battleId,
        p_question_id: questionId,
        p_selected_index: selectedIndex,
        p_response_time_ms: responseTimeMs,
      });
      if (error) {
        console.error('submit_quiz_answer failed:', error.message);
        return null;
      }

      const result = (data ?? null) as unknown as { is_correct?: boolean; points?: number };
      const isCorrect = Boolean(result?.is_correct);
      const points = Number(result?.points || 0);

      const answer: BattleAnswer = { questionIndex, selectedIndex, isCorrect, points, responseTimeMs };

      setMyAnswers((prev) => [...prev, answer]);
      setMyScore((prev) => prev + points);
      broadcastAnswer(answer);

      return answer;
    },
    [battleId, broadcastAnswer]
  );

  const finishBattle = useCallback(async () => {
    if (!battleId) return null;
    const { data, error } = await supabase.rpc('finish_battle', { p_battle_id: battleId });
    if (error) console.error('finish_battle failed:', error.message);
    broadcastFinish(myScore);
    unsubscribeBattle();
    setPhase('result');
    return data ?? null;
  }, [battleId, myScore, broadcastFinish, unsubscribeBattle]);

  const joinBattle = useCallback(
    async (id: string) => {
      const { data, error } = await supabase.from('quiz_battles').select('*').eq('id', id).single();
      if (error || !data) {
        toast.error('Battle not found');
        return;
      }

      const battle = data as unknown as { player_one: string; player_two: string };
      const p1 = battle.player_one;
      const p2 = battle.player_two;

      setBattleId(id);
      setMyScore(0);
      setOpponentScore(0);
      setMyAnswers([]);
      setOpponentAnswers([]);
      setOpponentProgress(0);

      subscribeBattle(id, p1, p2);

      const pool = (allQuestions ?? []) as QuizQuestion[];
      setQuestions(pickQuestions(pool, id, 7));
      setCurrentQ(0);
      setPhase('playing');
    },
    [allQuestions, subscribeBattle]
  );

  const leaveBattle = useCallback(() => {
    const cleanup = window.__quizgoal_queue_cleanup;
    if (cleanup) {
      cleanup();
      window.__quizgoal_queue_cleanup = null;
    }

    void leaveQueue();
    unsubscribeBattle();

    setPhase('idle');
    setBattleId(null);
    setOpponent(null);
  }, [leaveQueue, unsubscribeBattle]);

  return {
    phase,
    battleId,
    opponent,
    questions,
    currentQ,
    myScore,
    opponentScore,
    myAnswers,
    opponentAnswers,
    opponentProgress,
    setCurrentQ,
    findMatch,
    joinBattle,
    submitAnswer,
    finishBattle,
    leaveBattle,
  };
}

