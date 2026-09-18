"use client";

import { useEffect, useState } from "react";

const MD_BREAKPOINT_QUERY = "(min-width: 768px)";

/**
 * Tracks whether the viewport matches Tailwind's `md:` breakpoint
 * (768px), so a component can mount exactly one of two variants rather
 * than mounting both and hiding one with CSS. Returns null until the
 * first client-side check runs, so callers can render nothing during
 * that brief window instead of guessing — mounting the wrong variant
 * even briefly would run its hooks and portal logic unnecessarily.
 */
export function useIsDesktop(): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(MD_BREAKPOINT_QUERY);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
