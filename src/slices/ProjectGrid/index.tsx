import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { createClient } from "@/prismicio";
import { ProjectGridClient } from "./ProjectGridClient";

export type ProjectGridProps =
  SliceComponentProps<Content.ProjectGridSlice>;

/**
 * Server component: fetches all projects, then hands off to the client
 * component that owns the scroll/hover interactivity.
 */
const ProjectGrid = async ({ slice }: ProjectGridProps): Promise<React.JSX.Element> => {
  const client = createClient();
  const projects = await client.getAllByType("project", {
    orderings: [
      { field: "my.project.sort_order", direction: "asc" },
      { field: "document.first_publication_date", direction: "asc" },
    ],
  });

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <ProjectGridClient projects={projects} />
    </section>
  );
};

export default ProjectGrid;
