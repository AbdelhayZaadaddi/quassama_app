# Quassama Web App — app.quassama.com

Next.js web app for managing Quassama subscriptions via Paddle + RevenueCat.
Lets Android (and any web) users subscribe through a browser, with their
Firebase UID passed to RevenueCat so the subscription links to their account.

---

## 1. Install

```bash
cd quassama-app
npm install
```

## 2. Add your Firebase keys

Open `.env.local` and fill in ONLY the Firebase section (everything else is
already filled in for you). Get the values from:
**Firebase Console > Project Settings > Your apps > SDK config**

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 3. Run

```bash
npm run dev
```

Open http://localhost:3000 — it works in **sandbox mode** out of the box.
Test payment card: `4242 4242 4242 4242`, any future expiry, any CVC.

---

## Switching between Sandbox and Production

You do NOT edit any code. Just change ONE line in `.env.local`:

```
NEXT_PUBLIC_PADDLE_ENV=sandbox      # testing
NEXT_PUBLIC_PADDLE_ENV=production   # real payments
```

Then restart `npm run dev`.

### Before going to production you must:
1. Get the LIVE client-side token from your LIVE Paddle account:
   Developer Tools > Authentication > "Client-side tokens" tab > + New.
   It starts with `live_`. Put it in `NEXT_PUBLIC_PADDLE_PROD_TOKEN`.
   (Do NOT use the `pdl_live_apikey_...` server key — that's why it 403'd.)
2. Your Paddle account must be approved for live payments.
3. In Paddle (live) > Checkout > Checkout Settings, set the default payment
   link / approved domain to `https://app.quassama.com` and request approval.
4. In RevenueCat > Quassama (Paddle), make sure the LIVE Paddle API key is set.

---

## Pages
- `/login`     — Firebase login (email + Google)
- `/dashboard` — account overview, shows UID
- `/upgrade`   — pricing + Paddle checkout
- `/success`   — post-payment confirmation

---

## Deploy to Vercel
```bash
npx vercel
```
- Add every variable from `.env.local` in Vercel > Settings > Environment Variables
- Set custom domain to `app.quassama.com`
- DNS: add a CNAME record  `app` -> `cname.vercel-dns.com`

---

## Notes
- Logo: drop a `logo.png` into the `public/` folder to show it in the header.
- The checkout passes `customData.app_user_id = Firebase UID`, which is how
  RevenueCat ties the web purchase to the same user as the mobile app.
# quassama_app
