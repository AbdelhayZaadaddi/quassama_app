'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged, sendEmailVerification, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { revenueCatWebLink } from '@/lib/paddle'
import { fetchSubscription, FREE_SUBSCRIPTION, Subscription } from '@/lib/subscription'
import {
  Mail,
  CheckCircle2,
  Sparkles,
  Rocket,
  Settings,
  FileText,
  ArrowRight,
  LogOut,
  AlertCircle,
} from 'lucide-react'

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function DashboardPage() {
  const router  = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sub, setSub]         = useState<Subscription | null>(null)
  const [subError, setSubError] = useState(false)
  const [verifySent, setVerifySent] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace('/login'); return }
      setUser(u)
      setLoading(false)
      fetchSubscription(u.uid)
        .then(setSub)
        .catch(() => {
          setSubError(true)
          setSub(FREE_SUBSCRIPTION)
        })
    })
    return unsub
  }, [router])

  const handleSignOut = async () => {
    await signOut(auth)
    router.replace('/login')
  }

  const handleResendVerification = async () => {
    if (!user) return
    try {
      await sendEmailVerification(user)
      setVerifySent(true)
    } catch (err: any) {
      if (err?.code === 'auth/too-many-requests') {
        setVerifySent(true)
      }
    }
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

  const memberSince = formatDate(user?.metadata?.creationTime ?? null)
  const renewal = sub ? formatDate(sub.renewalDate) : null

  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <a href="https://quassama.com" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-brand-dark flex items-center justify-center">
            <img src="/assets/logo1.png" alt="Quassama" className="h-5 w-5" />
          </div>
          <span className="font-display font-bold text-xl text-brand-dark">Quassama</span>
        </a>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-dark text-white flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-dark transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Subscription fetch error banner */}
        {subError && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            Couldn&apos;t load your subscription status. It may be out of date below.
          </div>
        )}

        {/* Email verification banner */}
        {user && !user.emailVerified && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Mail size={16} className="shrink-0" />
              Please verify your email address.
            </span>
            {verifySent ? (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-700 whitespace-nowrap">
                <CheckCircle2 size={14} /> Verification sent
              </span>
            ) : (
              <button onClick={handleResendVerification} className="text-xs font-semibold underline whitespace-nowrap hover:opacity-80">
                Resend email
              </button>
            )}
          </div>
        )}

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-brand-dark mb-1">
            Hello, {user?.displayName?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="text-brand-muted text-sm">{user?.email}</p>
        </div>

        {/* Plan card — skeleton until subscription resolves */}
        {sub === null ? (
          <div className="card mb-4 animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="h-5 w-28 bg-gray-100 rounded" />
              <div className="h-6 w-16 bg-gray-100 rounded-full" />
            </div>
            <div className="space-y-2.5 mb-6">
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
              <div className="h-4 w-2/3 bg-gray-100 rounded" />
              <div className="h-4 w-1/2 bg-gray-100 rounded" />
            </div>
            <div className="h-12 w-full bg-gray-100 rounded-2xl" />
          </div>
        ) : sub.active ? (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-brand-dark">Current Plan</h2>
              <span className="bg-brand-green/10 text-brand-green text-xs font-semibold px-3 py-1 rounded-full">
                {sub.planName}
              </span>
            </div>
            <div className="flex flex-col gap-2 text-sm text-brand-muted mb-6">
              {renewal && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-brand-green shrink-0" />
                  {sub.willRenew ? `Renews on ${renewal}` : `Active until ${renewal} (auto-renew off)`}
                </div>
              )}
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-green shrink-0" /> All premium features unlocked</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-green shrink-0" /> Voice AI, receipt scanning &amp; more</div>
            </div>
            {revenueCatWebLink ? (
              <a href={revenueCatWebLink} target="_blank" rel="noreferrer" className="btn-dark w-full text-center block">
                Manage subscription
              </a>
            ) : (
              <p className="text-xs text-brand-muted text-center">Manage your subscription from the Quassama app.</p>
            )}
          </div>
        ) : (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-brand-dark">Current Plan</h2>
              <span className="bg-gray-100 text-brand-muted text-xs font-medium px-3 py-1 rounded-full">Free</span>
            </div>
            <div className="flex flex-col gap-2 text-sm text-brand-muted mb-6">
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-green shrink-0" /> Basic expense tracking</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-green shrink-0" /> Limited groups</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-green shrink-0" /> Up to 10 AI decisions/month</div>
            </div>
            <button onClick={() => router.push('/upgrade')} className="btn-primary w-full text-center flex items-center justify-center gap-2">
              <Sparkles size={16} />
              Upgrade to Premium
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {sub?.active ? (
            <a
              href={revenueCatWebLink || '#'}
              target="_blank"
              rel="noreferrer"
              className="group relative overflow-hidden rounded-3xl bg-brand-dark p-6 text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-green/30 blur-2xl transition-opacity group-hover:opacity-80" />
              <div className="relative">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <Settings size={20} className="text-white" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-white">Billing</h3>
                <p className="text-xs text-white/60">Manage your subscription</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-yellow transition-transform group-hover:translate-x-0.5">
                  Open portal <ArrowRight size={13} aria-hidden />
                </span>
              </div>
            </a>
          ) : (
            <button
              onClick={() => router.push('/upgrade')}
              className="group relative overflow-hidden rounded-3xl bg-brand-dark p-6 text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-yellow/30 blur-2xl transition-opacity group-hover:opacity-90" />
              <div className="relative">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-yellow">
                  <Rocket size={20} className="text-brand-dark" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-white">Upgrade Plan</h3>
                <p className="text-xs text-white/60">Unlock Voice AI &amp; more</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-yellow transition-transform group-hover:translate-x-0.5">
                  See plans <ArrowRight size={13} aria-hidden />
                </span>
              </div>
            </button>
          )}
          <a
            href="https://quassama.com/terms-and-conditions"
            target="_blank"
            className="group relative overflow-hidden rounded-3xl bg-white border border-gray-100 p-6 text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-cream">
              <FileText size={20} className="text-brand-dark" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-brand-dark">Terms &amp; Conditions</h3>
            <p className="text-xs text-brand-muted">Read our policies</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-green transition-transform group-hover:translate-x-0.5">
              Read more <ArrowRight size={13} aria-hidden />
            </span>
          </a>
        </div>

        {memberSince && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-brand-muted">Member since</span>
            <span className="text-xs font-medium text-brand-dark">{memberSince}</span>
          </div>
        )}
      </main>
    </div>
  )
}
