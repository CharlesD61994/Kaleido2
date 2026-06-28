import { useEffect, useState } from "react";
import { computeProgress } from "./services/progressStore";
import { KALEIDOSCOPE_COLORS } from "./constants/colors";
import ClientChatPreview from "./components/clients/ClientChatPreview";
import ClientInfoRow from "./components/clients/ClientInfoRow";
import ClientPageHeader from "./components/clients/ClientPageHeader";
import ClientProgressCard from "./components/clients/ClientProgressCard";
import ClientSectionCard from "./components/clients/ClientSectionCard";
import ClientSummaryCard from "./components/clients/ClientSummaryCard";
import { THEME_CSS } from "./styles/theme";

export default function PublicClientPage({ project }) {
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("kaleido-client-theme") === "light" ? "light" : "dark";
  });
  const progress = computeProgress(project);
  const color = KALEIDOSCOPE_COLORS[(project?.colorIdx || 0) % KALEIDOSCOPE_COLORS.length];
  const statusLabel = project?.status === "termine" ? "Terminé" : "En cours";
  const clientInitial = (project?.client || "?").trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const bg = themeMode === "light" ? "#F7F4FB" : "#0D0D1A";
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
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((current) => {
      const next = current === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kaleido-client-theme", next);
      }
      return next;
    });
  };

  return (
    <main
      data-kaleido-theme={themeMode}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        overflowX: "hidden",
        background: "var(--k-bg)",
        color: "var(--k-text)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`${THEME_CSS}@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap'); html, body, #root { margin: 0; min-height: 100%; width: 100%; background: var(--k-bg); } body { overflow-x: hidden; } * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; } input, textarea, select { font-size: 16px !important; }`}</style>

      <button
        type="button"
        onClick={toggleTheme}
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
        {themeMode === "light" ? "Mode sombre" : "Mode clair"}
      </button>

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 430, margin: "0 auto", padding: "18px 20px 28px" }}>
        <ClientPageHeader project={project} color={color} publicView />
        <ClientSummaryCard project={project} color={color} clientInitial={clientInitial} publicView />

        <ClientSectionCard title="Informations client" subtitle="Informations liées à votre projet.">
          <ClientInfoRow label="Nom" value={project?.client} />
          <ClientInfoRow label="Projet associé" value={project?.name} />
        </ClientSectionCard>

        <ClientProgressCard color={color} progress={progress} project={project} statusLabel={statusLabel} />
        <ClientChatPreview project={project} color={color} publicView themeMode={themeMode} />
      </div>
    </main>
  );
}
