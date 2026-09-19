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

    // Deliberately no initial readAtLine() call, and the scroll listener
    // itself isn't attached until a genuine touch/wheel/pointerdown has
    // happened — on load, before any real interaction, this should
    // report no active project at all (the mobile homepage shows the
    // plain grey list with no thumbnail then). A plain scroll listener
    // attached immediately (or even just deferred by a frame) would
    // still catch two things that aren't real user scrolling but fire
    // ordinary `scroll` events regardless: useInfiniteScrollLoop's own
    // initial programmatic settle, and — confirmed in practice — iOS
    // Safari's address-bar auto-hide shortly after load. Gating on an
    // actual touch/wheel/pointerdown first is the one signal that's
    // reliably tied to genuine user intent rather than either of those.
    let hasInteracted = false;
    let cleanupScroll: (() => void) | undefined;
    const armScrollListener = () => {
      if (hasInteracted) return;
      hasInteracted = true;
      window.addEventListener("scroll", readAtLine, { passive: true });
      cleanupScroll = () =>
        window.removeEventListener("scroll", readAtLine);
    };

    window.addEventListener("touchstart", armScrollListener, {
      passive: true,
      once: true,
    });
    window.addEventListener("wheel", armScrollListener, {
      passive: true,
      once: true,
    });
    window.addEventListener("pointerdown", armScrollListener, {
      passive: true,
      once: true,
    });
    window.addEventListener("resize", readAtLine);

    return () => {
      window.removeEventListener("touchstart", armScrollListener);
      window.removeEventListener("wheel", armScrollListener);
      window.removeEventListener("pointerdown", armScrollListener);
      window.removeEventListener("resize", readAtLine);
      cleanupScroll?.();
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
