import { useEffect, useState } from "react";
import { setActiveCloudUserId } from "../services/authStore";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";

export default function useKaleidoAuth() {
  const [authState, setAuthState] = useState({
    loading: isSupabaseConfigured,
    user: null,
  });

  useEffect(() => {
    let alive = true;

    if (!isSupabaseConfigured || !supabase) {
      setActiveCloudUserId("");
      setAuthState({ loading: false, user: null });
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const user = data?.session?.user || null;
      setActiveCloudUserId(user?.id || "");
      setAuthState({ loading: false, user });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setActiveCloudUserId(user?.id || "");
      setAuthState({ loading: false, user });
    });

    return () => {
      alive = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  return {
    ...authState,
    enabled: isSupabaseConfigured,
  };
}
