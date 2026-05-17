import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useLocalQuery } from '../../lib/useData';
import { supabase } from '../../lib/supabase';
import { shareOnWhatsApp, getPosterShareText } from '../../lib/shareUtils';
import { useVotePoster, useReportPoster } from '../../lib/useMutations';
import toast from 'react-hot-toast';
import type { FanPoster } from '../../types';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function PosterBattle() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const votePoster = useVotePoster();
  const reportPoster = useReportPoster();
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');

  const { data: posters, loading, refetch } = useLocalQuery<FanPoster[]>(async () => {
    const { data, error } = await supabase.from('fan_posters')
      .select('*, user:user_id(*), team:team_id(*)')
      .eq('status', 'active')
      .order('votes_count', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []) as any as FanPoster[];
  });

  const handleVote = async (posterId: string) => {
    const result = await votePoster.mutate(posterId);
    if (result) { refetch(); toast.success('+10 pts'); }
  };

  const handleReport = (posterId: string) => {
    const reason = prompt(lang === 'ar' ? 'سبب التبليغ:' : 'Reason for report:');
    if (reason) { reportPoster.mutate(posterId, reason); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('posterBattle.title')}</h1>
          <p className="text-sm text-white/50">{lang === 'ar' ? 'صوّت لأفضل بوستر' : 'Vote for the best poster'}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/poster/generator')}>{t('poster.generate')}</Button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('daily')}
          className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'daily' ? 'bg-electric text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
          ⚡ {t('posterBattle.daily')}
        </button>
        <button onClick={() => setTab('weekly')}
          className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'weekly' ? 'bg-electric text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
          🏆 {t('posterBattle.weekly')}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-white/40 py-12">{t('common.loading')}</div>
      ) : !posters || posters.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎨</div>
          <p className="text-white/40">{lang === 'ar' ? 'لا توجد بوسترات بعد' : 'No posters yet'}</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/poster/generator')}>{t('poster.generate')}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posters.slice(0, 10).map((poster, i) => (
            <motion.div key={poster.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="overflow-hidden">
                <div className="flex gap-4 p-3">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-navy-light to-electric/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {poster.team?.flag_emoji || '🏳️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">{lang === 'ar' ? poster.team?.name_ar : poster.team?.name_en}</div>
                        <div className="text-xs text-white/40">@{poster.user?.username}</div>
                      </div>
                      <div className="text-gold font-bold text-lg">❤️ {poster.votes_count}</div>
                    </div>
                    {poster.slogan && <div className="text-xs text-white/50 mt-1 italic">"{poster.slogan}"</div>}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleVote(poster.id)}
                        className="flex-1 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white/70 transition-all">{t('posterBattle.vote')}</button>
                      <button onClick={() => shareOnWhatsApp(getPosterShareText(poster.team?.name_en || '', lang), window.location.href)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs">📤</button>
                      <button onClick={() => handleReport(poster.id)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-red-400/60">🚩</button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="text-center">
        <Button variant="ghost" onClick={() => navigate('/poster/gallery')}>{lang === 'ar' ? 'عرض كل البوسترات' : 'View all posters'} →</Button>
      </div>
    </div>
  );
}
