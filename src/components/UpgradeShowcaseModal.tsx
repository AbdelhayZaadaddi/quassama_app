'use client'
import { X, Mic, ScanLine, Users, Sparkles, ArrowRight } from 'lucide-react'

type Props = {
  onClose: () => void
  onUpgrade: () => void
}

const FEATURES = [
  { icon: Mic, title: 'Voice AI', desc: 'Log expenses by just speaking to the app' },
  { icon: ScanLine, title: 'Receipt scanning', desc: 'Snap a photo, we fill in the details' },
  { icon: Users, title: 'Unlimited groups', desc: 'Share and split with as many people as you need' },
  { icon: Sparkles, title: 'Unlimited AI decisions', desc: 'No monthly cap on smart suggestions' },
]

export default function UpgradeShowcaseModal({ onClose, onUpgrade }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-r from-brand-dark via-brand-green to-brand-dark animate-shimmer px-6 py-8 rounded-t-2xl">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <X size={18} />
          </button>
          <Sparkles size={22} className="text-brand-yellow mb-3" />
          <h2 className="font-display text-2xl font-bold text-white mb-1">Unlock Premium</h2>
          <p className="text-sm text-white/70">Everything you need to take control of your money.</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-cream flex items-center justify-center shrink-0">
                  <f.icon size={16} className="text-brand-dark" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-dark">{f.title}</p>
                  <p className="text-xs text-brand-muted">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onUpgrade}
            className="btn-dark w-full flex items-center justify-center gap-2 mb-2"
          >
            See plans <ArrowRight size={15} />
          </button>
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-brand-muted hover:text-brand-dark transition-colors py-2"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
