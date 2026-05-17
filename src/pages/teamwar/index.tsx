import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { allTeams } from '../../lib/teams';

function stableHashNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export default function TeamWarIndex() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  const rankedTeams = useMemo(() => {
    const seeded = [...allTeams].map((team) => ({
      ...team,
      points: (stableHashNumber(team.fifa_code) % 50000) + 5000,
      sort_key: stableHashNumber(`order:${team.fifa_code}`),
    }));

    return seeded
      .sort((a, b) => a.sort_key - b.sort_key)
      .slice(0, 12)
      .sort((a, b) => b.points - a.points);
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('teamwar.title')}</h1>
        <p className="text-sm text-white/50">{lang === 'ar' ? 'حرب المنتخبات - مثّل منتخبك وارفع تصنيفه' : 'Team War - Represent your team and climb the ranks'}</p>
      </motion.div>

      {/* Your Team */}
      <Card glow="blue" className="text-center p-6">
        <div className="text-5xl mb-3">🇱🇧</div>
        <h2 className="font-bold text-lg">{lang === 'ar' ? 'منتخبك: لبنان' : 'Your Team: Lebanon'}</h2>
        <div className="text-gold font-bold text-2xl mt-2">12,500 {t('leaderboard.points')}</div>
        <div className="text-xs text-white/40 mt-1">
          {lang === 'ar' ? 'المركز #15 من 48 منتخباً' : 'Rank #15 of 48 teams'}
        </div>
      </Card>

      {/* Rankings */}
      <div>
        <h3 className="font-bold mb-3">{t('teamwar.ranking')}</h3>
        <div className="space-y-2">
          {rankedTeams.map((team, i) => (
            <Card key={team.fifa_code} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-bold ${i < 3 ? 'text-gold' : 'text-white/40'}`}>#{i + 1}</span>
                  <span className="text-2xl">{team.flag_emoji}</span>
                  <span className="text-sm font-medium">{lang === 'ar' ? team.name_ar : team.name_en}</span>
                </div>
                <div className="text-gold text-sm font-bold">{team.points.toLocaleString()}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
