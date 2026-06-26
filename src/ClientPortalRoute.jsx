import { Suspense, lazy, useEffect, useState } from "react";
import { loadClientProjectByToken } from "./services/clientPortalStore";
import { THEME_CSS } from "./styles/theme";

const ClientPage = lazy(() => import("./ClientPage"));

function ClientPortalState({ title, message }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--k-bg)",
        color: "var(--k-text)",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
      }}
    >
      <style>{`${THEME_CSS}@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap'); * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }`}</style>
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
    let alive = true;

    const load = async ({ quiet = false } = {}) => {
      if (!quiet) {
        setState((current) => ({ ...current, loading: true }));
      }

      const result = await loadClientProjectByToken(token);
      if (!alive) return;

      if (!result.ok) {
        setState({ loading: false, project: null, error: result.reason || "Le suivi client est indisponible." });
        return;
      }

      setState({ loading: false, project: result.project, error: "" });
    };

    load();
    const timer = setInterval(() => load({ quiet: true }), 10000);

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
      <ClientPage project={state.project} publicView />
    </Suspense>
  );
}
