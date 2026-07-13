'use client';

/**
 * Timeline-based sibling stagger with relative offsets — the wave feel.
 *
 * Direct children fade/rise in sequence; each child's tween is added at a
 * relative position ("<0.1"), meaning it starts 0.1s after the PREVIOUS
 * tween STARTS. Tweens overlap heavily instead of queuing, which reads as a
 * wave washing across the group rather than items ticking in one by one.
 *
 *   <StaggerGroup className="grid grid-cols-7">
 *     {cards.map((c) => <Card key={c.id} {...c} />)}
 *   </StaggerGroup>
 */

import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DURATION, EASE, REVEAL, STAGGER, prefersReducedMotion } from './tokens';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type StaggerGroupProps = {
  children: ReactNode;
  className?: string;
  /** Seconds between child starts. 0.05 for dense lists. */
  stagger?: number;
  /** Per-child duration. */
  duration?: number;
  /** px each child rises; 0 for pure fades. */
  y?: number;
  /** Start when scrolled into view (true) or on mount (false). */
  scroll?: boolean;
};

export function StaggerGroup({
  children,
  className,
  stagger = STAGGER,
  duration = DURATION.md,
  y = REVEAL.y,
  scroll = true,
}: StaggerGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const items = gsap.utils.toArray<HTMLElement>(el.children);
      if (items.length === 0) return;

      const tl = gsap.timeline({
        defaults: { ease: EASE, duration },
        ...(scroll
          ? {
              scrollTrigger: {
                trigger: el,
                start: REVEAL.start,
                once: true,
              },
            }
          : {}),
      });
      items.forEach((item, i) => {
        // "<0.1" = start 0.1s after the previous tween's start (overlap).
        tl.from(item, { opacity: 0, y }, i === 0 ? 0 : `<${stagger}`);
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
