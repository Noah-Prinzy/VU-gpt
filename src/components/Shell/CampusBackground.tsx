import styles from './CampusBackground.module.css'

interface CampusBackgroundProps {
  image: string
  /** Anchors which part of the photo stays in frame on narrow crops. */
  focus?: string
}

/**
 * A real Victoria University photo, treated so it reads as texture/mood
 * rather than a literal photo of identifiable people: desaturated, dimmed,
 * blurred at the edges, and tinted with a red-to-blue duotone instead of
 * shown at natural color. Red/blue live here as an accent wash, not as a
 * flat gradient standing in for a background.
 */
export function CampusBackground({ image, focus = 'center' }: CampusBackgroundProps) {
  return (
    <div className={styles.bg}>
      <div className={styles.photo} style={{ backgroundImage: `url(${image})`, backgroundPosition: focus }} />
      <div className={styles.duotone} />
      <div className={styles.scrim} />
      <div className={styles.grain} />
    </div>
  )
}
