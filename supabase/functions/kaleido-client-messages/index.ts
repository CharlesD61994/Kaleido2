import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, getServiceRoleKey, jsonResponse } from "../_shared/cors.ts";

const PROJECTS_TABLE = "kaleido_client_projects";
const MESSAGES_TABLE = "kaleido_client_messages";

type MessageSender = "owner" | "client";

const cleanText = (value: unknown) => String(value || "").trim();

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
  const authClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY") || "",
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization") || "" },
      },
    },
  );

  const body = await req.json().catch(() => ({}));
  const action = cleanText(body.action);
  const shareToken = cleanText(body.shareToken);

  if (!shareToken) {
    return jsonResponse({ ok: false, reason: "Lien client incomplet." }, 400);
  }

  const { data: projectRow, error: projectError } = await supabase
    .from(PROJECTS_TABLE)
    .select("share_token, owner_key")
    .eq("share_token", shareToken)
    .maybeSingle();

  if (projectError || !projectRow) {
    return jsonResponse({ ok: false, reason: projectError?.message || "Fiche client introuvable." }, 404);
  }

  if (action === "list") {
    const { data, error } = await supabase
      .from(MESSAGES_TABLE)
      .select("id, sender, body, attachment_url, attachment_type, created_at")
      .eq("share_token", shareToken)
      .order("created_at", { ascending: true })
      .limit(80);

    if (error) {
      return jsonResponse({ ok: false, reason: error.message || "Les messages sont impossibles a charger." }, 500);
    }

    return jsonResponse({ ok: true, messages: data || [] });
  }

  if (action === "send") {
    const sender: MessageSender = body.sender === "owner" ? "owner" : "client";
    const messageBody = cleanText(body.body);
    const attachmentUrl = cleanText(body.attachmentUrl);
    const attachmentType = cleanText(body.attachmentType);

    if (!messageBody && !attachmentUrl) {
      return jsonResponse({ ok: false, reason: "Le message est vide." }, 400);
    }

    if (sender === "owner") {
      const { data: userData } = await authClient.auth.getUser();
      const userId = userData?.user?.id || "";
      if (!userId) {
        return jsonResponse({ ok: false, reason: "Connexion requise pour repondre au client." }, 401);
      }
    }

    const { data, error } = await supabase
      .from(MESSAGES_TABLE)
      .insert({
        share_token: shareToken,
        owner_key: projectRow.owner_key,
        sender,
        body: messageBody,
        attachment_url: attachmentUrl || null,
        attachment_type: attachmentType || null,
      })
      .select("id, sender, body, attachment_url, attachment_type, created_at")
      .single();

    if (error) {
      return jsonResponse({ ok: false, reason: error.message || "Le message n'a pas pu etre envoye." }, 500);
    }

    return jsonResponse({ ok: true, message: data });
  }

  return jsonResponse({ ok: false, reason: "Action non supportee." }, 400);
});
