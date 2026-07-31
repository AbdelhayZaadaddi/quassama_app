'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { setBudgetAmount } from '@/lib/budget'

type Props = {
  uid: string
  currentAmount?: number
  spentSoFar: number
  currency?: string
  onClose: () => void
  onSaved: () => void
}

export default function AddBudgetModal({ uid, currentAmount, spentSoFar, currency, onClose, onSaved }: Props) {
  const [amount, setAmount] = useState(currentAmount ? String(currentAmount) : '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) return setError('Enter an amount greater than 0.')

    setSubmitting(true)
    try {
      await setBudgetAmount(uid, parsedAmount, spentSoFar)
      onSaved()
      onClose()
    } catch (err) {
      console.error('setBudgetAmount failed:', err)
      setError("Couldn't save your budget. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-brand-dark">
            {currentAmount ? 'Edit budget' : 'Set monthly budget'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-brand-muted hover:text-brand-dark">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-brand-dark mb-1.5">
              Amount{currency ? ` (${currency})` : ''}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3">{error}</div>
          )}

          <button type="submit" disabled={submitting} className="btn-dark w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? 'Saving...' : currentAmount ? 'Save' : 'Set budget'}
          </button>
        </form>
      </div>
    </div>
  )
}
