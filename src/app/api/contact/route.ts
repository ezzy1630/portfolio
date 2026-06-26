import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/contact
 * Persists a contact message to the ContactMessage table.
 *
 * Body: { message: string, name?: string, email?: string }
 *  - message: required, 1..5000 chars (after trim)
 *  - name:    optional, trimmed
 *  - email:   optional, but if present must look like an email
 *
 * Returns:
 *  - 200 { ok: true } on success
 *  - 400 { error: string } on validation failure
 *  - 500 { error: string } on persistence failure
 *
 * NOTE: This does NOT actually send SMTP email — persisting to the DB is
 * the "sent" mechanism for now.
 * TODO: wire SMTP (e.g. Resend) to forward to erappepo@ucsc.edu
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 5000;
const MAX_NAME = 200;
const MAX_EMAIL = 320;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Body must be a JSON object." },
      { status: 400 }
    );
  }

  const { message, name, email } = body as {
    message?: unknown;
    name?: unknown;
    email?: unknown;
  };

  // --- message (required) ---
  if (typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required and must be a string." },
      { status: 400 }
    );
  }
  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) {
    return NextResponse.json(
      { error: "message cannot be empty." },
      { status: 400 }
    );
  }
  if (trimmedMessage.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `message must be ${MAX_MESSAGE} characters or fewer.` },
      { status: 400 }
    );
  }

  // --- name (optional) ---
  let trimmedName: string | null = null;
  if (name !== undefined && name !== null) {
    if (typeof name !== "string") {
      return NextResponse.json(
        { error: "name must be a string if provided." },
        { status: 400 }
      );
    }
    const n = name.trim();
    if (n.length === 0) {
      trimmedName = null;
    } else {
      if (n.length > MAX_NAME) {
        return NextResponse.json(
          { error: `name must be ${MAX_NAME} characters or fewer.` },
          { status: 400 }
        );
      }
      trimmedName = n;
    }
  }

  // --- email (optional, but validated if present) ---
  let trimmedEmail: string | null = null;
  if (email !== undefined && email !== null) {
    if (typeof email !== "string") {
      return NextResponse.json(
        { error: "email must be a string if provided." },
        { status: 400 }
      );
    }
    const e = email.trim();
    if (e.length === 0) {
      trimmedEmail = null;
    } else {
      if (e.length > MAX_EMAIL || !EMAIL_RE.test(e)) {
        return NextResponse.json(
          { error: "email is not a valid email address." },
          { status: 400 }
        );
      }
      trimmedEmail = e;
    }
  }

  try {
    await db.contactMessage.create({
      data: {
        message: trimmedMessage,
        name: trimmedName,
        email: trimmedEmail,
      },
    });
    // TODO: wire SMTP (e.g. Resend) to forward to erappepo@ucsc.edu
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/contact] persistence error:", err);
    return NextResponse.json(
      { error: "Could not deliver message. Please try again later." },
      { status: 500 }
    );
  }
}
