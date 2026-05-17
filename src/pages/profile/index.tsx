import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/useAuth';
import { useUI } from '../../store/useUI';
import { Button } from '../../components/common/Button';
import { allTeams } from '../../lib/teams';
import { formatPoints } from '../../lib/utils';
import { useUploadAvatar, useUpdateProfile } from '../../lib/useMutations';
import { usePushNotifications } from '../../lib/usePushNotifications';
import { useFanTitle, useArenaStreak } from '../../lib/useArena';
import toast from 'react-hot-toast';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function useStreak() {
  const { profile, refreshProfile } = useAuth();
  useEffect(() => {
    if (!profile) return;
    const lastVisit = localStorage.getItem('quizgoal_last_visit');
    const today = new Date().toDateString();

    if (lastVisit !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastVisit === yesterday) {
        localStorage.setItem('quizgoal_last_visit', today);
      } else if (lastVisit !== today) {
        localStorage.setItem('quizgoal_last_visit', today);
      }
      refreshProfile();
    }
  }, [profile?.id, refreshProfile]);
}

export default function ProfileIndex() {
  const { t, i18n } = useTranslation();
  const { profile, signOut, refreshProfile } = useAuth();
  const { language, setLanguage } = useUI();
  const lang = i18n.language as 'en' | 'ar';
  const uploadAvatar = useUploadAvatar();
  const updateProfile = useUpdateProfile();
  const [uploading, setUploading] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState('');

  const notifications = usePushNotifications();

  useStreak();

  const userTeam = allTeams.find((t) => t.fifa_code === profile?.favorite_team_id);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${profile?.username || 'player'}`;
    navigator.clipboard.writeText(link);
    toast.success(lang === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
  };

  const { data: titleInfo } = useFanTitle();
  const { data: arenaStreak } = useArenaStreak();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    const url = await uploadAvatar.mutate(file, profile.id);
    if (url) {
      await refreshProfile();
    }
    setUploading(false);
  };

  const handleUpdateUsername = async () => {
    if (!username.trim() || !profile) return;
    const result = await updateProfile.mutate({ username: username.trim() });
    if (result !== null) { setEditingUsername(false); await refreshProfile(); }
  };

  const handleToggleNotifications = async () => {
    if (notifications.permission === 'denied') {
      toast.error(lang === 'ar' ? 'الإشعارات مرفوضة. فعّلها من إعدادات المتصفح.' : 'Notifications blocked. Enable in browser settings.');
      return;
    }
    if (notifications.enabled) {
      await notifications.unsubscribe();
      toast.success(lang === 'ar' ? 'تم تعطيل الإشعارات' : 'Notifications disabled');
    } else {
      const granted = await notifications.requestPermission();
      if (granted) {
        toast.success(lang === 'ar' ? 'تم تفعيل الإشعارات!' : 'Notifications enabled!');
      } else {
        toast.error(lang === 'ar' ? 'تم رفض الإذن' : 'Permission denied');
      }
    }
  };

  return (
    <div className="relative space-y-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold">{t('profile.title')}</h1>
      </motion.div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="stadium-card text-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-electric/[0.03] to-transparent pointer-events-none" />
          <div className="relative">
            <div className="relative inline-block group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-electric to-neon mx-auto mb-3 flex items-center justify-center text-3xl shadow-lg worldcup-glow overflow-hidden ring-2 ring-white/10">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  userTeam?.flag_emoji || '⚽'
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-electric hover:bg-electric-light flex items-center justify-center cursor-pointer text-xs shadow-lg transition-all hover:scale-105">
                📷
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>

            {editingUsername ? (
              <div className="flex items-center justify-center gap-2 mb-2">
                <input value={username} onChange={e => setUsername(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white w-32 text-center focus:outline-none focus:border-electric"
                  placeholder={profile?.username || 'Username'} />
                <button onClick={handleUpdateUsername} className="text-xs text-neon hover:text-neon-light">✓</button>
                <button onClick={() => setEditingUsername(false)} className="text-xs text-white/30 hover:text-white/50">✕</button>
              </div>
            ) : (
              <h2 className="text-lg font-bold cursor-pointer hover:text-electric-light transition-colors" onClick={() => { setUsername(profile?.username || ''); setEditingUsername(true); }}>
                {profile?.username || 'Player'} <span className="text-xs text-white/20">✏️</span>
              </h2>
            )}
            <p className="text-xs text-white/40">{lang === 'ar' ? 'عضو منذ' : 'Member since'} {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'today'}</p>
            {userTeam && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="text-lg">{userTeam.flag_emoji}</span>
                <span className="text-xs text-white/50">{lang === 'ar' ? userTeam.name_ar : userTeam.name_en}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-4 gap-2">
        <div className="glass-card text-center py-2.5 px-1">
          <div className="text-[9px] text-white-40/60 mb-0.5 truncate">{t('home.totalPoints')}</div>
          <div className="text-base font-bold text-gold">{formatPoints(profile?.points || 0)}</div>
        </div>
        <div className="glass-card text-center py-2.5 px-1">
          <div className="text-[9px] text-white-40/60 mb-0.5 truncate">{t('home.level')}</div>
          <div className="text-base font-bold text-electric">{profile?.level || 1}</div>
        </div>
        <div className="glass-card text-center py-2.5 px-1">
          <div className="text-[9px] text-white-40/60 mb-0.5 truncate">{t('common.xp')}</div>
          <div className="text-base font-bold text-neon">{formatPoints(profile?.xp || 0)}</div>
        </div>
        <div className="glass-card text-center py-2.5 px-1">
          <div className="text-[9px] text-white-40/60 mb-0.5 truncate">🔥</div>
          <div className="text-base font-bold text-gold">{profile?.streak || 0}</div>
        </div>
      </motion.div>

      {/* Fan Title */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="stadium-card flex items-center gap-3">
          <div className="text-3xl">{titleInfo?.icon || '🌱'}</div>
          <div>
            <div className="font-bold">{titleInfo ? (lang === 'ar' ? titleInfo.title_ar : titleInfo.title_en) : 'New Fan'}</div>
            <div className="text-[10px] text-white/40">
              {t('arena.yourTitle')} · 🔥 {arenaStreak?.current_streak || 0}d {t('arena.streak')}
              {arenaStreak?.longest_streak ? ` · Best: ${arenaStreak.longest_streak}d` : ''}
            </div>
          </div>
          <button onClick={() => navigate('/arena')} className="ml-auto text-xs text-electric hover:text-electric-light">
            {lang === 'ar' ? 'الساحة' : 'Arena'} →
          </button>
        </div>
      </motion.div>

      {/* Referrals */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="stadium-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🔗</span>
            <h3 className="text-sm font-bold">{t('profile.referrals')}</h3>
          </div>
          <p className="text-xs text-white/40 mb-3">
            {lang === 'ar' ? 'ادع أصدقائك واربح 200 نقطة لكل صديق' : 'Invite friends and earn 200 points each'}
          </p>
          <div className="flex items-center gap-2">
            <input readOnly value={`${window.location.origin}/signup?ref=${profile?.username || 'player'}`}
              className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white/40" />
            <Button variant="primary" size="sm" onClick={copyReferralLink}>
              {lang === 'ar' ? 'نسخ' : 'Copy'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="stadium-card" style={{ borderColor: notifications.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔔</span>
              <h3 className="text-sm font-bold">{t('profile.notifications')}</h3>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${notifications.enabled ? 'bg-neon/15 text-neon' : 'bg-white/5 text-white/30'}`}>
              {notifications.enabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <p className="text-xs text-white/40 mb-3">{t('profile.pushPermission')}</p>

          <Button
            variant={notifications.enabled ? 'ghost' : 'neon'}
            size="sm"
            className="w-full"
            onClick={handleToggleNotifications}
            disabled={notifications.permission === 'unsupported'}
          >
            {notifications.permission === 'unsupported'
              ? (lang === 'ar' ? 'غير مدعوم' : 'Unsupported')
              : notifications.enabled
                ? (lang === 'ar' ? 'تعطيل الإشعارات' : 'Disable Notifications')
                : (lang === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications')}
          </Button>

          {notifications.permission === 'denied' && (
            <div className="flex items-center gap-2 mt-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
              <span>⚠️</span>
              <span>{lang === 'ar' ? 'الإشعارات مرفوضة. فعّلها من إعدادات المتصفح.' : 'Notifications blocked. Enable in browser settings.'}</span>
            </div>
          )}

          {notifications.enabled && (
            <div className="flex items-center gap-2 mt-2 text-xs text-neon bg-neon/5 rounded-lg px-3 py-2">
              <span>✓</span>
              <span>{lang === 'ar' ? 'الإشعارات مفعلة - سيتم تذكيرك بالمباريات' : 'Notifications active - you\'ll get match reminders'}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Language */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="stadium-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🌐</span>
            <h3 className="text-sm font-bold">{t('profile.language')}</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLanguage('en')}
              className={`flex-1 py-2 rounded-xl text-sm transition-all ${language === 'en' ? 'bg-electric text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]' : 'bg-white/[0.04] text-white/40 hover:text-white/60'}`}>
              English
            </button>
            <button onClick={() => setLanguage('ar')}
              className={`flex-1 py-2 rounded-xl text-sm transition-all ${language === 'ar' ? 'bg-electric text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]' : 'bg-white/[0.04] text-white/40 hover:text-white/60'}`}>
              العربية
            </button>
          </div>
        </div>
      </motion.div>

      {/* Admin link */}
      {profile?.role === 'admin' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/admin')}>
            📊 {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}
          </Button>
        </motion.div>
      )}

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button variant="danger" size="lg" className="w-full" onClick={handleSignOut}>
          {t('profile.logout')}
        </Button>
      </motion.div>

      <div className="pb-4" />
    </div>
  );
}
