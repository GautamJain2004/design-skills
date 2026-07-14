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

/**
 * Whirlpool carousel motion (decoded from the reference engine): media
 * cards are scrubbed by traversal progress D ∈ [−1, +1] (0 at the focus
 * band) — in-plane rotation sweeps with D and the card drifts sideways
 * through mid-traversal, tracing an arc like being stirred. Titles get a
 * transient velocity swirl on top, settling level at rest.
 */
export const WHIRLPOOL = {
  /** deg — media rotation across the traversal: −sweep entering → +sweep
   *  exiting. Rotation crosses 0° at the focus band, so what's visible is
   *  roughly ±0.7·sweep at the window edges — size sweep for THAT. */
  sweep: 24,
  /** px — horizontal orbit radius: the card swings this far LEFT of its
   *  rest position by mid-traversal and returns RIGHT as it rises past.
   *  The rest position itself is inset from the left edge (ScrubCarousel's
   *  media `left`), which is what offsets the ellipse center. */
  driftX: 160,
  /** px — vertical orbit radius. Sized so the card arrives beside its
   *  title as the title colors up (bigger values make the card lag its
   *  title around the focus band, which hides the photo). */
  travelY: 380,
  /** px — extra RIGHTWARD drift through the exit half only: zero until
   *  focus, then the card clears right while fading as the next card takes
   *  its place — the eclipse relay. */
  exitX: 260,
  /** deg — 3D yaw across the traversal (engine: rotationY = 4·D) */
  yaw: 150,
  /** deg — scrubbed skew, the DOM stand-in for the engine's shader twist
   *  (u_twist = D): the card shears as it enters/exits, flat in focus */
  twist: 5,
  /** depth scale at the traversal edges (1 at the focus band) */
  scaleMin: 0.85,
  /** exponent on the depth curve — lower = wider plateau near focus */
  depthEase: 0.6,
  /** zIndex granularity for depth ordering (titles sit above this range) */
  zRange: 100,
  /** traversal window outside which the card is hidden (engine gates
   *  planes to V ∈ [0.15, 0.8]) — keeps at most ~2 cards on screen so
   *  each card's rotation stays legible */
  visibleFrom: 0.12,
  visibleTo: 0.8,
  /** traversal fraction over which the card fades at the window edges */
  fade: 0.05,
  /** deg cap for the transient title swirl */
  maxTilt: 6,
  /** |scroll velocity| (Lenis units) that maps to full title tilt */
  maxVelocity: 25,
  /** s — how fast the title swirl re-targets and settles */
  settle: 0.4,
} as const;

/** Pointer-tracked 3D tilt for media cards (decoded via cursor probe). */
export const CARD_TILT = {
  /** deg of rotateX/rotateY at the card's edges */
  maxDeg: 6,
  /** px translational lean toward the cursor */
  lean: 10,
  perspective: 900,
} as const;

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
