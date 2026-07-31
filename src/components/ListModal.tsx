'use client'
import { ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  title: string
  icon: ReactNode
  onClose: () => void
  children: ReactNode
}

export default function ListModal({ title, icon, onClose, children }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-sm font-semibold text-brand-dark">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-brand-muted hover:text-brand-dark">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 flex flex-col divide-y divide-gray-50">{children}</div>
      </div>
    </div>
  )
}
