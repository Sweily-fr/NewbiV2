import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import CustomSocialIconService from "@/src/services/customSocialIconService.js";
import { withErrorHandler } from "@/src/lib/security";

async function handler(request) {
  // Vérifier l'authentification
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Non authentifié" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const { userId, signatureId } = body;

  // Validation des données
  if (!userId || !signatureId) {
    return NextResponse.json(
      { success: false, message: "userId et signatureId sont requis" },
      { status: 400 },
    );
  }

  // Vérifier que l'utilisateur peut modifier cette signature
  if (session.user.id !== userId) {
    return NextResponse.json(
      { success: false, message: "Non autorisé à modifier cette signature" },
      { status: 403 },
    );
  }

  console.log(
    `🗑️ Suppression icônes personnalisées pour user ${userId}, signature ${signatureId}`,
  );

  // Supprimer toutes les icônes personnalisées
  await CustomSocialIconService.deleteCustomIcons(userId, signatureId);

  return NextResponse.json({
    success: true,
    message: "Icônes personnalisées supprimées avec succès",
  });
}

export const DELETE = withErrorHandler(handler);
