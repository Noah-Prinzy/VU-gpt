import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import styles from './ResponseProps.module.css'

export function ResponseProps() {
  const phase = useAppStore((s) => s.phase)
  const lastExchange = useAppStore((s) => s.lastExchange)
  const reduceMotion = useReducedMotion()

  return (
    <div className={styles.props}>
      <AnimatePresence>
        {phase === 'responding' && lastExchange && (
          <>
            <motion.div
              key="user"
              className={`${styles.bubble} ${styles.user}`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.4, ease: [0.22, 1.4, 0.4, 1] }}
            >
              {lastExchange.userText}
            </motion.div>
            <motion.div
              key="bot"
              className={`${styles.bubble} ${styles.bot}`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.4, delay: reduceMotion ? 0 : 0.15, ease: [0.22, 1.4, 0.4, 1] }}
            >
              {lastExchange.botText}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
