// ============================================================
//  SUBSCRIPTION STATUS
//  Reads the user's real entitlements from RevenueCat's REST API,
//  keyed on the Firebase UID (we pass it to Paddle as app_user_id,
//  and RevenueCat links the purchase to it).
//
//  Uses the PUBLIC RevenueCat SDK key — safe to expose client-side.
//  Set NEXT_PUBLIC_REVENUECAT_API_KEY in your env.
//
//  Everything degrades gracefully: if the key is missing, the request
//  fails, or there's no active entitlement, we report the Free plan.
// ============================================================

export type Subscription = {
  active: boolean
  planName: string            // "Personal" | "Couple / Family" | "Premium" | "Free"
  renewalDate: string | null  // ISO date of next renewal / expiry, if any
  willRenew: boolean
}

export const FREE_SUBSCRIPTION: Subscription = {
  active: false,
  planName: 'Free',
  renewalDate: null,
  willRenew: false,
}

const API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_API_KEY

function planNameFromProduct(productId: string | undefined): string {
  if (!productId) return 'Premium'
  const id = productId.toLowerCase()
  if (id.includes('family') || id.includes('couple')) return 'Couple / Family'
  if (id.includes('personal')) return 'Personal'
  return 'Premium'
}

export async function fetchSubscription(uid: string): Promise<Subscription> {
  if (!API_KEY || !uid) return FREE_SUBSCRIPTION

  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } },
    )
    if (!res.ok) return FREE_SUBSCRIPTION

    const data = await res.json()
    const entitlements: Record<string, any> = data?.subscriber?.entitlements ?? {}
    const subscriptions: Record<string, any> = data?.subscriber?.subscriptions ?? {}
    const now = Date.now()

    // An entitlement is active if it has no expiry (lifetime) or expires in the future.
    const activeEntry = Object.values(entitlements).find((e: any) => {
      const exp = e?.expires_date ? Date.parse(e.expires_date) : null
      return exp === null || exp > now
    })

    if (!activeEntry) return FREE_SUBSCRIPTION

    const productId: string | undefined = activeEntry.product_identifier
    const sub = productId ? subscriptions[productId] : undefined

    return {
      active: true,
      planName: planNameFromProduct(productId),
      renewalDate: activeEntry.expires_date ?? null,
      // RevenueCat sets unsubscribe_detected_at once the user cancels auto-renew.
      willRenew: sub ? !sub.unsubscribe_detected_at : true,
    }
  } catch {
    return FREE_SUBSCRIPTION
  }
}
