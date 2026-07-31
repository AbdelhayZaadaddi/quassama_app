import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Category } from '@/lib/categories'
import { Group } from '@/lib/groups'
import { incrementBudgetSpent } from '@/lib/budget'

export type Expense = {
  id: string
  name: string
  amount: number
  date: Date | null
  categoryName: string
  categoryColor: string
  categoryIcon: string
  groupId: string
  groupName: string
}

function toExpense(doc: QueryDocumentSnapshot): Expense {
  const data = doc.data()
  const date = data.date instanceof Timestamp ? data.date.toDate() : null
  return {
    id: doc.id,
    name: data.name ?? '',
    amount: typeof data.amount === 'number' ? data.amount : 0,
    date,
    categoryName: data.categoryName ?? '',
    categoryColor: data.categoryColor ?? '#999999',
    categoryIcon: data.categoryIcon ?? '',
    groupId: data.groupId ?? '',
    groupName: data.groupName ?? '',
  }
}

export async function fetchRecentExpenses(uid: string, take = 5): Promise<Expense[]> {
  if (!uid) return []

  const q = query(
    collection(db, 'expenses'),
    where('userId', '==', uid),
    orderBy('date', 'desc'),
    limit(take),
  )

  const snap = await getDocs(q)
  return snap.docs.map(toExpense)
}

export type NewExpense = {
  name: string
  amount: number
  category: Category
  group: Group
}

// Mirrors the mobile app's ExpenseService.createExpense: writes the expense
// (name, amount, categoryId/Name/Icon/Color, groupId/groupName, userId from
// auth, date/createdAt via serverTimestamp), then updates the user's current
// month budget.spent — charging only their share for a 'split' group expense,
// same as the app. Does NOT replicate streak tracking or group push
// notifications, which depend on mobile-only services.
export async function createExpense(uid: string, expense: NewExpense): Promise<void> {
  if (!uid) throw new Error('User not authenticated')

  await addDoc(collection(db, 'expenses'), {
    userId: uid,
    name: expense.name,
    amount: expense.amount,
    categoryId: expense.category.id,
    categoryName: expense.category.name,
    categoryIcon: expense.category.icon,
    categoryColor: expense.category.color,
    groupId: expense.group.id,
    groupName: expense.group.name,
    date: serverTimestamp(),
    createdAt: serverTimestamp(),
  })

  const personalAmount =
    expense.group.type === 'split' && expense.group.memberIds.length > 1
      ? expense.amount / expense.group.memberIds.length
      : expense.amount

  await incrementBudgetSpent(uid, personalAmount)
}

// Full history for analytics (mirrors the mobile app's ExpenseService.getAllExpenses,
// which also combines this where + orderBy — a composite index already exists for it).
export async function fetchAllExpenses(uid: string): Promise<Expense[]> {
  if (!uid) return []

  const q = query(collection(db, 'expenses'), where('userId', '==', uid), orderBy('date', 'desc'))

  const snap = await getDocs(q)
  return snap.docs.map(toExpense)
}
