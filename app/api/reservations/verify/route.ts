import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response(JSON.stringify({ error: "token required" }), { status: 400 });

  const sb = supabaseAdmin();

  const { data: reservation, error: rErr } = await sb
    .from("reservations")
    .select("performance_id, qty")
    .eq("token", token)
    .single();
  if (rErr || !reservation) {
    console.error("verify reservation lookup failed", rErr?.message || rErr);
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const { data: perf, error: pErr } = await sb
    .from("performances")
    .select(`start_at, venue, show:shows!inner(title)`) // join to shows to get title
    .eq("id", reservation.performance_id)
    .single();
  if (pErr || !perf) {
    console.error("verify performance lookup failed", pErr?.message || pErr);
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  return new Response(JSON.stringify({
    show_title: perf.show?.title ?? "",
    start_at: perf.start_at,
    venue: perf.venue,
    qty: reservation.qty
  }), { status: 200 });
}

