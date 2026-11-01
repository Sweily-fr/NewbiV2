import { NextResponse } from "next/server";

// Identifiant de signature : sert de dossier dans le stockage des icônes
// (custom-icons/<utilisateur>/<signature>/) ; ni « / » ni « .. ».
const SIGNATURE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
// Couleurs des icônes : hexadécimal seulement (insérées dans le SVG)
const COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const PLATFORMS = new Set(["facebook", "instagram", "linkedin", "x"]);

const refus = (message) =>
  NextResponse.json({ success: false, message }, { status: 400 });

/**
 * Lit et contrôle le corps des routes d'icônes de signature. Renvoie
 * { body } ou { error: NextResponse }.
 */
export async function readSignatureIconsBody(
  request,
  { withColors = false } = {},
) {
  let body;
  try {
    body = await request.json();
  } catch {
    return { error: refus("Requête invalide") };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: refus("Requête invalide") };
  }
  const { userId, signatureId } = body;
  if (!userId || !signatureId) {
    return { error: refus("userId et signatureId sont requis") };
  }
  if (typeof userId !== "string" || typeof signatureId !== "string") {
    return { error: refus("Paramètres invalides") };
  }
  if (!SIGNATURE_ID_RE.test(signatureId)) {
    return { error: refus("Identifiant de signature invalide") };
  }
  if (withColors && body.socialColors != null) {
    if (
      typeof body.socialColors !== "object" ||
      Array.isArray(body.socialColors)
    ) {
      return { error: refus("Couleurs invalides") };
    }
    for (const [platform, color] of Object.entries(body.socialColors)) {
      if (!PLATFORMS.has(platform)) continue;
      if (color != null && color !== "" && !COLOR_RE.test(String(color))) {
        return { error: refus(`Couleur invalide pour ${platform}`) };
      }
    }
  }
  return { body };
}
