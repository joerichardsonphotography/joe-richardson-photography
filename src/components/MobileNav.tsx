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
  const [isMounted, setIsMounted] = useState(false);

  const openMenu = () => {
    setIsMounted(true);
    // Mount first with opacity-0, then flip to open on the next frame so
    // the transition actually animates instead of snapping straight to
    // the open state (which is what happens if both are set together).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsOpen(true));
    });
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Prevent the page behind the overlay from scrolling while it's open.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Unmount only after the closing transition has finished playing, so
  // the fade-out is visible instead of the overlay vanishing instantly.
  useEffect(() => {
    if (isOpen || !isMounted) return;
    const timeout = setTimeout(() => setIsMounted(false), 700);
    return () => clearTimeout(timeout);
  }, [isOpen, isMounted]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={openMenu}
        aria-label="Open menu"
        aria-expanded={isOpen}
        className="fixed right-4 top-6 z-50 flex h-11 w-11 flex-col items-end justify-center gap-[7px]"
      >
        <span className="h-[3px] w-9 bg-[#111111]" />
        <span className="h-[3px] w-9 bg-[#111111]" />
      </button>

      {isMounted && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className={`fixed inset-0 z-[60] flex flex-col bg-[#FAFAF8] transition-all duration-700 ease-out ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            className="absolute right-4 top-6 flex h-11 w-11 items-center justify-end"
          >
            <span className="font-display text-[7vw] leading-none text-[#111111]">
              ✕
            </span>
          </button>

          <nav className="flex flex-1 flex-col items-start justify-center gap-2 px-4">
            {[
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map(({ href, label }, i) => (
              <Link
                key={href}
                href={href}
                onClick={closeMenu}
                style={{
                  transitionDelay: isOpen ? `${80 + i * 60}ms` : "0ms",
                }}
                className={`font-display font-black text-[14vw] uppercase leading-[0.95] tracking-[-0.02em] text-[#111111] transition-all duration-300 ease-out active:opacity-40 ${
                  isOpen
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
