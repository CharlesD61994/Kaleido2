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

const makeDefaultEmailDraft = (project, shareUrl) => ({
  subject: `Suivi de votre projet ${project?.name || ""}`.trim(),
  body: [
    `Bonjour ${project?.client || ""},`,
    "",
    "Voici le lien pour suivre l'avancement de votre projet :",
    shareUrl,
    "",
    "Merci!",
  ].join("\n"),
});

export default function ClientShareCard({ project, color, onPublishClientProject }) {
  const [status, setStatus] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [emailDraft, setEmailDraft] = useState(null);
  const shareUrl = useMemo(() => buildClientPortalUrl(project?.clientShareToken), [project?.clientShareToken]);
  const hasLink = Boolean(project?.clientShareToken);

  const publish = async () => {
    if (typeof onPublishClientProject !== "function" || !project) return;
    setIsPublishing(true);
    setStatus("");

    let result;
    try {
      result = await onPublishClientProject(project);
    } catch (error) {
      console.warn("[KALEIDO] publish client link error:", error);
      setStatus(error?.message || "Le lien n'a pas pu être publié.");
      setIsPublishing(false);
      return;
    }

    setIsPublishing(false);

    if (!result?.ok) {
      setStatus(result?.reason || "Le lien n'a pas pu être publié.");
      return;
    }

    const copied = await copyToClipboard(result.url);
    if (result.linkWasRecreated) {
      setStatus(copied ? "Nouveau lien publié et copié." : "Nouveau lien publié.");
      return;
    }
    setStatus(copied ? "Lien publié et copié." : "Lien publié.");
  };

  const copyExisting = async () => {
    const copied = await copyToClipboard(shareUrl);
    setStatus(copied ? "Lien copié." : "Impossible de copier automatiquement.");
  };

  const prepareEmail = () => {
    if (!shareUrl) return;
    setEmailDraft(makeDefaultEmailDraft(project, shareUrl));
  };

  const sendEmailDraft = () => {
    if (!emailDraft || !shareUrl) return;

    const subject = encodeURIComponent(emailDraft.subject || "");
    const body = encodeURIComponent(emailDraft.body || shareUrl);
    const recipient = encodeURIComponent(project?.email || "");
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    setEmailDraft(null);
  };

  return (
    <>
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
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                borderRadius: 14,
                background: "var(--k-client-url-bg)",
                border: "1px solid var(--k-client-url-border)",
                color: "var(--k-client-url-color)",
                fontSize: 12,
                padding: 12,
                overflowWrap: "anywhere",
                lineHeight: 1.35,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {shareUrl}
            </a>
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

      {emailDraft ? (
        <div
          data-kaleido-modal-backdrop="true"
          onClick={() => setEmailDraft(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 400,
            background: "var(--k-modal-backdrop)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
        >
          <div
            data-kaleido-modal-card="true"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 430,
              maxHeight: "88vh",
              overflowY: "auto",
              background: "var(--k-surface)",
              border: "1px solid var(--k-border)",
              borderRadius: 22,
              padding: 20,
              boxShadow: "0 24px 70px rgba(0,0,0,0.42)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "var(--k-text)", fontFamily: "'Syne', sans-serif", fontSize: 20 }}>
                Courriel client
              </h3>
              <button
                type="button"
                onClick={() => setEmailDraft(null)}
                aria-label="Fermer"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  border: "1px solid var(--k-client-close-border)",
                  background: "var(--k-client-secondary-bg)",
                  color: "var(--k-client-close-color)",
                  fontSize: 22,
                  lineHeight: "30px",
                  cursor: "pointer",
                }}
              >
                x
              </button>
            </div>

            <label style={{ display: "block", color: "var(--k-muted)", fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
              Sujet
            </label>
            <input
              value={emailDraft.subject}
              onChange={(event) => setEmailDraft((draft) => ({ ...draft, subject: event.target.value }))}
              style={{
                width: "100%",
                border: "1px solid var(--k-border)",
                borderRadius: 14,
                background: "var(--k-field)",
                color: "var(--k-text)",
                padding: 13,
                fontSize: 15,
                outline: "none",
                marginBottom: 14,
              }}
            />

            <label style={{ display: "block", color: "var(--k-muted)", fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
              Message
            </label>
            <textarea
              value={emailDraft.body}
              onChange={(event) => setEmailDraft((draft) => ({ ...draft, body: event.target.value }))}
              rows={9}
              style={{
                width: "100%",
                border: "1px solid var(--k-border)",
                borderRadius: 14,
                background: "var(--k-field)",
                color: "var(--k-text)",
                padding: 13,
                fontSize: 15,
                lineHeight: 1.45,
                outline: "none",
                resize: "vertical",
                marginBottom: 12,
              }}
            />

            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                color: color.light,
                fontSize: 12,
                overflowWrap: "anywhere",
                marginBottom: 16,
              }}
            >
              {shareUrl}
            </a>

            <button
              type="button"
              onClick={sendEmailDraft}
              style={{
                width: "100%",
                border: `1px solid ${color.light}44`,
                borderRadius: 15,
                background: `linear-gradient(135deg, ${color.bg}, ${color.light})`,
                color: "#fff",
                padding: "14px 15px",
                fontSize: 14,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Ouvrir le courriel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
