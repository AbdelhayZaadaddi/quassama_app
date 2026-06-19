// ============================================================
//  LINK PADDLE PURCHASE → REVENUECAT APP USER ID
//  RevenueCat's automatic Paddle webhook tracking does NOT read
//  Paddle customData, so purchases land on an ANONYMOUS customer.
//  This route explicitly links a Paddle transaction to the Firebase
//  UID using RevenueCat's POST /v1/receipts endpoint, so the mobile
//  app (which logs in with the same UID) sees the entitlement.
//
//  Requires the "Quassama (Paddle)" PUBLIC SDK key from RevenueCat.
//  Set REVENUECAT_PADDLE_PUBLIC_KEY in your env (.env.local).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'

const RC_PADDLE_PUBLIC_KEY =
  process.env.REVENUECAT_PADDLE_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_REVENUECAT_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { uid, fetchToken } = await req.json()

    if (!uid || !fetchToken) {
      return NextResponse.json(
        { error: 'Missing uid or fetchToken' },
        { status: 400 },
      )
    }

    if (!RC_PADDLE_PUBLIC_KEY) {
      console.error('REVENUECAT_PADDLE_PUBLIC_KEY is not set')
      return NextResponse.json(
        { error: 'RevenueCat key not configured' },
        { status: 500 },
      )
    }

    // fetch_token can be a Paddle transaction id (txn_...) or subscription id (sub_...)
    const res = await fetch('https://api.revenuecat.com/v1/receipts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': 'paddle',
        Authorization: `Bearer ${RC_PADDLE_PUBLIC_KEY}`,
      },
      body: JSON.stringify({
        app_user_id: uid,
        fetch_token: fetchToken,
      }),
    })

    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      console.error('RevenueCat link failed:', res.status, body)
      return NextResponse.json(
        { error: 'RevenueCat link failed', status: res.status, detail: body },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('link-revenuecat error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
