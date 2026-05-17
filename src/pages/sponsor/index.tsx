import { useMemo, useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function SponsorDashboard() {
  const [sponsorName, setSponsorName] = useState('')

  type SponsorSubscription = {
    status?: string
    expires_at?: string
    amount_paid?: number
  }

  const [subscription, setSubscription] = useState<SponsorSubscription | null>(null)
  const [offerCount, setOfferCount] = useState(0)
  const [redemptionCount, setRedemptionCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) {
        navigate('/sponsor/login')
        return
      }

      const { data: sponsorUser } = await supabase
        .from('sponsor_users')
        .select('sponsor_id')
        .eq('user_id', user.id)
        .single()

      if (!sponsorUser) {
        navigate('/sponsor/login')
        return
      }

      const sid = sponsorUser.sponsor_id as string

      const [spRes, subRes, offRes] = await Promise.all([
        supabase.from('sponsors').select('name').eq('id', sid).single(),
        supabase
          .from('sponsor_subscriptions')
          .select('*')
          .eq('sponsor_id', sid)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase.from('sponsor_offers').select('id', { count: 'exact', head: true }).eq('sponsor_id', sid),
      ])

      const offersRes = await supabase.from('sponsor_offers').select('id').eq('sponsor_id', sid)
      const offIds = (offersRes.data || []).map((o) => (o as { id: string }).id)

      const redRes =
        offIds.length > 0
          ? await supabase.from('offer_redemptions').select('id', { count: 'exact', head: true }).in('offer_id', offIds)
          : { count: 0 }

      if (cancelled) return

      if (spRes.data) setSponsorName((spRes.data as { name: string }).name)
      setSubscription((subRes.data as SponsorSubscription) || null)
      setOfferCount(offRes.count || 0)
      setRedemptionCount((redRes as { count?: number }).count || 0)
      setLoading(false)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const now = useMemo(() => new Date().getTime(), [])
  const hasActiveSub = subscription?.status === 'approved' && !!subscription.expires_at && new Date(subscription.expires_at) > new Date()
  const daysLeft = hasActiveSub && subscription?.expires_at
    ? Math.ceil((new Date(subscription.expires_at).getTime() - now) / 86400000)
    : 0

  if (loading) return <div className="text-white/60 text-center py-20">Loading dashboard...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {sponsorName}</h1>
          <p className="text-white/50 text-sm mt-1">Sponsor Dashboard</p>
        </div>
        {!hasActiveSub && (
          <button onClick={() => navigate('/sponsor/packages')}
            className="neon-button px-6 py-2.5 rounded-xl font-bold text-sm">Subscribe Now</button>
        )}
      </div>

      <div className="glass-card p-6 mb-6">
        {hasActiveSub ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#39ff14] font-bold">✓ Active</p>
              <p className="text-white/60 text-sm">{daysLeft} days remaining</p>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">${subscription.amount_paid}/month</p>
            </div>
          </div>
        ) : subscription?.status === 'pending' ? (
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 text-xl">⏳</span>
            <div>
              <p className="text-yellow-400 font-medium">Payment pending approval</p>
              <p className="text-white/50 text-sm">We'll review your proof within 24 hours</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xl">❌</span>
            <div>
              <p className="text-white font-medium">No active subscription</p>
              <p className="text-white/50 text-sm">Choose a package to start offering deals</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-[#0f8cff]">{offerCount}</p>
          <p className="text-white/60 text-sm mt-1">Active Offers</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-[#39ff14]">{redemptionCount}</p>
          <p className="text-white/60 text-sm mt-1">Redemptions</p>
        </div>
      </div>
    </div>
  )
}
