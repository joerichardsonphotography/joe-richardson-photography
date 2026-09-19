"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const SETTLE_DELAY_MS = 3000;
// Fallback only for browsers without native `scrollend` support. Native
// scrollend, where available, is authoritative and always cancels this.
const FALLBACK_SCROLLEND_DEBOUNCE_MS = 150;

/**
 * Mobile-only auto-navigation: once scrolling has fully stopped (not just
 * paused mid-scroll) while a project name is "active", waits
 * SETTLE_DELAY_MS and then navigates to that project.
 *
 * Deliberately gated on a genuine scroll-stop rather than continuous dwell
 * time — activeUid updates on every scroll frame, so firing from dwell
 * time alone would mean casually scrolling past a name while browsing
 * toward a different one further down the list could trigger an unwanted
 * navigation. Requiring the scroll to actually end first means a
 * still-moving read of a name never starts the countdown; only a genuine
 * stop does.
 *
 * Returns whether the reveal state (text hidden, image full-screen)
 * should currently be shown, so the caller can drive its own fade.
 */
export function useSettleAndNavigate(
  activeUid: string | null,
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

    const onSettled = () => {
      if (!activeUid) return;
      const href = getHref(activeUid);
      if (!href) return;

      revealedUidRef.current = activeUid;
      setIsRevealed(true);

      navigateTimeoutRef.current = setTimeout(() => {
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
  }, [activeUid, getHref, router, isRevealed]);

  return isRevealed;
}
