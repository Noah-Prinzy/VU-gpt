import express from 'express'
import cors from 'cors'
import { answerFor } from './knowledge'
import { createSession, getSessionUser, login, signup } from './auth'

const PORT = Number(process.env.PORT ?? 8787)

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body ?? {}
  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email, and password are required' })
    return
  }
  const result = signup(name, email, password)
  if ('error' in result) {
    res.status(409).json(result)
    return
  }
  res.json({ token: createSession(result.user.email), user: result.user })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' })
    return
  }
  const result = login(email, password)
  if ('error' in result) {
    res.status(401).json(result)
    return
  }
  res.json({ token: createSession(result.user.email), user: result.user })
})

app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined
  const user = getSessionUser(token)
  if (!user) {
    res.status(401).json({ error: 'invalid session' })
    return
  }
  res.json({ user })
})

app.post('/api/chat', (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message : ''
  if (!message.trim()) {
    res.status(400).json({ error: 'message is required' })
    return
  }
  const reply = answerFor(message)
  res.json(reply)
})

interface Notification {
  id: string
  title: string
  body: string
  time: string
  read: boolean
}

// In-memory only — this is a "simple backend for testing," not a persisted
// store. Restarting the server resets it.
const notifications: Notification[] = [
  { id: 'n1', title: 'Assignment due soon', body: 'Database Systems ER-diagram report is due Friday, 11:59 PM.', time: '2h ago', read: false },
  { id: 'n2', title: 'New campus event', body: "Tech Society's demo night was just added for Wednesday.", time: '5h ago', read: false },
  { id: 'n3', title: 'Grade posted', body: 'Your Data Structures midterm result is now available.', time: '1d ago', read: false },
]

app.get('/api/notifications', (_req, res) => {
  res.json({ notifications })
})

app.post('/api/notifications/read', (_req, res) => {
  notifications.forEach((n) => (n.read = true))
  res.json({ notifications })
})

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
})
