import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sendBroadcastEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  replyTo: z.string().email().optional(),
  testEmail: z.string().email().optional()
});

const CHUNK_SIZE = 50;

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supa.auth.getSession();
  const role = (session?.user?.app_metadata as any)?.role;
  if (!session || role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
  }
  const payload = parsed.data;

  const sb = supabaseAdmin();
  let recipients: Array<{ id?: string; email: string; name?: string | null; unsub_token?: string | null }> = [];

  if (payload.testEmail) {
    recipients = [{ email: payload.testEmail, name: "テスト送信" }];
  } else {
    const { data, error } = await sb
      .from("subscribers")
      .select("id, email, name, unsub_token, confirmed_at, unsubscribed_at")
      .is("unsubscribed_at", null)
      .not("confirmed_at", "is", null);
    if (error) {
      return new Response(JSON.stringify({ error: "Failed to load subscribers" }), { status: 500 });
    }
    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: "購読者が見つかりません" }), { status: 400 });
    }
    recipients = data;
  }

  const appBase = process.env.APP_BASE_URL ?? "";
  const unsubFallback = `${appBase}/unsub`;
  const replyTo = payload.replyTo ?? process.env.ORGANIZER_EMAIL ?? process.env.MAIL_FROM;

  let sent = 0;
  for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + CHUNK_SIZE);
    const jobs = chunk.map(async (r) => {
      if (!r.email) return;
      let token = r.unsub_token;
      if (!payload.testEmail && !token && r.id) {
        token = crypto.randomUUID();
        await sb.from("subscribers").update({ unsub_token: token }).eq("id", r.id);
      }
      const unsubUrl = payload.testEmail
        ? unsubFallback
        : `${appBase}/unsub?token=${token}`;
      try {
        await sendBroadcastEmail({
          to: r.email,
          subject: payload.subject,
          html: payload.html,
          unsubUrl,
          replyTo
        });
        sent += 1;
      } catch (err) {
        console.error("broadcast send failed", r.email, err);
      }
    });
    await Promise.allSettled(jobs);
  }

  await sb.from("deliveries").insert({
    subject: payload.subject,
    body: payload.html,
    sent_at: new Date().toISOString(),
    provider_msg_id: payload.testEmail ? "test" : `broadcast:${sent}`
  });

  return new Response(JSON.stringify({ sent }), { status: 200 });
}

