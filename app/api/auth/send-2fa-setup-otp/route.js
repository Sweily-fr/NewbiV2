import { auth } from "@/src/lib/auth";
import { send2FAEmail } from "@/src/lib/auth-utils";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { setupOtpStore } from "@/src/lib/setup-otp-store";

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Générer un code OTP à 6 chiffres
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Stocker le code en mémoire (expire dans 5 min)
    setupOtpStore.set(session.user.id, otp, 5 * 60 * 1000);

    // Envoyer l'email
    await send2FAEmail(session.user, otp);

    return NextResponse.json({ status: true });
  } catch (error) {
    console.error("[2FA Setup OTP] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'envoi" },
      { status: 500 }
    );
  }
}
