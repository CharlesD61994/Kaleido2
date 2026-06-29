import { Capacitor, registerPlugin } from "@capacitor/core";

const NativePdfViewer = registerPlugin("KaleidoPdfViewer");

export const isNativePdfViewerTarget = () => (
  typeof Capacitor?.isNativePlatform === "function"
  && Capacitor.isNativePlatform()
  && Capacitor.getPlatform?.() === "ios"
);

const callNativePdfViewer = async (method, payload = {}) => {
  if (!isNativePdfViewerTarget() || typeof NativePdfViewer?.[method] !== "function") {
    return null;
  }

  return NativePdfViewer[method](payload);
};

export const showNativePdf = (payload) => callNativePdfViewer("show", payload);
export const updateNativePdfFrame = (payload) => callNativePdfViewer("updateFrame", payload);
export const hideNativePdf = () => callNativePdfViewer("hide");
export const getNativePdfState = () => callNativePdfViewer("getState");

