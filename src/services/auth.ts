import { API_URL } from './api'

export interface AuthUser {
  name: string
  email: string
}

export interface Session {
  token: string
  user: AuthUser
}

const SESSION_KEY = 'vu-gpt:session'

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveSession(session: Session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // localStorage unavailable (private mode, etc.) — session just won't
    // persist across reloads; the app still works for this tab.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* see saveSession */
  }
}

async function postJSON(path: string, body: unknown): Promise<Session> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.')
  return data as Session
}

export function signup(name: string, email: string, password: string) {
  return postJSON('/api/auth/signup', { name, email, password })
}

export function login(email: string, password: string) {
  return postJSON('/api/auth/login', { email, password })
}

/**
 * Returns false only when the backend explicitly rejects the token (401).
 * Any other failure (backend not running, network blip) is treated as
 * "keep the cached session" — a locally stored login shouldn't be thrown
 * away just because the API happens to be unreachable right now.
 */
export async function isSessionValid(session: Session): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
    return res.status !== 401
  } catch {
    return true
  }
}

function introKey(email: string) {
  return `vu-gpt:introSeen:${email.toLowerCase()}`
}

export function hasSeenIntro(email: string): boolean {
  try {
    return localStorage.getItem(introKey(email)) === 'true'
  } catch {
    return false
  }
}

export function markIntroSeen(email: string) {
  try {
    localStorage.setItem(introKey(email), 'true')
  } catch {
    /* see saveSession */
  }
}
