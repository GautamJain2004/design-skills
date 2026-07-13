---
name: design-extractor
description: Extract the visual design of any live website — full-page screenshots at desktop (1440px), tablet (768px) and mobile (390px) widths, plus computed design tokens (heading/body typography, color palette, page background, spacing scale, border radii) saved to tokens.json. Use when the user wants to analyze, replicate, or reference a site's design, typography, or colors from a URL.
---

# Design Extractor

Capture a website's visual design as screenshots and structured design tokens.

## When to use

- The user shares a URL and wants to replicate, analyze, or take inspiration from its design.
- You need concrete values (fonts, sizes, colors, spacing, radii) instead of eyeballing a screenshot.
- You need responsive references of a page at desktop, tablet, and mobile widths.

## How to run

From the repo root:

```bash
node skills/design-extractor/scripts/extract.mjs <url> [output-dir]
```

Example:

```bash
node skills/design-extractor/scripts/extract.mjs https://example.com
```

- `output-dir` defaults to `./output/<hostname>`.
- Requires `playwright` (installed in this repo) with the Chromium browser
  downloaded (`npx playwright install chromium`).

## Output

The output directory contains:

| File | Contents |
| --- | --- |
| `screenshot-1440.png` | Full-page desktop screenshot |
| `screenshot-768.png` | Full-page tablet screenshot |
| `screenshot-390.png` | Full-page mobile screenshot |
| `screenshot-<w>-scroll-NN.png` | Extra frames, only for virtual-scroll pages (see below) |
| `tokens.json` | Computed design tokens (see below) |

Some sites hijack scrolling with JavaScript (`body { overflow: hidden }` plus
wheel-driven animation), so the document is only one viewport tall and a
"full-page" screenshot captures a single screen. The script detects this and
dispatches wheel events, saving up to 12 additional viewport frames per width
as `screenshot-<width>-scroll-01.png`, `-02.png`, etc. The `screenshots` map in
`tokens.json` lists every file captured per width, in scroll order.

`tokens.json` fields (tokens are computed at the 1440px viewport):

- `typography.headings.h1–h6` — font family, size, weight, line height, letter spacing, color for the first instance of each heading level found.
- `typography.body` — same for the first body paragraph.
- `colors.text` / `colors.backgrounds` — the 10 most frequent text and background colors across visible elements, as hex, with usage counts.
- `background` — the page (`body`) background color.
- `spacingScale` — the 16 most frequent non-zero margin/padding values.
- `borderRadii` — the 8 most frequent non-zero border-radius values.
- `animationEngine` — animation-library probe results (see below).

## Animation engine probe

After the desktop capture, the script probes the live page for animation
libraries and records findings under `animationEngine` in `tokens.json`:

- `gsap` — if `window.gsap` exists: version, plus up to 40 tweens/timelines
  alive on `gsap.globalTimeline` (duration, delay, repeat, ease, animated
  properties, short target descriptor).
- `scrollTrigger` — if ScrollTrigger is registered: trigger count and up to
  15 sampled configs (trigger element, start/end, scrub, pin, once).
- `smoothScroll` — known globals (`lenis`, `LocomotiveScroll`,
  `ScrollSmoother`, `Scrollbar`, `ASScroll`, `luge`, …) with their numeric
  options (lerp, duration, multipliers), plus a heuristic sweep of window
  properties whose constructor name matches `/lenis|locomotive|smoothscroll/i`.

Caveats when reading the results:

- The probe sees only tweens **alive at probe time**. Entrance animations
  that already completed have been released from the global timeline.
- Absence of `window.gsap` does **not** mean GSAP isn't used — bundlers
  usually don't expose globals. Before concluding, grep the site's JS bundle
  for telltale strings (`gsap`, `ScrollTrigger`, ease names like
  `power2.out`).
- **The Chrome DevTools Animations panel does not show GSAP tweens.** It
  only records CSS transitions/animations and Web Animations API entries;
  GSAP writes inline styles from its own requestAnimationFrame loop, which
  the panel never sees. To inspect GSAP by hand, run the console probe
  instead — `gsap.globalTimeline.getChildren(true, true, true)` — which is
  exactly what this script automates.

## Fallback: unreadable code — motion forensics from video

When the animation code can't be read (heavily minified custom engine, no
exposed globals — the probe comes back empty), estimate motion values from
a recording instead:

1. **Record a scroll video with Playwright.** Videos are written when the
   context closes:

   ```js
   const context = await browser.newContext({
     viewport: { width: 1440, height: 900 },
     recordVideo: { dir: 'video/', size: { width: 1440, height: 900 } },
   });
   const page = await context.newPage();
   await page.goto(url, { waitUntil: 'networkidle' });
   await page.waitForTimeout(1000);
   for (let i = 0; i < 12; i++) {
     await page.mouse.wheel(0, 900); // one viewport per step
     await page.waitForTimeout(1000); // let each transition settle
   }
   await context.close(); // flushes the .webm into video/
   ```

2. **Extract frames at 30fps with ffmpeg** — each frame is then 33.3ms:

   ```bash
   ffmpeg -i video/<hash>.webm -vf fps=30 frames/%04d.png
   ```

3. **Estimate durations.** Find the frame where an element starts moving and
   the frame where it rests: `duration ≈ frame count / 30`. (15 frames ≈
   500ms, 24 frames ≈ 800ms.)

4. **Estimate easing.** Track one element's position across the frames and
   normalize progress 0→1, then check progress at the temporal midpoint:
   - ≈ 50% and constant speed → linear (typical for scrub-driven motion)
   - ≈ 75% → quadratic ease-out
   - ≈ 87% → **cubic ease-out** (the most common "premium" ease)
   - s-curve with slow start and end → ease-in-out

   To separate scrubbed motion from timed tweens: scroll at a constant rate;
   if the element's position tracks scroll distance linearly, it's scrubbed
   by scroll progress (`scrub: true` in GSAP terms), not a timed tween.

## Interpreting results

- Frequency counts indicate prominence: the top background color is usually the page surface, the top text color the body copy.
- Fonts are reported as full CSS `font-family` stacks; the first name is the intended typeface.
- Screenshots are lazy-load aware (the script scrolls the full page before capture), but heavily animated pages may still capture mid-transition frames.
