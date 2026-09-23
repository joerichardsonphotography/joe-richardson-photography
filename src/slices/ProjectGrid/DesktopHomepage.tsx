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

// The composition (text column + thumbnail together) should behave
// exactly like the original, uncapped layout — full-bleed, scaling with
// the viewport — on any screen up to this width, which comfortably
// covers ordinary laptop displays. Only beyond it does the composition
// stop growing and start centering itself, which is specifically for
// large external monitors (1440p, 4K, ultrawide) where letting a
// percentage-based layout keep scaling forever produced enormous text
// and a lopsided gap of empty space on one side rather than a
// deliberately composed, centered arrangement. A single fixed max-width
// applied too aggressively (an earlier version of this fix used 1400px
// as a hard cap engaging via `min(50vw, 700px)`, which — since many
// ordinary laptops are narrower than 1400px — ended up squeezing and
// centering the layout even on completely normal-sized screens) is
// exactly what this threshold avoids: below it, every value here
// resolves to its uncapped, viewport-relative form.
const NORMAL_VIEWPORT_MAX_PX = 1800;
// clamp(min, preferred, max) naturally gives "grows with the viewport up
// to a point, then holds steady" for free: below NORMAL_VIEWPORT_MAX_PX
// the `preferred` (vw-based) value governs and this resolves to the
// same shape the original, uncapped 58%-of-viewport layout had; beyond
// it, `max` takes over and holds the composition at exactly the width
// it would have had at that threshold, rather than continuing to grow.
const MAIN_MAX_WIDTH_CSS = `clamp(0px, 100vw, ${NORMAL_VIEWPORT_MAX_PX}px)`;
const TEXT_COLUMN_MAX_WIDTH_CSS = `clamp(0px, 58vw, ${
  NORMAL_VIEWPORT_MAX_PX * 0.58
}px)`;
// Both the text column and the thumbnail need to know where the
// composition's own right edge falls, in absolute viewport coordinates,
// since the thumbnail is `position: fixed` (portaled to document.body to
// escape the page-transition wrapper's transform — see the note below)
// and so can't simply be laid out as a normal-flow sibling of the text
// inside one shared container the way you would on a page without that
// constraint. This mirrors MAIN_MAX_WIDTH_CSS's own clamp so the two
// track the same growth-then-plateau shape without ever drifting apart.
const COMPOSITION_HALF_WIDTH_CSS = `clamp(0px, 50vw, ${
  NORMAL_VIEWPORT_MAX_PX / 2
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
            className={`absolute right-0 top-0 aspect-[4/5] w-[26vw] max-w-[468px] -translate-y-1/2 object-cover transition-opacity duration-700 ease-out ${
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

      <main
        className="relative z-0 mx-auto px-8 pb-28 pt-28"
        style={{ width: MAIN_MAX_WIDTH_CSS }}
      >
        <div style={{ width: TEXT_COLUMN_MAX_WIDTH_CSS }}>
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
                    // problem the composition width had: on a very wide
                    // monitor it kept scaling up indefinitely. This clamp
                    // mirrors NORMAL_VIEWPORT_MAX_PX above — 5vw at that
                    // threshold works out to 5.625rem, so the max here
                    // matches where the rest of the composition also
                    // plateaus, rather than an independently-chosen value
                    // that could cap out earlier or later than everything
                    // else and visually decouple from it.
                    className={`block font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-[#111111] transition-opacity duration-150 hover:opacity-40 active:opacity-40 focus-visible:opacity-40 focus-visible:outline-none [font-size:clamp(2.5rem,5vw,5.625rem)] ${
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
