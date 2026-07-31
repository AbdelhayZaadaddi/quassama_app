import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type SavingDay = {
  dayNumber: number
  amount: number
  isSaved: boolean
  savedAt?: string
}

export type SavingGoal = {
  id: string
  name: string
  icon: string
  targetAmount: number
  numberOfDays: number
  status: 'active' | 'completed'
  days: SavingDay[]
  createdAt: string
}

export async function fetchUserSavingGoals(uid: string): Promise<SavingGoal[]> {
  if (!uid) return []

  const q = query(collection(db, 'savingGoals'), where('userId', '==', uid))

  const snap = await getDocs(q)
  const goals = snap.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name ?? '',
      icon: data.icon ?? 'wallet',
      targetAmount: typeof data.targetAmount === 'number' ? data.targetAmount : 0,
      numberOfDays: typeof data.numberOfDays === 'number' ? data.numberOfDays : 0,
      status: data.status === 'completed' ? 'completed' : 'active',
      days: Array.isArray(data.days) ? data.days : [],
      createdAt: data.createdAt ?? '',
    } satisfies SavingGoal
  })

  return goals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function savedAmount(goal: SavingGoal): number {
  return goal.days.filter((d) => d.isSaved).reduce((sum, d) => sum + d.amount, 0)
}

// Mirrors SavingGoalService.generateAmounts exactly: weights 1..n scaled to sum
// to targetAmount, min 1 per day, remainder absorbed by the last day, then a
// correction loop nudges the largest entries until the sum matches exactly.
// Result is sorted ascending (day order is by amount, not chronology).
function generateAmounts(targetAmount: number, numberOfDays: number): number[] {
  const amounts = new Array(numberOfDays).fill(0)
  let sum = 0

  for (let i = 1; i <= numberOfDays; i++) {
    amounts[i - 1] = i
    sum += i
  }

  const scale = targetAmount / sum
  let runningTotal = 0

  for (let i = 0; i < numberOfDays - 1; i++) {
    amounts[i] = Math.max(1, Math.round(amounts[i] * scale))
    runningTotal += amounts[i]
  }

  amounts[numberOfDays - 1] = targetAmount - runningTotal

  for (let i = 0; i < numberOfDays; i++) {
    if (amounts[i] < 1) amounts[i] = 1
  }

  let currentSum = amounts.reduce((a, b) => a + b, 0)
  while (currentSum !== targetAmount) {
    if (currentSum < targetAmount) {
      amounts[amounts.length - 1]++
      currentSum++
    } else {
      const maxIdx = amounts.indexOf(Math.max(...amounts))
      if (amounts[maxIdx] > 1) {
        amounts[maxIdx]--
        currentSum--
      } else {
        break
      }
    }
  }

  return amounts.sort((a, b) => a - b)
}

// Mirrors SavingGoalService.createGoal.
export async function createSavingGoal(
  uid: string,
  targetAmount: number,
  numberOfDays: number,
  name?: string,
  icon?: string,
): Promise<void> {
  const amounts = generateAmounts(targetAmount, numberOfDays)
  const days: SavingDay[] = amounts.map((amt, idx) => ({
    dayNumber: idx + 1,
    amount: amt,
    isSaved: false,
  }))

  const newRef = doc(collection(db, 'savingGoals'))
  const now = new Date().toISOString()
  const newGoal: Record<string, unknown> = {
    id: newRef.id,
    userId: uid,
    targetAmount,
    numberOfDays,
    status: 'active',
    days,
    createdAt: now,
    startDate: now,
  }

  const trimmedName = name?.trim()
  if (trimmedName) newGoal.name = trimmedName
  if (icon) newGoal.icon = icon

  await setDoc(newRef, newGoal)
}

// Mirrors SavingGoalService.toggleDayStatus.
export async function toggleSavingGoalDay(goal: SavingGoal, dayIndex: number, isSaved: boolean): Promise<void> {
  const newDays = [...goal.days]
  const updatedDay: SavingDay = { ...newDays[dayIndex], isSaved }
  if (isSaved) {
    updatedDay.savedAt = new Date().toISOString()
  } else {
    delete updatedDay.savedAt
  }
  newDays[dayIndex] = updatedDay

  const allSaved = newDays.every((d) => d.isSaved)
  const status = allSaved ? 'completed' : 'active'

  await updateDoc(doc(db, 'savingGoals', goal.id), {
    days: newDays,
    status,
    updatedAt: new Date().toISOString(),
  })
}

// Mirrors SavingGoalService.deleteGoal.
export async function deleteSavingGoal(goalId: string): Promise<void> {
  await deleteDoc(doc(db, 'savingGoals', goalId))
}
