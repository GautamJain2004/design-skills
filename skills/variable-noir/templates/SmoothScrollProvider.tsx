'use client';

/**
 * Damped-lerp smooth scrolling via Lenis, wired into GSAP's ScrollTrigger.
 *
 * Wrap the app once (root layout), outermost of the motion providers:
 *   <SmoothScrollProvider>
 *     <PageTransition>{children}</PageTransition>
 *   </SmoothScrollProvider>
 *
 * Respects prefers-reduced-motion: native scrolling is left untouched and
 * `useLenis()` returns null (consumers must handle both cases).
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { LENIS, prefersReducedMotion } from './tokens';

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);

/** The live Lenis instance, or null (SSR, reduced motion, not yet mounted). */
export const useLenis = () => useContext(LenisContext);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const instance = new Lenis({ lerp: LENIS.lerp });

    // Keep ScrollTrigger in sync and drive Lenis from GSAP's ticker so both
    // systems share one rAF loop.
    instance.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    setLenis(instance);
    return () => {
      gsap.ticker.remove(raf);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}
