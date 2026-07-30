(function () {
  const ADMIN_RETURN_KEY = "kaleido_admin_return_state";
  const RESUME_KEY = "kaleido_resume_state";
  let activeFrame = document.querySelector("#adminShellActive");
  let nextFrame = document.querySelector("#adminShellNext");
  const stage = document.querySelector("#adminShellStage");
  const stack = ["./admin.html"];
  let currentHref = new URL("./admin.html", window.location.href).href;
  let isNavigating = false;
  let preparedBackHref = "";
  let resetTimer = null;

  const readJson = (key) => {
    try {
      return JSON.parse(window.localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };

  const writeAdminReturn = () => {
    try {
      const existingReturn = readJson(ADMIN_RETURN_KEY);
      const fallbackResume = readJson(RESUME_KEY);
      const target = existingReturn || fallbackResume || { view: "hub", mode: "personal" };
      window.localStorage.setItem(
        ADMIN_RETURN_KEY,
        JSON.stringify({
          ...target,
          view: target.view || "hub",
          mode: target.mode === "pro" ? "pro" : "personal",
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // Rien a faire.
    }
  };

  const normalizeHref = (href) => new URL(href || "./admin.html", currentHref).href;
  const isEmbeddedInApp = () => window.parent && window.parent !== window;

  const setFrameInteractivity = (enabled) => {
    [activeFrame, nextFrame].forEach((frame) => {
      if (frame) frame.style.pointerEvents = enabled ? "" : "none";
    });
  };

  const cleanNextFrame = () => {
    if (!nextFrame) return;
    nextFrame.classList.remove("is-active", "is-preparing");
    nextFrame.style.transition = "none";
    nextFrame.style.transform = "translate3d(100%, 0, 0)";
    nextFrame.style.opacity = "";
    nextFrame.style.zIndex = "";
    nextFrame.style.boxShadow = "";
    nextFrame.removeAttribute("src");
    preparedBackHref = "";
  };

  const prepareBackFrame = () => {
    if (!nextFrame || stack.length <= 1) return null;
    const targetHref = stack[stack.length - 2];
    if (preparedBackHref !== targetHref) {
      nextFrame.classList.remove("is-active", "is-preparing");
      nextFrame.style.transition = "none";
      nextFrame.style.transform = "translate3d(-14%, 0, 0)";
      nextFrame.style.opacity = "1";
      nextFrame.style.zIndex = "1";
      nextFrame.src = targetHref;
      preparedBackHref = targetHref;
    }
    if (activeFrame) activeFrame.style.zIndex = "3";
    return targetHref;
  };

  const resetSwipe = () => {
    if (!activeFrame) return;
    activeFrame.style.transition = "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 180ms ease";
    activeFrame.style.transform = "";
    activeFrame.style.boxShadow = "";
    activeFrame.style.zIndex = "";
    if (nextFrame && preparedBackHref) {
      nextFrame.style.transition = "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)";
      nextFrame.style.transform = "translate3d(-14%, 0, 0)";
      window.setTimeout(cleanNextFrame, 190);
    }
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      activeFrame.style.transition = "";
      activeFrame.style.boxShadow = "";
    }, 190);
  };

  const finishToApp = () => {
    if (isEmbeddedInApp()) {
      window.parent.postMessage({ type: "kaleido-admin:return-app" }, "*");
      return;
    }
    writeAdminReturn();
    document.documentElement.classList.add("admin-shell-leaving");
    window.setTimeout(() => {
      window.location.href = "/";
    }, 130);
  };

  const finishPreparedBack = () => {
    if (!activeFrame || !nextFrame || stack.length <= 1 || isNavigating) {
      finishToApp();
      return;
    }
    const targetHref = prepareBackFrame();
    if (!targetHref) return;
    isNavigating = true;
    setFrameInteractivity(false);
    activeFrame.style.transition = "transform 190ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 190ms ease";
    nextFrame.style.transition = "transform 190ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    activeFrame.style.transform = "translate3d(100%, 0, 0)";
    activeFrame.style.boxShadow = "-18px 0 34px rgba(16, 39, 68, 0.14)";
    nextFrame.style.transform = "translate3d(0, 0, 0)";

    window.setTimeout(() => {
      stack.pop();
      const previousFrame = activeFrame;
      activeFrame = nextFrame;
      nextFrame = previousFrame;
      activeFrame.classList.add("is-active");
      activeFrame.style.transition = "";
      activeFrame.style.transform = "";
      activeFrame.style.opacity = "";
      activeFrame.style.zIndex = "";
      cleanNextFrame();
      currentHref = targetHref;
      isNavigating = false;
      setFrameInteractivity(true);
    }, 205);
  };

  const animateTo = (href, { direction = "forward", replace = false, rootReturn = false } = {}) => {
    if (rootReturn) {
      finishToApp();
      return;
    }
    const targetHref = normalizeHref(href);
    if (!activeFrame || !nextFrame || targetHref === currentHref || isNavigating) return;
    isNavigating = true;
    setFrameInteractivity(false);

    const fromX = direction === "back" ? "-28%" : "100%";
    const outX = direction === "back" ? "100%" : "-28%";

    nextFrame.classList.add("is-preparing");
    nextFrame.style.transition = "none";
    nextFrame.style.transform = `translate3d(${fromX}, 0, 0)`;
    nextFrame.style.opacity = "0";
    nextFrame.style.zIndex = "3";
    nextFrame.src = targetHref;

    nextFrame.onload = () => {
      nextFrame.onload = null;
      window.requestAnimationFrame(() => {
        nextFrame.classList.remove("is-preparing");
        nextFrame.classList.add("is-active");
        nextFrame.style.opacity = "1";
        nextFrame.style.transition = "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 120ms ease";
        activeFrame.style.transition = "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease";
        activeFrame.style.transform = `translate3d(${outX}, 0, 0)`;
        activeFrame.style.opacity = direction === "back" ? "0.98" : "0.88";
        nextFrame.style.transform = "translate3d(0, 0, 0)";
      });

      window.setTimeout(() => {
        const previousFrame = activeFrame;
        activeFrame = nextFrame;
        nextFrame = previousFrame;
        activeFrame.classList.add("is-active");
        activeFrame.style.transition = "";
        activeFrame.style.transform = "";
        activeFrame.style.opacity = "";
        activeFrame.style.zIndex = "";
        cleanNextFrame();
        currentHref = targetHref;
        if (!replace && direction !== "back") stack.push(targetHref);
        if (replace) stack[stack.length - 1] = targetHref;
        isNavigating = false;
        setFrameInteractivity(true);
      }, 245);
    };
  };

  const goBack = () => {
    if (stack.length <= 1) {
      finishToApp();
      return;
    }
    stack.pop();
    animateTo(stack[stack.length - 1], { direction: "back", replace: true });
  };

  window.addEventListener("message", (event) => {
    if (event.source !== activeFrame?.contentWindow && event.source !== nextFrame?.contentWindow) return;
    const data = event.data || {};
    if (data.type === "kaleido-admin:navigate") {
      if (data.rootReturn) {
        finishToApp();
        return;
      }
      if (Object.prototype.hasOwnProperty.call(data, "product")) {
        window.KaleidoAdminEditingProductSnapshot = data.product || null;
      }
      animateTo(data.href, { direction: data.direction || "forward", replace: Boolean(data.replace) });
    }
    if (data.type === "kaleido-admin:back") goBack();
    if (data.type === "kaleido-admin:swipe-progress" && activeFrame) {
      const progress = Math.max(0, Math.min(Number(data.progress) || 0, 132));
      if (stack.length <= 1 && isEmbeddedInApp()) {
        window.parent.postMessage({ type: "kaleido-admin-root:swipe-progress", progress: progress / 132 }, "*");
        return;
      }
      prepareBackFrame();
      activeFrame.style.transition = "none";
      activeFrame.style.transform = `translate3d(${progress}px, 0, 0)`;
      activeFrame.style.boxShadow = "-18px 0 34px rgba(16, 39, 68, 0.14)";
      if (nextFrame && preparedBackHref) {
        const previewOffset = Math.max(-14, -14 + (progress / 132) * 14);
        nextFrame.style.transition = "none";
        nextFrame.style.transform = `translate3d(${previewOffset}%, 0, 0)`;
      }
    }
    if (data.type === "kaleido-admin:swipe-cancel") {
      if (stack.length <= 1 && isEmbeddedInApp()) {
        window.parent.postMessage({ type: "kaleido-admin-root:swipe-cancel" }, "*");
        return;
      }
      resetSwipe();
    }
    if (data.type === "kaleido-admin:swipe-complete") {
      if (stack.length <= 1 && isEmbeddedInApp()) {
        window.parent.postMessage({ type: "kaleido-admin-root:swipe-complete" }, "*");
        return;
      }
      finishPreparedBack();
    }
  });

  activeFrame?.addEventListener("load", () => {
    if (stage) stage.classList.add("is-loaded");
  });
})();
