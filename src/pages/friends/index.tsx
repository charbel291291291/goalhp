import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/useAuth';
import { useFriends, type FriendWithStatus } from '../../lib/useFriends';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function FriendsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';
  const { profile } = useAuth();
  const friendsHook = useFriends();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendWithStatus[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [challengingId, setChallengingId] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for incoming battle invites via Realtime
  useEffect(() => {
    if (!profile) return;
    const channel = supabase.channel(`battle:invite:${profile.id}`, {
      config: { broadcast: { self: false } },
    });
    channel.on('broadcast', { event: 'challenge' }, async (payload) => {
      const { from_username, invite_id } = payload.payload as { from_username: string; invite_id: string };

      // Verify the invite actually exists in the DB — prevents spoofed broadcasts
      const { data: pendingInvites } = await supabase.rpc('get_pending_invites');
      const validInvite = (pendingInvites as Array<{ invite_id: string }> | null)
        ?.find(inv => inv.invite_id === invite_id);
      if (!validInvite) return;

      friendsHook.refresh();
      const accepted = await new Promise<boolean>((resolve) => {
        toast(
          (t) => {
            const handleAccept = async () => {
              resolve(true);
              if (t) toast.dismiss(t.id);
            };
            const handleDecline = async () => {
              resolve(false);
              if (t) toast.dismiss(t.id);
            };
            return (
              <div className="text-center">
                <div className="font-bold mb-1">⚔️ {from_username} {lang === 'ar' ? 'تحداك!' : 'challenged you!'}</div>
                <div className="flex gap-2 justify-center mt-2">
                  <button onClick={handleAccept} className="px-4 py-1 rounded-lg bg-neon text-white text-sm font-semibold">
                    {lang === 'ar' ? 'قبول' : 'Accept'}
                  </button>
                  <button onClick={handleDecline} className="px-4 py-1 rounded-lg bg-white/10 text-white/70 text-sm">
                    {lang === 'ar' ? 'رفض' : 'Decline'}
                  </button>
                </div>
              </div>
            );
          },
          { duration: 15000 }
        );
      });
      if (accepted) {
        const { data } = await supabase.rpc('accept_battle_invite', { p_invite_id: invite_id });
        if (data?.battle_id) {
          navigate(`/battle/pvp?mode=friend&battle_id=${data.battle_id}`);
        }
      } else {
        await supabase.rpc('decline_battle_invite', { p_invite_id: invite_id });
      }
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (q.length < 6) { setSearchResults([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await friendsHook.searchUsers(q);
      setSearchResults(results);
      setSearching(false);
    }, 300);
  };

  const handleChallenge = async (friend: FriendWithStatus) => {
    setChallengingId(friend.id);
    const result = await friendsHook.sendBattleInvite(friend.id);
    setChallengingId(null);
    if (result) {
      const { battleId, inviteId } = result;
      // Subscribe to friend's channel and notify them
      const channel = supabase.channel(`battle:invite:${friend.id}`, {
        config: { broadcast: { self: false } },
      });
      channel.subscribe(async () => {
        await channel.send({
          type: 'broadcast',
          event: 'challenge',
          payload: {
            from_user_id: profile?.id,
            from_username: profile?.username,
            battle_id: battleId,
            invite_id: inviteId,
          },
        });
        supabase.removeChannel(channel);
      });
      toast.success(lang === 'ar' ? 'تم إرسال التحدي!' : 'Challenge sent!');
      navigate(`/battle/pvp?mode=friend&battle_id=${battleId}`);
    }
  };

  const renderFriendsList = () => {
    const accepted = friendsHook.friends.filter(f => f.status === 'accepted');
    if (accepted.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-white/40 text-sm">{lang === 'ar' ? 'لا يوجد أصدقاء بعد' : 'No friends yet'}</p>
          <button onClick={() => setTab('search')} className="mt-3 text-electric-light text-sm hover:text-electric">
            {lang === 'ar' ? 'ابحث عن أصدقاء' : 'Find friends'}
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {accepted.map((friend) => (
          <div key={friend.id} className="stadium-card flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric to-neon flex items-center justify-center text-sm font-bold flex-shrink-0">
              {friend.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{friend.username}</div>
            </div>
            <button
              onClick={() => navigate(`/friends/chat?friend_id=${friend.id}&name=${encodeURIComponent(friend.username)}`)}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs font-semibold hover:bg-white/20 transition-all"
            >
              💬
            </button>
            <button
              onClick={() => handleChallenge(friend)}
              disabled={challengingId === friend.id}
              className="px-3 py-1.5 rounded-lg bg-electric/20 text-electric-light text-xs font-semibold hover:bg-electric/30 transition-all disabled:opacity-40"
            >
              {challengingId === friend.id ? '...' : (lang === 'ar' ? 'تحدي' : 'Challenge')}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderRequests = () => {
    if (friendsHook.pendingRequests.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📩</div>
          <p className="text-white/40 text-sm">{lang === 'ar' ? 'لا توجد طلبات صداقة' : 'No pending requests'}</p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {friendsHook.pendingRequests.map((req) => (
          <div key={req.request_id} className="stadium-card flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-electric flex items-center justify-center text-sm font-bold flex-shrink-0">
              {req.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{req.username}</div>
              <div className="text-[10px] text-white/30">{lang === 'ar' ? 'يريد صداقتك' : 'Wants to be friends'}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => friendsHook.respondToRequest(req.request_id, true)}
                className="px-3 py-1.5 rounded-lg bg-neon/20 text-neon text-xs font-semibold hover:bg-neon/30 transition-all"
              >
                ✓
              </button>
              <button
                onClick={() => friendsHook.respondToRequest(req.request_id, false)}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSearch = () => (
    <div>
      <div className="mb-4">
        <p className="text-[11px] text-white/40 mb-2">
          {lang === 'ar' ? 'أدخل الـ ID المكون من 6 أرقام' : 'Enter the 6-digit Player ID'}
        </p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-electric font-bold text-sm">#</span>
          <input
            value={searchQuery}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              handleSearch(val);
            }}
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-electric transition-all tracking-widest font-mono"
          />
          {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg animate-football-spin">⚽</span>}
        </div>
      </div>

      {searchResults.length === 0 && searchQuery.length === 6 && !searching && (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-white/30 text-sm">{lang === 'ar' ? 'لا يوجد لاعب بهذا الـ ID' : 'No player found with this ID'}</p>
        </div>
      )}

      <div className="space-y-2">
        {searchResults.map((user) => (
          <div key={user.id} className="stadium-card flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric to-neon flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.username}</div>
              <div className="text-[10px] text-white/40 font-mono">#{user.user_code}</div>
            </div>
            {user.status === 'none' && (
              <button
                onClick={() => friendsHook.sendFriendRequest(user.user_code || '')}
                className="px-3 py-1.5 rounded-lg bg-electric/20 text-electric-light text-xs font-semibold hover:bg-electric/30 transition-all"
              >
                + {lang === 'ar' ? 'إضافة' : 'Add'}
              </button>
            )}
            {user.status === 'pending' && (
              <span className="text-xs text-white/30">{lang === 'ar' ? 'في الانتظار' : 'Pending'}</span>
            )}
            {user.status === 'accepted' && (
              <span className="text-xs text-neon">✓ {lang === 'ar' ? 'صديق' : 'Friend'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold">👥 {t('friends.title')}</h1>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
        {(['friends', 'requests', 'search'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t ? 'bg-electric/20 text-electric-light' : 'text-white/30 hover:text-white/50'
            }`}
          >
            {t === 'friends' ? (lang === 'ar' ? 'الأصدقاء' : 'Friends') :
             t === 'requests' ? (lang === 'ar' ? 'الطلبات' : 'Requests') :
             (lang === 'ar' ? 'بحث' : 'Search')}
            {t === 'requests' && friendsHook.pendingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gold/20 text-gold text-[9px]">
                {friendsHook.pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {friendsHook.loading ? (
        <div className="text-center py-12">
          <div className="text-3xl animate-football-spin mx-auto">⚽</div>
        </div>
      ) : (
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {tab === 'friends' && renderFriendsList()}
          {tab === 'requests' && renderRequests()}
          {tab === 'search' && renderSearch()}
        </motion.div>
      )}

      {/* Pending invites section */}
      {friendsHook.pendingInvites.length > 0 && tab === 'friends' && (
        <div>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            {lang === 'ar' ? 'تحديات واردة' : 'Incoming Challenges'}
          </h3>
          <div className="space-y-2">
            {friendsHook.pendingInvites.map((inv) => (
              <div key={inv.invite_id} className="stadium-card flex items-center gap-3 p-3" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                <div className="text-2xl">⚔️</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{inv.from_username} {lang === 'ar' ? 'يتحداك!' : 'challenges you!'}</div>
                </div>
                <button
                  onClick={async () => {
                    const battleId = await friendsHook.acceptInvite(inv.invite_id);
                    if (battleId) navigate(`/battle/pvp?mode=friend&battle_id=${battleId}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neon/20 text-neon text-xs font-semibold hover:bg-neon/30 transition-all"
                >
                  {lang === 'ar' ? 'قبول' : 'Accept'}
                </button>
                <button
                  onClick={() => friendsHook.declineInvite(inv.invite_id)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/30 text-xs hover:bg-white/10 transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
