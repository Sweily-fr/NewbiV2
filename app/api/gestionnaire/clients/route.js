import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError, withErrorHandler } from "@/src/lib/security";
import { requireAccountManager as requireManager } from "@/src/lib/gestionnaire-auth";
import {
  createManagedClient,
  listManagedClients,
  ManagedClientError,
} from "@/src/lib/managed-clients";

/**
 * Espace gestionnaire : clients du cabinet connecté.
 * Réservé aux utilisateurs qui ont un compte gestionnaire actif.
 *
 * GET  /api/gestionnaire/clients → { manager, clients }
 * POST /api/gestionnaire/clients → crée un client (voir managed-clients.js)
 */
async function getHandler(request) {
  const { manager } = await requireManager(request);
  const clients = await listManagedClients(mongoDb, manager._id);
  return NextResponse.json({
    manager: {
      id: String(manager._id),
      name: manager.name,
      discountPercent: manager.discountPercent ?? 0,
    },
    clients,
  });
}

async function postHandler(request) {
  const { user, manager } = await requireManager(request);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError(400, "Requête invalide");
  }

  try {
    const client = await createManagedClient({
      mongoDb,
      managerId: manager._id,
      input: body,
      actor: { type: "manager", email: user.email },
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (error instanceof ManagedClientError) {
      return apiError(error.status, error.message);
    }
    throw error;
  }
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
