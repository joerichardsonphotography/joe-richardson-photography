/**
 * Resolves which project link element currently sits at the fixed touch
 * "reading line" point (used on mobile in place of real hover). Shared
 * between useActiveProjectLink (which drives the visible active/grey
 * state) and useSettleAndNavigate (which needs to independently confirm
 * what's active at the exact moment scrolling stops) so the two never
 * disagree about where that point is.
 *
 * Uses elementsFromPoint (plural), not elementFromPoint, and searches the
 * whole returned stack rather than just the topmost hit. The full-screen
 * reveal overlay (see MobileHomepage) sits directly over this same point
 * once shown, and while it has pointer-events: none for real clicks,
 * elementFromPoint still reports the topmost element in the stack
 * regardless of that CSS property — it would return the overlay's own
 * div, not the link underneath. Searching the full stack for the first
 * project-uid match skips over any such overlay automatically, without
 * needing to know about it here.
 */
export function readProjectUidAtReadingLine(): string | null {
  const x = Math.max(12, window.innerWidth * 0.2);
  const y = window.innerHeight * 0.45;
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    const uid = el.closest<HTMLElement>("[data-project-uid]")?.dataset
      .projectUid;
    if (uid) return uid;
  }
  return null;
}
