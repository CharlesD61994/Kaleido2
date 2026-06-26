import { useEffect } from "react";

export default function usePressedFeedback() {
  useEffect(() => {
    const selector = 'button, [data-kaleido-pressable="true"]';
    let activeEl = null;
    let clearTimer = 0;

    const clearPressed = (el) => {
      if (!el) return;
      el.removeAttribute("data-kaleido-pressed");
    };

    const setPressedFromTarget = (target) => {
      if (!(target instanceof Element)) return null;
      const el = target.closest(selector);
      if (!el) return null;
      if (activeEl && activeEl !== el) {
        clearPressed(activeEl);
      }
      activeEl = el;
      activeEl.setAttribute("data-kaleido-pressed", "true");
      return activeEl;
    };

    const releasePressed = () => {
      window.clearTimeout(clearTimer);
      const el = activeEl;
      if (!el) return;
      clearTimer = window.setTimeout(() => {
        clearPressed(el);
        if (activeEl === el) activeEl = null;
      }, 110);
    };

    const onPointerDown = (event) => {
      setPressedFromTarget(event.target);
    };

    const onPointerUp = () => {
      releasePressed();
    };

    const onPointerCancel = () => {
      if (activeEl) {
        clearPressed(activeEl);
        activeEl = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden" && activeEl) {
        clearPressed(activeEl);
        activeEl = null;
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerCancel, true);
    window.addEventListener("blur", onPointerCancel);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(clearTimer);
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerCancel, true);
      window.removeEventListener("blur", onPointerCancel);
      document.removeEventListener("visibilitychange", onVisibility);
      if (activeEl) clearPressed(activeEl);
    };
  }, []);
}
