import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/useAuth';
import { Button } from '../components/common/Button';
import { allTeams } from '../lib/teams';
import { formatPoints } from '../lib/utils';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function ArenaHome() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const lang = i18n.language as 'en' | 'ar';
  const userTeam = allTeams.find(t => t.fifa_code === profile?.favorite_team_id);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? (lang === 'ar' ? 'صباح الخير' : 'Good Morning') : hour < 18 ? (lang === 'ar' ? 'مساء الخير' : 'Good Afternoon') : (lang === 'ar' ? 'مساء الخير' : 'Good Evening');

  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="football-particle">⚽</div>
        <div className="football-particle">🏆</div>
        <div className="football-particle">⚽</div>
        <div className="football-particle">🌟</div>
        <div className="football-particle">⚽</div>
        <div className="football-particle">🏆</div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-electric to-neon flex items-center justify-center text-xl shadow-lg ring-2 ring-white/10 flex-shrink-0">
              {userTeam?.flag_emoji || '⚽'}
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{greeting}, <span className="text-gradient-gold">{profile?.username || 'Player'}</span>!</h1>
              <p className="text-xs text-white/40">
                <span className="text-gold font-semibold">{formatPoints(profile?.points || 0)}</span> pts · Level {profile?.level || 1}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {userTeam && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative z-10">
          <div className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: `linear-gradient(135deg, ${userTeam.primary_color}25, ${userTeam.secondary_color}15)`,
              border: `1px solid ${userTeam.primary_color}30`,
            }}>
            <div className="absolute inset-0 opacity-[0.07]"
              style={{ background: `radial-gradient(circle at 30% 50%, ${userTeam.primary_color} 0%, transparent 70%)` }} />
            <div className="relative flex items-center gap-4">
              <span className="text-4xl drop-shadow-lg">{userTeam.flag_emoji}</span>
              <div className="flex-1">
                <div className="text-[10px] text-white/40 uppercase tracking-widest">{t('onboarding.pickTeam')}</div>
                <div className="text-lg font-bold">{lang === 'ar' ? userTeam.name_ar : userTeam.name_en}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">Group {userTeam.group_name}</span>
                  <span className="text-[10px] text-white/30">·</span>
                  <span className="text-[10px] text-white/50">{profile?.streak || 0}🔥 {t('common.streak')}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-10">
        <div className="rounded-2xl border border-white/10 bg-[#132042] shadow-[0_4px_24px_rgba(0,0,0,0.3)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'var(--mode-text-secondary)' }}>{t('home.nextMatch')}</div>
            <div className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: 'var(--mode-accent)', background: 'var(--mode-bg-glass)' }}>3d 14h</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-2xl">🇧🇷</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--mode-text)' }}>Brazil</span>
            </div>
            <div className="text-center px-3">
              <div className="text-[10px]" style={{ color: 'var(--mode-text-secondary)' }}>VS</div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto" style={{ background: 'var(--mode-bg-glass)' }}>
                <span className="text-xs font-bold" style={{ color: 'var(--mode-primary)' }}>⚔</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="text-sm font-semibold" style={{ color: 'var(--mode-text)' }}>Croatia</span>
              <span className="text-2xl">🇭🇷</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--mode-border)' }}>
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/predict')}>
              {lang === 'ar' ? 'توقّع الآن ←' : 'Predict Now →'}
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="relative z-10 grid grid-cols-3 gap-2">
        {[
          { label: t('home.totalPoints'), value: formatPoints(profile?.points || 0), color: 'var(--mode-accent)' },
          { label: t('home.yourRank'), value: '#42', color: 'var(--mode-primary)' },
          { label: t('common.streak'), value: `${profile?.streak || 0}🔥`, color: 'var(--mode-secondary)' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-[#132042] shadow-[0_4px_24px_rgba(0,0,0,0.3)] text-center py-3 px-2">
            <div className="text-[10px] mb-0.5 truncate" style={{ color: 'var(--mode-text-secondary)' }}>{stat.label}</div>
            <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative z-10">
        <div className="rounded-2xl border border-white/10 bg-[#132042] shadow-[0_4px_24px_rgba(0,0,0,0.3)] p-4" style={{ borderColor: 'rgba(245, 158, 11, 0.15)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--mode-text)' }}>{t('home.dailyMission')}</span>
            </div>
            <button onClick={() => navigate('/missions')} className="text-[10px] hover:opacity-80 transition-opacity" style={{ color: 'var(--mode-primary)' }}>
              {lang === 'ar' ? 'عرض الكل' : 'View All'}
            </button>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--mode-text-secondary)' }}>{lang === 'ar' ? 'العب 3 تحديات' : 'Play 3 battles'}</span>
              <span style={{ color: 'var(--mode-accent)' }} className="font-semibold">0/3</span>
            </div>
            <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--mode-bg-glass)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: '33%' }} transition={{ delay: 0.5, duration: 0.8 }}
                className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="relative z-10 grid grid-cols-2 gap-2.5">
        <button onClick={() => navigate('/battle')} className="mode-card text-center py-4 px-3 group">
          <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-300">⚔️</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--mode-text)' }}>{t('cta.start')}</div>
          <div style={{ color: 'var(--mode-text-secondary)' }} className="text-[10px] mt-0.5">Quiz Battle</div>
        </button>
        <button onClick={() => navigate('/predict')} className="mode-card text-center py-4 px-3 group">
          <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-300">🔮</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--mode-text)' }}>{lang === 'ar' ? 'توقّع' : 'Predict'}</div>
          <div style={{ color: 'var(--mode-text-secondary)' }} className="text-[10px] mt-0.5">Match Results</div>
        </button>
        <button onClick={() => navigate('/poster/generator')} className="mode-card text-center py-4 px-3 group">
          <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-300">🎨</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--mode-text)' }}>{t('cta.createPoster')}</div>
          <div style={{ color: 'var(--mode-text-secondary)' }} className="text-[10px] mt-0.5">Fan Art</div>
        </button>
        <button onClick={() => navigate('/rewards')} className="mode-card text-center py-4 px-3 group">
          <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-300">🎁</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--mode-text)' }}>{t('cta.viewRewards')}</div>
          <div style={{ color: 'var(--mode-text-secondary)' }} className="text-[10px] mt-0.5">Marketplace</div>
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--mode-text)' }}>{t('leaderboard.global')}</span>
          </div>
          <button onClick={() => navigate('/leaderboard')} className="text-[10px] hover:opacity-80 transition-opacity" style={{ color: 'var(--mode-primary)' }}>
            {lang === 'ar' ? 'عرض الكل' : 'View All'}
          </button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#132042] shadow-[0_4px_24px_rgba(0,0,0,0.3)] p-4">
          {[
            { rank: 1, name: '⚡ FootyKing', pts: 12500, flag: '🇧🇷' },
            { rank: 2, name: '🌟 GoalMaster', pts: 11800, flag: '🇦🇷' },
            { rank: 3, name: '🔥 PenaltyHero', pts: 10900, flag: '🇫🇷' },
          ].map((item) => (
            <div key={item.rank} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--mode-border)' }}>
              <span className="w-6 text-center text-sm font-bold">
                {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
              </span>
              <span className="text-base">{item.flag}</span>
              <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--mode-text)' }}>{item.name}</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--mode-accent)' }}>{item.pts.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="relative space-y-5">
      <ArenaHome />
      <div className="text-center pb-4">
        <p className="text-[9px] leading-relaxed px-4" style={{ color: 'var(--mode-text-secondary)', opacity: 0.3 }}>
          {t('legal.free')}
        </p>
      </div>
    </div>
  );
}
