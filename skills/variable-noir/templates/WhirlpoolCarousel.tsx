'use client';

/**
 * WhirlpoolCarousel — the vortex work list, standalone.
 *
 * Renders its own rows (numbered giant titles + media cards). It shares no
 * DOM with ScrubCarousel — pick one or the other per page; same props.
 *
 * Decoded from the reference engine: each media card rides a HALF-ORBIT
 * around the focus band, driven by traversal progress (not velocity, so
 * the vortex is alive at any scroll speed). An angle sweeps 270° → 90°
 * across the traversal and the card's lateral offset follows its cosine:
 * the card swings LEFT approaching the focus band, is leftmost while in
 * focus, and returns RIGHT as it rises past and exits — while its in-plane
 * rotation sweeps −sweep° (entering) → level (focus) → +sweep° (exiting).
 * Titles color-grade through the focus band (soft white → orange → faded
 * ember) and get a transient velocity swirl on top, settling level at rest.
 *
 * The animated card element carries no CSS transforms of its own: it is a
 * flex shell spanning the full row that centers the media beside its title
 * by layout, so the orbit's per-frame transforms never collide with the
 * resting position. (No base tilt either — the orbit owns rotation.)
 *
 * The orbit is scrubbed ScrollTrigger work and functions without Lenis;
 * the title swirl reads Lenis velocity from SmoothScrollProvider when
 * present. Under prefers-reduced-motion everything renders static.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from './SmoothScrollProvider';
import { COLORS, EASE, WHIRLPOOL, prefersReducedMotion } from './tokens';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type WhirlpoolCarouselItem = {
  title: string;
  /** Media card content (img/video/anything). Omit for a text-only row. */
  media?: ReactNode;
};

type WhirlpoolCarouselProps = {
  items: WhirlpoolCarouselItem[];
  className?: string;
  /** Row height; titles stack ~3 per viewport on the reference site. */
  rowHeight?: string;
  /** Called with the item index when a title is clicked. */
  onSelect?: (index: number) => void;
};

export function WhirlpoolCarousel({
  items,
  className,
  rowHeight = '40vh',
  onSelect,
}: WhirlpoolCarouselProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || prefersReducedMotion()) return;

      // Title color grading — same scrub as ScrubCarousel: approach
      // (white → accent) then exit (accent → faded ember), purely positional.
      const titles = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll('[data-carousel-title]'),
      );
      for (const title of titles) {
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

      // The half-orbit: scrubbed rotation sweep + lateral swing per card.
      const cards = gsap.utils.toArray<HTMLElement>(
        root.querySelectorAll('[data-carousel-media]'),
      );
      for (const card of cards) {
        gsap.set(card, { transformPerspective: 900 });

        // Single driver: a scrubbed proxy tween whose progress p is the
        // traversal; every property derives from the same orbit angle each
        // frame, so the motion stays coherent.
        const state = { p: 0 };
        const ramp = (from: number, to: number, p: number) =>
          gsap.utils.clamp(0, 1, (p - from) / (to - from));
        gsap.fromTo(state, { p: 0 }, {
          p: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: card.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
          onUpdate() {
            const p = state.p;
            const theta = Math.PI * (1.5 - p); // 270° → 90° across traversal
            const D = 2 * p - 1; //              −1 → +1, 0 at the focus band
            const depth = Math.abs(Math.cos(theta)); // 0 at edges → 1 in focus
            gsap.set(card, {
              // the half-ellipse: swings left into focus, returns right
              // rising away; slow at the edges, fastest through focus.
              // Past focus (D > 0) an extra rightward drift ramps in so the
              // exiting card clears right while the next one takes its
              // place — the eclipse relay.
              x:
                WHIRLPOOL.driftX * Math.cos(theta) +
                WHIRLPOOL.exitX * Math.pow(Math.max(0, D), 1.3),
              y: -WHIRLPOOL.travelY * Math.sin(theta),
              // engine-faithful: in-plane sweep, 3D yaw, and the shear (the
              // DOM stand-in for the shader twist) are all LINEAR in D
              rotation: WHIRLPOOL.sweep * D,
              rotationY: WHIRLPOOL.yaw * D,
              skewY: WHIRLPOOL.twist * D,
              // depth: eased plateau near focus, shrinking toward the edges
              scale:
                WHIRLPOOL.scaleMin +
                (1 - WHIRLPOOL.scaleMin) * Math.pow(depth, WHIRLPOOL.depthEase),
              zIndex: Math.round(WHIRLPOOL.zRange * depth),
              // visibility window: only the card(s) near focus are on
              // screen — the pile-up is what makes the vortex unreadable
              autoAlpha: Math.min(
                ramp(WHIRLPOOL.visibleFrom, WHIRLPOOL.visibleFrom + WHIRLPOOL.fade, p),
                1 - ramp(WHIRLPOOL.visibleTo, WHIRLPOOL.visibleTo + WHIRLPOOL.fade, p),
              ),
            });
          },
        });
      }
    },
    { scope: ref },
  );

  // The transient title swirl, re-targeted from Lenis velocity.
  useEffect(() => {
    const root = ref.current;
    if (!root || !lenis || prefersReducedMotion()) return;

    const titles = Array.from(
      root.querySelectorAll<HTMLElement>('[data-carousel-title]'),
    );
    const spins = titles.map((el) =>
      gsap.quickTo(el, 'rotation', { duration: WHIRLPOOL.settle, ease: EASE }),
    );

    const onScroll = () => {
      const v = gsap.utils.clamp(
        -WHIRLPOOL.maxVelocity,
        WHIRLPOOL.maxVelocity,
        lenis.velocity,
      );
      titles.forEach((el, i) => {
        const r = el.getBoundingClientRect();
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
    <div ref={ref} className={className} data-whirlpool>
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
                // Transform-clean flex shell: spans the full row and centers
                // the media beside its title by layout, so GSAP's per-frame
                // transforms are the ONLY transforms on this element.
                position: 'absolute',
                left: '15%',
                top: 0,
                height: '100%',
                width: 'min(40%, 600px)',
                display: 'flex',
                alignItems: 'center',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            >
              {item.media}
            </div>
          )}
          {/* Titles render above the orbit's full depth range (zRange). */}
          <div
            style={{
              position: 'relative',
              zIndex: WHIRLPOOL.zRange + 20,
              textAlign: 'right',
            }}
          >
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
