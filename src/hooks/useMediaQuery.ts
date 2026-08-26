import { useCallback, useSyncExternalStore } from 'react'
import { BREAKPOINTS, type ViewportTier } from '../styles/breakpoints'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

/** Derives the current mobile/tablet/desktop tier from the shared breakpoints. */
export function useViewportTier(): ViewportTier {
  const isTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`)
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.desktop}px)`)
  return isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile'
}
