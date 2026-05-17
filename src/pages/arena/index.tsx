import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../store/useAuth';
import { useArenaPosts, createArenaPost, toggleArenaReaction, reportArenaContent } from '../../lib/useArena';
import { useFanTitle, useArenaStreak } from '../../lib/useArena';
import ArenaComments from './comments';
import toast from 'react-hot-toast';
import type { ArenaReactionType } from '../../types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

const ONE_TAP_REACTIONS: { key: ArenaReactionType; label: string; icon: string }[] = [
  { key: 'goal', label: 'GOAL', icon: '⚽' },
  { key: 'var', label: 'VAR', icon: '📺' },
  { key: 'fire', label: 'Fire', icon: '🔥' },
  { key: 'shock', label: 'Shock', icon: '😱' },
  { key: 'laugh', label: 'Laugh', icon: '😂' },
  { key: 'heart', label: 'Heart', icon: '❤️' },
  { key: 'trophy', label: 'Trophy', icon: '🏆' },
];

const FILTERS = ['all', 'text', 'prediction', 'moment', 'hot_take'];

const FILTER_LABELS: Record<string, string> = { all: 'All', text: 'Text', prediction: 'Predictions', moment: 'Moments', hot_take: 'Hot Takes' };
const FILTER_LABELS_AR: Record<string, string> = { all: 'الكل', text: 'نصوص', prediction: 'توقعات', moment: 'لحظات', hot_take: 'آراء' };

function getPostIcon(type: string): string {
  const map: Record<string, string> = {
    text: '💬', prediction: '🔮', quiz_win: '🏆', poster: '🎨',
    match_reaction: '⚽', moment: '⚡', hot_take: '🔥',
  };
  return map[type] || '💬';
}

function formatTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function ArenaWall() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  useAuth();
  const [filter, setFilter] = useState('all');
  const { data: posts, loading, refetch } = useArenaPosts(filter);
  const { data: titleInfo } = useFanTitle();
  const { data: streak } = useArenaStreak();
  const [showCreate, setShowCreate] = useState(false);
  const [postText, setPostText] = useState('');
  const [openComments, setOpenComments] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!postText.trim()) return;
    try {
      const result = await createArenaPost('text', postText.trim());
      if (result?.success) {
        toast.success(lang === 'ar' ? 'تم النشر!' : 'Posted!');
        setPostText('');
        setShowCreate(false);
        refetch();
      }
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
  };

  const handleReact = async (postId: string, reaction: ArenaReactionType) => {
    await toggleArenaReaction(reaction, postId);
    refetch();
  };

  const handleReport = (postId: string) => {
    const reason = prompt(lang === 'ar' ? 'سبب التبليغ:' : 'Reason:');
    if (reason) reportArenaContent(reason, postId).then(() => toast.success(lang === 'ar' ? 'تم التبليغ' : 'Reported'));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('arena.title')}</h1>
          <p className="text-xs text-white/50">{t('arena.subtitle')}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>{t('arena.post')}</Button>
      </div>

      {/* Fan Title + Streak */}
      {titleInfo && (
        <div className="flex items-center gap-2 text-sm bg-white/5 rounded-xl px-4 py-2">
          <span className="text-lg">{titleInfo.icon}</span>
          <span className="font-bold">{lang === 'ar' ? titleInfo.title_ar : titleInfo.title_en}</span>
          {streak && (
            <span className="text-xs text-white/40 ml-auto">
              🔥 {streak.current_streak}d {t('arena.streak')}
            </span>
          )}
        </div>
      )}

      {/* Create Post */}
      {showCreate && (
        <Card className="p-3">
          <textarea value={postText} onChange={e => setPostText(e.target.value)} maxLength={500} rows={3}
            placeholder={t('arena.createPost')}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-electric" />
          <div className="flex gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={!postText.trim()}>{t('arena.post')}</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all flex-shrink-0 ${filter === f ? 'bg-electric text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
            {lang === 'ar' ? (FILTER_LABELS_AR[f] || f) : (FILTER_LABELS[f] || f)}
          </button>
        ))}
        <button onClick={() => navigate('/team-wall')} className="px-3 py-1.5 rounded-xl text-xs bg-white/5 text-white/60 hover:bg-white/10 flex-shrink-0">🏳️ {t('arena.teamWall')}</button>
        <button onClick={() => navigate('/country-wall')} className="px-3 py-1.5 rounded-xl text-xs bg-white/5 text-white/60 hover:bg-white/10 flex-shrink-0">🌍 {t('arena.countryWall')}</button>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="text-center py-12"><div className="text-3xl animate-football-spin mx-auto">⚽</div></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-white/40 text-sm">{t('arena.noPosts')}</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Card className="p-3">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-electric/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {post.user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold truncate">{post.user?.username || 'Anonymous'}</span>
                      <span className="text-[10px] text-white/30">{getPostIcon(post.post_type)}</span>
                    </div>
                    <div className="text-[10px] text-white/40">{formatTime(post.created_at)}</div>
                  </div>
                  <button onClick={() => handleReport(post.id)} className="text-xs text-white/20 hover:text-red-400 p-1">🚩</button>
                </div>

                {/* Content */}
                <p className="text-sm leading-relaxed mb-2">{post.content}</p>

                {/* Match / Team tags */}
                {post.match && (
                  <div className="text-[10px] text-white/30 mb-1">
                    ⚽ {post.match.team_a?.flag_emoji} vs {post.match.team_b?.flag_emoji}
                  </div>
                )}
                {post.team && (
                  <div className="text-[10px] text-white/30 mb-1">{post.team.flag_emoji} {lang === 'ar' ? post.team.name_ar : post.team.name_en}</div>
                )}

                {/* One Tap Reactions */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {ONE_TAP_REACTIONS.map(r => {
                    const active = post.my_reactions?.includes(r.key);
                    return (
                      <button key={r.key} onClick={() => handleReact(post.id, r.key)}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${active ? 'bg-electric/20 text-electric ring-1 ring-electric' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                        {r.icon} {r.label}
                      </button>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 text-xs text-white/40 border-t border-white/5 pt-2">
                  <button onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
                    className="flex items-center gap-1 hover:text-white transition-colors">
                    💬 {post.comments_count}
                  </button>
                  <span>❤️ {post.reactions_count}</span>
                  <button onClick={() => {
                    const url = window.location.origin + '/arena?post=' + post.id;
                    navigator.clipboard.writeText(url);
                    toast.success(lang === 'ar' ? 'تم النسخ!' : 'Copied!');
                  }} className="ml-auto hover:text-white transition-colors">
                    📤 {t('arena.share')}
                  </button>
                </div>

                {/* Comments */}
                {openComments === post.id && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <ArenaComments postId={post.id} onReactionChange={refetch} />
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Mobile create FAB */}
      {!showCreate && (
        <button onClick={() => setShowCreate(true)}
          className="lg:hidden fixed bottom-20 right-4 w-12 h-12 rounded-full bg-electric shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center text-2xl z-40">
          ✏️
        </button>
      )}
    </div>
  );
}
