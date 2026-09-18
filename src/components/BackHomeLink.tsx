"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BackHomeLink() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="fixed left-4 top-6 z-50 font-display font-black text-[7vw] uppercase leading-[0.9] tracking-[-0.02em] text-[#111111] transition-opacity duration-150 hover:opacity-40 active:opacity-40 md:left-6 md:top-8 md:text-[2vw]"
    >
      ←
    </Link>
  );
}
