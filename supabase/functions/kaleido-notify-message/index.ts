import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, getPublicClientOrigin, getServiceRoleKey, jsonResponse, sendResendEmail } from "../_shared/cors.ts";

const PROJECTS_TABLE = "kaleido_client_projects";
const MESSAGES_TABLE = "kaleido_client_messages";

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

  const { data: projectRow, error: projectError } = await supabase
    .from(PROJECTS_TABLE)
    .select("share_token, owner_key, project_json, client_message_emails_enabled")
    .eq("share_token", message.share_token)
    .maybeSingle<ClientProjectRow>();

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

    recipient = String(project.email || "").trim();
    subject = `Nouveau message pour ${projectName}`;
    text = `Bonjour ${clientName},\n\nVous avez recu un nouveau message au sujet de votre projet ${projectName}.\n\n${messageExcerpt}\n\nConsulter la fiche client : ${shareUrl}\n\nL'Atelier Kaleido`;
    html = `
      <p>Bonjour ${escapeHtml(clientName)},</p>
      <p>Vous avez recu un nouveau message au sujet de votre projet <strong>${escapeHtml(projectName)}</strong>.</p>
      <blockquote style="border-left:3px solid #8B5CF6;padding-left:12px;color:#4B5563;">${escapeHtml(messageExcerpt)}</blockquote>
      <p><a href="${shareUrl}">Ouvrir la fiche client</a></p>
      <p>L'Atelier Kaleido</p>
    `;
  } else {
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
    return jsonResponse(emailResult, 502);
  }

  await supabase
    .from(MESSAGES_TABLE)
    .update({ email_notified_at: new Date().toISOString() })
    .eq("id", message.id);

  return jsonResponse({ ok: true });
});
