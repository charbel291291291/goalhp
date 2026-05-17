import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common/Card';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function AdminOverview() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'ar';

  const [stats, setStats] = useState({ users: 0, matches: 0, predictions: 0, posters: 0, reports: 0, questions: 0 });
  const [recentUsers, setRecentUsers] = useState<Pick<Profile, 'id' | 'username' | 'avatar_url' | 'created_at'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }),
      supabase.from('predictions').select('id', { count: 'exact', head: true }),
      supabase.from('fan_posters').select('id', { count: 'exact', head: true }),
      supabase.from('poster_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('active', true),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10),
    ]).then(([u, m, p, po, r, q, usersRes]) => {
      setStats({
        users: u.count || 0,
        matches: m.count || 48,
        predictions: p.count || 0,
        posters: po.count || 0,
        reports: r.count || 0,
        questions: q.count || 0,
      });
      setRecentUsers((usersRes.data || []).map((u) => ({
        id: u.id, username: u.username, avatar_url: u.avatar_url, created_at: u.created_at,
      })));
      setLoading(false);
    });
  }, []);

  const nowTs = new Date().getTime();
  const formatDate = (d: string) => {
    const days = Math.floor((nowTs - new Date(d).getTime()) / 86400000);
    return days === 0 ? lang === 'ar' ? 'اليوم' : 'Today' : days === 1 ? lang === 'ar' ? 'أمس' : 'Yesterday' : `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📊 {t('admin.overview')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: lang === 'ar' ? 'المستخدمين' : 'Users', value: stats.users.toLocaleString(), icon: '👥', color: 'text-electric' },
          { label: lang === 'ar' ? 'المباريات' : 'Matches', value: stats.matches.toLocaleString(), icon: '⚽', color: 'text-neon' },
          { label: lang === 'ar' ? 'التوقعات' : 'Predictions', value: stats.predictions.toLocaleString(), icon: '🔮', color: 'text-gold' },
          { label: lang === 'ar' ? 'البوسترات' : 'Posters', value: stats.posters.toLocaleString(), icon: '🎨', color: 'text-pink-400' },
          { label: lang === 'ar' ? 'الأسئلة' : 'Questions', value: stats.questions.toLocaleString(), icon: '❓', color: 'text-blue-400' },
          { label: lang === 'ar' ? 'البلاغات' : 'Reports', value: stats.reports.toLocaleString(), icon: '🚩', color: stats.reports > 0 ? 'text-red-400' : 'text-white/40' },
        ].map((stat) => (
          <Card key={stat.label} className="text-center p-4">
            <div className={`text-2xl mb-1 ${stat.color}`}>{stat.icon}</div>
            <div className="text-xl font-bold">{loading ? '—' : stat.value}</div>
            <div className="text-xs text-white/40">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-bold mb-3">{lang === 'ar' ? 'آخر المستخدمين' : 'Recent Users'}</h3>
          {loading ? (
            <div className="text-white/40 text-sm">{t('common.loading')}</div>
          ) : recentUsers.length === 0 ? (
            <div className="text-white/30 text-sm">{lang === 'ar' ? 'لا يوجد مستخدمين' : 'No users'}</div>
          ) : (
            recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2 text-sm border-b border-white/5 last:border-0">
                <div className="w-8 h-8 rounded-full bg-electric/20 flex items-center justify-center text-xs font-bold">
                  {u.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="font-medium">{u.username || 'Anonymous'}</div>
                  <div className="text-xs text-white/40">{formatDate(u.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card>
          <h3 className="font-bold mb-3">{lang === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Add Question', icon: '❓', href: '/admin/questions' },
              { label: 'Add Match', icon: '⚽', href: '/admin/matches' },
              { label: 'Add Sponsor', icon: '🤝', href: '/admin/sponsors' },
              { label: 'Add Reward', icon: '🎁', href: '/admin/rewards' },
              { label: lang === 'ar' ? 'البلاغات' : 'Reports', icon: '🚩', href: '/admin/reports' },
              { label: lang === 'ar' ? 'الإعدادات' : 'Settings', icon: '⚙️', href: '/admin/settings' },
            ].map((action) => (
              <button key={action.label} onClick={() => navigate(action.href)}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-center text-sm transition-all">
                <div className="text-xl mb-1">{action.icon}</div>
                <div className="text-white/70">{action.label}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {stats.reports > 0 && (
        <Card className="border border-red-500/20 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-red-400">🚩 {lang === 'ar' ? 'بلاغات معلقة' : 'Pending Reports'}</h3>
              <p className="text-sm text-white/50">{stats.reports} {lang === 'ar' ? 'بلاغ بحاجة للمراجعة' : 'report(s) need review'}</p>
            </div>
            <button onClick={() => navigate('/admin/reports')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition-all">
              {lang === 'ar' ? 'مراجعة' : 'Review'}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
