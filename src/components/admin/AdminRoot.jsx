import React, { useEffect, useRef } from "react";
import { ADMIN_ROUTES } from "../../constants/adminRoutes";
import useAdminNavigation from "../../hooks/useAdminNavigation";
import AdminHomeScreen from "./AdminHomeScreen";
import AdminCatalogScreen from "./AdminCatalogScreen";
import { AdminNavigationProvider } from "./AdminNavigationContext";
import AdminPreviewScreen from "./AdminPreviewScreen";
import AdminProductEditorScreen from "./AdminProductEditorScreen";
import AdminProductsScreen from "./AdminProductsScreen";
import AdminStorefrontScreen from "./AdminStorefrontScreen";

export default function AdminRoot({
  isActive,
  onExit,
  patrons = [],
}) {
  const navigation = useAdminNavigation(ADMIN_ROUTES.HOME);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isActive) navigation.reset(ADMIN_ROUTES.HOME);
  }, [isActive, navigation.reset]);

  useEffect(() => {
    const root = rootRef.current;
    if (!isActive || !root || !navigation.canGoBack) return undefined;

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocityX = 0;
    let tracking = false;
    let locked = false;
    let targetLayer = null;
    let previousLayer = null;
    let completionTimer = 0;
    let cleanupTimer = 0;

    const clearTimers = () => {
      window.clearTimeout(completionTimer);
      window.clearTimeout(cleanupTimer);
    };

    const resetLayerStyles = () => {
      [targetLayer, previousLayer].filter(Boolean).forEach((layer) => {
        layer.style.removeProperty("transition");
        layer.style.removeProperty("transform");
        layer.style.removeProperty("filter");
        layer.style.removeProperty("box-shadow");
        layer.style.removeProperty("will-change");
        layer.style.removeProperty("animation");
      });
      targetLayer = null;
      previousLayer = null;
    };

    const animateBackToOrigin = () => {
      if (!targetLayer) return;
      targetLayer.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease";
      targetLayer.style.transform = "translate3d(0, 0, 0)";
      targetLayer.style.boxShadow = "none";
      if (previousLayer) {
        previousLayer.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease";
        previousLayer.style.transform = "translate3d(-22px, 0, 0)";
        previousLayer.style.filter = "brightness(0.88)";
      }
      cleanupTimer = window.setTimeout(resetLayerStyles, 230);
    };

    const completeBack = () => {
      if (!targetLayer) return;
      const backButton = root.querySelector(
        '[data-kaleido-admin-route-layer="current"] [data-kaleido-admin-back-button="true"]',
      );
      const width = Math.max(root.clientWidth, window.innerWidth, 1);
      targetLayer.style.transition = "transform 210ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 210ms ease";
      targetLayer.style.transform = `translate3d(${width}px, 0, 0)`;
      targetLayer.style.boxShadow = "-24px 0 54px rgba(0, 0, 0, 0.22)";
      if (previousLayer) {
        previousLayer.style.transition = "transform 210ms cubic-bezier(0.22, 1, 0.36, 1), filter 210ms ease";
        previousLayer.style.transform = "translate3d(0, 0, 0)";
        previousLayer.style.filter = "brightness(1)";
      }
      completionTimer = window.setTimeout(() => {
        backButton?.click();
        window.requestAnimationFrame(resetLayerStyles);
      }, 190);
    };

    const isInteractiveTarget = (target) => (
      target instanceof Element
      && Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"]'))
    );

    const onTouchStart = (event) => {
      if (!event.touches || event.touches.length !== 1) return;
      if (isInteractiveTarget(event.target)) return;
      const touch = event.touches[0];
      if (touch.clientX > 36) return;

      clearTimers();
      const routeLayer = root.querySelector('[data-kaleido-admin-route-layer="current"]');
      const subpage = routeLayer?.querySelector(".admin-editor-subpage");
      targetLayer = subpage || routeLayer;
      previousLayer = subpage
        ? null
        : root.querySelector('[data-kaleido-admin-route-layer="previous"]');
      if (!targetLayer) return;

      startX = touch.clientX;
      startY = touch.clientY;
      lastX = touch.clientX;
      lastTime = performance.now();
      velocityX = 0;
      tracking = true;
      locked = false;
      targetLayer.style.animation = "none";
      targetLayer.style.willChange = "transform, box-shadow";
      if (previousLayer) {
        previousLayer.style.transform = "translate3d(-22px, 0, 0)";
        previousLayer.style.filter = "brightness(0.88)";
        previousLayer.style.willChange = "transform, filter";
      }
    };

    const onTouchMove = (event) => {
      if (!tracking || !event.touches || event.touches.length !== 1 || !targetLayer) return;
      const touch = event.touches[0];
      const dx = Math.max(0, touch.clientX - startX);
      const dy = Math.abs(touch.clientY - startY);
      if (!locked) {
        if (dx > 10 && dy < 22) {
          locked = true;
        } else if (dy > 22 && dy > dx * 1.8) {
          tracking = false;
          animateBackToOrigin();
          return;
        }
      }
      if (!locked) return;

      event.preventDefault();
      const now = performance.now();
      velocityX = (touch.clientX - lastX) / Math.max(1, now - lastTime);
      lastX = touch.clientX;
      lastTime = now;
      const width = Math.max(root.clientWidth, window.innerWidth, 1);
      const progress = Math.min(1, dx / width);
      targetLayer.style.transition = "none";
      targetLayer.style.transform = `translate3d(${dx}px, 0, 0)`;
      targetLayer.style.boxShadow = `-24px 0 54px rgba(0, 0, 0, ${0.12 + progress * 0.18})`;
      if (previousLayer) {
        previousLayer.style.transition = "none";
        previousLayer.style.transform = `translate3d(${-22 + progress * 22}px, 0, 0)`;
        previousLayer.style.filter = `brightness(${0.88 + progress * 0.12})`;
      }
    };

    const onTouchEnd = () => {
      if (!tracking || !targetLayer) {
        tracking = false;
        locked = false;
        return;
      }
      const distance = Math.max(0, lastX - startX);
      const width = Math.max(root.clientWidth, window.innerWidth, 1);
      if (locked && (distance >= width * 0.24 || (distance >= 22 && velocityX >= 0.2))) {
        completeBack();
      } else {
        animateBackToOrigin();
      }
      tracking = false;
      locked = false;
    };

    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    root.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      clearTimers();
      resetLayerStyles();
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isActive, navigation.canGoBack, navigation.currentRoute.id]);

  const renderRoute = (route) => {
    if (route.name === ADMIN_ROUTES.HOME) {
      return <AdminHomeScreen navigation={navigation} onExit={onExit} />;
    }
    if (route.name === ADMIN_ROUTES.PREVIEW) {
      return <AdminPreviewScreen navigation={navigation} />;
    }
    if (route.name === ADMIN_ROUTES.PRODUCTS) {
      return <AdminProductsScreen navigation={navigation} />;
    }
    if (route.name === ADMIN_ROUTES.CATALOG) {
      return <AdminCatalogScreen navigation={navigation} />;
    }
    if (route.name === ADMIN_ROUTES.PRODUCT_EDITOR) {
      return (
        <AdminProductEditorScreen
          navigation={navigation}
          productId={route.params.productId || null}
          patrons={patrons}
        />
      );
    }
    if (route.name === ADMIN_ROUTES.STOREFRONT) {
      return <AdminStorefrontScreen navigation={navigation} />;
    }
    return <AdminHomeScreen navigation={navigation} onExit={onExit} />;
  };

  return (
    <AdminNavigationProvider navigation={navigation}>
      <div
        ref={rootRef}
        data-kaleido-admin-root="true"
        data-admin-can-go-back={navigation.canGoBack ? "true" : "false"}
        data-admin-route={navigation.currentRoute.name}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "var(--k-bg)",
        }}
      >
        <style>{`
          @keyframes adminReactEnter {
            from { transform: translate3d(100%, 0, 0); }
            to { transform: translate3d(0, 0, 0); }
          }
        `}</style>
        {navigation.stack.map((route, index) => {
          const isCurrent = index === navigation.stack.length - 1;
          const isPrevious = index === navigation.stack.length - 2;
          const isVisible = isCurrent || isPrevious;
          return (
            <div
              key={route.id}
              aria-hidden={!isCurrent}
              data-kaleido-admin-route-layer={isCurrent ? "current" : "previous"}
              style={{
                position: "absolute",
                inset: 0,
                display: isVisible ? "block" : "none",
                zIndex: index + 1,
                overflow: "hidden",
                background: "var(--k-bg)",
                pointerEvents: isCurrent ? "auto" : "none",
                transform: "translate3d(0, 0, 0)",
                animation: isCurrent && index > 0
                  ? "adminReactEnter 220ms cubic-bezier(0.22, 1, 0.36, 1)"
                  : "none",
                willChange: "transform",
              }}
            >
              {renderRoute(route)}
            </div>
          );
        })}
      </div>
    </AdminNavigationProvider>
  );
}
