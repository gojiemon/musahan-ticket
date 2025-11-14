import { cookies } from \"next/headers\";
import { createRouteHandlerClient } from \"@supabase/auth-helpers-nextjs\";
import { supabaseAdmin } from \"@/lib/supabaseServer\";
import { toCSV } from \"@/lib/csv\";
import iconv from \"iconv-lite\";
import * as XLSX from \"xlsx\";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const performance_id = url.searchParams.get(\"performance_id\");
  const from = url.searchParams.get(\"from\");
  const to = url.searchParams.get(\"to\");

  const supa = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supa.auth.getSession();
  const role = (session?.user?.app_metadata as any)?.role;
  if (!session || role !== \"admin\") {
    return new Response(\"Unauthorized\", { status: 401 });
  }

  const sb = supabaseAdmin();
  let query = sb.from(\"reservations_join\").select(\"*\");
  if (performance_id) query = query.eq(\"performance_id\", performance_id);
  if (from) query = query.gte(\"created_at\", from);
  if (to) query = query.lte(\"created_at\", to);
  const { data, error } = await query;
  if (error) return new Response(\"Error\", { status: 500 });
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

  const fmt = (url.searchParams.get(\"fmt\") || \"\").toLowerCase();
  const enc = url.searchParams.get(\"enc\");

  const headers = [
    \"show_title\",
    \"start_at\",
    \"venue\",
    \"name\",
    \"email\",
    \"qty\",
    \"status\",
    \"checked_in\",
    \"created_at\"
  ];

  if (fmt === \"xlsx\") {
    const aoa: any[][] = [headers];
    for (const r of rows) aoa.push(headers.map(h => (r as any)?.[h] ?? \"\"));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, \"reservations\");
    const buf = XLSX.write(wb, { type: \"buffer\", bookType: \"xlsx\" });
    return new Response(buf, {
      status: 200,
      headers: {
        \"Content-Type\": \"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\",
        \"Content-Disposition\": \"attachment; filename=reservations.xlsx\",
        \"Cache-Control\": \"no-store\"
      }
    });
  }

  // UTF-16LE + TSV は Excel で確実に開ける
  if (enc === \"utf16\") {
    const escape = (v: any) => String(v ?? \"\").replace(/\t/g, \" \" ).replace(/[\r\n]/g, \" \" );
    const lines = [headers.join(\"\t\"), ...rows.map(r => headers.map(h => escape((r as any)[h])).join(\"\t\"))];
    const tsv = lines.join(\"\r\n\");
    const bomBuf = Buffer.from([0xFF, 0xFE]);
    const bodyBuf = Buffer.concat([bomBuf, iconv.encode(tsv, \"UTF-16LE\")]);
    const utf16 = new Uint8Array(bodyBuf.buffer, bodyBuf.byteOffset, bodyBuf.byteLength);
    return new Response(utf16, {
      status: 200,
      headers: {
        \"Content-Type\": \"text/tab-separated-values; charset=UTF-16LE\",
        \"Content-Disposition\": \"attachment; filename=reservations.tsv\",
        \"Cache-Control\": \"no-store\"
      }
    });
  }

  const escapeCsv = (s: string) => /[\",\n]/.test(s) ? \"\" : s;
  const csv = [
    headers.join(\",\"),
    ...rows.map((r: any) => headers.map(h => escapeCsv(String(r?.[h] ?? \"\"))).join(\",\"))
  ].join(\"\r\n\");

  if (enc === \"utf8\") {
    const bom = \"\\uFEFF\" + csv;
    return new Response(bom, {
      status: 200,
      headers: {
        \"Content-Type\": \"text/csv; charset=utf-8\",
        \"Content-Disposition\": \"attachment; filename=reservations.csv\",
        \"Cache-Control\": \"no-store\"
      }
    });
  }

  // 既定は Shift_JIS (CP932) に変換して Excel での文字化けを防ぐ
  const sjisBuffer = iconv.encode(csv, \"Shift_JIS\");
  const sjis = new Uint8Array(sjisBuffer.buffer, sjisBuffer.byteOffset, sjisBuffer.byteLength);
  return new Response(sjis, {
    status: 200,
    headers: {
      \"Content-Type\": \"text/csv; charset=shift_jis\",
      \"Content-Disposition\": \"attachment; filename=reservations.csv\",
      \"Cache-Control\": \"no-store\"
    }
  });
}
