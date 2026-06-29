import { useEffect } from "react";
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

export default function ClientPage({ project, onBack, onEditClient, onMarkMessagesRead, onPublishClientProject, unreadClientMessageCount = 0 }) {
  const progress = computeProgress(project);
  const color = KALEIDOSCOPE_COLORS[(project?.colorIdx || 0) % KALEIDOSCOPE_COLORS.length];
  const statusLabel = project?.status === "termine" ? "Terminé" : "En cours";
  const clientInitial = (project?.client || "?").trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (unreadClientMessageCount > 0 && project?.clientShareToken && typeof onMarkMessagesRead === "function") {
      onMarkMessagesRead(project);
    }
  }, [project?.id, project?.clientShareToken, onMarkMessagesRead, unreadClientMessageCount]);

  return (
    <div
      style={{
        background: "var(--k-bg)",
        minHeight: "100vh",
        width: "100%",
        fontFamily: "'DM Sans', sans-serif",
        maxWidth: 430,
        margin: "0 auto",
        color: "var(--k-text)",
        position: "relative",
        overflow: "hidden",
        overflowAnchor: "none",
      }}
    >
      <style>{`${THEME_CSS}@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap'); * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; } input, textarea, select { font-size: 16px !important; }`}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 18% 0%, ${color.bg}40, transparent 34%), radial-gradient(circle at 92% 8%, rgba(236,72,153,0.18), transparent 32%), radial-gradient(circle at 50% 100%, rgba(6,182,212,0.10), transparent 36%), var(--k-bg)`,
        }}
      />

      <div style={{ position: "relative", zIndex: 2, padding: `${IOS_TOP_PADDING} 20px 28px` }}>
        <ClientPageHeader project={project} color={color} onBack={onBack} publicView={false} />
        <ClientSummaryCard project={project} color={color} clientInitial={clientInitial} onEditClient={onEditClient} publicView={false} />

        <ClientShareCard project={project} color={color} onPublishClientProject={onPublishClientProject} />

        <ClientSectionCard
          title="Informations client"
          subtitle="Données utilisées pour le suivi du projet et le futur espace client."
        >
          <ClientInfoRow label="Nom" value={project?.client} />
          <ClientInfoRow label="Courriel" value={project?.email} />
          <ClientInfoRow label="Projet associé" value={project?.name} />
        </ClientSectionCard>

        <ClientProgressCard color={color} progress={progress} project={project} statusLabel={statusLabel} />
        <ClientChatPreview project={project} color={color} publicView={false} />
      </div>
    </div>
  );
}
