import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { speak } from '../../services/tts'
import styles from './IntroOverlay.module.css'

// A floor under how long each step stays up, so a step never flashes by
// faster than it can be read even if speech synthesis is unsupported or
// finishes instantly. The real pacing comes from her actually finishing
// the line — see the effect below.
const MIN_STEP_MS = 1800
// A ceiling, independent of the floor above: some browsers/voices never
// fire the utterance's `onend` at all (confirmed happening in this exact
// setup) — without this, a step that never hears back from speech
// synthesis would leave the intro stuck forever.
const MAX_STEP_MS = 9000

export function IntroOverlay() {
  const introActive = useAppStore((s) => s.introActive && s.view === 'avatar')
  const completeIntro = useAppStore((s) => s.completeIntro)
  const voiceEnabled = useAppStore((s) => s.voiceEnabled)
  const firstName = useAppStore((s) => s.user?.name.split(' ')[0] ?? 'there')

  const steps = [
    { title: `Hi ${firstName}, welcome to VU Assistant 👋`, body: "I'm your campus companion — here to help you move through university life a little more easily." },
    { title: 'Ask me anything', body: 'Your schedule, assignments, grades, library hours, or what\'s on around campus — just ask.' },
    { title: 'Talk or type', body: 'Tap me to speak, tap again to send. Or switch to Text mode any time for a full chat.' },
  ]

  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!introActive) return
    const line = `${steps[step].title.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')}. ${steps[step].body}`

    if (step >= steps.length - 1) {
      if (voiceEnabled) speak(line)
      return
    }

    let minElapsed = false
    let spoken = false
    let advanced = false
    const tryAdvance = () => {
      if (advanced || !minElapsed || !spoken) return
      advanced = true
      setStep((s) => s + 1)
    }

    const minTimer = setTimeout(() => {
      minElapsed = true
      tryAdvance()
    }, MIN_STEP_MS)

    // Independent of onEnd — guarantees forward progress even if speech
    // synthesis never calls back (see MAX_STEP_MS above).
    const maxTimer = setTimeout(() => {
      spoken = true
      tryAdvance()
    }, MAX_STEP_MS)

    if (voiceEnabled) {
      speak(line, {
        onEnd: () => {
          spoken = true
          tryAdvance()
        },
      })
    } else {
      spoken = true
    }

    return () => {
      advanced = true
      clearTimeout(minTimer)
      clearTimeout(maxTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introActive, step, voiceEnabled])

  if (!introActive) return null

  const isLast = step === steps.length - 1

  return (
    <div className={styles.overlay}>
      {/* No opacity/transform animation here on purpose (framer-motion or
          plain CSS keyframes both do it) — verified empirically that an
          animated element positioned over the avatar canvas fails to
          composite above it in this rendering setup, animation library
          notwithstanding. `key` still forces a clean remount on step
          change. */}
      <div key={step} className={styles.caption}>
        <h2>{steps[step].title}</h2>
        <p>{steps[step].body}</p>
      </div>

      <div className={styles.progress}>
        {steps.map((_, i) => (
          <span key={i} className={i <= step ? styles.dotActive : styles.dot} />
        ))}
      </div>

      <div className={styles.actions}>
        <button className={styles.skip} onClick={completeIntro}>
          Skip intro
        </button>
        {isLast && (
          <button className={styles.done} onClick={completeIntro}>
            Let's go
          </button>
        )}
      </div>
    </div>
  )
}
