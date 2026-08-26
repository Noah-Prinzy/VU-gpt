import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import styles from './MenuDrawer.module.css'

const FAQ = [
  { q: 'How does voice mode work?', a: 'Tap the avatar to start listening, tap it again to send. Tap once more to continue.' },
  { q: 'Can I switch between voice and text?', a: 'Yes — use the "Text mode" pill any time, or the mic icon inside chat to jump back to voice.' },
  { q: 'Is my data saved?', a: "This is a demo build — nothing is persisted once you close the tab." },
]

export function MenuDrawer() {
  const menuOpen = useAppStore((s) => s.menuOpen)
  const setMenuOpen = useAppStore((s) => s.setMenuOpen)
  const ask = useAppStore((s) => s.ask)
  const setView = useAppStore((s) => s.setView)
  const toggleNotifications = useAppStore((s) => s.toggleNotifications)
  const logout = useAppStore((s) => s.logout)
  const user = useAppStore((s) => s.user)

  const [faqOpen, setFaqOpen] = useState(false)

  const close = () => setMenuOpen(false)

  return (
    <AnimatePresence>
      {menuOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
          />
          <motion.aside
            className={styles.drawer}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.profile}>
              <span className={styles.avatarDot}>{(user?.name ?? '?').charAt(0).toUpperCase()}</span>
              <div>
                <h2>{user?.name ?? 'Guest'}</h2>
                <p>VU Student</p>
              </div>
            </div>

            <nav className={styles.nav}>
              <button
                className={styles.item}
                onClick={() => {
                  ask("What's my schedule tomorrow?")
                  setView('chat')
                  close()
                }}
              >
                <span>🗓️</span> My Schedule
              </button>
              <button
                className={styles.item}
                onClick={() => {
                  toggleNotifications()
                  close()
                }}
              >
                <span>🔔</span> Notifications
              </button>
              <button className={styles.item} onClick={() => setFaqOpen((v) => !v)}>
                <span>❓</span> Help &amp; FAQ
                <span className={`${styles.chevron} ${faqOpen ? styles.chevronOpen : ''}`}>⌄</span>
              </button>
              <AnimatePresence>
                {faqOpen && (
                  <motion.div
                    className={styles.faq}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {FAQ.map((f) => (
                      <div key={f.q} className={styles.faqItem}>
                        <p className={styles.faqQ}>{f.q}</p>
                        <p className={styles.faqA}>{f.a}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <button className={`${styles.item} ${styles.signOut}`} onClick={logout}>
                <span>🚪</span> Sign out
              </button>
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
