import { useState } from "react";
import { persistImageReference } from "../utils/imagePersistence";

export default function usePhotoManagement({
  updatePatron,
  updateProject,
  updateProProject,
}) {
  const [photoTarget, setPhotoTarget] = useState(null);

  const persistProjectImageToIndexedDB = async (projectId, imgData, scope = "personal") => {
    const imageRef = await persistImageReference(`img_${scope}`, projectId, imgData);
    if (!imageRef) return;

    if (scope === "pro") {
      updateProProject(projectId, { image: imageRef });
    } else {
      updateProject(projectId, { image: imageRef });
    }
  };

  const persistPatronImageToIndexedDB = async (patronId, imgData) => {
    const imageRef = await persistImageReference("img_patron", patronId, imgData);
    if (imageRef) updatePatron(patronId, { image: imageRef });
  };

  return {
    persistPatronImageToIndexedDB,
    persistProjectImageToIndexedDB,
    photoTarget,
    setPhotoTarget,
  };
}
