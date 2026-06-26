import { useEffect, useRef, useState } from "react";
import { VIEWS } from "../constants/views";

export default function useEdgeSwipeBack({
  currentView,
  navigateToHub,
  navigateToLibrary,
}) {
  const [edgeSwipeActive, setEdgeSwipeActive] = useState(false);
  const [edgeSwipeProgress, setEdgeSwipeProgress] = useState(0);
  const [edgeSwipeDragging, setEdgeSwipeDragging] = useState(false);
  const edgeSwipeHandlersRef = useRef({ start: null, move: null, end: null });

  useEffect(() => {
    if (currentView === VIEWS.HUB) {
      edgeSwipeHandlersRef.current = { start: null, move: null, end: null };
      return undefined;
    }

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastTime = 0;
    let lastDx = 0;
    let releaseVelocityX = 0;
    let tracking = false;
    let gestureLocked = false;
    let consumed = false;
    let resetTimer = 0;
    let completeTimer = 0;

    const EDGE_ZONE = 22;
    const LOCK_DX = 12;
    const LOCK_DY = 24;
    const MAX_DY = 64;
    const COMPLETE_THRESHOLD = 0.56;
    const FLICK_MIN_DX = 18;
    const FLICK_VELOCITY = 0.18;

    const isInteractiveTarget = (target) => {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest('input, textarea, select, button, a, [contenteditable="true"], [data-kaleido-no-edge-back="true"]')
      );
    };

    const findVisibleBackButton = () => {
      const buttons = Array.from(document.querySelectorAll('[data-kaleido-back-button="true"]'));
      return buttons.find((btn) => {
        const style = window.getComputedStyle(btn);
        const rect = btn.getBoundingClientRect();
        return style.display !== "none"
          && style.visibility !== "hidden"
          && rect.width > 0
          && rect.height > 0
          && btn.offsetParent !== null;
      }) || null;
    };

    const runFallbackBack = () => {
      if (currentView === VIEWS.PATRON_EDITOR) {
        navigateToLibrary();
        return true;
      }
      if (currentView === VIEWS.ROW_COUNTER || currentView === VIEWS.PDF_VIEWER) {
        navigateToHub();
        return true;
      }
      if (currentView === VIEWS.LIBRARY) {
        navigateToHub();
        return true;
      }
      return false;
    };

    const hardResetPreview = () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(completeTimer);
      setEdgeSwipeDragging(false);
      setEdgeSwipeProgress(0);
      setEdgeSwipeActive(false);
    };

    const resetPreview = (animated = true) => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(completeTimer);
      setEdgeSwipeDragging(false);
      setEdgeSwipeProgress(0);
      if (!animated) {
        setEdgeSwipeActive(false);
        return;
      }
      resetTimer = window.setTimeout(() => {
        setEdgeSwipeActive(false);
      }, 220);
    };

    const completeBack = () => {
      const backButton = currentView === VIEWS.PATRON_EDITOR ? null : findVisibleBackButton();

      consumed = true;
      tracking = false;
      setEdgeSwipeDragging(false);
      setEdgeSwipeProgress(1);

      completeTimer = window.setTimeout(() => {
        if (currentView === VIEWS.PATRON_EDITOR) {
          navigateToLibrary();
        } else if (backButton) {
          backButton.click();
        } else {
          runFallbackBack();
        }
        setEdgeSwipeActive(false);
        setEdgeSwipeProgress(0);
      }, 180);
    };

    const onTouchStart = (event) => {
      const forcedEdgeZone = event?.target instanceof Element
        && Boolean(event.target.closest('[data-kaleido-edge-zone="true"]'));

      if (currentView === VIEWS.PATRON_EDITOR && !forcedEdgeZone) return;
      if (!event.touches || event.touches.length !== 1) return;
      if (!forcedEdgeZone && isInteractiveTarget(event.target)) return;

      const touch = event.touches[0];
      if (touch.clientX > EDGE_ZONE) return;

      window.clearTimeout(resetTimer);
      window.clearTimeout(completeTimer);

      startX = touch.clientX;
      startY = touch.clientY;
      lastX = touch.clientX;
      lastTime = performance.now();
      lastDx = 0;
      releaseVelocityX = 0;
      tracking = true;
      gestureLocked = false;
      consumed = false;
      setEdgeSwipeActive(false);
      setEdgeSwipeDragging(false);
      setEdgeSwipeProgress(0);
    };

    const onTouchMove = (event) => {
      if (!tracking || !event.touches || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      releaseVelocityX = (touch.clientX - lastX) / dt;
      lastX = touch.clientX;
      lastTime = now;

      const dx = Math.max(0, touch.clientX - startX);
      lastDx = dx;
      const dy = Math.abs(touch.clientY - startY);

      if (!gestureLocked) {
        if (dx > LOCK_DX && dy < LOCK_DY) {
          gestureLocked = true;
          setEdgeSwipeActive(true);
          setEdgeSwipeDragging(true);
        } else if (dy > LOCK_DY && dy > dx * 2.2) {
          tracking = false;
          resetPreview(false);
          return;
        }
      }

      if (!gestureLocked) return;

      event.preventDefault();

      if (dy > 140) {
        tracking = false;
        resetPreview(true);
        return;
      }

      const width = Math.max(window.innerWidth || 1, 1);
      const rawProgress = dx / width;
      const easedProgress = rawProgress < 0.16
        ? rawProgress * 0.7
        : 0.112 + (rawProgress - 0.16) * 0.9;
      const nextProgress = Math.max(0, Math.min(1, easedProgress));

      setEdgeSwipeProgress(nextProgress);

      if (nextProgress >= COMPLETE_THRESHOLD && dy < MAX_DY && !consumed) {
        completeBack();
      }
    };

    const finishGesture = () => {
      if (!gestureLocked) {
        tracking = false;
        consumed = false;
        return;
      }

      if (!consumed) {
        const shouldCompleteByDistance = lastDx >= window.innerWidth * 0.24;
        const shouldCompleteByFlick = lastDx >= FLICK_MIN_DX && releaseVelocityX >= FLICK_VELOCITY;

        if (shouldCompleteByDistance || shouldCompleteByFlick) {
          completeBack();
        } else {
          resetPreview(true);
        }
      }

      tracking = false;
      consumed = false;
      gestureLocked = false;
      releaseVelocityX = 0;
      lastDx = 0;
    };

    edgeSwipeHandlersRef.current = {
      start: onTouchStart,
      move: onTouchMove,
      end: finishGesture,
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", finishGesture, { passive: true });
    window.addEventListener("touchcancel", finishGesture, { passive: true });

    return () => {
      edgeSwipeHandlersRef.current = { start: null, move: null, end: null };
      window.clearTimeout(resetTimer);
      window.clearTimeout(completeTimer);
      hardResetPreview();
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", finishGesture);
      window.removeEventListener("touchcancel", finishGesture);
    };
  }, [currentView, navigateToHub, navigateToLibrary]);

  useEffect(() => {
    setEdgeSwipeActive(false);
    setEdgeSwipeProgress(0);
    setEdgeSwipeDragging(false);
  }, [currentView]);

  return {
    edgeSwipeActive,
    edgeSwipeDragging,
    edgeSwipeHandlersRef,
    edgeSwipeProgress,
  };
}
