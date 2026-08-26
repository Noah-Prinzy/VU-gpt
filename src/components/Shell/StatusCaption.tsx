import { useAppStore } from '../../store/useAppStore'
import styles from './StatusCaption.module.css'

export function StatusCaption() {
  const phase = useAppStore((s) => s.phase)

  if (phase === 'listening') {
    return (
      <div className={`${styles.status} ${styles.listening}`}>
        <h2>I&apos;m listening…</h2>
        <p>Speak now</p>
      </div>
    )
  }

  if (phase === 'processing') {
    return (
      <div className={`${styles.status} ${styles.processing}`}>
        <h2>
          Let me think…
          <span className={styles.dots}>
            <span />
            <span />
            <span />
          </span>
        </h2>
      </div>
    )
  }

  return null
}
