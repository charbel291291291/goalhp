import { useCallback, useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/common/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/useAuth';
import { allMatches } from '../lib/matchSchedule';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function MatchRoom() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { profile } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  const matchId = new URLSearchParams(window.location.search).get('id');
  const match = allMatches.find(m => m.id === matchId) || null;

  type RoomMessageUser = { username?: string | null; avatar_url?: string | null };
  type RoomMessage = {
    id: string;
    room_id: string;
    user_id: string;
    message: string;
    created_at: string;
    user?: RoomMessageUser | null;
  };

  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [message, setMessage] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);

  const loadMessages = useCallback(async (rmId: string) => {
    const { data } = await supabase.from('room_messages')
      .select('*, user:user_id(username, avatar_url)')
      .eq('room_id', rmId)
      .order('created_at', { ascending: true })
      .limit(50);
    if (data) setMessages(data as unknown as RoomMessage[]);
  }, []);

  useEffect(() => {
    if (!matchId) return;
    supabase.from('match_rooms').select('id').eq('match_id', matchId).maybeSingle().then(({ data }) => {
      if (data) {
        setRoomId(data.id);
        loadMessages(data.id);
      } else {
        supabase.from('match_rooms').insert({ match_id: matchId }).select('id').single().then(({ data: newRoom }) => {
          if (newRoom) {
            setRoomId(newRoom.id);
            loadMessages(newRoom.id);
          }
        });
      }
    });

    return () => {};
  }, [matchId, loadMessages]);

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload: { new: unknown }) => {
        setMessages(prev => [...prev, payload.new as RoomMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !roomId || !profile) return;
    const { error } = await supabase.rpc('send_room_message', { p_room_id: roomId, p_message: message.trim() });
    if (error) return;
    setMessage('');
  };

  if (!match) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-4xl">🔍</div>
        <p className="text-white/50">{lang === 'ar' ? 'المباراة غير موجودة' : 'Match not found'}</p>
        <Button variant="ghost" onClick={() => navigate('/schedule')}>{t('common.back')}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/schedule')} className="text-white/60 hover:text-white text-sm">← {t('common.back')}</button>
        <div className="text-center">
          <div className="font-bold text-sm">{match.team_a?.flag_emoji} {lang === 'ar' ? match.team_a?.name_ar : match.team_a?.name_en} vs {match.team_b?.flag_emoji} {lang === 'ar' ? match.team_b?.name_ar : match.team_b?.name_en}</div>
          <div className="text-[10px] text-white/40">
            {match.stage === 'group' ? `Group ${match.group_name}` : match.stage} · {new Date(match.kickoff_at).toLocaleDateString()}
          </div>
        </div>
        <div className="w-16" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 px-1">
        {messages.map((msg) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.user_id === profile?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.user_id === profile?.id ? 'bg-electric/20' : 'bg-white/5'} rounded-2xl px-4 py-2`}>
              {msg.user_id !== profile?.id && (
                <div className="text-[10px] text-white/40 mb-0.5">{msg.user?.username || 'Anonymous'}</div>
              )}
              <div className="text-sm">{msg.message}</div>
              <div className="text-[8px] text-white/30 text-right mt-0.5">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input value={message} onChange={e => setMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder={t('matchRoom.placeholder')}
          maxLength={500}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-electric" />
        <Button variant="primary" onClick={handleSend} disabled={!message.trim()}>
          {t('matchRoom.send')}
        </Button>
      </div>
    </div>
  );
}
