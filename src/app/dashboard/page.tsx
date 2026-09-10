'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, onAuthStateChanged, sendEmailVerification, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { revenueCatWebLink } from '@/lib/paddle'
import { fetchSubscription, FREE_SUBSCRIPTION, Subscription } from '@/lib/subscription'
import { fetchRecentExpenses, fetchAllExpenses, Expense } from '@/lib/expenses'
import { fetchUserGroups, Group } from '@/lib/groups'
import { fetchUserSavingGoals, savedAmount, SavingGoal } from '@/lib/savingGoals'
import { computeAnalytics, TIME_RANGES, TimeRange } from '@/lib/analytics'
import { fetchCurrentMonthBudget, Budget } from '@/lib/budget'
import CategoryIcon from '@/components/CategoryIcon'
import AdUnit from '@/components/AdUnit'
import AddExpenseModal from '@/components/AddExpenseModal'
import AddBudgetModal from '@/components/AddBudgetModal'
import AddSavingGoalModal from '@/components/AddSavingGoalModal'
import SavingGoalDetailsModal from '@/components/SavingGoalDetailsModal'
import Toast from '@/components/Toast'
import ListModal from '@/components/ListModal'
import ProfileMenu from '@/components/ProfileMenu'
import UpgradeShowcaseModal from '@/components/UpgradeShowcaseModal'
import InfoDialog from '@/components/InfoDialog'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Receipt,
  Users,
  Crown,
  Bell,
  BellOff,
  PiggyBank,
  BarChart3,
  TrendingUp,
  PieChartIcon,
  LineChartIcon,
  CreditCard,
  Plus,
  Wallet,
  Pencil,
} from 'lucide-react'

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const amountCache = new Map<string, Intl.NumberFormat>()

function formatAmount(amount: number, currency?: string): string {
  if (!currency) return amount.toLocaleString(undefined, { maximumFractionDigits: 0 })
  let fmt = amountCache.get(currency)
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 })
    } catch {
      fmt = undefined
    }
    if (fmt) amountCache.set(currency, fmt)
  }
  return fmt ? fmt.format(amount) : `${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}`
}

export default function DashboardPage() {
  const router  = useRouter()
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sub, setSub]         = useState<Subscription | null>(null)
  const [subError, setSubError] = useState(false)
  const [verifySent, setVerifySent] = useState(false)
  const [expenses, setExpenses]         = useState<Expense[] | null>(null)
  const [expensesError, setExpensesError] = useState(false)
  const [groups, setGroups]         = useState<Group[] | null>(null)
  const [groupsError, setGroupsError] = useState(false)
  const [goals, setGoals]         = useState<SavingGoal[] | null>(null)
  const [goalsError, setGoalsError] = useState(false)
  const [allExpenses, setAllExpenses]         = useState<Expense[] | null>(null)
  const [allExpensesError, setAllExpensesError] = useState(false)
  const [analyticsRange, setAnalyticsRange] = useState<TimeRange>('1M')
  const [chartType, setChartType] = useState<'trend' | 'category'>('trend')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [toast, setToast] = useState('')
  const [budget, setBudget] = useState<Budget | null | undefined>(undefined)
  const [budgetError, setBudgetError] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const [showAllGoals, setShowAllGoals] = useState(false)
  const [showAllGroups, setShowAllGroups] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null)
  const [showUpgradeShowcase, setShowUpgradeShowcase] = useState(false)
  const [showCreateGroupInfo, setShowCreateGroupInfo] = useState(false)

  const loadGoals = (uid: string) => {
    fetchUserSavingGoals(uid)
      .then(setGoals)
      .catch((err) => {
        console.error('fetchUserSavingGoals failed:', err)
        setGoalsError(true)
        setGoals([])
      })
  }

  const loadExpenses = (uid: string) => {
    fetchRecentExpenses(uid)
      .then(setExpenses)
      .catch((err) => {
        console.error('fetchRecentExpenses failed:', err)
        setExpensesError(true)
        setExpenses([])
      })
    fetchAllExpenses(uid)
      .then(setAllExpenses)
      .catch((err) => {
        console.error('fetchAllExpenses failed:', err)
        setAllExpensesError(true)
        setAllExpenses([])
      })
  }

  const loadBudget = (uid: string) => {
    fetchCurrentMonthBudget(uid)
      .then(setBudget)
      .catch((err) => {
        console.error('fetchCurrentMonthBudget failed:', err)
        setBudgetError(true)
        setBudget(null)
      })
  }

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
      loadExpenses(u.uid)
      loadBudget(u.uid)
      fetchUserGroups(u.uid)
        .then(setGroups)
        .catch((err) => {
          console.error('fetchUserGroups failed:', err)
          setGroupsError(true)
          setGroups([])
        })
      loadGoals(u.uid)
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  // Shows the upgrade showcase every fresh page load for free-plan users —
  // deliberately not persisted (no localStorage suppression) per product ask.
  useEffect(() => {
    if (sub && !sub.active) setShowUpgradeShowcase(true)
  }, [sub])

  const currencyByGroupId = new Map((groups ?? []).map((g) => [g.id, g.currency]))
  const primaryCurrency = groups?.[0]?.currency
  const analytics = computeAnalytics(allExpenses ?? [], analyticsRange)

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
      <div className="min-h-screen bg-brand-cream">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-100" />
            <div className="h-5 w-24 bg-gray-100 rounded" />
          </div>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-gray-100" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="mb-8 animate-pulse space-y-2">
            <div className="h-8 w-48 bg-gray-100 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 animate-pulse">
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

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3">
              <div className="h-4 w-32 bg-gray-100 rounded mb-3" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    <div className="h-2.5 w-1/3 bg-gray-100 rounded" />
                  </div>
                  <div className="h-3 w-10 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3">
                <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
                <div className="h-2 w-full bg-gray-100 rounded-full" />
                <div className="h-2 w-full bg-gray-100 rounded-full" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3">
                <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
                <div className="h-3 w-2/3 bg-gray-100 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? '?'

  const memberSince = formatDate(user?.metadata?.creationTime ?? null)
  const renewal = sub ? formatDate(sub.renewalDate) : null

  const renderExpenseRow = (exp: Expense) => (
    <div key={exp.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div
        className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${exp.categoryColor}1A` }}
      >
        <CategoryIcon name={exp.categoryIcon} size={16} style={{ color: exp.categoryColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-dark truncate">{exp.name}</p>
        <p className="text-xs text-brand-muted truncate">
          {exp.categoryName}
          {exp.groupName ? ` · ${exp.groupName}` : ''}
        </p>
      </div>
      <span className="text-sm font-semibold text-brand-dark whitespace-nowrap">
        {formatAmount(exp.amount, currencyByGroupId.get(exp.groupId))}
      </span>
    </div>
  )

  const renderGoalRow = (goal: SavingGoal) => {
    const saved = savedAmount(goal)
    const pct = goal.targetAmount > 0 ? Math.min(100, (saved / goal.targetAmount) * 100) : 0
    const completed = goal.status === 'completed'
    return (
      <button
        type="button"
        key={goal.id}
        onClick={() => setSelectedGoal(goal)}
        className="w-full text-left py-3 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-full bg-brand-cream flex items-center justify-center shrink-0">
            <CategoryIcon name={goal.icon} size={16} className="text-brand-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand-dark truncate">
              {goal.name || `${goal.targetAmount.toLocaleString()} target`}
            </p>
            <p className="text-xs text-brand-muted truncate">
              {goal.numberOfDays} {goal.numberOfDays === 1 ? 'day' : 'days'}
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
              completed ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-yellow/20 text-brand-dark'
            }`}
          >
            {completed ? 'Completed' : 'Active'}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${completed ? 'bg-brand-green' : 'bg-brand-yellow'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-brand-muted">{Math.round(pct)}%</span>
          <span className="text-xs text-brand-muted">
            {saved.toLocaleString()} / {goal.targetAmount.toLocaleString()}
          </span>
        </div>
      </button>
    )
  }

  const renderGroupRow = (g: Group) => {
    const isAdmin = user?.uid === g.adminId
    return (
      <div key={g.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
        <div className="h-9 w-9 rounded-full bg-brand-cream flex items-center justify-center shrink-0 text-xs font-semibold text-brand-dark">
          {g.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-brand-dark truncate flex items-center gap-1.5">
            {g.name}
            {isAdmin && <Crown size={13} className="text-brand-yellow shrink-0" />}
          </p>
          <p className="text-xs text-brand-muted truncate">
            {g.memberIds.length} {g.memberIds.length === 1 ? 'member' : 'members'} · {g.currency}
          </p>
        </div>
        {g.notifyExpenses ? (
          <Bell size={15} className="text-brand-muted shrink-0" />
        ) : (
          <BellOff size={15} className="text-gray-300 shrink-0" />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-brand-dark flex items-center justify-center">
            <img src="/assets/logo1.png" alt="Quassama" className="h-5 w-5" />
          </div>
          <span className="font-display font-bold text-xl text-brand-dark">Quassama</span>
        </div>
        <ProfileMenu initials={initials} onSignOut={handleSignOut} />
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
      {sub && !sub.active && (
        <button
          onClick={() => router.push('/upgrade')}
          className="group w-full mb-6 rounded-2xl bg-gradient-to-r from-brand-dark via-brand-green to-brand-dark animate-shimmer text-white px-5 py-3.5 flex items-center justify-between gap-3 hover:shadow-lg transition-shadow"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={16} className="text-brand-yellow shrink-0" />
            Upgrade to Premium — unlock Voice AI, receipt scanning &amp; more
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-brand-yellow shrink-0 group-hover:translate-x-0.5 transition-transform">
            See plans <ArrowRight size={13} />
          </span>
        </button>
      )}
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
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 animate-pulse">
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
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-brand-dark" />
                <h2 className="text-sm font-semibold text-brand-dark">Current Plan</h2>
              </div>
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
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-brand-dark" />
                <h2 className="text-sm font-semibold text-brand-dark">Current Plan</h2>
              </div>
              <span className="bg-gray-100 text-brand-muted text-xs font-medium px-3 py-1 rounded-full">Free</span>
            </div>
            <div className="flex flex-col gap-2 text-sm text-brand-muted mb-6">
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-green shrink-0" /> Basic expense tracking</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-green shrink-0" /> Limited groups</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-brand-green shrink-0" /> Up to 10 AI decisions/month</div>
            </div>
            <p className="text-xs text-brand-muted text-center">See the banner above to upgrade.</p>
          </div>
        )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-brand-dark" />
              <h2 className="text-sm font-semibold text-brand-dark">Recent expenses</h2>
            </div>
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-brand-dark text-white px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
            >
              <Plus size={13} />
              Add expense
            </button>
          </div>

          {expenses === null ? (
            <div className="space-y-3 animate-pulse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    <div className="h-2.5 w-1/3 bg-gray-100 rounded" />
                  </div>
                  <div className="h-3 w-10 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-xs text-brand-muted">
              {expensesError ? "Couldn't load your recent expenses." : 'No expenses yet.'}
            </p>
          ) : (
            <>
              <div className="flex flex-col divide-y divide-gray-50">
                {expenses.slice(0, 3).map(renderExpenseRow)}
              </div>
              {(allExpenses ?? expenses).length > 3 && (
                <button
                  onClick={() => setShowAllExpenses(true)}
                  className="mt-3 w-full text-center text-xs font-semibold text-brand-dark hover:opacity-70 transition-opacity"
                >
                  Show more
                </button>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-brand-dark" />
              <h2 className="text-sm font-semibold text-brand-dark">Analytics</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-brand-cream rounded-full p-1">
                {TIME_RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setAnalyticsRange(r)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      analyticsRange === r
                        ? 'bg-brand-dark text-white'
                        : 'text-brand-muted hover:text-brand-dark'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-brand-cream rounded-full p-1">
                <button
                  onClick={() => setChartType('trend')}
                  aria-label="Trend chart"
                  className={`p-1.5 rounded-full transition-colors ${
                    chartType === 'trend' ? 'bg-brand-dark text-white' : 'text-brand-muted hover:text-brand-dark'
                  }`}
                >
                  <LineChartIcon size={14} />
                </button>
                <button
                  onClick={() => setChartType('category')}
                  aria-label="Category breakdown"
                  className={`p-1.5 rounded-full transition-colors ${
                    chartType === 'category' ? 'bg-brand-dark text-white' : 'text-brand-muted hover:text-brand-dark'
                  }`}
                >
                  <PieChartIcon size={14} />
                </button>
              </div>
            </div>
          </div>

          {allExpenses === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-8 w-32 bg-gray-100 rounded" />
                <div className="h-3 w-40 bg-gray-100 rounded" />
                <div className="h-3 w-28 bg-gray-100 rounded" />
              </div>
              <div className="h-40 w-40 rounded-full bg-gray-100 mx-auto" />
            </div>
          ) : analytics.count === 0 ? (
            <p className="text-xs text-brand-muted">
              {allExpensesError ? "Couldn't load your analytics." : 'No expenses logged in this period.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-xs text-brand-muted mb-1">Total spent</p>
                <p className="font-display text-3xl font-bold text-brand-dark mb-4">
                  {formatAmount(analytics.total, primaryCurrency)}
                </p>
                <div className="flex items-center gap-2 text-sm text-brand-muted mb-4">
                  <TrendingUp size={15} className="text-brand-green shrink-0" />
                  Avg {formatAmount(analytics.average, primaryCurrency)} per expense · {analytics.count} logged
                </div>
                <div className="flex flex-col gap-2">
                  {analytics.categories.slice(0, 5).map((c) => (
                    <div key={c.categoryName} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.categoryColor }}
                      />
                      <span className="text-brand-dark flex-1 truncate">{c.categoryName}</span>
                      <span className="text-brand-muted">{c.percentage.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'trend' ? (
                    <LineChart data={analytics.trend}>
                      <CartesianGrid stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip formatter={(value) => formatAmount(Number(value ?? 0), primaryCurrency)} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#2D6A4F"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#2D6A4F' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={analytics.categories}
                        dataKey="total"
                        nameKey="categoryName"
                        innerRadius="60%"
                        outerRadius="90%"
                        paddingAngle={2}
                      >
                        {analytics.categories.map((c) => (
                          <Cell key={c.categoryName} fill={c.categoryColor} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatAmount(Number(value ?? 0), primaryCurrency)} />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_DASHBOARD_SLOT ?? ''} className="min-h-[100px]" />
        </div>

        <div className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-brand-dark" />
              <h2 className="text-sm font-semibold text-brand-dark">Monthly budget</h2>
            </div>
            {budget && (
              <button
                onClick={() => setShowBudgetModal(true)}
                aria-label="Edit budget"
                className="text-brand-muted hover:text-brand-dark"
              >
                <Pencil size={13} />
              </button>
            )}
          </div>

          {budget === undefined ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-7 w-28 bg-gray-100 rounded" />
              <div className="h-2 w-full bg-gray-100 rounded-full" />
            </div>
          ) : budget === null ? (
            <div>
              <p className="text-xs text-brand-muted mb-3">
                {budgetError ? "Couldn't load your budget." : 'Set a monthly budget to track your spending.'}
              </p>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="btn-primary w-full text-center text-xs py-2"
              >
                Set budget
              </button>
            </div>
          ) : (
            (() => {
              const available = budget.amount - budget.spent
              const pct = budget.amount > 0 ? Math.min(100, (budget.spent / budget.amount) * 100) : 0
              const over = available < 0
              return (
                <div>
                  <p className="text-xs text-brand-muted mb-1">{over ? 'Over budget' : 'Still available'}</p>
                  <p className={`font-display text-2xl font-bold mb-3 ${over ? 'text-red-600' : 'text-brand-dark'}`}>
                    {formatAmount(available, primaryCurrency)}
                  </p>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-brand-green'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-brand-muted">
                    <span>{formatAmount(budget.spent, primaryCurrency)} spent</span>
                    <span>{formatAmount(budget.amount, primaryCurrency)} budget</span>
                  </div>
                </div>
              )
            })()
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <PiggyBank size={16} className="text-brand-dark" />
              <h2 className="text-sm font-semibold text-brand-dark">Saving goals</h2>
            </div>
            <button
              onClick={() => setShowAddGoal(true)}
              aria-label="New saving goal"
              className="flex items-center gap-1 text-xs font-semibold bg-brand-dark text-white px-2.5 py-1.5 rounded-full hover:opacity-90 transition-opacity"
            >
              <Plus size={13} />
            </button>
          </div>

          {goals === null ? (
            <div className="space-y-4 animate-pulse">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-1/2 bg-gray-100 rounded" />
                      <div className="h-2.5 w-1/3 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <p className="text-xs text-brand-muted">
              {goalsError ? "Couldn't load your saving goals." : 'No saving goals yet.'}
            </p>
          ) : (
            <>
              <div className="flex flex-col divide-y divide-gray-50">
                {goals.slice(0, 3).map(renderGoalRow)}
              </div>
              {goals.length > 3 && (
                <button
                  onClick={() => setShowAllGoals(true)}
                  className="mt-3 w-full text-center text-xs font-semibold text-brand-dark hover:opacity-70 transition-opacity"
                >
                  Show more
                </button>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-brand-dark" />
              <h2 className="text-sm font-semibold text-brand-dark">Your groups</h2>
            </div>
            <button
              onClick={() => setShowCreateGroupInfo(true)}
              aria-label="Create group"
              className="flex items-center gap-1 text-xs font-semibold bg-brand-dark text-white px-2.5 py-1.5 rounded-full hover:opacity-90 transition-opacity"
            >
              <Plus size={13} />
            </button>
          </div>

          {groups === null ? (
            <div className="space-y-3 animate-pulse">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-1/3 bg-gray-100 rounded" />
                    <div className="h-2.5 w-1/4 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="text-xs text-brand-muted">
              {groupsError ? "Couldn't load your groups." : "You're not in any groups yet."}
            </p>
          ) : (
            <>
              <div className="flex flex-col divide-y divide-gray-50">
                {groups.slice(0, 3).map(renderGroupRow)}
              </div>
              {groups.length > 3 && (
                <button
                  onClick={() => setShowAllGroups(true)}
                  className="mt-3 w-full text-center text-xs font-semibold text-brand-dark hover:opacity-70 transition-opacity"
                >
                  Show more
                </button>
              )}
            </>
          )}
        </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {memberSince && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-brand-muted">Member since</span>
            <span className="text-xs font-medium text-brand-dark">{memberSince}</span>
          </div>
        )}
      </div>
      </main>

      {showAddExpense && user && (
        <AddExpenseModal
          uid={user.uid}
          groups={groups ?? []}
          onClose={() => setShowAddExpense(false)}
          onCreated={() => {
            loadExpenses(user.uid)
            loadBudget(user.uid)
            setToast('Expense added')
          }}
        />
      )}

      {showBudgetModal && user && (
        <AddBudgetModal
          uid={user.uid}
          currentAmount={budget?.amount}
          spentSoFar={budget?.spent ?? 0}
          currency={primaryCurrency}
          onClose={() => setShowBudgetModal(false)}
          onSaved={() => {
            loadBudget(user.uid)
            setToast('Budget updated')
          }}
        />
      )}

      {showAllExpenses && (
        <ListModal title="All expenses" icon={<Receipt size={16} className="text-brand-dark" />} onClose={() => setShowAllExpenses(false)}>
          {(allExpenses ?? []).length === 0 ? (
            <p className="text-xs text-brand-muted py-3">No expenses yet.</p>
          ) : (
            (allExpenses ?? []).map(renderExpenseRow)
          )}
        </ListModal>
      )}

      {showAllGoals && (
        <ListModal title="All saving goals" icon={<PiggyBank size={16} className="text-brand-dark" />} onClose={() => setShowAllGoals(false)}>
          {(goals ?? []).length === 0 ? (
            <p className="text-xs text-brand-muted py-3">No saving goals yet.</p>
          ) : (
            (goals ?? []).map(renderGoalRow)
          )}
        </ListModal>
      )}

      {showAddGoal && user && (
        <AddSavingGoalModal
          uid={user.uid}
          onClose={() => setShowAddGoal(false)}
          onCreated={() => {
            loadGoals(user.uid)
            setToast('Saving goal created')
          }}
        />
      )}

      {selectedGoal && user && (
        <SavingGoalDetailsModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onChanged={() => loadGoals(user.uid)}
        />
      )}

      {showAllGroups && (
        <ListModal title="All groups" icon={<Users size={16} className="text-brand-dark" />} onClose={() => setShowAllGroups(false)}>
          {(groups ?? []).length === 0 ? (
            <p className="text-xs text-brand-muted py-3">You're not in any groups yet.</p>
          ) : (
            (groups ?? []).map(renderGroupRow)
          )}
        </ListModal>
      )}

      {showUpgradeShowcase && (
        <UpgradeShowcaseModal
          onClose={() => setShowUpgradeShowcase(false)}
          onUpgrade={() => {
            setShowUpgradeShowcase(false)
            router.push('/upgrade')
          }}
        />
      )}

      {showCreateGroupInfo && (
        <InfoDialog
          title="Create a group from the app"
          message="Creating groups is only available in the Quassama mobile app for now. Download the app to get started."
          onClose={() => setShowCreateGroupInfo(false)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast('')} />}
    </div>
  )
}
