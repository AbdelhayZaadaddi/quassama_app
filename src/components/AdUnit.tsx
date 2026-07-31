'use client'
import { useEffect, useRef } from 'react'

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

export default function AdUnit({ slot, className }: { slot: string; className?: string }) {
  const insRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || pushed.current) return
    pushed.current = true
    try {
      ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
      ;(window as any).adsbygoogle.push({})
    } catch (err) {
      console.error('adsbygoogle push failed:', err)
    }
  }, [])

  if (!ADSENSE_CLIENT_ID) return null

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle block ${className ?? ''}`}
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
