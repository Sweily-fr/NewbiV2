import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * POST /api/admin/delete-test-users
 * Supprime des utilisateurs de test d'une organisation
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { organizationId, emails, adminKey } = body;

    if (!organizationId || !emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: "organizationId et emails sont requis" },
        { status: 400 }
      );
    }

    // Mode développement : Vérifier la clé admin OU la session
    const isDevelopment = process.env.NODE_ENV === "development";
    const validAdminKey = adminKey === "dev-admin-key-2024";

    if (!isDevelopment && !validAdminKey) {
      // En production, vérifier l'authentification
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      // Vérifier que l'utilisateur est owner de cette organisation
      const memberRecord = await mongoDb.collection("member").findOne({
        userId: new ObjectId(session.user.id),
        organizationId: new ObjectId(organizationId),
        role: "owner",
      });

      if (!memberRecord) {
        return NextResponse.json(
          { error: "Vous devez être owner de cette organisation" },
          { status: 403 }
        );
      }
    }

    // Récupérer l'organisation
    const organization = await mongoDb.collection("organization").findOne({
      _id: new ObjectId(organizationId),
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const results = [];

    for (const email of emails) {
      try {
        console.log(`🗑️  Suppression de ${email}...`);

        // Trouver l'utilisateur
        const user = await mongoDb.collection("user").findOne({ email });

        if (!user) {
          console.log(`⚠️  Utilisateur ${email} non trouvé`);
          results.push({
            email,
            status: "not_found",
            message: "Utilisateur non trouvé",
          });
          continue;
        }

        // Supprimer le lien membre-organisation
        const deleteMemberResult = await mongoDb
          .collection("member")
          .deleteOne({
            userId: user._id,
            organizationId: new ObjectId(organizationId),
          });

        if (deleteMemberResult.deletedCount === 0) {
          console.log(`⚠️  ${email} n'est pas membre de cette organisation`);
          results.push({
            email,
            status: "not_member",
            message: "N'est pas membre de cette organisation",
          });
          continue;
        }

        // Supprimer l'utilisateur complètement
        await mongoDb.collection("user").deleteOne({ _id: user._id });

        console.log(`✅ ${email} supprimé avec succès`);

        results.push({
          email,
          status: "success",
          message: "Membre et utilisateur supprimés avec succès",
        });
      } catch (error) {
        console.error(`❌ Erreur pour ${email}:`, error);
        results.push({
          email,
          status: "error",
          message: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      organization: {
        id: organizationId,
        name: organization.name,
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression des utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
