import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import { withErrorHandler } from "@/src/lib/security";

/**
 * POST /api/admin/create-test-users
 * Crée des utilisateurs de test avec Better Auth
 */
async function handler(request) {
  const body = await request.json();
  const { organizationId, members, adminKey } = body;

  if (!organizationId || !members || !Array.isArray(members)) {
    return NextResponse.json(
      { error: "organizationId et members sont requis" },
      { status: 400 },
    );
  }

  // Mode développement : Vérifier la clé admin OU la session
  const isDevelopment = process.env.NODE_ENV === "development";
  const validAdminKey = adminKey === "dev-admin-key-2024"; // Clé simple pour le dev

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
        { status: 403 },
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
      { status: 404 },
    );
  }

  const results = [];

  for (const member of members) {
    try {
      console.log(`📝 Création de ${member.email}...`);

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await mongoDb.collection("user").findOne({
        email: member.email,
      });

      let userId;

      if (existingUser) {
        console.log(`⚠️  L'utilisateur ${member.email} existe déjà`);
        userId = existingUser._id;
      } else {
        // Créer l'utilisateur avec Better Auth
        const newUserId = new ObjectId();

        // Insérer directement dans la DB car Better Auth ne permet pas de créer sans mot de passe
        await mongoDb.collection("user").insertOne({
          _id: newUserId,
          email: member.email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: "member",
          isActive: true,
          redirect_after_login: "dashboard",
          name: member.name,
          twoFactorEnabled: false,
          hasSeenOnboarding: true,
        });

        userId = newUserId;
        console.log(`✅ Utilisateur créé: ${member.email}`);
      }

      // Vérifier si le membre existe déjà dans l'organisation
      const existingMember = await mongoDb.collection("member").findOne({
        userId: userId,
        organizationId: new ObjectId(organizationId),
      });

      if (existingMember) {
        console.log(
          `⚠️  ${member.email} est déjà membre de cette organisation`,
        );
        results.push({
          email: member.email,
          status: "already_member",
          message: "Déjà membre de l'organisation",
        });
        continue;
      }

      // Créer le membre (lien user-organization)
      // C'est ce lien dans la collection "member" qui détermine l'appartenance à l'organisation
      await mongoDb.collection("member").insertOne({
        _id: new ObjectId(),
        userId: userId,
        organizationId: new ObjectId(organizationId),
        role: member.role,
        createdAt: new Date(),
        order: 0,
        status: "active",
      });

      console.log(
        `✅ Membre ajouté à ${organization.name}: ${member.email} (${member.role})`,
      );

      results.push({
        email: member.email,
        status: "success",
        role: member.role,
        message: "Membre créé avec succès",
      });
    } catch (error) {
      console.error(`❌ Erreur pour ${member.email}:`, error);
      results.push({
        email: member.email,
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
}

export const POST = withErrorHandler(handler);
