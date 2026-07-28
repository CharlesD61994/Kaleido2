import React, { useEffect, useMemo, useState } from "react";
import { VIEWS } from "../../constants/views";

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));

export default function BoutiqueAdminScreen({
  currentView,
  navigateToHub,
  activeScreenInteractiveStyle,
}) {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isActive = currentView === VIEWS.BOUTIQUE_ADMIN;

  useEffect(() => {
    if (!isActive) {
      setSwipeProgress(0);
      setIsSwiping(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return undefined;

    let completeTimer = 0;
    let resetTimer = 0;

    const reset = () => {
      window.clearTimeout(completeTimer);
      window.clearTimeout(resetTimer);
      setIsSwiping(false);
      setSwipeProgress(0);
    };

    const handleMessage = (event) => {
      const data = event.data || {};
      if (data.type === "kaleido-admin-root:swipe-progress") {
        window.clearTimeout(resetTimer);
        setIsSwiping(true);
        setSwipeProgress(clamp(data.progress));
      }
      if (data.type === "kaleido-admin-root:swipe-cancel") {
        setIsSwiping(false);
        setSwipeProgress(0);
      }
      if (data.type === "kaleido-admin-root:swipe-complete" || data.type === "kaleido-admin:return-app") {
        setIsSwiping(false);
        setSwipeProgress(1);
        completeTimer = window.setTimeout(() => {
          navigateToHub();
          resetTimer = window.setTimeout(reset, 90);
        }, data.type === "kaleido-admin:return-app" ? 80 : 180);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.clearTimeout(completeTimer);
      window.clearTimeout(resetTimer);
      window.removeEventListener("message", handleMessage);
    };
  }, [isActive, navigateToHub]);

  const interactiveStyle = useMemo(() => {
    if (!isActive) return {};
    if (swipeProgress <= 0 && !isSwiping) return activeScreenInteractiveStyle || {};

    return {
      transform: `translate3d(${(swipeProgress * 100).toFixed(3)}vw, 0, 0)`,
      transition: isSwiping
        ? "none"
        : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms ease, filter 240ms ease",
      willChange: "transform, box-shadow, filter",
      position: "relative",
      zIndex: 2,
      boxShadow: `-30px 0 60px rgba(0,0,0,${(0.20 + swipeProgress * 0.22).toFixed(3)}), 0 0 0 1px rgba(255,255,255,${(0.02 + swipeProgress * 0.05).toFixed(3)})`,
      filter: `brightness(${(1 - swipeProgress * 0.02).toFixed(3)}) saturate(${(1 + swipeProgress * 0.04).toFixed(3)})`,
    };
  }, [activeScreenInteractiveStyle, isActive, isSwiping, swipeProgress]);

  if (!isActive) return null;

  return (
    <section
      data-kaleido-screen="true"
      style={{
        ...interactiveStyle,
        position: "fixed",
        inset: 0,
        zIndex: 20,
        minHeight: "100vh",
        background: isLoaded ? "var(--k-bg)" : "transparent",
        overflow: "hidden",
      }}
    >
      <iframe
        title="Admin boutique Kaleido"
        src="/admin-boutique/admin-shell.html"
        onLoad={() => setIsLoaded(true)}
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          display: "block",
          background: "var(--k-bg)",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 140ms ease",
        }}
      />
    </section>
  );
}
