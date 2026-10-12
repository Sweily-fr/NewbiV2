import { NextResponse } from "next/server";
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
import { isOwnerRole } from "@/src/lib/organization-roles";

/**
 * Espace que la fin d'onboarding va renseigner (raison sociale, SIRET,
 * adresse) et sur lequel elle ouvre l'essai.
 *
 * Jamais « la première appartenance trouvée » : un utilisateur invité dans
 * un autre espace avant d'avoir terminé son inscription aurait pu écraser
 * l'identité de l'espace qui l'a invité. On ne retient qu'un espace dont il
 * est propriétaire, dans cet ordre :
 *   1. l'espace passé dans le body (`organizationId`), s'il en est
 *      propriétaire, sinon refus ;
 *   2. l'espace actif de la session, s'il en est propriétaire ;
 *   3. son unique espace en propriété (l'espace créé à l'inscription) ;
 *      plusieurs espaces sans choix possible = refus.
 *
 * @returns {Promise<{ organizationId?: ObjectId, error?: NextResponse }>}
 */
async function resolveOnboardingOrganization(
  userId,
  activeOrganizationId,
  requestedOrganizationId,
) {
  const memberships = await mongoDb
    .collection("member")
    .find({ userId: toObjectId(userId) })
    .toArray();

  if (memberships.length === 0) {
    return {
      error: apiError(
        500,
        "Aucune organisation rattachée : état incohérent, recommencez l'inscription.",
      ),
    };
  }

  const owned = memberships.filter((m) => isOwnerRole(m.role));
  const findOwned = (orgId) =>
    owned.find((m) => String(m.organizationId) === String(orgId));

  if (requestedOrganizationId) {
    const requested = findOwned(requestedOrganizationId);
    if (!requested) {
      return {
        error: apiError(
          403,
          "Vous n'êtes pas propriétaire de cet espace.",
          `onboarding : ${userId} n'est pas propriétaire de ${requestedOrganizationId}`,
        ),
      };
    }
    return { organizationId: requested.organizationId };
  }

  const active = activeOrganizationId && findOwned(activeOrganizationId);
  if (active) return { organizationId: active.organizationId };

  if (owned.length === 1) return { organizationId: owned[0].organizationId };

  if (owned.length === 0) {
    return {
      error: apiError(
        403,
        "Aucun espace à configurer : vous n'êtes propriétaire d'aucun espace.",
        `onboarding : ${userId} n'est propriétaire d'aucun espace`,
      ),
    };
  }

  return {
    error: apiError(
      409,
      "Plusieurs espaces possibles : sélectionnez l'espace à configurer.",
      `onboarding : ${userId} est propriétaire de ${owned.length} espaces`,
    ),
  };
}

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
  const { user: sessionUser, session } = await requireSession(request);

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
    organizationId: requestedOrganizationId,
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
    const { organizationId: targetOrganizationId, error: orgError } =
      await resolveOnboardingOrganization(
        sessionUser.id,
        session?.activeOrganizationId,
        requestedOrganizationId,
      );
    if (orgError) return orgError;

    // Le schéma impose déjà `honorDeclarationAccepted === true` pour cette
    // transition ; on le revérifie ici pour que la garantie ne dépende pas
    // d'un seul point du code.
    if (honorDeclarationAccepted !== true) {
      return apiError(
        400,
        "La déclaration d'usage professionnel doit être acceptée pour terminer l'inscription.",
      );
    }

    const now = new Date();
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    // Le SIRET est facultatif : une entreprise en cours d'immatriculation ou
    // hors de France n'en a pas, et l'exiger bloquait l'inscription. Quand il
    // est fourni, il est vérifié au registre ; sinon l'espace prend le nom
    // déclaré et le SIRET sera demandé plus tard, avant le premier document
    // (cf. company-info-guard).
    const siret = mergedData?.siret || "";
    let identityPatch;
    let verifiedCompany = null;

    if (siret) {
      // Vérification du SIRET auprès du registre public, à la complétion et
      // côté serveur. Le client fait déjà une recherche pour
      // l'autocomplétion, mais elle est contournable : c'est ce contrôle-ci
      // qui garantit qu'un SIRET enregistré correspond à une entreprise
      // réellement immatriculée et en activité.
      const verification = await verifySiret(siret);

      if (!verification.ok) {
        const status =
          verification.reason === SIRET_VERIFICATION_ERRORS.SERVICE_UNAVAILABLE
            ? 503
            : 400;

        console.warn(
          `⚠️ [ONBOARDING STEP] ${sessionUser.email}: SIRET ${siret} refusé (${verification.reason})`,
        );

        // Pas de `details` public ici : le client mobile (lib/web-api.js) lit
        // `data.details` AVANT `data.error`, donc un objet de détails
        // écraserait le message lisible par un « [object Object] ». La cause
        // précise est déjà portée par le message lui-même.
        return apiError(status, siretVerificationMessage(verification.reason), {
          siret,
          reason: verification.reason,
        });
      }

      verifiedCompany = verification.company;
      const companyName =
        mergedData?.companyName ||
        verifiedCompany.denominationUniteLegale ||
        "Mon entreprise";

      identityPatch = {
        // `name` is the Better Auth native field that the org switcher reads.
        // The Lot 3 placeholder ("Mon entreprise") is set at user.create.after
        // and must be overwritten here once the user picks their company.
        name: companyName,
        companyName,
        // Les champs d'identité viennent du registre, pas du client : c'est
        // la source vérifiée qui fait foi.
        siret: verifiedCompany.siret,
        siren: verifiedCompany.siren,
        legalForm:
          mergedData?.legalForm || verifiedCompany.natureJuridique || "",
        addressStreet:
          mergedData?.addressStreet || verifiedCompany.addressStreet || "",
        addressCity:
          mergedData?.addressCity || verifiedCompany.addressCity || "",
        addressZipCode:
          mergedData?.addressZipCode || verifiedCompany.addressZipCode || "",
        addressCountry: mergedData?.addressCountry || "France",

        // Preuve de vérification, conservée pour pouvoir démontrer a
        // posteriori que le compte a été rattaché à une entreprise
        // immatriculée.
        siretVerifiedAt: now,
        siretVerificationSource: "recherche-entreprises.api.gouv.fr",
        denominationUniteLegale: verifiedCompany.denominationUniteLegale,
        activitePrincipale: verifiedCompany.activitePrincipale,
        dateCreationUniteLegale: verifiedCompany.dateCreation,
      };
    } else {
      // Le schéma l'exige déjà ; revérifié sur les données fusionnées avec
      // le brouillon enregistré, comme la déclaration plus haut.
      const companyName = mergedData?.companyName?.trim();
      if (!companyName) {
        return apiError(
          400,
          "Le nom de votre entreprise est requis pour terminer l'inscription.",
        );
      }

      // Rien n'est vérifié ici : seuls les champs saisis sont écrits, sans
      // toucher au SIRET de l'espace.
      identityPatch = {
        name: companyName,
        companyName,
        addressCountry: mergedData?.addressCountry || "France",
      };
      for (const field of [
        "legalForm",
        "addressStreet",
        "addressCity",
        "addressZipCode",
      ]) {
        if (mergedData?.[field]) identityPatch[field] = mergedData[field];
      }
    }

    const orgPatch = {
      ...identityPatch,

      // Déclaration sur l'honneur d'usage professionnel, horodatée. Sans
      // SIRET, c'est elle seule qui rattache le compte à une activité
      // professionnelle.
      professionalUseDeclaration: {
        acceptedAt: now,
        acceptedByUserId: sessionUser.id,
        ip: clientIp,
        userAgent: request.headers.get("user-agent") || "unknown",
        withSiret: Boolean(verifiedCompany),
      },

      onboardingCompleted: true,
      updatedAt: now,
    };

    await mongoDb
      .collection("organization")
      .updateOne({ _id: targetOrganizationId }, { $set: orgPatch });

    // L'essai de 30 jours ne démarre qu'ici, une fois la déclaration signée
    // (et le SIRET vérifié s'il a été fourni) — plus au moment du signup.
    await grantAppTrialIfEligible({
      mongoDb,
      userId: sessionUser.id,
      organizationId: targetOrganizationId,
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
      `✅ [ONBOARDING STEP] ${sessionUser.email}: workspace → completed (${verifiedCompany ? `SIRET ${verifiedCompany.siret} vérifié` : "sans SIRET"}, déclaration acceptée)`,
    );

    return NextResponse.json({
      step: "completed",
      data: mergedData || null,
      changed: true,
      organizationId: targetOrganizationId.toString(),
      company: {
        siret: verifiedCompany?.siret || null,
        denomination:
          verifiedCompany?.denominationUniteLegale || orgPatch.companyName,
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
