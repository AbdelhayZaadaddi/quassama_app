'use client'
import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { DEFAULT_CATEGORIES, Category } from '@/lib/categories'
import { createExpense } from '@/lib/expenses'
import { Group } from '@/lib/groups'
import CategoryIcon from '@/components/CategoryIcon'
import GroupDropdown from '@/components/GroupDropdown'

type Props = {
  uid: string
  groups: Group[]
  onClose: () => void
  onCreated: () => void
}

export default function AddExpenseModal({ uid, groups, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [groupId, setGroupId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedGroup = groups.find((g) => g.id === groupId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const parsedAmount = parseFloat(amount)
    if (!name.trim()) return setError('Enter a name for this expense.')
    if (!parsedAmount || parsedAmount <= 0) return setError('Enter an amount greater than 0.')
    if (!selectedGroup) return setError('Pick a group.')
    if (!category) return setError('Pick a category.')

    setSubmitting(true)
    try {
      await createExpense(uid, {
        name: name.trim(),
        amount: parsedAmount,
        category,
        group: selectedGroup,
      })
      onCreated()
      onClose()
    } catch (err) {
      console.error('createExpense failed:', err)
      setError("Couldn't save this expense. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-brand-dark">Add expense</h2>
          <button onClick={onClose} aria-label="Close" className="text-brand-muted hover:text-brand-dark">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-brand-dark mb-1.5">Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-dark mb-1.5">Amount</label>
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
            <label className="block text-xs font-medium text-brand-dark mb-1.5">Group</label>
            <GroupDropdown groups={groups} value={groupId} onChange={setGroupId} />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-dark mb-1.5">Category</label>
            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
              {DEFAULT_CATEGORIES.map((c) => {
                const selected = category?.id === c.id
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategory(c)}
                    title={c.name}
                    className={`flex flex-col items-center gap-1 rounded-xl p-2 border transition-colors ${
                      selected ? 'border-brand-dark bg-brand-cream' : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${c.color}1A` }}
                    >
                      <CategoryIcon name={c.icon} size={15} style={{ color: c.color }} />
                    </div>
                    <span className="text-[10px] text-brand-muted truncate w-full text-center">{c.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || groups.length === 0}
            className="btn-dark w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? 'Saving...' : 'Add expense'}
          </button>
        </form>
      </div>
    </div>
  )
}
