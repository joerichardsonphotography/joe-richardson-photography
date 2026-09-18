import { notFound } from "next/navigation";
import { SliceZone } from "@prismicio/react";
import { components } from "@/slices";
import { createClient } from "@/prismicio";
import type { Metadata } from "next";

const SITE_URL = "https://www.joerichardsonphotography.co.uk";

export default async function Home() {
  const client = createClient();
  const [page, settings] = await Promise.all([
    client.getSingle("homepage").catch(() => notFound()),
    client.getSingle("settings").catch(() => null),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: settings?.data.site_title || "Joe Richardson Photography",
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    ...(settings?.data.email ? { email: settings.data.email } : {}),
    priceRange: "££",
    areaServed: "GB",
    knowsAbout: ["Wedding photography", "Editorial photography"],
  };

  return (
    <>
      {/* Structured data so search engines can recognize this as a
          photography business (helps with rich results / knowledge panel
          eligibility). Content is pulled from Settings so it can't drift
          out of sync with what's actually on the page. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SliceZone slices={page.data.slices} components={components} />
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const client = createClient();
  const page = await client.getSingle("homepage").catch(() => null);
  const settings = await client.getSingle("settings").catch(() => null);

  return {
    title: page?.data.meta_title || settings?.data.site_title || "Joe Richardson",
    description:
      page?.data.meta_description ||
      settings?.data.meta_description ||
      "Wedding and editorial photography by Joe Richardson.",
  };
}
