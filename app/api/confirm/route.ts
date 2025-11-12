import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response(JSON.stringify({ error: "token required" }), { status: 400 });
  const sb = supabaseAdmin();
  const now = new Date().toISOString();
  const { data: sub, error } = await sb
    .from("subscribers")
    .select("id")
    .eq("confirm_token", token)
    .gte("confirm_token_expires_at", now)
    .maybeSingle();
  if (error || !sub) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 400 });

  await sb.from("subscribers").update({
    confirmed_at: now,
    confirm_token: null,
    confirm_token_expires_at: null
  }).eq("id", sub.id);

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

