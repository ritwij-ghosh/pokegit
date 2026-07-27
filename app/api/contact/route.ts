import { NextResponse } from "next/server";
import { Resend } from "resend";

import { allowRequest } from "@/lib/rate-limit";
import { SITE_FOUNDER } from "@/lib/site";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_SUBJECT = "Feature Suggestion";
const MAX_NAME = 80;
const MAX_EMAIL = 160;
const MAX_SUBJECT = 120;
const MAX_MESSAGE = 4000;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  if (!allowRequest(`contact:${clientKey(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith("re_your_key")) {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { name, email, subject, message } = body as Record<string, unknown>;
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  const trimmedSubject =
    (typeof subject === "string" ? subject.trim() : "") || DEFAULT_SUBJECT;
  const trimmedMessage = typeof message === "string" ? message.trim() : "";

  if (!trimmedName || trimmedName.length > MAX_NAME) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }
  if (!EMAIL_RE.test(trimmedEmail) || trimmedEmail.length > MAX_EMAIL) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (trimmedSubject.length > MAX_SUBJECT) {
    return NextResponse.json({ error: "invalid_subject" }, { status: 400 });
  }
  if (!trimmedMessage || trimmedMessage.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }

  const from =
    process.env.RESEND_FROM?.trim() || "PokeGit <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [SITE_FOUNDER.email],
      replyTo: trimmedEmail,
      subject: `PokeGit: ${trimmedSubject}`,
      text: [
        `Name: ${trimmedName}`,
        `Reply-to: ${trimmedEmail}`,
        `Subject: ${trimmedSubject}`,
        "",
        trimmedMessage,
      ].join("\n"),
    });

    if (error) {
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
}
