import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { regions } from '../../lib/teams';
import { useMemo } from 'react';

function stableHashNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export default function StreetLeagueIndex() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  const rankedRegions = useMemo(() => {
    return regions
      .map((r) => ({ ...r, points: (stableHashNumber(r.name_en) % 30000) + 2000 }))
      .sort((a, b) => b.points - a.points);
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('street.title')}</h1>
        <p className="text-sm text-white/50">
          {lang === 'ar' ? 'تنافس مع مناطق لبنان وارفع اسم منطقتك' : 'Compete across Lebanese regions'}
        </p>
      </motion.div>

      <div className="text-center mb-4">
        <div className="text-4xl mb-2">🇱🇧</div>
        <div className="text-lg font-bold">
          {t('street.representing')} <span className="text-gold">Beirut</span> {t('street.on')}
        </div>
      </div>

      <div className="space-y-2">
        {rankedRegions.map((region, i) => (
          <motion.div
            key={region.name_en}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-bold ${i < 3 ? 'text-gold' : i < 5 ? 'text-electric' : 'text-white/40'}`}>
                    #{i + 1}
                  </span>
                  <span className="text-sm font-medium">{lang === 'ar' ? region.name_ar : region.name_en}</span>
                </div>
                <div className="text-gold text-sm font-bold">{region.points.toLocaleString()}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
