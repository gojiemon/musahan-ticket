import { supabaseAdmin } from "@/lib/supabaseServer";

async function handleCancel(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response(JSON.stringify({ error: "token required" }), { status: 400 });

  const sb = supabaseAdmin();

  const { data: r, error } = await sb.from("reservations").select("id, performance_id, qty, status").eq("token", token).single();
  if (error || !r) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  if (r.status === "cancelled") return new Response(JSON.stringify({ ok: true }), { status: 200 });

  const { error: uErr } = await sb.from("reservations").update({ status: "cancelled" }).eq("id", r.id);
  if (uErr) return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });

  await sb.rpc("release_seats", { p_performance_id: r.performance_id, p_qty: r.qty });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

export async function PATCH(req: Request) {
  return handleCancel(req);
}

// Allow POST as well to enable simple <form method="post"> from Server Components
export async function POST(req: Request) {
  return handleCancel(req);
}
