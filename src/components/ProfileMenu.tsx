'use client'
import { useEffect, useRef, useState } from 'react'
import { FileText, LogOut } from 'lucide-react'

type Props = {
  initials: string
  onSignOut: () => void
}

export default function ProfileMenu({ initials, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

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

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="w-9 h-9 rounded-full bg-brand-dark text-white flex items-center justify-center text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-10">
          <a
            href="https://quassama.com/terms-and-conditions"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-dark hover:bg-gray-50 transition-colors"
          >
            <FileText size={15} className="text-brand-muted" />
            Terms &amp; Conditions
          </a>
          <button
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
