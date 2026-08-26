import { useAppStore } from '../../store/useAppStore'
import styles from './TopBar.module.css'

function greetingWord() {
  const hour = new Date().getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function TopBar() {
  const phase = useAppStore((s) => s.phase)
  const setMenuOpen = useAppStore((s) => s.setMenuOpen)
  const toggleNotifications = useAppStore((s) => s.toggleNotifications)
  const unreadCount = useAppStore((s) => s.notifications.filter((n) => !n.read).length)
  const notificationsLoaded = useAppStore((s) => s.notificationsLoaded)
  const firstName = useAppStore((s) => s.user?.name.split(' ')[0] ?? 'there')
  const voiceEnabled = useAppStore((s) => s.voiceEnabled)
  const toggleVoice = useAppStore((s) => s.toggleVoice)

  return (
    <header className={styles.topbar}>
      <button className={`${styles.iconBtn} icon-btn`} aria-label="Menu" onClick={() => setMenuOpen(true)}>
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {phase === 'idle' && (
        <div className={styles.greeting}>
          <h1>
            {greetingWord()}, {firstName} 👋
          </h1>
          <p>How can I help you today?</p>
        </div>
      )}

      <div className={styles.rightGroup}>
        <button
          className={`${styles.iconBtn} icon-btn`}
          aria-label={voiceEnabled ? 'Mute voice' : 'Unmute voice'}
          aria-pressed={voiceEnabled}
          onClick={toggleVoice}
        >
          {voiceEnabled ? (
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9v6h4l5 4V5L8 9H4z" />
              <path d="M17 8.5a5 5 0 0 1 0 7" />
              <path d="M19.5 6a8.5 8.5 0 0 1 0 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9v6h4l5 4V5L8 9H4z" />
              <path d="M16 9l5 6M21 9l-5 6" />
            </svg>
          )}
        </button>

        <button className={`${styles.iconBtn} icon-btn`} aria-label="Notifications" onClick={toggleNotifications}>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {(unreadCount > 0 || !notificationsLoaded) && <span className={styles.badge} />}
        </button>
      </div>
    </header>
  )
}
