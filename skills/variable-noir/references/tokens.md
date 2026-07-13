# variable-noir — design tokens

Extracted from the reference site's computed styles (1440px viewport) and
verified against its stylesheet. Machine-readable copies of the motion/color
values live in `../templates/tokens.ts` — components must import from there.

## Color

| Token | Value | Role |
| --- | --- | --- |
| `background` | `#1d1d1d` | Page surface. Set on `<html>`; body stays transparent. Near-black, never `#000`. |
| `text` | `#dddddd` | Primary text. Soft white, never `#fff` for body copy. |
| `white` | `#ffffff` | Reserved for emphasis moments only (~1% of usage). |
| `accentOrange` | `#fe5d2f` | Signal orange — links' arrow glyphs, highlights, one hero word per view at most. |
| `accentViolet` | `#8885f9` | Secondary accent — sparing, decorative. |

Usage discipline observed on the reference site: the palette is effectively
two grays plus two accents. Accents appear on well under 1% of elements.
Everything else is `#dddddd` on `#1d1d1d`.

## Typography

| Role | Font | Size | Weight | Line height | Tracking |
| --- | --- | --- | --- | --- | --- |
| Body / h1 (SEO-only h1) | Söhne | 14px | 450 | 18.9px (1.35) | normal |
| h2 (section titles) | Söhne | 40px | 500 | 54px (1.35) | −1px |
| h3 | Söhne | 28px | 450 | 37.8px (1.35) | normal |
| Display (hero words) | NeuroX | fluid, up to ~340px scale | — | tight (≈1.0) | — |

Key signatures:

- **Tiny body type**: 14px body copy at weight 450 (variable-font midpoint
  between regular and medium) is a core part of the look. Do not bump to 16px.
- **Uniform 1.35 line-height** across body and headings.
- **Giant display type** that overflows the viewport edge intentionally
  (see `layout.md` fluid scale, `xl3` reaching 340px values).

### Font licensing — pick legal equivalents

Both families on the reference site are commercial. **Never ship them
without a license.** Open alternatives:

- **Söhne** (Klim Type Foundry) → closest open equivalents: **Inter**
  (variable; set `font-weight: 450`), Geist Sans, or Hanken Grotesk.
- **NeuroX** (display) → try **Space Grotesk**, Archivo (wide/expanded
  weights), or Fontshare's Clash Display. Compare against
  `../assets/screenshots/` before committing — match the wide, heavy,
  slightly techy hero look.

## Radii

| Token | Value | Role |
| --- | --- | --- |
| pill | `9999px` | Buttons/badges — the only rounding on the site. |
| everything else | `0` | Cards, media, sections are sharp-cornered. |

## Spacing

Two systems coexist:

1. **Static micro-spacing** for UI details: 1px hairline borders dominate;
   then 2/3/4/6/7/8px steps for tight gaps.
2. **Fluid macro-spacing** for section rhythm, via `calc(Apx + Bvw)` ramps
   between 320px and 1680px viewports — see `layout.md` for the exact ladder
   and ready-to-paste CSS custom properties.
