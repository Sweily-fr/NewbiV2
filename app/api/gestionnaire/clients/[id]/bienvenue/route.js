import { NextResponse } from "next/server";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError, withErrorHandler } from "@/src/lib/security";
import { requireAccountManager } from "@/src/lib/gestionnaire-auth";
import {
  ManagedClientError,
  resendWelcomeEmail,
} from "@/src/lib/managed-clients";

/**
 * POST /api/gestionnaire/clients/:id/bienvenue : renvoie l'e-mail pour
 * choisir son mot de passe à un client créé par le cabinet qui ne l'a pas
 * encore fait (:id = fiche managedclients).
 */
async function handler(request, { params }) {
  const { manager } = await requireAccountManager(request);
  const { id } = await params;
  try {
    const result = await resendWelcomeEmail({
      mongoDb,
      manager,
      linkId: id,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ManagedClientError) {
      return apiError(error.status, error.message);
    }
    throw error;
  }
}

export const POST = withErrorHandler(handler);
