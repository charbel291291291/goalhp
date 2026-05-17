import { useState } from 'react'
import { supabase } from '../../lib/supabase'

function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function SponsorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signInErr) { setError(signInErr.message); setLoading(false); return }
    const { data: sponsorUser } = await supabase
      .from('sponsor_users')
      .select('sponsor_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single()
    if (sponsorUser) { navigate('/sponsor/dashboard') }
    else { setError('This account is not registered as a sponsor'); supabase.auth.signOut() }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="gold-text text-2xl font-bold text-center mb-6">Sponsor Login</h1>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" required />
          <button type="submit" disabled={loading}
            className="neon-button w-full py-3 rounded-xl font-bold text-lg">{loading ? 'Loading...' : 'Login'}</button>
        </form>
        <p className="text-white/60 text-sm text-center mt-4">
          No account? <button onClick={() => navigate('/sponsor/register')} className="text-[#0f8cff] hover:underline bg-transparent border-none cursor-pointer">Register here</button>
        </p>
      </div>
    </div>
  )
}
