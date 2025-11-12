import { supabaseAdmin } from "./supabaseServer";

export async function checkRateLimit(params: {
  endpoint: string;
  ip?: string | null;
  email_norm?: string | null;
  windowSec?: number;
  maxHits?: number;
}) {
  const { endpoint, ip = null, email_norm = null, windowSec = 60, maxHits = 5 } = params;
  const sb = supabaseAdmin();
  const { error } = await sb.from("rate_limit").insert({
    endpoint,
    ip,
    email_norm
  });
  if (error) {
    // 失敗しても制御は続行（ブロックしない）
  }
  const { data, error: qErr } = await sb.rpc("rate_limit_count", {
    p_endpoint: endpoint,
    p_ip: ip,
    p_email_norm: email_norm,
    p_window_sec: windowSec
  });
  if (qErr) return { allowed: true };
  const hits = Number(data ?? 0);
  return { allowed: hits <= maxHits, hits };
}

