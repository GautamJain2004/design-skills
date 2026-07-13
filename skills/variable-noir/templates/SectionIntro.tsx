'use client';

/**
 * SectionIntro — announces that a new section has arrived.
 *
 * The reference site marks each section's arrival with a small
 * choreography as it scrolls into view: a hairline rule draws across the
 * top, the section's small label rises in, then the content waves in with
 * the relative-offset stagger. This wrapper plays that sequence once when
 * the section enters the viewport.
 *
 *   <SectionIntro label="Capabilities">
 *     <h3>Behavioral Insights</h3>
 *     <p>…</p>
 *   </SectionIntro>
 *
 * Pair with MaskedTextReveal for display headings inside the section.
 * Under prefers-reduced-motion the section renders fully static.
 */

import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  COLORS,
  DURATION,
  EASE,
  REVEAL,
  STAGGER,
  prefersReducedMotion,
} from './tokens';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type SectionIntroProps = {
  children: ReactNode;
  /** Small label under the hairline (e.g. "Capabilities"). */
  label?: string;
  className?: string;
  /** Hide the hairline rule while keeping the label + content wave. */
  rule?: boolean;
};

export function SectionIntro({
  children,
  label,
  className,
  rule = true,
}: SectionIntroProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || prefersReducedMotion()) return;

      const line = root.querySelector('[data-intro-line]');
      const labelEl = root.querySelector('[data-intro-label]');
      const items = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll('[data-intro-content] > *'),
      );

      const tl = gsap.timeline({
        defaults: { ease: EASE },
        scrollTrigger: { trigger: root, start: REVEAL.start, once: true },
      });
      if (line) {
        tl.from(line, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: DURATION.lg,
        });
      }
      if (labelEl) {
        tl.from(
          labelEl,
          { opacity: 0, y: REVEAL.y / 2, duration: DURATION.sm },
          line ? `<${STAGGER}` : 0,
        );
      }
      items.forEach((item) => {
        tl.from(
          item,
          { opacity: 0, y: REVEAL.y, duration: DURATION.md },
          `<${STAGGER}`,
        );
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className={className}>
      {rule && (
        <div
          data-intro-line
          aria-hidden
          style={{ height: 1, background: 'rgba(221, 221, 221, 0.25)' }}
        />
      )}
      {label && (
        <span
          data-intro-label
          style={{
            display: 'block',
            fontSize: 14,
            color: COLORS.text,
            margin: '12px 0 28px',
          }}
        >
          {label}
        </span>
      )}
      <div data-intro-content>{children}</div>
    </section>
  );
}
