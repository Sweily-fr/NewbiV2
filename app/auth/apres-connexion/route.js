import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { findAccountManagerByUserId } from "@/src/lib/managed-clients";
import { GESTIONNAIRE_PATH } from "@/src/lib/gestionnaire-paths";

/**
 * Retour d'une connexion Google ou Apple (callbackURL de la page de
 * connexion) : un cabinet arrive sur son espace gestionnaire, comme après
 * une connexion par e-mail (loginForm.jsx) ; les autres sur le tableau de
 * bord, qui vérifie la session et l'abonnement.
 */
export async function GET(request) {
  let target = "/dashboard";
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (
      session?.user &&
      (await findAccountManagerByUserId(mongoDb, session.user.id))
    ) {
      target = GESTIONNAIRE_PATH;
    }
  } catch (error) {
    // Le tableau de bord refait la vérification et gère l'erreur
    console.error("[apres-connexion]", error?.message || error);
  }
  return NextResponse.redirect(new URL(target, request.url));
}
