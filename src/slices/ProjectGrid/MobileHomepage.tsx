"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PrismicNextImage } from "@prismicio/next";
import { Content, isFilled } from "@prismicio/client";
import { useInfiniteScrollLoop } from "@/hooks/useInfiniteScrollLoop";
import { useActiveProjectLink } from "@/hooks/useActiveProjectLink";

type Project = Content.ProjectDocument;

const REPEAT_COUNT = 5;

/**
 * Mobile-only homepage: full-width grey text list, with the active
 * project's name turning solid black and its cover image appearing
 * centered on screen behind the text.
 *
 * Deliberately a full, separate component rather than sharing markup
 * with DesktopHomepage via `md:` overrides — that approach previously
 * caused a real bug: a portal target this component needed had to be
 * added to layout.tsx (shared by both breakpoints), and once the
 * page-transition wrapper's CSS transform created a new stacking
 * context, desktop's own z-index stopped reliably out-ranking content
 * portaled there. This version portals straight to document.body (same
 * as the desktop component does, independently) and relies on paint
 * order plus its own z-index scoped entirely within this component's
 * own tree — nothing here writes into layout.tsx or any file desktop
 * depends on, so nothing here can affect desktop again.
 */
export function MobileHomepage({ projects }: { projects: Project[] }) {
  const blockRef = useRef<HTMLUListElement | null>(null);
  const { activeUid } = useActiveProjectLink();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useInfiniteScrollLoop(blockRef, REPEAT_COUNT);

  const [hasScrolled, setHasScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setHasScrolled(true);
    };
    window.addEventListener("scroll", onScroll, {
      passive: true,
      once: true,
    });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeProject = projects.find((p) => p.uid === activeUid) ?? null;

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-6 text-center">
        <p className="max-w-sm text-sm leading-relaxed text-[#8C8C86]">
          No projects yet. Add a Project document in Prismic and it will
          appear here automatically.
        </p>
      </div>
    );
  }

  // Centered backdrop image, one per project, cross-fading based on which
  // is under the touch reading line. Sits behind the text purely through
  // paint order (portaled ahead of the text list below, both direct
  // children of the same fragment) plus its own z-0, not through any
  // cross-file stacking-context workaround.
  const backdropImage = (
    <div
      aria-hidden
      className="pointer-events-none fixed left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
    >
      {projects.map((project) => {
        const isActive = project.uid === activeProject?.uid;
        const cover = project.data.cover_image;
        const firstGalleryImage = project.data.gallery?.[0]?.image;
        const image = isFilled.image(cover) ? cover : firstGalleryImage;

        if (!isFilled.image(image)) return null;

        return (
          <PrismicNextImage
            key={project.id}
            field={image}
            fallbackAlt=""
            sizes="55vw"
            className={`absolute left-1/2 top-1/2 aspect-[4/5] w-[55vw] max-w-[380px] -translate-x-1/2 -translate-y-1/2
cat > src/slices/ProjectGrid/ProjectGridClient.tsx << 'PRISMIC_EOF'
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
