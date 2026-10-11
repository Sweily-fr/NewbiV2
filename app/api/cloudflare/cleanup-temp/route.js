import { NextResponse } from "next/server";
import { apiError, requireSession, withErrorHandler } from "@/src/lib/security";

/**
 * POST /api/cloudflare/cleanup-temp
 *
 * Supprime les images temporaires de signature de mail de l'utilisateur de
 * la session (dossiers `temp-*`). Le `userId` du body n'est plus qu'un
 * contrôle de cohérence : un autre utilisateur que celui de la session est
 * refusé, et c'est toujours l'id de la session qui part à l'API.
 *
 * Body : { userId?, newSignatureId? }
 */
async function handler(request) {
  const { user, session, cookieHeader } = await requireSession(request);

  let body = {};
  try {
    body = (await request.json()) || {};
  } catch {
    body = {};
  }
  const { userId, newSignatureId } = body;

  if (userId && String(userId) !== String(user.id)) {
    return apiError(
      403,
      "Vous ne pouvez nettoyer que vos propres fichiers",
      `cleanup-temp : ${user.id} a demandé les fichiers de ${userId}`,
    );
  }

  const graphqlEndpoint =
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";

  const mutation = `
      mutation CleanupTemporaryFiles($userId: String!, $newSignatureId: String) {
        cleanupTemporaryFiles(userId: $userId, newSignatureId: $newSignatureId) {
          success
          deletedCount
          message
        }
      }
    `;

  // L'API authentifie par le cookie de session (l'ancien en-tête
  // « Bearer » portait un jeton indéfini) et revérifie le droit d'écriture
  // sur les signatures de l'espace actif ainsi que l'identité.
  const organizationId =
    request.headers.get("x-organization-id") ||
    session?.activeOrganizationId ||
    "";
  const graphqlResponse = await fetch(graphqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      ...(organizationId ? { "x-organization-id": organizationId } : {}),
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        userId: String(user.id),
        newSignatureId: newSignatureId || null,
      },
    }),
  });

  if (!graphqlResponse.ok) {
    const errorText = await graphqlResponse.text();
    throw new Error(
      `Erreur GraphQL cleanup: ${graphqlResponse.status} - ${errorText}`,
    );
  }

  const graphqlResult = await graphqlResponse.json();

  if (graphqlResult.errors) {
    throw new Error(
      graphqlResult.errors[0]?.message || "Erreur GraphQL cleanup",
    );
  }

  const cleanupResult = graphqlResult.data?.cleanupTemporaryFiles;

  if (!cleanupResult) {
    throw new Error("Aucun résultat de nettoyage retourné par GraphQL");
  }

  return NextResponse.json({
    success: true,
    deletedCount: cleanupResult.deletedCount,
    message: cleanupResult.message,
  });
}

export const POST = withErrorHandler(handler);
