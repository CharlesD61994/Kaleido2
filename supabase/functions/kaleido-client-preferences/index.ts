import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, getServiceRoleKey, jsonResponse } from "../_shared/cors.ts";

const PROJECTS_TABLE = "kaleido_client_projects";

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

  const { shareToken, preferences } = await req.json().catch(() => ({}));
  if (!shareToken) {
    return jsonResponse({ ok: false, reason: "Lien client incomplet." }, 400);
  }

  const cleanPreferences = {
    messageEmails: preferences?.messageEmails !== false,
    progressEmails: preferences?.progressEmails !== false,
  };

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: currentRow, error: loadError } = await supabase
    .from(PROJECTS_TABLE)
    .select("project_json")
    .eq("share_token", shareToken)
    .maybeSingle<{ project_json: Record<string, unknown> | null }>();

  if (loadError || !currentRow?.project_json) {
    return jsonResponse({ ok: false, reason: loadError?.message || "Fiche client introuvable." }, 404);
  }

  const projectJson = {
    ...(currentRow.project_json || {}),
    notificationPreferences: cleanPreferences,
  };

  const { error: updateError } = await supabase
    .from(PROJECTS_TABLE)
    .update({
      project_json: projectJson,
      client_message_emails_enabled: cleanPreferences.messageEmails,
      client_progress_emails_enabled: cleanPreferences.progressEmails,
      updated_at: new Date().toISOString(),
    })
    .eq("share_token", shareToken);

  if (updateError) {
    return jsonResponse({ ok: false, reason: updateError.message }, 500);
  }

  return jsonResponse({ ok: true, preferences: cleanPreferences });
});
