import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";

// ✅ Route personnalisée pour intercepter la vérification Better Auth
// et rediriger vers notre page avec confettis

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const callbackURL = searchParams.get("callbackURL");

  console.log("🔍 [VERIFY EMAIL ROUTE] Token reçu:", token ? "✅" : "❌");

  if (!token) {
    console.error("❌ [VERIFY EMAIL ROUTE] Token manquant");
    return NextResponse.redirect(
      new URL("/auth/verify-email?error=missing-token", request.url)
    );
  }

  try {
    // ✅ Appeler Better Auth pour vérifier l'email
    // Cela va :
    // 1. Vérifier le token
    // 2. Mettre à jour user.emailVerified = true
    // 3. Créer une session si autoSignInAfterVerification: true
    // 4. Définir les cookies
    console.log("🔄 [VERIFY EMAIL ROUTE] Appel Better Auth verifyEmail...");
    
    const result = await auth.api.verifyEmail({
      query: { token },
      asResponse: true, // ✅ Important pour récupérer la réponse complète
    });

    console.log("📊 [VERIFY EMAIL ROUTE] Résultat:", result.status);

    if (result.status === 200) {
      console.log("✅ [VERIFY EMAIL ROUTE] Vérification réussie");
      
      // ✅ Créer la réponse de redirection vers notre page
      const verifyPageUrl = new URL("/auth/verify-email", request.url);
      verifyPageUrl.searchParams.set("token", token);
      verifyPageUrl.searchParams.set("verified", "true");
      
      const response = NextResponse.redirect(verifyPageUrl);
      
      // ✅ IMPORTANT : Copier les cookies de session de Better Auth
      const cookies = result.headers.getSetCookie();
      if (cookies && cookies.length > 0) {
        console.log(`✅ [VERIFY EMAIL ROUTE] Copie de ${cookies.length} cookie(s)`);
        cookies.forEach((cookie) => {
          response.headers.append("Set-Cookie", cookie);
        });
      } else {
        console.warn("⚠️ [VERIFY EMAIL ROUTE] Aucun cookie à copier");
      }
      
      return response;
    } else {
      console.error("❌ [VERIFY EMAIL ROUTE] Échec vérification:", result.status);
      return NextResponse.redirect(
        new URL("/auth/verify-email?error=invalid-token", request.url)
      );
    }
  } catch (error) {
    console.error("❌ [VERIFY EMAIL ROUTE] Erreur:", error);
    return NextResponse.redirect(
      new URL("/auth/verify-email?error=server-error", request.url)
    );
  }
}
