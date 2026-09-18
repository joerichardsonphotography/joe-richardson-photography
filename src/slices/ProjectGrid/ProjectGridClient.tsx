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

  const thumbnailPreview = (
    <div
      aria-hidden
      className="pointer-events-none fixed right-[4vw] top-[28vh] z-20 md:right-[7vw] md:top-1/2 md:-translate-y-1/2"
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
            className={`absolute right-0 top-0 aspect-[4/5] w-[38vw] max-w-[440px] object-cover transition-opacity duration-300 ease-out md:w-[32vw] md:max-w-[520px] md:-translate-y-1/2 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />
        );
      })}
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

      <main className="relative z-0 max-w-[54%] px-4 pb-28 pt-20 md:max-w-[58%] md:px-8 md:pt-28">
        {Array.from({ length: REPEAT_COUNT }).map((_, repeatIdx) => (
          <ul
            key={repeatIdx}
            ref={repeatIdx === 0 ? blockRef : undefined}
            aria-hidden={repeatIdx !== Math.floor(REPEAT_COUNT / 2)}
            className="flex flex-col"
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
                  className={`block font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-[#111111] transition-opacity duration-150 hover:opacity-40 focus-visible:opacity-40 focus-visible:outline-none text-[10.5vw] md:text-[5vw] ${
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
