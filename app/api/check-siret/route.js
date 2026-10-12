import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/check-siret?siret=xxx
 * Vérifie si un SIRET est déjà utilisé par une organisation existante
 * Si l'utilisateur est déjà membre de l'organisation, on autorise (reprise d'onboarding)
 */
export async function GET(request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siret = searchParams.get("siret");

    if (!siret) {
      return NextResponse.json({ error: "SIRET requis" }, { status: 400 });
    }

    // Nettoyer le SIRET (enlever espaces et caractères spéciaux)
    const cleanSiret = siret.replace(/\s/g, "").trim();

    if (cleanSiret.length !== 14) {
      return NextResponse.json(
        { error: "SIRET invalide (14 chiffres requis)" },
        { status: 400 },
      );
    }

    console.log(`🔍 [CHECK-SIRET] Vérification du SIRET: ${cleanSiret}`);

    // Vérifier si une organisation existe déjà avec ce SIRET
    const existingOrg = await mongoDb.collection("organization").findOne({
      siret: cleanSiret,
    });

    if (existingOrg) {
      console.log(
        `⚠️ [CHECK-SIRET] SIRET déjà utilisé par l'organisation: ${existingOrg.name}`,
      );

      // Vérifier si l'utilisateur actuel est déjà membre de cette organisation
      // (cas d'un onboarding interrompu : l'org a été créée par le webhook mais l'abonnement a échoué)
      const userId = session.user.id;
      const orgId = existingOrg._id;

      let isMember = false;
      try {
        const userObjectId = new ObjectId(userId);
        isMember = await mongoDb.collection("member").findOne({
          $or: [
            { userId: userObjectId, organizationId: orgId },
            { userId: userObjectId, organizationId: orgId.toString() },
            { userId: userId, organizationId: orgId },
            { userId: userId, organizationId: orgId.toString() },
          ],
        });
      } catch (e) {
        console.warn(`⚠️ [CHECK-SIRET] Erreur recherche membre:`, e.message);
      }

      if (isMember) {
        // L'utilisateur est déjà membre de cette org → autoriser la reprise d'onboarding
        console.log(
          `✅ [CHECK-SIRET] L'utilisateur ${userId} est déjà membre de l'org ${orgId}, reprise autorisée`,
        );
        return NextResponse.json({
          available: true,
          message: "SIRET disponible (reprise d'onboarding)",
          existingOrganizationId: orgId.toString(),
        });
      }

      // Pas de nom d'espace dans la réponse : l'écran n'en a pas besoin et
      // il révélait l'espace Newbi rattaché à n'importe quel SIRET.
      return NextResponse.json({
        available: false,
        message:
          "Ce numéro SIRET est déjà associé à un compte existant sur Newbi.",
      });
    }

    console.log(`✅ [CHECK-SIRET] SIRET disponible: ${cleanSiret}`);

    return NextResponse.json({
      available: true,
      message: "SIRET disponible",
    });
  } catch (error) {
    console.error("❌ [CHECK-SIRET] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
