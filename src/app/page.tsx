'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      router.replace(u ? '/dashboard' : '/login')
      setChecking(false)
    })
    return unsub
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-brand-dark border-t-transparent animate-spin" />
        <p className="text-brand-muted text-sm">Loading...</p>
      </div>
    </div>
  )
}
