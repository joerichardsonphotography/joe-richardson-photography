import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isFilled } from "@prismicio/client";
import { PrismicRichText } from "@prismicio/react";
import { PrismicNextLink } from "@prismicio/next";
import { createClient } from "@/prismicio";

export default async function ContactPage() {
  const client = createClient();
  const [page, settings] = await Promise.all([
    client.getSingle("contact").catch(() => notFound()),
    client.getSingle("settings").catch(() => null),
  ]);

  const email = settings?.data.email;
  const instagram = settings?.data.instagram_url;

  return (
    <div className="min-h-screen w-full bg-[#FAFAF8] text-[#111111]">
      <main className="px-4 pb-32 pt-28 md:px-8 md:pt-32">
        <h1 className="mb-10 font-display font-black text-[11vw] uppercase leading-[0.9] tracking-[-0.02em] md:mb-16 md:text-[5vw]">
          Contact
        </h1>

        <div className="max-w-[56ch] text-[3.6vw] leading-[1.35] md:text-[1.15vw]">
          {isFilled.richText(page.data.intro) && (
            <div className="mb-8">
              <PrismicRichText
                field={page.data.intro}
                components={{
                  paragraph: ({ children }) => (
                    <p className="mb-5 last:mb-0">{children}</p>
                  ),
                }}
              />
            </div>
          )}

          <ul className="flex flex-col gap-3">
            {email && (
              <li>
                <a
                  href={`mailto:${email}`}
                  className="underline decoration-1 underline-offset-4 transition-opacity duration-150 hover:opacity-50"
                >
                  {email}
                </a>
              </li>
            )}
            {isFilled.link(instagram) && (
              <li>
                <PrismicNextLink
                  field={instagram}
                  className="underline decoration-1 underline-offset-4 transition-opacity duration-150 hover:opacity-50"
                >
                  Instagram
                </PrismicNextLink>
              </li>
            )}
          </ul>

          {!email && !isFilled.link(instagram) && (
            <p className="text-[#8C8C86]">
              Add a contact email and/or Instagram link in the Settings
              document in Prismic, and they&apos;ll appear here.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle("contact").catch(() => null);

  return {
    title: page?.data.meta_title || "Contact — Joe Richardson",
    description:
      page?.data.meta_description ||
      "Get in touch with Joe Richardson about wedding and editorial photography.",
  };
}
