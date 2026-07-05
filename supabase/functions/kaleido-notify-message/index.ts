import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, getPublicClientOrigin, getServiceRoleKey, jsonResponse, sendResendEmail } from "../_shared/cors.ts";

const PROJECTS_TABLE = "kaleido_client_projects";
const MESSAGES_TABLE = "kaleido_client_messages";
const CLIENT_ACTIVE_WINDOW_MS = 90_000;

type ClientMessage = {
  id: string;
  share_token: string;
  owner_key: string;
  sender: "owner" | "client";
  body: string | null;
  attachment_url: string | null;
  created_at: string;
};

type ClientProjectRow = {
  share_token: string;
  owner_key: string;
  project_json: Record<string, unknown> | null;
  client_message_emails_enabled: boolean | null;
  client_last_seen_at: string | null;
  client_message_email_pending: boolean | null;
};

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const excerpt = (message: ClientMessage) => {
  const body = String(message.body || "").trim();
  if (body) return body.length > 220 ? `${body.slice(0, 217)}...` : body;
  return message.attachment_url ? "Photo envoyee" : "Nouveau message";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, reason: "Methode non supportee." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, reason: "Secrets Supabase manquants." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { messageId } = await req.json().catch(() => ({}));
  if (!messageId) {
    return jsonResponse({ ok: false, reason: "messageId manquant." }, 400);
  }

  const { data: message, error: messageError } = await supabase
    .from(MESSAGES_TABLE)
    .select("id, share_token, owner_key, sender, body, attachment_url, created_at")
    .eq("id", messageId)
    .maybeSingle<ClientMessage>();

  if (messageError || !message) {
    return jsonResponse({ ok: false, reason: messageError?.message || "Message introuvable." }, 404);
  }

  let projectRow: ClientProjectRow | null = null;
  let projectError: { code?: string; message?: string } | null = null;

  const projectResult = await supabase
    .from(PROJECTS_TABLE)
    .select("share_token, owner_key, project_json, client_message_emails_enabled, client_last_seen_at, client_message_email_pending")
    .eq("share_token", message.share_token)
    .maybeSingle<ClientProjectRow>();
  projectRow = projectResult.data;
  projectError = projectResult.error;

  if (projectError?.code === "42703") {
    const legacyProjectResult = await supabase
      .from(PROJECTS_TABLE)
      .select("share_token, owner_key, project_json, client_message_emails_enabled")
      .eq("share_token", message.share_token)
      .maybeSingle<ClientProjectRow>();
    projectRow = legacyProjectResult.data;
    projectError = legacyProjectResult.error;
  }

  if (projectError || !projectRow?.project_json) {
    return jsonResponse({ ok: false, reason: projectError?.message || "Projet client introuvable." }, 404);
  }

  const project = projectRow.project_json || {};
  const clientName = String(project.client || "client");
  const projectName = String(project.name || "projet");
  const shareUrl = `${getPublicClientOrigin()}/client/${message.share_token}`;
  const messageExcerpt = excerpt(message);

  let recipient = "";
  let subject = "";
  let html = "";
  let text = "";

  if (message.sender === "owner") {
    if (projectRow.client_message_emails_enabled === false) {
      return jsonResponse({ ok: true, skipped: true, reason: "Notifications message desactivees par le client." });
    }

    const clientLastSeenAt = projectRow.client_last_seen_at ? Date.parse(projectRow.client_last_seen_at) : 0;
    const clientIsActive = clientLastSeenAt > 0 && Date.now() - clientLastSeenAt <= CLIENT_ACTIVE_WINDOW_MS;
    if (clientIsActive) {
      return jsonResponse({ ok: true, skipped: true, reason: "Le client consulte deja la fiche." });
    }

    if (projectRow.client_message_email_pending) {
      return jsonResponse({ ok: true, skipped: true, reason: "Un courriel de message est deja en attente de lecture." });
    }

    recipient = String(project.email || "").trim();
    subject = "Vous avez un nouveau message";
    text = `Bonjour ${clientName},\n\nVous avez recu un nouveau message concernant votre projet ${projectName}.\n\nVous pouvez le consulter ici : ${shareUrl}\n\nL'Atelier Kaleido`;
    html = `
      <p>Bonjour ${escapeHtml(clientName)},</p>
      <p>Vous avez recu un nouveau message concernant votre projet <strong>${escapeHtml(projectName)}</strong>.</p>
      <p><a href="${shareUrl}">Ouvrir la fiche client</a></p>
      <p>L'Atelier Kaleido</p>
    `;
  } else {
    const ownerLastReadAt = Date.parse(String(project.clientLastReadAt || ""));
    const messageCreatedAt = Date.parse(message.created_at || "");
    if (ownerLastReadAt > 0 && messageCreatedAt > 0 && messageCreatedAt <= ownerLastReadAt) {
      return jsonResponse({ ok: true, skipped: true, reason: "Le message a deja ete lu par le tricoteur." });
    }

    const priorNotifiedResult = await supabase
      .from(MESSAGES_TABLE)
      .select("id")
      .eq("share_token", message.share_token)
      .eq("sender", "client")
      .gt("created_at", ownerLastReadAt > 0 ? new Date(ownerLastReadAt).toISOString() : "1970-01-01T00:00:00.000Z")
      .not("email_notified_at", "is", null)
      .neq("id", message.id)
      .limit(1);

    if (!priorNotifiedResult.error && (priorNotifiedResult.data || []).length > 0) {
      return jsonResponse({ ok: true, skipped: true, reason: "Un courriel de message client est deja en attente de lecture." });
    }

    const ownerEmailFallback = Deno.env.get("KALEIDO_OWNER_EMAIL") || "";
    let ownerEmail = ownerEmailFallback;

    if (projectRow.owner_key && projectRow.owner_key.includes("-")) {
      const { data: userData } = await supabase.auth.admin.getUserById(projectRow.owner_key);
      ownerEmail = userData?.user?.email || ownerEmailFallback;
    }

    recipient = ownerEmail.trim();
    subject = `Nouveau message client - ${projectName}`;
    text = `${clientName} a envoye un message pour ${projectName}.\n\n${messageExcerpt}\n\nFiche client : ${shareUrl}`;
    html = `
      <p><strong>${escapeHtml(clientName)}</strong> a envoye un message pour <strong>${escapeHtml(projectName)}</strong>.</p>
      <blockquote style="border-left:3px solid #8B5CF6;padding-left:12px;color:#4B5563;">${escapeHtml(messageExcerpt)}</blockquote>
      <p><a href="${shareUrl}">Ouvrir la fiche client</a></p>
    `;
  }

  const emailResult = await sendResendEmail({ to: recipient, subject, html, text });
  if (!emailResult.ok) {
    return jsonResponse({
      ...emailResult,
      sender: message.sender,
      missing: message.sender === "owner" ? "client_email" : "owner_email",
    }, 502);
  }

  const notifiedAt = new Date().toISOString();
  await supabase
    .from(MESSAGES_TABLE)
    .update({ email_notified_at: notifiedAt })
    .eq("id", message.id);

  if (message.sender === "owner") {
    await supabase
      .from(PROJECTS_TABLE)
      .update({
        client_message_email_pending: true,
        last_client_message_email_sent_at: notifiedAt,
      })
      .eq("share_token", message.share_token);
  }

  return jsonResponse({ ok: true });
});
