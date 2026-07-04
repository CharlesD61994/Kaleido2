export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const jsonResponse = (body: Record<string, unknown>, status = 200) => (
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
);

export const getServiceRoleKey = () => {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  try {
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    return secretKeys.default || "";
  } catch {
    return "";
  }
};

export const getPublicClientOrigin = () => (
  Deno.env.get("PUBLIC_CLIENT_ORIGIN")
  || Deno.env.get("VITE_PUBLIC_CLIENT_ORIGIN")
  || "https://kaleido3.vercel.app"
);

export const sendResendEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("KALEIDO_EMAIL_FROM") || "Kaleido <suivi@atelierkaleido.ca>";

  if (!apiKey) {
    return { ok: false, reason: "RESEND_API_KEY manquant." };
  }

  if (!to) {
    return { ok: false, reason: "Aucun destinataire.", code: "missing_recipient" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      reason: data?.message || `Resend a refuse le courriel (${response.status}).`,
      data,
    };
  }

  return { ok: true, data };
};
