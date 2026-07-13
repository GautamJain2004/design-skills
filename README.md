# design-skills

A repository of [agent skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills) — self-contained capabilities (a `SKILL.md` plus supporting scripts) that AI coding agents like Claude Code can discover and use.

## Repository layout

```
skills/
  design-extractor/
    SKILL.md            # Skill definition: when and how to use it
    scripts/extract.mjs # Playwright script that does the work
  variable-noir/
    SKILL.md            # Dark cinematic design system, GSAP-first
    templates/          # React client components for Next.js (GSAP + Lenis)
    references/         # tokens.md, motion.md, layout.md
    assets/screenshots/ # Reference captures at 1440/768/390px
```

Each skill lives in its own folder under `skills/`, with a `SKILL.md` describing what it does, when to use it, and how to invoke its scripts.

## Skills

### design-extractor

Extracts the visual design of any live website:

- **Full-page screenshots** at 1440px (desktop), 768px (tablet), and 390px (mobile) widths.
- **Design tokens** saved to `tokens.json`: heading and body typography (font family, size, weight, line height, color), the most-used text and background colors, page background, spacing scale, and border radii — all read from computed styles at the desktop viewport.
- **Animation engine probe**, also in `tokens.json`: detects GSAP (dumping live tween durations/eases), ScrollTrigger configs, and Lenis/smooth-scroll instances with their options. The SKILL.md documents a video-forensics fallback (Playwright recording + ffmpeg frames) for sites whose animation code is unreadable.

Usage:

```bash
node skills/design-extractor/scripts/extract.mjs <url> [output-dir]
```

Output defaults to `./output/<hostname>/`.

### variable-noir

A dark cinematic design system distilled from a reference site's extracted
tokens and animation behavior, ported to a GSAP-first stack (gsap,
@gsap/react, ScrollTrigger, SplitText, Lenis) as Next.js App Router client
components: masked line-by-line text reveals, wave staggers, scroll reveals,
damped smooth scroll and cursor, and page-wipe transitions — with all
extracted values baked into a single `tokens.ts`. Triggers on "redesign",
"premium", or "dark cinematic style" requests.

## Setup

```bash
npm install
npx playwright install chromium
```

Requires Node.js 18+.

## Adding a new skill

1. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`) followed by usage instructions.
2. Put supporting code in `skills/<skill-name>/scripts/`.
3. Keep skills self-contained: the `SKILL.md` should be enough for an agent to use the skill without reading the script source.
