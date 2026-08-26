import type { ScheduleItem } from '../../types'
import styles from './ScheduleCard.module.css'

export function ScheduleCard({ items }: { items: ScheduleItem[] }) {
  return (
    <div className={styles.card}>
      {items.map((item) => (
        <div key={item.title} className={styles.row}>
          <span className={styles.icon}>{item.icon}</span>
          <div className={styles.info}>
            <span className={styles.title}>{item.title}</span>
            <span className={styles.time}>{item.time}</span>
            <span className={styles.location}>{item.location}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
