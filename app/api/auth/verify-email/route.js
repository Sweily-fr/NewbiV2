import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

// Gérer les requêtes GET (liens d'email) - rediriger vers la page de vérification
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const callbackURL = searchParams.get('callbackURL');
  
  console.log("🔗 Lien de vérification d'email reçu");
  console.log("🎫 Token:", token);
  console.log("🔄 Callback URL:", callbackURL);
  
  if (!token) {
    // Rediriger vers la page avec une erreur
    return NextResponse.redirect(new URL('/auth/verify-email?error=missing-token', request.url));
  }
  
  // Rediriger vers notre page de vérification avec le token
  const verifyPageUrl = new URL('/auth/verify-email', request.url);
  verifyPageUrl.searchParams.set('token', token);
  
  console.log("🔄 Redirection vers:", verifyPageUrl.toString());
  return NextResponse.redirect(verifyPageUrl);
}

// Gérer les requêtes POST (API interne)
export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    console.log("📧 Vérification d'email via API POST");
    console.log("🎫 Token:", token);

    // Utiliser Better Auth pour vérifier l'email avec le token
    console.log("🔧 Tentative de vérification avec Better Auth...");
    
    // Better Auth attend le token comme query parameter
    const result = await auth.api.verifyEmail({
      query: { token }
    });
    
    console.log("📧 Résultat Better Auth:", result);

    if (result.error) {
      console.error("❌ Erreur Better Auth:", result.error);
      return NextResponse.json(
        { error: "Invalid or expired token", details: result.error },
        { status: 400 }
      );
    }

    console.log("✅ Email vérifié avec succès");
    return NextResponse.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (error) {
    console.error("❌ Erreur lors de la vérification de l'email:", error);
    console.error("❌ Stack trace:", error.stack);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
