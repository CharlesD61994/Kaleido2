import { useEffect, useRef, useState } from "react";
import { VIEWS } from "../constants/views";
import { setNativePdfBackProgress } from "../services/nativePdfViewer";

export default function useEdgeSwipeBack({
  currentView,
  navigateBackFromClientPage,
  navigateToHub,
  navigateToLibrary,
}) {
  const [edgeSwipeActive, setEdgeSwipeActive] = useState(false);
  const [edgeSwipeProgress, setEdgeSwipeProgress] = useState(0);
  const [edgeSwipeDragging, setEdgeSwipeDragging] = useState(false);
  const edgeSwipeHandlersRef = useRef({ start: null, move: null, end: null });

  useEffect(() => {
    if (currentView === VIEWS.HUB || currentView === VIEWS.CLIENT_PAGE || currentView === VIEWS.PDF_VIEWER) {
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
    let pdfSyncFrame = 0;
    let pendingPdfProgress = 0;
    let pendingPdfAnimated = false;

    const isClientPage = currentView === VIEWS.CLIENT_PAGE;
    const EDGE_ZONE = isClientPage ? 54 : 32;
    const LOCK_DX = 12;
    const LOCK_DY = 24;
    const MAX_DY = 64;
    const COMPLETE_THRESHOLD = isClientPage ? 0.34 : 0.56;
    const FLICK_MIN_DX = isClientPage ? 12 : 18;
    const FLICK_VELOCITY = isClientPage ? 0.12 : 0.18;

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
      if (currentView === VIEWS.PATRON_EDITOR || currentView === VIEWS.PDF_PATRON_IMPORT || currentView === VIEWS.PDF_PATRON_EDIT) {
        navigateToLibrary();
        return true;
      }
      if (currentView === VIEWS.CLIENT_PAGE) {
        navigateBackFromClientPage?.();
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

    const syncPdfWindowBackProgress = (progress, animated = false) => {
      if (currentView !== VIEWS.PDF_VIEWER) return;
      pendingPdfProgress = progress;
      pendingPdfAnimated = animated;

      if (animated) {
        window.cancelAnimationFrame(pdfSyncFrame);
        pdfSyncFrame = 0;
        setNativePdfBackProgress({ progress, animated }).catch(() => {});
        return;
      }

      if (pdfSyncFrame) return;
      pdfSyncFrame = window.requestAnimationFrame(() => {
        pdfSyncFrame = 0;
        setNativePdfBackProgress({
          progress: pendingPdfProgress,
          animated: pendingPdfAnimated,
        }).catch(() => {});
      });
    };

    const hardResetPreview = () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(completeTimer);
      window.cancelAnimationFrame(pdfSyncFrame);
      pdfSyncFrame = 0;
      syncPdfWindowBackProgress(0, false);
      setEdgeSwipeDragging(false);
      setEdgeSwipeProgress(0);
      setEdgeSwipeActive(false);
    };

    const resetPreview = (animated = true) => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(completeTimer);
      setEdgeSwipeDragging(false);
      setEdgeSwipeProgress(0);
      syncPdfWindowBackProgress(0, animated);
      if (!animated) {
        setEdgeSwipeActive(false);
        return;
      }
      resetTimer = window.setTimeout(() => {
        setEdgeSwipeActive(false);
      }, 220);
    };

    const completeBack = () => {
      const isLibraryBackView = currentView === VIEWS.PATRON_EDITOR
        || currentView === VIEWS.PDF_PATRON_IMPORT
        || currentView === VIEWS.PDF_PATRON_EDIT;
      const backButton = isLibraryBackView
        ? null
        : findVisibleBackButton();

      consumed = true;
      tracking = false;
      setEdgeSwipeDragging(false);
      setEdgeSwipeProgress(1);
      syncPdfWindowBackProgress(1, true);

      completeTimer = window.setTimeout(() => {
        if (isLibraryBackView) {
          setEdgeSwipeActive(false);
          setEdgeSwipeProgress(0);
          navigateToLibrary();
          return;
        } else if (backButton) {
          backButton.click();
        } else if (currentView === VIEWS.CLIENT_PAGE) {
          navigateBackFromClientPage?.();
        } else {
          runFallbackBack();
        }
        window.setTimeout(() => {
          setEdgeSwipeActive(false);
          setEdgeSwipeProgress(0);
        }, 80);
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
      syncPdfWindowBackProgress(0, false);
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
      syncPdfWindowBackProgress(nextProgress, false);

      if (currentView !== VIEWS.PDF_VIEWER && nextProgress >= COMPLETE_THRESHOLD && dy < MAX_DY && !consumed) {
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
        const shouldCompleteByDistance = lastDx >= window.innerWidth * (isClientPage ? 0.14 : 0.24);
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

    document.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    document.addEventListener("touchend", finishGesture, { passive: true, capture: true });
    document.addEventListener("touchcancel", finishGesture, { passive: true, capture: true });

    return () => {
      edgeSwipeHandlersRef.current = { start: null, move: null, end: null };
      window.clearTimeout(resetTimer);
      window.clearTimeout(completeTimer);
      hardResetPreview();
      document.removeEventListener("touchstart", onTouchStart, { capture: true });
      document.removeEventListener("touchmove", onTouchMove, { capture: true });
      document.removeEventListener("touchend", finishGesture, { capture: true });
      document.removeEventListener("touchcancel", finishGesture, { capture: true });
    };
  }, [currentView, navigateBackFromClientPage, navigateToHub, navigateToLibrary]);

  useEffect(() => {
    setEdgeSwipeActive(false);
    setEdgeSwipeProgress(0);
    setEdgeSwipeDragging(false);
  }, [currentView]);

  useEffect(() => {
    let nativeBackTimer = 0;
    let nativeResetTimer = 0;

    const clearNativeTimers = () => {
      window.clearTimeout(nativeBackTimer);
      window.clearTimeout(nativeResetTimer);
    };

    const clampProgress = (value) => Math.max(0, Math.min(1, Number(value) || 0));

    const handleNativeStart = () => {
      if (currentView !== VIEWS.PDF_VIEWER) return;
      clearNativeTimers();
      setEdgeSwipeActive(true);
      setEdgeSwipeDragging(true);
      setEdgeSwipeProgress(0);
    };

    const handleNativeProgress = (event) => {
      if (currentView !== VIEWS.PDF_VIEWER) return;
      clearNativeTimers();
      setEdgeSwipeActive(true);
      setEdgeSwipeDragging(true);
      setEdgeSwipeProgress(clampProgress(event?.detail?.progress));
    };

    const handleNativeComplete = () => {
      if (currentView !== VIEWS.PDF_VIEWER) return;
      clearNativeTimers();
      setEdgeSwipeActive(true);
      setEdgeSwipeDragging(false);
      setEdgeSwipeProgress(1);
      nativeBackTimer = window.setTimeout(() => {
        navigateToHub();
        nativeResetTimer = window.setTimeout(() => {
          setEdgeSwipeActive(false);
          setEdgeSwipeProgress(0);
        }, 80);
      }, 180);
    };

    const handleNativeCancel = () => {
      if (currentView !== VIEWS.PDF_VIEWER) return;
      clearNativeTimers();
      setEdgeSwipeDragging(false);
      setEdgeSwipeProgress(0);
      nativeResetTimer = window.setTimeout(() => {
        setEdgeSwipeActive(false);
      }, 220);
    };

    window.addEventListener("kaleido-native-edge-start", handleNativeStart);
    window.addEventListener("kaleido-native-edge-progress", handleNativeProgress);
    window.addEventListener("kaleido-native-edge-complete", handleNativeComplete);
    window.addEventListener("kaleido-native-edge-cancel", handleNativeCancel);
    window.addEventListener("kaleido-native-edge-back", handleNativeComplete);
    return () => {
      clearNativeTimers();
      window.removeEventListener("kaleido-native-edge-start", handleNativeStart);
      window.removeEventListener("kaleido-native-edge-progress", handleNativeProgress);
      window.removeEventListener("kaleido-native-edge-complete", handleNativeComplete);
      window.removeEventListener("kaleido-native-edge-cancel", handleNativeCancel);
      window.removeEventListener("kaleido-native-edge-back", handleNativeComplete);
    };
  }, [currentView, navigateToHub]);

  return {
    edgeSwipeActive,
    edgeSwipeDragging,
    edgeSwipeHandlersRef,
    edgeSwipeProgress,
  };
}
