import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Package {
  id: string
  name_en: string
  name_ar: string
  price_usd: number
  duration_days: number
  max_offers: number
  features_en: string[]
  popular: boolean
}

function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function SponsorPackages() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('sponsor_packages').select('*').order('price_usd').then(({ data }) => {
      if (data) setPackages(data as unknown as Package[])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="min-h-screen bg-[#07111f] flex items-center justify-center"><div className="text-white/60">Loading packages...</div></div>

  return (
    <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center px-4 py-12">
      <h1 className="gold-text text-3xl font-bold mb-2">Choose Your Package</h1>
      <p className="text-white/60 mb-10 text-center">Pick a subscription plan and start creating offers</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {packages.map(pkg => (
          <div key={pkg.id} className={`glass-card relative p-6 flex flex-col ${pkg.popular ? 'ring-2 ring-[#0f8cff]' : ''}`}>
            {pkg.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0f8cff] text-white text-xs font-bold px-4 py-1 rounded-full">Popular</span>}
            <h3 className="text-xl font-bold text-white mb-1">{pkg.name_en}</h3>
            <p className="text-3xl font-bold text-[#0f8cff] mb-4">${pkg.price_usd}<span className="text-sm text-white/40">/month</span></p>
            <ul className="space-y-2 mb-6 flex-1">
              {(pkg.features_en as unknown as string[]).map((f, i) => (
                <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                  <span className="text-[#39ff14] mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate(`/sponsor/checkout?package_id=${pkg.id}`)}
              className="neon-button w-full py-2.5 rounded-xl font-bold text-sm">
              Select {pkg.name_en}
            </button>
          </div>
        ))}
      </div>
      <p className="text-white/40 text-xs mt-8 text-center">Pay via Whish, OMT, or USDT. Your subscription activates after payment confirmation.</p>
    </div>
  )
}
