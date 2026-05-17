import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/common/Button';
import { sampleQuestions } from '../../lib/sampleQuestions';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/useAuth';
import { shareOnWhatsApp, getBattleShareText } from '../../lib/shareUtils';
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

function shuffleArray<T>(arr: T[], seed: string): T[] {
  const a = [...arr];
  const rnd = seededRng(seed);
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SPEED_BONUS_THRESHOLDS = [
  { time: 3, multiplier: 2, label: '⚡', color: 'text-yellow-400' },
  { time: 5, multiplier: 1.5, label: '🔥', color: 'text-orange-400' },
  { time: 7, multiplier: 1.2, label: '💨', color: 'text-blue-400' },
];

type SoloAnswer = { correct: boolean; points: number; answer: number; timeLeft: number };

export default function SoloBattle() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { refreshProfile } = useAuth();

  const [phase, setPhase] = useState<'start' | 'playing' | 'result'>('start');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [answers, setAnswers] = useState<SoloAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [pointsSaved, setPointsSaved] = useState(false);
  const [showWinCard, setShowWinCard] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const correctCount = answers.reduce((sum, a) => sum + (a.correct ? 1 : 0), 0);
  const perfectRun = phase === 'result' && answers.length === 7 && answers.every((a) => a.correct);
  const winBonus = phase === 'result' && correctCount >= 4 ? 150 : 0;
  const perfectBonus = phase === 'result' && perfectRun ? 300 : 0;
  const totalScore = Math.max(0, score + winBonus + perfectBonus);

  const confetti = useMemo(() => {
    const rnd = seededRng('solo-confetti');
    return Array.from({ length: 12 }, (_, i) => ({
      dx: (rnd() - 0.5) * 200,
      dy: rnd() * 200 + 50,
      delay: i * 0.1,
    }));
  }, []);

  const startGame = () => {
    const seed = `solo:${new Date().toDateString()}`;
    const picked = shuffleArray(sampleQuestions, seed).slice(0, 7) as QuizQuestion[];

    setQuestions(picked);
    setCurrentQ(0);
    setScore(0);
    setStreak(0);
    setAnswers([]);
    setSelected(null);
    setShowCorrect(false);
    setPointsSaved(false);
    setTimeLeft(10);
    setPhase('playing');
    setShowWinCard(false);
  };

  const getSpeedMultiplier = (time: number) => {
    for (const t of SPEED_BONUS_THRESHOLDS) {
      if (time <= t.time) return t;
    }
    return null;
  };

  const advance = useCallback(() => {
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ((prev) => prev + 1);
        setTimeLeft(10);
        setSelected(null);
        setShowCorrect(false);
      } else {
        setPhase('result');
        setTimeout(() => setShowWinCard(true), 300);
      }
    }, 1500);
  }, [currentQ, questions.length]);

  const handleTimeout = useCallback(() => {
    if (showCorrect) return;
    setShowCorrect(true);
    setStreak(0);
    setAnswers((prev) => [...prev, { correct: false, points: 0, answer: -1, timeLeft: 0 }]);
    advance();
  }, [advance, showCorrect]);

  useEffect(() => {
    if (phase !== 'playing' || showCorrect) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, showCorrect, handleTimeout]);

  const handleAnswer = (index: number) => {
    if (showCorrect) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(index);
    setShowCorrect(true);

    const q = questions[currentQ];
    const correct = index === q.correct_answer_index;

    let points = 0;
    if (correct) {
      const basePoints = 100;
      const speedBonus = timeLeft * 10;
      const threshold = getSpeedMultiplier(timeLeft);
      const mult = threshold ? threshold.multiplier : 1;
      points = Math.round((basePoints + speedBonus) * mult);

      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak >= 3) {
        points = Math.round(points * 1.3);
        toast.success(lang === 'ar' ? '🔥 متتالية 3!' : '🔥 3x Streak!', { duration: 1000 });
      }

      setScore((prev) => prev + points);
    } else {
      setStreak(0);
    }

    setAnswers((prev) => [...prev, { correct, points, answer: index, timeLeft }]);
    advance();
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (phase !== 'result') return;
      if (pointsSaved || totalScore <= 0) return;

      await Promise.resolve();
      if (cancelled) return;

      setPointsSaved(true);
      supabase.rpc('add_quiz_points', { p_points: totalScore }).then(({ error }) => {
        if (error) toast.error(lang === 'ar' ? 'تعذر حفظ النقاط' : 'Could not save points');
        else refreshProfile();
      });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [lang, phase, pointsSaved, refreshProfile, totalScore]);

  if (phase === 'start') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-7xl mb-2 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]"
        >
          ⚡
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">{t('battle.solo')}</h1>
          <p className="text-white/50 text-sm">
            {lang === 'ar'
              ? '7 أسئلة، 10 ثوانٍ لكل سؤال. أجب بسرعة لتحصل على نقاط إضافية!'
              : '7 questions, 10 seconds each. Answer fast for bonus points!'}
          </p>
        </div>
        <div className="flex gap-2 text-xs text-white/40">
          <span className="px-3 py-1.5 rounded-full bg-white/5">⚡ 3s = 2x</span>
          <span className="px-3 py-1.5 rounded-full bg-white/5">🔥 5s = 1.5x</span>
          <span className="px-3 py-1.5 rounded-full bg-white/5">💨 7s = 1.2x</span>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="primary"
            size="lg"
            onClick={startGame}
            className="shadow-[0_0_30px_rgba(37,99,235,0.3)]"
          >
            {lang === 'ar' ? 'ابدأ التحدي' : 'Start Battle'}
          </Button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'result') {
    if (showWinCard) {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12 }}
            className="relative"
          >
            <div className="text-8xl mb-2 drop-shadow-[0_0_40px_rgba(255,215,0,0.5)]">
              {perfectRun ? '🏆' : correctCount >= 5 ? '🎉' : '💪'}
            </div>
            {perfectRun && (
              <div className="absolute inset-0 pointer-events-none">
                {confetti.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ x: c.dx, y: c.dy, opacity: 0, scale: 0 }}
                    transition={{ duration: 1.5, delay: c.delay }}
                    className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: ['#FFD700', '#00FF88', '#3B82F6', '#FF6B6B', '#A78BFA'][i % 5] }}
                  />
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-3xl font-bold mb-1">
              {perfectRun ? t('battle.perfect') : correctCount >= 5 ? t('battle.win') : correctCount >= 3 ? t('battle.draw') : t('battle.lose')}
            </h1>
            <div className="text-sm text-white/50 mb-3">
              {correctCount}/7 {lang === 'ar' ? 'صحيحة' : 'correct'}
              {streak >= 3 && ` · 🔥 ${streak}x ${t('battle.streak')}`}
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="text-6xl font-black text-gold drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]"
          >
            {totalScore.toLocaleString()}
            <div className="text-xs text-white/30 font-normal">{t('battle.results')}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="w-full max-w-sm space-y-1.5">
            {answers.map((a, i) => (
              <motion.div
                key={i}
                initial={{ x: a.correct ? 20 : -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className={`flex justify-between items-center px-4 py-2 rounded-xl text-sm ${
                  a.correct ? 'bg-neon/10 text-neon' : 'bg-red-500/10 text-red-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{a.correct ? '✅' : '❌'}</span>
                  <span>{lang === 'ar' ? `سؤال ${i + 1}` : `Q${i + 1}`}</span>
                </div>
                <span className="font-bold">{a.correct ? `+${a.points}` : '0'}</span>
              </motion.div>
            ))}
            {winBonus > 0 && (
              <div className="flex justify-between items-center px-4 py-2 rounded-xl text-sm bg-electric/10 text-electric">
                <span>{lang === 'ar' ? 'مكافأة الفوز' : 'Win Bonus'}</span>
                <span className="font-bold">+{winBonus}</span>
              </div>
            )}
            {perfectBonus > 0 && (
              <div className="flex justify-between items-center px-4 py-2 rounded-xl text-sm bg-gold/10 text-gold">
                <span>{lang === 'ar' ? 'تحدي كامل!' : 'Perfect Bonus!'}</span>
                <span className="font-bold">+{perfectBonus}</span>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex gap-3 flex-wrap justify-center">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button variant="primary" onClick={startGame} className="shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                {lang === 'ar' ? 'العب مرة أخرى' : 'Play Again'}
              </Button>
            </motion.div>
            <Button variant="ghost" onClick={() => shareOnWhatsApp(getBattleShareText(totalScore, lang), window.location.href)}>
              📤 {t('battle.share')}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/battle')}>
              {lang === 'ar' ? 'رجوع' : 'Back'}
            </Button>
          </motion.div>
        </div>
      );
    }

    return <div className="min-h-[80vh]" />;
  }

  const q = questions[currentQ];
  if (!q) return null;

  const answersList = lang === 'ar' ? q.answers_ar : q.answers_en;
  const speedBonus = getSpeedMultiplier(timeLeft);

  return (
    <div className="min-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < currentQ
                  ? answers[i]?.correct
                    ? 'bg-neon'
                    : 'bg-red-500'
                  : i === currentQ
                    ? 'bg-electric scale-125 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                    : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {streak >= 2 && (
            <motion.span key={streak} initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-neon text-sm font-bold animate-pulse">
              🔥 {streak}x
            </motion.span>
          )}
          <span className="text-lg font-bold text-gold">{score.toLocaleString()}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="w-full bg-white/5 rounded-full h-2.5 mb-1 overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors ${
              timeLeft <= 3 ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : timeLeft <= 5 ? 'bg-yellow-500' : 'bg-electric'
            }`}
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 10) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold ${timeLeft <= 3 ? 'text-red-400' : 'text-white/40'}`}>{timeLeft}s</span>
          {speedBonus && <span className={`text-xs font-bold ${speedBonus.color}`}>{speedBonus.label} {speedBonus.multiplier}x</span>}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex-1">
          <h2 className="text-lg font-bold mb-6 leading-relaxed min-h-[3em]">{lang === 'ar' ? q.question_ar : q.question_en}</h2>

          <div className="space-y-2.5">
            {answersList.map((answer, i) => {
              let bg = 'bg-white/5 hover:bg-white/10 border-white/10';
              let border = 'border-white/10';
              if (showCorrect) {
                if (i === q.correct_answer_index) { bg = 'bg-neon/15'; border = 'border-neon'; }
                else if (i === selected) { bg = 'bg-red-500/15'; border = 'border-red-500'; }
                else { bg = 'bg-white/3'; border = 'border-white/5'; }
              }
              return (
                <motion.button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showCorrect}
                  whileHover={!showCorrect ? { scale: 1.02 } : {}}
                  whileTap={!showCorrect ? { scale: 0.98 } : {}}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${bg} ${border} ${selected === i ? 'shadow-lg' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selected === i ? 'bg-electric/20 text-electric' : 'bg-white/10 text-white/50'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm">{answer}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

