import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../store/useAuth';
import { shareOnWhatsApp } from '../../lib/shareUtils';
import toast from 'react-hot-toast';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

const REACTIONS = ['🔥', '❤️', '😂', '😍', '💀', '👏'];

const mockPosters = [
  { id: '1', flag: '🇧🇷', user: 'BrazilFan', team: 'Brazil', votes: 42, style: 'Stadium Hero' },
  { id: '2', flag: '🇦🇷', user: 'MessiFan', team: 'Argentina', votes: 38, style: 'Golden Trophy' },
  { id: '3', flag: '🇲🇦', user: 'AtlasLion', team: 'Morocco', votes: 35, style: 'Ultra Fan' },
  { id: '4', flag: '🇵🇹', user: 'CR7Fan', team: 'Portugal', votes: 31, style: 'Captain Card' },
  { id: '5', flag: '🇫🇷', user: 'BleuFan', team: 'France', votes: 28, style: 'Dark Premium' },
  { id: '6', flag: '🇩🇪', user: 'GermanMachine', team: 'Germany', votes: 25, style: 'Stadium Hero' },
  { id: '7', flag: '🇱🇧', user: 'LebanonStar', team: 'Lebanon', votes: 22, style: 'Lebanon Fan Edition' },
  { id: '8', flag: '🇪🇬', user: 'PharaohFan', team: 'Egypt', votes: 20, style: 'Arab Fan Edition' },
];

export default function PosterGallery() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { profile } = useAuth();
  const [votedPosts, setVotedPosts] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string[]>>({});
  const [showReactions, setShowReactions] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('poster_reactions').select('*').then(({ data }) => {
      if (data) {
        const grouped: Record<string, Record<string, number>> = {};
        for (const r of data) {
          if (!grouped[r.poster_id]) grouped[r.poster_id] = {};
          grouped[r.poster_id][r.reaction] = (grouped[r.poster_id][r.reaction] || 0) + 1;
        }
        setReactions(grouped);
        if (profile) {
          const mine: Record<string, string[]> = {};
          for (const r of data) {
            if (r.user_id === profile.id) {
              if (!mine[r.poster_id]) mine[r.poster_id] = [];
              mine[r.poster_id].push(r.reaction);
            }
          }
          setMyReactions(mine);
        }
      }
    });
  }, [profile?.id]);

  const handleVote = (posterId: string) => {
    if (votedPosts.has(posterId)) {
      toast.error(lang === 'ar' ? 'لقد صوّت بالفعل' : 'Already voted');
      return;
    }
    setVotedPosts(prev => new Set(prev).add(posterId));
    toast.success(lang === 'ar' ? 'تم التصويت! +10 نقاط' : 'Voted! +10 points');
  };

  const handleReact = async (posterId: string, reaction: string) => {
    const { error } = await supabase.rpc('toggle_poster_reaction', { p_poster_id: posterId, p_reaction: reaction });
    if (error) { toast.error(error.message); return; }
    // Optimistic update
    setReactions(prev => {
      const r = { ...prev };
      if (!r[posterId]) r[posterId] = {};
      if (r[posterId][reaction]) {
        r[posterId][reaction]--;
        if (r[posterId][reaction] <= 0) delete r[posterId][reaction];
      } else {
        r[posterId][reaction] = (r[posterId][reaction] || 0) + 1;
      }
      return r;
    });
    setMyReactions(prev => {
      const m = { ...prev };
      if (!m[posterId]) m[posterId] = [];
      if (m[posterId].includes(reaction)) {
        m[posterId] = m[posterId].filter(r => r !== reaction);
      } else {
        m[posterId] = [...m[posterId], reaction];
      }
      return m;
    });
    setShowReactions(null);
  };

  const handleShare = (poster: typeof mockPosters[0]) => {
    const text = lang === 'ar'
      ? `شوف بوستري التشجيعي لـ ${poster.team} 🎨 على QuizGoal 2026`
      : `Check out my fan poster for ${poster.team} 🎨 on QuizGoal 2026`;
    shareOnWhatsApp(text, window.location.href);
  };

  const handleReport = (posterId: string) => {
    const reason = lang === 'ar' ? prompt('سبب التبليغ:') : prompt('Reason for report:');
    if (reason) {
      supabase.rpc('report_poster', { p_poster_id: posterId, p_reason: reason }).then(({ error }) => {
        if (error) toast.error(error.message);
        else toast.success(lang === 'ar' ? 'تم التبليغ' : 'Reported');
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('poster.gallery')}</h1>
          <p className="text-sm text-white/50">{lang === 'ar' ? 'صوّت وتفاعل مع البوسترات' : 'Vote and react to posters'}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/poster/generator')}>
          {t('poster.generate')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {mockPosters.map((poster, i) => (
          <motion.div key={poster.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="overflow-hidden p-0">
              <div className="aspect-[3/4] bg-gradient-to-br from-navy-light to-electric/10 flex flex-col items-center justify-center p-4 text-center relative">
                <div className="text-5xl mb-2">{poster.flag}</div>
                <div className="text-sm font-bold">{poster.team}</div>
                <div className="text-[10px] text-white/40 mt-1">{poster.style}</div>
                <div className="absolute bottom-2 right-2 text-[8px] text-white/20">QuizGoal 2026</div>
              </div>
              <div className="p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/50">@{poster.user}</span>
                  <span className="text-xs text-gold">❤️ {poster.votes}</span>
                </div>

                {/* Reactions */}
                {reactions[poster.id] && Object.keys(reactions[poster.id]).length > 0 && (
                  <div className="flex gap-1 mb-1 flex-wrap">
                    {Object.entries(reactions[poster.id]).map(([emoji, count]) => (
                      <button key={emoji} onClick={() => handleReact(poster.id, emoji)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full transition-all ${myReactions[poster.id]?.includes(emoji) ? 'bg-electric/20 ring-1 ring-electric' : 'bg-white/5'}`}>
                        {emoji} {count}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-1 relative">
                  <button onClick={() => handleVote(poster.id)}
                    className={`flex-1 py-1 rounded-lg text-xs transition-all ${votedPosts.has(poster.id) ? 'bg-electric/20 text-electric' : 'bg-white/5 hover:bg-white/10 text-white/60'}`}>
                    {votedPosts.has(poster.id) ? '✅' : '❤️'} {t('poster.vote')}
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowReactions(showReactions === poster.id ? null : poster.id)}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/60">😊</button>
                    {showReactions === poster.id && (
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-navy-light border border-white/10 rounded-xl p-1.5 flex gap-1 shadow-xl z-10" onMouseLeave={() => setShowReactions(null)}>
                        {REACTIONS.map(emoji => (
                          <button key={emoji} onClick={() => handleReact(poster.id, emoji)}
                            className={`text-sm hover:scale-125 transition-transform ${myReactions[poster.id]?.includes(emoji) ? 'ring-1 ring-electric rounded-full' : ''}`}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleShare(poster)} className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/60">
                    📤
                  </button>
                  <button onClick={() => handleReport(poster.id)} className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-red-400/60 hover:text-red-400">
                    🚩
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
