import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';

const dailyMissions = [
  { key: 'play', points: 100, target: 3, icon: '⚔️' },
  { key: 'win', points: 150, target: 1, icon: '🏆' },
  { key: 'predict', points: 80, target: 2, icon: '🔮' },
  { key: 'create', points: 120, target: 1, icon: '🎨' },
  { key: 'vote', points: 60, target: 5, icon: '❤️' },
  { key: 'share', points: 50, target: 1, icon: '📤' },
  { key: 'invite', points: 200, target: 1, icon: '👥' },
];

export default function MissionsIndex() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('missions.title')}</h1>
        <p className="text-sm text-white/50">{lang === 'ar' ? 'أكمل المهام واربح النقاط' : 'Complete missions and earn points'}</p>
      </motion.div>

      <div className="space-y-3">
        {dailyMissions.map((mission, i) => (
          <motion.div
            key={mission.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{mission.icon}</div>
                  <div>
                    <div className="text-sm font-medium">{t(`missions.${mission.key}`)}</div>
                    <div className="text-xs text-white/40">{mission.points} {t('common.points')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neon">0/{mission.target}</div>
                  <div className="w-20 bg-white/5 rounded-full h-1.5 mt-1">
                    <div className="bg-neon h-1.5 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
