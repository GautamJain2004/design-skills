'use client';

/**
 * TiltCard — pointer-tracked 3D tilt for media cards.
 *
 * Decoded via a cursor probe of the reference site (screenshots with the
 * mouse parked at the card's center/top/bottom/left/right): the card leans
 * toward the cursor — a slight translation — and tilts in 3D so the edge
 * under the cursor dips away (cursor at the bottom pitches the card down,
 * at the right yaws it right, etc.). The follow is damped with the house
 * ease and everything returns to rest when the pointer leaves.
 *
 * Wrap any media block:
 *   <TiltCard><img src="/motel.jpg" alt="" /></TiltCard>
 *
 * Composes with a static base tilt — put `rotate: -4deg` (the CSS property)
 * on this wrapper or a parent; the 3D tilt stacks on top of it.
 * Inert on touch devices and under prefers-reduced-motion.
 */

import { useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CARD_TILT, CURSOR, EASE, prefersReducedMotion } from './tokens';

gsap.registerPlugin(useGSAP);

type QuickFns = {
  rx: ReturnType<typeof gsap.quickTo>;
  ry: ReturnType<typeof gsap.quickTo>;
  x: ReturnType<typeof gsap.quickTo>;
  y: ReturnType<typeof gsap.quickTo>;
};

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** deg of pitch/yaw at the card edges. */
  maxDeg?: number;
  /** px of translational lean toward the cursor. */
  lean?: number;
};

export function TiltCard({
  children,
  className,
  style,
  maxDeg = CARD_TILT.maxDeg,
  lean = CARD_TILT.lean,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const quick = useRef<QuickFns | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) {
        return; // stays a static card
      }
      gsap.set(el, { transformPerspective: CARD_TILT.perspective });
      const opts = { duration: CURSOR.duration, ease: EASE };
      quick.current = {
        rx: gsap.quickTo(el, 'rotationX', opts),
        ry: gsap.quickTo(el, 'rotationY', opts),
        x: gsap.quickTo(el, 'x', opts),
        y: gsap.quickTo(el, 'y', opts),
      };
    },
    { scope: ref },
  );

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    const q = quick.current;
    if (!el || !q) return;
    const r = el.getBoundingClientRect();
    // Cursor position within the card, −0.5 … 0.5 on each axis.
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    q.rx(ny * -2 * maxDeg); // bottom of card → bottom edge dips away
    q.ry(nx * 2 * maxDeg); //  right of card → right edge dips away
    q.x(nx * 2 * lean);
    q.y(ny * 2 * lean);
  };

  const onPointerLeave = () => {
    const q = quick.current;
    if (!q) return;
    q.rx(0);
    q.ry(0);
    q.x(0);
    q.y(0);
  };

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>
  );
}
