// Newsletter signup. The site never talks to Acumbamail from the browser —
// the form posts here and we forward to the incoming-webhook URL (docs:
// https://en.soporte.acumbamail.com/article/357-incoming-webhooks). That URL
// is unique per account/operation and unguessable, so it doubles as the
// credential and stays server-side only (ACUMBAMAIL_WEBHOOK_URL). The flags
// are fixed here, never client-controlled: double_optin=1 (privacy policy §8
// promises it), welcome_email=1, update_subscriber=1 (repeat signups update
// silently instead of erroring). Keep them in sync with the field mapping of
// the webhook in Acumbamail.

import { NextResponse } from "next/server";
import { z } from "zod";

const postSchema = z.object({
  email: z.email().max(320),
  // Honeypot: invisible to humans, filled by bots. Never forwarded.
  company: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // A bot hit the honeypot — pretend success and forward nothing.
  if (body.company) {
    return NextResponse.json({ ok: true });
  }

  const webhookUrl = process.env.ACUMBAMAIL_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("newsletter: ACUMBAMAIL_WEBHOOK_URL is not set");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        email: body.email,
        double_optin: 1,
        welcome_email: 1,
        update_subscriber: 1,
      }),
    });
  } catch (err) {
    console.error("newsletter: webhook request failed:", err);
    return NextResponse.json(
      { error: "upstream_unreachable" },
      { status: 502 },
    );
  }

  // Acumbamail answers errors as {"error": ...} with 400/403/404 — log the
  // detail server-side, keep the client message generic. Success is 201.
  if (!upstream.ok) {
    console.error(
      "newsletter: Acumbamail rejected the signup:",
      upstream.status,
      await upstream.text().catch(() => ""),
    );
    return NextResponse.json({ error: "upstream_rejected" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
