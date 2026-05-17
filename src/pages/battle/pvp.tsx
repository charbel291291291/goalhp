import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/useAuth';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { sampleQuestions } from '../../lib/sampleQuestions';
import { supabase } from '../../lib/supabase';
import { useRealtimeBattle } from '../../lib/useRealtimeBattle';
import toast from 'react-hot-toast';
import type { QuizQuestion } from '../../types';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function stableHashNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededRng(seed: string) {
  let s = stableHashNumber(seed) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function shuffleSeeded<T>(arr: T[], seed: string): T[] {
  const a = [...arr];
  const rnd = seededRng(seed);
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Opponent = {
  name: string;
  flag: string;
  isBot: boolean;
  username?: string;
  avatar_url?: string;
};

type AnswerRow = { correct: boolean; points: number };

const BOT_NAMES = ['⚡ QuizBot', '🤖 GoalBot', '🎯 WorldCupBot', '🏆 ChampBot', '🔥 UltraBot'];
const BOT_FLAGS = ['🇧🇷', '🇦🇷', '🇵🇹', '🇫🇷', '🇩🇪'];

export default function PvpBattle() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { profile, refreshProfile } = useAuth();

  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get('mode') || 'bot';
  const isPvP = mode === '1v1';
  const isFriend = mode === 'friend';
  const friendBattleId = searchParams.get('battle_id');

  const realtime = useRealtimeBattle();

  const [phase, setPhase] = useState<'select' | 'waiting' | 'playing' | 'result'>(isFriend ? 'waiting' : 'select');
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selected, setSelected] = useState<number | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [myAnswers, setMyAnswers] = useState<AnswerRow[]>([]);
  const [opponentAnswers, setOpponentAnswers] = useState<AnswerRow[]>([]);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [pointsSaved, setPointsSaved] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(new Date().getTime());

  const botName = opponent?.name || opponent?.username || 'Bot';
  const botFlag = opponent?.flag || '🤖';

  // Friend mode: join existing battle by ID
  useEffect(() => {
    if (isFriend && friendBattleId) {
      void realtime.joinBattle(friendBattleId);
    }
  }, [friendBattleId, isFriend, realtime]);

  // Sync real-time state for 1v1 / friend
  useEffect(() => {
    if (!isPvP && !isFriend) return;

    let cancelled = false;

    async function run() {
      await Promise.resolve();
      if (cancelled) return;

      if (realtime.phase === 'searching') setPhase('waiting');
      else if (realtime.phase === 'playing') {
        setQuestions(realtime.questions);
        setCurrentQ(realtime.currentQ);
        setMyScore(realtime.myScore);
        setOpponentScore(realtime.opponentScore);
        setMyAnswers(realtime.myAnswers.map((a) => ({ correct: a.isCorrect, points: a.points })));
        setOpponentAnswers(realtime.opponentAnswers.map((a) => ({ correct: a.isCorrect, points: a.points })));
        setOpponentProgress(realtime.opponentProgress);
        setPhase('playing');
      } else if (realtime.phase === 'result') {
        setMyScore(realtime.myScore);
        setOpponentScore(realtime.opponentScore);
        setMyAnswers(realtime.myAnswers.map((a) => ({ correct: a.isCorrect, points: a.points })));
        setOpponentAnswers(realtime.opponentAnswers.map((a) => ({ correct: a.isCorrect, points: a.points })));
        setPhase('result');
      } else if (realtime.phase === 'idle') {
        if (phase !== 'result') setPhase('select');
      }

      if (realtime.opponent) {
        setOpponent({ name: realtime.opponent.username, flag: '', isBot: false, ...realtime.opponent });
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [isFriend, isPvP, phase, realtime]);

  const startGame = useCallback(() => {
    const seed = `pvp:${profile?.id ?? 'anon'}:${mode}`;
    const picked = shuffleSeeded(sampleQuestions, seed).slice(0, 7) as QuizQuestion[];

    setQuestions(picked);
    setCurrentQ(0);
    setMyScore(0);
    setOpponentScore(0);
    setMyAnswers([]);
    setOpponentAnswers([]);
    setOpponentProgress(0);
    setSelected(null);
    setShowCorrect(false);
    setPointsSaved(false);
    setTimeLeft(10);
    setPhase('playing');
    startTimeRef.current = new Date().getTime();
  }, [mode, profile?.id]);

  const findOpponent = useCallback(() => {
    if (isPvP) {
      void realtime.findMatch();
      return;
    }

    const botIdx = stableHashNumber(`${profile?.id ?? 'anon'}:${new Date().toDateString()}`) % BOT_NAMES.length;
    setOpponent({ name: BOT_NAMES[botIdx], flag: BOT_FLAGS[botIdx], isBot: true });
    startGame();
  }, [isPvP, profile?.id, realtime, startGame]);

  const botAnswer = useCallback(
    (q: QuizQuestion) => {
      if (!opponent?.isBot) return;
      const rnd = seededRng(`bot:${opponent.name}:${q.id}:${startTimeRef.current}`);
      const thinkTime = 2000 + Math.floor(rnd() * 5000);
      const isCorrect = rnd() < 0.6;

      setTimeout(() => {
        const pts = isCorrect ? 100 + Math.floor(rnd() * 80) : 0;
        setOpponentAnswers((prev) => [...prev, { correct: isCorrect, points: pts }]);
        setOpponentScore((prev) => prev + pts);
        setOpponentProgress((prev) => prev + 1);
      }, thinkTime);
    },
    [opponent]
  );

  const currentQuestion = questions[currentQ] || null;
  const answersList = useMemo(() => {
    if (!currentQuestion) return [];
    return (lang === 'ar' ? currentQuestion.answers_ar : currentQuestion.answers_en) as string[];
  }, [currentQuestion, lang]);

  useEffect(() => {
    if (phase !== 'playing' || showCorrect) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setShowCorrect(true);
          setMyAnswers((a) => [...a, { correct: false, points: 0 }]);
          setOpponentProgress((p) => p + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, showCorrect]);

  const advance = useCallback(() => {
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ((prev) => prev + 1);
        setSelected(null);
        setShowCorrect(false);
        setTimeLeft(10);
      } else {
        setPhase('result');
      }
    }, 1200);
  }, [currentQ, questions.length]);

  const handleAnswer = useCallback(
    async (index: number) => {
      if (!currentQuestion) return;
      if (showCorrect) return;

      if (timerRef.current) clearInterval(timerRef.current);
      setSelected(index);
      setShowCorrect(true);

      if (isPvP || isFriend) {
        const responseTimeMs = Math.max(0, new Date().getTime() - startTimeRef.current);
        await realtime.submitAnswer(currentQuestion.id, index, responseTimeMs, currentQ);
        advance();
        return;
      }

      const correct = index === currentQuestion.correct_answer_index;
      const points = correct ? 100 + timeLeft * 10 : 0;
      setMyAnswers((prev) => [...prev, { correct, points }]);
      setMyScore((prev) => prev + points);

      botAnswer(currentQuestion);
      advance();
    },
    [advance, botAnswer, currentQ, currentQuestion, isFriend, isPvP, realtime, showCorrect, timeLeft]
  );

  const won = phase === 'result' ? myScore > opponentScore : false;
  const draw = phase === 'result' ? myScore === opponentScore : false;
  const winBonus = phase === 'result' && won ? 150 : 0;
  const totalPoints = Math.max(0, myScore + winBonus);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (phase !== 'result') return;
      if (pointsSaved || totalPoints <= 0) return;

      await Promise.resolve();
      if (cancelled) return;

      setPointsSaved(true);
      supabase.rpc('add_quiz_points', { p_points: totalPoints }).then(({ error }) => {
        if (error) {
          toast.error(lang === 'ar' ? 'تعذر حفظ النقاط' : 'Could not save points');
        } else {
          refreshProfile();
          toast.success(lang === 'ar' ? 'تمت إضافة النقاط' : 'Points added to profile');
        }
      });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [lang, phase, pointsSaved, refreshProfile, totalPoints]);

  if (phase === 'select') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl">⚔️</motion.div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{isPvP ? t('battle.pvp') : t('battle.solo')}</h1>
          <p className="text-white/50">{lang === 'ar' ? 'اختر وضع اللعب' : 'Choose your battle mode'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" size="lg" onClick={findOpponent}>
            {lang === 'ar' ? 'ابحث عن خصم' : 'Find Opponent'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/battle')}>
            {lang === 'ar' ? 'رجوع' : 'Back'}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-6xl">
          {isFriend ? '👥' : '🔍'}
        </motion.div>
        <h2 className="text-2xl font-bold">
          {isFriend ? (lang === 'ar' ? 'في انتظار الصديق...' : 'Waiting for friend...') : (lang === 'ar' ? 'جاري البحث عن خصم...' : 'Searching for opponent...')}
        </h2>
        <p className="text-white/50">
          {isFriend ? (lang === 'ar' ? 'سيبدأ التحدي بمجرد انضمام الصديق' : 'Battle will start when friend joins') : (lang === 'ar' ? 'سيتم المطابقة قريباً' : 'Matchmaking in progress')}
        </p>
        <Button variant="ghost" onClick={() => { realtime.leaveBattle(); navigate('/battle'); }}>
          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
        </Button>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl">
          {won ? '🏆' : draw ? '🤝' : '💪'}
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {won ? t('battle.win') : draw ? (lang === 'ar' ? 'تعادل' : 'Draw!') : t('battle.lose')}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full max-w-xs">
          <div className="text-center">
            <div className="text-3xl mb-1">{profile?.username?.[0] || 'U'}</div>
            <div className="text-3xl font-black text-electric">{myScore.toLocaleString()}</div>
            <div className="text-xs text-white/50">{profile?.username || 'You'}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">{botFlag || opponent?.username?.[0] || 'O'}</div>
            <div className="text-3xl font-black text-gold">{opponentScore.toLocaleString()}</div>
            <div className="text-xs text-white/50">{botName || opponent?.username || 'Opponent'}</div>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-1">
          {myAnswers.map((a, i) => (
            <div key={i} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-white/5">
              <span>{lang === 'ar' ? `سؤال ${i + 1}` : `Q${i + 1}`}: {a.correct ? '✅' : '❌'} +{a.points}</span>
              <span className="text-white/40">vs {opponentAnswers[i]?.correct ? '✅' : '❌'} +{opponentAnswers[i]?.points ?? 0}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="primary" onClick={findOpponent}>
            {lang === 'ar' ? 'العب مرة أخرى' : 'Play Again'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/battle')}>
            {lang === 'ar' ? 'رجوع' : 'Back'}
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gold font-bold uppercase tracking-wider">⚔️ {t('battle.pvp')}</div>
        <div className="text-xs text-white/40">{currentQ + 1}/7</div>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-electric">{profile?.username || 'You'}: {myScore}</div>
          <div className="text-sm font-bold text-gold">{botName}: {opponentScore}</div>
        </div>
        <div className="text-[10px] text-white/30 mt-1">
          {lang === 'ar' ? 'تقدم الخصم' : 'Opponent progress'}: {opponentProgress}/7
        </div>
      </Card>

      <div className="mb-4">
        <div className="w-full bg-white/5 rounded-full h-2 mb-1">
          <motion.div
            className={`h-2 rounded-full ${timeLeft <= 3 ? 'bg-red-500' : 'bg-gold'}`}
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 10) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className={timeLeft <= 3 ? 'text-red-400 font-bold' : 'text-white/40'}>{timeLeft}s</span>
          <span className="text-white/40">{botFlag}</span>
        </div>
      </div>

      <motion.div key={currentQ} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
        <h2 className="text-xl font-bold mb-6 leading-relaxed">{lang === 'ar' ? currentQuestion.question_ar : currentQuestion.question_en}</h2>
        <div className="space-y-3">
          {answersList.map((answer, i) => {
            let bg = 'bg-white/5 hover:bg-white/10';
            if (showCorrect) {
              if (i === currentQuestion.correct_answer_index) bg = 'bg-neon/20 border-neon';
              else if (i === selected) bg = 'bg-red-500/20 border-red-500';
            }
            return (
              <button
                key={i}
                onClick={() => { void handleAnswer(i); }}
                disabled={showCorrect}
                className={`w-full text-left p-4 rounded-xl border border-white/10 transition-all duration-200 ${bg}`}
              >
                <span className="text-sm">{answer}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
