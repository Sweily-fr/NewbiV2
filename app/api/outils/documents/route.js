import { NextResponse } from "next/server";
import { z } from "zod";
import { mongoDb } from "@/src/lib/mongodb";
import { apiError, withErrorHandler } from "@/src/lib/security";
import { createIpRateLimiter } from "@/src/lib/security/ip-rate-limit";

/**
 * POST /api/outils/documents
 *
 * Compte un document téléchargé depuis un générateur gratuit (/outils), en
 * total par jour : outil, rang du document pour ce visiteur (plafonné à 10,
 * « 10 ou plus ») et portée de ce rang (navigateur ou visite, voir
 * src/lib/outils-usage.js).
 *
 * Route publique, sans session. Rien d'autre n'est enregistré : ni adresse
 * IP, ni identifiant, ni contenu du document. La saisie du visiteur ne quitte
 * jamais son navigateur, comme le promet la page.
 *
 * Lecture : collection `outil_documents`, un document par
 * { jour, outil, portee, rang } avec le nombre `n`.
 */
const schema = z
  .object({
    outil: z.enum(["facture", "devis"]),
    rang: z.number().int().min(1).max(10),
    portee: z.enum(["navigateur", "visite"]),
  })
  .strict();

// Frein contre le remplissage en masse : en mémoire, par instance ; l'adresse
// IP n'est jamais enregistrée.
const tropDeRequetes = createIpRateLimiter({ windowMs: 60_000, max: 30 });

const JOUR_PARIS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
});

/** Seules les pages du site peuvent compter : origine = hôte demandé. */
function memeOrigine(request) {
  const origine = request.headers.get("origin");
  if (!origine) return false;
  let hoteOrigine;
  try {
    hoteOrigine = new URL(origine).host;
  } catch {
    return false;
  }
  return [
    request.headers.get("host"),
    request.headers.get("x-forwarded-host"),
  ].includes(hoteOrigine);
}

async function handler(request) {
  if (!memeOrigine(request)) return apiError(403, "Origine refusée");
  if (tropDeRequetes(request)) return apiError(429, "Trop de requêtes");

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Body JSON invalide");
  }

  const validation = schema.safeParse(body);
  if (!validation.success) return apiError(400, "Données invalides");

  const { outil, rang, portee } = validation.data;
  await mongoDb
    .collection("outil_documents")
    .updateOne(
      { jour: JOUR_PARIS.format(new Date()), outil, portee, rang },
      { $inc: { n: 1 } },
      { upsert: true },
    );

  return new NextResponse(null, { status: 204 });
}

export const POST = withErrorHandler(handler);
