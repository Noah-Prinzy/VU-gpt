import styles from './CrashScreen.module.css'

export function CrashScreen({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1>Something went wrong</h1>
        <p>The app hit an unexpected error. Your session is still there — reloading usually fixes it.</p>
        {import.meta.env.DEV && <pre className={styles.detail}>{error.message}</pre>}
        <button className={styles.retry} onClick={onRetry}>
          Reload
        </button>
      </div>
    </div>
  )
}
