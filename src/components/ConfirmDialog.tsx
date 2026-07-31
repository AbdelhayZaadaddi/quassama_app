'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

type Props = {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-xs p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-semibold text-brand-dark mb-1.5">{title}</h2>
        <p className="text-xs text-brand-muted mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 text-sm font-medium text-brand-dark border border-gray-200 rounded-2xl py-2.5 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-red-600 rounded-2xl py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
