import { computeProgress } from "./progressStore";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getActiveCloudUserId } from "./authStore";

const CLIENT_PROJECTS_TABLE = "kaleido_client_projects";
const CLIENT_MESSAGES_TABLE = "kaleido_client_messages";
const LEGACY_OWNER_KEY = import.meta.env.VITE_KALEIDO_USER_KEY || "owner";
const getOwnerKey = () => getActiveCloudUserId() || LEGACY_OWNER_KEY;

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
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/client/${token}`;
};

export const buildClientProjectPayload = (project = {}) => {
  const token = ensureClientShareToken(project);
  const progress = computeProgress(project);
  const updatedAt = new Date().toISOString();

  return {
    shareToken: token,
    project: {
      id: project.id,
      clientShareToken: token,
      name: project.name || "Projet",
      client: project.client || "",
      colorIdx: Number(project.colorIdx) || 0,
      projectType: project.projectType || "custom",
      rang: Number(project.rang) || 0,
      total: Number(project.total) || 0,
      elapsedTime: Number(project.elapsedTime) || 0,
      progress,
      status: project.status || "en_cours",
      updatedAt,
    },
    updatedAt,
  };
};

export const publishClientProject = async (project = {}) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "Supabase n'est pas configuré." };
  }

  const payload = buildClientProjectPayload(project);

  const { error } = await supabase
    .from(CLIENT_PROJECTS_TABLE)
    .upsert({
      share_token: payload.shareToken,
      owner_key: getOwnerKey(),
      project_id: String(project.id || ""),
      project_json: payload.project,
      updated_at: payload.updatedAt,
    }, {
      onConflict: "share_token",
    });

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

export const loadClientProjectByToken = async (token) => {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "Supabase n'est pas configuré." };
  }

  if (!token) {
    return { ok: false, reason: "Lien client incomplet." };
  }

  const { data, error } = await supabase
    .from(CLIENT_PROJECTS_TABLE)
    .select("project_json, owner_key, updated_at")
    .eq("share_token", token)
    .maybeSingle();

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

  return { ok: true, message: data };
};
