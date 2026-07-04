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

  const { shareToken } = await req.json().catch(() => ({}));
  if (!shareToken) {
    return jsonResponse({ ok: false, reason: "Lien client incomplet." }, 400);
  }

  const now = new Date().toISOString();
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await supabase
    .from(PROJECTS_TABLE)
    .update({
      client_last_seen_at: now,
      client_message_email_pending: false,
      updated_at: now,
    })
    .eq("share_token", shareToken);

  if (error) {
    return jsonResponse({ ok: false, reason: error.message }, 500);
  }

  return jsonResponse({ ok: true, seenAt: now });
});
