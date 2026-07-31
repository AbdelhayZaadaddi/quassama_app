'use client'
import { useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'

type Props = {
  message: string
  onDismiss: () => void
}

export default function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed bottom-6 inset-x-0 z-[60] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2.5 bg-brand-dark text-white text-sm font-medium rounded-full pl-4 pr-3 py-3 shadow-lg">
        <CheckCircle2 size={16} className="text-brand-green shrink-0" />
        {message}
        <button onClick={onDismiss} aria-label="Dismiss" className="text-white/60 hover:text-white ml-1">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
