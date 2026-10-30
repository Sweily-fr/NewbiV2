import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError, withErrorHandler } from "@/src/lib/security";
import {
  assertAccountManagerActive,
  requireAccountManager,
} from "@/src/lib/gestionnaire-auth";
import { ManagedClientError } from "@/src/lib/managed-clients";
import {
  getPayerSwitchPreview,
  handBackSubscription,
  takeOverSubscription,
} from "@/src/lib/payer-switch";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const fail = (error) => {
  if (error instanceof ManagedClientError) {
    return apiError(error.status, error.message);
  }
  throw error;
};

/**
 * GET /api/gestionnaire/clients/:id/payeur
 *
 * Ce que le cabinet voit avant de changer le payeur d'un client (:id =
 * fiche managedclients) : abonnement en cours, ce qui se passera et quand,
 * remboursement éventuel du client.
 */
async function getHandler(request, { params }) {
  // Un cabinet suspendu peut encore arrêter de payer
  const { manager } = await requireAccountManager(request, {
    allowSuspended: true,
  });
  const { id } = await params;
  try {
    const preview = await getPayerSwitchPreview({
      mongoDb,
      stripe,
      manager,
      linkId: id,
    });
    return NextResponse.json({ preview });
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /api/gestionnaire/clients/:id/payeur
 *
 * Corps : { payer: "manager", plan, isAnnual, timing? } pour prendre en
 * charge l'abonnement du client (timing « now » ou « renewal » quand il a
 * une période payée en cours), ou { payer: "client" } pour ne plus le payer.
 * → reprise : { status: "active", mode, effectiveAt, refund } ou
 *   { status: "redirect", url } (Stripe Checkout, validation bancaire) ;
 *   retour au client : { status: "done", mode, effectiveAt, … }.
 */
async function postHandler(request, { params }) {
  // La session d'abord : sans elle, 401 quel que soit le corps envoyé
  const { user, manager } = await requireAccountManager(request, {
    allowSuspended: true,
  });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError(400, "Requête invalide");
  }
  if (!["manager", "client"].includes(body.payer)) {
    return apiError(400, "Payeur inconnu");
  }
  // Prendre en charge engage le cabinet : pas s'il est suspendu ; arrêter
  // de payer reste possible
  if (body.payer === "manager") assertAccountManagerActive(manager);
  const { id } = await params;
  const actor = { type: "manager", userId: user.id, email: user.email };
  const baseUrl =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://localhost:3000";

  try {
    const result =
      body.payer === "manager"
        ? await takeOverSubscription({
            mongoDb,
            stripe,
            manager,
            linkId: id,
            plan: body.plan,
            isAnnual: body.isAnnual === true,
            timing: body.timing,
            baseUrl,
            actor,
          })
        : await handBackSubscription({
            mongoDb,
            stripe,
            manager,
            linkId: id,
            actor,
            baseUrl,
          });
    return NextResponse.json(result);
  } catch (error) {
    return fail(error);
  }
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
