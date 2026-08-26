import type { AppNotification } from '../types'
import { API_URL } from './api'

const FALLBACK_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'Assignment due soon', body: 'Database Systems ER-diagram report is due Friday, 11:59 PM.', time: '2h ago', read: false },
  { id: 'n2', title: 'New campus event', body: "Tech Society's demo night was just added for Wednesday.", time: '5h ago', read: false },
  { id: 'n3', title: 'Grade posted', body: 'Your Data Structures midterm result is now available.', time: '1d ago', read: false },
]

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  try {
    return await promise
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  try {
    const res = await withTimeout(fetch(`${API_URL}/api/notifications`), 4000)
    if (!res.ok) throw new Error(`notifications API responded ${res.status}`)
    const data = (await res.json()) as { notifications: AppNotification[] }
    return data.notifications
  } catch {
    return FALLBACK_NOTIFICATIONS
  }
}

export async function markNotificationsRead(): Promise<AppNotification[]> {
  try {
    const res = await withTimeout(fetch(`${API_URL}/api/notifications/read`, { method: 'POST' }), 4000)
    if (!res.ok) throw new Error(`notifications API responded ${res.status}`)
    const data = (await res.json()) as { notifications: AppNotification[] }
    return data.notifications
  } catch {
    return FALLBACK_NOTIFICATIONS.map((n) => ({ ...n, read: true }))
  }
}
