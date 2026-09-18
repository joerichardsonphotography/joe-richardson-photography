import type { MetadataRoute } from "next";
import { createClient } from "@/prismicio";

const SITE_URL = "https://www.joerichardsonphotography.co.uk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = createClient();
  const projects = await client.getAllByType("project").catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => {
    const lastModified = project.last_publication_date
      ? new Date(project.last_publication_date)
      : undefined;

    return {
      url: `${SITE_URL}/project/${project.uid}`,
      // Omit lastModified entirely rather than passing an invalid date
      // through — Google Search Console flags a malformed <lastmod> as a
      // sitemap error, whereas simply not including the tag is fine.
      ...(lastModified && !Number.isNaN(lastModified.getTime())
        ? { lastModified }
        : {}),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    };
  });

  return [...staticRoutes, ...projectRoutes];
}
