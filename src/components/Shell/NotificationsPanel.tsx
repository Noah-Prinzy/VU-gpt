import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import styles from './NotificationsPanel.module.css'

export function NotificationsPanel() {
  const open = useAppStore((s) => s.notificationsOpen)
  const notifications = useAppStore((s) => s.notifications)
  const toggle = useAppStore((s) => s.toggleNotifications)
  const markAllRead = useAppStore((s) => s.markAllNotificationsRead)

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className={styles.backdrop} onClick={toggle} />
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1.4, 0.4, 1] }}
          >
            <header className={styles.header}>
              <h3>Notifications</h3>
              <button onClick={markAllRead}>Mark all as read</button>
            </header>
            <div className={styles.list}>
              {notifications.length === 0 && <p className={styles.empty}>Loading…</p>}
              {notifications.map((n) => (
                <div key={n.id} className={styles.row}>
                  {!n.read && <span className={styles.dot} />}
                  <div className={n.read ? styles.readBody : ''}>
                    <p className={styles.title}>{n.title}</p>
                    <p className={styles.body}>{n.body}</p>
                    <span className={styles.time}>{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
