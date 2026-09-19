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
    // Neither useInfiniteScrollLoop's own initial programmatic scrollTo
    // NOR iOS Safari's address-bar auto-hide on load are genuine user
    // scrolling, but both fire real, ordinary `scroll` events — with no
    // reliable way to tell them apart from a scroll event alone (a
    // requestAnimationFrame-based defer, tried previously, only closes
    // the gap for the former; Safari's chrome can hide on its own
    // timeline, not tied to one frame after mount). What's reliably
    // different is that only an actual user action starts with a touch,
    // click, or wheel — so hasScrolled only starts listening for scroll
    // at all once one of those has genuinely happened first.
    let hasInteracted = false;
    let cleanupScroll: (() => void) | undefined;

    const onScroll = () => {
      setHasScrolled(true);
    };

    const armScrollListener = () => {
      if (hasInteracted) return;
      hasInteracted = true;
      window.addEventListener("scroll", onScroll, {
        passive: true,
        once: true,
      });
      cleanupScroll = () => window.removeEventListener("scroll", onScroll);
    };

    window.addEventListener("touchstart", armScrollListener, {
      passive: true,
      once: true,
    });
    window.addEventListener("wheel", armScrollListener, {
      passive: true,
      once: true,
    });
    window.addEventListener("pointerdown", armScrollListener, {
      passive: true,
      once: true,
    });

    return () => {
      window.removeEventListener("touchstart", armScrollListener);
      window.removeEventListener("wheel", armScrollListener);
      window.removeEventListener("pointerdown", armScrollListener);
      cleanupScroll?.();
    };
  }, []);

  const activeProject = projects.find((p) => p.uid === activeUid) ?? null;

  // A debounced version of "no active project," used only to decide
  // whether the scroll hint should reappear — not for the image/text
  // color logic above, which stays instantly accurate. The reading line
  // is a single fixed point; it can briefly land in the small gap
  // between one name and the next while scrolling past, momentarily
  // resolving no active project even though the person hasn't paused or
  // lost their place. Without this delay, that split-second gap was
  // enough to flash "Scroll to explore" back in during ordinary
  // scrolling, which read as the page losing track rather than a
  // deliberate pause worth re-prompting for.
  //
  // Follows React's documented pattern for resetting state when a prop
  // changes (adjusting state during render via a render-time comparison,
  // rather than in an effect) for the immediate "hide" direction, and a
  // plain effect + timeout for the delayed "show" direction — the only
  // one that's genuinely asynchronous.
  const [showHintForNoActive, setShowHintForNoActive] = useState(false);
  const [prevActiveProject, setPrevActiveProject] = useState(activeProject);
  if (activeProject !== prevActiveProject) {
    setPrevActiveProject(activeProject);
    if (activeProject) setShowHintForNoActive(false);
  }
  useEffect(() => {
    if (activeProject) return;
    const timeout = setTimeout(() => setShowHintForNoActive(true), 400);
    return () => clearTimeout(timeout);
  }, [activeProject]);

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
            // The enlarged size is always rendered at its final width
            // (w-[82vw]) — the bounce is driven by transform: scale via
            // the settle-bounce keyframe animation below, starting small
            // and overshooting past 1 before settling. Animating
            // transform rather than width itself is what makes a genuine
            // spring overshoot practical: scale is GPU-composited and
            // keyframes can freely go past 100% and back, whereas
            // animating width directly forces layout recalculation every
            // frame and doesn't overshoot as cleanly. Not settled/active
            // images stay at their small size with a plain opacity/width
            // transition, unaffected by any of this.
            className={`absolute left-1/2 top-1/2 aspect-[4/5] object-cover ${
              isSettledActive
                ? "w-[82vw] max-w-[520px] origin-center animate-[settle-bounce_3000ms_cubic-bezier(0.34,1.56,0.64,1)_both]"
                : "w-[55vw] max-w-[380px] -translate-x-1/2 -translate-y-1/2 transition-[opacity,width] duration-500 ease-out"
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
      // also once no project has been active for a brief moment (see
      // showHintForNoActive above) — debounced rather than reacting the
      // instant activeProject goes null, since the reading line briefly
      // passing through the small gap between one name and the next
      // during ordinary scrolling would otherwise flash this hint back
      // in constantly, which read as the page losing track rather than
      // a genuine pause worth re-prompting for.
      className={`pointer-events-none fixed bottom-20 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-1000 ${
        !hasScrolled || showHintForNoActive ? "opacity-100" : "opacity-0"
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
        // Slower fade (700ms) with a slight delay (150ms) when settling
        // in, so the image visibly begins growing first and the text
        // dims in afterward — staggered rather than both changing in
        // perfect lockstep, which read as mechanical rather than
        // gradual. No delay when reverting back (scrolling again), since
        // that should feel immediate/responsive, not anticipatory.
        className={`relative z-10 max-w-full px-4 pb-28 pt-20 transition-opacity ease-out ${
          isSettled
            ? "pointer-events-none opacity-30 duration-700 delay-150"
            : "opacity-100 duration-300"
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
