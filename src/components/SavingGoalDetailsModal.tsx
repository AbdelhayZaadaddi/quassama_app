'use client'
import { useState } from 'react'
import { X, Trash2, Check } from 'lucide-react'
import { SavingGoal, savedAmount, toggleSavingGoalDay, deleteSavingGoal } from '@/lib/savingGoals'
import CategoryIcon from '@/components/CategoryIcon'
import ConfirmDialog from '@/components/ConfirmDialog'

type Props = {
  goal: SavingGoal
  onClose: () => void
  onChanged: () => void
}

function getProgressStatus(goal: SavingGoal) {
  const start = new Date(goal.createdAt)
  const now = new Date()
  const elapsedDays = Math.min(
    goal.numberOfDays,
    Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1),
  )
  const savedCount = goal.days.filter((d) => d.isSaved).length
  if (savedCount >= elapsedDays) return { onTrack: true, behindBy: 0 }
  return { onTrack: false, behindBy: elapsedDays - savedCount }
}

export default function SavingGoalDetailsModal({ goal: initialGoal, onClose, onChanged }: Props) {
  const [goal, setGoal] = useState(initialGoal)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const saved = savedAmount(goal)
  const pct = goal.targetAmount > 0 ? Math.min(100, (saved / goal.targetAmount) * 100) : 0
  const completed = goal.status === 'completed'
  const { onTrack, behindBy } = getProgressStatus(goal)
  const nextUnsavedIndex = goal.days.findIndex((d) => !d.isSaved)

  const handleToggle = async (index: number) => {
    if (pendingIndex !== null) return
    const day = goal.days[index]
    const nextIsSaved = !day.isSaved
    setPendingIndex(index)

    const optimisticDays = goal.days.map((d, i) => (i === index ? { ...d, isSaved: nextIsSaved } : d))
    const optimisticStatus = optimisticDays.every((d) => d.isSaved) ? 'completed' : 'active'
    const previous = goal
    setGoal({ ...goal, days: optimisticDays, status: optimisticStatus })

    try {
      await toggleSavingGoalDay(goal, index, nextIsSaved)
      onChanged()
    } catch (err) {
      console.error('toggleSavingGoalDay failed:', err)
      setGoal(previous)
    } finally {
      setPendingIndex(null)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteSavingGoal(goal.id)
      onChanged()
      onClose()
    } catch (err) {
      console.error('deleteSavingGoal failed:', err)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-[55] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-brand-dark truncate pr-3">
            {goal.name || `${goal.targetAmount.toLocaleString()} target`}
          </h2>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete goal"
              className="text-brand-muted hover:text-red-600"
            >
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} aria-label="Close" className="text-brand-muted hover:text-brand-dark">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-full bg-brand-cream flex items-center justify-center shrink-0">
              <CategoryIcon name={goal.icon} size={20} className="text-brand-dark" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-display font-bold text-brand-dark">
                {saved.toLocaleString()} / {goal.targetAmount.toLocaleString()}
              </p>
              <p className="text-xs text-brand-muted">{(goal.targetAmount - saved).toLocaleString()} remaining</p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                completed
                  ? 'bg-brand-green/10 text-brand-green'
                  : onTrack
                  ? 'bg-brand-green/10 text-brand-green'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {completed ? 'Completed' : onTrack ? 'On track' : `Behind by ${behindBy}d`}
            </span>
          </div>

          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-5">
            <div
              className={`h-full rounded-full ${completed ? 'bg-brand-green' : 'bg-brand-yellow'}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {!completed && nextUnsavedIndex !== -1 && (
            <button
              onClick={() => handleToggle(nextUnsavedIndex)}
              disabled={pendingIndex !== null}
              className="btn-dark w-full mb-5 disabled:opacity-50"
            >
              Save today ({goal.days[nextUnsavedIndex].amount.toLocaleString()})
            </button>
          )}

          <div className="grid grid-cols-4 gap-2">
            {goal.days.map((day, i) => (
              <button
                key={day.dayNumber}
                onClick={() => handleToggle(i)}
                disabled={pendingIndex !== null}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 ${
                  day.isSaved ? 'bg-brand-green text-white' : 'bg-gray-50 text-brand-dark hover:bg-gray-100'
                }`}
              >
                {day.isSaved ? (
                  <Check size={16} />
                ) : (
                  <span className="text-[10px] text-brand-muted">Day {day.dayNumber}</span>
                )}
                <span className={`text-xs font-semibold ${day.isSaved ? 'text-white' : 'text-brand-dark'}`}>
                  {day.amount.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

    {showDeleteConfirm && (
      <ConfirmDialog
        title="Delete saving goal?"
        message="This can't be undone."
        onConfirm={handleDelete}
        onCancel={() => !deleting && setShowDeleteConfirm(false)}
      />
    )}
    </>
  )
}
