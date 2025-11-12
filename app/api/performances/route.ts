import { supabasePublicServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    const sb = supabasePublicServer();
    const now = new Date().toISOString();
    const { data, error } = await sb
      .from("performances_view")
      .select("*")
      .gte("start_at", now)
      .order("start_at", { ascending: true });
    if (error) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    return new Response(JSON.stringify(data ?? []), { status: 200 });
  } catch {
    return new Response(JSON.stringify([]), { status: 200 });
  }
}
