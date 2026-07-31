'use client'
import { Smartphone } from 'lucide-react'

type Props = {
  title: string
  message: string
  onClose: () => void
}

export default function InfoDialog({ title, message, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xs p-5" onClick={(e) => e.stopPropagation()}>
        <div className="h-10 w-10 rounded-full bg-brand-cream flex items-center justify-center mb-3">
          <Smartphone size={18} className="text-brand-dark" />
        </div>
        <h2 className="text-sm font-semibold text-brand-dark mb-1.5">{title}</h2>
        <p className="text-xs text-brand-muted mb-5">{message}</p>
        <button
          onClick={onClose}
          className="w-full text-sm font-semibold text-white bg-brand-dark rounded-2xl py-2.5 hover:opacity-90 transition-opacity"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
