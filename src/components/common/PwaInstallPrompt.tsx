import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') setShowPrompt(false)
      setDeferredPrompt(null)
    })
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80 animate-slide-up">
      <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric to-neon flex items-center justify-center text-lg flex-shrink-0">
            ⚽
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Install QuizGoal</p>
            <p className="text-[10px] text-white/50 mt-0.5">Get the full app experience</p>
          </div>
          <button onClick={handleDismiss} className="text-white/30 hover:text-white text-sm p-1">✕</button>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleInstall}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-electric to-neon text-white text-xs font-bold hover:opacity-90 transition-all">
            Install
          </button>
          <button onClick={handleDismiss}
            className="px-4 py-2 rounded-xl bg-white/5 text-white/60 text-xs hover:bg-white/10 transition-all">
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
