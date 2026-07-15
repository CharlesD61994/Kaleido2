import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, getPublicClientOrigin, getServiceRoleKey, jsonResponse, sendResendEmail } from "../_shared/cors.ts";

const PROJECTS_TABLE = "kaleido_client_projects";
const MESSAGES_TABLE = "kaleido_client_messages";
const CLIENT_ACTIVE_WINDOW_MS = 90_000;
const OWNER_ACTIVE_WINDOW_MS = 12_000;
const MESSAGE_EMAIL_COOLDOWN_MS = 60 * 60 * 1000;

type ClientMessage = {
  id: string;
  share_token: string;
  owner_key: string;
  sender: "owner" | "client";
  body: string | null;
  attachment_url: string | null;
  created_at: string;
  email_notified_at: string | null;
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

const cleanEmailSecret = (value = "") => value
  .trim()
  .replace(/^["']|["']$/g, "");

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
    .select("id, share_token, owner_key, sender, body, attachment_url, created_at, email_notified_at")
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
    .eq("owner_key", message.owner_key)
    .maybeSingle<ClientProjectRow>();
  projectRow = projectResult.data;
  projectError = projectResult.error;

  if (projectError?.code === "42703") {
    const legacyProjectResult = await supabase
      .from(PROJECTS_TABLE)
      .select("share_token, owner_key, project_json, client_message_emails_enabled")
      .eq("share_token", message.share_token)
      .eq("owner_key", message.owner_key)
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
  if (message.email_notified_at) {
    return jsonResponse({ ok: true, skipped: true, reason: "Ce message a deja declenche un courriel." });
  }

  const recentEmailCutoff = new Date(Date.now() - MESSAGE_EMAIL_COOLDOWN_MS).toISOString();
  const recentNotificationResult = await supabase
    .from(MESSAGES_TABLE)
    .select("id")
    .eq("share_token", message.share_token)
    .eq("owner_key", message.owner_key)
    .eq("sender", message.sender)
    .gte("email_notified_at", recentEmailCutoff)
    .neq("id", message.id)
    .limit(1);

  if (!recentNotificationResult.error && (recentNotificationResult.data || []).length > 0) {
    return jsonResponse({ ok: true, skipped: true, reason: "Un courriel de message a deja ete envoye dans la derniere heure." });
  }

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

    recipient = String(project.email || "").trim();
    subject = "Vous avez un nouveau message";
    text = `Bonjour ${clientName},\n\nVous avez reçu un nouveau message concernant votre projet ${projectName}.\n\nVous pouvez le consulter ici : ${shareUrl}\n\nL'Atelier Kaleido`;
    html = `
      <p>Bonjour ${escapeHtml(clientName)},</p>
      <p>Vous avez reçu un nouveau message concernant votre projet <strong>${escapeHtml(projectName)}</strong>.</p>
      <p><a href="${shareUrl}">Ouvrir la fiche client</a></p>
      <p>L'Atelier Kaleido</p>
    `;
  } else {
    const ownerLastReadAt = Date.parse(String(project.clientLastReadAt || ""));
    const ownerIsActive = ownerLastReadAt > 0 && Date.now() - ownerLastReadAt <= OWNER_ACTIVE_WINDOW_MS;
    if (ownerIsActive) {
      return jsonResponse({ ok: true, skipped: true, reason: "Le tricoteur consulte deja la fiche." });
    }

    const ownerEmail = cleanEmailSecret(
      Deno.env.get("KALEIDO_OWNER_EMAIL")
      || Deno.env.get("KALEIDO_NOTIFICATION_EMAIL")
      || "",
    );
    recipient = ownerEmail.trim();
    if (!recipient) {
      return jsonResponse({
        ok: false,
        reason: "KALEIDO_OWNER_EMAIL manquant dans les secrets Supabase. Notification tricoteur non envoyee pour eviter d'utiliser le courriel du compte.",
        missing: "owner_email",
      }, 502);
    }

    subject = "Vous avez un nouveau message";
    text = `Bonjour,\n\nVous avez reçu un nouveau message concernant le projet ${projectName}.\n\nVous pouvez le consulter ici : ${shareUrl}\n\nL'Atelier Kaleido`;
    html = `
      <p>Bonjour,</p>
      <p>Vous avez reçu un nouveau message concernant le projet <strong>${escapeHtml(projectName)}</strong>.</p>
      <p><a href="${shareUrl}">Ouvrir la fiche client</a></p>
      <p>L'Atelier Kaleido</p>
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

  return jsonResponse({ ok: true });
});
