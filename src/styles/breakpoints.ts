/**
 * Single source of truth for viewport-tier breakpoints. CSS media queries
 * can't read these (no CSS custom-media support in this build), so any
 * `.module.css` media query using these numbers must hardcode them and
 * carry a `/* keep in sync with breakpoints.ts *\/` comment.
 */
export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1200,
} as const

export type ViewportTier = 'mobile' | 'tablet' | 'desktop'
