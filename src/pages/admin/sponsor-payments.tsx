import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminSponsorPayments() {
  type SponsorPackage = { name_en?: string }
  type SponsorSubscription = {
    id: string
    amount_paid: number
    payment_method: string
    status: string
    expires_at?: string | null
    payment_notes?: string | null
    payment_proof_url?: string | null
    sponsor_packages?: SponsorPackage | null
  }

  const [subscriptions, setSubscriptions] = useState<SponsorSubscription[]>([])
  const [loading, setLoading] = useState(true)

  const loadSubs = useCallback(async () => {
    const { data } = await supabase
      .from('sponsor_subscriptions')
      .select('*, sponsor_packages(*)')
      .order('created_at', { ascending: false })
    if (data) setSubscriptions(data as unknown as SponsorSubscription[])
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      await Promise.resolve()
      if (!cancelled) await loadSubs()
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [loadSubs])

  const approve = async (id: string, days: number) => {
    const now = new Date()
    const expires = new Date(now.getTime() + days * 86400000)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('sponsor_subscriptions').update({
      status: 'approved',
      starts_at: now.toISOString(),
      expires_at: expires.toISOString(),
      approved_by: user?.id,
      approved_at: now.toISOString(),
    }).eq('id', id)
    loadSubs()
  }

  const reject = async (id: string) => {
    await supabase.from('sponsor_subscriptions').update({ status: 'rejected' }).eq('id', id)
    loadSubs()
  }

  if (loading) return <div className="text-white/60 text-center py-20">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Sponsor Payments</h1>
      {subscriptions.length === 0 ? (
        <p className="text-white/40">No subscriptions yet.</p>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium">${sub.amount_paid} — {sub.sponsor_packages?.name_en || 'Unknown Package'}</p>
                  <p className="text-white/50 text-sm mt-1">
                    Payment: <span className="uppercase">{sub.payment_method}</span>
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">
                    Status: <span className={`font-medium ${sub.status === 'approved' ? 'text-[#39ff14]' : sub.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {sub.status}
                    </span>
                    {sub.expires_at && ` · Expires ${new Date(sub.expires_at).toLocaleDateString()}`}
                  </p>
                  {sub.payment_notes && <p className="text-white/30 text-xs mt-1">Notes: {sub.payment_notes}</p>}
                </div>
                <div className="flex gap-2">
                  {sub.payment_proof_url && (
                    <a href={sub.payment_proof_url} target="_blank" rel="noopener noreferrer"
                      className="text-[#0f8cff] text-sm underline">View Proof</a>
                  )}
                </div>
              </div>
              {sub.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => approve(sub.id, 30)}
                    className="neon-button px-4 py-2 rounded-xl text-xs font-bold">Approve (30 days)</button>
                  <button onClick={() => reject(sub.id)}
                    className="px-4 py-2 rounded-xl border border-red-400/30 text-red-400 text-xs hover:bg-red-400/10">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
