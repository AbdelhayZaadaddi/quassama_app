'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function SuccessPage() {
  const router = useRouter()
  const [seconds, setSeconds] = useState(5)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace('/login')
    })
    return unsub
  }, [router])

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { router.replace('/dashboard'); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center py-12">
        <div className="w-20 h-20 bg-brand-dark rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🎉</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-brand-dark mb-3">You&apos;re all set!</h1>
        <p className="text-brand-muted text-sm mb-2">Your Quassama subscription is now active.</p>
        <p className="text-brand-muted text-sm mb-8">Open the app and enjoy all premium features!</p>

        <div className="bg-brand-cream rounded-2xl p-4 mb-6 text-sm text-brand-muted">
          💡 Your subscription is linked to your account. Simply open the Quassama app and sign in to access all features.
        </div>

        <button onClick={() => router.replace('/dashboard')} className="btn-dark w-full">
          Go to Dashboard ({seconds}s)
        </button>
      </div>
    </div>
  )
}
