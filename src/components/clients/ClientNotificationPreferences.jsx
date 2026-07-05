import { useEffect, useState } from "react";
import ClientSectionCard from "./ClientSectionCard";
import { updateClientNotificationPreferences } from "../../services/clientPortalStore";

function PreferenceToggle({ label, description, checked, disabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      style={{
        width: "100%",
        border: "1px solid var(--k-border)",
        borderRadius: 16,
        background: "var(--k-muted-fill)",
        color: "var(--k-text)",
        padding: 13,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        textAlign: "left",
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.72 : 1,
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 900 }}>{label}</span>
        <span style={{ display: "block", color: "var(--k-muted)", fontSize: 12, marginTop: 3, lineHeight: 1.35 }}>
          {description}
        </span>
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 48,
          height: 28,
          borderRadius: 999,
          background: checked ? "linear-gradient(135deg, #22D3EE, #8B5CF6)" : "var(--k-muted-fill-2)",
          border: checked ? "1px solid rgba(34,211,238,0.40)" : "1px solid var(--k-border)",
          padding: 3,
          flexShrink: 0,
          boxShadow: checked ? "0 10px 22px rgba(34,211,238,0.18)" : "none",
        }}
      >
        <span
          style={{
            display: "block",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: checked ? "#fff" : "var(--k-muted-3)",
            transform: checked ? "translateX(20px)" : "translateX(0)",
            transition: "transform 160ms ease",
          }}
        />
      </span>
    </button>
  );
}

export default function ClientNotificationPreferences({ project, onPreferencesChange }) {
  const shareToken = project?.clientShareToken || "";
  const [preferences, setPreferences] = useState({
    messageEmails: project?.notificationPreferences?.messageEmails !== false,
    progressEmails: project?.notificationPreferences?.progressEmails !== false,
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setPreferences({
      messageEmails: project?.notificationPreferences?.messageEmails !== false,
      progressEmails: project?.notificationPreferences?.progressEmails !== false,
    });
  }, [project?.clientShareToken, project?.notificationPreferences?.messageEmails, project?.notificationPreferences?.progressEmails]);

  const save = async (nextPreferences) => {
    setPreferences(nextPreferences);
    setSaving(true);
    setStatus("");

    const result = await updateClientNotificationPreferences(shareToken, nextPreferences);
    setSaving(false);

    if (!result.ok) {
      setStatus(result.reason || "Les préférences n'ont pas pu être sauvegardées.");
      return;
    }

    const savedPreferences = result.preferences || nextPreferences;
    setPreferences(savedPreferences);
    onPreferencesChange?.(savedPreferences);
    setStatus("Préférences sauvegardées.");
    window.setTimeout(() => setStatus(""), 1800);
  };

  return (
    <ClientSectionCard title="Notifications">
      <div style={{ display: "grid", gap: 10 }}>
        <PreferenceToggle
          label="Nouveaux messages"
          description="Recevoir un courriel quand un message est ajouté à la conversation."
          checked={preferences.messageEmails}
          disabled={saving || !shareToken}
          onChange={(value) => save({ ...preferences, messageEmails: value })}
        />
        <PreferenceToggle
          label="Résumé d'avancement"
          description="Recevoir un courriel en fin de journée seulement si le projet a avancé."
          checked={preferences.progressEmails}
          disabled={saving || !shareToken}
          onChange={(value) => save({ ...preferences, progressEmails: value })}
        />
        {status ? (
          <div style={{ color: status.includes("sauvegard") ? "var(--k-muted)" : "#FCA5A5", fontSize: 12 }}>
            {status}
          </div>
        ) : null}
      </div>
    </ClientSectionCard>
  );
}
