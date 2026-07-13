# variable-noir — motion system

The reference site runs a custom animation engine. This skill ports its
*behavior* to GSAP + Lenis (no code was carried over). Every value below was
verified against the site's stylesheet and engine bundle.

## The one ease

Everything uses **easeOutCubic** — `1 − (1 − t)³`:

- GSAP: `ease: 'power2.out'` (identical curve, analytic)
- CSS: `cubic-bezier(0.215, 0.61, 0.355, 1)`

No springs, no bounces, no easeInOut. Fast start, long soft landing —
this is most of the "expensive" feel.

## Duration ladder

| Token | Seconds | Used for |
| --- | --- | --- |
| `xs` | 0.15 | hover color/underline flips |
| `sm` | 0.30 | small UI: icons, chips |
| `md` | 0.50 | **default** — reveals, fades, page wipes (engine default was 500ms) |
| `lg` | 0.80 | hero: masked text, large media |

## Translation table: their engine → GSAP/Lenis

| Observed behavior (verified) | GSAP/Lenis port | Template |
| --- | --- | --- |
| `easeOutCubic` house ease, engine-wide | `ease: 'power2.out'` from `tokens.ts` | all |
| Default tween duration 500ms; 150/300/500/800ms ladder; 800ms hero moments | `DURATION.xs/sm/md/lg` | all |
| Timeline staggers with relative offsets (`offset: -1` = start with previous, `-0.85` ≈ 15% in, `-0.2` ≈ 80% in); dense-text stagger 0.05s | Timeline position params: `"<"`, `"<15%"`, `"-=20%"`. Sibling default `STAGGER = 0.1`, use `0.05` for dense text | `StaggerGroup` |
| Masked line reveal: per-line overflow-hidden wrapper, inner element rises from `translateY(100%)` | `SplitText.create({ type: 'lines', mask: 'lines', autoSplit: true })` + `gsap.from(lines, { yPercent: 100 })` | `MaskedTextReveal` |
| Scroll reveals: elements start at opacity 0, `.is-active` class toggled in view | `ScrollTrigger` + `gsap.from({ opacity: 0, y: 24 })`, `start: 'top 85%'`, `once: true` | `ScrollReveal` |
| Smooth scroll: damped lerp `lerp(a, b, 1 − exp(−λ·dt))` (frame-rate independent) | Lenis with `lerp: 0.1` — Lenis applies the same exponential damping internally; wired to ScrollTrigger via `gsap.ticker` | `SmoothScrollProvider` |
| Cursor follow: same damped lerp; cursor grows to a "link" state over anchors | `gsap.quickTo(el, 'x'/'y', { duration: 0.5, ease: 'power2.out' })`; scale quickTo on hover of `a, button, [data-cursor]` | `DampedCursor` |
| SPA router: full-screen wipe between routes, routes preloaded on link hover (`hoverPreload`) | Overlay `yPercent: 100 → 0 → −100` wipe around `router.push`; `router.prefetch(href)` on `mouseenter` | `PageTransition` / `TransitionLink` |
| Work carousel: numbered giant titles ride the damped scroll; color grades by focus proximity; tilted media cards outrun the titles (parallax) | Per-title scrubbed color timeline (`scrub: true`, `ease: 'none'`), per-card scrubbed `yPercent` parallax, constant ±8° base tilt | `ScrubCarousel` |
| Whirlpool: during scroll bursts, carousel items rotate a few degrees — more the further they sit from the focus band, opposite signs above vs. below center — and straighten as the damped scroll settles | Per-item `gsap.quickTo(el, 'rotation')` re-targeted from Lenis `scroll` events: `(velocity / maxVelocity) × maxTilt × centerOffset × 2`, house ease supplies the settle | `WhirlpoolCarousel` |
| Media cards track the cursor in 3D: card leans toward the pointer, and the edge under it dips away (bottom → pitch down, right → yaw right); damped follow, rests on leave | `transformPerspective` + four `gsap.quickTo` channels (rotationX/rotationY/x/y) driven by normalized pointer position within the card | `TiltCard` |
| Section arrival: hairline rule draws across, small label rises, content staggers in as the section scrolls into view | Once-only ScrollTrigger timeline: `scaleX 0→1` on the rule (0.8s), label rise (0.3s), children wave at `<0.1` offsets | `SectionIntro` |
| Fluid spacing `calc(Apx + Bvw)` | CSS custom properties with `clamp()` — see `layout.md` | — |

## The work carousel (decoded from video forensics)

The home-page work list couldn't be read from code (custom canvas engine),
so it was decoded from a 30fps frame analysis of a scroll recording
(the design-extractor skill's fallback workflow):

- **Everything is scrubbed, nothing is timed.** Per-frame luma-difference
  analysis shows motion tracking scroll continuously, ending in an
  exponential decay tail (~1s) — the damped-lerp scroll settling. In GSAP
  terms: `scrub: true` with `ease: 'none'`; Lenis supplies the damping.
- **Titles color-grade by position, not by class toggles.** Soft white
  (`#dddddd`) while below the focus band → accent orange (`#fe5d2f`) around
  mid-viewport → faded ember (≈`#e8b4a8`, estimated from frames) once above.
  It is a continuous gradient with distance, not a discrete swap.
- **Media cards hold a constant ~8–10° tilt** during travel (same angle at
  frame 120 and 144 of the recording) with the sign alternating between
  items — the tilt is composition, not velocity reaction.
- **Cards outrun titles.** Between those same frames a card exits the
  viewport while its title moves less than half as far — vertical parallax,
  ported as ±25 `yPercent` extra scrubbed travel.
- Rhythm: roughly 3 titles per viewport (~35–40vh per row), cards spanning
  about 1.5 rows.

## Choreography rules

1. **Reveal once.** Scroll reveals fire the first time only (`once: true`);
   scrolling back up does not replay them.
2. **Wave, not queue.** Staggered siblings overlap (`"<0.1"`); never let one
   finish before the next starts.
3. **Text is masked, media fades.** Type always uses the masked rise;
   images/cards use opacity + 24px rise.
4. **One speed hierarchy.** Hero text `lg` (0.8s), everything else `md`
   (0.5s), micro-interactions `xs`/`sm`. Don't invent in-between values.
5. **Reduced motion is a hard requirement.** Every template already bails to
   static rendering / native scroll when `prefers-reduced-motion` is set;
   keep that property when composing new sequences.

## Licensing note

Since **GSAP 3.13** (Webflow acquisition), GSAP and *all* its plugins —
including SplitText and ScrollSmoother — are free for commercial use. No
Club membership, no license gymnastics. This skill uses ScrollTrigger +
SplitText + Lenis; Lenis (MIT) is chosen over ScrollSmoother because its
exponential-damping model matches the reference engine's scroll feel exactly.
