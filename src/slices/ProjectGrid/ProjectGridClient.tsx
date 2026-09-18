"use client";

import { Content } from "@prismicio/client";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { DesktopHomepage } from "./DesktopHomepage";
import { MobileHomepage } from "./MobileHomepage";

type Project = Content.ProjectDocument;

/**
 * Thin dispatcher: mounts exactly one of DesktopHomepage or
 * MobileHomepage, never both. Each owns its own hooks (scroll loop,
 * active-project tracking) and its own portal to document.body — running
 * both simultaneously (even with one CSS-hidden) would mean two
 * scroll-loop instances fighting over window.scrollY and two portaled
 * DOM trees competing for the same space, so exactly one is mounted
 * based on actual viewport width instead.
 *
 * useIsDesktop returns null until the first client-side check completes;
 * this renders nothing during that brief window rather than guessing,
 * since mounting the wrong variant even briefly would run its effects
 * needlessly. In practice this window is a handful of milliseconds after
 * hydration — the multi-second data-fetch gap is already covered by
 * app/loading.tsx, which is unrelated to this.
 */
export function ProjectGridClient({ projects }: { projects: Project[] }) {
  const isDesktop = useIsDesktop();

  if (isDesktop === null) return null;

  return isDesktop ? (
    <DesktopHomepage projects={projects} />
  ) : (
    <MobileHomepage projects={projects} />
  );
}
