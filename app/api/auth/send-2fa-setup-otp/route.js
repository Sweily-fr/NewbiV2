import { randomInt } from "crypto";
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

  // Code OTP à 6 chiffres, tiré par le générateur cryptographique
  const otp = randomInt(100000, 1000000).toString();

  // Stocker le code en base (expire dans 5 min)
  await setupOtpStore.set(session.user.id, otp, 5 * 60 * 1000);

  // Envoyer l'email
  await send2FAEmail(session.user, otp);

  return NextResponse.json({ status: true });
}

export const POST = withErrorHandler(handler);
