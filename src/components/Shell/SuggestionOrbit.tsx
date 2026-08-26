import type { CSSProperties } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SUGGESTIONS } from '../../data/knowledge'
import { useAppStore } from '../../store/useAppStore'
import { useViewportTier } from '../../hooks/useMediaQuery'
import styles from './SuggestionOrbit.module.css'

// Desktop "cockpit" scatter — kept from the original layout, it spreads out
// naturally once AvatarView's .stageInner widens on desktop.
const POSITIONS: CSSProperties[] = [
  { top: '6%', left: '5%' },
  { top: '10%', right: '5%' },
  { top: '46%', left: '2%' },
  { top: '42%', right: '2%' },
  { top: '80%', left: '5%' },
  { top: '78%', right: '5%' },
]

// Alternating near/mid/far so no two adjacent nodes share a depth tier —
// reads as scattered depth rather than banded rings. Values here mirror
// tokens.css's --depth-*-scale/opacity (kept in JS since Framer Motion's
// animate prop can't read CSS custom properties, and inline-styling scale/
// opacity through Framer means a CSS class can't also set them without the
// two fighting over the same DOM style properties each frame).
const DEPTH_TIER: Array<'near' | 'mid' | 'far'> = ['near', 'mid', 'far', 'mid', 'near', 'far']
const TIER_VALUES: Record<'near' | 'mid' | 'far', { scale: number; opacity: number }> = {
  near: { scale: 1, opacity: 1 },
  mid: { scale: 0.88, opacity: 0.86 },
  far: { scale: 0.76, opacity: 0.64 },
}

const TABLET_COUNT = 4

function arcPosition(index: number, count: number): CSSProperties {
  const t = count === 1 ? 0.5 : index / (count - 1)
  const angleDeg = -60 + t * 120
  const angleRad = (angleDeg * Math.PI) / 180
  const cx = 50
  const cy = 40
  const rx = 44
  const ry = 32
  const left = cx + rx * Math.sin(angleRad)
  const top = cy - ry * Math.cos(angleRad)
  return { left: `${left}%`, top: `${top}%` }
}

interface SuggestionOrbitProps {
  /** "cockpit" renders the desktop/tablet spatial layouts inside the avatar
   * stage; "strip" renders the mobile horizontal chip strip as a flex
   * sibling of the dock. Each instance renders null outside its tier so the
   * mobile strip can never overlap the dock (it occupies real flex space
   * instead of guessing the dock's height to position itself over the stage). */
  variant: 'cockpit' | 'strip'
}

export function SuggestionOrbit({ variant }: SuggestionOrbitProps) {
  const phase = useAppStore((s) => s.phase)
  const ask = useAppStore((s) => s.ask)
  const tier = useViewportTier()
  const reduceMotion = useReducedMotion()

  const isCockpit = variant === 'cockpit' && tier !== 'mobile'
  const isStrip = variant === 'strip' && tier === 'mobile'
  if (!isCockpit && !isStrip) return null

  if (isStrip) {
    return (
      <div className={styles.chipStrip}>
        <AnimatePresence>
          {phase === 'idle' && (
            <motion.div
              className={styles.chipTrack}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {SUGGESTIONS.map((s) => (
                <button key={s.label} className={styles.chip} onClick={() => ask(s.prompt)}>
                  <span className={styles.icon}>{s.icon}</span>
                  <span className={styles.label}>{s.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const items = tier === 'tablet' ? SUGGESTIONS.slice(0, TABLET_COUNT) : SUGGESTIONS

  return (
    <div className={styles.orbit}>
      <AnimatePresence>
        {phase === 'idle' &&
          items.map((s, i) => {
            const tierName = tier === 'desktop' ? DEPTH_TIER[i] : 'near'
            const rest = TIER_VALUES[tierName]
            const position = tier === 'tablet' ? arcPosition(i, items.length) : POSITIONS[i]
            const restState = reduceMotion ? { opacity: 1, scale: 1 } : { opacity: rest.opacity, scale: rest.scale }
            return (
              <motion.button
                key={s.label}
                className={`${styles.pill} ${tier === 'desktop' ? styles[`tier${tierName[0].toUpperCase()}${tierName.slice(1)}`] : ''}`}
                style={position}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={restState}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.35, delay: reduceMotion ? 0 : i * 0.05, ease: [0.22, 1.4, 0.4, 1] }}
                whileHover={{ y: -2, opacity: 1, scale: Math.max(rest.scale, 0.96) }}
                whileTap={{ scale: rest.scale * 0.95 }}
                onClick={() => ask(s.prompt)}
              >
                <span className={styles.icon}>{s.icon}</span>
                <span className={styles.label}>{s.label}</span>
              </motion.button>
            )
          })}
      </AnimatePresence>
    </div>
  )
}
