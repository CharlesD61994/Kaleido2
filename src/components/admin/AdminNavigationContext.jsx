import React, { createContext, useContext } from "react";

const AdminNavigationContext = createContext(null);

export function AdminNavigationProvider({ children, navigation }) {
  return (
    <AdminNavigationContext.Provider value={navigation}>
      {children}
    </AdminNavigationContext.Provider>
  );
}

export function useAdminNavigationContext() {
  const navigation = useContext(AdminNavigationContext);
  if (!navigation) {
    throw new Error("useAdminNavigationContext doit être utilisé dans AdminNavigationProvider.");
  }
  return navigation;
}
