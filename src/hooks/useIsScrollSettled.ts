"use client";

import { useEffect, useState } from "react";

// Fallback only for browsers without native `scrollend` support. Native
// scrollend, where available, is authoritative and always cancels this.
const FALLBACK_SCROLLEND_DEBOUNCE_MS = 150;

/**
 * Tracks whether scrolling has genuinely stopped — not just paused
 * mid-scroll — using native `scrollend` where supported, with a small
 * debounce fallback for browsers without it (older Safari/iOS versions).
 *
 * Deliberately has no timer-driven side effects of its own (no
 * auto-navigation, no countdown) — it only reports a boolean. Whatever
 * uses this decides what to do with that boolean (e.g. fade a reveal in
 * via CSS, let the person tap something themselves). Keeping this hook
 * free of side effects avoids the class of bug an earlier, more
 * ambitious version of this ran into: a timer that fired navigation
 * automatically turned out to be genuinely hard to verify was behaving
 * correctly without hands-on device debugging, so this version doesn't
 * attempt anything time-based beyond detecting the stop itself.
 */
export function useIsScrollSettled(): boolean {
  const [isSettled, setIsSettled] = useState(false);

  useEffect(() => {
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
    let cleanup: (() => void) | undefined;

    const onScroll = () => {
      setIsSettled(false);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      fallbackTimeout = setTimeout(() => {
        setIsSettled(true);
      }, FALLBACK_SCROLLEND_DEBOUNCE_MS);
    };

    const onNativeScrollEnd = () => {
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
      setIsSettled(true);
    };

    // useInfiniteScrollLoop settles the page to its middle repeated copy
    // on mount via a programmatic window.scrollTo — even with an
    // "instant" scroll, browsers still fire a genuine `scrollend` once
    // that position change is applied. Attaching these listeners
    // immediately would catch that initial settle and report the page
    // as "settled" (triggering the full-screen reveal) before the
    // person has scrolled at all. Deferring attachment to the next
    // animation frame lets that initial settle's events fire and be
    // missed first, so this only ever reacts to a later, real scroll.
    const frame = requestAnimationFrame(() => {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("scrollend", onNativeScrollEnd);
      cleanup = () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("scrollend", onNativeScrollEnd);
      };
    });

    return () => {
      cancelAnimationFrame(frame);
      cleanup?.();
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
  }, []);

  return isSettled;
}
