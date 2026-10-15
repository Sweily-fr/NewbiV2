import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireAdminServiceToken,
  apiError,
  withErrorHandler,
} from "@/src/lib/security";
import { ManagedClientError } from "@/src/lib/managed-clients";
import { changePayerByAdmin } from "@/src/lib/payer-switch";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/admin-service/managed-clients/:id/payer
 *
 * Changement de payeur d'un client de gestionnaire depuis newbi-admin
 * (admin.newbi.fr), de serveur à serveur avec ADMIN_SERVICE_TOKEN.
 * Corps : { payer: "client" | "manager" }. Vers le cabinet, seulement si
 * le client ne paie rien en ce moment (le cabinet paie ensuite l'offre
 * depuis son espace).
 */
async function handler(request, { params }) {
  const { adminEmail } = requireAdminServiceToken(request);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError(400, "Requête invalide");
  }
  const { id } = await params;

  try {
    const result = await changePayerByAdmin({
      mongoDb,
      stripe,
      linkId: id,
      payer: body.payer,
      adminEmail,
      baseUrl: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    });

    await mongoDb
      .collection("backoffice_audit_log")
      .insertOne({
        action: "managed_client_payer_change",
        managedClientId: String(id),
        adminEmail,
        after: { payer: body.payer, mode: result.mode },
        createdAt: new Date(),
      })
      .catch((error) =>
        console.error("[ADMIN-SERVICE] Journal d'audit impossible:", error),
      );

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof ManagedClientError) {
      return apiError(error.status, error.message);
    }
    throw error;
  }
}

export const POST = withErrorHandler(handler);
