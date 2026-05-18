import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function SponsorRedemptions() {
  type OfferLite = { id: string; title_en: string }
  type OfferRedemption = {
    id: string
    offer_id: string
    code: string
    status: string
    created_at: string
    used_at?: string | null
    points_spent: number
    offer_title?: string
  }

  const [redemptions, setRedemptions] = useState<OfferRedemption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) { navigate('/sponsor/login'); return }

      const { data: sponsorUser } = await supabase.from('sponsor_users').select('sponsor_id').eq('user_id', user.id).single()
      if (!sponsorUser) { navigate('/sponsor/login'); return }

      const sponsorId = (sponsorUser as { sponsor_id: string }).sponsor_id
      const { data: offers } = await supabase.from('sponsor_offers').select('id, title_en').eq('sponsor_id', sponsorId)
      const offerList = (offers || []) as unknown as OfferLite[]

      if (offerList.length === 0) { if (!cancelled) setLoading(false); return }

      const offerIds = offerList.map((o) => o.id)
      const offerMap: Record<string, string> = Object.fromEntries(offerList.map((o) => [o.id, o.title_en]))

      const { data: reds } = await supabase
        .from('offer_redemptions')
        .select('*')
        .in('offer_id', offerIds)
        .order('created_at', { ascending: false })

      if (cancelled) return

      const redemptionRows = (reds || []) as unknown as OfferRedemption[]
      setRedemptions(redemptionRows.map((r) => ({ ...r, offer_title: offerMap[r.offer_id] || 'Unknown' })))
      setLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const markUsed = async (id: string) => {
    await supabase.from('offer_redemptions').update({ status: 'used', used_at: new Date().toISOString() }).eq('id', id)
    setRedemptions(prev => prev.map(r => r.id === id ? { ...r, status: 'used', used_at: new Date().toISOString() } : r))
  }

  if (loading) return <div className="text-white/60 text-center py-20">Loading redemptions...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Redemptions</h1>
      {redemptions.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-white/40 text-lg mb-2">No redemptions yet</p>
          <p className="text-white/30 text-sm">When users redeem points for your offers, their codes will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {redemptions.map(red => (
            <div key={red.id} className="glass-card p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{red.offer_title}</p>
                <p className="text-lg font-bold text-[#39ff14] tracking-widest">{red.code}</p>
                <p className="text-white/40 text-xs mt-1">Redeemed {new Date(red.created_at).toLocaleDateString()} · {red.points_spent} pts</p>
              </div>
              <div className="text-right">
                {red.status === 'active' ? (
                  <button onClick={() => markUsed(red.id)}
                    className="neon-button px-4 py-2 rounded-xl text-xs font-bold">Mark as Used</button>
                ) : (
                  <span className="text-white/40 text-sm">{red.status === 'used' ? `Used ${red.used_at ? new Date(red.used_at).toLocaleDateString() : ''}` : red.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
