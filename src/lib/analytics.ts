import { Expense } from '@/lib/expenses'

export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'

export const TIME_RANGES: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL']

export type CategorySlice = {
  categoryName: string
  categoryColor: string
  total: number
  percentage: number
}

export type TrendPoint = {
  label: string
  total: number
}

export type Analytics = {
  total: number
  average: number
  count: number
  categories: CategorySlice[]
  trend: TrendPoint[]
}

// Mirrors the mobile app's AnalyticsUtils.getDateRange.
function getRangeStart(range: TimeRange, now: Date): Date | null {
  const start = new Date(now)
  switch (range) {
    case '1W':
      start.setDate(start.getDate() - 7)
      return start
    case '1M':
      start.setMonth(start.getMonth() - 1)
      return start
    case '3M':
      start.setMonth(start.getMonth() - 3)
      return start
    case '6M':
      start.setMonth(start.getMonth() - 6)
      return start
    case '1Y':
      start.setFullYear(start.getFullYear() - 1)
      return start
    case 'ALL':
      return null
  }
}

function filterByRange(expenses: Expense[], range: TimeRange): Expense[] {
  const now = new Date()
  const start = getRangeStart(range, now)
  if (!start) return expenses.filter((e) => e.date)
  return expenses.filter((e) => e.date && e.date >= start)
}

function aggregateCategories(expenses: Expense[], total: number): CategorySlice[] {
  const byCategory = new Map<string, { color: string; total: number }>()
  for (const e of expenses) {
    const key = e.categoryName || 'Other'
    const entry = byCategory.get(key)
    if (entry) {
      entry.total += e.amount
    } else {
      byCategory.set(key, { color: e.categoryColor, total: e.amount })
    }
  }
  return Array.from(byCategory.entries())
    .map(([categoryName, { color, total: catTotal }]) => ({
      categoryName,
      categoryColor: color,
      total: catTotal,
      percentage: total > 0 ? (catTotal / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

// Mirrors the mobile app's AnalyticsUtils.aggregateTrendData: day-of-week
// buckets for 1W, week-of-month buckets for 1M, month buckets otherwise.
function aggregateTrend(expenses: Expense[], range: TimeRange, now: Date): TrendPoint[] {
  if (range === '1W') {
    const days: TrendPoint[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), total: 0 })
    }
    for (const e of expenses) {
      if (!e.date) continue
      const diffDays = Math.floor((now.getTime() - e.date.getTime()) / (1000 * 60 * 60 * 24))
      const idx = 6 - diffDays
      if (idx >= 0 && idx < days.length) days[idx].total += e.amount
    }
    return days
  }

  if (range === '1M') {
    const weeks: TrendPoint[] = [
      { label: 'W1', total: 0 },
      { label: 'W2', total: 0 },
      { label: 'W3', total: 0 },
      { label: 'W4', total: 0 },
    ]
    for (const e of expenses) {
      if (!e.date) continue
      const week = Math.min(3, Math.floor((e.date.getDate() - 1) / 7))
      weeks[week].total += e.amount
    }
    return weeks
  }

  const monthsBack = range === '3M' ? 3 : range === '6M' ? 6 : range === '1Y' ? 12 : 24
  const buckets = new Map<string, TrendPoint>()
  const order: string[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const label = d.toLocaleDateString(undefined, { month: 'short' })
    buckets.set(key, { label, total: 0 })
    order.push(key)
  }
  for (const e of expenses) {
    if (!e.date) continue
    const key = `${e.date.getFullYear()}-${e.date.getMonth()}`
    const bucket = buckets.get(key)
    if (bucket) bucket.total += e.amount
  }
  return order.map((key) => buckets.get(key)!)
}

export function computeAnalytics(expenses: Expense[], range: TimeRange): Analytics {
  const now = new Date()
  const filtered = filterByRange(expenses, range)

  const total = filtered.reduce((sum, e) => sum + e.amount, 0)
  const count = filtered.length
  const average = count > 0 ? total / count : 0

  return {
    total,
    average,
    count,
    categories: aggregateCategories(filtered, total),
    trend: aggregateTrend(filtered, range, now),
  }
}
