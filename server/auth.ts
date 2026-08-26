import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

interface StoredUser {
  name: string
  email: string
  passwordHash: string
  salt: string
}

// In-memory only, like the rest of this "simple backend for testing" — a
// server restart forgets every account. Fine for a prototype; swap for a
// real users table (and a real hashing library) before this goes anywhere
// near production.
const users = new Map<string, StoredUser>()
const sessions = new Map<string, string>() // token -> email

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex')
}

export function signup(name: string, email: string, password: string) {
  const key = email.trim().toLowerCase()
  if (users.has(key)) return { error: 'An account with that email already exists.' as const }

  const salt = randomBytes(16).toString('hex')
  const passwordHash = hashPassword(password, salt)
  users.set(key, { name: name.trim(), email: key, passwordHash, salt })
  return { user: { name: name.trim(), email: key } }
}

export function login(email: string, password: string) {
  const key = email.trim().toLowerCase()
  const user = users.get(key)
  if (!user) return { error: 'No account with that email.' as const }

  const attempt = Buffer.from(hashPassword(password, user.salt), 'hex')
  const stored = Buffer.from(user.passwordHash, 'hex')
  if (attempt.length !== stored.length || !timingSafeEqual(attempt, stored)) {
    return { error: 'Incorrect password.' as const }
  }
  return { user: { name: user.name, email: user.email } }
}

export function createSession(email: string) {
  const token = randomBytes(24).toString('hex')
  sessions.set(token, email)
  return token
}

export function getSessionUser(token: string | undefined) {
  if (!token) return null
  const email = sessions.get(token)
  if (!email) return null
  const user = users.get(email)
  return user ? { name: user.name, email: user.email } : null
}
