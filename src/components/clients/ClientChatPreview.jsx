import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadClientMessages, sendClientMessage } from "../../services/clientPortalStore";
import { isSupabaseConfigured, supabase } from "../../services/supabaseClient";
import ClientSectionCard from "./ClientSectionCard";

const formatMessageTime = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-CA", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const imageFileToDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve("");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export default function ClientChatPreview({ project, color, publicView = false, themeMode }) {
  const shareToken = project?.clientShareToken || "";
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const fileInputRef = useRef(null);
  const compactMessagesRef = useRef(null);
  const fullscreenMessagesRef = useRef(null);
  const inheritedTheme = typeof document !== "undefined"
    ? document.querySelector('[data-kaleido-screen="true"][data-kaleido-theme]')?.getAttribute("data-kaleido-theme")
    : undefined;
  const portalTheme = themeMode || inheritedTheme || undefined;

  const scrollMessagesToBottom = (target = "all") => {
    const pairs = target === "compact"
      ? [compactMessagesRef]
      : target === "fullscreen"
        ? [fullscreenMessagesRef]
        : [compactMessagesRef, fullscreenMessagesRef];

    const scroll = () => {
      for (const containerRef of pairs) {
        const node = containerRef.current;
        if (node) {
          node.scrollTop = node.scrollHeight;
        }
      }
    };

    window.requestAnimationFrame(scroll);
    window.setTimeout(scroll, 80);
    window.setTimeout(scroll, 220);
    window.setTimeout(scroll, 520);
    window.setTimeout(scroll, 900);
  };

  const refreshMessages = async ({ quiet = false } = {}) => {
    if (!shareToken) {
      setMessages([]);
      return;
    }

    if (!quiet) setLoading(true);
    const result = await loadClientMessages(shareToken);
    if (!quiet) setLoading(false);

    if (!result.ok) {
      if (!quiet) setStatus(result.reason || "Messages indisponibles.");
      return;
    }

    setMessages(result.messages || []);
    if (!quiet) setStatus("");
  };

  useEffect(() => {
    refreshMessages();
    if (!shareToken) return undefined;

    const timer = setInterval(() => refreshMessages({ quiet: true }), 8000);
    const channel = isSupabaseConfigured && supabase
      ? supabase
        .channel(`kaleido-client-chat-${shareToken}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "kaleido_client_messages",
            filter: `share_token=eq.${shareToken}`,
          },
          () => refreshMessages({ quiet: true })
        )
        .subscribe()
      : null;

    return () => {
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [shareToken]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollMessagesToBottom(fullscreen ? "fullscreen" : "compact");
    }
  }, [messages.length, fullscreen]);

  const submit = async () => {
    if (!draft.trim() && !attachment?.url) return;

    setSending(true);
    setStatus("");
    const result = await sendClientMessage({
      shareToken,
      sender: publicView ? "client" : "owner",
      body: draft,
      ownerKey: project?.ownerKey,
      attachmentUrl: attachment?.url,
      attachmentType: attachment?.type,
    });
    setSending(false);

    if (!result.ok) {
      setStatus(result.reason || "Le message n'a pas pu etre envoye.");
      return;
    }

    setDraft("");
    setAttachment(null);
    setMessages((current) => {
      if (current.some((message) => message.id === result.message?.id)) return current;
      return [...current, result.message];
    });
    scrollMessagesToBottom(fullscreen ? "fullscreen" : "compact");
  };

  const choosePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Choisis une image.");
      return;
    }

    try {
      const url = await imageFileToDataUrl(file);
      setAttachment({ url, type: file.type || "image/jpeg" });
      setStatus("");
    } catch {
      setStatus("La photo n'a pas pu etre ajoutee.");
    }
  };

  const renderMessages = (expanded = false) => (
    <div
      ref={expanded ? fullscreenMessagesRef : compactMessagesRef}
      style={{
        borderRadius: expanded ? 0 : 18,
        background: expanded ? "var(--k-bg)" : "var(--k-muted-fill)",
        border: expanded ? "0" : "1px solid var(--k-border)",
        padding: expanded ? "14px 16px" : 12,
        minHeight: expanded ? 0 : 150,
        maxHeight: expanded ? "none" : 280,
        overflowY: "auto",
        overscrollBehavior: "contain",
        overflowAnchor: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {loading ? (
        <div style={{ color: "var(--k-muted)", fontSize: 13 }}>Chargement des messages...</div>
      ) : messages.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {messages.map((message) => {
            const mine = publicView ? message.sender === "client" : message.sender === "owner";
            return (
              <div key={message.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: expanded ? "86%" : "82%",
                    borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: mine ? `linear-gradient(135deg, ${color.bg}, ${color.light})` : "var(--k-muted-fill-2)",
                    color: mine ? "#fff" : "var(--k-text)",
                    padding: "10px 12px",
                    fontSize: 13,
                    lineHeight: 1.38,
                    overflowWrap: "anywhere",
                    boxShadow: mine ? `0 10px 22px ${color.bg}30` : "none",
                  }}
                >
                  {message.attachment_url ? (
                    <button
                      type="button"
                      onClick={() => setEnlargedImage(message.attachment_url)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: 0,
                        margin: `0 0 ${message.body ? 8 : 0}px`,
                        border: 0,
                        borderRadius: 12,
                        background: "transparent",
                        cursor: "zoom-in",
                        overflow: "hidden",
                      }}
                      aria-label="Agrandir la photo"
                    >
                      <img
                        src={message.attachment_url}
                        alt="Photo envoyee"
                        style={{
                          display: "block",
                          width: "100%",
                          maxHeight: expanded ? 260 : 180,
                          objectFit: "cover",
                        }}
                      />
                    </button>
                  ) : null}
                  {message.body ? <div>{message.body}</div> : null}
                  <div style={{ color: mine ? "rgba(255,255,255,0.72)" : "var(--k-muted-3)", fontSize: 10, marginTop: 5 }}>
                    {formatMessageTime(message.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: "var(--k-muted)", fontSize: 13, lineHeight: 1.45 }}>
          Aucun message pour le moment.
        </div>
      )}
    </div>
  );

  const renderComposer = () => (
    <>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={publicView ? "Votre message..." : "Repondre au client..."}
        rows={3}
        style={{
          width: "100%",
          border: "1.5px solid var(--k-border)",
          borderRadius: 16,
          background: "var(--k-field)",
          color: "var(--k-text)",
          padding: 13,
          resize: "vertical",
          minHeight: 86,
          fontFamily: "'DM Sans', sans-serif",
          outline: "none",
        }}
      />

      {attachment?.url ? (
        <div style={{ position: "relative", width: 92, height: 92, borderRadius: 16, overflow: "hidden", border: "1px solid var(--k-border)", boxShadow: "0 10px 24px rgba(0,0,0,0.18)" }}>
          <button
            type="button"
            onClick={() => setEnlargedImage(attachment.url)}
            style={{ width: "100%", height: "100%", padding: 0, border: 0, background: "transparent", cursor: "zoom-in" }}
            aria-label="Agrandir la photo"
          >
            <img src={attachment.url} alt="Photo a envoyer" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </button>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(13,13,26,0.82)", color: "#fff", fontWeight: 900, cursor: "pointer" }}
            aria-label="Retirer la photo"
          >
            x
          </button>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: publicView ? "1fr" : "auto 1fr", gap: 10 }}>
        {!publicView ? (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={choosePhoto} style={{ display: "none" }} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ border: "1px solid var(--k-border)", borderRadius: 14, background: "var(--k-muted-fill-2)", color: "var(--k-text)", padding: "12px 14px", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
            >
              Photo
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={submit}
          disabled={sending || (!draft.trim() && !attachment?.url)}
          style={{
            border: `1px solid ${color.light}33`,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${color.bg}, ${color.light})`,
            color: "#fff",
            padding: "12px 13px",
            fontSize: 13,
            fontWeight: 800,
            cursor: sending ? "wait" : "pointer",
            opacity: sending || (!draft.trim() && !attachment?.url) ? 0.62 : 1,
            boxShadow: `0 12px 28px ${color.bg}44`,
          }}
        >
          {sending ? "Envoi..." : "Envoyer"}
        </button>
      </div>

      {status ? (
        <div style={{ color: "#FCA5A5", fontSize: 12, lineHeight: 1.35 }}>
          {status}
        </div>
      ) : null}
    </>
  );

  const renderChatContent = (expanded = false) => {
    if (!shareToken) {
      return (
        <div style={{ borderRadius: 18, background: "var(--k-muted-fill)", border: "1px dashed rgba(251,191,36,0.24)", padding: "20px 16px", color: "var(--k-muted)", fontSize: 13, lineHeight: 1.45 }}>
          Publie d'abord le lien client pour activer les messages.
        </div>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateRows: expanded ? "minmax(0, 1fr) auto" : "auto",
          gap: 12,
          minHeight: expanded ? 0 : "auto",
        }}
      >
        {renderMessages(expanded)}
        <div style={{ display: "grid", gap: 12, padding: expanded ? "0 16px 16px" : 0 }}>
          {renderComposer()}
        </div>
      </div>
    );
  };

  const enlargedImageModal = enlargedImage && typeof document !== "undefined" ? createPortal((
    <div
      onClick={() => setEnlargedImage(null)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20000,
        background: "rgba(0,0,0,0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setEnlargedImage(null);
        }}
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          width: 38,
          height: 38,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.22)",
          background: "rgba(13,13,26,0.72)",
          color: "#fff",
          fontSize: 22,
          fontWeight: 800,
          cursor: "pointer",
        }}
        aria-label="Fermer la photo"
      >
        x
      </button>
      <img
        src={enlargedImage}
        alt="Photo agrandie"
        onClick={(event) => event.stopPropagation()}
        style={{
          maxWidth: "100%",
          maxHeight: "88vh",
          objectFit: "contain",
          borderRadius: 18,
          boxShadow: "0 22px 80px rgba(0,0,0,0.55)",
        }}
      />
    </div>
  ), document.body) : null;

  const fullscreenModal = fullscreen && typeof document !== "undefined" ? createPortal((
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 12000,
        background: "var(--k-bg)",
        color: "var(--k-text)",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        fontFamily: "'DM Sans', sans-serif",
      }}
      data-kaleido-theme={portalTheme}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "calc(env(safe-area-inset-top, 0px) + 14px) 16px 12px",
          borderBottom: "1px solid var(--k-border)",
          background: `linear-gradient(135deg, ${color.bg}18, var(--k-surface))`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>Messages</div>
          <div style={{ color: "var(--k-muted)", fontSize: 12, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project?.client || project?.name || "Conversation"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFullscreen(false)}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "1px solid var(--k-border)",
            background: "var(--k-muted-fill-2)",
            color: "var(--k-text)",
            fontSize: 20,
            fontWeight: 900,
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label="Fermer le plein ecran"
        >
          x
        </button>
      </div>
      {renderChatContent(true)}
    </div>
  ), document.body) : null;

  return (
    <>
      <ClientSectionCard
        title="Messages"
        subtitle={publicView ? "Ecrivez ici si vous avez une question." : "Conversation liee au lien client."}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div
              style={{
                background: shareToken ? `${color.bg}22` : "rgba(251,191,36,0.12)",
                color: shareToken ? color.light : "#FBBF24",
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 800,
                border: `1px solid ${shareToken ? `${color.light}22` : "rgba(251,191,36,0.18)"}`,
              }}
            >
              {shareToken ? "Actif" : "Lien requis"}
            </div>
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              disabled={!shareToken}
              style={{
                border: `1px solid ${shareToken ? `${color.light}33` : "var(--k-border)"}`,
                borderRadius: 999,
                background: shareToken ? "var(--k-muted-fill-2)" : "var(--k-muted-fill)",
                color: shareToken ? "var(--k-text)" : "var(--k-muted-3)",
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 900,
                cursor: shareToken ? "pointer" : "not-allowed",
              }}
            >
              Plein ecran
            </button>
          </div>
        }
      >
        {renderChatContent(false)}
        {enlargedImageModal}
      </ClientSectionCard>
      {fullscreenModal}
    </>
  );
}
