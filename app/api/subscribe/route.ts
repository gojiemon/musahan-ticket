import { z } from "zod";
import { assertSameOriginOrThrow } from "@/lib/csrf";
import { verifyHCaptcha } from "@/lib/hcaptcha";
import { checkRateLimit } from "@/lib/rateLimit";
import { normalizeEmail } from "@/lib/normalizeEmail";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendSubscribeConfirmEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  consent: z.boolean(),
  hcaptcha_token: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    assertSameOriginOrThrow(req);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? null;
    const body = await req.json();
    const input = schema.safeParse(body);
    if (!input.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    if (!input.data.consent) return new Response(JSON.stringify({ error: "Consent required" }), { status: 400 });

    const ok = await verifyHCaptcha(input.data.hcaptcha_token, ip ?? undefined);
    if (!ok) return new Response(JSON.stringify({ error: "Captcha failed" }), { status: 400 });

    const email_norm = normalizeEmail(input.data.email);

    const rl = await checkRateLimit({ endpoint: "subscribe", ip, email_norm, windowSec: 60, maxHits: 3 });
    if (!rl.allowed) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429 });

    const sb = supabaseAdmin();

    const confirm_token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const unsub_token = crypto.randomUUID();

    await sb.from("subscribers").upsert({
      email: input.data.email,
      email_norm,
      name: input.data.name ?? null,
      confirm_token,
      confirm_token_expires_at: expires,
      unsub_token
    }, { onConflict: "email" });

    await sb.from("consents").insert({
      subscriber_id: null,
      text: "newsletter opt-in",
      checked_at: new Date().toISOString(),
      ip,
      user_agent: req.headers.get("user-agent"),
      source: "web"
    });

    const confirmUrl = `${process.env.APP_BASE_URL}/confirm?token=${confirm_token}`;
    const unsubUrl = `${process.env.APP_BASE_URL}/unsub?token=${unsub_token}`;
    await sendSubscribeConfirmEmail({
      to: input.data.email,
      subject: "【要確認】メール購読の確認",
      props: { name: input.data.name, confirmUrl, organizerName: process.env.ORGANIZER_NAME! },
      unsubUrl
    }).catch(() => {});

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

