// A tiny non-reactive bridge between the browser's speech synthesis events
// (word boundaries) and AvatarModel's per-frame jaw animation. Plain mutable
// state on purpose, like avatarSlots.ts — this is read inside a useFrame
// loop every frame; routing it through React state would just add
// re-render churn for no benefit.
let amplitude = 0

// STEP 4a: tts.ts calls this every time the browser starts a new word
// (see the onboundary handler in tts.ts). Snapping straight to 1 gives each
// word a sharp "jaw opens now" pulse for AvatarModel's animation loop to pick
// up and smooth out.
export function pulseAmplitude() {
  amplitude = 1
}

export function resetAmplitude() {
  amplitude = 0
}

export function getAmplitude() {
  return amplitude
}

// STEP 4b: called every rendered frame from AvatarModel's animation loop to
// shrink the pulse back toward 0 between words, so the jaw snaps open on a
// word and falls shut again before the next one — that open/close rhythm is
// what reads as "talking" even though there's no real mouth-shape data.
export function decayAmplitude(factor: number) {
  amplitude *= factor
}
