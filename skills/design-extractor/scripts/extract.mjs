#!/usr/bin/env node
/**
 * Design extractor: captures full-page screenshots of a URL at desktop,
 * tablet and mobile widths, and extracts computed design tokens
 * (typography, colors, background, spacing, border radii) to tokens.json.
 *
 * Usage:
 *   node extract.mjs <url> [output-dir]
 *
 * Output (in output-dir, default ./output/<hostname>):
 *   screenshot-1440.png, screenshot-768.png, screenshot-390.png, tokens.json
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const VIEWPORTS = [
  { name: 'desktop', width: 1440 },
  { name: 'tablet', width: 768 },
  { name: 'mobile', width: 390 },
];

const url = process.argv[2];
if (!url) {
  console.error('Usage: node extract.mjs <url> [output-dir]');
  process.exit(1);
}

const outDir = path.resolve(
  process.argv[3] ?? path.join('output', new URL(url).hostname)
);
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();

/** Scroll through the page to trigger lazy-loaded content, then return to top. */
async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = 800;
    let pos = 0;
    while (pos < document.body.scrollHeight) {
      window.scrollBy(0, step);
      pos += step;
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

async function openPage(context) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  } catch {
    // Sites with long-polling/analytics never reach networkidle; 'load' is enough.
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 }).catch(() => {});
  }
  await autoScroll(page);
  await page.waitForTimeout(500);
  return page;
}

/** Runs in the browser: extract design tokens from computed styles. */
function extractTokens() {
  const toHex = (css) => {
    let m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    let r, g, b, a;
    if (m) {
      [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
      a = m[4] === undefined ? 1 : parseFloat(m[4]);
    } else if ((m = css.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/))) {
      [r, g, b] = [m[1], m[2], m[3]].map((c) => Math.round(parseFloat(c) * 255));
      a = m[4] === undefined ? 1 : parseFloat(m[4]);
    } else {
      return css;
    }
    if (a === 0) return null; // transparent
    const hex = [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
    return a < 1 ? `#${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}` : `#${hex}`;
  };

  const typography = { headings: {}, body: {} };
  for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
    const el = document.querySelector(tag);
    if (!el) continue;
    const s = getComputedStyle(el);
    typography.headings[tag] = {
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      letterSpacing: s.letterSpacing,
      color: toHex(s.color),
    };
  }
  const bodySample = document.querySelector('main p, article p, p') || document.body;
  const bs = getComputedStyle(bodySample);
  typography.body = {
    sampledFrom: bodySample.tagName.toLowerCase(),
    fontFamily: bs.fontFamily,
    fontSize: bs.fontSize,
    fontWeight: bs.fontWeight,
    lineHeight: bs.lineHeight,
    color: toHex(bs.color),
  };

  // Tally colors, spacing and radii across visible elements (capped for perf).
  const textColors = new Map();
  const bgColors = new Map();
  const spacing = new Map();
  const radii = new Map();
  const tally = (map, key) => key && map.set(key, (map.get(key) || 0) + 1);

  const elements = [...document.querySelectorAll('body *')].slice(0, 5000);
  for (const el of elements) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const s = getComputedStyle(el);

    tally(textColors, toHex(s.color));
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      tally(bgColors, toHex(s.backgroundColor));
    }
    for (const prop of ['marginTop', 'marginBottom', 'marginLeft', 'marginRight',
                        'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight']) {
      const v = parseFloat(s[prop]);
      if (v > 0) tally(spacing, `${Math.round(v)}px`);
    }
    const r = s.borderRadius;
    if (r && r !== '0px') tally(radii, r);
  }

  const topEntries = (map, n) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([value, count]) => ({ value, count }));

  return {
    typography,
    colors: {
      text: topEntries(textColors, 10),
      backgrounds: topEntries(bgColors, 10),
    },
    // The body is often transparent; the real page background can sit on <html>.
    background:
      toHex(getComputedStyle(document.body).backgroundColor) ??
      toHex(getComputedStyle(document.documentElement).backgroundColor),
    spacingScale: topEntries(spacing, 16),
    borderRadii: topEntries(radii, 8),
  };
}

/**
 * Pages with JS-driven "virtual" scrolling (body overflow:hidden, content
 * moved by wheel events) report a document height of one viewport, so the
 * full-page shot misses everything below the fold. Detect that and capture
 * extra frames by dispatching wheel events.
 */
async function captureVirtualScrollFrames(page, width) {
  const docHeight = await page.evaluate(
    () => document.documentElement.scrollHeight
  );
  const viewHeight = page.viewportSize().height;
  if (docHeight > viewHeight + 1) return [];

  console.log(`  virtual scrolling detected at ${width}px; capturing frames...`);
  const frames = [];
  let prev = await page.screenshot();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.wheel(0, viewHeight);
    await page.waitForTimeout(800);
    const buf = await page.screenshot();
    if (buf.equals(prev)) break; // nothing changed: reached the end
    prev = buf;
    const file = `screenshot-${width}-scroll-${String(i).padStart(2, '0')}.png`;
    await writeFile(path.join(outDir, file), buf);
    frames.push(file);
  }
  return frames;
}

/**
 * Runs in the browser: detect animation libraries and dump live tween data.
 * Only tweens alive at probe time are visible, and bundled engines that
 * don't expose globals are invisible here (grep the bundle in that case).
 */
function probeAnimationEngine() {
  const probe = {
    gsap: null,
    scrollTrigger: null,
    smoothScroll: [],
    note: 'Snapshot of tweens alive at probe time. A bundler that does not expose window.gsap makes GSAP invisible here — absence is not proof of absence.',
  };

  const describeTarget = (t) => {
    if (!t) return null;
    if (t.nodeType === 1) {
      const cls =
        typeof t.className === 'string'
          ? t.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.')
          : '';
      return (
        t.tagName.toLowerCase() + (t.id ? `#${t.id}` : cls ? `.${cls}` : '')
      );
    }
    return typeof t;
  };

  const g = window.gsap;
  if (g && g.globalTimeline) {
    let tweens = [];
    try {
      const NON_PROP_VARS = new Set([
        'ease', 'duration', 'delay', 'repeat', 'repeatDelay', 'yoyo',
        'stagger', 'paused', 'overwrite', 'id', 'data', 'defaults',
        'scrollTrigger', 'onComplete', 'onUpdate', 'onStart', 'callbackScope',
      ]);
      tweens = g.globalTimeline
        .getChildren(true, true, true)
        // Skip internal delayedCall tweens (they target functions, not elements).
        .filter((t) => {
          if (typeof t.targets !== 'function') return true;
          const targets = t.targets();
          return !(targets.length && targets.every((x) => typeof x === 'function'));
        })
        .slice(0, 40)
        .map((t) => {
          const vars = t.vars || {};
          return {
            kind: typeof t.getChildren === 'function' ? 'timeline' : 'tween',
            duration: Number(t.duration().toFixed(3)),
            delay: Number((t.delay ? t.delay() : 0).toFixed(3)),
            repeat: vars.repeat ?? 0,
            ease:
              typeof vars.ease === 'string'
                ? vars.ease
                : vars.ease
                  ? 'custom (function)'
                  : 'default (power1.out)',
            target:
              typeof t.targets === 'function'
                ? describeTarget(t.targets()[0])
                : null,
            props: Object.keys(vars)
              .filter((k) => !NON_PROP_VARS.has(k))
              .slice(0, 8),
          };
        });
    } catch {
      /* keep whatever we got */
    }
    probe.gsap = {
      version: g.version || 'unknown',
      activeTweens: tweens.length,
      tweens,
    };
  }

  const ST =
    window.ScrollTrigger ||
    (g && g.core && g.core.globals && g.core.globals().ScrollTrigger);
  if (ST && typeof ST.getAll === 'function') {
    try {
      const all = ST.getAll();
      probe.scrollTrigger = {
        count: all.length,
        samples: all.slice(0, 15).map((st) => ({
          trigger: describeTarget(st.trigger),
          start: st.vars?.start ?? null,
          end: st.vars?.end ?? null,
          scrub: st.vars?.scrub ?? false,
          pin: !!st.vars?.pin,
          once: !!st.vars?.once,
        })),
      };
    } catch {
      probe.scrollTrigger = { count: null };
    }
  }

  // Known smooth-scroll globals (instances and constructors).
  const SCROLL_GLOBALS = [
    'lenis', 'Lenis', 'locomotive', 'locomotiveScroll', 'LocomotiveScroll',
    'ScrollSmoother', 'Scrollbar', 'asscroll', 'ASScroll', 'luge',
  ];
  for (const name of SCROLL_GLOBALS) {
    try {
      const v = window[name];
      if (!v) continue;
      const entry = {
        global: name,
        type: typeof v === 'function' ? 'constructor' : 'instance',
      };
      if (typeof v === 'object') {
        if (typeof v.raf === 'function' && typeof v.scrollTo === 'function') {
          entry.looksLike = 'lenis-style instance';
        }
        const opts = v.options || v.settings;
        if (opts) {
          entry.options = {};
          for (const key of ['lerp', 'duration', 'smooth', 'smoothWheel',
                             'smoothTouch', 'wheelMultiplier', 'multiplier']) {
            if (typeof opts[key] === 'number' || typeof opts[key] === 'boolean') {
              entry.options[key] = opts[key];
            }
          }
        }
      }
      probe.smoothScroll.push(entry);
    } catch {
      /* throwing getter — skip */
    }
  }

  // Heuristic sweep: any window prop whose constructor name suggests a
  // smooth-scroll engine we didn't know by name.
  try {
    for (const key of Object.getOwnPropertyNames(window)) {
      if (probe.smoothScroll.some((e) => e.global === key)) continue;
      let v;
      try {
        v = window[key];
      } catch {
        continue;
      }
      if (!v || typeof v !== 'object') continue;
      const ctor = v.constructor && v.constructor.name;
      if (ctor && /lenis|locomotive|smoothscroll/i.test(ctor)) {
        probe.smoothScroll.push({ global: key, type: 'instance', constructor: ctor });
      }
    }
  } catch {
    /* ignore */
  }

  return probe;
}

const screenshots = {};
let tokens = null;
let animationEngine = null;

for (const { name, width } of VIEWPORTS) {
  console.log(`Capturing ${name} (${width}px)...`);
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await openPage(context);

  const file = `screenshot-${width}.png`;
  await page.screenshot({ path: path.join(outDir, file), fullPage: true });
  screenshots[`${width}px`] = [file, ...(await captureVirtualScrollFrames(page, width))];

  // Extract tokens and probe animation libraries once, at desktop width.
  if (width === 1440) {
    tokens = await page.evaluate(extractTokens);
    animationEngine = await page.evaluate(probeAnimationEngine);
  }
  await context.close();
}

await browser.close();

const result = {
  source: url,
  extractedAt: new Date().toISOString(),
  tokensViewport: '1440px',
  screenshots,
  ...tokens,
  animationEngine,
};
await writeFile(path.join(outDir, 'tokens.json'), JSON.stringify(result, null, 2));

console.log(`\nDone. Output written to ${outDir}`);
console.log(`  ${Object.values(screenshots).flat().join(', ')}, tokens.json`);
