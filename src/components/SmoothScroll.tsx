import { useEffect } from "react";

/**
 * Premium buttery-smooth scrolling (Awwwards / Studio Freight style).
 * Mounts a single global Lenis instance that takes over wheel + touch scroll
 * with an eased lerp. Native scroll APIs (anchor links, scrollTo, etc.) still
 * work because Lenis hooks into the document scroller.
 */
export function SmoothScroll() {
  useEffect(() => {
    // Smooth-scroll is disabled. Also clean up any Lenis classes/styles left by
    // hot reload so they cannot keep the page locked or intercepting input.
    document.documentElement.classList.remove("lenis", "lenis-smooth", "lenis-stopped", "lenis-scrolling");
    document.body.classList.remove("lenis", "lenis-smooth", "lenis-stopped", "lenis-scrolling");
    document.documentElement.style.removeProperty("overflow");
    document.body.style.removeProperty("overflow");
    return;
  }, []);

  return null;
}
