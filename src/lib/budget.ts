import { collection, query, where, getDocs, addDoc, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type Budget = {
  id: string
  amount: number
  spent: number
  month: string // YYYY-MM
}

export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Equality-only query (userId == , month ==) — no composite index needed,
// unlike an equality+orderBy combo (see the groups/expenses index issue we
// hit earlier). Deliberately does not replicate the mobile app's "clone
// budget from last month if none exists" fallback, which relies on an
// unindexed where+orderBy query.
async function findBudgetDoc(uid: string, month: string) {
  const q = query(collection(db, 'budgets'), where('userId', '==', uid), where('month', '==', month))
  const snap = await getDocs(q)
  return snap.empty ? null : snap.docs[0]
}

export async function fetchCurrentMonthBudget(uid: string): Promise<Budget | null> {
  if (!uid) return null
  const docSnap = await findBudgetDoc(uid, currentMonthKey())
  if (!docSnap) return null
  const data = docSnap.data()
  return {
    id: docSnap.id,
    amount: typeof data.amount === 'number' ? data.amount : 0,
    spent: typeof data.spent === 'number' ? data.spent : 0,
    month: data.month ?? currentMonthKey(),
  }
}

// Mirrors BudgetService.updateCurrentMonthBudget: sets/creates the current
// month's target amount. `spentIfCreating` backfills `spent` only when a new
// doc is created (e.g. from expenses already logged before a budget was set).
export async function setBudgetAmount(uid: string, amount: number, spentIfCreating: number): Promise<void> {
  const month = currentMonthKey()
  const docSnap = await findBudgetDoc(uid, month)

  if (docSnap) {
    await updateDoc(doc(db, 'budgets', docSnap.id), { amount, updatedAt: serverTimestamp() })
    return
  }

  await addDoc(collection(db, 'budgets'), {
    userId: uid,
    amount,
    spent: spentIfCreating,
    month,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

// Mirrors BudgetService.updateSpent: increments the current month's spent
// counter. No-ops if no budget doc exists for the month yet, same as the app.
export async function incrementBudgetSpent(uid: string, amountToAdd: number): Promise<void> {
  const docSnap = await findBudgetDoc(uid, currentMonthKey())
  if (!docSnap) return
  await updateDoc(doc(db, 'budgets', docSnap.id), {
    spent: increment(amountToAdd),
    updatedAt: serverTimestamp(),
  })
}
