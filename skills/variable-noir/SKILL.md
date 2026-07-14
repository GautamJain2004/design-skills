---
name: variable-noir
description: Dark cinematic web design system with a GSAP-first motion language — masked line-by-line text reveals, wave staggers, damped smooth scroll, page-wipe transitions, near-black palette with signal-orange accents, giant fluid display type. Use when the user asks for a "redesign", a "premium" look, a "dark cinematic style", a high-end agency/portfolio aesthetic, or expensive-feeling animation in a Next.js/React project.
---

# variable-noir

A complete aesthetic: near-black (`#1d1d1d`) surfaces, soft-white (`#dddddd`)
14px body type, giant display words that bleed off-screen, and a single-ease
motion language (easeOutCubic everywhere) executed with GSAP + Lenis.
Screenshots of the reference aesthetic are in `assets/screenshots/`.

## Stack

React client components for **Next.js (App Router)** using:

- `gsap` + `@gsap/react` (`useGSAP`) — all animation
- `ScrollTrigger` — scroll reveals
- `SplitText` — masked text reveals (**free since GSAP 3.13**, as are all
  GSAP plugins — no license gymnastics needed)
- `lenis` — damped-lerp smooth scrolling

```bash
npm i gsap @gsap/react lenis
```

## Hard rules

1. **Always use the templates.** Copy `templates/` into the project (e.g.
   `components/motion/`) and compose pages from them. Do not hand-roll
   animation components that duplicate what a template does.
2. **Never hand-roll animation values.** Every duration, ease, stagger, and
   color comes from `templates/tokens.ts`. If a new value is truly needed,
   add it to `tokens.ts` first, then import it.
3. **One animation engine per project: GSAP.** If the target project uses
   framer-motion (or another engine), migrate it as part of applying this
   skill — remove the dependency, port usages with the table below. Never
   ship two engines.
4. **Reduced motion is non-negotiable.** The templates already degrade to
   static rendering and native scroll; preserve that in anything you compose.
5. **Fonts are commercial on the reference site** (Söhne, NeuroX). Use the
   legal equivalents listed in `references/tokens.md` — never ship unlicensed
   fonts.

## Templates

| Component | Purpose |
| --- | --- |
| `tokens.ts` | Single source of truth: ease, duration ladder, stagger, palette. |
| `SmoothScrollProvider` | Lenis smooth scroll wired into ScrollTrigger via GSAP's ticker; exposes `useLenis()`. |
| `PageTransition` / `TransitionLink` | Full-screen wipe between routes; hover preload via `router.prefetch`. |
| `MaskedTextReveal` | Signature line-by-line masked rise (SplitText, `yPercent: 100 → 0`). |
| `ScrollReveal` | Fade + 24px rise when entering the viewport, once. |
| `StaggerGroup` | Wave stagger of direct children via timeline relative offsets. |
| `ScrubCarousel` | Scroll-scrubbed work list: numbered giant titles that color-grade through a focus band, tilted media cards with parallax. |
| `DampedCursor` | Trailing dot cursor (`gsap.quickTo`), grows over interactive elements. |
| `WhirlpoolCarousel` | Standalone vortex work list (same props as ScrubCarousel — pick one per page): media cards ride a position-scrubbed half-orbit (rotation/yaw/shear linear in progress, depth scale + z-ordering, visibility window, rightward eclipse exit), titles color-grade and swirl transiently with fast scrolling. |
| `TiltCard` | Pointer-tracked 3D tilt for media cards: the card leans toward the cursor and the edge under it dips away; damped, resets on leave. |
| `SectionIntro` | Announces a section's arrival: hairline rule draws across, small label rises, content waves in — once, on enter. |

### Wiring (root layout)

```tsx
// app/layout.tsx
import { SmoothScrollProvider } from '@/components/motion/SmoothScrollProvider';
import { PageTransition } from '@/components/motion/PageTransition';
import { DampedCursor } from '@/components/motion/DampedCursor';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: '#1d1d1d' }}>
      <body>
        <SmoothScrollProvider>
          <PageTransition>{children}</PageTransition>
          <DampedCursor />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
```

### Composing a page

```tsx
<MaskedTextReveal as="h2" scroll={false}>   {/* hero: play on mount */}
  We help brands unlock the variables that fuel growth.
</MaskedTextReveal>

<StaggerGroup className="vn-grid">          {/* cards wave in on scroll */}
  {projects.map((p) => <ProjectCard key={p.id} {...p} />)}
</StaggerGroup>

<ScrubCarousel                              {/* scroll-scrubbed work list */}
  items={projects.map((p) => ({ title: p.name, media: <img src={p.cover} alt="" /> }))}
  onSelect={(i) => navigate(projects[i].href)}
/>

<TiltCard>                                  {/* media leans/tilts with cursor */}
  <img src="/motel.jpg" alt="" style={{ rotate: '-4deg' }} />
</TiltCard>

<SectionIntro label="Capabilities">        {/* hairline + label + wave on enter */}
  <CapabilityRows />
</SectionIntro>

<ScrollReveal><Footer /></ScrollReveal>

<TransitionLink href="/work">Work</TransitionLink>  {/* not next/link */}
```

## Migrating from framer-motion

| framer-motion usage | Replace with |
| --- | --- |
| `motion.div` + `whileInView` | `<ScrollReveal>` |
| `variants` + `staggerChildren` | `<StaggerGroup>` |
| `AnimatePresence` around routes | `<PageTransition>` + `TransitionLink` |
| text reveal variants | `<MaskedTextReveal>` |
| `useSpring` pointer followers | `<DampedCursor>` |
| ad-hoc `transition={{ duration, ease }}` | tokens from `tokens.ts` (`DURATION`, `EASE`) |

Then `npm uninstall framer-motion` and verify nothing imports it.

## References

- `references/tokens.md` — palette, type scale, radii, font equivalents
- `references/motion.md` — the full engine→GSAP translation table and
  choreography rules
- `references/layout.md` — 4/7-column grid, 1024px breakpoint, 2160px
  container, fluid spacing ladder with ready-to-paste CSS
- `assets/screenshots/` — reference captures at 1440/768/390px, including
  mid-scroll frames of the desktop experience
