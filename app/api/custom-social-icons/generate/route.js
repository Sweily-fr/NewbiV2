import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import CustomSocialIconService from "@/src/services/customSocialIconService.js";
import { withErrorHandler } from "@/src/lib/security";
import { readSignatureIconsBody } from "@/src/lib/signature-icons-input";

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

  const { body, error } = await readSignatureIconsBody(request, {
    withColors: true,
  });
  if (error) return error;
  const { userId, signatureId, socialNetworks, socialColors } = body;

  // Vérifier que l'utilisateur peut modifier cette signature
  if (session.user.id !== userId) {
    return NextResponse.json(
      { success: false, message: "Non autorisé à modifier cette signature" },
      { status: 403 },
    );
  }

  console.log(
    `🎨 Génération icônes personnalisées pour user ${userId}, signature ${signatureId}`,
  );

  // Générer toutes les icônes personnalisées
  const customIcons = await CustomSocialIconService.generateAllCustomIcons(
    userId,
    signatureId,
    socialColors || {},
    socialNetworks || {},
  );

  return NextResponse.json({
    success: true,
    message: "Icônes personnalisées générées avec succès",
    customIcons,
  });
}

export const POST = withErrorHandler(handler);
