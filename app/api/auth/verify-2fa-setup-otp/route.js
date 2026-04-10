import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { setupOtpStore } from "@/src/lib/setup-otp-store";

export async function POST(request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }

    // Vérifier le code OTP custom (store persistant en MongoDB)
    const isValid = await setupOtpStore.verify(session.user.id, code);

    if (!isValid) {
      return NextResponse.json(
        { error: "Code incorrect ou expiré" },
        { status: 400 },
      );
    }

    // ✅ Activer réellement la 2FA côté Better Auth
    // Better Auth stocke `twoFactorEnabled` sur la collection `user`.
    // Le secret TOTP + backup codes ont déjà été créés par `twoFactor.enable()`
    // côté client, il ne reste plus qu'à flipper le flag.
    await mongoDb
      .collection("user")
      .updateOne(
        { _id: new ObjectId(session.user.id) },
        { $set: { twoFactorEnabled: true } },
      );

    // Construire la réponse et invalider le cookie cache de session Better Auth
    // (`better-auth.session_data` ou `__Secure-better-auth.session_data` en HTTPS).
    // Sans ça, le client continue de lire l'ancien `twoFactorEnabled=false`
    // pendant 5 minutes à cause du `cookieCache` activé dans auth.js.
    //
    // ⚠️ Les attributs DOIVENT matcher ceux posés par Better Auth
    // (voir node_modules/better-auth/dist/cookies/index.mjs:createCookieGetter),
    // sinon le Set-Cookie est ignoré — en particulier, le cookie `__Secure-*`
    // est rejeté par le navigateur s'il ne porte pas le flag Secure.
    const response = NextResponse.json({ status: true, verified: true });

    // Cookie dev (HTTP / localhost)
    response.cookies.set({
      name: "better-auth.session_data",
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
    });

    // Cookie prod (HTTPS) — le préfixe __Secure- exige secure: true
    response.cookies.set({
      name: "__Secure-better-auth.session_data",
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });

    return response;
  } catch (error) {
    console.error("[2FA Verify Setup OTP] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la vérification" },
      { status: 500 },
    );
  }
}
