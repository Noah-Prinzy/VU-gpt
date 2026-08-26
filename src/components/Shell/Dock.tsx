import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import styles from './Dock.module.css'

export function Dock() {
  const phase = useAppStore((s) => s.phase)
  const tapAvatar = useAppStore((s) => s.tapAvatar)
  const setView = useAppStore((s) => s.setView)
  const reduceMotion = useReducedMotion()

  return (
    <footer className={styles.dock}>
      <button
        className={`${styles.gridBtn} icon-btn`}
        aria-label="Reset"
        onClick={() => useAppStore.setState({ phase: 'idle' })}
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </button>

      <button className={`${styles.textMode} btn-pill`} onClick={() => setView('chat')}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        Text mode
      </button>

      <button
        className={`${styles.micBtn} ${phase === 'listening' ? styles.live : ''}`}
        aria-label="Talk"
        disabled={phase === 'processing'}
        onClick={tapAvatar}
      >
        <AnimatePresence mode="wait" initial={false}>
          {phase === 'listening' ? (
            <motion.svg
              key="wave"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              transition={{ duration: reduceMotion ? 0.1 : 0.18 }}
            >
              <path d="M4 12h3l3 7 4-14 3 7h3" />
            </motion.svg>
          ) : (
            <motion.svg
              key="mic"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              transition={{ duration: reduceMotion ? 0.1 : 0.18 }}
            >
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>
    </footer>
  )
}
