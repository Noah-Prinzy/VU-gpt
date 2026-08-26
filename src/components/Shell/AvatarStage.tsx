import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Avatar } from '../Avatar/Avatar'
import { useAppStore } from '../../store/useAppStore'
import { getSlot } from './avatarSlots'
import styles from './AvatarStage.module.css'

/**
 * The single, permanently-mounted <Avatar/> canvas. It never unmounts
 * across the app — instead this portals the SAME canvas into whichever DOM
 * "slot" should currently host it (the big avatar-view stage, or the small
 * chat-header badge). A sibling element with a CSS "hole" cut into it does
 * NOT reliably reveal a WebGL canvas underneath in this rendering setup —
 * verified empirically, not assumed — so the canvas has to actually become
 * a DOM child of the active slot rather than being visually overlaid on
 * top of it. AvatarModel does the matching camera dolly (knee-to-head crop
 * -> tight face crop) so it still reads as "becoming" the badge photo.
 */
export function AvatarStage() {
  const view = useAppStore((s) => s.view)
  const phase = useAppStore((s) => s.phase)
  const tapAvatar = useAppStore((s) => s.tapAvatar)
  const setView = useAppStore((s) => s.setView)
  const [target, setTarget] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    // Slot refs attach during the commit that just happened — read them
    // post-commit, not at render time. Deferred a tick so the setState
    // here isn't synchronous within the effect body.
    const raf = requestAnimationFrame(() => {
      setTarget(getSlot(view === 'avatar' ? 'avatar' : 'badge'))
    })
    return () => cancelAnimationFrame(raf)
  }, [view])

  if (!target) return null

  const handleActivate = () => {
    if (view === 'avatar') {
      if (phase !== 'processing') tapAvatar()
    } else {
      setView('avatar')
    }
  }

  return createPortal(
    <div
      className={styles.stage}
      role="button"
      tabIndex={0}
      aria-label={view === 'avatar' ? 'Talk to the assistant' : 'Back to avatar'}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleActivate()
        }
      }}
    >
      {view === 'avatar' && (
        <>
          <span className={`${styles.haze} ${phase !== 'idle' ? styles.dimmed : ''}`} aria-hidden="true" />
          <span className={`${styles.halo} ${phase === 'listening' ? styles.active : ''}`} />
          <span className={`${styles.halo} ${styles.r2} ${phase === 'listening' ? styles.active : ''}`} />
          <span className={`${styles.halo} ${styles.r3} ${phase === 'listening' ? styles.active : ''}`} />
          <span className={`${styles.processingRing} ${phase === 'processing' ? styles.active : ''}`} aria-hidden="true" />
          <span className={`${styles.respondingPulse} ${phase === 'responding' ? styles.active : ''}`} aria-hidden="true" />
        </>
      )}
      <Avatar />
    </div>,
    target,
  )
}
