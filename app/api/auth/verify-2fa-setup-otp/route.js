import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { setupOtpStore } from "@/src/lib/setup-otp-store";

export async function POST(request) {
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

    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "Code invalide" },
        { status: 400 }
      );
    }

    // Vérifier le code
    const isValid = setupOtpStore.verify(session.user.id, code);

    if (!isValid) {
      return NextResponse.json(
        { error: "Code incorrect ou expiré" },
        { status: 400 }
      );
    }

    return NextResponse.json({ status: true, verified: true });
  } catch (error) {
    console.error("[2FA Verify Setup OTP] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
