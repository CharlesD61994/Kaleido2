import { useEffect, useState } from "react";
import { computeProgress } from "./services/progressStore";
import { KALEIDOSCOPE_COLORS } from "./constants/colors";
import ClientChatPreview from "./components/clients/ClientChatPreview";
import ClientInfoRow from "./components/clients/ClientInfoRow";
import ClientPageHeader from "./components/clients/ClientPageHeader";
import ClientProgressCard from "./components/clients/ClientProgressCard";
import ClientSectionCard from "./components/clients/ClientSectionCard";
import ClientShareCard from "./components/clients/ClientShareCard";
import ClientSummaryCard from "./components/clients/ClientSummaryCard";
import { THEME_CSS } from "./styles/theme";
import { IOS_TOP_PADDING } from "./styles/layout";

export default function ClientPage({ project, onBack, onEditClient, onMarkMessagesRead, onPublishClientProject, publicView = false }) {
  const [publicThemeMode, setPublicThemeMode] = useState(() => {
    if (!publicView || typeof window === "undefined") return "dark";
    return window.localStorage.getItem("kaleido-client-theme") === "light" ? "light" : "dark";
  });
  const progress = computeProgress(project);
  const color = KALEIDOSCOPE_COLORS[(project?.colorIdx || 0) % KALEIDOSCOPE_COLORS.length];
  const statusLabel = project?.status === "termine" ? "Terminé" : "En cours";
  const clientInitial = (project?.client || "?").trim().charAt(0).toUpperCase() || "?";
  const pageMinHeight = publicView ? "100vh" : "100dvh";
  const contentPaddingTop = publicView ? 18 : IOS_TOP_PADDING;

  useEffect(() => {
    if (!publicView && project?.clientShareToken && typeof onMarkMessagesRead === "function") {
      onMarkMessagesRead(project);
    }
  }, [project?.id, project?.clientShareToken, publicView]);

  useEffect(() => {
    if (!publicView || typeof document === "undefined") return undefined;

    const bg = publicThemeMode === "light" ? "#F7F4FB" : "#0D0D1A";
    const html = document.documentElement;
    const body = document.body;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const previousHtmlBg = html.style.backgroundColor;
    const previousBodyBg = body.style.backgroundColor;
    const previousThemeColor = themeMeta?.getAttribute("content") || "";

    html.style.backgroundColor = bg;
    body.style.backgroundColor = bg;
    if (themeMeta) themeMeta.setAttribute("content", bg);

    return () => {
      html.style.backgroundColor = previousHtmlBg;
      body.style.backgroundColor = previousBodyBg;
      if (themeMeta) themeMeta.setAttribute("content", previousThemeColor);
    };
  }, [publicThemeMode, publicView]);

  const togglePublicTheme = () => {
    setPublicThemeMode((current) => {
      const next = current === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kaleido-client-theme", next);
      }
      return next;
    });
  };

  return (
    <div
      data-kaleido-theme={publicView ? publicThemeMode : undefined}
      style={{
        background: "var(--k-bg)",
        minHeight: pageMinHeight,
        width: "100%",
        height: publicView ? "100vh" : undefined,
        fontFamily: "'DM Sans', sans-serif",
        maxWidth: publicView ? "100%" : 430,
        margin: publicView ? "0" : "0 auto",
        color: "var(--k-text)",
        position: publicView ? "fixed" : "relative",
        inset: publicView ? 0 : undefined,
        overflowX: "hidden",
        overflowY: publicView ? "auto" : "hidden",
        overflowAnchor: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <style>{`${THEME_CSS}@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap'); html, body, #root { margin: 0; min-height: 100%; width: 100%; background: var(--k-bg); } body { overflow-x: hidden; } * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; } input, textarea, select { font-size: 16px !important; }`}</style>

      <div
        style={{
          position: publicView ? "fixed" : "absolute",
          inset: 0,
          width: "100vw",
          height: publicView ? "100vh" : "100%",
          minHeight: pageMinHeight,
          background: `radial-gradient(circle at 18% 0%, ${color.bg}40, transparent 34%), radial-gradient(circle at 92% 8%, rgba(236,72,153,0.18), transparent 32%), radial-gradient(circle at 50% 100%, rgba(6,182,212,0.10), transparent 36%), var(--k-bg)`,
          pointerEvents: "none",
        }}
      />

      {publicView ? (
        <button
          type="button"
          onClick={togglePublicTheme}
          style={{
            position: "absolute",
            top: 14,
            right: 20,
            zIndex: 4,
            border: "1px solid var(--k-control-border)",
            borderRadius: 999,
            background: "var(--k-surface-2)",
            color: "var(--k-text)",
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
          }}
        >
          {publicThemeMode === "light" ? "Mode sombre" : "Mode clair"}
        </button>
      ) : null}

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 430, margin: "0 auto", padding: `${contentPaddingTop} 20px 28px` }}>
        <ClientPageHeader project={project} color={color} onBack={onBack} publicView={publicView} />
        <ClientSummaryCard project={project} color={color} clientInitial={clientInitial} onEditClient={onEditClient} publicView={publicView} />

        {!publicView && (
          <ClientShareCard project={project} color={color} onPublishClientProject={onPublishClientProject} />
        )}

        <ClientSectionCard
          title="Informations client"
          subtitle={publicView ? "Informations liées à votre projet." : "Données utilisées pour le suivi du projet et le futur espace client."}
        >
          <ClientInfoRow label="Nom" value={project?.client} />
          {!publicView && <ClientInfoRow label="Courriel" value={project?.email} />}
          <ClientInfoRow label="Projet associé" value={project?.name} />
        </ClientSectionCard>

        <ClientProgressCard color={color} progress={progress} project={project} statusLabel={statusLabel} />
        <ClientChatPreview project={project} color={color} publicView={publicView} themeMode={publicView ? publicThemeMode : undefined} />
      </div>
    </div>
  );
}
