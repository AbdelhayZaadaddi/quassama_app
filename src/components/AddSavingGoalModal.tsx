'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createSavingGoal } from '@/lib/savingGoals'
import CategoryIcon from '@/components/CategoryIcon'

type Props = {
  uid: string
  onClose: () => void
  onCreated: () => void
}

const GOAL_ICONS = [
  'wallet', 'airplane', 'car-sport', 'home', 'gift',
  'school', 'phone-portrait', 'heart', 'cart', 'fitness',
  'laptop', 'cash',
]

const DURATION_PRESETS = [
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '9 months', days: 270 },
  { label: '1 year', days: 365 },
]

export default function AddSavingGoalModal({ uid, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [icon, setIcon] = useState('wallet')
  const [days, setDays] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) return setError('Enter an amount greater than 0.')
    if (!days) return setError('Pick a duration.')
    if (parsedAmount < days) return setError(`Amount must be at least ${days} (1 per day minimum).`)

    setSubmitting(true)
    try {
      await createSavingGoal(uid, parsedAmount, days, name.trim() || undefined, icon)
      onCreated()
      onClose()
    } catch (err) {
      console.error('createSavingGoal failed:', err)
      setError("Couldn't create this goal. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-brand-dark">New saving goal</h2>
          <button onClick={onClose} aria-label="Close" className="text-brand-muted hover:text-brand-dark">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-brand-dark mb-1.5">Name (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. New laptop"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-dark mb-1.5">Target amount</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-dark mb-1.5">Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.days}
                  onClick={() => setDays(p.days)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    days === p.days
                      ? 'bg-brand-dark text-white border-brand-dark'
                      : 'text-brand-muted border-gray-200 hover:border-brand-dark hover:text-brand-dark'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-dark mb-1.5">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {GOAL_ICONS.map((i) => {
                const selected = icon === i
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`aspect-square rounded-xl flex items-center justify-center border transition-colors ${
                      selected ? 'border-brand-dark bg-brand-cream' : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <CategoryIcon name={i} size={16} className="text-brand-dark" />
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3">{error}</div>
          )}

          <button type="submit" disabled={submitting} className="btn-dark w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? 'Creating...' : 'Create goal'}
          </button>
        </form>
      </div>
    </div>
  )
}
