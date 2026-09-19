"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { PrismicNextImage } from "@prismicio/next";
import { Content, isFilled } from "@prismicio/client";
import { useInfiniteScrollLoop } from "@/hooks/useInfiniteScrollLoop";
import { useActiveProjectLink } from "@/hooks/useActiveProjectLink";
import { useIsScrollSettled } from "@/hooks/useIsScrollSettled";

type Project = Content.ProjectDocument;

const REPEAT_COUNT = 5;

/**
 * Mobile-only homepage: full-width grey text list, with the active
 * project's name turning solid black and its cover image appearing
 * centered behind the text. Once scrolling genuinely stops, that image
 * grows into a large, tappable centerpiece and the text dims (but stays
 * visible) around it; scrolling again immediately reverts both.
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
    // useInfiniteScrollLoop settles the page to its middle repeated copy
    // on mount via a programmatic window.scrollTo — which fires a real
    // native `scroll` event, indistinguishable from a genuine user
    // scroll. Attaching this listener immediately would catch that
    // initial settle and mark hasScrolled true before anyone has
    // actually touched the page, hiding "Scroll to explore" on load
    // when it should always show there. Deferring attachment to the
    // next animation frame lets that initial settle finish first, so
    // this only ever catches a real, later scroll.
    let cleanup: (() => void) | undefined;
    const frame = requestAnimationFrame(() => {
      const onScroll = () => {
        setHasScrolled(true);
      };
      window.addEventListener("scroll", onScroll, {
        passive: true,
        once: true,
      });
      cleanup = () => window.removeEventListener("scroll", onScroll);
    });
    return () => {
      cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, []);

  const activeProject = projects.find((p) => p.uid === activeUid) ?? null;

  // Once scrolling genuinely stops (not just pauses mid-scroll), the
  // active project's image grows into a large, tappable centerpiece and
  // the text list dims to a low opacity around it — rather than
  // disappearing entirely, so there's always some context on screen.
  // Deliberately no auto-navigation or timer here: the person taps the
  // image themselves when they want to open that project, and scrolling
  // again immediately fades the list back in and shrinks the image back
  // down. See useIsScrollSettled for why this hook has no side effects
  // of its own beyond reporting the boolean.
  const isSettled = useIsScrollSettled();

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
  // is under the touch reading line. Normally sits behind the text
  // purely through paint order (portaled ahead of the text list below,
  // both direct children of the same fragment) plus its own z-0 — but
  // once scrolling settles, the active image needs to become tappable,
  // which means it has to rise above the text in stacking order for
  // that state specifically (z-30, above main's z-10), while the text
  // list gets pointer-events-none in that same state so taps pass
  // through to the image rather than being caught by an invisible link
  // still sitting on top of it. Growing the same element rather than
  // swapping in a separate "revealed" element keeps the transition to
  // and from the settled state a single smooth resize, not a cross-fade
  // between two different images.
  const backdropImage = (
    <div
      aria-hidden={!isSettled}
      className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
        isSettled ? "z-30" : "z-0"
      }`}
    >
      {projects.map((project) => {
        const isActive = project.uid === activeProject?.uid;
        const isSettledActive = isActive && isSettled;
        const cover = project.data.cover_image;
        const firstGalleryImage = project.data.gallery?.[0]?.image;
        const image = isFilled.image(cover) ? cover : firstGalleryImage;

        if (!isFilled.image(image)) return null;

        const imageEl = (
          <PrismicNextImage
            field={image}
            fallbackAlt=""
            sizes="(min-width: 0px) 82vw, 55vw"
            className={`absolute left-1/2 top-1/2 aspect-[4/5] -translate-x-1/2 -translate-y-1/2 object-cover transition-[opacity,width] duration-700 ease-out ${
              isSettledActive
                ? "w-[82vw] max-w-[520px]"
                : "w-[55vw] max-w-[380px]"
            } ${isActive ? "opacity-100" : "opacity-0"}`}
          />
        );

        // Only the settled, active image is ever interactive — every
        // other state of this element is `pointer-events-none` so it
        // never intercepts taps meant for the text list underneath
        // while it's still just a passive backdrop.
        return isSettledActive ? (
          <Link
            key={project.id}
            href={`/project/${project.uid}`}
            aria-label={`Open ${project.data.name}`}
            className="contents"
          >
            {imageEl}
            {/* Small label confirming the image is tappable, not just a
                decorative photo — without this, nothing on screen signals
                that the enlarged image itself is the thing to tap, since
                a big centered photo reads as decorative by default. Only
                ever rendered while isSettledActive is true, so it needs
                no conditional styling of its own; the transition plays
                once as it mounts in. Positioned relative to the image's
                own center + half its rendered height (82vw wide at a 4:5
                aspect ratio is ~51vw tall from center to edge) plus a
                small gap, so it sits just below the image regardless of
                viewport width. */}
            <span
              aria-hidden
              className="absolute left-1/2 top-[calc(50%+55vw)] -translate-x-1/2 animate-[fade-in_0.5s_ease-out_0.2s_both] whitespace-nowrap font-display text-[3.6vw] font-black uppercase tracking-[0.05em] text-[#111111]"
            >
              View Project →
            </span>
          </Link>
        ) : (
          <div key={project.id} className="pointer-events-none contents">
            {imageEl}
          </div>
        );
      })}
    </div>
  );

  const scrollHint = (
    <div
      aria-hidden
      // Shows before the very first scroll (as an initial nudge), and
      // also any time the reading line isn't currently over a project
      // name — i.e. whenever there's no thumbnail on screen, just plain
      // text — since that's exactly when a person might not realize
      // there's more to scroll toward.
      className={`pointer-events-none fixed bottom-20 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-1000 ${
        !hasScrolled || !activeProject ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="font-display text-[3.2vw] font-black uppercase tracking-[0.1em] text-[#111111]/60">
        Scroll to explore
      </span>
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
      {/* Both portaled straight to document.body, independently of
          DesktopHomepage's own portal. Order matters here: the backdrop
          is portaled first, so it lands earlier in document.body's
          child list than the text list's own z-10 below — paint order
          plus z-index both agree on the same result, rather than one
          having to compensate for the other. */}
      {mounted && createPortal(backdropImage, document.body)}
      {mounted && createPortal(scrollHint, document.body)}

      <main
        className={`relative z-10 max-w-full px-4 pb-28 pt-20 transition-[opacity] duration-500 ease-out ${
          isSettled ? "pointer-events-none opacity-30" : "opacity-100"
        }`}
      >
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
                  className={`block font-display font-black uppercase leading-[0.9] tracking-[-0.03em] transition-colors duration-150 focus-visible:outline-none text-[10.5vw] ${
                    activeProject?.uid === project.uid
                      ? "text-[#111111]"
                      : "text-[#111111]/30"
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
