import { Resend } from "resend";
import ReservationEmail from "@/emails/ReservationEmail";
import SubscribeConfirmEmail from "@/emails/SubscribeConfirmEmail";
import BroadcastEmail from "@/emails/BroadcastEmail";
import * as React from "react";

let _resend: Resend | null | undefined;
function getResend(): Resend | null {
  if (_resend !== undefined) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    _resend = null;
    return null;
  }
  _resend = new Resend(key);
  return _resend;
}

function listUnsubHeader(url: string, mailto: string) {
  return `${url}, <mailto:${mailto}?subject=unsubscribe>`;
}

export async function sendReservationEmail(opts: {
  to: string;
  subject: string;
  props: React.ComponentProps<typeof ReservationEmail>;
  unsubUrl: string;
}) {
  const client = getResend();
  if (!client) return { skipped: true } as any;
  const from = process.env.MAIL_FROM!;
  const organizerEmail = process.env.ORGANIZER_EMAIL!;
  const headers = {
    "List-Unsubscribe": listUnsubHeader(opts.unsubUrl, organizerEmail)
  } as Record<string, string>;
  return client.emails.send({
    from,
    to: [opts.to],
    subject: opts.subject,
    headers,
    react: ReservationEmail(opts.props)
  });
}

export async function sendSubscribeConfirmEmail(opts: {
  to: string;
  subject: string;
  props: React.ComponentProps<typeof SubscribeConfirmEmail>;
  unsubUrl: string;
}) {
  const client = getResend();
  if (!client) return { skipped: true } as any;
  const from = process.env.MAIL_FROM!;
  const organizerEmail = process.env.ORGANIZER_EMAIL!;
  const headers = {
    "List-Unsubscribe": listUnsubHeader(opts.unsubUrl, organizerEmail)
  } as Record<string, string>;
  return client.emails.send({
    from,
    to: [opts.to],
    subject: opts.subject,
    headers,
    react: SubscribeConfirmEmail(opts.props)
  });
}

export async function sendBroadcastEmail(opts: {
  to: string;
  subject: string;
  html: string;
  unsubUrl: string;
  replyTo?: string;
}) {
  const client = getResend();
  if (!client) return { skipped: true } as any;
  const from = process.env.MAIL_FROM!;
  const organizerEmail = process.env.ORGANIZER_EMAIL!;
  const headers = {
    "List-Unsubscribe": listUnsubHeader(opts.unsubUrl, organizerEmail)
  } as Record<string, string>;
  return client.emails.send({
    from,
    to: [opts.to],
    reply_to: opts.replyTo ?? process.env.ORGANIZER_EMAIL,
    subject: opts.subject,
    headers,
    react: BroadcastEmail({
      subject: opts.subject,
      html: opts.html,
      organizerName: process.env.ORGANIZER_NAME,
      organizerEmail: process.env.ORGANIZER_EMAIL,
      organizerAddress: process.env.ORGANIZER_ADDRESS
    })
  });
}
