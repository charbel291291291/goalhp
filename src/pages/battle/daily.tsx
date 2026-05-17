import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { sampleQuestions } from '../../lib/sampleQuestions';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/useAuth';
import toast from 'react-hot-toast';
import type { QuizQuestion } from '../../types';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function getDailyQuestions(): QuizQuestion[] {
  const today = new Date().toDateString();
  const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...sampleQuestions].sort(
    (a, b) => ((seed + a.id.charCodeAt(0)) % 10) - ((seed + b.id.charCodeAt(0)) % 10)
  );
  return shuffled.slice(0, 7);
}

export default function DailyChallenge() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { refreshProfile } = useAuth();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [answers, setAnswers] = useState<{ correct: boolean; points: number }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [phase, setPhase] = useState<'start' | 'playing' | 'result'>('start');
  const [pointsSaved, setPointsSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const perfect = answers.length > 0 && answers.every((a) => a.correct);
  const bonus = phase === 'result' && perfect ? 500 : 0;
  const total = Math.max(0, score + bonus);

  const startGame = () => {
    setQuestions(getDailyQuestions());
    setCurrentQ(0);
    setScore(0);
    setStreak(0);
    setAnswers([]);
    setTimeLeft(10);
    setSelected(null);
    setShowCorrect(false);
    setPointsSaved(false);
    setPhase('playing');
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
      }
    }, 1500);
  }, [currentQ, questions.length]);

  const handleTimeout = useCallback(() => {
    if (showCorrect) return;
    setShowCorrect(true);
    setStreak(0);
    setAnswers((prev) => [...prev, { correct: false, points: 0 }]);
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
  }, [phase, currentQ, showCorrect, handleTimeout]);

  const handleAnswer = (index: number) => {
    if (showCorrect) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(index);
    setShowCorrect(true);

    const q = questions[currentQ];
    const correct = index === q.correct_answer_index;

    let points = 0;
    if (correct) {
      points = 100 + timeLeft * 10;
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak >= 3) points += 50;
      setScore((prev) => prev + points);
    } else {
      setStreak(0);
    }

    setAnswers((prev) => [...prev, { correct, points }]);
    advance();
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (phase !== 'result') return;
      if (pointsSaved || total <= 0) return;

      await Promise.resolve();
      if (cancelled) return;

      setPointsSaved(true);
      supabase.rpc('add_quiz_points', { p_points: total }).then(({ error }) => {
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
  }, [lang, phase, pointsSaved, refreshProfile, total]);

  if (phase === 'start') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl">🔥</motion.div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('battle.daily')}</h1>
          <p className="text-white/50">{lang === 'ar' ? 'أسئلة جديدة كل يوم' : 'New questions every day'}</p>
          <p className="text-xs text-gold mt-2">{lang === 'ar' ? 'تحدي اليوم: ' : "Today's Challenge: "}{new Date().toLocaleDateString()}</p>
        </div>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-gradient mb-1">{lang === 'ar' ? 'جائزة اليوم' : "Today's Prize"}</div>
          <div className="text-sm text-white/50">{lang === 'ar' ? '500 نقطة إضافية للتحدي الكامل' : '500 bonus points for perfect run'}</div>
        </Card>
        <Button variant="primary" size="lg" onClick={startGame}>
          {lang === 'ar' ? 'ابدأ التحدي' : 'Start Challenge'}
        </Button>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl">
          {perfect ? '🏆' : score > 500 ? '🎉' : '💪'}
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {perfect ? (lang === 'ar' ? 'تحدي كامل!' : 'Perfect!') + ' +500' : score > 500 ? t('battle.win') : t('battle.lose')}
          </h1>
          <div className="text-5xl font-black text-gold mb-1">{total.toLocaleString()}</div>
          <div className="text-xs text-white/40">{lang === 'ar' ? 'نقاط التحدي اليومي' : 'Daily Challenge Score'}</div>
        </div>
        <Button variant="primary" onClick={startGame}>
          {lang === 'ar' ? 'العب مرة أخرى' : 'Play Again'}
        </Button>
        <Button variant="ghost" onClick={() => navigate('/battle')}>
          {lang === 'ar' ? 'رجوع' : 'Back'}
        </Button>
      </div>
    );
  }

  const q = questions[currentQ];
  if (!q) return null;
  const answersList = lang === 'ar' ? q.answers_ar : q.answers_en;

  return (
    <div className="min-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gold font-bold uppercase tracking-wider">🔥 {t('battle.daily')}</div>
        <div className="text-lg font-bold text-electric">{score.toLocaleString()}</div>
      </div>

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
          <span className="text-white/40">{currentQ + 1}/7</span>
        </div>
      </div>

      {streak >= 2 && (
        <div className="text-center mb-2 text-neon text-sm animate-pulse">🔥 {streak}x {t('battle.streak')}</div>
      )}

      <motion.div key={currentQ} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
        <h2 className="text-xl font-bold mb-6 leading-relaxed">{lang === 'ar' ? q.question_ar : q.question_en}</h2>
        <div className="space-y-3">
          {answersList.map((answer, i) => {
            let bg = 'bg-white/5 hover:bg-white/10';
            if (showCorrect) {
              if (i === q.correct_answer_index) bg = 'bg-neon/20 border-neon';
              else if (i === selected) bg = 'bg-red-500/20 border-red-500';
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
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
