import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../store/useAuth';
import toast from 'react-hot-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export function useFriendChat(friendId: string | null) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadMessages = useCallback(async () => {
    if (!profile || !friendId || !UUID_RE.test(friendId)) { setLoading(false); return; }

    // Verify friendship before loading messages
    const { data: friendship } = await supabase
      .from('friends')
      .select('id')
      .or(
        `and(requester_id.eq.${profile.id},addressee_id.eq.${friendId}),` +
        `and(requester_id.eq.${friendId},addressee_id.eq.${profile.id})`
      )
      .eq('status', 'accepted')
      .maybeSingle();
    if (!friendship) { setLoading(false); return; }

    const { data } = await supabase
      .from('friend_messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data as ChatMessage[]);
    setLoading(false);
  }, [profile, friendId]);

  // Mark messages as read
  useEffect(() => {
    if (!profile || !friendId || !UUID_RE.test(friendId)) return;
    supabase
      .from('friend_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', friendId)
      .eq('receiver_id', profile.id)
      .is('read_at', null)
      .then(({ error }) => {
        if (error) console.error('Mark read error:', error);
      });
  }, [profile, friendId, messages.length]);

  // Realtime subscription
  useEffect(() => {
    if (!profile || !friendId || !UUID_RE.test(friendId)) return;
    const channelName = `chat:${[profile.id, friendId].sort().join(':')}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'friend_messages',
        filter: `sender_id=eq.${friendId}`,
      },
      (payload) => {
        const msg = payload.new as ChatMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    );
    channel.subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [profile, friendId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await Promise.resolve();
      if (!cancelled) await loadMessages();
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [loadMessages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!profile || !friendId || !text.trim()) return;
    setSending(true);
    const { data, error } = await supabase
      .from('friend_messages')
      .insert({
        sender_id: profile.id,
        receiver_id: friendId,
        message: text.trim(),
      })
      .select()
      .single();
    if (data) {
      setMessages(prev => [...prev, data as unknown as ChatMessage]);
    }
    if (error) {
      console.error('Send error:', error);
      toast.error('Failed to send message');
    }
    setSending(false);
  }, [profile, friendId]);

  return { messages, loading, sending, sendMessage };
}
