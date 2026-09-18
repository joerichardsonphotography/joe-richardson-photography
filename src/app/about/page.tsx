import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isFilled } from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import { PrismicRichText } from "@prismicio/react";
import { createClient } from "@/prismicio";

export default async function AboutPage() {
  const client = createClient();
  const page = await client.getSingle("about").catch(() => notFound());

  const hasPortrait = isFilled.image(page.data.portrait);

  return (
    <div className="min-h-screen w-full bg-[#FAFAF8] text-[#111111]">
      <main className="px-4 pb-32 pt-28 md:px-8 md:pt-32">
        <h1 className="mb-10 font-display font-black text-[11vw] uppercase leading-[0.9] tracking-[-0.02em] md:mb-16 md:text-[5vw]">
          About
        </h1>

        <div
          className={`mx-auto flex max-w-[1400px] flex-col gap-10 ${
            hasPortrait ? "lg:flex-row lg:gap-[6vw]" : ""
          }`}
        >
          <div
            className={`min-w-0 max-w-[64ch] text-[3.6vw] leading-[1.35] md:text-[1.15vw] ${
              hasPortrait ? "lg:flex-[1.2]" : ""
            }`}
          >
            <PrismicRichText
              field={page.data.bio}
              components={{
                paragraph: ({ children }) => (
                  <p className="mb-5 last:mb-0">{children}</p>
                ),
              }}
            />
          </div>

          {hasPortrait && (
            <div className="lg:flex-1 lg:shrink-0">
              <PrismicNextImage
                field={page.data.portrait}
                alt=""
                fallbackAlt=""
                priority
                className="block h-auto w-full max-w-[440px] object-cover"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle("about").catch(() => null);

  return {
    title: page?.data.meta_title || "About — Joe Richardson",
    description:
      page?.data.meta_description ||
      "Wedding and editorial photographer Joe Richardson — background and approach.",
  };
}
