import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { allMatches, stages, stageLabels } from '../../lib/matchSchedule';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function SchedulePage() {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const [activeStage, setActiveStage] = useState('all');
  const [searchTeam, setSearchTeam] = useState('');

  const today = new Date().toDateString();

  const filtered = useMemo(() => {
    let matches = [...allMatches];
    if (activeStage === 'today') {
      matches = matches.filter(m => new Date(m.kickoff_at).toDateString() === today);
    } else if (activeStage === 'upcoming') {
      matches = matches.filter(m => new Date(m.kickoff_at) > new Date());
    } else if (activeStage !== 'all') {
      matches = matches.filter(m => m.stage === activeStage);
    }
    if (searchTeam) {
      const q = searchTeam.toLowerCase();
      matches = matches.filter(m =>
        m.team_a?.name_en?.toLowerCase().includes(q) ||
        m.team_a?.name_ar?.includes(q) ||
        m.team_b?.name_en?.toLowerCase().includes(q) ||
        m.team_b?.name_ar?.includes(q)
      );
    }
    return matches.sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime());
  }, [activeStage, searchTeam, today]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">
          {lang === 'ar' ? 'جدول المباريات' : 'Match Schedule'}
        </h1>
        <p className="text-xs text-white/30">
          {lang === 'ar' ? 'التوقيت بتوقيت لبنان' : 'Times shown in Lebanon time (UTC+3)'}
        </p>
      </motion.div>

      <input type="text" value={searchTeam} onChange={e => setSearchTeam(e.target.value)}
        placeholder={lang === 'ar' ? 'ابحث عن منتخب...' : 'Search for a team...'}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-electric" />

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {stages.map(s => (
          <button key={s.key} onClick={() => setActiveStage(s.key)}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeStage === s.key ? 'bg-electric text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
            {lang === 'ar' ? s.ar : s.en}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {'ABCDEFGHIJKL'.split('').map(g => (
          <button key={g} onClick={() => { setActiveStage('all'); setSearchTeam(`Group ${g}`); }}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white/50 hover:text-white transition-all flex-shrink-0">
            {g}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card className="text-center py-8">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm text-white/50">{lang === 'ar' ? 'لا توجد مباريات' : 'No matches found'}</p>
          </Card>
        )}

        {filtered.map((match, i) => {
          const date = new Date(match.kickoff_at);
          const dateStr = date.toLocaleDateString(lang === 'ar' ? 'ar-LB' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' });
          const timeStr = date.toLocaleTimeString(lang === 'ar' ? 'ar-LB' : 'en-US', { hour: '2-digit', minute: '2-digit' });
          const stageLabel = stageLabels[match.stage] || { en: match.group_name ? `Group ${match.group_name}` : '', ar: match.group_name ? `المجموعة ${match.group_name}` : '' };

          const isLive = match.status === 'live';
          const isFinished = match.status === 'finished';

          return (
            <motion.div key={match.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Card className={`p-3 ${isLive ? 'ring-1 ring-neon/40' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
                      {match.stage === 'group' ? `${stageLabel.en} ${match.group_name}` : stageLabel.en}
                    </span>
                    {isLive && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>}
                  </div>
                  <span className="text-[10px] text-white/30">{dateStr} · {timeStr}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{match.team_a?.flag_emoji}</span>
                    <span className="text-sm font-medium truncate">{lang === 'ar' ? match.team_a?.name_ar : match.team_a?.name_en}</span>
                  </div>
                  <div className="text-center px-2">
                    <div className="text-[10px] text-white/30">vs</div>
                    <div className={`text-center text-xs font-mono ${isFinished ? 'text-white font-bold' : 'text-white/20'}`}>
                      {isFinished ? `${match.team_a_score ?? 0} - ${match.team_b_score ?? 0}` : '--'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span className="text-sm font-medium truncate">{lang === 'ar' ? match.team_b?.name_ar : match.team_b?.name_en}</span>
                    <span className="text-xl flex-shrink-0">{match.team_b?.flag_emoji}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-white/20">{match.venue}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/predict')}>
                      {lang === 'ar' ? 'توقّع' : 'Predict'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/match-room?id=${match.id}`)}>
                      💬
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
