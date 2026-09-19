import { NextResponse } from "next/server";
import { z } from "zod";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireSession,
  apiError,
  withErrorHandler,
  toObjectId,
} from "@/src/lib/security";

/**
 * POST /api/attribution
 *
 * Enregistre l'attribution marketing (Google Ads gclid / UTM / page d'arrivée)
 * sur l'utilisateur connecté, dans `user.acquisition`. Écriture unique : si le
 * champ existe déjà, la requête est ignorée (first write wins), pour que
 * l'attribution reste celle de l'inscription et ne soit pas réécrite par une
 * visite ultérieure.
 *
 * Sert de base à l'import de conversions hors ligne Google Ads
 * (gclid + date de passage en payant) et au reporting ROI par campagne.
 */
const str = z.string().trim().min(1).max(200);

const attributionSchema = z
  .object({
    utm_source: str.optional(),
    utm_medium: str.optional(),
    utm_campaign: str.optional(),
    utm_term: str.optional(),
    utm_content: str.optional(),
    gclid: str.optional(),
    gbraid: str.optional(),
    wbraid: str.optional(),
    hadClickId: z.boolean().optional(),
    landingPage: z.string().trim().max(500).optional(),
    referrer: z.string().trim().max(500).optional(),
    capturedAt: z.number().int().positive().optional(),
  })
  .strict();

async function handler(request) {
  const { user: sessionUser } = await requireSession(request);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Body JSON invalide");
  }

  const validation = attributionSchema.safeParse(body);
  if (!validation.success) {
    const flat = validation.error.flatten();
    return apiError(400, "Données invalides", flat, flat);
  }
  const data = validation.data;

  const hasContent = Object.keys(data).some(
    (k) => !["hadClickId", "landingPage", "referrer", "capturedAt"].includes(k),
  );
  if (!hasContent && !data.hadClickId) {
    return apiError(400, "Aucune donnée d'attribution");
  }

  const acquisition = {
    ...data,
    capturedAt: data.capturedAt ? new Date(data.capturedAt) : undefined,
    recordedAt: new Date(),
  };

  // $exists:false dans le filtre = pas d'écrasement, sans lecture préalable.
  const result = await mongoDb
    .collection("user")
    .updateOne(
      { _id: toObjectId(sessionUser.id), acquisition: { $exists: false } },
      { $set: { acquisition } },
    );

  const recorded = result.modifiedCount === 1;
  if (recorded) {
    console.log(
      `✅ [ATTRIBUTION] ${sessionUser.email}: ${data.utm_source || "?"} / ${data.utm_campaign || "?"}${data.gclid ? " (gclid)" : ""}`,
    );
  }

  return NextResponse.json({ recorded });
}

export const POST = withErrorHandler(handler);
