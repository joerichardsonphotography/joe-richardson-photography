import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { asImageSrc, isFilled } from "@prismicio/client";
import { createClient } from "@/prismicio";
import { ProjectGallery } from "@/components/ProjectGallery";

type Params = { uid: string };

const SITE_URL = "https://www.joerichardsonphotography.co.uk";

export default async function ProjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { uid } = await params;
  const client = createClient();
  const project = await client
    .getByUID("project", uid)
    .catch(() => notFound());

  const allImageUrls = [
    project.data.cover_image,
    ...(project.data.gallery ?? []).map((item) => item.image),
  ]
    .filter(isFilled.image)
    .map((image) => asImageSrc(image))
    .filter((url): url is string => Boolean(url));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: project.data.name,
    url: `${SITE_URL}/project/${project.uid}`,
    image: allImageUrls,
    author: {
      "@type": "Person",
      name: "Joe Richardson",
    },
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAF8] text-[#111111]">
      {/* Structured data helps individual photos surface in Google Images
          search results attributed to this gallery/page. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="px-4 pb-32 pt-28 md:px-8 md:pt-32">
        <h1 className="sr-only">{project.data.name}</h1>
        <div className="mx-auto max-w-[1680px]">
          <ProjectGallery project={project} />
        </div>
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const client = createClient();
    const projects = await client.getAllByType("project");
    return projects.map((project) => ({ uid: project.uid }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { uid } = await params;
  const client = createClient();
  const project = await client.getByUID("project", uid).catch(() => null);

  if (!project) return {};

  const title = project.data.meta_title || project.data.name || "Project";
  const description =
    project.data.meta_description ||
    `${project.data.name} — wedding and editorial photography by Joe Richardson.`;

  const ogImage = isFilled.image(project.data.cover_image)
    ? asImageSrc(project.data.cover_image)
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}
