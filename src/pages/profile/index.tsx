import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/useAuth';
import { useUI } from '../../store/useUI';
import { allTeams } from '../../lib/teams';
import { formatPoints, getXPForLevel } from '../../lib/utils';
import { useUploadAvatar, useUpdateProfile } from '../../lib/useMutations';
import { usePushNotifications } from '../../lib/usePushNotifications';
import { useFanTitle, useArenaStreak } from '../../lib/useArena';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

let _streakRecorded = false;
const USERNAME_RE = /^[a-zA-Z0-9_]{2,30}$/;

function useStreak() {
  const { profile, refreshProfile } = useAuth();
  useEffect(() => {
    if (!profile || _streakRecorded) return;
    _streakRecorded = true;
    supabase.rpc('record_daily_visit').then(() => refreshProfile());
  }, [profile?.id, refreshProfile]);
}

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-white/[0.04] rounded-2xl py-3 px-2">
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-white/40 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${enabled ? 'bg-electric' : 'bg-white/20'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

export default function ProfileIndex() {
  const { t, i18n } = useTranslation();
  const { profile, signOut, refreshProfile } = useAuth();
  const { language, setLanguage } = useUI();
  const lang = i18n.language as 'en' | 'ar';

  const uploadAvatar = useUploadAvatar();
  const updateProfile = useUpdateProfile();
  const notifications = usePushNotifications();
  const { data: titleInfo } = useFanTitle();
  const { data: arenaStreak } = useArenaStreak();

  const [uploading, setUploading] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  useStreak();

  const userTeam = allTeams.find((t) => t.fifa_code === profile?.favorite_team_id);

  // XP progress toward next level
  const currentLevel = profile?.level || 1;
  const currentXP = profile?.xp || 0;
  const xpForThisLevel = getXPForLevel(currentLevel);
  const xpForNextLevel = getXPForLevel(currentLevel + 1);
  const xpProgress = xpForNextLevel > xpForThisLevel
    ? Math.min(100, Math.round(((currentXP - xpForThisLevel) / (xpForNextLevel - xpForThisLevel)) * 100))
    : 100;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${profile?.username || 'player'}`;
    navigator.clipboard.writeText(link);
    toast.success(lang === 'ar' ? 'تم نسخ الرابط!' : 'Link copied!');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !profile) return;
    setUploading(true);
    const url = await uploadAvatar.mutate(file, profile.id);
    if (url) await refreshProfile();
    setUploading(false);
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (!val) { setUsernameError(''); return; }
    if (!USERNAME_RE.test(val)) {
      setUsernameError(lang === 'ar' ? '٢-٣٠ حرف: أرقام وحروف وشرطة سفلية فقط' : '2-30 chars: letters, numbers, underscore');
    } else {
      setUsernameError('');
    }
  };

  const handleUpdateUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed || !profile) return;
    if (!USERNAME_RE.test(trimmed)) {
      toast.error(lang === 'ar' ? 'اسم مستخدم غير صالح' : 'Invalid username');
      return;
    }
    const result = await updateProfile.mutate({ username: trimmed });
    if (result !== null) {
      setEditingUsername(false);
      setUsernameError('');
      await refreshProfile();
    }
  };

  const handleToggleNotifications = async () => {
    if (notifications.permission === 'denied') {
      toast.error(lang === 'ar' ? 'الإشعارات مرفوضة. فعّلها من إعدادات المتصفح.' : 'Notifications blocked. Enable in browser settings.');
      return;
    }
    if (notifications.enabled) {
      await notifications.unsubscribe();
    } else {
      const granted = await notifications.requestPermission();
      if (!granted) toast.error(lang === 'ar' ? 'تم رفض الإذن' : 'Permission denied');
    }
  };

  return (
    <div className="pb-8 space-y-4">

      {/* ── Hero ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-electric/20 via-neon/10 to-transparent border border-white/[0.07]">
          {/* top gradient band */}
          <div className="h-20 bg-gradient-to-r from-electric/30 to-neon/20" />

          <div className="px-5 pb-5">
            {/* Avatar — pulled up over the band */}
            <div className="relative -mt-12 mb-3 flex items-end gap-4">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full ring-4 ring-background bg-gradient-to-br from-electric to-neon flex items-center justify-center text-4xl shadow-xl overflow-hidden">
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : userTeam?.flag_emoji || '⚽'}
                </div>
                {/* upload button — label references input rendered at page root (outside overflow:hidden) */}
                <label
                  htmlFor="avatar-file-input"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-electric hover:bg-blue-500 flex items-center justify-center cursor-pointer text-sm shadow-lg transition-all active:scale-90"
                >
                  {uploading ? '⏳' : '📷'}
                </label>
              </div>

              {/* name + team */}
              <div className="flex-1 min-w-0 mt-12">
                {userTeam && (
                  <div className="flex items-center gap-1 text-xs text-white/50 mb-0.5">
                    <span>{userTeam.flag_emoji}</span>
                    <span className="truncate">{lang === 'ar' ? userTeam.name_ar : userTeam.name_en}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-base font-bold truncate">{profile?.username || 'Player'}</span>
                  <button
                    type="button"
                    onClick={() => { setUsername(profile?.username || ''); setUsernameError(''); setEditingUsername(true); }}
                    className="text-white/30 hover:text-electric transition-colors text-xs shrink-0"
                    aria-label="Edit username"
                  >
                    ✏️
                  </button>
                </div>
                <p className="text-[10px] text-white/30">
                  {lang === 'ar' ? 'عضو منذ' : 'Since'} {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                </p>
                {profile?.user_code && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.user_code!);
                      toast.success(lang === 'ar' ? 'تم نسخ الـ ID!' : 'ID copied!');
                    }}
                    className="mt-1 flex items-center gap-1 group"
                  >
                    <span className="text-[11px] text-electric font-mono font-bold">#{profile.user_code}</span>
                    <span className="text-[9px] text-white/20 group-hover:text-white/50 transition-colors">⧉</span>
                  </button>
                )}
              </div>
            </div>

            {/* Fan title */}
            {titleInfo && (
              <div className="flex items-center gap-2 mt-1 bg-white/[0.04] rounded-2xl px-3 py-2">
                <span className="text-xl">{titleInfo.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {lang === 'ar' ? titleInfo.title_ar : titleInfo.title_en}
                  </p>
                  <p className="text-[10px] text-white/40">
                    🔥 {arenaStreak?.current_streak || 0}d streak
                    {arenaStreak?.longest_streak ? ` · best ${arenaStreak.longest_streak}d` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/arena')}
                  className="text-xs text-electric hover:text-blue-400 shrink-0"
                >
                  {lang === 'ar' ? 'الساحة ←' : 'Arena →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Username edit modal — rendered via portal directly on document.body.
          The page is wrapped in a framer-motion div with CSS transforms; any
          position:fixed child is confined to that transformed ancestor instead
          of the real viewport, so tap coordinates are wrong on mobile.
          createPortal escapes all ancestors and fixes coordinates. */}
      {editingUsername && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.75)' }}
            onClick={() => { setEditingUsername(false); setUsernameError(''); }}
          />
          <div style={{ position: 'fixed', left: 16, right: 16, top: 80, zIndex: 9999, maxWidth: 420, margin: '0 auto' }}>
            <div className="bg-[#0f1620] border border-white/10 rounded-3xl p-5 shadow-2xl">
              <h3 className="text-sm font-bold mb-3 text-center">{lang === 'ar' ? 'تعديل اسم المستخدم' : 'Edit Username'}</h3>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                maxLength={30}
                placeholder={profile?.username || 'username'}
                className={`w-full bg-white/5 border rounded-2xl px-4 py-3 text-sm text-white text-center focus:outline-none transition-colors ${usernameError ? 'border-red-500' : 'border-white/10 focus:border-electric'}`}
              />
              {usernameError && <p className="text-xs text-red-400 text-center mt-2">{usernameError}</p>}
              {updateProfile.error && <p className="text-xs text-red-400 text-center mt-2">{updateProfile.error}</p>}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => { setEditingUsername(false); setUsernameError(''); }}
                  className="flex-1 py-3 rounded-2xl bg-white/10 text-white/60 text-sm font-semibold active:bg-white/20"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!!usernameError || updateProfile.loading}
                  onClick={handleUpdateUsername}
                  className="flex-1 py-3 rounded-2xl bg-electric text-white text-sm font-semibold active:bg-blue-500 disabled:opacity-40"
                >
                  {updateProfile.loading ? (lang === 'ar' ? 'جاري الحفظ…' : 'Saving…') : (lang === 'ar' ? 'حفظ' : 'Save')}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ── Stats ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-4 gap-2">
          <StatPill label={lang === 'ar' ? 'نقاط' : 'Points'} value={formatPoints(profile?.points || 0)} color="text-gold" />
          <StatPill label={lang === 'ar' ? 'مستوى' : 'Level'} value={currentLevel} color="text-electric" />
          <StatPill label="XP" value={formatPoints(currentXP)} color="text-neon" />
          <StatPill label={lang === 'ar' ? 'يومياً' : 'Streak'} value={`${profile?.streak || 0}🔥`} color="text-gold" />
        </div>
      </motion.div>

      {/* ── XP Progress ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="bg-white/[0.04] rounded-2xl px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-white/50">{lang === 'ar' ? `المستوى ${currentLevel}` : `Level ${currentLevel}`}</span>
            <span className="text-[11px] text-white/50">{xpProgress}% → {lang === 'ar' ? `مستوى ${currentLevel + 1}` : `Lv ${currentLevel + 1}`}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-gradient-to-r from-electric to-neon rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* ── Settings card ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="bg-white/[0.04] rounded-3xl overflow-hidden divide-y divide-white/[0.06]">

          {/* Language */}
          <div className="px-4 py-3.5 flex items-center gap-3">
            <span className="text-lg w-7 text-center">🌐</span>
            <span className="flex-1 text-sm font-medium">{lang === 'ar' ? 'اللغة' : 'Language'}</span>
            <div className="flex gap-1 bg-white/[0.06] rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-all ${language === 'en' ? 'bg-electric text-white shadow' : 'text-white/40 hover:text-white/70'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-all ${language === 'ar' ? 'bg-electric text-white shadow' : 'text-white/40 hover:text-white/70'}`}
              >
                AR
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="px-4 py-3.5 flex items-center gap-3">
            <span className="text-lg w-7 text-center">🔔</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</p>
              {notifications.permission === 'denied' && (
                <p className="text-[10px] text-red-400">{lang === 'ar' ? 'مرفوضة في المتصفح' : 'Blocked in browser'}</p>
              )}
            </div>
            {notifications.permission === 'unsupported'
              ? <span className="text-[10px] text-white/30">{lang === 'ar' ? 'غير مدعوم' : 'Unsupported'}</span>
              : <ToggleSwitch enabled={notifications.enabled} onChange={handleToggleNotifications} />
            }
          </div>

          {/* Referral */}
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg w-7 text-center">🔗</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{lang === 'ar' ? 'دعوة صديق' : 'Invite Friend'}</p>
                <p className="text-[10px] text-white/40">{lang === 'ar' ? '+٢٠٠ نقطة لكل صديق' : '+200 pts per friend'}</p>
              </div>
              <button
                type="button"
                onClick={copyReferralLink}
                className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-semibold transition-all active:scale-95"
              >
                {lang === 'ar' ? 'نسخ' : 'Copy'}
              </button>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-[10px] text-white/30 truncate select-all">
              {`${window.location.origin}/signup?ref=${profile?.username || 'player'}`}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Admin ── */}
      {profile?.role === 'admin' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-3 bg-white/[0.04] hover:bg-white/[0.07] rounded-2xl px-4 py-3.5 transition-all"
          >
            <span className="text-lg">📊</span>
            <span className="flex-1 text-sm font-medium text-left">{lang === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard'}</span>
            <span className="text-white/30 text-xs">→</span>
          </button>
        </motion.div>
      )}

      {/* ── Sign Out ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm font-semibold transition-all active:scale-[0.98] border border-red-500/20"
        >
          {t('profile.logout')}
        </button>
      </motion.div>

      {/* File input via portal — same transform-stacking-context issue applies.
          The label inside the page can still reference it globally by id. */}
      {createPortal(
        <input
          id="avatar-file-input"
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          disabled={uploading}
          style={{
            position: 'fixed',
            top: -9999,
            left: -9999,
            width: 1,
            height: 1,
            opacity: 0,
          }}
        />,
        document.body
      )}
    </div>
  );
}
