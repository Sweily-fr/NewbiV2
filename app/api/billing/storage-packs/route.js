import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mongoDb } from "@/src/lib/mongodb";
import {
  apiError,
  requireOrgAction,
  requireSession,
  withErrorHandler,
} from "@/src/lib/security";
import {
  setStoragePacks,
  StoragePackError,
  storagePackPriceIds,
} from "@/src/lib/storage-packs";
import { STORAGE_PACK_GB, STORAGE_PACK_PRICES } from "@/src/lib/storage-plans";

const OBJECT_ID = /^[a-f\d]{24}$/i;

function readOrganizationId(value) {
  return typeof value === "string" && OBJECT_ID.test(value) ? value : null;
}

/**
 * GET /api/billing/storage-packs?organizationId=…
 * Packs de stockage proposables (prix Stripe configurés) et prix affichés.
 * Droit « Voir l'abonnement ».
 */
async function getHandler(request) {
  const { user } = await requireSession(request);
  const organizationId = readOrganizationId(
    new URL(request.url).searchParams.get("organizationId"),
  );
  if (!organizationId) return apiError(400, "Identifiant d'espace invalide");
  await requireOrgAction(user.id, organizationId, "billing", "view");

  const ids = storagePackPriceIds();
  return NextResponse.json({
    available: { month: Boolean(ids.month), year: Boolean(ids.year) },
    packGb: STORAGE_PACK_GB,
    prices: STORAGE_PACK_PRICES,
  });
}

/**
 * POST /api/billing/storage-packs
 * Body : { organizationId, quantity } — nombre TOTAL de packs voulu.
 * Ajoute, modifie ou retire l'article « pack de stockage » de l'abonnement
 * Stripe de l'espace (prorata immédiat). Droit « Gérer l'abonnement ».
 */
async function postHandler(request) {
  const { user } = await requireSession(request);
  let body = {};
  try {
    body = (await request.json()) || {};
  } catch {
    body = {};
  }
  const organizationId = readOrganizationId(body.organizationId);
  if (!organizationId) return apiError(400, "Identifiant d'espace invalide");
  await requireOrgAction(user.id, organizationId, "billing", "manage");

  // Abonnement payé par un cabinet : géré par le cabinet
  const { isOrgPaidByManager } = await import("@/src/lib/manager-billing");
  if (await isOrgPaidByManager(mongoDb, organizationId)) {
    return apiError(
      409,
      "L'abonnement de cet espace est réglé par votre cabinet : il gère aussi le stockage.",
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
  try {
    const result = await setStoragePacks({
      mongoDb,
      stripe,
      organizationId,
      quantity: body.quantity,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof StoragePackError) {
      return apiError(error.status, error.message);
    }
    return apiError(
      502,
      "Le stockage n'a pas pu être modifié. Réessayez dans un instant.",
      error?.message,
    );
  }
}

export const GET = withErrorHandler(getHandler);
export const POST = withErrorHandler(postHandler);
