# variable-noir — layout system

Verified against the reference site's stylesheet.

## Grid

- **4 columns** on mobile → **7 columns** from the desktop breakpoint
  (`repeat(4, minmax(0, 1fr))` → `repeat(7, minmax(0, 1fr))`). The odd
  column count is deliberate — content blocks sit asymmetrically.
- **One breakpoint that matters: 1024px** (`min-width: 1024px`). Below it,
  the mobile layout; above it, the desktop layout. Avoid intermediate
  breakpoints; let fluid spacing do the adaptation.
- **Container: max-width 2160px**, centered. The design keeps scaling up to
  very wide screens before capping.

```css
.vn-container {
  max-width: 2160px;
  margin-inline: auto;
  padding-inline: var(--vn-space-md1);
}

.vn-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--vn-space-md1);
}

@media (min-width: 1024px) {
  .vn-grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
}
```

## Fluid spacing

Macro-spacing ramps linearly with the viewport between **320px and 1680px**
via `calc(Apx + Bvw)`. The exact coefficients from the stylesheet, wrapped in
`clamp()` so values hold steady outside the ramp:

```css
:root {
  /* 20px @320 → 30px @1680 — gutters, small section padding */
  --vn-space-md1: clamp(20px, calc(17.64706px + 0.73529vw), 30px);
  /* 14px → 45px — inter-block gaps */
  --vn-space-lg1: clamp(14px, calc(6.70588px + 2.27941vw), 45px);
  /* 48px → 120px — section spacing */
  --vn-space-xl1: clamp(48px, calc(31.05882px + 5.29412vw), 120px);
  /* 62px → 200px — large section spacing */
  --vn-space-xl2: clamp(62px, calc(29.52941px + 10.14706vw), 200px);
  /* 82px → 340px — hero/display scale */
  --vn-space-xl3: clamp(82px, calc(21.29412px + 18.97059vw), 340px);
}
```

Additional unnamed steps observed (same 320→1680 ramp), if finer grain is
needed: 5→8, 8→12, 12→18, 16→20, and 12→35 px.

Derivation, for adding new steps: for a value ramping `min → max` between
viewports 320 and 1680, `B = (max − min) / 13.6` (vw) and
`A = min − 3.2 × B` (px); then `clamp(minpx, calc(Apx + Bvw), maxpx)`.

## Micro-spacing

Inside components the scale is static and tight: **1px hairlines dominate**
(borders/dividers), then 2, 3, 4, 6, 7, 8, 12px. Rhythm between sections
comes exclusively from the fluid ladder above — don't mix the two roles.

## Composition notes (from the screenshots)

- Fixed chrome: logo top-left, address / social / nav pinned as a persistent
  header row; content scrolls beneath it.
- Hero/display words are allowed to bleed off-viewport (cropped letterforms
  are intentional, driven by the `xl3` scale).
- Media blocks float with slight rotation against huge type; text columns
  hug the 7-column grid asymmetrically (e.g. content in columns 1–3,
  display type spanning 4–7).
- Generous dead space: whole viewport-heights of near-empty `#1d1d1d` are
  part of the pacing, not a bug.
