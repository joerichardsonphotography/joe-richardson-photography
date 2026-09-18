import { notFound } from "next/navigation";
import { SliceZone } from "@prismicio/react";
import { components } from "@/slices";
import { createClient } from "@/prismicio";
import type { Metadata } from "next";

export default async function Home() {
  const client = createClient();
  const page = await client
    .getSingle("homepage")
    .catch(() => notFound());

  return <SliceZone slices={page.data.slices} components={components} />;
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
