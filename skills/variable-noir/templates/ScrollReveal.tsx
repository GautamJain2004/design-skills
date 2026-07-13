'use client';

/**
 * Scroll-triggered reveal: fades in from opacity 0 with a small rise as the
 * element enters the viewport (the GSAP port of an `.is-active` class toggle).
 *
 *   <ScrollReveal><Card /></ScrollReveal>
 *   <ScrollReveal y={0} duration={DURATION.lg}>...</ScrollReveal>
 */

import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DURATION, EASE, REVEAL, prefersReducedMotion } from './tokens';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** px the element rises while fading in; 0 for a pure fade. */
  y?: number;
  duration?: number;
  delay?: number;
  /** Play only the first time it enters the viewport. */
  once?: boolean;
};

export function ScrollReveal({
  children,
  className,
  y = REVEAL.y,
  duration = DURATION.md,
  delay = 0,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;

      gsap.from(el, {
        opacity: 0,
        y,
        duration,
        delay,
        ease: EASE,
        scrollTrigger: {
          trigger: el,
          start: REVEAL.start,
          once,
          ...(once ? {} : { toggleActions: 'play none none reverse' }),
        },
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
