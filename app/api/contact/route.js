import { NextResponse } from "next/server";
import { resend } from "@/src/lib/resend";
import { emailTemplates } from "@/src/lib/email-templates";
import { withErrorHandler } from "@/src/lib/security";

const CONTACT_RECIPIENT = process.env.CONTACT_EMAIL || "contact@newbi.fr";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limit simple en mémoire : 5 envois / 10 min par IP
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const submissions = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (submissions.get(ip) || []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  submissions.set(ip, timestamps);
  return false;
}

async function handler(request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de messages envoyés. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  const { name, email, subject, message, website } = await request.json();

  // Honeypot anti-spam : champ invisible pour les humains
  if (website) {
    return NextResponse.json({ success: true });
  }

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Tous les champs sont requis" },
      { status: 400 },
    );
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  if (name.length > 200 || subject.length > 200 || message.length > 5000) {
    return NextResponse.json({ error: "Message trop long" }, { status: 400 });
  }

  const html = emailTemplates.contactNotification({
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
  });

  const { error } = await resend.emails.send({
    to: CONTACT_RECIPIENT,
    subject: `Formulaire de contact - ${subject.trim()}`,
    html,
    from: "Newbi <noreply@newbi.sweily.fr>",
    replyTo: email.trim(),
  });

  if (error) {
    console.error("Erreur envoi email contact:", error);
    return NextResponse.json(
      { error: "L'envoi du message a échoué. Réessayez plus tard." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}

export const POST = withErrorHandler(handler);
