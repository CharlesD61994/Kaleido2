import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, getPublicClientOrigin, getServiceRoleKey, jsonResponse, sendResendEmail } from "../_shared/cors.ts";

const PROJECTS_TABLE = "kaleido_client_projects";

type ClientProjectRow = {
  share_token: string;
  project_json: Record<string, unknown> | null;
};

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, reason: "Méthode non supportée." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, reason: "Secrets Supabase manquants." });
  }

  const { shareToken } = await req.json().catch(() => ({}));
  if (!shareToken) {
    return jsonResponse({ ok: false, reason: "Lien client incomplet." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: projectRow, error: projectError } = await supabase
    .from(PROJECTS_TABLE)
    .select("share_token, project_json")
    .eq("share_token", shareToken)
    .maybeSingle<ClientProjectRow>();

  if (projectError || !projectRow?.project_json) {
    return jsonResponse({ ok: false, reason: projectError?.message || "Fiche client introuvable." });
  }

  const project = projectRow.project_json;
  const recipient = String(project.email || "").trim();
  const clientName = String(project.client || "client");
  const projectName = String(project.name || "projet");
  const shareUrl = `${getPublicClientOrigin()}/client/${shareToken}`;
  const subject = `Suivi de votre projet ${projectName}`;
  const text = [
    `Bonjour ${clientName},`,
    "",
    "Merci d'encourager un artisan d'ici! C'est un plaisir de réaliser ce projet avec vous.",
    "",
    "Vous pouvez suivre son avancement et communiquer facilement avec moi en tout temps à l'aide du lien suivant :",
    shareUrl,
    "",
    "N'hésitez pas à me poser vos questions tout au long du projet. Il me fera plaisir d'y répondre.",
    "",
    "Merci beaucoup,",
    "L'Atelier Kaleido",
  ].join("\n");

  const html = `
    <p>Bonjour ${escapeHtml(clientName)},</p>
    <p>Merci d'encourager un artisan d'ici! C'est un plaisir de réaliser ce projet avec vous.</p>
    <p>Vous pouvez suivre son avancement et communiquer facilement avec moi en tout temps à l'aide du lien suivant :</p>
    <p><a href="${shareUrl}">Ouvrir la fiche client</a></p>
    <p>N'hésitez pas à me poser vos questions tout au long du projet. Il me fera plaisir d'y répondre.</p>
    <p>Merci beaucoup,<br/>L'Atelier Kaleido</p>
  `;

  const emailResult = await sendResendEmail({ to: recipient, subject, html, text });
  if (!emailResult.ok) {
    return jsonResponse({
      ...emailResult,
      missing: "client_email",
    });
  }

  return jsonResponse({ ok: true });
});
