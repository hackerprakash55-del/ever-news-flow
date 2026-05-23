import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Premium buttery-smooth scrolling (Awwwards / Studio Freight style).
 * Mounts a single global Lenis instance that takes over wheel + touch scroll
 * with an eased lerp. Native scroll APIs (anchor links, scrollTo, etc.) still
 * work because Lenis hooks into the document scroller.
 */
export function SmoothScroll() {
  useEffect(() => {
    // Respect users who prefer reduced motion — skip smoothing for them.
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      // easeOutExpo — fast start, soft landing. Feels like Apple / Linear / Vercel.
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
