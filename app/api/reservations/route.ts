import { z } from "zod";
import { assertSameOriginOrThrow } from "@/lib/csrf";
import { verifyHCaptcha } from "@/lib/hcaptcha";
import { checkRateLimit } from "@/lib/rateLimit";
import { normalizeEmail } from "@/lib/normalizeEmail";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { generateQRDataUrl } from "@/lib/qr";
import { sendReservationEmail, sendSubscribeConfirmEmail } from "@/lib/email";

const schema = z.object({
  performance_id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  qty: z.number().int().min(1).max(10),
  note: z.string().max(500).optional(),
  newsletter_optin: z.boolean().optional(),
  hcaptcha_token: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    assertSameOriginOrThrow(req);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? null;
    const body = await req.json();
    const input = schema.safeParse(body);
    if (!input.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    }
    const ok = await verifyHCaptcha(input.data.hcaptcha_token, ip ?? undefined);
    if (!ok) return new Response(JSON.stringify({ error: "Captcha failed" }), { status: 400 });

    const email_norm = normalizeEmail(input.data.email);

    const rl = await checkRateLimit({
      endpoint: "reservations",
      ip,
      email_norm,
      windowSec: 60,
      maxHits: 3
    });
    if (!rl.allowed) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429 });

    const sb = supabaseAdmin();
    const { data: perf, error: pErr } = await sb
      .from("performances").select("id, show_id, start_at, venue, capacity, reserved_count").eq("id", input.data.performance_id).single();
    if (pErr || !perf) {
      return new Response(JSON.stringify({ error: "Performance not found" }), { status: 404 });
    }

    const { data: reservedOk } = await sb.rpc("reserve_seats", { p_performance_id: perf.id, p_qty: input.data.qty });
    if (!reservedOk) {
      return new Response(JSON.stringify({ error: "Sold out or insufficient seats" }), { status: 409 });
    }

    const token = crypto.randomUUID();
    const { data: show } = await sb.from("shows").select("title").eq("id", perf.show_id).single();

    const { error: rErr } = await sb.from("reservations").insert({
      performance_id: perf.id,
      name: input.data.name,
      email: input.data.email,
      email_norm,
      qty: input.data.qty,
      note: input.data.note ?? null,
      token
    });
    if (rErr) {
      await sb.rpc("release_seats", { p_performance_id: perf.id, p_qty: input.data.qty });
      return new Response(JSON.stringify({ error: "Failed to create reservation", detail: rErr.message }), { status: 500 });
    }

    if (input.data.newsletter_optin) {
      const confirm_token = crypto.randomUUID();
      const expires = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const unsub_token = crypto.randomUUID();
      await sb.from("subscribers").upsert({
        email: input.data.email,
        email_norm,
        name: input.data.name,
        confirm_token,
        confirm_token_expires_at: expires,
        unsub_token: unsub_token
      }, { onConflict: "email" });
      const confirmUrl = `${process.env.APP_BASE_URL}/confirm?token=${confirm_token}`;
      const unsubUrl = `${process.env.APP_BASE_URL}/unsub?token=${unsub_token}`;
      await sb.from("deliveries").insert({ subject: "購読の確認", body: confirmUrl });
      await sendSubscribeConfirmEmail({
        to: input.data.email,
        subject: "【要確認】メール購読の確認",
        props: { name: input.data.name, confirmUrl, organizerName: process.env.ORGANIZER_NAME! },
        unsubUrl
      }).catch(() => {});
    }

    const qr = await generateQRDataUrl(`ticket:${token}`);
    const cancelUrl = `${process.env.APP_BASE_URL}/api/reservations/cancel?token=${token}`;
    const unsubUrl = `${process.env.APP_BASE_URL}/unsub?token=${crypto.randomUUID()}`;

    await sb.from("deliveries").insert({ subject: "予約確定", body: `token=${token}` });

    await sendReservationEmail({
      to: input.data.email,
      subject: "予約確定のお知らせ",
      props: {
        name: input.data.name,
        email: input.data.email,
        qty: input.data.qty,
        showTitle: show?.title ?? "公演",
        startAt: perf.start_at,
        venue: perf.venue,
        venueText: "",
        organizerName: process.env.ORGANIZER_NAME!,
        organizerEmail: process.env.ORGANIZER_EMAIL!,
        organizerAddress: process.env.ORGANIZER_ADDRESS ?? "",
        qrDataUrl: qr,
        cancelUrl
      },
      unsubUrl
    }).catch(() => {});

    return new Response(JSON.stringify({ token }), { status: 201 });
  } catch (e: any) {
    console.error("/api/reservations error:", e?.message || e);
    const detail = process.env.NODE_ENV !== 'production' ? (e?.message || String(e)) : undefined;
    return new Response(JSON.stringify({ error: "Server error", detail }), { status: 500 });
  }
}
