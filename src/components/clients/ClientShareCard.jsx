import { useMemo, useState } from "react";
import { buildClientPortalUrl } from "../../services/clientPortalStore";
import ClientSectionCard from "./ClientSectionCard";

const copyToClipboard = async (text) => {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default function ClientShareCard({ project, color, onPublishClientProject }) {
  const [status, setStatus] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const shareUrl = useMemo(() => buildClientPortalUrl(project?.clientShareToken), [project?.clientShareToken]);
  const hasLink = Boolean(project?.clientShareToken);

  const publish = async () => {
    if (typeof onPublishClientProject !== "function" || !project) return;
    setIsPublishing(true);
    setStatus("");

    const result = await onPublishClientProject(project);
    setIsPublishing(false);

    if (!result?.ok) {
      setStatus(result?.reason || "Le lien n'a pas pu être publié.");
      return;
    }

    const copied = await copyToClipboard(result.url);
    setStatus(copied ? "Lien publié et copié." : "Lien publié.");
  };

  const copyExisting = async () => {
    const copied = await copyToClipboard(shareUrl);
    setStatus(copied ? "Lien copié." : "Impossible de copier automatiquement.");
  };

  const prepareEmail = () => {
    if (!shareUrl) return;

    const subject = encodeURIComponent(`Suivi de votre projet ${project?.name || ""}`.trim());
    const body = encodeURIComponent(`Bonjour ${project?.client || ""},\n\nVoici le lien pour suivre l'avancement de votre projet :\n${shareUrl}\n\nMerci!`);
    const recipient = encodeURIComponent(project?.email || "");
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  return (
    <ClientSectionCard
      title="Lien client"
      subtitle="Lien privé pour suivre l'avancement du projet."
      right={
        <div
          style={{
            background: hasLink ? `${color.bg}18` : "rgba(251,191,36,0.12)",
            color: hasLink ? color.bg : "#B45309",
            borderRadius: 999,
            padding: "6px 10px",
            fontSize: 11,
            fontWeight: 800,
            border: `1px solid ${hasLink ? `${color.light}22` : "rgba(251,191,36,0.18)"}`,
            flexShrink: 0,
          }}
        >
          {hasLink ? "Prêt" : "À publier"}
        </div>
      }
    >
      <div style={{ display: "grid", gap: 10 }}>
        {hasLink ? (
          <div
            style={{
              borderRadius: 14,
              background: "var(--k-client-url-bg)",
              border: "1px solid var(--k-client-url-border)",
              color: "var(--k-client-url-color)",
              fontSize: 12,
              padding: 12,
              overflowWrap: "anywhere",
              lineHeight: 1.35,
            }}
          >
            {shareUrl}
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: hasLink ? "1fr 1fr" : "1fr", gap: 10 }}>
          <button
            onClick={publish}
            disabled={isPublishing}
            style={{
              border: `1px solid ${color.light}33`,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${color.bg}, ${color.light})`,
              color: "#fff",
              padding: "12px 13px",
              fontSize: 13,
              fontWeight: 800,
              cursor: isPublishing ? "wait" : "pointer",
              opacity: isPublishing ? 0.72 : 1,
              boxShadow: `0 12px 28px ${color.bg}44`,
            }}
          >
            {isPublishing ? "Publication..." : hasLink ? "Mettre à jour" : "Publier le lien"}
          </button>

          {hasLink ? (
            <button
              onClick={copyExisting}
              style={{
                border: "1px solid var(--k-client-secondary-border)",
                borderRadius: 14,
                background: "var(--k-client-secondary-bg)",
                color: "var(--k-client-secondary-color)",
                padding: "12px 13px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Copier
            </button>
          ) : null}
        </div>

        {hasLink ? (
          <button
            onClick={prepareEmail}
            style={{
              border: "1px solid var(--k-client-secondary-border)",
              borderRadius: 14,
              background: "var(--k-client-secondary-bg-soft)",
              color: "var(--k-client-secondary-color)",
              padding: "12px 13px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Préparer le courriel
          </button>
        ) : null}

        {status ? (
          <div style={{ color: status.includes("Impossible") || status.includes("pas pu") ? "#FCA5A5" : "#86EFAC", fontSize: 12, lineHeight: 1.35 }}>
            {status}
          </div>
        ) : null}
      </div>
    </ClientSectionCard>
  );
}
