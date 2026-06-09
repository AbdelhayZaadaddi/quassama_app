// ============================================================
//  PADDLE CONFIG
//  Reads NEXT_PUBLIC_PADDLE_ENV and picks the right keys.
//  You NEVER need to edit code to switch between sandbox/prod —
//  just change NEXT_PUBLIC_PADDLE_ENV in .env.local
// ============================================================

const ENV = (process.env.NEXT_PUBLIC_PADDLE_ENV || 'production') as
  | 'sandbox'
  | 'production'

const isSandbox = ENV === 'sandbox'

export const paddleConfig = {
  environment: ENV,
  isSandbox,
  token: isSandbox
    ? process.env.NEXT_PUBLIC_PADDLE_SANDBOX_TOKEN!
    : process.env.NEXT_PUBLIC_PADDLE_PROD_TOKEN!,
  personalPriceId: isSandbox
    ? process.env.NEXT_PUBLIC_PADDLE_SANDBOX_PERSONAL_PRICE_ID!
    : process.env.NEXT_PUBLIC_PADDLE_PROD_PERSONAL_PRICE_ID!,
  familyPriceId: isSandbox
    ? process.env.NEXT_PUBLIC_PADDLE_SANDBOX_FAMILY_PRICE_ID!
    : process.env.NEXT_PUBLIC_PADDLE_PROD_FAMILY_PRICE_ID!,
}

export const revenueCatWebLink =
  process.env.NEXT_PUBLIC_REVENUECAT_WEB_LINK || ''
