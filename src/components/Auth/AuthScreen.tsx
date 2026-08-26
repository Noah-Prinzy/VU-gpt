import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { login, signup } from '../../services/auth'
import { useAppStore } from '../../store/useAppStore'
import { CampusBackground } from '../Shell/CampusBackground'
import styles from './AuthScreen.module.css'

type Mode = 'login' | 'signup'

export function AuthScreen() {
  const loginSuccess = useAppStore((s) => s.loginSuccess)

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const session = mode === 'login' ? await login(email, password) : await signup(name, email, password)
      loginSuccess(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      <CampusBackground image="/campus/bg-auth.jpg" focus="center 12%" />
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <img className={styles.crest} src="/campus/vu-wordmark-white.png" alt="Victoria University" />
        <h1>VU Assistant</h1>
        <p className={styles.sub}>Victoria University · Kampala</p>

        <div className={styles.tabs}>
          <button className={mode === 'login' ? styles.tabActive : ''} onClick={() => setMode('login')} type="button">
            Log in
          </button>
          <button className={mode === 'signup' ? styles.tabActive : ''} onClick={() => setMode('signup')} type="button">
            Sign up
          </button>
        </div>

        <form className={styles.form} onSubmit={submit}>
          <AnimatePresence initial={false}>
            {mode === 'signup' && (
              <motion.div
                key="name"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className={styles.field}
              >
                <label htmlFor="name">Full name</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mark..." required />
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@vu.ac.ug"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className={styles.switch}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
