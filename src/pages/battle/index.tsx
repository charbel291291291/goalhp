import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useLeaderboard } from '../../lib/useData';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };

export default function BattleIndex() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { data: topPlayers } = useLeaderboard(3);

  const modes = [
    { id: 'solo', icon: '⚡', en: 'Solo Sprint', ar: 'سباق فردي', desc_en: 'Play solo against the clock', desc_ar: 'العب منفرداً ضد الوقت', color: 'from-blue-500/20 to-blue-600/10', path: '/battle/solo' },
    { id: 'pvp', icon: '⚔️', en: '1v1 Battle', ar: 'تحدي 1 ضد 1', desc_en: 'Challenge a bot opponent', desc_ar: 'تحدّ خصماً آلياً', color: 'from-green-500/20 to-green-600/10', path: '/battle/pvp?mode=1v1' },
    { id: 'friend', icon: '👥', en: 'Friend Challenge', ar: 'تحدي صديق', desc_en: 'Invite a friend to play', desc_ar: 'ادع صديقاً للعب', color: 'from-purple-500/20 to-purple-600/10', path: '/battle/pvp?mode=friend' },
    { id: 'daily', icon: '🔥', en: 'Daily Challenge', ar: 'التحدي اليومي', desc_en: 'New questions every day', desc_ar: 'أسئلة جديدة كل يوم', color: 'from-orange-500/20 to-orange-600/10', path: '/battle/daily' },
    { id: 'teamwar', icon: '🏳️', en: 'Team War Quiz', ar: 'مسابقة حرب المنتخبات', desc_en: 'Earn points for your team', desc_ar: 'اربح نقاطاً لمنتخبك', color: 'from-gold-500/20 to-gold-600/10', path: '/battle/solo' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('nav.battle')}</h1>
        <p className="text-sm text-white/50">{t('battle.quickCorrect')}</p>
      </motion.div>

      <div className="space-y-3">
        {modes.map((mode, i) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              onClick={() => navigate(mode.path)}
              className="cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center text-2xl`}>
                  {mode.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{lang === 'ar' ? mode.ar : mode.en}</h3>
                  <p className="text-xs text-white/50">{lang === 'ar' ? mode.desc_ar : mode.desc_en}</p>
                </div>
                <div className="text-white/30">→</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live leaderboard preview */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-white/40 uppercase tracking-wider">{lang === 'ar' ? 'أفضل اللاعبين' : 'Top Players'}</div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/leaderboard')}>
            {lang === 'ar' ? 'عرض الكل' : 'View All'}
          </Button>
        </div>
        {!topPlayers || topPlayers.length === 0 ? (
          <div className="text-center py-4 text-white/30 text-sm">
            {lang === 'ar' ? 'لا يوجد لاعبون بعد' : 'No players yet'}
          </div>
        ) : (
          topPlayers.map((player, i) => (
            <div key={player.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center">{MEDAL[i]}</span>
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <span>{player.flag_emoji || '👤'}</span>
                )}
                <span className="text-white/80">{player.username || 'Anonymous'}</span>
              </div>
              <span className="text-gold font-medium">{(player.points || 0).toLocaleString()}</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
