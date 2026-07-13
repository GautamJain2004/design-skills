'use client';

/**
 * Signature masked line-by-line text reveal.
 *
 * Each line is wrapped in an overflow-hidden mask and rises from
 * translateY(100%) to rest with the house ease — the text appears to be
 * unveiled from behind an invisible edge.
 *
 *   <MaskedTextReveal as="h1" className="...">
 *     We help brands unlock the variables that fuel growth.
 *   </MaskedTextReveal>
 *
 * Defaults: reveals when scrolled into view, hero duration (0.8s),
 * 0.1s wave stagger between lines. Set `scroll={false}` to play on mount
 * (above-the-fold heros).
 */

import { useRef, type ElementType, type ReactNode, type Ref } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DURATION, EASE, REVEAL, STAGGER, prefersReducedMotion } from './tokens';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

type MaskedTextRevealProps = {
  children: ReactNode;
  /** Rendered tag, e.g. "h1", "h2", "p". Defaults to "div". */
  as?: ElementType;
  className?: string;
  /** Seconds before the reveal starts. */
  delay?: number;
  /** Per-line duration in seconds. */
  duration?: number;
  /** Seconds between line starts (wave). Use 0.05 for many lines. */
  stagger?: number;
  /** Reveal when scrolled into view (true) or immediately on mount (false). */
  scroll?: boolean;
};

export function MaskedTextReveal({
  children,
  as: Tag = 'div',
  className,
  delay = 0,
  duration = DURATION.lg,
  stagger = STAGGER,
  scroll = true,
}: MaskedTextRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      // autoSplit waits for fonts and re-splits on resize; the tween returned
      // from onSplit is reverted and rebuilt automatically on each re-split.
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 100,
            duration,
            ease: EASE,
            stagger,
            delay,
            ...(scroll
              ? {
                  scrollTrigger: {
                    trigger: el,
                    start: REVEAL.start,
                    once: true,
                  },
                }
              : {}),
          }),
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref as Ref<never>} className={className}>
      {children}
    </Tag>
  );
}
