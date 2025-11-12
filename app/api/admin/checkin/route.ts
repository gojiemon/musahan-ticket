import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { z } from "zod";

const schema = z.object({ token: z.string().uuid() });

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supa.auth.getSession();
  const role = (session?.user?.app_metadata as any)?.role;

  if (!session || role !== "admin") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });

  const sb = supabaseAdmin();
  const { data: r, error } = await sb.from("reservations").select("id, status, checked_in").eq("token", parsed.data.token).single();
  if (error || !r) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  if (r.status !== "confirmed") return new Response(JSON.stringify({ error: "Not confirmed" }), { status: 400 });

  const { error: uErr } = await sb.from("reservations").update({ checked_in: true }).eq("id", r.id);
  if (uErr) return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

