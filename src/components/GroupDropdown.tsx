'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, Users } from 'lucide-react'
import { Group } from '@/lib/groups'

type Props = {
  groups: Group[]
  value: string
  onChange: (groupId: string) => void
}

export default function GroupDropdown({ groups, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = groups.find((g) => g.id === value)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  if (groups.length === 0) {
    return (
      <p className="text-xs text-brand-muted bg-gray-50 rounded-xl px-4 py-3">
        You need to be in a group before you can add an expense.
      </p>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`input flex items-center gap-3 text-left ${!selected ? 'text-brand-muted' : ''}`}
      >
        {selected ? (
          <>
            <div className="h-6 w-6 rounded-full bg-brand-cream flex items-center justify-center shrink-0 text-[10px] font-semibold text-brand-dark">
              {selected.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="flex-1 min-w-0 truncate text-brand-dark">{selected.name}</span>
          </>
        ) : (
          <>
            <Users size={16} className="text-brand-muted shrink-0" />
            <span className="flex-1">Select a group</span>
          </>
        )}
        <ChevronDown size={16} className={`text-brand-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-full bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 max-h-56 overflow-y-auto">
          {groups.map((g) => {
            const isSelected = g.id === value
            return (
              <button
                type="button"
                key={g.id}
                onClick={() => {
                  onChange(g.id)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  isSelected ? 'bg-brand-cream' : 'hover:bg-gray-50'
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-brand-cream flex items-center justify-center shrink-0 text-xs font-semibold text-brand-dark">
                  {g.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-dark truncate">{g.name}</p>
                  <p className="text-xs text-brand-muted truncate">
                    {g.memberIds.length} {g.memberIds.length === 1 ? 'member' : 'members'} · {g.currency}
                  </p>
                </div>
                {isSelected && <Check size={16} className="text-brand-dark shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
