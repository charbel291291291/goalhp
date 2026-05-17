import { useState, type ReactNode } from 'react';
import { useUI } from '../../store/useUI';

const adminItems = [
  { path: '/admin', icon: '📊', label: 'Overview' },
  { path: '/admin/users', icon: '👥', label: 'Users' },
  { path: '/admin/questions', icon: '❓', label: 'Questions' },
  { path: '/admin/teams', icon: '🏳️', label: 'Teams' },
  { path: '/admin/matches', icon: '⚽', label: 'Matches' },
  { path: '/admin/sponsors', icon: '🤝', label: 'Sponsors' },
  { path: '/admin/rewards', icon: '🎁', label: 'Rewards' },
  { path: '/admin/sponsor-payments', icon: '💳', label: 'Payments' },
  { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
];

function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language } = useUI();
  const path = window.location.pathname;
  const isRtl = language === 'ar';

  return (
    <div className="min-h-screen bg-[#07111f] flex">
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-[60] lg:hidden w-10 h-10 rounded-xl bg-[#0a1628]/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-lg"
      >
        <span className="text-lg">{mobileOpen ? '✕' : '☰'}</span>
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 z-50 w-64 bg-[#0a1628]/95 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col transition-transform duration-300 lg:sticky lg:translate-x-0 ${isRtl ? 'right-0' : 'left-0'} ${mobileOpen ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full'} lg:!translate-x-0`}>
        <div className="text-center mb-6 pt-4">
          <div className="text-xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
              QuizGoal
            </span>
          </div>
          <div className="text-[10px] text-white/30 mt-0.5">Admin Panel</div>
        </div>

        <div className="text-[10px] text-white/35 uppercase px-3 pb-2 font-bold tracking-[0.22em]">Management</div>

        <div className="space-y-1 flex-1 overflow-y-auto">
          {adminItems.map((item) => {
            const active = path === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-electric/20 text-white font-bold ring-1 ring-white/10'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 w-full transition-all mt-2"
        >
          <span>←</span>
          <span>Back to App</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-4 pt-16 lg:pt-6 lg:p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
