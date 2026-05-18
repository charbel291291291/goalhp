import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { allMatches } from '../../lib/matchSchedule';
import { useSubmitPrediction } from '../../lib/useMutations';
import { useAuth } from '../../store/useAuth';
import { useUserPredictions } from '../../lib/useData';
import { createArenaPost } from '../../lib/useArena';
import toast from 'react-hot-toast';

const predictionTypes = [
  { key: 'match_winner', icon: '🏆', en: 'Match Winner', ar: 'الفائز بالمباراة' },
  { key: 'exact_score', icon: '🎯', en: 'Exact Score', ar: 'النتيجة الدقيقة' },
  { key: 'first_goal', icon: '⚡', en: 'First Goal', ar: 'أول هدف' },
  { key: 'total_goals', icon: '📊', en: 'Total Goals', ar: 'مجموع الأهداف' },
  { key: 'group_winner', icon: '🏅', en: 'Group Winner', ar: 'فائز المجموعة' },
  { key: 'tournament_winner', icon: '🌍', en: 'Tournament Winner', ar: 'بطل البطولة' },
];

const groups = 'ABCDEFGHIJKL'.split('');

type PredictionDraft = {
  match_id?: string;
  prediction_type?: string;
  predicted_winner_team_id?: string;
  group?: string;
  team?: string;
};

type TeamMini = {
  fifa_code?: string | null;
  flag_emoji?: string | null;
  name_en?: string | null;
  name_ar?: string | null;
};

export default function Predictions() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { profile } = useAuth();
  const submitPred = useSubmitPrediction();
  const { data: myHistory } = useUserPredictions();
  const [activeType, setActiveType] = useState('match_winner');
  const [myPredictions, setMyPredictions] = useState<Record<string, PredictionDraft>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [nowTs, setNowTs] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;

    async function run() {
      await Promise.resolve();
      if (cancelled) return;
      setNowTs(new Date().getTime());
      intervalId = window.setInterval(() => {
        setNowTs(new Date().getTime());
      }, 60000);
    }

    void run();
    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  const upcoming = useMemo(() => {
    if (!nowTs) return [];
    return allMatches.filter((m) => new Date(m.kickoff_at).getTime() > nowTs && !m.locked).slice(0, 24);
  }, [nowTs]);

  const closingSoon = useMemo(() => {
    if (!nowTs) return [];
    return allMatches.filter((m) => {
      const timeToMatch = new Date(m.kickoff_at).getTime() - nowTs;
      return timeToMatch > 0 && timeToMatch < 3600000 && !m.locked;
    }).slice(0, 5);
  }, [nowTs]);

  const isLocked = (matchId: string) => {
    const match = allMatches.find(m => m.id === matchId);
    if (!match) return true;
    return new Date(match.kickoff_at).getTime() <= nowTs || match.locked;
  };

  const handlePredict = (matchId: string, teamFifa?: string) => {
    if (isLocked(matchId)) return;
    setMyPredictions(prev => ({
      ...prev, [`${matchId}_${activeType}`]: { match_id: matchId, prediction_type: activeType, predicted_winner_team_id: teamFifa },
    }));
    submitPred.mutate({ match_id: matchId, prediction_type: activeType, predicted_winner_team_id: teamFifa });
  };

  const handleGroupPredict = (groupName: string, teamFifa: string) => {
    setMyPredictions(prev => ({ ...prev, [`group_${groupName}`]: { group: groupName, team: teamFifa } }));
  };

  const resolvedPredictions = (myHistory || []).filter(p => p.resolved);
  const unansweredPredictions = (myHistory || []).filter(p => !p.resolved);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('predict.title')}</h1>
        <p className="text-sm text-white/50">
          {lang === 'ar' ? 'توقّع مجاني. النقاط للجوائز فقط.' : 'Free predictions. Points for rewards only.'}
        </p>
      </motion.div>

      {/* Profile stats */}
      {profile && (resolvedPredictions.length > 0 || unansweredPredictions.length > 0) && (
        <div className="flex gap-3 text-xs">
          <Card className="flex-1 p-3 text-center">
            <div className="text-lg font-bold text-gold">{resolvedPredictions.length}</div>
            <div className="text-white/40">{lang === 'ar' ? 'تم حلها' : 'Resolved'}</div>
          </Card>
          <Card className="flex-1 p-3 text-center">
            <div className="text-lg font-bold text-electric">{unansweredPredictions.length}</div>
            <div className="text-white/40">{lang === 'ar' ? 'معلقة' : 'Pending'}</div>
          </Card>
          <Card className="flex-1 p-3 text-center">
            <div className="text-lg font-bold text-neon">{resolvedPredictions.reduce((s, p) => s + (p.points_awarded || 0), 0).toLocaleString()}</div>
            <div className="text-white/40">pts</div>
          </Card>
        </div>
      )}

      {/* Closing Soon */}
      {closingSoon.length > 0 && activeType === 'match_winner' && (
        <div>
          <h3 className="text-xs font-bold text-red-400 uppercase mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            {lang === 'ar' ? 'تغلق قريباً' : 'Closing Soon'}
          </h3>
          <div className="space-y-1.5">
            {closingSoon.map(match => (
              <Card key={match.id} className="p-2 border border-red-500/20">
                <div className="flex items-center justify-between text-xs">
                  <span>{match.team_a?.flag_emoji} {match.team_a?.name_en} vs {match.team_b?.flag_emoji} {match.team_b?.name_en}</span>
                  <span className="text-red-400 font-bold">
                    {Math.ceil((new Date(match.kickoff_at).getTime() - nowTs) / 60000)}m
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Prediction Types */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {predictionTypes.map(type => (
          <button key={type.key} onClick={() => setActiveType(type.key)}
            className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all flex-shrink-0 ${
              activeType === type.key ? 'bg-electric text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}>
            {type.icon} {lang === 'ar' ? type.ar : type.en}
          </button>
        ))}
      </div>

      {/* Group Winners */}
      {activeType === 'group_winner' && (
        <div className="grid grid-cols-2 gap-3">
          {groups.map(g => (
            <Card key={g} className="p-3">
              <div className="text-xs text-white/30 uppercase mb-2">{lang === 'ar' ? `المجموعة ${g}` : `Group ${g}`}</div>
              <div className="space-y-1">
                {allMatches.filter(m => m.group_name === g).slice(0, 4).map((m, i) => {
                  const team = m.team_a;
                  if (!team) return null;
                  const key = `group_${g}`;
                  const selected = myPredictions[key]?.team === team.fifa_code;
                  return (
                    <button key={`${g}-${i}`} onClick={() => handleGroupPredict(g, team.fifa_code || '')}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all ${selected ? 'bg-electric text-white' : 'bg-white/5 hover:bg-white/10 text-white/70'}`}>
                      {team.flag_emoji} {lang === 'ar' ? team.name_ar : team.name_en}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tournament Winner */}
      {activeType === 'tournament_winner' && (
        <div className="grid grid-cols-4 gap-2">
          {allMatches.filter(m => m.stage === 'group').slice(0, 48).map((m) => {
            const teams = [m.team_a, m.team_b].filter(Boolean) as TeamMini[];
            return teams.map((team) => {
              if (!team) return null;
              const key = 'tournament_winner';
              const selected = myPredictions[key]?.team === team.fifa_code;
              return (
                <button key={`tw-${team.fifa_code}`} onClick={() => setMyPredictions(prev => ({ ...prev, [key]: { team: team.fifa_code ?? undefined } }))}
                  className={`p-2 rounded-xl text-center text-xs transition-all ${selected ? 'bg-gold text-navy font-bold scale-105' : 'bg-white/5 hover:bg-white/10 text-white/70'}`}>
                  <div className="text-lg mb-1">{team.flag_emoji}</div>
                  <div className="leading-tight">{lang === 'ar' ? team.name_ar : team.name_en}</div>
                </button>
              );
            });
          })}
        </div>
      )}

      {/* Match predictions */}
      {activeType !== 'group_winner' && activeType !== 'tournament_winner' && (
        <div className="space-y-2">
          {upcoming.map((match, i) => (
            <motion.div key={match.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Card className="p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/30">
                    {match.stage === 'group' ? `Group ${match.group_name}` : match.stage.replace('_', ' ')}
                  </span>
                  <span className="text-white/30">
                    {new Date(match.kickoff_at).toLocaleDateString()} · {new Date(match.kickoff_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2">
                  <button onClick={() => handlePredict(match.id, match.team_a?.fifa_code)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                      myPredictions[`${match.id}_match_winner`]?.predicted_winner_team_id === match.team_a?.fifa_code
                        ? 'bg-electric text-white' : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}>
                    <span className="text-lg">{match.team_a?.flag_emoji}</span>
                    <span className="truncate">{lang === 'ar' ? match.team_a?.name_ar : match.team_a?.name_en}</span>
                  </button>
                  <div className="text-xs text-white/30">vs</div>
                  <button onClick={() => handlePredict(match.id, match.team_b?.fifa_code)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all justify-end ${
                      myPredictions[`${match.id}_match_winner`]?.predicted_winner_team_id === match.team_b?.fifa_code
                        ? 'bg-electric text-white' : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}>
                    <span className="truncate">{lang === 'ar' ? match.team_b?.name_ar : match.team_b?.name_en}</span>
                    <span className="text-lg">{match.team_b?.flag_emoji}</span>
                  </button>
                </div>

                {myPredictions[`${match.id}_match_winner`] && (
                  <div className="mt-1 text-[10px] text-neon text-center">
                    ✅ {lang === 'ar' ? 'تم التوقّع!' : 'Predicted!'}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* My Predictions Summary */}
      {Object.keys(myPredictions).length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">{lang === 'ar' ? 'توقعاتي' : 'My Predictions'}</h3>
            <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-electric">
              {showHistory ? (lang === 'ar' ? 'إخفاء' : 'Hide') : (lang === 'ar' ? 'السجل' : 'History')}
            </button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {Object.entries(myPredictions).map(([key, val]: any) => (
              <div key={key} className="text-xs text-white/60 py-1 border-b border-white/5 last:border-0">
                {val.match_id ? `Match #${val.match_id.slice(-3)}` : val.group ? `Group ${val.group}` : 'Tournament'}: {val.team || val.predicted_winner_team_id || '—'}
              </div>
            ))}
          </div>

          {/* Publish to Arena */}
          <div className="mt-2 pt-2 border-t border-white/10">
            <button onClick={async () => {
              const entries = Object.entries(myPredictions);
              const text = entries.map(([, v]: any) => `${v.match_id ? `Match #${v.match_id.slice(-3)}` : v.group ? `Group ${v.group}` : '🏆 Winner'}: ${v.team || v.predicted_winner_team_id || '?'}`).join(' | ');
              try {
                await createArenaPost('prediction', `🔮 ${text}`);
                toast.success(lang === 'ar' ? 'تم النشر في الساحة!' : 'Published to Arena!');
              } catch (e: any) { toast.error(e.message); }
            }} className="w-full py-2 rounded-xl text-xs bg-electric/10 text-electric hover:bg-electric/20 transition-all">
              📢 {t('arena.publishPrediction')}
            </button>
          </div>

          {/* History */}
          {showHistory && myHistory && myHistory.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <h4 className="text-xs font-bold text-white/40 mb-2">{lang === 'ar' ? 'سجل التوقعات' : 'Prediction History'}</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {myHistory.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={p.resolved ? (p.points_awarded > 0 ? 'text-neon' : 'text-red-400') : 'text-white/40'}>
                        {p.resolved ? (p.points_awarded > 0 ? '✅' : '❌') : '⏳'}
                      </span>
                      <span className="text-white/60">{p.prediction_type}</span>
                    </div>
                    <span className={p.points_awarded > 0 ? 'text-neon font-bold' : 'text-white/30'}>
                      {p.resolved ? `${p.points_awarded} pts` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Legal Disclaimer */}
      <div className="glass px-4 py-3 rounded-xl text-center">
        <p className="text-[10px] text-white/30 leading-relaxed">{t('predict.disclaimer')}</p>
      </div>
    </div>
  );
}
