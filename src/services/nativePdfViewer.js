import { Capacitor, registerPlugin } from "@capacitor/core";

const NativePdfViewer = registerPlugin("KaleidoPdfViewer");

export const isNativePdfViewerTarget = () => (
  typeof Capacitor?.isNativePlatform === "function"
  && Capacitor.isNativePlatform()
  && Capacitor.getPlatform?.() === "ios"
);

const callNativePdfViewer = async (method, payload = {}) => {
  if (!isNativePdfViewerTarget()) {
    throw new Error("Le lecteur PDF natif est seulement disponible dans l'app iOS.");
  }

  if (typeof NativePdfViewer?.[method] !== "function") {
    throw new Error(`Le plugin PDF natif ne contient pas la methode ${method}.`);
  }

  const result = await NativePdfViewer[method](payload);
  if (result == null && !["hide", "show", "updateFrame", "updateHeader", "setBackProgress"].includes(method)) {
    throw new Error(`Le plugin PDF natif n'a pas repondu a ${method}.`);
  }

  return result;
};

export const checkNativePdfAvailability = () => callNativePdfViewer("isAvailable");
export const showNativePdf = (payload) => callNativePdfViewer("show", payload);
export const updateNativePdfFrame = (payload) => callNativePdfViewer("updateFrame", payload);
export const updateNativePdfHeader = (payload) => callNativePdfViewer("updateHeader", payload);
export const setNativePdfBackProgress = (payload) => callNativePdfViewer("setBackProgress", payload);
export const hideNativePdf = () => callNativePdfViewer("hide");
export const getNativePdfState = () => callNativePdfViewer("getState");
