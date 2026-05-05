import { auth } from "@/src/lib/auth";
import { send2FAEmail } from "@/src/lib/auth-utils";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { setupOtpStore } from "@/src/lib/setup-otp-store";
import { withErrorHandler } from "@/src/lib/security";

async function handler() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Générer un code OTP à 6 chiffres
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Stocker le code en base (expire dans 5 min)
  await setupOtpStore.set(session.user.id, otp, 5 * 60 * 1000);

  // Envoyer l'email
  await send2FAEmail(session.user, otp);

  return NextResponse.json({ status: true });
}

export const POST = withErrorHandler(handler);
