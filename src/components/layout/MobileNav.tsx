import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/useAuth';
import { cn } from '../../lib/utils';

const HIDDEN_PATHS = new Set(['/', '/login', '/signup', '/onboarding']);
const HIDDEN_PREFIXES = ['/admin', '/sponsor'];

const items = [
  { path: '/home', icon: '🏠', key: 'home', label: 'Home' },
  { path: '/arena', icon: '🏟️', key: 'arena', label: 'Arena' },
  { path: '/battle', icon: '⚔️', key: 'battle', label: 'Battle' },
  { path: '/predict', icon: '🔮', key: 'predict', label: 'Predict' },
  { path: '/poster', icon: '🎨', key: 'poster', label: 'Poster' },
  { path: '/rewards', icon: '🎁', key: 'rewards', label: 'Rewards' },
  { path: '/friends', icon: '👥', key: 'friends', label: 'Friends' },
  { path: '/profile', icon: '👤', key: 'profile', label: 'Profile' },
];

export default function MobileNav() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (!user) return null;
  if (HIDDEN_PATHS.has(path)) return null;
  if (HIDDEN_PREFIXES.some(p => path.startsWith(p))) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[9990] safe-bottom">
      <div className="bg-[#0a1628]/90 backdrop-blur-2xl border-t border-white/[0.06] rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between py-1.5 px-1 overflow-x-auto scrollbar-hide gap-0">
          {items.map((item) => {
            const active = path === item.path || path.startsWith(item.path + '/') || (item.path === '/home' && path === '/home');
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', item.path); window.dispatchEvent(new PopStateEvent('popstate')); }}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 min-w-0 relative',
                  active ? 'text-white' : 'text-white/30 hover:text-white/50'
                )}
              >
                {active && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-electric rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />}
                <span className={cn('text-lg', active && 'drop-shadow-[0_0_6px_rgba(37,99,235,0.4)]')}>{item.icon}</span>
                <span className="text-[9px] font-medium leading-tight truncate max-w-full">{t(`nav.${item.key}`)}</span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
