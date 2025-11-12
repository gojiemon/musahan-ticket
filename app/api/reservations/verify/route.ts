import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response(JSON.stringify({ error: "token required" }), { status: 400 });
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("reservations_join")
    .select("*")
    .eq("token", token)
    .single();
  if (error || !data) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return new Response(JSON.stringify(data), { status: 200 });
}

