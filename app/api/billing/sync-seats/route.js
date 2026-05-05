import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { seatSyncService } from "@/src/services/seatSyncService";
import { withErrorHandler } from "@/src/lib/security";

/**
 * API Route pour synchroniser manuellement les sièges
 * Utilisée après suppression de membre ou pour forcer une synchronisation
 */
async function postHandler(request) {
  // Vérifier l'authentification
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { organizationId } = await request.json();

  if (!organizationId) {
    return Response.json({ error: "organizationId requis" }, { status: 400 });
  }

  console.log(
    `🔄 Demande de synchronisation sièges pour organisation ${organizationId}`,
  );
  console.log(`👤 Demandé par: ${session.user.email} (${session.user.id})`);

  // Vérifier que l'utilisateur a les permissions (owner uniquement)
  const { auth: authInstance } = await import("@/src/lib/auth");

  // Vérifier directement dans MongoDB
  const { mongoDb } = await import("@/src/lib/mongodb.js");
  const { ObjectId } = await import("mongodb");

  console.log(
    `🔍 Recherche membre pour userId: ${session.user.id}, organizationId: ${organizationId}`,
  );

  const member = await mongoDb.collection("member").findOne({
    userId: new ObjectId(session.user.id),
    organizationId: new ObjectId(organizationId),
  });

  console.log(
    `📊 Membre trouvé:`,
    member ? { role: member.role, userId: member.userId.toString() } : "Aucun",
  );

  if (!member) {
    console.warn(
      `⚠️ Utilisateur ${session.user.email} n'est pas membre de l'organisation ${organizationId}`,
    );
    return Response.json(
      { error: "Vous n'êtes pas membre de cette organisation" },
      { status: 403 },
    );
  }

  if (member.role !== "owner") {
    console.warn(
      `⚠️ Utilisateur ${session.user.email} n'a pas les permissions (rôle: ${member.role})`,
    );
    return Response.json(
      { error: "Seul le propriétaire peut synchroniser la facturation" },
      { status: 403 },
    );
  }

  console.log(`✅ Permissions vérifiées, début de la synchronisation`);

  // Obtenir l'adapter pour le service
  const adapter = authInstance.options.database;

  // Synchroniser les sièges
  const result = await seatSyncService.syncSeatsAfterMemberRemoved(
    organizationId,
    adapter,
  );

  console.log(`✅ Synchronisation terminée:`, result);

  return Response.json({
    success: true,
    ...result,
    message: `Facturation synchronisée: ${result.seats} siège(s) additionnel(s)`,
  });
}

export const POST = withErrorHandler(postHandler);

/**
 * GET - Récupérer les informations de facturation actuelles
 */
async function getHandler(request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return Response.json({ error: "organizationId requis" }, { status: 400 });
  }

  // Vérifier que l'utilisateur est membre
  const { auth: authInstance } = await import("@/src/lib/auth");
  const { mongoDb } = await import("@/src/lib/mongodb.js");
  const { ObjectId } = await import("mongodb");

  const member = await mongoDb.collection("member").findOne({
    userId: new ObjectId(session.user.id),
    organizationId: new ObjectId(organizationId),
  });

  if (!member) {
    return Response.json(
      { error: "Vous n'êtes pas membre de cette organisation" },
      { status: 403 },
    );
  }

  // Obtenir l'adapter pour le service
  const adapter = authInstance.options.database;

  // Récupérer les informations de facturation
  const billingInfo = await seatSyncService.getBillingInfo(
    organizationId,
    adapter,
  );

  return Response.json(billingInfo);
}

export const GET = withErrorHandler(getHandler);
