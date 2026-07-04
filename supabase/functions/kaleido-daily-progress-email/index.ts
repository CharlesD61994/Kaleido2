import { createClient } from "npm:@supabase/supabase-js@2";
import { getPublicClientOrigin, getServiceRoleKey, jsonResponse, sendResendEmail } from "../_shared/cors.ts";

const PROJECTS_TABLE = "kaleido_client_projects";

type ClientProjectRow = {
  share_token: string;
  project_json: Record<string, unknown> | null;
  client_progress_emails_enabled: boolean | null;
  progress_changed_at: string | null;
  last_progress_email_sent_at: string | null;
  progress_email_claimed_at: string | null;
  last_notified_progress: number | null;
};

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, reason: "Secrets Supabase manquants." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: rows, error } = await supabase
    .from(PROJECTS_TABLE)
    .select("share_token, project_json, client_progress_emails_enabled, progress_changed_at, last_progress_email_sent_at, progress_email_claimed_at, last_notified_progress")
    .eq("client_progress_emails_enabled", true)
    .not("progress_changed_at", "is", null)
    .limit(200);

  if (error) {
    return jsonResponse({ ok: false, reason: error.message }, 500);
  }

  let sent = 0;
  let skipped = 0;

  for (const row of (rows || []) as ClientProjectRow[]) {
    const project = row.project_json || {};
    const email = String(project.email || "").trim();
    const progress = Number(project.progress || 0);
    const lastProgress = Number(row.last_notified_progress || 0);
    const progressChangedAt = Date.parse(row.progress_changed_at || "");
    const lastSentAt = Date.parse(row.last_progress_email_sent_at || "");
    const claimedAt = Date.parse(row.progress_email_claimed_at || "");

    if (!email || !progressChangedAt || progress <= lastProgress || (lastSentAt && progressChangedAt <= lastSentAt) || (claimedAt && progressChangedAt <= claimedAt)) {
      skipped += 1;
      continue;
    }

    const claimAt = new Date().toISOString();
    const { data: claimedRows, error: claimError } = await supabase
      .from(PROJECTS_TABLE)
      .update({ progress_email_claimed_at: claimAt })
      .eq("share_token", row.share_token)
      .eq("progress_changed_at", row.progress_changed_at)
      .lt("last_notified_progress", progress)
      .or(`last_progress_email_sent_at.is.null,last_progress_email_sent_at.lt.${row.progress_changed_at}`)
      .or(`progress_email_claimed_at.is.null,progress_email_claimed_at.lt.${row.progress_changed_at}`)
      .select("share_token");

    if (claimError || !claimedRows?.length) {
      skipped += 1;
      continue;
    }

    const clientName = String(project.client || "client");
    const projectName = String(project.name || "projet");
    const shareUrl = `${getPublicClientOrigin()}/client/${row.share_token}`;
    const subject = `Votre projet ${projectName} a avancé`;
    const text = `Bonjour ${clientName},\n\nVotre projet ${projectName} a avancé aujourd'hui. Il est maintenant rendu à ${progress}%.\n\nVous pouvez consulter le suivi ici : ${shareUrl}\n\nMerci beaucoup,\nL'Atelier Kaleido`;
    const html = `
      <p>Bonjour ${escapeHtml(clientName)},</p>
      <p>Votre projet <strong>${escapeHtml(projectName)}</strong> a avancé aujourd'hui.</p>
      <p>Avancement actuel : <strong>${progress}%</strong></p>
      <p><a href="${shareUrl}">Consulter le suivi du projet</a></p>
      <p>Merci beaucoup,<br/>L'Atelier Kaleido</p>
    `;

    const emailResult = await sendResendEmail({ to: email, subject, html, text });
    if (!emailResult.ok) {
      await supabase
        .from(PROJECTS_TABLE)
        .update({ progress_email_claimed_at: null })
        .eq("share_token", row.share_token)
        .eq("progress_email_claimed_at", claimAt);
      skipped += 1;
      continue;
    }

    await supabase
      .from(PROJECTS_TABLE)
      .update({
        last_progress_email_sent_at: new Date().toISOString(),
        last_notified_progress: progress,
      })
      .eq("share_token", row.share_token);

    sent += 1;
  }

  return jsonResponse({ ok: true, sent, skipped });
});
