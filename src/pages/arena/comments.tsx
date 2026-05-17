import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/common/Button';
import { useArenaComments, createArenaComment, toggleArenaReaction } from '../../lib/useArena';
import toast from 'react-hot-toast';
import type { ArenaReactionType } from '../../types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const COMMENT_REACTIONS: { key: ArenaReactionType; icon: string }[] = [
  { key: 'agree', icon: '👍' },
  { key: 'disagree', icon: '👎' },
  { key: 'laugh', icon: '😂' },
  { key: 'fire', icon: '🔥' },
];

export default function ArenaComments({ postId, onReactionChange }: { postId: string; onReactionChange?: () => void }) {
  const { t } = useTranslation();
  const { data: comments, refetch } = useArenaComments(postId);
  const nowTs = new Date().getTime();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      const result = await createArenaComment(postId, newComment.trim());
      if (result?.success) {
        setNewComment('');
        refetch();
        onReactionChange?.();
      }
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    try {
      const result = await createArenaComment(postId, replyText.trim(), parentId);
      if (result?.success) {
        setReplyText('');
        setReplyTo(null);
        refetch();
      }
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
  };

  const handleReact = async (commentId: string, reaction: ArenaReactionType) => {
    await toggleArenaReaction(reaction, undefined, commentId);
    refetch();
    onReactionChange?.();
  };

  return (
    <div>
      <div className="space-y-2 max-h-60 overflow-y-auto mb-2">
        {comments.map((c) => (
          <div key={c.id} className="bg-white/5 rounded-xl p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold">{c.user?.username || 'Anonymous'}</span>
              <span className="text-[8px] text-white/30">
                {Math.floor((nowTs - new Date(c.created_at).getTime()) / 60000)}m
              </span>
            </div>
            <p className="text-xs leading-relaxed">{c.content}</p>
            <div className="flex items-center gap-1 mt-1">
              {COMMENT_REACTIONS.map(r => {
                const active = c.my_reactions?.includes(r.key);
                return (
                  <button key={r.key} onClick={() => handleReact(c.id, r.key)}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full transition-all ${active ? 'bg-electric/20 ring-1 ring-electric' : 'bg-white/5 text-white/50'}`}>
                    {r.icon}
                  </button>
                );
              })}
              <span className="text-[9px] text-white/30 ml-1">{c.reactions_count}</span>
              <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                className="text-[9px] text-white/30 hover:text-white ml-1">
                {t('arena.comment')}
              </button>
            </div>
            {replyTo === c.id && (
              <div className="flex gap-1 mt-1">
                <input value={replyText} onChange={e => setReplyText(e.target.value)} maxLength={200}
                  placeholder="..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none" />
                <button onClick={() => handleReply(c.id)} disabled={!replyText.trim()}
                  className="px-2 py-1 rounded-lg bg-electric/20 text-xs text-electric">Reply</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={newComment} onChange={e => setNewComment(e.target.value)} maxLength={300}
          onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
          placeholder={t('arena.comment') + '...'}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-electric" />
        <Button variant="primary" size="sm" onClick={handleComment} disabled={!newComment.trim()}>
          {t('arena.post')}
        </Button>
      </div>
    </div>
  );
}
