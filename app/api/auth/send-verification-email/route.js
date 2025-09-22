import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

export async function POST(request) {
  try {
    console.log("📧 Début de l'envoi d'email de vérification");
    
    const { email, callbackURL } = await request.json();
    console.log("📧 Email:", email);
    console.log("📧 Callback URL:", callbackURL);

    if (!email) {
      console.log("❌ Email manquant");
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Vérifier la configuration Resend
    console.log("🔑 RESEND_API_KEY configuré:", !!process.env.RESEND_API_KEY);
    console.log("🌐 NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);

    // Utiliser Better Auth pour envoyer l'email de vérification
    console.log("📤 Appel à Better Auth sendVerificationEmail...");
    const result = await auth.api.sendVerificationEmail({
      body: {
        email: email.toLowerCase(),
        callbackURL: callbackURL || `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`
      }
    });

    console.log("📧 Résultat Better Auth:", result);

    if (result.error) {
      console.error("❌ Erreur Better Auth:", result.error);
      return NextResponse.json(
        { error: "Failed to send verification email", details: result.error },
        { status: 400 }
      );
    }

    console.log("✅ Email de vérification envoyé avec succès");
    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully"
    });

  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email de vérification:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
