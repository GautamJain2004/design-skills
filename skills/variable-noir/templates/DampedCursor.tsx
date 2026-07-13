'use client';

/**
 * Damped custom cursor: a small dot that trails the pointer with
 * exponential-style damping (gsap.quickTo with the house ease), growing when
 * hovering interactive elements (a, button, [data-cursor]).
 *
 * Render once, as a sibling of the app content (root layout). It renders
 * nothing on touch devices and stays static under prefers-reduced-motion.
 * Uses mix-blend-mode: difference so it stays visible on any surface.
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { COLORS, CURSOR, EASE, prefersReducedMotion } from './tokens';

gsap.registerPlugin(useGSAP);

const INTERACTIVE = 'a, button, [data-cursor]';

type DampedCursorProps = {
  /** Dot diameter in px. */
  size?: number;
  color?: string;
  /** mix-blend-mode: difference so the dot reads on light and dark. */
  blend?: boolean;
};

export function DampedCursor({
  size = CURSOR.size,
  color = COLORS.text,
  blend = true,
}: DampedCursorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const xTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const yTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const scaleTo = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    gsap.set(el, { xPercent: -50, yPercent: -50 });
    const opts = { duration: CURSOR.duration, ease: EASE };
    xTo.current = gsap.quickTo(el, 'x', opts);
    yTo.current = gsap.quickTo(el, 'y', opts);
    scaleTo.current = gsap.quickTo(el, 'scale', opts);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Pointer-driven cursor only makes sense with a fine pointer.
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const reduced = prefersReducedMotion();
    const move = (e: PointerEvent) => {
      if (reduced) {
        // No trailing animation — pin directly to the pointer.
        gsap.set(el, { x: e.clientX, y: e.clientY });
      } else {
        xTo.current?.(e.clientX);
        yTo.current?.(e.clientY);
      }
      el.style.opacity = '1';
    };
    const over = (e: PointerEvent) => {
      if ((e.target as Element).closest?.(INTERACTIVE)) {
        scaleTo.current?.(CURSOR.hoverScale);
      }
    };
    const out = (e: PointerEvent) => {
      if ((e.target as Element).closest?.(INTERACTIVE)) {
        scaleTo.current?.(1);
      }
    };
    const leave = () => {
      el.style.opacity = '0';
    };

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', out);
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: size,
        height: size,
        borderRadius: '9999px',
        background: color,
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0,
        mixBlendMode: blend ? 'difference' : undefined,
      }}
    />
  );
}
