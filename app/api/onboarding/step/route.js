import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { mongoDb } from "@/src/lib/mongodb";
import {
  requireSession,
  apiError,
  withErrorHandler,
  toObjectId,
} from "@/src/lib/security";
import {
  getOnboardingStep,
  parseOnboardingData,
  isValidTransition,
} from "@/src/lib/onboarding";
import { onboardingStepSchema } from "@/src/lib/schemas/onboarding-step";
import { isAppTrialEnabled } from "@/src/lib/feature-flags";
import {
  verifySiret,
  siretVerificationMessage,
  SIRET_VERIFICATION_ERRORS,
} from "@/src/lib/siret-verification";
import { grantAppTrialIfEligible } from "@/src/lib/org-creation";

/**
 * PATCH /api/onboarding/step
 *
 * Update the authenticated user's onboarding step and/or data.
 * Validates transitions server-side (no skipping steps).
 * Body validated by Zod schema (MOYEN-29).
 *
 * Returns: { step, data, changed }
 */
async function handler(request) {
  const { user: sessionUser } = await requireSession(request);

  // Parse and validate body (Principle 7)
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "Body JSON invalide");
  }

  const validation = onboardingStepSchema.safeParse(body);
  if (!validation.success) {
    const flat = validation.error.flatten();
    return apiError(400, "Données invalides", flat, flat);
  }

  const {
    step: targetStep,
    data: incomingData,
    honorDeclarationAccepted,
  } = validation.data;

  // The "completed" step shortcut is only available under the app-managed
  // trial flag. Without it, only the webhook path can mark a user completed —
  // preserving the historical Stripe-first flow exactly.
  if (targetStep === "completed" && !isAppTrialEnabled()) {
    return apiError(
      400,
      "Transition 'completed' réservée au flow app-trial (flag désactivé)",
    );
  }

  // Read current state from DB (not session — session may be stale)
  const user = await mongoDb.collection("user").findOne(
    { _id: toObjectId(sessionUser.id) },
    {
      projection: {
        onboardingStep: 1,
        onboardingData: 1,
        hasSeenOnboarding: 1,
      },
    },
  );

  if (!user) {
    return apiError(404, "Utilisateur introuvable");
  }

  const currentStep = getOnboardingStep(user);
  const currentData = parseOnboardingData(user.onboardingData);

  // User already completed onboarding — reject any change
  if (currentStep === "completed") {
    return apiError(400, "L'onboarding est déjà terminé");
  }

  // Validate transition
  if (!isValidTransition(currentStep, targetStep)) {
    console.warn(
      `⚠️ [ONBOARDING STEP] ${sessionUser.email}: transition refusée ${currentStep} → ${targetStep}`,
    );
    return apiError(
      400,
      `Transition invalide : ${currentStep} → ${targetStep}`,
    );
  }

  // Idempotent case: same step, check if data actually changed
  const isSameStep = currentStep === targetStep;
  const mergedData = incomingData
    ? { ...currentData, ...incomingData }
    : currentData;
  const mergedDataStr = mergedData ? JSON.stringify(mergedData) : null;
  const currentDataStr = user.onboardingData || null;
  const dataChanged = mergedDataStr !== currentDataStr;

  if (isSameStep && !dataChanged) {
    return NextResponse.json({
      step: currentStep,
      data: currentData,
      changed: false,
    });
  }

  // App-managed trial signup shortcut (flag ON): when transitioning to
  // "completed" from the workspace step, apply the company data directly to
  // the org that databaseHooks.user.create.after already created. Then mark
  // the user completed in a single atomic update.
  if (targetStep === "completed" && isAppTrialEnabled()) {
    const member = await mongoDb.collection("member").findOne({
      userId: new ObjectId(sessionUser.id),
    });

    if (!member) {
      return apiError(
        500,
        "Aucune organisation rattachée — état incohérent, recommencez l'inscription.",
      );
    }

    // Le schéma impose déjà `honorDeclarationAccepted === true` pour cette
    // transition ; on le revérifie ici pour que la garantie ne dépende pas
    // d'un seul point du code.
    if (honorDeclarationAccepted !== true) {
      return apiError(
        400,
        "La déclaration d'usage professionnel doit être acceptée pour terminer l'inscription.",
      );
    }

    // Vérification du SIRET auprès du registre public, à la complétion et
    // côté serveur. Le client fait déjà une recherche pour l'autocomplétion,
    // mais elle est contournable : c'est ce contrôle-ci qui garantit qu'un
    // compte terminé correspond à une entreprise réellement immatriculée et
    // en activité.
    const verification = await verifySiret(mergedData?.siret);

    if (!verification.ok) {
      const status =
        verification.reason === SIRET_VERIFICATION_ERRORS.SERVICE_UNAVAILABLE
          ? 503
          : 400;

      console.warn(
        `⚠️ [ONBOARDING STEP] ${sessionUser.email}: SIRET ${mergedData?.siret} refusé (${verification.reason})`,
      );

      return apiError(
        status,
        siretVerificationMessage(verification.reason),
        { siret: mergedData?.siret, reason: verification.reason },
        { siretVerification: verification.reason },
      );
    }

    const verifiedCompany = verification.company;
    const now = new Date();
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const orgPatch = {
      // `name` is the Better Auth native field that the org switcher reads.
      // The Lot 3 placeholder ("Mon entreprise") is set at user.create.after
      // and must be overwritten here once the user picks their company.
      name:
        mergedData?.companyName ||
        verifiedCompany.denominationUniteLegale ||
        "Mon entreprise",
      companyName:
        mergedData?.companyName ||
        verifiedCompany.denominationUniteLegale ||
        "Mon entreprise",
      // Les champs d'identité viennent du registre, pas du client : c'est la
      // source vérifiée qui fait foi.
      siret: verifiedCompany.siret,
      siren: verifiedCompany.siren,
      legalForm: mergedData?.legalForm || verifiedCompany.natureJuridique || "",
      addressStreet:
        mergedData?.addressStreet || verifiedCompany.addressStreet || "",
      addressCity: mergedData?.addressCity || verifiedCompany.addressCity || "",
      addressZipCode:
        mergedData?.addressZipCode || verifiedCompany.addressZipCode || "",
      addressCountry: mergedData?.addressCountry || "France",

      // Preuve de vérification, conservée pour pouvoir démontrer a posteriori
      // que le compte a été rattaché à une entreprise immatriculée.
      siretVerifiedAt: now,
      siretVerificationSource: "recherche-entreprises.api.gouv.fr",
      denominationUniteLegale: verifiedCompany.denominationUniteLegale,
      activitePrincipale: verifiedCompany.activitePrincipale,
      dateCreationUniteLegale: verifiedCompany.dateCreation,

      // Déclaration sur l'honneur d'usage professionnel, horodatée.
      professionalUseDeclaration: {
        acceptedAt: now,
        acceptedByUserId: sessionUser.id,
        ip: clientIp,
        userAgent: request.headers.get("user-agent") || "unknown",
      },

      onboardingCompleted: true,
      updatedAt: now,
    };

    await mongoDb
      .collection("organization")
      .updateOne({ _id: member.organizationId }, { $set: orgPatch });

    // L'essai de 30 jours ne démarre qu'ici, une fois le SIRET vérifié et la
    // déclaration signée — plus au moment du signup. Un compte non qualifié
    // n'obtient donc jamais d'accès, même temporaire.
    await grantAppTrialIfEligible({
      mongoDb,
      userId: sessionUser.id,
      organizationId: member.organizationId,
    });

    await mongoDb.collection("user").updateOne(
      { _id: toObjectId(sessionUser.id) },
      {
        $set: {
          onboardingStep: "completed",
          hasSeenOnboarding: true,
          updatedAt: now,
        },
        $unset: { onboardingData: "" },
      },
    );

    console.log(
      `✅ [ONBOARDING STEP] ${sessionUser.email}: workspace → completed (SIRET ${verifiedCompany.siret} vérifié, déclaration acceptée)`,
    );

    return NextResponse.json({
      step: "completed",
      data: mergedData || null,
      changed: true,
      organizationId: member.organizationId.toString(),
      company: {
        siret: verifiedCompany.siret,
        denomination: verifiedCompany.denominationUniteLegale,
      },
    });
  }

  // Build update
  const updateFields = { updatedAt: new Date() };

  if (!isSameStep) {
    updateFields.onboardingStep = targetStep;
  }

  if (dataChanged && mergedDataStr) {
    updateFields.onboardingData = mergedDataStr;
  }

  await mongoDb
    .collection("user")
    .updateOne({ _id: toObjectId(sessionUser.id) }, { $set: updateFields });

  const finalStep = isSameStep ? currentStep : targetStep;
  const finalData = dataChanged ? mergedData : currentData;

  console.log(
    `✅ [ONBOARDING STEP] ${sessionUser.email}: ${currentStep} → ${finalStep}${dataChanged ? " (data updated)" : ""}`,
  );

  return NextResponse.json({
    step: finalStep,
    data: finalData,
    changed: true,
  });
}

export const PATCH = withErrorHandler(handler);
