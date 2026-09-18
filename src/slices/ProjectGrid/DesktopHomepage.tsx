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
 * Desktop-only homepage. Deliberately a full, separate component rather
 * than a set of `md:` overrides sharing markup with the mobile version —
 * a past mobile-specific fix (a portal target added to layout.tsx) ended
 * up affecting desktop's stacking order, because both breakpoints shared
 * the same render tree. This component owns its own portal, its own
 * hooks, and its own markup end to end, so nothing mobile does can reach
 * it. Only rendered when the wrapper in ProjectGrid's entry point shows
 * this branch (`hidden md:block`); mobile gets its own sibling component.
 */
export function DesktopHomepage({ projects }: { projects: Project[] }) {
  const blockRef = useRef<HTMLUListElement | null>(null);
  const { activeUid, setActiveUid, isTouch } = useActiveProjectLink();

  // A portal target only exists client-side, so this must render nothing
  // until after mount — otherwise server HTML (nothing) and the client's
  // first-paint HTML (the portaled content) disagree, which is a
  // hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
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
      className="pointer-events-none fixed right-[7vw] top-1/2 z-20 -translate-y-1/2"
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

  return (
    <>
      {/* Portaled to document.body so it stays truly fixed to the
          viewport rather than being repositioned by the page-transition
          wrapper's CSS transform in template.tsx. This portal is entirely
          local to this component — nothing outside it depends on where
          the portal lands, so this can't affect anything else. */}
      {mounted && createPortal(thumbnailPreview, document.body)}

      <main className="relative z-0 max-w-[58%] px-8 pb-28 pt-28">
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
                  className={`block font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-[#111111] transition-opacity duration-150 hover:opacity-40 active:opacity-40 focus-visible:opacity-40 focus-visible:outline-none text-[5vw] ${
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
