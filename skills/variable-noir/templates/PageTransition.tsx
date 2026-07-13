'use client';

/**
 * SPA page transitions for the Next.js App Router, with hover preload.
 *
 * `PageTransition` renders a fixed overlay in the page background color.
 * `TransitionLink` (use instead of next/link for internal navigation):
 *   - prefetches the route on hover (hover preload),
 *   - on click, wipes the overlay up over the page (house ease, 0.5s),
 *     navigates behind it, scrolls to top, then lifts the overlay away.
 *
 * Wiring (root layout), inside SmoothScrollProvider:
 *   <SmoothScrollProvider>
 *     <PageTransition>{children}</PageTransition>
 *     <DampedCursor />
 *   </SmoothScrollProvider>
 *
 * Falls back to instant navigation under prefers-reduced-motion.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import gsap from 'gsap';
import { COLORS, DURATION, EASE, prefersReducedMotion } from './tokens';
import { useLenis } from './SmoothScrollProvider';

const TransitionContext = createContext<{ navigate: (href: string) => void }>({
  navigate: () => {},
});

export const usePageTransition = () => useContext(TransitionContext);

export function PageTransition({ children }: { children: ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const covering = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();

  // Cover: wipe the overlay up over the page, then navigate behind it.
  const navigate = useCallback(
    (href: string) => {
      const overlay = overlayRef.current;
      if (!overlay || covering.current || prefersReducedMotion()) {
        router.push(href);
        return;
      }
      covering.current = true;
      gsap.fromTo(
        overlay,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: DURATION.md,
          ease: EASE,
          onComplete: () => router.push(href),
        },
      );
    },
    [router],
  );

  // Reveal: the new route rendered — jump to top and lift the overlay away.
  useEffect(() => {
    if (!covering.current) return;
    covering.current = false;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    gsap.to(overlayRef.current, {
      yPercent: -100,
      duration: DURATION.md,
      ease: EASE,
      onComplete: () => gsap.set(overlayRef.current, { yPercent: 100 }),
    });
  }, [pathname, lenis]);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <div
        ref={overlayRef}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: COLORS.background,
          transform: 'translateY(100%)',
          zIndex: 9998,
          pointerEvents: 'none',
        }}
      />
    </TransitionContext.Provider>
  );
}

type TransitionLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
};

export function TransitionLink({
  href,
  onClick,
  onMouseEnter,
  ...rest
}: TransitionLinkProps) {
  const { navigate } = usePageTransition();
  const router = useRouter();
  const pathname = usePathname();

  const handleMouseEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    router.prefetch(href); // hover preload
    onMouseEnter?.(e);
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    // Let modified clicks (new tab etc.) and same-page links behave natively.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (href === pathname) return;
    e.preventDefault();
    navigate(href);
  };

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      {...rest}
    />
  );
}
