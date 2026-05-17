import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { allTeams } from '../lib/teams';
import { useArenaPosts, createArenaPost } from '../lib/useArena';
import toast from 'react-hot-toast';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type TeamLite = (typeof allTeams)[number];

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

export default function TeamWall() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const [selectedTeam, setSelectedTeam] = useState<TeamLite | null>(null);
  const selectedTeamId = selectedTeam ? `team-${selectedTeam.fifa_code}` : undefined;
  const { data: posts, loading, refetch } = useArenaPosts(undefined, selectedTeamId);
  const [postText, setPostText] = useState('');

  const teams = allTeams;

  const handlePost = async () => {
    if (!postText.trim() || !selectedTeam) return;
    try {
      const result = await createArenaPost('text', postText.trim(), undefined, undefined, `team-${selectedTeam.fifa_code}`);
      if (result?.success) { setPostText(''); refetch(); toast.success(lang === 'ar' ? 'تم النشر!' : 'Posted!'); }
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
  };

  if (!selectedTeam) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('arena.teamWall')}</h1>
        <p className="text-xs text-white/50">{lang === 'ar' ? 'اختر منتخباً' : 'Select a team'}</p>
        <div className="grid grid-cols-3 gap-2">
          {teams.map(t => (
            <button key={t.fifa_code} onClick={() => setSelectedTeam(t)}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-center transition-all">
              <div className="text-2xl mb-1">{t.flag_emoji}</div>
              <div className="text-[10px] leading-tight">{lang === 'ar' ? t.name_ar : t.name_en}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedTeam(null)} className="text-white/60 hover:text-white">←</button>
        <span className="text-3xl">{selectedTeam.flag_emoji}</span>
        <div>
          <h1 className="text-xl font-bold">{lang === 'ar' ? selectedTeam.name_ar : selectedTeam.name_en}</h1>
          <p className="text-xs text-white/50">{t('arena.teamWall')}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input value={postText} onChange={e => setPostText(e.target.value)} maxLength={300}
          placeholder={t('arena.createPost')}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none" />
        <Button variant="primary" size="sm" onClick={handlePost} disabled={!postText.trim()}>{t('arena.post')}</Button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="text-3xl animate-football-spin mx-auto">⚽</div></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-white/40 text-sm">{t('arena.noPosts')}</div>
      ) : (
        <div className="space-y-2">
          {posts.map(p => (
            <Card key={p.id} className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold">{p.user?.username || 'Anonymous'}</span>
                <span className="text-[9px] text-white/30">{formatTime(p.created_at)}</span>
              </div>
              <p className="text-sm">{p.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
