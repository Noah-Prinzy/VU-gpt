import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { TopBar } from './TopBar'
import { StatusCaption } from './StatusCaption'
import { SuggestionOrbit } from './SuggestionOrbit'
import { ResponseProps } from './ResponseProps'
import { Dock } from './Dock'
import { CampusBackground } from './CampusBackground'
import { setSlot } from './avatarSlots'
import styles from './AvatarView.module.css'

const TAP_HINT: Record<string, string> = {
  idle: 'Tap me to talk',
  listening: 'Tap me again to send',
  processing: 'Tap me again to continue',
  responding: 'Tap me again to continue',
}

export function AvatarView() {
  const phase = useAppStore((s) => s.phase)
  const active = useAppStore((s) => s.view === 'avatar')

  return (
    <motion.div
      className={styles.view}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      style={{ pointerEvents: active ? 'auto' : 'none' }}
      aria-hidden={!active}
    >
      <CampusBackground image="/campus/bg-avatar.jpg" focus="center 20%" />
      <TopBar />
      <StatusCaption />

      <div className={styles.stage}>
        <span className={`${styles.ambientFill} ${styles.left}`} aria-hidden="true" />
        <span className={`${styles.ambientFill} ${styles.right}`} aria-hidden="true" />
        <div className={styles.stageInner}>
          <SuggestionOrbit variant="cockpit" />
          <div className={styles.avatarSlot} ref={(el) => setSlot('avatar', el)} />
          <ResponseProps />
        </div>
      </div>

      <SuggestionOrbit variant="strip" />

      <p className={styles.hint}>{TAP_HINT[phase]}</p>

      <Dock />
    </motion.div>
  )
}
