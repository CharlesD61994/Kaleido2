(function () {
  const ADMIN_RETURN_KEY = "kaleido_admin_return_state";
  const RESUME_KEY = "kaleido_resume_state";
  const COMPLETE_DISTANCE = 72;
  const EDGE_SIZE = 28;
  const MAX_VERTICAL_DRIFT = 60;
  const isFramed = window.parent && window.parent !== window;

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
      // Le retour retombera simplement sur l'accueil.
    }
  };

  const isModifiedClick = (event) =>
    event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

  const isAdminInternalUrl = (url) =>
    url.origin === window.location.origin
      && /\/admin(?:-[a-z]+)?\.html$/.test(url.pathname)
      && url.pathname + url.search !== window.location.pathname + window.location.search;

  const navigateWithTransition = (href, { forceRootReturn = false } = {}) => {
    if (!href || document.documentElement.classList.contains("admin-is-leaving")) return;
    if (isFramed) {
      window.parent.postMessage({
        type: "kaleido-admin:navigate",
        href,
        rootReturn: forceRootReturn,
      }, "*");
      return;
    }
    if (forceRootReturn) writeAdminReturn();
    document.documentElement.classList.add("admin-is-leaving");
    window.setTimeout(() => {
      window.location.href = href;
    }, 120);
  };

  const preferredBackHref = () => {
    const rootBack = document.querySelector("#adminBackButton");
    if (rootBack) return { href: "/", forceRootReturn: true };
    const back = document.querySelector(".admin-header-back[href]");
    if (back) return { href: back.getAttribute("href"), forceRootReturn: false };
    return { href: "./admin.html", forceRootReturn: false };
  };

  const bindLinks = () => {
    document.addEventListener("click", (event) => {
      if (isModifiedClick(event)) return;
      const link = event.target.closest("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const url = new URL(href, window.location.href);
      const goesToAppRoot = url.origin === window.location.origin && url.pathname === "/";
      const forceRootReturn = Boolean(link.closest("#adminBackButton"));
      const isBackControl = Boolean(link.closest(".admin-header-back"));

      if (!goesToAppRoot && !isAdminInternalUrl(url)) return;

      event.preventDefault();
      if (isFramed && isBackControl && !forceRootReturn) {
        window.parent.postMessage({ type: "kaleido-admin:back" }, "*");
        return;
      }
      navigateWithTransition(url.href, { forceRootReturn });
    });
  };

  const bindEdgeSwipe = () => {
    let startX = 0;
    let startY = 0;
    let progress = 0;
    let dragging = false;
    let cancelled = false;
    const page = () => document.querySelector(".admin-storefront");

    const reset = () => {
      const shell = page();
      if (shell) {
        shell.style.transform = "";
        shell.style.transition = "";
        shell.style.boxShadow = "";
      }
      dragging = false;
      cancelled = false;
      progress = 0;
    };

    window.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (touch.clientX > EDGE_SIZE) return;
      if (event.target.closest("input, textarea, select, button, iframe, [data-admin-no-swipe='true']")) return;
      startX = touch.clientX;
      startY = touch.clientY;
      dragging = true;
      cancelled = false;
      const shell = page();
      if (!isFramed && shell) shell.style.transition = "none";
    }, { passive: true });

    window.addEventListener("touchmove", (event) => {
      if (!dragging || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);
      if (dy > MAX_VERTICAL_DRIFT) {
        cancelled = true;
        reset();
        return;
      }
      if (dx <= 0) return;
      progress = Math.min(dx, 132);
      const shell = page();
      if (!isFramed && shell) {
        shell.style.transform = `translate3d(${progress}px, 0, 0)`;
        shell.style.boxShadow = "-18px 0 34px rgba(16, 39, 68, 0.14)";
      }
      if (isFramed) {
        window.parent.postMessage({ type: "kaleido-admin:swipe-progress", progress }, "*");
      }
    }, { passive: true });

    window.addEventListener("touchend", () => {
      if (!dragging) return;
      const shell = page();
      const shouldGoBack = !cancelled && progress >= COMPLETE_DISTANCE;
      if (!shouldGoBack) {
        if (isFramed) {
          window.parent.postMessage({ type: "kaleido-admin:swipe-cancel" }, "*");
          reset();
          return;
        }
        if (shell) {
          shell.style.transition = "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 180ms ease";
          shell.style.transform = "";
          shell.style.boxShadow = "";
        }
        window.setTimeout(reset, 190);
        return;
      }
      const target = preferredBackHref();
      if (isFramed) {
        window.parent.postMessage({ type: "kaleido-admin:swipe-complete" }, "*");
        reset();
        return;
      }
      if (shell) {
        shell.style.transition = "transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1)";
        shell.style.transform = "translate3d(100%, 0, 0)";
      }
      navigateWithTransition(target.href, { forceRootReturn: target.forceRootReturn });
    }, { passive: true });

    window.addEventListener("touchcancel", reset, { passive: true });
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.classList.add("admin-is-ready");
    bindLinks();
    bindEdgeSwipe();
  });
})();
