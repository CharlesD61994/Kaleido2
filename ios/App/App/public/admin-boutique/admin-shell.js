(function () {
  const ADMIN_RETURN_KEY = "kaleido_admin_return_state";
  const RESUME_KEY = "kaleido_resume_state";
  const stage = document.querySelector("#adminShellStage");
  const initialFrame = document.querySelector("#adminShellActive");
  const spareFrame = document.querySelector("#adminShellNext");
  const pages = [];
  let isNavigating = false;
  let resetTimer = 0;

  const readJson = (key) => {
    try {
      return JSON.parse(window.localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };

  const writeAdminReturn = () => {
    try {
      const target = readJson(ADMIN_RETURN_KEY)
        || readJson(RESUME_KEY)
        || { view: "hub", mode: "personal" };
      window.localStorage.setItem(ADMIN_RETURN_KEY, JSON.stringify({
        ...target,
        view: target.view || "hub",
        mode: target.mode === "pro" ? "pro" : "personal",
        savedAt: new Date().toISOString(),
      }));
    } catch {
      // Le retour retombera sur l'accueil.
    }
  };

  const isEmbeddedInApp = () => window.parent && window.parent !== window;
  const currentPage = () => pages[pages.length - 1] || null;
  const previousPage = () => pages[pages.length - 2] || null;
  const normalizeHref = (href) =>
    new URL(href || "./admin.html", currentPage()?.href || window.location.href).href;

  const setPageState = (page, { active = false, transform = "", transition = "", shadow = "" } = {}) => {
    if (!page?.frame) return;
    page.frame.classList.toggle("is-active", active);
    page.frame.classList.remove("is-preparing");
    page.frame.style.pointerEvents = active ? "auto" : "none";
    page.frame.style.zIndex = active ? "3" : "1";
    page.frame.style.transform = transform;
    page.frame.style.transition = transition;
    page.frame.style.opacity = "1";
    page.frame.style.boxShadow = shadow;
  };

  const restoreStack = () => {
    pages.forEach((page, index) => {
      const isTop = index === pages.length - 1;
      setPageState(page, {
        active: isTop,
        transform: "",
      });
    });
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

  const makeFrame = (href) => {
    const frame = document.createElement("iframe");
    frame.className = "admin-shell-frame is-preparing";
    frame.title = "Admin Kaleido";
    frame.style.pointerEvents = "none";
    frame.style.zIndex = "4";
    frame.style.transform = "translate3d(100%, 0, 0)";
    frame.style.opacity = "0";
    frame.src = href;
    stage.appendChild(frame);
    return frame;
  };

  const animateForward = (href, { replace = false } = {}) => {
    if (isNavigating) return;
    const targetHref = normalizeHref(href);
    if (targetHref === currentPage()?.href) return;
    isNavigating = true;
    window.clearTimeout(resetTimer);

    const outgoing = currentPage();
    const frame = makeFrame(targetHref);
    const incoming = { href: targetHref, frame };

    frame.onload = () => {
      frame.onload = null;
      window.requestAnimationFrame(() => {
        frame.classList.remove("is-preparing");
        frame.classList.add("is-active");
        frame.style.opacity = "1";
        frame.style.pointerEvents = "none";
        frame.style.transition = "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 120ms ease";
        frame.style.transform = "translate3d(0, 0, 0)";
        if (outgoing) {
          outgoing.frame.classList.remove("is-active");
          outgoing.frame.style.pointerEvents = "none";
          outgoing.frame.style.transition = "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease";
          outgoing.frame.style.transform = "";
          outgoing.frame.style.opacity = "0.98";
        }
      });

      window.setTimeout(() => {
        if (replace && outgoing) {
          pages.pop();
          outgoing.frame.remove();
        }
        pages.push(incoming);
        restoreStack();
        isNavigating = false;
      }, 245);
    };
  };

  const animateBack = () => {
    if (isNavigating) return;
    if (pages.length <= 1) {
      finishToApp();
      return;
    }
    isNavigating = true;
    window.clearTimeout(resetTimer);
    const outgoing = currentPage();
    const incoming = previousPage();

    setPageState(incoming, {
      active: false,
      transform: "",
      transition: "none",
    });
    outgoing.frame.style.pointerEvents = "none";
    outgoing.frame.style.transition = "transform 190ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 190ms ease";
    outgoing.frame.style.transform = "translate3d(100%, 0, 0)";
    outgoing.frame.style.boxShadow = "-18px 0 34px rgba(16, 39, 68, 0.14)";

    window.setTimeout(() => {
      pages.pop();
      outgoing.frame.remove();
      restoreStack();
      isNavigating = false;
    }, 205);
  };

  const resetSwipe = () => {
    if (isNavigating) return;
    const outgoing = currentPage();
    const incoming = previousPage();
    if (!outgoing) return;
    window.clearTimeout(resetTimer);
    outgoing.frame.style.transition = "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 180ms ease";
    outgoing.frame.style.transform = "";
    outgoing.frame.style.boxShadow = "";
    if (incoming) {
      incoming.frame.style.transition = "none";
      incoming.frame.style.transform = "";
    }
    resetTimer = window.setTimeout(restoreStack, 190);
  };

  if (spareFrame) spareFrame.remove();
  if (initialFrame) {
    initialFrame.style.pointerEvents = "auto";
    initialFrame.style.zIndex = "3";
    pages.push({
      href: new URL(initialFrame.getAttribute("src") || "./admin.html", window.location.href).href,
      frame: initialFrame,
    });
    initialFrame.addEventListener("load", () => stage?.classList.add("is-loaded"), { once: true });
  }

  window.addEventListener("message", (event) => {
    const page = currentPage();
    if (!page || event.source !== page.frame.contentWindow) return;
    const data = event.data || {};

    if (data.type === "kaleido-admin:navigate") {
      if (data.rootReturn) {
        finishToApp();
        return;
      }
      if (Object.prototype.hasOwnProperty.call(data, "product")) {
        window.KaleidoAdminEditingProductSnapshot = data.product || null;
      }
      animateForward(data.href, { replace: Boolean(data.replace) });
      return;
    }

    if (data.type === "kaleido-admin:back") {
      animateBack();
      return;
    }

    if (data.type === "kaleido-admin:swipe-progress") {
      if (isNavigating) return;
      const progress = Math.max(0, Math.min(Number(data.progress) || 0, 132));
      if (pages.length <= 1 && isEmbeddedInApp()) {
        window.parent.postMessage({ type: "kaleido-admin-root:swipe-progress", progress: progress / 132 }, "*");
        return;
      }
      const incoming = previousPage();
      page.frame.style.transition = "none";
      page.frame.style.transform = `translate3d(${progress}px, 0, 0)`;
      page.frame.style.boxShadow = "-18px 0 34px rgba(16, 39, 68, 0.14)";
      if (incoming) {
        incoming.frame.style.transition = "none";
        incoming.frame.style.transform = "";
      }
      return;
    }

    if (data.type === "kaleido-admin:swipe-cancel") {
      if (pages.length <= 1 && isEmbeddedInApp()) {
        window.parent.postMessage({ type: "kaleido-admin-root:swipe-cancel" }, "*");
      } else {
        resetSwipe();
      }
      return;
    }

    if (data.type === "kaleido-admin:swipe-complete") {
      if (pages.length <= 1 && isEmbeddedInApp()) {
        window.parent.postMessage({ type: "kaleido-admin-root:swipe-complete" }, "*");
      } else {
        animateBack();
      }
    }
  });
})();
