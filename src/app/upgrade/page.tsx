'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { paddleConfig } from '@/lib/paddle'

const PLANS = [
  {
    id: 'personal',
    name: 'Pro',
    price: '$4.99',
    period: '/month',
    trial: '3 Days Free Trial',
    badge: 'Most Popular',
    priceId: paddleConfig.personalPriceId,
    features: [
      'Unlimited groups & expenses',
      'Voice AI — 60 min/month / 7 min/day',
      'Receipt scanning — 50 scans/month',
      'Unlimited AI decisions',
      'No ads',
    ],
    highlight: false,
  },
  {
    id: 'pro-annual',
    name: 'Pro Annual',
    price: '$49.99',
    period: '/year',
    trial: '3 Days Free Trial',
    badge: 'Recommended',
    priceId: paddleConfig.proAnnualPriceId,
    features: [
      'Everything in Pro',
      'Billed once a year — save vs monthly',
      'Voice AI — 60 min/month / 7 min/day',
      'Receipt scanning — 50 scans/month',
      'No ads',
    ],
    highlight: true,
  },
]

export default function UpgradePage() {
  const router = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [paddleReady, setPaddleReady] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  // Live prices from Paddle, keyed by priceId. Falls back to PLANS[].price.
  const [livePrices, setLivePrices] = useState<Record<string, string>>({})
  // Live trial labels from Paddle, keyed by priceId. Falls back to PLANS[].trial.
  const [liveTrials, setLiveTrials] = useState<Record<string, string>>({})

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.replace('/login'); return }
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [router])

  // Load + initialize Paddle.js
  useEffect(() => {
    if (!user) return
    const script = document.createElement('script')
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
    script.async = true
    script.onload = () => {
      const w = window as any
      if (!w.Paddle) return

      // Only switch to sandbox when the env says sandbox.
      // In production we DON'T call Environment.set (defaults to live).
      if (paddleConfig.isSandbox) {
        w.Paddle.Environment.set('sandbox')
      }

      w.Paddle.Initialize({
        token: paddleConfig.token,
        eventCallback: (event: any) => {
          if (event.name === 'checkout.completed') {
            // RevenueCat ignores Paddle customData, so we must explicitly
            // link the transaction to the Firebase UID. Do it BEFORE redirect.
            const fetchToken = event?.data?.transaction_id
            const uid = user?.uid

            if (fetchToken && uid) {
              fetch('/api/link-revenuecat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, fetchToken }),
              })
                .catch((e) => console.error('link-revenuecat call failed', e))
                .finally(() => router.replace('/success'))
            } else {
              console.error('Missing transaction_id or uid on checkout.completed', {
                fetchToken,
                uid,
              })
              router.replace('/success')
            }
          }
        },
      })
      setPaddleReady(true)

      // Pull the real prices (localized to the visitor's currency) so the
      // cards always match what Paddle will charge.
      w.Paddle.PricePreview({
        items: PLANS.map((p) => ({ priceId: p.priceId, quantity: 1 })),
      })
        .then((res: any) => {
          const prices: Record<string, string> = {}
          const trials: Record<string, string> = {}
          for (const item of res?.data?.details?.lineItems ?? []) {
            const id = item?.price?.id
            if (!id) continue
            const formatted = item?.formattedUnitTotals?.subtotal
            if (formatted) prices[id] = formatted
            const trial = item?.price?.trialPeriod
            if (trial?.frequency && trial?.interval) {
              const unit = trial.interval.charAt(0).toUpperCase() + trial.interval.slice(1)
              trials[id] = `${trial.frequency} ${unit}${trial.frequency > 1 ? 's' : ''} Free Trial`
            }
          }
          setLivePrices(prices)
          setLiveTrials(trials)
        })
        .catch((e: any) => console.error('Paddle price preview failed', e))
    }
    document.head.appendChild(script)
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [user, router])

  const handleCheckout = (plan: typeof PLANS[0]) => {
    const w = window as any
    if (!w.Paddle || !paddleReady) return
    setCheckoutLoading(plan.id)

    w.Paddle.Checkout.open({
      items: [{ priceId: plan.priceId, quantity: 1 }],
      // Kept for traceability in Paddle's dashboard. NOTE: RevenueCat does
      // NOT read this — linking happens via /api/link-revenuecat on completion.
      customData: { app_user_id: user?.uid },
      customer: { email: user?.email ?? undefined },
      successUrl: `${window.location.origin}/success`,
    })

    setCheckoutLoading(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="w-8 h-8 border-4 border-brand-dark border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-brand-muted hover:text-brand-dark transition-colors text-sm">
          ← Back
        </button>
        <span className="font-display font-bold text-lg text-brand-dark">Upgrade Quassama</span>
        <div className="w-16" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {paddleConfig.isSandbox && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl px-4 py-2 text-center">
            ⚠️ Sandbox / test mode is active. Use test card 4242 4242 4242 4242.
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-brand-dark mb-3">Choose your plan</h1>
          <p className="text-brand-muted">Unlock the full power of Quassama</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 flex flex-col ${
                plan.highlight ? 'bg-brand-dark text-white' : 'bg-white border border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  plan.highlight ? 'bg-brand-yellow text-brand-dark' : 'bg-brand-cream text-brand-green'
                }`}>
                  {plan.badge}
                </span>
                {(liveTrials[plan.priceId] ?? plan.trial) && (
                  <span className={`text-xs ${plan.highlight ? 'text-brand-yellow' : 'text-brand-green'}`}>
                    ✨ {liveTrials[plan.priceId] ?? plan.trial}
                  </span>
                )}
              </div>

              <h2 className={`font-display text-2xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-brand-dark'}`}>
                {plan.name}
              </h2>
              <div className="flex items-baseline gap-1 mb-5">
                <span className={`text-3xl font-bold ${plan.highlight ? 'text-brand-yellow' : 'text-brand-dark'}`}>
                  {livePrices[plan.priceId] ?? plan.price}
                </span>
                <span className={`text-sm ${plan.highlight ? 'text-white/60' : 'text-brand-muted'}`}>
                  {plan.period}
                </span>
              </div>

              <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 ${plan.highlight ? 'text-brand-yellow' : 'text-brand-green'}`}>✓</span>
                    <span className={plan.highlight ? 'text-white/80' : 'text-brand-muted'}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={checkoutLoading === plan.id || !paddleReady}
                className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                  plan.highlight ? 'bg-brand-yellow text-brand-dark hover:opacity-90' : 'bg-brand-dark text-white hover:opacity-90'
                }`}
              >
                {checkoutLoading === plan.id ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : plan.trial ? 'Start Free Trial' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => router.push('/dashboard')} className="text-sm text-brand-muted hover:text-brand-dark transition-colors">
            Continue with free plan →
          </button>
        </div>

        <p className="text-center text-xs text-brand-muted mt-8">
          Secure payments by Paddle • Cancel anytime •{' '}
          <a href="https://quassama.com/terms-and-conditions" className="underline hover:text-brand-dark">Terms</a>
        </p>
      </main>
    </div>
  )
}
