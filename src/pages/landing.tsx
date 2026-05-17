import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/useAuth';
import { useUI } from '../store/useUI';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { allTeams, groups } from '../lib/teams';
import { useEffect, useState } from 'react';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function CountdownToMatch() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const target = new Date('2026-06-11T16:00:00+03:00');
    const update = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Tournament started!'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${d}d ${h}h ${m}m`);
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, []);
  return <span>{timeLeft}</span>;
}

export default function Landing() {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useUI();
  const { user } = useAuth();

  if (user) {
    navigate('/home');
    return null;
  }

  const lang = i18n.language as 'en' | 'ar';
  const isRtl = lang === 'ar';

  return (
    <div className="min-h-screen stadium-night overflow-hidden">
      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="football-particle">⚽</div>
        <div className="football-particle">🏆</div>
        <div className="football-particle">⚽</div>
        <div className="football-particle">🌟</div>
        <div className="football-particle">⚽</div>
        <div className="football-particle">🏆</div>
      </div>

      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="glass px-3 py-1.5 text-sm text-white/60 hover:text-white transition-all hover:bg-white/[0.08]"
        >
          {language === 'en' ? 'عربي' : 'English'}
        </button>
      </div>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">
        {/* Background glow lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-electric/20 to-transparent animate-glow-line" />
          <div className="absolute top-2/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon/15 to-transparent animate-glow-line" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent animate-glow-line" style={{ animationDelay: '3s' }} />
          <div className="absolute inset-0 hero-glow" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          {/* Animated ball */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-electric via-neon to-gold flex items-center justify-center text-4xl shadow-2xl animate-football-float worldcup-glow">
              ⚽
            </div>
          </div>

          <div className="text-[10px] text-white/30 font-semibold tracking-[0.3em] uppercase mb-4">
            {isRtl ? 'eyedeaz من' : 'by eyedeaz'}
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
            <span className="text-gradient">QuizGoal</span>
            <span className="text-white/20"> 2026</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 mb-3 font-light max-w-md mx-auto">
            {t('app.tagline')}
          </p>
          <p className="text-base text-gold/50 mb-10 font-arabic">
            تحدّى، توقّع، شارك، واربح
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <Button variant="primary" size="lg" onClick={() => navigate('/signup')} className="shadow-[0_0_30px_rgba(37,99,235,0.3)]">
              {t('cta.start')}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/poster/generator')}>
              {t('cta.createPoster')}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/login')}>
              {t('auth.login')}
            </Button>
          </div>

          {/* Countdown */}
          <div className="glass inline-block px-6 py-3 rounded-2xl shadow-lg">
            <div className="text-[10px] text-white/30 uppercase tracking-[0.15em] mb-1">
              {isRtl ? 'العد التنازلي لأول مباراة' : 'Countdown to First Match'}
            </div>
            <div className="text-2xl font-bold text-gold drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <CountdownToMatch />
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            <span className="text-gradient">{isRtl ? 'كيف تعمل؟' : 'How it Works'}</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { step: '1', en: 'Choose your national team', ar: 'اختر منتخبك', icon: '🏳️' },
              { step: '2', en: 'Play quiz battles', ar: 'العب تحديات كروية', icon: '⚔️' },
              { step: '3', en: 'Predict match results', ar: 'توقّع نتائج المباريات', icon: '🔮' },
              { step: '4', en: 'Create fan posters', ar: 'اصنع بوسترات تشجيع', icon: '🎨' },
              { step: '5', en: 'Earn points & rewards', ar: 'اربح النقاط والجوائز', icon: '🎁' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="stadium-card text-center group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                <div className="w-8 h-8 rounded-full bg-electric/15 flex items-center justify-center mx-auto mb-2 text-xs font-bold text-electric">
                  {item.step}
                </div>
                <p className="text-xs text-white/60 leading-tight">{lang === 'ar' ? item.ar : item.en}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Teams Carousel */}
      <section className="relative z-10 py-20 px-4 overflow-hidden">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          <span className="text-gradient-blue">{isRtl ? '48 منتخباً مشاركاً' : '48 Participating Teams'}</span>
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
          {allTeams.map((team) => (
            <div key={team.fifa_code} className="flex-shrink-0 snap-center">
              <div
                className="w-20 h-24 rounded-2xl flex flex-col items-center justify-center gap-1 p-2 transition-all duration-300 hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${team.primary_color}22, ${team.secondary_color}11)`, border: `1px solid ${team.primary_color}44` }}
              >
                <span className="text-2xl drop-shadow-lg">{team.flag_emoji}</span>
                <span className="text-[9px] text-white/60 text-center leading-tight font-medium">
                  {lang === 'ar' ? team.name_ar : team.name_en}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Groups */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            <span className="text-gradient-gold">{isRtl ? 'المجموعات' : 'Groups'}</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            {groups.map((group) => (
              <Card key={group.name} className="p-4">
                <div className="font-bold text-sm text-electric mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-electric/15 flex items-center justify-center text-[10px]">🏆</span>
                  Group {group.name}
                </div>
                <div className="space-y-1.5">
                  {group.teams.map((team) => (
                    <div key={team.fifa_code} className="flex items-center gap-2 text-xs">
                      <span className="text-base">{team.flag_emoji}</span>
                      <span className="text-white/60">{lang === 'ar' ? team.name_ar : team.name_en}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Legal */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="glass px-6 py-4 rounded-2xl">
            <p className="text-[11px] text-white/30 leading-relaxed">
              {t('legal.free')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-white/15 text-[10px]">
        QuizGoal 2026 by eyedeaz. All rights reserved.
      </footer>
    </div>
  );
}
