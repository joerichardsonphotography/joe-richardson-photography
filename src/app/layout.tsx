import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { PrismicNextImage } from "@prismicio/next";
import { isFilled } from "@prismicio/client";
import { createClient } from "@/prismicio";
import { BackHomeLink } from "@/components/BackHomeLink";
import { ScrollToTopOnNavigate } from "@/components/ScrollToTopOnNavigate";
import "./globals.css";

// Inter is used for both display (headings, nav, project names) and body
// text — a Helvetica Neue–like grotesk available as a free Google Font,
// loaded once at multiple weights rather than pulling in a second family.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Joe Richardson",
  description: "Wedding and editorial photography by Joe Richardson.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const client = createClient();
  const settings = await client
    .getSingle("settings")
    .catch(() => null);

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#FAFAF8] font-body text-[#111111]">
        <ScrollToTopOnNavigate />

        {/* Back-to-home arrow — top-left on every page except home itself */}
        <BackHomeLink />

        {/* Quiet top-right nav — present on every page */}
        <nav className="fixed right-4 top-6 z-40 flex flex-col items-end gap-1 md:right-6 md:top-8">
          <Link
            href="/about"
            className="font-display font-black text-[6vw] uppercase leading-none tracking-[-0.02em] text-[#111111] transition-opacity duration-150 hover:opacity-50 active:opacity-50 md:text-[1.4vw]"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="font-display font-black text-[6vw] uppercase leading-none tracking-[-0.02em] text-[#111111] transition-opacity duration-150 hover:opacity-50 active:opacity-50 md:text-[1.4vw]"
          >
            Contact
          </Link>
        </nav>

        {children}

        {/* Fixed corner mark — present on every page, quiet by default */}
        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 flex items-end justify-end pb-6 pr-6 md:pb-8 md:pr-10">
          <Link
            href="/"
            aria-label="Joe Richardson — home"
            className="pointer-events-auto inline-flex items-center transition-opacity duration-150 hover:opacity-60 active:opacity-60"
          >
            {settings && isFilled.image(settings.data.signature_mark) ? (
              <PrismicNextImage
                field={settings.data.signature_mark}
                fallbackAlt=""
                className="h-8 w-auto md:h-10"
              />
            ) : (
              <span className="font-display font-black text-[3.4vw] uppercase leading-none tracking-[-0.02em] md:text-[1.1vw]">
                JR
              </span>
            )}
          </Link>
        </div>
      </body>
    </html>
  );
}
