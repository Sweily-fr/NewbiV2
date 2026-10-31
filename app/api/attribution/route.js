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
 * Enregistre la provenance de l'inscription (Google Ads gclid / UTM, site
 * d'origine, page d'arrivée, dernière page vue avant l'inscription) sur
 * l'utilisateur connecté, dans `user.acquisition`. Écriture unique : si le
 * champ existe déjà, la requête est ignorée (first write wins), pour que
 * l'attribution reste celle de l'inscription et ne soit pas réécrite par une
 * visite ultérieure.
 *
 * Sert de base à l'import de conversions hors ligne Google Ads
 * (gclid + date de passage en payant), au reporting ROI par campagne et à la
 * lecture du rendement du référencement naturel page par page.
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
    lastPage: z.string().trim().max(500).optional(),
    capturedAt: z.number().int().positive().optional(),
    lastPageAt: z.number().int().positive().optional(),
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

  // Une visite sans campagne (Google naturel, accès direct…) n'a qu'une page
  // d'arrivée, un site d'origine ou une dernière page : c'est une donnée.
  const hasContent = Object.keys(data).some(
    (k) => !["hadClickId", "capturedAt", "lastPageAt"].includes(k),
  );
  if (!hasContent && !data.hadClickId) {
    return apiError(400, "Aucune donnée d'attribution");
  }

  const acquisition = {
    ...data,
    capturedAt: data.capturedAt ? new Date(data.capturedAt) : undefined,
    lastPageAt: data.lastPageAt ? new Date(data.lastPageAt) : undefined,
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
      `✅ [ATTRIBUTION] ${sessionUser.email}: ${data.utm_source || data.referrer || "direct"} / ${data.utm_campaign || data.lastPage || "?"}${data.gclid ? " (gclid)" : ""}`,
    );
  }

  return NextResponse.json({ recorded });
}

export const POST = withErrorHandler(handler);
