import { NextResponse } from "next/server";
import { apiError, requireSession, withErrorHandler } from "@/src/lib/security";

/**
 * POST /api/upload-image
 *
 * Upload d'un logo de réseau social (signatures de mail) via la mutation
 * GraphQL `uploadSocialLogo` de l'API.
 *
 * Auparavant sans authentification, sans limite de taille ni liste de types,
 * et envoyée en dur vers http://localhost:4000. Désormais :
 *   - session obligatoire ; l'API reçoit le cookie de session et l'espace
 *     actif, elle authentifie l'utilisateur, revérifie le droit d'écriture
 *     sur les signatures et range le fichier sous l'utilisateur (le chemin
 *     ne vient jamais de la requête) ;
 *   - 5 Mo maximum (même limite que l'API) ;
 *   - PNG, JPEG, GIF ou WebP seulement (pas de SVG, qui peut porter du
 *     script) ; le nom envoyé à l'API est reconstruit à partir du type ;
 *   - type de logo et couleur validés comme côté API.
 */
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};
const LOGO_TYPES = ["facebook", "linkedin", "twitter", "instagram"];
const HEX_COLOR = /^#[0-9A-F]{6}$/i;

async function handler(request) {
  const { session, cookieHeader } = await requireSession(request);

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return apiError(400, "Formulaire invalide");
  }
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return apiError(400, "Aucun fichier fourni");
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return apiError(
      400,
      "Format d'image non supporté (PNG, JPEG, GIF ou WebP)",
    );
  }

  if (!file.size || file.size > MAX_SIZE) {
    return apiError(400, "L'image est trop volumineuse (5 Mo maximum)");
  }

  const logoType = String(formData.get("logoType") || "facebook");
  const color = String(formData.get("color") || "#1877F2");
  if (!LOGO_TYPES.includes(logoType)) {
    return apiError(400, "Type de logo invalide");
  }
  if (!HEX_COLOR.test(color)) {
    return apiError(400, "Couleur invalide (format #RRGGBB)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Taille réelle lue, au cas où `file.size` ne refléterait pas le contenu
  if (buffer.length > MAX_SIZE) {
    return apiError(400, "L'image est trop volumineuse (5 Mo maximum)");
  }

  const uploadFormData = new FormData();
  uploadFormData.append(
    "operations",
    JSON.stringify({
      query: `
          mutation UploadSocialLogo($file: Upload!, $logoType: String!, $color: String!) {
            uploadSocialLogo(file: $file, logoType: $logoType, color: $color) {
              success
              url
              key
              contentType
              message
            }
          }
        `,
      variables: { file: null, logoType, color },
    }),
  );
  uploadFormData.append("map", JSON.stringify({ 0: ["variables.file"] }));
  uploadFormData.append(
    "0",
    new Blob([buffer], { type: file.type }),
    `${logoType}.${extension}`,
  );

  const graphqlEndpoint =
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";
  const organizationId = session?.activeOrganizationId || "";

  try {
    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
        // Requis par graphql-upload (protection CSRF de l'API)
        "apollo-require-preflight": "true",
        ...(organizationId ? { "x-organization-id": organizationId } : {}),
      },
      body: uploadFormData,
    });

    const result = await response.json();
    const data = result?.data?.uploadSocialLogo;

    if (!response.ok || !data?.success) {
      throw new Error(
        result?.errors?.[0]?.message ||
          data?.message ||
          "Erreur lors de l'upload",
      );
    }

    return NextResponse.json({
      success: true,
      url: data.url,
      key: data.key,
      filename: `${logoType}.${extension}`,
      size: buffer.length,
      type: file.type,
      contentType: data.contentType,
    });
  } catch (uploadError) {
    return apiError(500, "Erreur lors de l'upload sur Cloudflare", uploadError);
  }
}

export const POST = withErrorHandler(handler);
