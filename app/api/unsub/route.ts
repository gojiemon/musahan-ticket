import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response(JSON.stringify({ error: "token required" }), { status: 400 });
  const sb = supabaseAdmin();
  const { data: sub, error } = await sb
    .from("subscribers")
    .select("id")
    .eq("unsub_token", token)
    .maybeSingle();

  if (error || !sub) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 400 });

  const now = new Date().toISOString();
  await sb.from("subscribers").update({ unsubscribed_at: now }).eq("id", sub.id);
  await sb.from("unsub_events").insert({ subscriber_id: sub.id, at: now, reason: "one-click" });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

