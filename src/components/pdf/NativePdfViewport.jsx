import React from "react";
import { loadPdf } from "../../services/mediaStore";
import {
  checkNativePdfAvailability,
  getNativePdfState,
  hideNativePdf,
  isNativePdfViewerTarget,
  showNativePdf,
  updateNativePdfFrame,
} from "../../services/nativePdfViewer";

const getViewportFrame = (element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
};

export default function NativePdfViewport({ pdfId, initialState, hidden = false, onUnavailable, onStateChange }) {
  const hostRef = React.useRef(null);
  const activeRef = React.useRef(false);
  const onStateChangeRef = React.useRef(onStateChange);
  const initialStateRef = React.useRef(initialState);
  const [nativeError, setNativeError] = React.useState("");

  React.useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  const saveState = React.useCallback(async () => {
    if (!activeRef.current) return;
    try {
      const state = await getNativePdfState();
      if (state && typeof onStateChangeRef.current === "function") {
        onStateChangeRef.current(state);
      }
    } catch {
      // The native view may already be gone while React is unmounting.
    }
  }, []);

  React.useEffect(() => {
    if (!isNativePdfViewerTarget() || hidden || !pdfId || !hostRef.current) return undefined;

    let cancelled = false;

    const openNativePdf = async () => {
      const data = await loadPdf(pdfId);
      if (cancelled) return;

      if (!data) {
        const message = "PDF introuvable dans le stockage local.";
        setNativeError(message);
        if (typeof onUnavailable === "function") onUnavailable(message);
        return;
      }

      try {
        await checkNativePdfAvailability();
        await showNativePdf({
          pdfId,
          data,
          frame: getViewportFrame(hostRef.current),
          state: initialStateRef.current || null,
        });
        activeRef.current = true;
        setNativeError("");
      } catch (error) {
        activeRef.current = false;
        const message = String(error?.message || error || "Le lecteur PDF natif n'a pas pu demarrer.");
        setNativeError(message);
        if (typeof onUnavailable === "function") onUnavailable(message);
      }
    };

    openNativePdf();

    return () => {
      cancelled = true;
      saveState().finally(() => {
        activeRef.current = false;
        hideNativePdf();
      });
    };
  }, [hidden, onUnavailable, pdfId, saveState]);

  React.useEffect(() => {
    if (!isNativePdfViewerTarget() || hidden || !pdfId || !hostRef.current) return undefined;

    let frameHandle = 0;
    const updateFrame = () => {
      if (!hostRef.current) return;
      window.cancelAnimationFrame(frameHandle);
      frameHandle = window.requestAnimationFrame(() => {
        updateNativePdfFrame({ frame: getViewportFrame(hostRef.current) }).catch(() => {});
      });
    };

    const observer = new ResizeObserver(updateFrame);
    observer.observe(hostRef.current);
    window.addEventListener("resize", updateFrame);
    window.visualViewport?.addEventListener("resize", updateFrame);
    window.visualViewport?.addEventListener("scroll", updateFrame);
    updateFrame();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateFrame);
      window.visualViewport?.removeEventListener("resize", updateFrame);
      window.visualViewport?.removeEventListener("scroll", updateFrame);
      window.cancelAnimationFrame(frameHandle);
    };
  }, [hidden, pdfId]);

  React.useEffect(() => {
    if (!hidden) return undefined;
    saveState().finally(() => {
      activeRef.current = false;
      hideNativePdf();
    });
    return undefined;
  }, [hidden, saveState]);

  React.useEffect(() => {
    const saveWhenLeaving = () => {
      saveState();
    };

    document.addEventListener("visibilitychange", saveWhenLeaving);
    window.addEventListener("pagehide", saveWhenLeaving);
    return () => {
      document.removeEventListener("visibilitychange", saveWhenLeaving);
      window.removeEventListener("pagehide", saveWhenLeaving);
    };
  }, [saveState]);

  React.useEffect(() => {
    if (hidden || !pdfId) return undefined;
    const interval = window.setInterval(() => {
      saveState();
    }, 1800);
    return () => window.clearInterval(interval);
  }, [hidden, pdfId, saveState]);

  return (
    <div
      ref={hostRef}
      style={{
        flex: 1,
        minHeight: 0,
        background: "#111",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {nativeError ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, color: "#F87171", fontSize: 13, textAlign: "center", lineHeight: 1.35 }}>
          {nativeError}
        </div>
      ) : null}
    </div>
  );
}
