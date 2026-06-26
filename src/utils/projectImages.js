import { getCachedImage } from "../services/mediaStore";

export const getProjectDirectImage = (project) => (
  project?.image?.preview
  || project?.image?.src
  || (typeof project?.image === "string" ? project.image : null)
);

export const getProjectCachedImage = (project) => {
  const directImage = getProjectDirectImage(project);
  if (directImage) return directImage;
  const cachedPreview = getCachedImage(project?.image?.previewId);
  if (cachedPreview) return cachedPreview;
  return getCachedImage(project?.image?.imageId) || null;
};
