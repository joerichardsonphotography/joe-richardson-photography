"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Resets scroll position to the top on every route change. Placed once in
 * the root layout so every page benefits, rather than adding this to each
 * page individually (which is easy to forget on new pages, as happened
 * with /about and /contact).
 *
 * The homepage manually drives window.scrollY for its infinite-scroll
 * loop, so the browser's native scroll-restoration isn't reliable here —
 * without this, navigating away from a scrolled-down homepage (or any
 * other page) leaves the next page opening mid-scroll, cutting off its
 * heading and top padding.
 */
export function ScrollToTopOnNavigate() {
  const pathname = usePathname();

  useEffect(() => {
    // The homepage positions its own scroll (middle of the looped list) via
    // useInfiniteScrollLoop; resetting to 0 here would fight that on every
    // navigation back to "/".
    if (pathname === "/") return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
