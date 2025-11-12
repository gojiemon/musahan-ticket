import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { toCSV } from "@/lib/csv";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const performance_id = url.searchParams.get("performance_id");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const supa = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supa.auth.getSession();
  const role = (session?.user?.app_metadata as any)?.role;
  if (!session || role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const sb = supabaseAdmin();
  let query = sb.from("reservations_join").select("*");
  if (performance_id) query = query.eq("performance_id", performance_id);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  const { data, error } = await query;
  if (error) return new Response("Error", { status: 500 });
  const rows = (data ?? []).map((r: any) => ({
    show_title: r.show_title,
    start_at: r.start_at,
    venue: r.venue,
    name: r.name,
    email: r.email,
    qty: r.qty,
    status: r.status,
    checked_in: r.checked_in,
    created_at: r.created_at
  }));
  const csv = toCSV(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=reservations.csv",
      "Cache-Control": "no-store"
    }
  });
}

