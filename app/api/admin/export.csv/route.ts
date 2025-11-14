import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabaseServer";
import iconv from "iconv-lite";

type ExportRow = {
  show_title: string;
  start_at: string;
  venue: string;
  name: string;
  email: string;
  qty: number;
  status: string;
  checked_in: boolean;
  created_at: string;
};

const headers: (keyof ExportRow)[] = [
  "show_title",
  "start_at",
  "venue",
  "name",
  "email",
  "qty",
  "status",
  "checked_in",
  "created_at",
];

function escapeCsv(value: string) {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (!session || sessionError) {
    return new Response("Unauthorized", { status: 401 });
  }

  const adminClient = supabaseAdmin();

  const { data: adminUser, error: adminError } = await adminClient
    .from("admins")
    .select("id")
    .eq("id", session.user.id)
    .single();

  if (adminError || !adminUser) {
    return new Response("Forbidden", { status: 403 });
  }

  const { data, error } = await adminClient
    .from("reservations_export_view")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return new Response("Failed to export", { status: 500 });
  }

  const rows: ExportRow[] = (data ?? []) as ExportRow[];
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => escapeCsv(String(row[h] ?? ""))).join(",")
    ),
  ].join("\r\n");

  const sjis = iconv.encode(csv, "Shift_JIS");
const body = new Uint8Array(sjis);

return new Response(body, {
  status: 200,
  headers: {
    "Content-Type": "text/csv; charset=shift_jis",
    "Content-Disposition": `attachment; filename="reservations-${new Date().toISOString()}.csv"`,
  },
});
}