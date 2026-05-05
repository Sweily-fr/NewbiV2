import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
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

  const { signatureId, signatureData } = await request.json();

  if (!signatureId || !signatureData) {
    return NextResponse.json(
      { success: false, message: "Paramètres manquants" },
      { status: 400 },
    );
  }

  console.log("💾 Sauvegarde automatique signature:", signatureId);
  console.log(
    "👤 Session utilisateur:",
    JSON.stringify(
      {
        userId: session.user.id,
        activeOrganization: session.user.activeOrganization,
        organizationId: session.user.organizationId,
      },
      null,
      2,
    ),
  );
  console.log("📋 Données reçues:", JSON.stringify(signatureData, null, 2));

  // Gérer la suppression des fichiers temporaires sur Cloudflare
  const userId = session.user.id;
  const isTemporaryId = signatureId.startsWith("temp-");

  if (isTemporaryId) {
    console.log(
      "🗑️ Suppression des anciens fichiers temporaires pour l'utilisateur:",
      userId,
    );

    try {
      // Appeler l'API de nettoyage des fichiers temporaires
      const cleanupResponse = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/cloudflare/cleanup-temp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            userId: userId,
            newSignatureId: signatureId,
          }),
        },
      );

      if (cleanupResponse.ok) {
        const cleanupResult = await cleanupResponse.json();
        console.log(
          "✅ Nettoyage des fichiers temporaires réussi:",
          cleanupResult,
        );
      } else {
        console.warn(
          "⚠️ Échec du nettoyage des fichiers temporaires:",
          cleanupResponse.status,
        );
      }
    } catch (cleanupError) {
      console.warn(
        "⚠️ Erreur lors du nettoyage des fichiers temporaires:",
        cleanupError.message,
      );
      // Ne pas faire échouer la sauvegarde si le nettoyage échoue
    }
  }

  // Préparer les données pour GraphQL
  const signatureInput = {
    signatureName: signatureData.signatureName || "Signature automatique",
    workspaceId:
      session.user.activeOrganization?.id ||
      session.user.organizationId ||
      "default-workspace",
    firstName: signatureData.firstName || "",
    lastName: signatureData.lastName || "",
    position: signatureData.position || "",
    companyName: signatureData.company || signatureData.companyName || "",
    email: signatureData.email || "",
    phone: signatureData.phone || "",
    mobile: signatureData.mobile || "",
    website: signatureData.website || "",
    address: signatureData.address || "",
    photo: signatureData.photo || "",
    photoKey: signatureData.photoKey || "",
    logo: signatureData.logo || "",
    logoKey: signatureData.logoKey || "",
    layout: signatureData.orientation || signatureData.layout || "horizontal",
    orientation:
      signatureData.orientation || signatureData.layout || "horizontal",
    socialNetworks: {
      facebook: signatureData.socialNetworks?.facebook || "",
      instagram: signatureData.socialNetworks?.instagram || "",
      linkedin: signatureData.socialNetworks?.linkedin || "",
      x: signatureData.socialNetworks?.x || "",
    },
    socialColors: {
      facebook: signatureData.socialColors?.facebook || "#1877F2",
      instagram: signatureData.socialColors?.instagram || "#E4405F",
      linkedin: signatureData.socialColors?.linkedin || "#0077B5",
      x: signatureData.socialColors?.x || "#000000",
    },
    customSocialIcons: {
      facebook: signatureData.customSocialIcons?.facebook || "",
      instagram: signatureData.customSocialIcons?.instagram || "",
      linkedin: signatureData.customSocialIcons?.linkedin || "",
      x: signatureData.customSocialIcons?.x || "",
    },
    spacings: {
      global: signatureData.spacings?.global ?? 8,
      photoBottom: signatureData.spacings?.photoBottom ?? 12,
      logoBottom: signatureData.spacings?.logoBottom ?? 12,
      nameBottom: signatureData.spacings?.nameBottom ?? 8,
      positionBottom: signatureData.spacings?.positionBottom ?? 8,
      companyBottom: signatureData.spacings?.companyBottom ?? 12,
      contactBottom: signatureData.spacings?.contactBottom ?? 6,
      phoneToMobile: signatureData.spacings?.phoneToMobile ?? 4,
      mobileToEmail: signatureData.spacings?.mobileToEmail ?? 4,
      emailToWebsite: signatureData.spacings?.emailToWebsite ?? 4,
      websiteToAddress: signatureData.spacings?.websiteToAddress ?? 4,
      separatorTop: signatureData.spacings?.separatorTop ?? 12,
      separatorBottom: signatureData.spacings?.separatorBottom ?? 12,
      logoToSocial: signatureData.spacings?.logoToSocial ?? 12,
      verticalSeparatorLeft:
        signatureData.spacings?.verticalSeparatorLeft ?? 22,
      verticalSeparatorRight:
        signatureData.spacings?.verticalSeparatorRight ?? 22,
    },
    detailedSpacing: signatureData.detailedSpacing ?? false,
    typography: {
      fullName: {
        fontFamily:
          signatureData.typography?.fullName?.fontFamily || "Arial, sans-serif",
        fontSize: signatureData.typography?.fullName?.fontSize || 16,
        color: signatureData.typography?.fullName?.color || "#171717",
        fontWeight: signatureData.typography?.fullName?.fontWeight || "normal",
        fontStyle: signatureData.typography?.fullName?.fontStyle || "normal",
        textDecoration:
          signatureData.typography?.fullName?.textDecoration || "none",
      },
      position: {
        fontFamily:
          signatureData.typography?.position?.fontFamily || "Arial, sans-serif",
        fontSize: signatureData.typography?.position?.fontSize || 14,
        color: signatureData.typography?.position?.color || "#666666",
        fontWeight: signatureData.typography?.position?.fontWeight || "normal",
        fontStyle: signatureData.typography?.position?.fontStyle || "normal",
        textDecoration:
          signatureData.typography?.position?.textDecoration || "none",
      },
      company: {
        fontFamily:
          signatureData.typography?.company?.fontFamily || "Arial, sans-serif",
        fontSize: signatureData.typography?.company?.fontSize || 14,
        color: signatureData.typography?.company?.color || "#171717",
        fontWeight: signatureData.typography?.company?.fontWeight || "normal",
        fontStyle: signatureData.typography?.company?.fontStyle || "normal",
        textDecoration:
          signatureData.typography?.company?.textDecoration || "none",
      },
      email: {
        fontFamily:
          signatureData.typography?.email?.fontFamily || "Arial, sans-serif",
        fontSize: signatureData.typography?.email?.fontSize || 12,
        color: signatureData.typography?.email?.color || "#666666",
        fontWeight: signatureData.typography?.email?.fontWeight || "normal",
        fontStyle: signatureData.typography?.email?.fontStyle || "normal",
        textDecoration:
          signatureData.typography?.email?.textDecoration || "none",
      },
      phone: {
        fontFamily:
          signatureData.typography?.phone?.fontFamily || "Arial, sans-serif",
        fontSize: signatureData.typography?.phone?.fontSize || 12,
        color: signatureData.typography?.phone?.color || "#666666",
        fontWeight: signatureData.typography?.phone?.fontWeight || "normal",
        fontStyle: signatureData.typography?.phone?.fontStyle || "normal",
        textDecoration:
          signatureData.typography?.phone?.textDecoration || "none",
      },
      mobile: {
        fontFamily:
          signatureData.typography?.mobile?.fontFamily || "Arial, sans-serif",
        fontSize: signatureData.typography?.mobile?.fontSize || 12,
        color: signatureData.typography?.mobile?.color || "#666666",
        fontWeight: signatureData.typography?.mobile?.fontWeight || "normal",
        fontStyle: signatureData.typography?.mobile?.fontStyle || "normal",
        textDecoration:
          signatureData.typography?.mobile?.textDecoration || "none",
      },
      website: {
        fontFamily:
          signatureData.typography?.website?.fontFamily || "Arial, sans-serif",
        fontSize: signatureData.typography?.website?.fontSize || 12,
        color: signatureData.typography?.website?.color || "#666666",
        fontWeight: signatureData.typography?.website?.fontWeight || "normal",
        fontStyle: signatureData.typography?.website?.fontStyle || "normal",
        textDecoration:
          signatureData.typography?.website?.textDecoration || "none",
      },
      address: {
        fontFamily:
          signatureData.typography?.address?.fontFamily || "Arial, sans-serif",
        fontSize: signatureData.typography?.address?.fontSize || 12,
        color: signatureData.typography?.address?.color || "#666666",
        fontWeight: signatureData.typography?.address?.fontWeight || "normal",
        fontStyle: signatureData.typography?.address?.fontStyle || "normal",
        textDecoration:
          signatureData.typography?.address?.textDecoration || "none",
      },
    },
    imageSize: signatureData.imageSize ?? 80,
    imageShape: signatureData.imageShape || "round",
    logoSize: signatureData.logoSize ?? 60,
  };

  console.log(
    "🚀 Input GraphQL préparé:",
    JSON.stringify(signatureInput, null, 2),
  );

  // Appeler l'API GraphQL pour sauvegarder
  const graphqlEndpoint =
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";

  // Déterminer si c'est une création ou une mise à jour
  const isUpdate = signatureId && !signatureId.startsWith("temp-");
  console.log(
    "🔄 Mode:",
    isUpdate ? "Mise à jour" : "Création",
    "pour ID:",
    signatureId,
  );

  const mutation = isUpdate
    ? `
      mutation UpdateEmailSignature($input: UpdateEmailSignatureInput!) {
        updateEmailSignature(input: $input) {
          id
          signatureName
          updatedAt
        }
      }
    `
    : `
      mutation CreateEmailSignature($input: EmailSignatureInput!) {
        createEmailSignature(input: $input) {
          id
          signatureName
          createdAt
        }
      }
    `;

  const graphqlResponse = await fetch(graphqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: isUpdate
          ? { id: signatureId, ...signatureInput }
          : signatureInput,
      },
    }),
  });

  if (!graphqlResponse.ok) {
    const errorText = await graphqlResponse.text();
    console.error("❌ Erreur HTTP GraphQL:", graphqlResponse.status, errorText);
    throw new Error(`Erreur GraphQL: ${graphqlResponse.status} - ${errorText}`);
  }

  const graphqlResult = await graphqlResponse.json();
  console.log("📥 Réponse GraphQL:", JSON.stringify(graphqlResult, null, 2));

  if (graphqlResult.errors) {
    console.error(
      "❌ Erreurs GraphQL:",
      JSON.stringify(graphqlResult.errors, null, 2),
    );
    throw new Error(graphqlResult.errors[0]?.message || "Erreur GraphQL");
  }

  const savedSignature = isUpdate
    ? graphqlResult.data?.updateEmailSignature
    : graphqlResult.data?.createEmailSignature;

  if (!savedSignature) {
    throw new Error("Aucune signature retournée par GraphQL");
  }

  console.log("✅ Signature sauvegardée automatiquement:", savedSignature.id);

  return NextResponse.json({
    success: true,
    signatureId: savedSignature.id,
    signatureName: savedSignature.signatureName,
    message: "Signature sauvegardée automatiquement",
  });
}

export const POST = withErrorHandler(handler);
