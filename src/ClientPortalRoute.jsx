import { Suspense, lazy, useEffect, useState } from "react";
import { loadClientProjectByToken, markClientProjectSeen } from "./services/clientPortalStore";
import { THEME_CSS } from "./styles/theme";

const PublicClientPage = lazy(() => import("./PublicClientPage"));
const CLIENT_LOAD_RETRY_DELAYS = [0, 900, 2200];

function ClientPortalState({ title, message }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "var(--k-bg)",
        color: "var(--k-text)",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
      }}
    >
      <style>{`${THEME_CSS}@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap'); html, body, #root { margin: 0; min-height: 100%; width: 100%; background: var(--k-bg); } * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }`}</style>
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          borderRadius: 22,
          background: "var(--k-panel-gradient)",
          border: "1px solid var(--k-border)",
          padding: 22,
          boxShadow: "0 18px 52px rgba(0,0,0,0.34)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontFamily: "'Syne', sans-serif", letterSpacing: 0 }}>
          {title}
        </h1>
        <p style={{ margin: "10px 0 0", color: "#A8A6B8", fontSize: 14, lineHeight: 1.45 }}>
          {message}
        </p>
      </div>
    </div>
  );
}

export default function ClientPortalRoute({ token }) {
  const [state, setState] = useState({ loading: true, project: null, error: "" });

  useEffect(() => {
    if (!token) return undefined;

    let alive = true;
    const markSeen = () => {
      if (!alive || (typeof document !== "undefined" && document.hidden)) return;
      markClientProjectSeen(token);
    };

    markSeen();
    const timer = setInterval(markSeen, 120000);
    const onVisible = () => {
      if (!document.hidden) markSeen();
    };
    const onFocus = () => markSeen();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [token]);

  useEffect(() => {
    let alive = true;

    const load = async ({ quiet = false } = {}) => {
      if (!quiet) {
        setState((current) => ({ ...current, loading: true }));
      }

      let result = null;
      for (let index = 0; index < CLIENT_LOAD_RETRY_DELAYS.length; index += 1) {
        const delay = CLIENT_LOAD_RETRY_DELAYS[index];
        if (delay > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, delay));
        }
        result = await loadClientProjectByToken(token);
        if (!alive || result?.ok) break;
      }

      if (!alive) return;

      if (!result.ok) {
        setState({ loading: false, project: null, error: result.reason || "Le suivi client est indisponible." });
        return;
      }

      setState({ loading: false, project: result.project, error: "" });
    };

    load();
    const timer = setInterval(() => load({ quiet: true }), 180000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [token]);

  if (state.loading) {
    return <ClientPortalState title="Chargement du suivi" message="La fiche client est en train de s'ouvrir." />;
  }

  if (state.error) {
    return <ClientPortalState title="Lien indisponible" message={state.error} />;
  }

  return (
    <Suspense fallback={null}>
      <PublicClientPage project={state.project} />
    </Suspense>
  );
}
