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

// The text column + thumbnail are treated as one composed unit, capped
// at this width and centered in the viewport — rather than each being
// positioned independently relative to the raw viewport edges. Without
// this, on very wide/high-res monitors the text column (previously a
// plain percentage of viewport width, with no upper bound) grew without
// limit and the thumbnail stayed pinned a fixed distance from the
// screen's actual edge, leaving a large, unbalanced gap between the two
// that just grew wider along with the monitor instead of the layout
// ever settling into a composed, intentional-looking arrangement.
//
// This is <main>'s own max-w-[1400px]; note that <main> also has px-8
// padding inside that width, so the text column's actual visual right
// edge sits 32px inside COMPOSITION_MAX_WIDTH_PX/2 from center, not
// exactly at it. The thumbnail's positioning math below doesn't account
// for that 32px, so at the exact width where the cap engages, the two
// can be off by that amount — small enough in practice not to be worth
// the added complexity of threading the padding value through here too,
// but worth knowing about rather than assuming pixel-perfect alignment.
const COMPOSITION_MAX_WIDTH_PX = 1400;
// Both the text column and the thumbnail need to know where the
// composition's own left/right edges fall, in absolute viewport
// coordinates, since the thumbnail is `position: fixed` (portaled to
// document.body to escape the page-transition wrapper's transform — see
// the note below) and so can't simply be laid out as a normal-flow
// sibling of the text inside one shared container the way you would on
// a page without that constraint. This calc expresses "the viewport's
// horizontal center, offset by half the capped composition width" in
// pure CSS, so it tracks the same centering math as the text column's
// own max-w-[1400px] mx-auto without the two ever drifting apart.
const COMPOSITION_HALF_WIDTH_CSS = `min(50vw, ${
  COMPOSITION_MAX_WIDTH_PX / 2
}px)`;

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
      className="pointer-events-none fixed top-1/2 z-20 -translate-y-1/2"
      // Positions the thumbnail's right edge a fixed distance inward
      // from the composition's own right edge (calc(50vw + half-width)
      // is that edge's absolute position from center), rather than a
      // fixed distance from the raw viewport edge — so it moves together
      // with the text column as the composition centers itself, instead
      // of drifting apart from it as the window gets wider.
      style={{
        right: `calc(50vw - ${COMPOSITION_HALF_WIDTH_CSS} + 2vw)`,
      }}
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
            className={`absolute right-0 top-0 aspect-[4/5] w-[26vw] max-w-[420px] -translate-y-1/2 object-cover transition-opacity duration-700 ease-out ${
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

      <main className="relative z-0 mx-auto max-w-[1400px] px-8 pb-28 pt-28">
        <div className="max-w-[58%]">
          {Array.from({ length: REPEAT_COUNT }).map((_, repeatIdx) => (
            <ul
              key={repeatIdx}
              ref={repeatIdx === 0 ? blockRef : undefined}
              aria-hidden={repeatIdx !== Math.floor(REPEAT_COUNT / 2)}
              className="flex flex-col"
            >
              {projects.map((project) => (
                <li
                  key={`${repeatIdx}-${project.id}`}
                  className="leading-[0.9]"
                >
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
                    // text-[5vw] alone had the same unbounded-growth
                    // problem as the old container width: on a very wide
                    // monitor it kept scaling up indefinitely. Capping it
                    // with a CSS clamp (min 2.5rem, scales with viewport
                    // up to 5vw, never exceeding 4.5rem) keeps names
                    // readable and proportioned to the now-capped
                    // composition width instead of ballooning past it.
                    className={`block font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-[#111111] transition-opacity duration-150 hover:opacity-40 active:opacity-40 focus-visible:opacity-40 focus-visible:outline-none [font-size:clamp(2.5rem,5vw,4.5rem)] ${
                      activeProject?.uid === project.uid ? "opacity-40" : ""
                    }`}
                  >
                    {project.data.name}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </main>
    </>
  );
}
