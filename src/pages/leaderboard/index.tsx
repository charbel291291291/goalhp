import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { useLeaderboard, useTeamLeaderboard } from '../../lib/useData';
import { useAuth } from '../../store/useAuth';

const ALL_TABS = ['global', 'team', 'daily', 'weekly', 'region', 'friends'] as const;
type Tab = typeof ALL_TABS[number];

const LIVE_TABS = new Set<Tab>(['global', 'team']);

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardIndex() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('global');
  const lang = i18n.language as 'en' | 'ar';
  const { profile } = useAuth();

  const { data: players, loading: playersLoading } = useLeaderboard(50);
  const { data: teams, loading: teamsLoading } = useTeamLeaderboard();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('leaderboard.global')}</h1>
        <p className="text-sm text-white/50">
          {lang === 'ar' ? 'تصنيف اللاعبين حول العالم' : 'Player rankings around the world'}
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {ALL_TABS.map((tab) => {
          const live = LIVE_TABS.has(tab);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all flex items-center gap-1 ${
                activeTab === tab ? 'bg-electric text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
              } ${!live ? 'opacity-50' : ''}`}
            >
              {t(`leaderboard.${tab}`)}
              {!live && <span className="text-[10px]">🔒</span>}
            </button>
          );
        })}
      </div>

      {/* Global tab */}
      {activeTab === 'global' && (
        <Card>
          {playersLoading ? (
            <div className="text-center py-8 text-white/40 animate-pulse">
              {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : !players || players.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              {lang === 'ar' ? 'لا يوجد لاعبون بعد' : 'No players yet'}
            </div>
          ) : (
            <div className="space-y-1">
              {players.map((player, i) => {
                const rank = i + 1;
                const isMe = player.id === profile?.id;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className={`flex items-center justify-between py-3 px-3 rounded-xl transition-all ${
                      isMe ? 'bg-electric/20 border border-electric/30' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 text-center font-bold shrink-0 ${
                        rank <= 3 ? 'text-lg' : 'text-white/30 text-sm'
                      }`}>
                        {MEDAL[rank] ?? `#${rank}`}
                      </span>
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="text-xl shrink-0">{player.flag_emoji || '👤'}</span>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {player.username || 'Anonymous'}
                          {isMe && <span className="ml-1 text-[10px] text-electric">{lang === 'ar' ? '(أنت)' : '(You)'}</span>}
                        </div>
                        <div className="text-[10px] text-white/40">{lang === 'ar' ? 'مستوى' : 'Lv.'}{player.level || 1}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-gold font-bold text-sm">{(player.points || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-white/30">{lang === 'ar' ? 'نقطة' : 'pts'}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Team tab */}
      {activeTab === 'team' && (
        <Card>
          {teamsLoading ? (
            <div className="text-center py-8 text-white/40 animate-pulse">
              {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : !teams || teams.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              {lang === 'ar' ? 'لا يوجد فرق بعد' : 'No teams yet'}
            </div>
          ) : (
            <div className="space-y-1">
              {teams.map((team, i) => {
                const rank = i + 1;
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 text-center font-bold shrink-0 ${
                        rank <= 3 ? 'text-lg' : 'text-white/30 text-sm'
                      }`}>
                        {MEDAL[rank] ?? `#${rank}`}
                      </span>
                      <span className="text-xl shrink-0">{team.flag_emoji}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {lang === 'ar' ? team.name_ar : team.name_en}
                        </div>
                        <div className="text-[10px] text-white/40">{team.group_name}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-gold font-bold text-sm">{(team.total_points || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-white/30">{lang === 'ar' ? 'نقطة' : 'pts'}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Coming soon tabs */}
      {!LIVE_TABS.has(activeTab) && (
        <Card>
          <div className="text-center py-12 space-y-3">
            <div className="text-4xl">🔒</div>
            <div className="text-lg font-bold text-white/70">
              {lang === 'ar' ? 'قريباً' : 'Coming Soon'}
            </div>
            <div className="text-sm text-white/40">
              {lang === 'ar'
                ? 'سيتم إضافة هذه الميزة قريباً'
                : 'This leaderboard will be available soon'}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
