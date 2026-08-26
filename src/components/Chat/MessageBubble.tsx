import { motion, useReducedMotion } from 'framer-motion'
import type { ChatMessage } from '../../types'
import { ScheduleCard } from './ScheduleCard'
import styles from './MessageBubble.module.css'

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={`${styles.row} ${isUser ? styles.userRow : styles.botRow}`}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: [0.22, 1.4, 0.4, 1] }}
    >
      {!isUser && <span className={styles.avatarDot}>U</span>}
      <div>
        <div className={`${styles.bubble} ${isUser ? styles.user : `${styles.bot} ${styles.reveal}`}`}>
          {message.text}
          {message.schedule && <ScheduleCard items={message.schedule} />}
        </div>
        <span className={`${styles.time} ${isUser ? styles.timeRight : ''}`}>
          {message.time}
          {isUser && <span className={styles.tick}>✓✓</span>}
        </span>
      </div>
    </motion.div>
  )
}
