"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SETTLE_DELAY_MS = 2000;
// Used only as a fallback on browsers without native `scrollend` support
// (older Safari/iOS versions still in use). Native scrollend is preferred
// where available since it reflects a genuine, browser-verified stop
// rather than an approximation.
const FALLBACK_SCROLLEND_DEBOUNCE_MS = 150;

/**
 * Mobile-only auto-navigation: once scrolling has fully stopped (not just
 * paused mid-scroll) while a project name is "active" under the reading
 * line, waits SETTLE_DELAY_MS and then navigates to that project.
 *
 * Deliberately gated on a genuine scroll-stop rather than continuous dwell
 * time — the underlying activeUid updates on every scroll frame, so if this
 * fired from dwell time alone, casually scrolling past a name while
 * browsing toward a different one further down the list would trigger an
 * unwanted navigation. Requiring the scroll to actually end first means a
 * still-moving read of a name (someone in transit toward another project)
 * never starts the countdown; only a genuine stop does.
 *
 * Returns whether the reveal state (text hidden, image full-screen) should
 * currently be shown, so the caller can drive its own fade transition.
 */
export function useSettleAndNavigate(
  activeUid: string | null,
  isTouch: boolean,
  getHref: (uid: string) => string | null,
) {
  const router = useRouter();
  const [isRevealed, setIsRevealed] = useState(false);
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const revealedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isTouch) return;

    const clearPending = () => {
      if (navigateTimeoutRef.current) {
        clearTimeout(navigateTimeoutRef.current);
        navigateTimeoutRef.current = null;
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
      if (isRevealed) {
        setIsRevealed(false);
      }
      revealedUidRef.current = null;
    };

    // Fires once scrolling has genuinely finished — either the browser's
    // native scrollend, or (on browsers without it) the fallback debounce
    // below settling with no further scroll events.
    const onSettled = () => {
      if (!activeUid) return;
      const href = getHref(activeUid);
      if (!href) return;

      revealedUidRef.current = activeUid;
      setIsRevealed(true);

      navigateTimeoutRef.current = setTimeout(() => {
        // Only navigate if the same project is still the settled one —
        // guards against a stale timeout firing after the user moved on.
        if (revealedUidRef.current === activeUid) {
          router.push(href);
        }
      }, SETTLE_DELAY_MS);
    };

    // A fresh scroll happening at all means the user is still moving, so
    // cancel any pending reveal/navigation immediately, then arm the
    // fallback debounce in case this browser has no native scrollend.
    const onScroll = () => {
      clearPending();
      fallbackTimeoutRef.current = setTimeout(
        onSettled,
        FALLBACK_SCROLLEND_DEBOUNCE_MS,
      );
    };

    // Native scrollend, where supported, is authoritative: cancel the
    // fallback debounce so onSettled never runs twice for one stop.
    const onNativeScrollEnd = () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
      onSettled();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onNativeScrollEnd);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onNativeScrollEnd);
      clearPending();
    };
  }, [isTouch, activeUid, getHref, router, isRevealed]);

  return isRevealed;
}
