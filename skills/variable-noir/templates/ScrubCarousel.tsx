'use client';

/**
 * ScrubCarousel — the scroll-driven work list.
 *
 * Decoded via video forensics (30fps frame analysis of the reference site):
 * - Giant numbered titles ride the damped scroll. Everything here is
 *   scrubbed by scroll position — no timed tweens. The weighted settle when
 *   the user stops scrolling comes from Lenis (SmoothScrollProvider).
 * - Titles color-grade by proximity to a focus band at mid-viewport:
 *   soft white while below → accent orange in focus → faded ember above.
 * - Each item's media card floats in the left column with a constant base
 *   tilt (~8°, sign alternating per item) and travels farther per scroll
 *   unit than the titles (vertical parallax), sweeping past while the
 *   titles linger.
 *
 * Usage:
 *   <ScrubCarousel
 *     items={[
 *       { title: 'NAPA', media: <img src="/napa.jpg" alt="" /> },
 *       { title: 'Liquid Death', media: <video src="/ld.mp4" muted loop autoPlay /> },
 *       { title: 'More Work' },
 *     ]}
 *     onSelect={(i) => router.push(projects[i].href)}
 *   />
 *
 * Under prefers-reduced-motion the scrubs are skipped: titles render in the
 * soft white, media keeps its static tilt (composition, not motion).
 */

import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CAROUSEL, COLORS, prefersReducedMotion } from './tokens';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type ScrubCarouselItem = {
  title: string;
  /** Media card content (img/video/anything). Omit for a text-only row. */
  media?: ReactNode;
};

type ScrubCarouselProps = {
  items: ScrubCarouselItem[];
  className?: string;
  /** Row height; titles stack ~3 per viewport on the reference site. */
  rowHeight?: string;
  /** Called with the item index when a title is clicked. */
  onSelect?: (index: number) => void;
};

export function ScrubCarousel({
  items,
  className,
  rowHeight = '40vh',
  onSelect,
}: ScrubCarouselProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || prefersReducedMotion()) return;

      const titles = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll('[data-carousel-title]'),
      );
      for (const title of titles) {
        // Two scrubbed segments across the full traversal: approach
        // (white → accent) then exit (accent → faded ember). ease: 'none'
        // keeps color purely a function of scroll position.
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: title,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          })
          .fromTo(title, { color: COLORS.text }, { color: COLORS.accentOrange })
          .to(title, { color: COLORS.accentFaded });
      }

      const cards = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll('[data-carousel-media]'),
      );
      for (const card of cards) {
        // Extra ±yPercent travel = the card outruns natural scroll.
        gsap.fromTo(
          card,
          { yPercent: CAROUSEL.parallax },
          {
            yPercent: -CAROUSEL.parallax,
            ease: 'none',
            scrollTrigger: {
              trigger: card.parentElement,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      }
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {items.map((item, i) => (
        <section
          key={i}
          style={{
            position: 'relative',
            minHeight: rowHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          {item.media && (
            <div
              data-carousel-media
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                width: 'min(48%, 720px)',
                translate: '0 -50%',
                rotate: `${i % 2 === 0 ? -CAROUSEL.tilt : CAROUSEL.tilt}deg`,
                zIndex: 0,
                pointerEvents: 'none',
              }}
            >
              {item.media}
            </div>
          )}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' }}>
            <span
              style={{
                display: 'block',
                fontSize: 14,
                color: COLORS.text,
                marginBottom: '0.5em',
              }}
            >
              {String(i + 1).padStart(3, '0')}
            </span>
            <h2
              data-carousel-title
              onClick={onSelect ? () => onSelect(i) : undefined}
              style={{
                // The xl3 fluid ramp from layout.md — display type that is
                // allowed to bleed past the right edge.
                fontSize: 'clamp(82px, calc(21.29412px + 18.97059vw), 340px)',
                lineHeight: 1,
                fontWeight: 500,
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                margin: 0,
                color: COLORS.text,
                cursor: onSelect ? 'pointer' : undefined,
              }}
            >
              {item.title}
            </h2>
          </div>
        </section>
      ))}
    </div>
  );
}
