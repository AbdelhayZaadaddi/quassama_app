import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type Group = {
  id: string
  name: string
  currency: string
  type: string
  adminId: string
  memberIds: string[]
  allowMemberInvite: boolean
  notifyExpenses: boolean
  updatedAt: Date | null
}

export async function fetchUserGroups(uid: string): Promise<Group[]> {
  if (!uid) return []

  const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid))

  const snap = await getDocs(q)
  const groups = snap.docs.map((doc) => {
    const data = doc.data()
    const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null
    return {
      id: doc.id,
      name: data.name ?? '',
      currency: data.currency ?? '',
      type: data.type ?? '',
      adminId: data.adminId ?? '',
      memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
      allowMemberInvite: !!data.allowMemberInvite,
      notifyExpenses: !!data.notifyExpenses,
      updatedAt,
    }
  })

  return groups.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
}
