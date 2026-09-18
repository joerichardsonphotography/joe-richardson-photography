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

export function ProjectGridClient({ projects }: { projects: Project[] }) {
  const blockRef = useRef<HTMLUListElement | null>(null);
  const { activeUid, setActiveUid, isTouch } = useActiveProjectLink();

  // The thumbnail preview is portaled straight into document.body so it
  // escapes the page-transition wrapper's transform (see note below). A
  // portal target only exists client-side, so this must render nothing
  // until after mount — otherwise server HTML (nothing) and the client's
  // first-paint HTML (the portaled content) disagree, which is a
  // hydration mismatch. Gating on mounted, rather than `typeof document`,
  // keeps the client's *first* render identical to the server's.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Detecting client mount for a portal target is exactly what this
    // pattern is for; there's no external system to synchronize with here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useInfiniteScrollLoop(blockRef, REPEAT_COUNT);

  // Mobile has no hover state to hint that the list scrolls/loops, unlike
  // desktop where hovering a name immediately shows a preview. This fades
  // out a small "more below" cue after the first scroll, mobile-only.
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

  // Desktop-only side thumbnail: cross-fades between each project's cover
  // image, positioned to the right of the text column and following the
  // hovered name.
  const thumbnailPreview = (
    <div
      aria-hidden
      className="pointer-events-none fixed right-[7vw] top-1/2 z-20 hidden -translate-y-1/2 md:block"
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
            sizes="32vw"
            className={`absolute right-0 top-0 aspect-[4/5] w-[32vw] max-w-[520px] -translate-y-1/2 object-cover transition-opacity duration-700 ease-out ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />
        );
      })}
    </div>
  );

  // Mobile only: a full-screen backdrop that crossfades between each
  // project's cover image as the reading line moves, rather than the
  // small side thumbnail desktop uses (there's no room for that plus a
  // readable text column on a phone). Sits behind the text; a light
  // gradient (readingLineGradient, below) keeps black type legible near
  // the reading line while the rest of the photo stays fully visible.
  const mobileBackdrop = (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 md:hidden">
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
            sizes="100vw"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />
        );
      })}
    </div>
  );

  // Mobile-only light gradient, fixed to the viewport around the
  // reading-line zone (where useActiveProjectLink samples ~45vh), so
  // black text stays legible there while the photo backdrop remains
  // visible everywhere else on screen — deliberately not a solid panel,
  // since that would hide the photo almost entirely. Portaled like the
  // other fixed overlays so it isn't affected by the page-transition
  // transform on <main> (see note on thumbnailPreview above).
  const readingLineGradient = (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-[28vh] z-[5] h-[34vh] bg-gradient-to-b from-transparent via-[#FAFAF8]/85 to-transparent md:hidden"
    />
  );

  const scrollHint = (
    <div
      aria-hidden
      className={`pointer-events-none fixed bottom-20 left-1/2 z-20 -translate-x-1/2 transition-opacity duration-1000 md:hidden ${
        hasScrolled ? "opacity-0" : "opacity-100"
      }`}
    >
      <svg
        width="20"
        height="12"
        viewBox="0 0 20 12"
        fill="none"
        className="animate-bounce"
      >
        <path
          d="M1 1L10 10L19 1"
          stroke="#B5241C"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  return (
    <>
      {/* Rendered via portal directly into document.body so it stays truly
          fixed to the viewport. Without this, the page-transition wrapper
          in template.tsx applies a CSS transform to its animated container,
          and any `position: fixed` descendant of a transformed element is
          repositioned relative to that ancestor instead of the viewport —
          which made this thumbnail drift during the enter animation. Only
          portals once mounted client-side to avoid a hydration mismatch. */}
      {mounted && createPortal(thumbnailPreview, document.body)}
      {mounted && createPortal(mobileBackdrop, document.body)}
      {mounted && createPortal(readingLineGradient, document.body)}
      {mounted && createPortal(scrollHint, document.body)}

      <main className="relative z-10 max-w-full px-4 pb-28 pt-20 md:max-w-[58%] md:px-8 md:pt-28">
        {Array.from({ length: REPEAT_COUNT }).map((_, repeatIdx) => (
          <ul
            key={repeatIdx}
            ref={repeatIdx === 0 ? blockRef : undefined}
            aria-hidden={repeatIdx !== Math.floor(REPEAT_COUNT / 2)}
            className="relative z-10 flex flex-col"
          >
            {projects.map((project) => (
              <li key={`${repeatIdx}-${project.id}`} className="leading-[0.9]">
                <Link
                  href={`/project/${project.uid}`}
                  data-project-uid={project.uid}
                  onMouseEnter={() => !isTouch && setActiveUid(project.uid)}
                  onMouseLeave={() =>
                    !isTouch &&
                    setActiveUid((current) =>
                      current === project.uid ? null : current,
                    )
                  }
                  onFocus={() => setActiveUid(project.uid)}
                  className={`block font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-[#111111] transition-opacity duration-150 hover:opacity-40 active:opacity-40 focus-visible:opacity-40 focus-visible:outline-none text-[10.5vw] md:text-[5vw] ${
                    activeProject?.uid === project.uid ? "opacity-40" : ""
                  }`}
                >
                  {project.data.name}
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </main>
    </>
  );
}
