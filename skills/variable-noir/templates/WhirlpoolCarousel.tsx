'use client';

/**
 * WhirlpoolCarousel — ScrubCarousel plus the velocity swirl.
 *
 * Decoded from a scripted re-recording of the reference site: while the
 * damped scroll is in motion, carousel titles and media cards rotate a few
 * degrees — the further an item sits from the viewport-center focus band,
 * the bigger its swing, and items above center swing opposite to items
 * below (a vortex, not a uniform lean). As the Lenis velocity decays, every
 * item eases back to level with the house ease, so the swirl breathes with
 * each scroll burst and dies at rest.
 *
 * Composition: renders a plain ScrubCarousel (color grading, parallax,
 * numbered titles all unchanged) and attaches the swirl to its
 * [data-carousel-title] / [data-carousel-media] elements. Use one or the
 * other per page — both accept the same props.
 *
 * Requires SmoothScrollProvider (the swirl reads Lenis velocity; without a
 * Lenis instance it renders as a plain ScrubCarousel).
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrubCarousel } from './ScrubCarousel';
import type { ComponentProps } from 'react';
import { useLenis } from './SmoothScrollProvider';
import { DURATION, EASE, WHIRLPOOL, prefersReducedMotion } from './tokens';

export function WhirlpoolCarousel(props: ComponentProps<typeof ScrubCarousel>) {
  const ref = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const root = ref.current;
    if (!root || !lenis || prefersReducedMotion()) return;

    const els = Array.from(
      root.querySelectorAll<HTMLElement>(
        '[data-carousel-title], [data-carousel-media]',
      ),
    );
    // quickTo re-targets a single tween per element — each scroll event just
    // moves the goalpost, and the house ease supplies the settle.
    const spins = els.map((el) =>
      gsap.quickTo(el, 'rotation', { duration: DURATION.lg, ease: EASE }),
    );

    const onScroll = () => {
      const v = gsap.utils.clamp(
        -WHIRLPOOL.maxVelocity,
        WHIRLPOOL.maxVelocity,
        lenis.velocity,
      );
      els.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        // Signed distance of the item's center from the viewport center,
        // in viewport heights: negative above, positive below, 0 in focus.
        const offset = gsap.utils.clamp(
          -0.5,
          0.5,
          (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight,
        );
        spins[i]((v / WHIRLPOOL.maxVelocity) * WHIRLPOOL.maxTilt * offset * 2);
      });
    };

    lenis.on('scroll', onScroll);
    return () => {
      lenis.off('scroll', onScroll);
      spins.forEach((spin) => spin.tween?.kill());
    };
  }, [lenis]);

  return (
    <div ref={ref}>
      <ScrubCarousel {...props} />
    </div>
  );
}
