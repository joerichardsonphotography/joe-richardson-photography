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
    let hasInteracted = false;
    let cleanupScroll: (() => void) | undefined;

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

    // Neither useInfiniteScrollLoop's own initial programmatic scrollTo
    // NOR iOS Safari's address-bar auto-hide on load are genuine user
    // scrolling, but both fire real `scroll`/`scrollend` events — with
    // no reliable way to tell them apart from those events alone (a
    // requestAnimationFrame-based defer, tried previously, only closes
    // the gap for the former; Safari's chrome can hide on its own
    // timeline, not tied to one frame after mount, and was confirmed to
    // slip through that defer in practice). What's reliably different
    // is that only an actual user action starts with a touch, click, or
    // wheel — so this only starts listening for scroll/scrollend at all
    // once one of those has genuinely happened first.
    const armScrollListeners = () => {
      if (hasInteracted) return;
      hasInteracted = true;
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("scrollend", onNativeScrollEnd);
      cleanupScroll = () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("scrollend", onNativeScrollEnd);
      };
    };

    window.addEventListener("touchstart", armScrollListeners, {
      passive: true,
      once: true,
    });
    window.addEventListener("wheel", armScrollListeners, {
      passive: true,
      once: true,
    });
    window.addEventListener("pointerdown", armScrollListeners, {
      passive: true,
      once: true,
    });

    return () => {
      window.removeEventListener("touchstart", armScrollListeners);
      window.removeEventListener("wheel", armScrollListeners);
      window.removeEventListener("pointerdown", armScrollListeners);
      cleanupScroll?.();
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
  }, []);

  return isSettled;
}
