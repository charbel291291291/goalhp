import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface SponsorPackage {
  id: string
  name_en: string
  name_ar: string
  price_usd: number
  duration_days: number
  max_offers: number
}

interface PaymentMethodInfo {
  label: string
  details: string
  icon: string
}

type PaymentMethods = Record<string, PaymentMethodInfo>

// Fallback only — live values are loaded from app_settings table
const PAYMENT_INFO_FALLBACK: PaymentMethods = {
  whish: { label: 'Whish', details: '—', icon: '📱' },
  omt: { label: 'OMT', details: '—', icon: '🏦' },
  usdt: { label: 'USDT (TRC20)', details: '—', icon: '₿' },
}

const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function SponsorCheckout() {
  const [pkg, setPkg] = useState<SponsorPackage | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>(PAYMENT_INFO_FALLBACK)
  const [method, setMethod] = useState<string>('whish')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofError, setProofError] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pid = params.get('package_id')
    if (!pid) { navigate('/sponsor/packages'); return }
    supabase.from('sponsor_packages').select('id,name_en,name_ar,price_usd,duration_days,max_offers')
      .eq('id', pid).single().then(({ data }) => {
        if (!data) navigate('/sponsor/packages')
        else setPkg(data as SponsorPackage)
      })
  }, [])

  // Load payment method details from DB (keeps sensitive details out of source code)
  useEffect(() => {
    supabase.from('app_settings').select('value').eq('key', 'payment_methods').single()
      .then(({ data }) => {
        if (data?.value && typeof data.value === 'object') {
          setPaymentMethods(data.value as PaymentMethods)
        }
      })
  }, [])

  const handleFileChange = (file: File | null) => {
    setProofError('')
    if (!file) { setProofFile(null); return }

    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      setProofError('Only JPEG, PNG, WebP, or PDF files are accepted')
      setProofFile(null)
      return
    }
    if (file.size > MAX_PROOF_SIZE_BYTES) {
      setProofError('File must be smaller than 5 MB')
      setProofFile(null)
      return
    }
    setProofFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proofFile) { setError('Please upload a payment proof screenshot'); return }
    if (proofError) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Please login first'); setLoading(false); return }

    const { data: sp } = await supabase.from('sponsor_users').select('sponsor_id').eq('user_id', user.id).single()
    if (!sp) { setError('Sponsor profile not found'); setLoading(false); return }

    // Use content type from actual file, not just extension
    const filePath = `sponsor-payments/${sp.sponsor_id}/${Date.now()}-proof`
    const { error: uploadErr } = await supabase.storage.from('sponsor-payments').upload(
      filePath, proofFile, { contentType: proofFile.type }
    )
    if (uploadErr) { setError('Upload failed: ' + uploadErr.message); setLoading(false); return }

    const { data: urlData } = supabase.storage.from('sponsor-payments').getPublicUrl(filePath)

    await supabase.from('sponsor_subscriptions').insert({
      sponsor_id: sp.sponsor_id,
      package_id: pkg!.id,
      amount_paid: pkg!.price_usd,
      payment_method: method,
      payment_proof_url: urlData?.publicUrl || '',
      payment_notes: notes.slice(0, 500), // limit notes length
      status: 'pending',
    })

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#07111f] flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment submitted!</h2>
          <p className="text-white/60 mb-6">We'll review your proof and activate your subscription within 24 hours. You'll be notified.</p>
          <button onClick={() => navigate('/sponsor/dashboard')}
            className="neon-button px-8 py-3 rounded-xl font-bold">Go to Dashboard</button>
        </div>
      </div>
    )
  }

  if (!pkg) return null

  return (
    <div className="min-h-screen bg-[#07111f] flex items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-lg p-8">
        <h1 className="gold-text text-2xl font-bold mb-2">Checkout</h1>
        <p className="text-white/60 mb-6">{pkg.name_en} — ${pkg.price_usd}/month</p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">Choose payment method</label>
            <div className="space-y-2">
              {Object.entries(paymentMethods).map(([key, info]) => (
                <label key={key} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border ${method === key ? 'border-[#0f8cff] bg-[#0f8cff]/10' : 'border-white/10 bg-white/5'}`}>
                  <input type="radio" name="method" value={key} checked={method === key} onChange={() => setMethod(key)} className="sr-only" />
                  <span className="text-xl">{info.icon}</span>
                  <div>
                    <p className="text-white font-medium text-sm">{info.label}</p>
                    <p className="text-white/50 text-xs">{info.details}</p>
                  </div>
                  {method === key && <span className="ml-auto text-[#0f8cff]">✓</span>}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">Upload payment proof</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={e => handleFileChange(e.target.files?.[0] || null)}
              className="w-full text-white/60 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#0f8cff] file:text-white hover:file:bg-[#0a6dcc] cursor-pointer"
            />
            {proofError && <p className="text-red-400 text-xs mt-1">{proofError}</p>}
            <p className="text-white/30 text-xs mt-1">JPEG, PNG, WebP or PDF — max 5 MB</p>
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value.slice(0, 500))}
              rows={2}
              maxLength={500}
              placeholder="Your name or transaction reference..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#0f8cff] text-sm"
            />
          </div>

          <button type="submit" disabled={loading || !!proofError}
            className="neon-button w-full py-3 rounded-xl font-bold text-lg disabled:opacity-50">
            {loading ? 'Submitting...' : `Submit Payment - $${pkg.price_usd}`}
          </button>
        </form>
      </div>
    </div>
  )
}
