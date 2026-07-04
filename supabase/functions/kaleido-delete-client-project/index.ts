import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, getServiceRoleKey, jsonResponse } from "../_shared/cors.ts";

const PROJECTS_TABLE = "kaleido_client_projects";
const MESSAGES_TABLE = "kaleido_client_messages";

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

  const { shareToken } = await req.json().catch(() => ({}));
  if (!shareToken) {
    return jsonResponse({ ok: false, reason: "Lien client incomplet." }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error: messagesError } = await supabase
    .from(MESSAGES_TABLE)
    .delete()
    .eq("share_token", shareToken);

  if (messagesError) {
    return jsonResponse({ ok: false, reason: messagesError.message }, 500);
  }

  const { error: projectError } = await supabase
    .from(PROJECTS_TABLE)
    .delete()
    .eq("share_token", shareToken);

  if (projectError) {
    return jsonResponse({ ok: false, reason: projectError.message }, 500);
  }

  return jsonResponse({ ok: true });
});
