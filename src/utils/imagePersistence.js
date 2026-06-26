import { saveImage } from "../services/mediaStore";

export const getImagePayload = (imgData) => (
  imgData?.src
  || imgData?.preview
  || (typeof imgData === "string" ? imgData : null)
);

export const persistImageReference = async (prefix, entityId, imgData) => {
  const imagePayload = getImagePayload(imgData);
  if (!imagePayload) return null;

  const imageId = `${prefix}_${entityId}_${Date.now()}`;
  const previewId = `${imageId}_preview`;

  await saveImage(imageId, imagePayload);
  if (imgData?.preview) await saveImage(previewId, imgData.preview);

  return {
    imageId,
    previewId: imgData?.preview ? previewId : null,
    preview: imgData?.preview || imagePayload,
    pos: imgData?.pos,
    scale: imgData?.scale,
  };
};
