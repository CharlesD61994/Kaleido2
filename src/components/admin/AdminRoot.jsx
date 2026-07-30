import React, { useCallback, useEffect, useRef, useState } from "react";
import { ADMIN_ROUTES } from "../../constants/adminRoutes";
import useAdminNavigation from "../../hooks/useAdminNavigation";
import AdminHomeScreen from "./AdminHomeScreen";
import AdminLegacyBridge from "./AdminLegacyBridge";
import { AdminNavigationProvider } from "./AdminNavigationContext";
import AdminPreviewScreen from "./AdminPreviewScreen";
import AdminProductsScreen from "./AdminProductsScreen";

export default function AdminRoot({
  isActive,
  onExit,
}) {
  const navigation = useAdminNavigation(ADMIN_ROUTES.HOME);
  const frameRefs = useRef(new Map());
  const backTimer = useRef(0);
  const [swipe, setSwipe] = useState({ completing: false, dragging: false, progress: 0 });

  useEffect(() => {
    if (!isActive) navigation.reset(ADMIN_ROUTES.HOME);
  }, [isActive, navigation.reset]);

  useEffect(() => {
    setSwipe({ completing: false, dragging: false, progress: 0 });
  }, [navigation.currentRoute.id]);

  useEffect(() => () => window.clearTimeout(backTimer.current), []);

  const finishBack = useCallback(() => {
    if (!navigation.canGoBack || swipe.completing) return;
    window.clearTimeout(backTimer.current);
    setSwipe((current) => ({ ...current, completing: true, dragging: false }));
    backTimer.current = window.setTimeout(() => {
      navigation.goBack();
    }, 210);
  }, [navigation, swipe.completing]);

  useEffect(() => {
    const handleMessage = (event) => {
      const route = navigation.currentRoute;
      if (route.name !== ADMIN_ROUTES.LEGACY) return;
      const frame = frameRefs.current.get(route.id);
      if (!frame || event.source !== frame.contentWindow) return;
      const data = event.data || {};

      if (data.type === "kaleido-admin:navigate") {
        if (data.rootReturn) {
          onExit();
          return;
        }
        if (Object.prototype.hasOwnProperty.call(data, "product")) {
          window.KaleidoAdminEditingProductSnapshot = data.product || null;
        }
        const targetUrl = new URL(data.href || "admin.html", window.location.href);
        const src = `${targetUrl.pathname.split("/").pop() || "admin.html"}${targetUrl.search}`;
        navigation.navigate(ADMIN_ROUTES.LEGACY, { src });
        return;
      }

      if (data.type === "kaleido-admin:back") {
        finishBack();
        return;
      }

      if (data.type === "kaleido-admin:swipe-progress") {
        setSwipe({
          completing: false,
          dragging: true,
          progress: Math.max(0, Math.min(Number(data.progress) || 0, window.innerWidth)),
        });
        return;
      }

      if (data.type === "kaleido-admin:swipe-cancel") {
        setSwipe((current) => ({ ...current, completing: false, dragging: false, progress: 0 }));
        return;
      }

      if (data.type === "kaleido-admin:swipe-complete") finishBack();
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [finishBack, navigation, onExit]);

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
    return (
      <AdminLegacyBridge
        ref={(node) => {
          if (node) frameRefs.current.set(route.id, node);
          else frameRefs.current.delete(route.id);
        }}
        src={route.params.src || "admin.html"}
      />
    );
  };

  return (
    <AdminNavigationProvider navigation={navigation}>
      <div
        data-kaleido-admin-root="true"
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
          const currentTransform = swipe.completing
            ? "translate3d(100vw, 0, 0)"
            : `translate3d(${swipe.progress}px, 0, 0)`;
          return (
            <div
              key={route.id}
              aria-hidden={!isCurrent}
              style={{
                position: "absolute",
                inset: 0,
                display: isVisible ? "block" : "none",
                zIndex: index + 1,
                overflow: "hidden",
                background: "var(--k-bg)",
                pointerEvents: isCurrent ? "auto" : "none",
                transform: isCurrent ? currentTransform : "translate3d(0, 0, 0)",
                transition: isCurrent && !swipe.dragging
                  ? "transform 210ms cubic-bezier(0.22, 1, 0.36, 1)"
                  : "none",
                animation: isCurrent && index > 0 && swipe.progress === 0
                  ? "adminReactEnter 220ms cubic-bezier(0.22, 1, 0.36, 1)"
                  : "none",
                boxShadow: isCurrent && (swipe.dragging || swipe.completing)
                  ? "-24px 0 44px rgba(16, 39, 68, 0.18)"
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
