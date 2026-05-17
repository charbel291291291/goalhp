import { useState } from 'react'
import { supabase } from '../../lib/supabase'

function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function SponsorRegister() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'done'>('form')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password })
    if (authErr || !authData.user) { setError(authErr?.message || 'Signup failed'); setLoading(false); return }
    const { data: sponsor } = await supabase.from('sponsors').insert({
      name: storeName, whatsapp, location, active: false,
    }).select().single()
    if (!sponsor) { setError('Failed to create sponsor profile'); setLoading(false); return }
    await supabase.from('sponsor_users').insert({ user_id: authData.user.id, sponsor_id: sponsor.id, role: 'owner' })
    setStep('done'); setLoading(false)
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Registration submitted!</h2>
          <p className="text-white/60 mb-6">Your account is pending admin approval. Choose a package to start.</p>
          <button onClick={() => navigate('/sponsor/packages')} className="neon-button px-8 py-3 rounded-xl font-bold">View Packages</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8">
        <h1 className="gold-text text-2xl font-bold text-center mb-6">Sponsor Registration</h1>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="Store/Brand Name" value={storeName} onChange={e => setStoreName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" required />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" required />
          <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" required minLength={6} />
          <input type="text" placeholder="WhatsApp Number" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
          <input type="text" placeholder="Location (city/area)" value={location} onChange={e => setLocation(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
          <button type="submit" disabled={loading}
            className="neon-button w-full py-3 rounded-xl font-bold text-lg">{loading ? 'Registering...' : 'Register'}</button>
        </form>
        <p className="text-white/60 text-sm text-center mt-4">
          Already registered? <button onClick={() => navigate('/sponsor/login')} className="text-[#0f8cff] hover:underline bg-transparent border-none cursor-pointer">Login here</button>
        </p>
      </div>
    </div>
  )
}
