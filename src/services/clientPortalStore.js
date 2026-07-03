import { computeProgress } from "./progressStore";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getActiveCloudUserId, setActiveCloudUserId } from "./authStore";

const CLIENT_PROJECTS_TABLE = "kaleido_client_projects";
const CLIENT_MESSAGES_TABLE = "kaleido_client_messages";
const LEGACY_OWNER_KEY = import.meta.env.VITE_KALEIDO_USER_KEY || "owner";
const PUBLIC_CLIENT_ORIGIN = import.meta.env.VITE_PUBLIC_CLIENT_ORIGIN || "https://kaleido3.vercel.app";
const getOwnerKey = () => getActiveCloudUserId() || LEGACY_OWNER_KEY;
const CLIENT_PUBLISH_TIMEOUT_MS = 12000;

const withTimeout = (promise, message = "La publication prend trop de temps. Reessaie dans quelques secondes.") => (
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), CLIENT_PUBLISH_TIMEOUT_MS);
    }),
  ])
);

const makeToken = () => {
  const cryptoApi = typeof crypto !== "undefined" ? crypto : null;

  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID().replace(/-/g, "");
  }

  const bytes = new Uint8Array(18);
  cryptoApi?.getRandomValues?.(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
    || `${Date.now()}${Math.random().toString(16).slice(2)}`;
};

export const getClientPortalTokenFromLocation = () => {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("client") || params.get("token");
  if (queryToken) return queryToken;

  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "client" && parts[1]) return parts[1];

  return "";
};

export const ensureClientShareToken = (project = {}) => {
  return project.clientShareToken || makeToken();
};

export const buildClientPortalUrl = (token) => {
  if (!token) return "";
  return `${PUBLIC_CLIENT_ORIGIN}/client/${token}`;
};

const isOwnershipPolicyError = (error) => {
  const message = String(error?.message || error?.details || "").toLowerCase();
  return error?.code === "42501"
    || message.includes("row-level security")
    || message.includes("permission denied");
};

const isMissingNotificationColumnError = (error) => {
  const message = String(error?.message || error?.details || "").toLowerCase();
  return error?.code === "42703"
    || message.includes("client_message_emails_enabled")
    || message.includes("client_progress_emails_enabled")
    || message.includes("progress_changed_at");
};

const getResolvedOwnerKey = async () => {
  const activeOwnerKey = getActiveCloudUserId();
  if (activeOwnerKey) return activeOwnerKey;

  try {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id || "";
    if (userId) {
      setActiveCloudUserId(userId);
      return userId;
    }
  } catch {
    // Keep the legacy key as a fallback for older local data.
  }

  return LEGACY_OWNER_KEY;
};

export const buildClientProjectPayload = (project = {}, tokenOverride = "") => {
  const token = tokenOverride || ensureClientShareToken(project);
  const progress = computeProgress(project);
  const updatedAt = new Date().toISOString();
  const notificationPreferences = {
    messageEmails: project.notificationPreferences?.messageEmails !== false,
    progressEmails: project.notificationPreferences?.progressEmails !== false,
  };

  return {
    shareToken: token,
    project: {
      id: project.id,
      clientShareToken: token,
      name: project.name || "Projet",
      client: project.client || "",
      email: project.email || "",
      colorIdx: Number(project.colorIdx) || 0,
      projectType: project.projectType || "custom",
      rang: Number(project.rang) || 0,
      total: Number(project.total) || 0,
      elapsedTime: Number(project.elapsedTime) || 0,
      partieTimes: project.partieTimes || {},
      parties: project.parties || [],
      pdfParties: project.pdfParties || [],
      completedAt: project.completedAt || null,
      shareEmailSentAt: project.shareEmailSentAt || null,
      progress,
      status: project.status || "en_cours",
      notificationPreferences,
      updatedAt,
    },
    updatedAt,
  };
};

export const publishClientProject = async (project = {}) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "Supabase n'est pas configuré." };
  }

  const publishWithToken = async (token) => {
    const payload = buildClientProjectPayload(project, token);
    const ownerKey = await getResolvedOwnerKey();

  let error = null;

  try {
    const upsertPayload = {
      share_token: payload.shareToken,
      owner_key: ownerKey,
      project_id: String(project.id || ""),
      project_json: payload.project,
      client_message_emails_enabled: payload.project.notificationPreferences.messageEmails,
      client_progress_emails_enabled: payload.project.notificationPreferences.progressEmails,
      progress_changed_at: payload.project.progress > 0 ? payload.updatedAt : null,
      updated_at: payload.updatedAt,
    };

    const result = await withTimeout(
      supabase
        .from(CLIENT_PROJECTS_TABLE)
        .upsert(upsertPayload, {
          onConflict: "share_token",
        })
    );
    error = result.error;

    if (isMissingNotificationColumnError(error)) {
      const legacyResult = await withTimeout(
        supabase
          .from(CLIENT_PROJECTS_TABLE)
          .upsert({
            share_token: payload.shareToken,
            owner_key: ownerKey,
            project_id: String(project.id || ""),
            project_json: payload.project,
            updated_at: payload.updatedAt,
          }, {
            onConflict: "share_token",
          })
      );
      error = legacyResult.error;
    }
  } catch (publishError) {
    return { ok: false, error: publishError, reason: publishError.message || "La fiche client n'a pas pu etre publiee." };
  }

  if (error) {
    return { ok: false, error, reason: error.message || "La fiche client n'a pas pu être publiée." };
  }

  return {
    ok: true,
    token: payload.shareToken,
    url: buildClientPortalUrl(payload.shareToken),
    project: payload.project,
  };

  };

  const currentToken = ensureClientShareToken(project);
  const result = await publishWithToken(currentToken);
  if (result.ok || !project.clientShareToken || !isOwnershipPolicyError(result.error)) return result;

  const replacementToken = makeToken();
  const replacementResult = await publishWithToken(replacementToken);
  return replacementResult.ok
    ? { ...replacementResult, linkWasRecreated: true }
    : replacementResult;
};

export const loadClientProjectByToken = async (token) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "Supabase n'est pas configuré." };
  }

  if (!token) {
    return { ok: false, reason: "Lien client incomplet." };
  }

  let data = null;
  let error = null;

  try {
    const result = await withTimeout(
      supabase
        .from(CLIENT_PROJECTS_TABLE)
        .select("project_json, owner_key, updated_at, client_message_emails_enabled, client_progress_emails_enabled")
        .eq("share_token", token)
        .maybeSingle(),
      "La fiche client prend trop de temps a charger."
    );
    data = result.data;
    error = result.error;

    if (isMissingNotificationColumnError(error)) {
      const legacyResult = await withTimeout(
        supabase
          .from(CLIENT_PROJECTS_TABLE)
          .select("project_json, owner_key, updated_at")
          .eq("share_token", token)
          .maybeSingle(),
        "La fiche client prend trop de temps a charger."
      );
      data = legacyResult.data;
      error = legacyResult.error;
    }
  } catch (loadError) {
    return { ok: false, error: loadError, reason: loadError.message || "La fiche client est impossible a charger." };
  }

  if (error) {
    return { ok: false, error, reason: error.message || "La fiche client est impossible à charger." };
  }

  if (!data?.project_json) {
    return { ok: false, reason: "Aucune fiche client trouvée pour ce lien." };
  }

  return {
    ok: true,
    project: {
      ...data.project_json,
      notificationPreferences: {
        ...(data.project_json?.notificationPreferences || {}),
        messageEmails: data.client_message_emails_enabled !== false,
        progressEmails: data.client_progress_emails_enabled !== false,
      },
      clientShareToken: token,
      ownerKey: data.owner_key || "",
      updatedAt: data.updated_at || data.project_json.updatedAt,
    },
  };
};

export const loadClientMessages = async (shareToken) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "Supabase n'est pas configuré." };
  }

  if (!shareToken) {
    return { ok: false, reason: "Le lien client n'est pas encore publié." };
  }

  const { data, error } = await supabase
    .from(CLIENT_MESSAGES_TABLE)
    .select("id, sender, body, attachment_url, attachment_type, created_at")
    .eq("share_token", shareToken)
    .order("created_at", { ascending: true })
    .limit(80);

  if (error) {
    return { ok: false, error, reason: error.message || "Les messages sont impossibles à charger." };
  }

  return { ok: true, messages: data || [] };
};

export const updateClientNotificationPreferences = async (shareToken, preferences = {}) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "Supabase n'est pas configure." };
  }

  if (!shareToken) {
    return { ok: false, reason: "Lien client incomplet." };
  }

  const cleanPreferences = {
    messageEmails: preferences.messageEmails !== false,
    progressEmails: preferences.progressEmails !== false,
  };

  const { data, error } = await supabase.functions.invoke("kaleido-client-preferences", {
    body: {
      shareToken,
      preferences: cleanPreferences,
    },
  });

  if (error || data?.ok === false) {
    return {
      ok: false,
      error,
      reason: data?.reason || error?.message || "Les preferences n'ont pas pu etre sauvegardees.",
    };
  }

  return { ok: true, preferences: data?.preferences || cleanPreferences };
};

export const sendClientShareEmail = async (shareToken) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "Supabase n'est pas configure." };
  }

  if (!shareToken) {
    return { ok: false, reason: "Le lien client n'est pas encore publie." };
  }

  let data = null;
  let error = null;

  try {
    const result = await supabase.functions.invoke("kaleido-send-share-email", {
      body: { shareToken },
    });
    data = result.data;
    error = result.error;
  } catch (invokeError) {
    error = invokeError;
  }

  if (error || data?.ok === false) {
    const contextReason = data?.missing === "client_email"
      ? "Aucun courriel client n'est associe a cette fiche. Ajoute un courriel au client, puis mets le lien a jour."
      : "";

    return {
      ok: false,
      error,
      reason: contextReason || data?.reason || error?.context?.error || error?.message || "Le courriel n'a pas pu etre envoye.",
    };
  }

  return { ok: true };
};

const notifyMessageEmail = (messageId) => {
  if (!messageId || !isSupabaseConfigured || !supabase) return;

  supabase.functions.invoke("kaleido-notify-message", {
    body: { messageId },
  }).then(({ data, error }) => {
    if (error || data?.ok === false) {
      console.warn("[KALEIDO] email notification indisponible:", data?.reason || error?.message || error);
    }
  }).catch((error) => {
    console.warn("[KALEIDO] email notification exception:", error?.message || error);
  });
};

export const loadLatestClientMessageMap = async (shareTokens = []) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "Supabase n'est pas configuré." };
  }

  const tokens = [...new Set((shareTokens || []).filter(Boolean))];
  if (!tokens.length) return { ok: true, latestByToken: {} };

  const { data, error } = await supabase
    .from(CLIENT_MESSAGES_TABLE)
    .select("share_token, created_at")
    .in("share_token", tokens)
    .eq("sender", "client")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    return { ok: false, error, reason: error.message || "Les messages sont impossibles à vérifier." };
  }

  const latestByToken = {};
  for (const message of data || []) {
    if (!latestByToken[message.share_token]) {
      latestByToken[message.share_token] = message.created_at;
    }
  }

  return { ok: true, latestByToken };
};

export const loadClientMessageCounts = async (shareTokens = []) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "Supabase n'est pas configuré." };
  }

  const tokens = [...new Set((shareTokens || []).filter(Boolean))];
  if (!tokens.length) return { ok: true, countsByToken: {} };

  const { data, error } = await supabase
    .from(CLIENT_MESSAGES_TABLE)
    .select("share_token, created_at")
    .in("share_token", tokens)
    .eq("sender", "client")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return { ok: false, error, reason: error.message || "Les messages sont impossibles à compter." };
  }

  const messagesByToken = {};
  for (const message of data || []) {
    const token = message.share_token;
    if (!messagesByToken[token]) messagesByToken[token] = [];
    messagesByToken[token].push(message.created_at);
  }

  return { ok: true, countsByToken: messagesByToken };
};

export const sendClientMessage = async ({
  shareToken,
  sender = "client",
  body = "",
  ownerKey = "",
  attachmentUrl = "",
  attachmentType = "",
} = {}) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "Supabase n'est pas configuré." };
  }

  const cleanBody = String(body || "").trim();
  const cleanOwnerKey = String(ownerKey || "").trim();
  const cleanAttachmentUrl = String(attachmentUrl || "").trim();
  const cleanAttachmentType = String(attachmentType || "").trim();
  if (!shareToken) {
    return { ok: false, reason: "Le lien client n'est pas encore publié." };
  }

  if (!cleanBody && !cleanAttachmentUrl) {
    return { ok: false, reason: "Le message est vide." };
  }

  const safeSender = sender === "owner" ? "owner" : "client";
  const { data, error } = await supabase
    .from(CLIENT_MESSAGES_TABLE)
    .insert({
      share_token: shareToken,
      owner_key: cleanOwnerKey || getOwnerKey(),
      sender: safeSender,
      body: cleanBody,
      attachment_url: cleanAttachmentUrl || null,
      attachment_type: cleanAttachmentType || null,
    })
    .select("id, sender, body, attachment_url, attachment_type, created_at")
    .single();

  if (error) {
    return { ok: false, error, reason: error.message || "Le message n'a pas pu être envoyé." };
  }

  notifyMessageEmail(data?.id);

  return { ok: true, message: data };
};
