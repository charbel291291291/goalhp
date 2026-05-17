import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const OFFER_TYPES = [
  { value: 'percentage', label: 'Percentage Discount', icon: '%' },
  { value: 'fixed', label: 'Fixed Amount Off', icon: '$' },
  { value: 'gift', label: 'Free Gift', icon: '🎁' },
  { value: 'bogo', label: 'Buy One Get One', icon: '2️⃣' },
]

function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function SponsorOffers() {
  type SponsorOffer = {
    id: string
    sponsor_id: string
    title_en: string
    title_ar: string
    description_en?: string | null
    description_ar?: string | null
    offer_type: string
    discount_value?: number | null
    points_required: number
    code_prefix: string
    max_redemptions?: number | null
    redemption_count?: number | null
    terms_en?: string | null
    terms_ar?: string | null
    active: boolean
    created_at?: string
  }

  const [offers, setOffers] = useState<SponsorOffer[]>([])
  const [sponsorId, setSponsorId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<SponsorOffer | null>(null)
  const [loading, setLoading] = useState(true)

  const [titleEn, setTitleEn] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [descEn, setDescEn] = useState('')
  const [descAr, setDescAr] = useState('')
  const [offerType, setOfferType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [pointsRequired, setPointsRequired] = useState('')
  const [codePrefix, setCodePrefix] = useState('')
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [termsEn, setTermsEn] = useState('')
  const [termsAr, setTermsAr] = useState('')
  const [saving, setSaving] = useState(false)

  const loadOffers = useCallback(async (sid: string) => {
    const { data } = await supabase.from('sponsor_offers').select('*').eq('sponsor_id', sid).order('created_at', { ascending: false })
    if (data) setOffers(data as unknown as SponsorOffer[])
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) { navigate('/sponsor/login'); return }

      const { data } = await supabase.from('sponsor_users').select('sponsor_id').eq('user_id', user.id).single()
      if (!data) { navigate('/sponsor/login'); return }

      if (cancelled) return
      setSponsorId((data as { sponsor_id: string }).sponsor_id)
      await loadOffers((data as { sponsor_id: string }).sponsor_id)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [loadOffers])

  const resetForm = () => {
    setTitleEn(''); setTitleAr(''); setDescEn(''); setDescAr('')
    setOfferType('percentage'); setDiscountValue(''); setPointsRequired('')
    setCodePrefix(''); setMaxRedemptions(''); setTermsEn(''); setTermsAr('')
    setEditing(null)
  }

  const openEdit = (offer: SponsorOffer) => {
    setEditing(offer)
    setTitleEn(offer.title_en); setTitleAr(offer.title_ar)
    setDescEn(offer.description_en || ''); setDescAr(offer.description_ar || '')
    setOfferType(offer.offer_type); setDiscountValue(String(offer.discount_value || ''))
    setPointsRequired(String(offer.points_required)); setCodePrefix(offer.code_prefix)
    setMaxRedemptions(String(offer.max_redemptions || ''))
    setTermsEn(offer.terms_en || ''); setTermsAr(offer.terms_ar || '')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      sponsor_id: sponsorId,
      title_en: titleEn, title_ar: titleAr,
      description_en: descEn || null, description_ar: descAr || null,
      offer_type: offerType,
      discount_value: discountValue ? Number(discountValue) : null,
      points_required: Number(pointsRequired),
      code_prefix: codePrefix.toUpperCase(),
      max_redemptions: maxRedemptions ? Number(maxRedemptions) : 0,
      terms_en: termsEn || null, terms_ar: termsAr || null,
    }
    if (editing) { await supabase.from('sponsor_offers').update(payload).eq('id', editing.id) }
    else { await supabase.from('sponsor_offers').insert(payload) }
    resetForm(); setShowForm(false); loadOffers(sponsorId); setSaving(false)
  }

  const toggleActive = async (offer: SponsorOffer) => {
    await supabase.from('sponsor_offers').update({ active: !offer.active }).eq('id', offer.id)
    loadOffers(sponsorId)
  }

  if (loading) return <div className="text-white/60 text-center py-20">Loading offers...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Your Offers</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="neon-button px-5 py-2.5 rounded-xl font-bold text-sm">+ New Offer</button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Edit Offer' : 'New Offer'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Title (English)" required
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
              <input value={titleAr} onChange={e => setTitleAr(e.target.value)} placeholder="Title (Arabic)" required
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
              <textarea value={descEn} onChange={e => setDescEn(e.target.value)} placeholder="Description (English)" rows={2}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
              <textarea value={descAr} onChange={e => setDescAr(e.target.value)} placeholder="Description (Arabic)" rows={2}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {OFFER_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setOfferType(t.value)}
                  className={`p-3 rounded-xl text-center text-sm transition ${offerType === t.value ? 'bg-[#0f8cff]/20 border border-[#0f8cff] text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'}`}>
                  <span className="text-lg block mb-1">{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="Discount value"
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
              <input type="number" value={pointsRequired} onChange={e => setPointsRequired(e.target.value)} placeholder="Points required" required
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
              <input value={codePrefix} onChange={e => setCodePrefix(e.target.value)} placeholder="Code prefix (e.g. NIKE)" required
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
              <input type="number" value={maxRedemptions} onChange={e => setMaxRedemptions(e.target.value)} placeholder="Max redemptions (0=unlimited)"
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <textarea value={termsEn} onChange={e => setTermsEn(e.target.value)} placeholder="Terms (English)" rows={2}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
              <textarea value={termsAr} onChange={e => setTermsAr(e.target.value)} placeholder="Terms (Arabic)" rows={2}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff]" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="neon-button px-6 py-2.5 rounded-xl font-bold text-sm">{saving ? 'Saving...' : 'Save Offer'}</button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false) }}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {offers.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-white/40 text-lg mb-2">No offers yet</p>
          <p className="text-white/30 text-sm">Create your first offer to let users redeem points for discounts!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => (
            <div key={offer.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium">{offer.title_en}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${offer.active ? 'bg-[#39ff14]/20 text-[#39ff14]' : 'bg-white/10 text-white/40'}`}>
                    {offer.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-white/50 text-sm mt-1">
                  {offer.offer_type} · {offer.points_required} pts · {offer.redemption_count || 0}/{offer.max_redemptions || '∞'} redeemed
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(offer)} className="text-white/40 hover:text-[#0f8cff] text-sm px-3">Edit</button>
                <button onClick={() => toggleActive(offer)} className="text-white/40 hover:text-yellow-400 text-sm px-3">
                  {offer.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
