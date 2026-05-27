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
    // Smooth-scroll disabled — it was intercepting input and causing the page
    // to feel frozen/unclickable on some browsers. Fall back to native scroll.
    return;
  }, []);

  return null;
}
