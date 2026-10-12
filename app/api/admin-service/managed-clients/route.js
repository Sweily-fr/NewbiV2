import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireAdminServiceToken,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";
import {
  createManagedClient,
  ManagedClientError,
} from "@/src/lib/managed-clients";

/**
 * POST /api/admin-service/managed-clients
 *
 * Création d'un client pour un gestionnaire depuis newbi-admin
 * (admin.newbi.fr), de serveur à serveur avec ADMIN_SERVICE_TOKEN.
 * Corps : { managerId, companyName, siret, firstName?, lastName?, email,
 * payer }.
 */
async function handler(request) {
  const { adminEmail } = requireAdminServiceToken(request);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError(400, "Requête invalide");
  }

  try {
    const client = await createManagedClient({
      mongoDb,
      managerId: body.managerId,
      input: body,
      actor: { type: "admin", email: adminEmail },
    });

    await mongoDb
      .collection("backoffice_audit_log")
      .insertOne({
        action: "managed_client_create",
        accountManagerId: String(body.managerId),
        organizationId: client.organizationId,
        targetUserId: client.userId,
        targetEmail: client.email,
        adminEmail,
        after: { payer: client.payer },
        createdAt: new Date(),
      })
      .catch((error) =>
        console.error("[ADMIN-SERVICE] Journal d'audit impossible:", error),
      );

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (error instanceof ManagedClientError) {
      return apiError(error.status, error.message);
    }
    throw error;
  }
}

export const POST = withErrorHandler(handler);
