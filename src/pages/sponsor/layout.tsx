import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'

const NAV = [
  { to: '/sponsor/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/sponsor/offers', label: 'Offers', icon: '🏷️' },
  { to: '/sponsor/redemptions', label: 'Redemptions', icon: '✅' },
]

function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function SponsorLayout({ children }: { children: ReactNode }) {
  const [sponsorName, setSponsorName] = useState('')
  const [path, setPath] = useState(window.location.pathname)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/sponsor/login'); return }
      supabase.from('sponsor_users').select('sponsor_id').eq('user_id', user.id).single().then(({ data }) => {
        if (!data) { navigate('/sponsor/login'); return }
        supabase.from('sponsors').select('name').eq('id', data.sponsor_id).single().then(({ data: s }) => {
          if (s) setSponsorName(s.name)
        })
      })
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/sponsor/login')
  }

  return (
    <div className="min-h-screen bg-[#07111f] flex">
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-[60] md:hidden w-10 h-10 rounded-xl bg-[#0a1628]/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white shadow-lg">
        <span className="text-lg">{mobileOpen ? '✕' : '☰'}</span>
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1628]/95 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col transition-transform duration-300 md:sticky md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:!translate-x-0`}>
        <h2 className="gold-text text-lg font-bold mb-1">Sponsor Panel</h2>
        <p className="text-white/50 text-xs mb-6 truncate">{sponsorName}</p>
        <nav className="space-y-1 flex-1">
          {NAV.map(item => (
            <button key={item.to} onClick={() => { navigate(item.to); setMobileOpen(false) }}
              className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition ${
                path === item.to
                  ? 'bg-[#0f8cff]/20 text-[#0f8cff]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout}
          className="text-white/40 text-sm hover:text-red-400 transition text-left mt-4">Logout</button>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-4 pt-16 md:pt-6 md:p-6 overflow-auto">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a1628]/90 backdrop-blur-2xl border-t border-white/[0.06] rounded-t-2xl">
        <div className="flex items-center justify-around py-2 px-2">
          {NAV.map(item => (
            <button key={item.to} onClick={() => { navigate(item.to); setMobileOpen(false) }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
                path === item.to ? 'text-[#0f8cff]' : 'text-white/30'
              }`}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
