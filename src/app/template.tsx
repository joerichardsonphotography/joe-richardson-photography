"use client";

/**
 * Next.js remounts template.tsx on every navigation (unlike layout.tsx,
 * which persists), so this is where a per-page enter animation belongs.
 * Pure CSS animation — no JS transition library needed, and it degrades
 * gracefully (the animation just doesn't run) if prefers-reduced-motion
 * is set, since that's handled globally in globals.css.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition-enter">{children}</div>;
}
