import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";

/**
 * GET /api/check-siret?siret=xxx
 * Vérifie si un SIRET est déjà utilisé par une organisation existante
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
      return NextResponse.json(
        { error: "SIRET requis" },
        { status: 400 }
      );
    }

    // Nettoyer le SIRET (enlever espaces et caractères spéciaux)
    const cleanSiret = siret.replace(/\s/g, "").trim();

    if (cleanSiret.length !== 14) {
      return NextResponse.json(
        { error: "SIRET invalide (14 chiffres requis)" },
        { status: 400 }
      );
    }

    console.log(`🔍 [CHECK-SIRET] Vérification du SIRET: ${cleanSiret}`);

    // Vérifier si une organisation existe déjà avec ce SIRET
    const existingOrg = await mongoDb.collection("organization").findOne({
      siret: cleanSiret,
    });

    if (existingOrg) {
      console.log(`⚠️ [CHECK-SIRET] SIRET déjà utilisé par l'organisation: ${existingOrg.name}`);

      return NextResponse.json({
        available: false,
        message: "Ce numéro SIRET est déjà associé à un compte existant sur Newbi.",
        organizationName: existingOrg.companyName || existingOrg.name,
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
