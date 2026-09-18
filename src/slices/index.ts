import dynamic from "next/dynamic";

export const components = {
  project_grid: dynamic(() => import("./ProjectGrid")),
};
