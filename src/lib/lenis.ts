import type Lenis from "lenis";

/**
 * Module-level Lenis singleton so any component (e.g. the Act 4 email
 * button) can imperatively scroll/reset without prop-drilling.
 */
let lenisInstance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  lenisInstance = l;
}

export function getLenis() {
  return lenisInstance;
}

/** Smoothly scroll to a target (default: top, 0). */
export function scrollToTop(duration = 1.6) {
  const l = getLenis();
  if (l) {
    l.scrollTo(0, { duration });
  } else if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
