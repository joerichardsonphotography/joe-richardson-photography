"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Mobile-only hamburger menu. On desktop the plain About/Contact text
 * links in the root layout are shown instead (this component renders
 * nothing there) — there's no crowding issue on desktop, so no need to
 * hide anything behind a menu.
 *
 * Opens a full-screen overlay with the same giant, bold type treatment
 * used elsewhere on the site (homepage project names, page headings),
 * rather than a small dropdown, to stay visually consistent with that
 * identity instead of introducing a new, smaller UI pattern.
 */
export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent the page behind the overlay from scrolling while it's open.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        aria-expanded={isOpen}
        className="fixed right-4 top-6 z-50 flex h-8 w-8 flex-col items-end justify-center gap-[5px]"
      >
        <span className="h-[2px] w-6 bg-[#111111]" />
        <span className="h-[2px] w-6 bg-[#111111]" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-[60] flex flex-col bg-[#FAFAF8]"
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="absolute right-4 top-6 flex h-8 w-8 items-center justify-end"
          >
            <span className="font-display text-[7vw] leading-none text-[#111111]">
              ✕
            </span>
          </button>

          <nav className="flex flex-1 flex-col items-start justify-center gap-2 px-4">
            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              className="font-display font-black text-[14vw] uppercase leading-[0.95] tracking-[-0.02em] text-[#111111] active:opacity-40"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="font-display font-black text-[14vw] uppercase leading-[0.95] tracking-[-0.02em] text-[#111111] active:opacity-40"
            >
              Contact
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
