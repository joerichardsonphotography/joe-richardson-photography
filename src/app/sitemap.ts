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

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_URL}/project/${project.uid}`,
    lastModified: project.last_publication_date,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...projectRoutes];
}
