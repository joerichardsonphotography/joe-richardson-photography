"use client";

import { useEffect, useRef } from "react";

/**
 * Makes a repeated block of content (rendered N times by the caller) scroll
 * as if it were infinite, by silently teleporting the scroll position back
 * into the middle band once the user scrolls near the top or bottom edge.
 *
 * The caller is responsible for rendering `repeatCount` copies of the list;
 * this hook only manages the scroll position math. It measures the height of
 * a single copy via `blockRef` (attach it to the first copy) and re-measures
 * on resize.
 */
export function useInfiniteScrollLoop(
  blockRef: React.RefObject<HTMLElement | null>,
  repeatCount: number,
) {
  const isJumping = useRef(false);
  const isTouching = useRef(false);

  useEffect(() => {
    if (repeatCount < 3) return;

    const middleIndex = Math.floor(repeatCount / 2);
    let blockHeight = 0;

    const measure = () => {
      blockHeight = blockRef.current?.offsetHeight ?? 0;
    };

    const settleToMiddle = () => {
      if (!blockHeight) return;
      const middleTop = blockHeight * middleIndex;
      if (Math.abs(window.scrollY - middleTop) < 4) return;
      isJumping.current = true;
      window.scrollTo({ top: middleTop, behavior: "instant" });
      requestAnimationFrame(() => {
        isJumping.current = false;
      });
    };

    const checkBounds = () => {
      if (!blockHeight || isJumping.current) return;
      const y = window.scrollY;
      const maxScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const topGuard = blockHeight * 0.5;
      const bottomGuard = maxScrollY - blockHeight * 0.5;

      let target: number | null = null;
      if (y < topGuard) {
        target = y + blockHeight;
      } else if (y > bottomGuard) {
        target = y - blockHeight;
      }

      if (target !== null && target !== y) {
        isJumping.current = true;
        window.scrollTo({ top: target, behavior: "instant" });
        requestAnimationFrame(() => {
          isJumping.current = false;
        });
      }
    };

    const onScroll = () => {
      if (isTouching.current) return;
      checkBounds();
    };
    const onTouchStart = () => {
      isTouching.current = true;
    };
    const onTouchEnd = () => {
      isTouching.current = false;
      checkBounds();
    };
    const onScrollEnd = () => {
      checkBounds();
    };

    measure();
    settleToMiddle();

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });
    if (blockRef.current) resizeObserver.observe(blockRef.current);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatCount]);
}
