"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks which project link the user is currently "on" — via real mouse
 * hover on desktop, or via a fixed reading-line point on touch devices,
 * so a preview thumbnail can follow along as the list scrolls underneath it.
 *
 * Elements must expose the project uid via `data-project-uid`.
 */
export function useActiveProjectLink() {
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const pointerPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setIsTouch(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // Touch / coarse-pointer: sample a fixed reading line as the page scrolls.
  useEffect(() => {
    if (!isTouch) return;

    const readAtLine = () => {
      const x = Math.max(12, window.innerWidth * 0.2);
      const y = window.innerHeight * 0.45;
      const uid =
        document
          .elementFromPoint(x, y)
          ?.closest<HTMLElement>("[data-project-uid]")
          ?.dataset.projectUid ?? null;
      setActiveUid((current) => (current === uid ? current : uid));
    };

    // Deliberately no initial readAtLine() call here — on load, before
    // any scroll, this should report no active project at all (the
    // mobile homepage shows the plain grey list with no thumbnail then).
    // Calling it immediately on mount would resolve whatever project
    // happens to sit at the reading line at the initial scroll position
    // (which useInfiniteScrollLoop sets to its middle repeated copy),
    // showing a thumbnail before the person has done anything.
    window.addEventListener("scroll", readAtLine, { passive: true });
    window.addEventListener("resize", readAtLine);
    return () => {
      window.removeEventListener("scroll", readAtLine);
      window.removeEventListener("resize", readAtLine);
    };
  }, [isTouch]);

  // Fine pointer: track real cursor position, re-resolve on scroll so the
  // preview stays in sync with whatever is now under the cursor.
  useEffect(() => {
    if (isTouch) return;

    const onMove = (e: PointerEvent) => {
      pointerPos.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      pointerPos.current = null;
      setActiveUid(null);
    };
    const resolveFromPointer = () => {
      const pos = pointerPos.current;
      if (!pos) return;
      const uid =
        document
          .elementFromPoint(pos.x, pos.y)
          ?.closest<HTMLElement>("[data-project-uid]")
          ?.dataset.projectUid ?? null;
      setActiveUid((current) => (current === uid ? current : uid));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", resolveFromPointer, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", resolveFromPointer);
    };
  }, [isTouch]);

  return {
    activeUid,
    setActiveUid,
    isTouch,
  };
}
