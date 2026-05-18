import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { useMissions, useUserMissions } from '../../lib/useData';

const ICON_MAP: Record<string, string> = {
  play: '⚔️',
  win: '🏆',
  predict: '🔮',
  create: '🎨',
  vote: '❤️',
  share: '📤',
  invite: '👥',
  daily: '🔥',
  streak: '⚡',
};

const STATIC_MISSIONS = [
  { key: 'play', points: 100, target: 3, title_en: 'Play 3 Battles', title_ar: 'العب 3 تحديات' },
  { key: 'win', points: 150, target: 1, title_en: 'Win a Battle', title_ar: 'افز بتحدي' },
  { key: 'predict', points: 80, target: 2, title_en: 'Make 2 Predictions', title_ar: 'قدّم 2 توقعات' },
  { key: 'create', points: 120, target: 1, title_en: 'Create a Poster', title_ar: 'أنشئ بوستراً' },
  { key: 'vote', points: 60, target: 5, title_en: 'Vote on 5 Posters', title_ar: 'صوّت على 5 بوسترات' },
  { key: 'share', points: 50, target: 1, title_en: 'Share Something', title_ar: 'شارك شيئاً' },
  { key: 'invite', points: 200, target: 1, title_en: 'Invite a Friend', title_ar: 'ادعُ صديقاً' },
];

export default function MissionsIndex() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { data: dbMissions, loading: missionsLoading } = useMissions();
  const { data: userMissions, loading: userLoading } = useUserMissions();

  const loading = missionsLoading || userLoading;

  // Build a progress map: missionId → progress
  const progressMap = new Map<string, { progress: number; completed: boolean }>();
  if (userMissions) {
    for (const um of userMissions) {
      progressMap.set(um.mission_id, { progress: um.progress, completed: um.completed });
    }
  }

  // Use real DB missions if available, otherwise fall back to static
  const missions = dbMissions && dbMissions.length > 0
    ? dbMissions.map(m => ({
        id: m.id,
        key: m.mission_type,
        points: m.points_reward,
        target: m.target_count,
        title_en: m.title_en,
        title_ar: m.title_ar,
        progress: progressMap.get(m.id)?.progress ?? 0,
        completed: progressMap.get(m.id)?.completed ?? false,
      }))
    : STATIC_MISSIONS.map((m, i) => ({
        id: String(i),
        key: m.key,
        points: m.points,
        target: m.target,
        title_en: m.title_en,
        title_ar: m.title_ar,
        progress: 0,
        completed: false,
      }));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('missions.title')}</h1>
        <p className="text-sm text-white/50">{lang === 'ar' ? 'أكمل المهام واربح النقاط' : 'Complete missions and earn points'}</p>
      </motion.div>

      {loading ? (
        <div className="text-center py-8 text-white/40 animate-pulse">
          {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((mission, i) => {
            const pct = mission.target > 0 ? Math.min(100, Math.round((mission.progress / mission.target) * 100)) : 0;
            const icon = ICON_MAP[mission.key] || '🎯';
            const title = lang === 'ar' ? mission.title_ar : mission.title_en;
            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`p-4 ${mission.completed ? 'border-neon/30 bg-neon/5' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{icon}</div>
                      <div>
                        <div className="text-sm font-medium flex items-center gap-1">
                          {title || t(`missions.${mission.key}`, { defaultValue: title })}
                          {mission.completed && <span className="text-neon text-xs">✓</span>}
                        </div>
                        <div className="text-xs text-white/40">{mission.points} {t('common.points')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm ${mission.completed ? 'text-neon' : 'text-neon'}`}>
                        {mission.progress}/{mission.target}
                      </div>
                      <div className="w-20 bg-white/5 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${mission.completed ? 'bg-neon' : 'bg-electric'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
