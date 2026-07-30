import { useCallback, useMemo, useRef, useState } from "react";
import { ADMIN_ROUTES, createAdminRoute } from "../constants/adminRoutes";

export default function useAdminNavigation(initialRoute = ADMIN_ROUTES.HOME) {
  const initialRouteRef = useRef(createAdminRoute(initialRoute));
  const [stack, setStack] = useState([initialRouteRef.current]);

  const navigate = useCallback((name, params = {}) => {
    setStack((current) => [...current, createAdminRoute(name, params)]);
  }, []);

  const replace = useCallback((name, params = {}) => {
    setStack((current) => [
      ...current.slice(0, -1),
      createAdminRoute(name, params),
    ]);
  }, []);

  const goBack = useCallback(() => {
    setStack((current) => (
      current.length > 1 ? current.slice(0, -1) : current
    ));
  }, []);

  const reset = useCallback((name = initialRoute, params = {}) => {
    setStack([createAdminRoute(name, params)]);
  }, [initialRoute]);

  return useMemo(() => ({
    canGoBack: stack.length > 1,
    currentRoute: stack[stack.length - 1],
    goBack,
    navigate,
    previousRoute: stack.length > 1 ? stack[stack.length - 2] : null,
    replace,
    reset,
    stack,
  }), [goBack, navigate, replace, reset, stack]);
}
