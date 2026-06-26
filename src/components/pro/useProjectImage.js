import { useEffect, useState } from "react";
import { loadImage, getCachedImage } from "../../services/mediaStore";

const getProjectDirectImage = (project) => (
  project?.image?.preview
  || project?.image?.src
  || (typeof project?.image === "string" ? project.image : null)
);

const getProjectCachedImage = (project) => {
  const directImage = getProjectDirectImage(project);
  if (directImage) return directImage;
  const cachedPreview = getCachedImage(project?.image?.previewId);
  if (cachedPreview) return cachedPreview;
  return getCachedImage(project?.image?.imageId) || null;
};

export default function useProjectImage(project) {
  const [resolvedImage, setResolvedImage] = useState(() => getProjectCachedImage(project));

  useEffect(() => {
    let cancelled = false;
    const directImage = getProjectDirectImage(project);
    if (directImage) {
      setResolvedImage(directImage);
      return () => { cancelled = true; };
    }

    const imageId = project?.image?.imageId;
    const previewId = project?.image?.previewId;
    const cachedPreview = getCachedImage(previewId);
    if (cachedPreview) {
      setResolvedImage(cachedPreview);
      return () => { cancelled = true; };
    }

    const cachedImage = getCachedImage(imageId);
    if (cachedImage) {
      setResolvedImage(cachedImage);
      return () => { cancelled = true; };
    }

    if (previewId) {
      loadImage(previewId).then((data) => {
        if (!cancelled && data) setResolvedImage(data);
      });
      return () => { cancelled = true; };
    }

    if (!imageId) {
      setResolvedImage(null);
      return () => { cancelled = true; };
    }

    loadImage(imageId).then((data) => {
      if (!cancelled) setResolvedImage(data || null);
    });

    return () => { cancelled = true; };
  }, [project?.image]);

  return resolvedImage;
}
