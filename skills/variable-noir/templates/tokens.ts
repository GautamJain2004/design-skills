/**
 * variable-noir design tokens — the single source of truth.
 *
 * Every animation/style value in this skill's templates reads from here.
 * Never hand-roll durations, eases, or colors in components; import them.
 *
 * Values were extracted from a reference site's computed styles and the
 * behavior of its animation engine, then mapped to GSAP/Lenis idioms.
 */

/** House ease: easeOutCubic. GSAP's power2.out is the identical curve 1-(1-t)^3. */
export const EASE = 'power2.out';

/** Same curve for CSS transitions. */
export const EASE_CSS = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

/** Duration ladder (seconds). `md` is the default for everything unspecified. */
export const DURATION = {
  /** micro: hover color/underline flips */
  xs: 0.15,
  /** small UI: icons, chips, small fades */
  sm: 0.3,
  /** default: reveals, fades, transitions */
  md: 0.5,
  /** hero: masked text, large media, page wipes */
  lg: 0.8,
} as const;

/**
 * Relative offset between siblings in a stagger timeline (seconds).
 * Each child starts STAGGER after the previous one STARTS (position "<0.1"),
 * so tweens overlap into a wave. Use 0.05 for dense text (many lines/items).
 */
export const STAGGER = 0.1;

/** Scroll-reveal defaults. */
export const REVEAL = {
  /** px rise while fading in */
  y: 24,
  /** ScrollTrigger start position */
  start: 'top 85%',
} as const;

/**
 * Lenis damped-lerp factor. Lenis applies it frame-rate independently
 * (equivalent to lerp(a, b, 1 - exp(-lambda * dt)) internally).
 */
export const LENIS = {
  lerp: 0.1,
} as const;

/** Damped cursor follow — quickTo with the house ease reads as exp-damping. */
export const CURSOR = {
  duration: 0.5,
  size: 12,
  hoverScale: 2.5,
} as const;

/** Scroll-scrubbed work carousel (decoded from 30fps video forensics). */
export const CAROUSEL = {
  /** deg — media card base tilt, constant during travel; sign alternates per item */
  tilt: 8,
  /** yPercent ± extra travel for media vs natural scroll — cards sweep past titles */
  parallax: 25,
} as const;

/** Palette (dark cinematic). */
export const COLORS = {
  /** page background — lives on <html>, body stays transparent */
  background: '#1d1d1d',
  /** primary text (soft white, never pure) */
  text: '#dddddd',
  /** reserved for emphasis only */
  white: '#ffffff',
  /** accent: signal orange */
  accentOrange: '#fe5d2f',
  /** accent: violet */
  accentViolet: '#8885f9',
  /** carousel titles after they exit the focus band (estimated from video) */
  accentFaded: '#e8b4a8',
} as const;

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
