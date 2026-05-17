import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/useAuth';
import { cn } from '../../lib/utils';

type NavItem = { path: string; icon: string; key: string; label?: string };

const mainItems: NavItem[] = [
  { path: '/profile', icon: '👤', key: 'profile', label: 'Profile' },
  { path: '/friends', icon: '👥', key: 'friends', label: 'Friends' },
  { path: '/home', icon: '🏠', key: 'home', label: 'Home' },
  { path: '/arena', icon: '🏟️', key: 'arena', label: 'Arena' },
  { path: '/schedule', icon: '📅', key: 'schedule', label: 'Schedule' },
  { path: '/battle', icon: '⚔️', key: 'battle', label: 'Battle' },
  { path: '/predict', icon: '🔮', key: 'predict', label: 'Predict' },
  { path: '/poster', icon: '🎨', key: 'poster', label: 'Poster' },
  { path: '/leaderboard', icon: '🏆', key: 'leaderboards', label: 'Leaderboard' },
  { path: '/fan-cup', icon: '🌍', key: 'fanCup', label: 'Fan Cup' },
  { path: '/city-league', icon: '🏙️', key: 'city', label: 'City League' },
  { path: '/cafe', icon: '☕', key: 'cafe', label: 'Café Zone' },
  { path: '/rewards', icon: '🎁', key: 'rewards', label: 'Rewards' },
  { path: '/sponsors', icon: '🤝', key: 'sponsors', label: 'Sponsors' },
];

const adminItems: NavItem[] = [
  { path: '/admin', icon: '📊', key: 'overview' },
  { path: '/admin/users', icon: '👥', key: 'users' },
  { path: '/admin/questions', icon: '❓', key: 'questions' },
  { path: '/admin/teams', icon: '🏳️', key: 'teams' },
  { path: '/admin/matches', icon: '⚽', key: 'matches' },
  { path: '/admin/sponsors', icon: '🤝', key: 'sponsors' },
  { path: '/admin/rewards', icon: '🎁', key: 'rewards' },
  { path: '/admin/sponsor-payments', icon: '💳', key: 'sponsorPayments' },
  { path: '/admin/settings', icon: '⚙️', key: 'settings' },
];

function navigate(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function DesktopNav() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const path = window.location.pathname;
  const isAdminPage = path.startsWith('/admin');

  return (
    <nav className="h-full bg-[#07111f]/95 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col shadow-2xl">
      <button className="text-center mb-8 pt-4" onClick={() => navigate('/home')}>
        <div className="text-3xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
            QuizGoal
          </span>
        </div>
        <div className="text-xs text-white/40 mt-1">
          2026 <span className="text-white/60">by eyedeaz</span>
        </div>
      </button>

      <div className="text-xs text-white/35 uppercase px-3 pb-3 font-bold tracking-[0.22em]">
        {isAdminPage ? 'Admin' : 'Main'}
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
        {(isAdminPage ? adminItems : mainItems).map((item) => {
          const active = path === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm transition-all duration-200',
                active
                  ? 'bg-gradient-to-r from-blue-500/25 to-emerald-500/15 text-white font-bold ring-1 ring-white/20 shadow-[0_0_24px_rgba(59,130,246,0.25)]'
                  : 'text-white/60 hover:text-white hover:bg-white/7'
              )}
            >
              {active && <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-amber-400" />}
              <span className="text-xl">{item.icon}</span>
              <span>{t(isAdminPage ? `admin.${item.key}` : `nav.${item.key}`)}</span>
            </button>
          );
        })}
      </div>

      {isAdminPage && (
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-white/60 hover:text-white hover:bg-white/7 w-full transition-all"
        >
          <span>←</span>
          <span>Back to App</span>
        </button>
      )}

      <div className="pt-4 border-t border-white/10 mt-4">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/7 w-full transition-all text-left"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-sm font-bold shadow-[0_0_20px_rgba(34,197,94,0.25)]">
            {profile?.username?.[0]?.toUpperCase() || 'P'}
          </div>
          <div className="text-sm truncate">
            <div className="text-white font-semibold truncate">{profile?.username || 'Player'}</div>
            <div className="text-xs text-white/45">{profile?.points?.toLocaleString() || 0} pts</div>
          </div>
        </button>
      </div>
    </nav>
  );
}
