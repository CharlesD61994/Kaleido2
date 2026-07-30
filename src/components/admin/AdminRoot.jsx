import React, { useEffect } from "react";
import { ADMIN_ROUTES } from "../../constants/adminRoutes";
import useAdminNavigation from "../../hooks/useAdminNavigation";
import AdminHomeScreen from "./AdminHomeScreen";
import { AdminNavigationProvider } from "./AdminNavigationContext";
import AdminPreviewScreen from "./AdminPreviewScreen";
import AdminProductEditorScreen from "./AdminProductEditorScreen";
import AdminProductsScreen from "./AdminProductsScreen";
import AdminStorefrontScreen from "./AdminStorefrontScreen";

export default function AdminRoot({
  isActive,
  onExit,
}) {
  const navigation = useAdminNavigation(ADMIN_ROUTES.HOME);

  useEffect(() => {
    if (!isActive) navigation.reset(ADMIN_ROUTES.HOME);
  }, [isActive, navigation.reset]);

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
    if (route.name === ADMIN_ROUTES.PRODUCT_EDITOR) {
      return (
        <AdminProductEditorScreen
          navigation={navigation}
          productId={route.params.productId || null}
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
