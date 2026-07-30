import React, { useEffect } from "react";
import { ADMIN_ROUTES } from "../../constants/adminRoutes";
import useAdminNavigation from "../../hooks/useAdminNavigation";
import AdminLegacyBridge from "./AdminLegacyBridge";
import { AdminNavigationProvider } from "./AdminNavigationContext";

export default function AdminRoot({
  isActive,
  isLegacyLoaded,
  onLegacyLoad,
}) {
  const navigation = useAdminNavigation(ADMIN_ROUTES.LEGACY);

  useEffect(() => {
    if (!isActive) navigation.reset(ADMIN_ROUTES.LEGACY);
  }, [isActive, navigation.reset]);

  return (
    <AdminNavigationProvider navigation={navigation}>
      <div
        data-kaleido-admin-root="true"
        data-admin-route={navigation.currentRoute.name}
        style={{ width: "100%", height: "100%" }}
      >
        <AdminLegacyBridge isLoaded={isLegacyLoaded} onLoad={onLegacyLoad} />
      </div>
    </AdminNavigationProvider>
  );
}
