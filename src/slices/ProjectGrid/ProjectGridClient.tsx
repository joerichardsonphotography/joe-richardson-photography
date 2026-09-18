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

  // Desktop-only scroll-snap: each name becomes a full-viewport-height
  // snap point (see the `md:snap-center` list items below), so scrolling
  // without a specific hover target settles on whichever name ends up
  // nearest center — hovering a name additionally scrolls it there
  // directly (see each Link's onMouseEnter). Scoped to a class toggled
  // on <html> only while this component is mounted, so no other page
  // ever inherits scroll-snap behavior.
  useEffect(() => {
    document.documentElement.classList.add("homepage-snap-scroll");
    return () => {
      document.documentElement.classList.remove("homepage-snap-scroll");
    };
  }, []);

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

  // Desktop-only: instead of the small side thumbnail, the active
  // project's cover image sits directly behind the text list, filling a
  // wide band through the center of the screen. Text greys out by default
  // (desktopInactive below) and turns solid black only for the hovered
  // name, so the photo underneath and the "in focus" name read together.
  const desktopBackdrop = (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 hidden items-center justify-center md:flex"
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
            sizes="45vw"
            className={`absolute aspect-[4/5] w-[38vw] max-w-[560px] object-cover transition-opacity duration-700 ease-out ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />
        );
      })}
    </div>
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
      {mounted && createPortal(desktopBackdrop, document.body)}
      {mounted && createPortal(scrollHint, document.body)}

      <main className="relative z-10 flex max-w-[54%] flex-col px-4 pb-28 pt-20 md:max-w-none md:px-8 md:py-0">
        {Array.from({ length: REPEAT_COUNT }).map((_, repeatIdx) => (
          <ul
            key={repeatIdx}
            ref={repeatIdx === 0 ? blockRef : undefined}
            aria-hidden={repeatIdx !== Math.floor(REPEAT_COUNT / 2)}
            className="flex flex-col md:items-center"
          >
            {projects.map((project) => (
              <li
                key={`${repeatIdx}-${project.id}`}
                className="leading-[0.9] md:flex md:h-screen md:snap-center md:items-center md:justify-center md:leading-none"
              >
                <Link
                  href={`/project/${project.uid}`}
                  data-project-uid={project.uid}
                  onMouseEnter={(e) => {
                    if (isTouch) return;
                    setActiveUid(project.uid);
                    e.currentTarget.scrollIntoView({
                      block: "center",
                      behavior: "smooth",
                    });
                  }}
                  onMouseLeave={() =>
                    !isTouch &&
                    setActiveUid((current) =>
                      current === project.uid ? null : current,
                    )
                  }
                  onFocus={() => setActiveUid(project.uid)}
                  className={`block font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-[#111111] transition-all duration-150 focus-visible:outline-none text-[10.5vw] md:text-[5vw] ${
                    activeProject?.uid === project.uid
                      ? "md:text-[#111111]"
                      : "md:text-[#111111]/25"
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
