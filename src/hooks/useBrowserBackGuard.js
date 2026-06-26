import { useEffect, useRef } from "react";
import { VIEWS } from "../constants/views";

export default function useBrowserBackGuard({
  currentView,
  navigateBackFromClientPage,
  navigateToHub,
  navigateToLibrary,
}) {
  const stateRef = useRef({
    currentView,
    navigateBackFromClientPage,
    navigateToHub,
    navigateToLibrary,
  });

  useEffect(() => {
    stateRef.current = {
      currentView,
      navigateBackFromClientPage,
      navigateToHub,
      navigateToLibrary,
    };
  }, [currentView, navigateBackFromClientPage, navigateToHub, navigateToLibrary]);

  useEffect(() => {
    const guardState = { kaleidoBackGuard: true };
    const GUARD_DEPTH = 8;
    const EDGE_WIDTH = 44;
    let touchStartX = 0;
    let touchStartY = 0;
    let isEdgeTouch = false;
    const previousOverscrollBehaviorX = document.documentElement.style.overscrollBehaviorX;
    const previousBodyOverscrollBehaviorX = document.body.style.overscrollBehaviorX;
    const previousOverscrollBehavior = document.documentElement.style.overscrollBehavior;
    const previousBodyOverscrollBehavior = document.body.style.overscrollBehavior;
    const previousTouchAction = document.documentElement.style.touchAction;
    const previousBodyTouchAction = document.body.style.touchAction;

    const pushGuardState = () => {
      window.history.pushState(guardState, "", window.location.href);
    };

    const isInteractiveTarget = (target) => {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest('input, textarea, select, button, a, [contenteditable="true"], [data-kaleido-back-button="true"], [data-kaleido-no-edge-back="true"]')
      );
    };

    const resetGuardState = () => {
      window.history.replaceState(guardState, "", window.location.href);
      for (let i = 0; i < GUARD_DEPTH; i += 1) {
        pushGuardState();
      }
    };

    const goBackInsideApp = () => {
      const {
        currentView: view,
        navigateBackFromClientPage: backFromClientPage,
        navigateToHub: goHub,
        navigateToLibrary: goLibrary,
      } = stateRef.current;

      if (view === VIEWS.CLIENT_PAGE) {
        backFromClientPage();
      } else if (view === VIEWS.PATRON_EDITOR) {
        goLibrary();
      } else if (view === VIEWS.LIBRARY || view === VIEWS.ROW_COUNTER || view === VIEWS.PDF_VIEWER) {
        goHub();
      }
    };

    const handlePopState = () => {
      resetGuardState();
      goBackInsideApp();
    };

    const handlePageshow = () => {
      resetGuardState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetGuardState();
      }
    };

    const handleWindowFocus = () => {
      resetGuardState();
    };

    const handleTouchStart = (event) => {
      if (!event.touches || event.touches.length !== 1) return;
      if (isInteractiveTarget(event.target)) {
        isEdgeTouch = false;
        return;
      }
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isEdgeTouch = touchStartX <= EDGE_WIDTH;
      if (isEdgeTouch) {
        event.preventDefault();
      }
    };

    const handleTouchMove = (event) => {
      if (!isEdgeTouch || !event.touches || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = Math.abs(touch.clientY - touchStartY);

      if (dx > 2 && dy < 48) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      isEdgeTouch = false;
    };

    const handlePointerStart = (event) => {
      if (event.pointerType && event.pointerType !== "touch") return;
      if (isInteractiveTarget(event.target)) {
        isEdgeTouch = false;
        return;
      }
      touchStartX = event.clientX;
      touchStartY = event.clientY;
      isEdgeTouch = touchStartX <= EDGE_WIDTH;
      if (isEdgeTouch) {
        event.preventDefault();
      }
    };

    const handlePointerMove = (event) => {
      if (!isEdgeTouch) return;
      if (event.pointerType && event.pointerType !== "touch") return;

      const dx = event.clientX - touchStartX;
      const dy = Math.abs(event.clientY - touchStartY);

      if (dx > 2 && dy < 48) {
        event.preventDefault();
      }
    };

    const handlePointerEnd = () => {
      isEdgeTouch = false;
    };

    const preventGestureDefault = (event) => {
      event.preventDefault();
    };

    document.documentElement.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehaviorX = "none";
    document.documentElement.style.touchAction = "pan-y";
    document.body.style.overscrollBehavior = "none";
    document.body.style.overscrollBehaviorX = "none";
    document.body.style.touchAction = "pan-y";

    resetGuardState();
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageshow);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("gesturestart", preventGestureDefault, { passive: false, capture: true });
    document.addEventListener("pointerdown", handlePointerStart, { passive: false, capture: true });
    document.addEventListener("pointermove", handlePointerMove, { passive: false, capture: true });
    document.addEventListener("pointerup", handlePointerEnd, { passive: true, capture: true });
    document.addEventListener("pointercancel", handlePointerEnd, { passive: true, capture: true });
    document.addEventListener("touchstart", handleTouchStart, { passive: false, capture: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false, capture: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true, capture: true });
    document.addEventListener("touchcancel", handleTouchEnd, { passive: true, capture: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: false, capture: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true, capture: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true, capture: true });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageshow);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("gesturestart", preventGestureDefault, { capture: true });
      document.removeEventListener("pointerdown", handlePointerStart, { capture: true });
      document.removeEventListener("pointermove", handlePointerMove, { capture: true });
      document.removeEventListener("pointerup", handlePointerEnd, { capture: true });
      document.removeEventListener("pointercancel", handlePointerEnd, { capture: true });
      document.removeEventListener("touchstart", handleTouchStart, { capture: true });
      document.removeEventListener("touchmove", handleTouchMove, { capture: true });
      document.removeEventListener("touchend", handleTouchEnd, { capture: true });
      document.removeEventListener("touchcancel", handleTouchEnd, { capture: true });
      document.documentElement.style.overscrollBehavior = previousOverscrollBehavior;
      document.documentElement.style.overscrollBehaviorX = previousOverscrollBehaviorX;
      document.documentElement.style.touchAction = previousTouchAction;
      document.body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      document.body.style.overscrollBehaviorX = previousBodyOverscrollBehaviorX;
      document.body.style.touchAction = previousBodyTouchAction;
      window.removeEventListener("touchstart", handleTouchStart, { capture: true });
      window.removeEventListener("touchmove", handleTouchMove, { capture: true });
      window.removeEventListener("touchend", handleTouchEnd, { capture: true });
      window.removeEventListener("touchcancel", handleTouchEnd, { capture: true });
    };
  }, []);
}
