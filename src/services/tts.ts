import { pulseAmplitude, resetAmplitude } from '../components/Avatar/speechAmplitude'

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

let cachedVoice: SpeechSynthesisVoice | null = null
let voicesReady = false

function pickVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  voicesReady = true

  const byName = (re: RegExp) => voices.find((v) => re.test(v.name) && /^en/i.test(v.lang))
  const preferred =
    byName(/aria|jenny|zira|susan|samantha|female|woman/i) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    voices[0]
  return preferred ?? null
}

if (isSpeechSupported()) {
  // Voice list loads asynchronously in most browsers — populate once it's
  // actually available, and eagerly once in case it's already ready.
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedVoice = pickVoice()
  })
  cachedVoice = pickVoice()
}

interface SpeakOptions {
  onEnd?: () => void
}

/** Speaks `text` aloud, cancelling anything already speaking. No-ops
 * silently (still calls onEnd) when the browser doesn't support speech
 * synthesis, so callers never have to branch on support themselves. */
export function speak(text: string, { onEnd }: SpeakOptions = {}) {
  if (!isSpeechSupported()) {
    onEnd?.()
    return
  }

  window.speechSynthesis.cancel()
  resetAmplitude()

  // STEP 2: hand the plain text string straight to the browser's built-in
  // speech engine. No JSON, no network request — this is a direct instruction
  // to the browser ("read this out loud"), not an API call to anywhere.
  const utterance = new SpeechSynthesisUtterance(text)
  if (!voicesReady) cachedVoice = pickVoice()
  if (cachedVoice) utterance.voice = cachedVoice
  utterance.rate = 1.0
  utterance.pitch = 1.08

  // STEP 3: the browser fires this event every time it starts speaking a
  // new word. We don't get real audio data to analyze — just this timing
  // signal — so that's what we use to fake lip movement.
  utterance.onboundary = () => pulseAmplitude()
  utterance.onend = () => {
    resetAmplitude()
    onEnd?.()
  }
  utterance.onerror = () => {
    resetAmplitude()
    onEnd?.()
  }

  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
  resetAmplitude()
}
