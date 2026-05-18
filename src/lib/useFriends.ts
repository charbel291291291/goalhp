import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../store/useAuth';
import toast from 'react-hot-toast';

export interface FriendUser {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface FriendWithStatus extends FriendUser {
  status: string;
}

export interface FriendRequest {
  request_id: string;
  requester_id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface BattleInvite {
  invite_id: string;
  from_user_id: string;
  from_username: string;
  from_avatar?: string;
  battle_id: string;
  created_at: string;
}

export function useFriends() {
  const { profile } = useAuth();
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [pendingInvites, setPendingInvites] = useState<BattleInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const [friendsRes, requestsRes, invitesRes] = await Promise.all([
      supabase.rpc('get_friends'),
      supabase.rpc('get_pending_requests'),
      supabase.rpc('get_pending_invites'),
    ]);
    if (friendsRes.data) setFriends(friendsRes.data);
    if (requestsRes.data) setPendingRequests(requestsRes.data);
    if (invitesRes.data) setPendingInvites(invitesRes.data);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await Promise.resolve();
      if (!cancelled) await load();
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const searchUsers = useCallback(async (query: string): Promise<FriendWithStatus[]> => {
    if (!query.trim()) return [];
    const { data } = await supabase.rpc('search_users', { p_query: query.trim() });
    return data || [];
  }, []);

  const sendFriendRequest = useCallback(async (username: string) => {
    const { data } = await supabase.rpc('send_friend_request', { p_username: username });
    if (data?.error) { toast.error(data.error); return false; }
    toast.success('Friend request sent!');
    load();
    return true;
  }, [load]);

  const respondToRequest = useCallback(async (requestId: string, accept: boolean) => {
    await supabase.rpc('respond_friend_request', { p_request_id: requestId, p_accept: accept });
    toast.success(accept ? 'Friend request accepted!' : 'Request rejected');
    load();
  }, [load]);

  const sendBattleInvite = useCallback(async (friendId: string): Promise<{ battleId: string; inviteId: string } | null> => {
    const { data } = await supabase.rpc('send_battle_invite', { p_to_user_id: friendId });
    if (data?.error) { toast.error(data.error); return null; }
    if (!data?.battle_id || !data?.invite_id) return null;
    return { battleId: data.battle_id, inviteId: data.invite_id };
  }, []);

  const acceptInvite = useCallback(async (inviteId: string): Promise<string | null> => {
    const { data } = await supabase.rpc('accept_battle_invite', { p_invite_id: inviteId });
    if (data?.error) { toast.error(data.error); return null; }
    load();
    return data?.battle_id || null;
  }, [load]);

  const declineInvite = useCallback(async (inviteId: string) => {
    await supabase.rpc('decline_battle_invite', { p_invite_id: inviteId });
    load();
  }, [load]);

  return {
    friends,
    pendingRequests,
    pendingInvites,
    loading,
    searchUsers,
    sendFriendRequest,
    respondToRequest,
    sendBattleInvite,
    acceptInvite,
    declineInvite,
    refresh: load,
  };
}
