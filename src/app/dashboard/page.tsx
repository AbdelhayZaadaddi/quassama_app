'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function DashboardPage() {
  const router  = useRouter()
  const [user, setUser]     = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace('/login'); return }
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [router])

  const handleSignOut = async () => {
    await signOut(auth)
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="w-8 h-8 border-4 border-brand-dark border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="https://quassama.com" className="flex items-center gap-2">
          <img src="/logo.png" alt="Quassama" className="h-8 w-8" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="font-display font-bold text-xl text-brand-dark">Quassama</span>
        </a>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-dark text-white flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <button onClick={handleSignOut} className="text-sm text-brand-muted hover:text-brand-dark transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-brand-dark mb-1">
            Hello, {user?.displayName?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-brand-muted text-sm">{user?.email}</p>
        </div>

        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-brand-dark">Current Plan</h2>
            <span className="bg-gray-100 text-brand-muted text-xs font-medium px-3 py-1 rounded-full">Free</span>
          </div>
          <div className="flex flex-col gap-2 text-sm text-brand-muted mb-6">
            <div className="flex items-center gap-2"><span className="text-brand-green">✓</span> Basic expense tracking</div>
            <div className="flex items-center gap-2"><span className="text-brand-green">✓</span> Limited groups</div>
            <div className="flex items-center gap-2"><span className="text-brand-green">✓</span> Up to 10 AI decisions/month</div>
          </div>
          <button onClick={() => router.push('/upgrade')} className="btn-primary w-full text-center">
            ✨ Upgrade to Premium
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => router.push('/upgrade')} className="card hover:shadow-md transition-all text-left group cursor-pointer">
            <div className="text-2xl mb-3">🚀</div>
            <h3 className="font-semibold text-brand-dark text-sm mb-1">Upgrade Plan</h3>
            <p className="text-xs text-brand-muted">Unlock Voice AI &amp; more</p>
          </button>
          <a href="https://quassama.com/terms-and-conditions" target="_blank" className="card hover:shadow-md transition-all text-left cursor-pointer">
            <div className="text-2xl mb-3">📄</div>
            <h3 className="font-semibold text-brand-dark text-sm mb-1">Terms &amp; Conditions</h3>
            <p className="text-xs text-brand-muted">Read our policies</p>
          </a>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-brand-muted">Your User ID</span>
          <span className="text-xs font-mono text-brand-dark truncate max-w-[200px]">{user?.uid}</span>
        </div>
      </main>
    </div>
  )
}
