import { NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { mongoDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  getOnboardingStep,
  parseOnboardingData,
  isValidTransition,
  VALID_STEPS,
} from "@/src/lib/onboarding";

/**
 * PATCH /api/onboarding/step
 *
 * Update the authenticated user's onboarding step and/or data.
 * Validates transitions server-side (no skipping steps).
 *
 * Body: { step: string, data?: object }
 *   - step: the target step ("workspace" | "plan" | "recap" | "completed")
 *   - data: optional object to merge into onboardingData
 *
 * Returns: { step, data, changed }
 *   - changed: false if the request was idempotent (no DB write)
 */
export async function PATCH(request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body JSON invalide" },
        { status: 400 },
      );
    }

    const { step: targetStep, data: incomingData } = body;

    // Validate target step
    if (!targetStep || !VALID_STEPS.includes(targetStep)) {
      return NextResponse.json(
        {
          error: "Étape invalide",
          validSteps: VALID_STEPS.filter((s) => s !== "completed"),
        },
        { status: 400 },
      );
    }

    // Clients cannot set "completed" directly — only the Stripe webhook does that
    if (targetStep === "completed") {
      console.warn(
        `⚠️ [ONBOARDING STEP] ${session.user.email} a tenté de passer à "completed" depuis le client`,
      );
      return NextResponse.json(
        { error: "La finalisation de l'onboarding est gérée par le paiement" },
        { status: 403 },
      );
    }

    // Validate data shape if provided
    if (
      incomingData !== undefined &&
      (typeof incomingData !== "object" ||
        incomingData === null ||
        Array.isArray(incomingData))
    ) {
      return NextResponse.json(
        { error: "Le champ data doit être un objet" },
        { status: 400 },
      );
    }

    // Read current state from DB (not session — session may be stale)
    const user = await mongoDb
      .collection("user")
      .findOne(
        { _id: new ObjectId(session.user.id) },
        {
          projection: {
            onboardingStep: 1,
            onboardingData: 1,
            hasSeenOnboarding: 1,
          },
        },
      );

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    const currentStep = getOnboardingStep(user);
    const currentData = parseOnboardingData(user.onboardingData);

    // User already completed onboarding — reject any change
    if (currentStep === "completed") {
      return NextResponse.json(
        { error: "L'onboarding est déjà terminé" },
        { status: 400 },
      );
    }

    // Validate transition
    if (!isValidTransition(currentStep, targetStep)) {
      console.warn(
        `⚠️ [ONBOARDING STEP] ${session.user.email}: transition refusée ${currentStep} → ${targetStep}`,
      );
      return NextResponse.json(
        {
          error: `Transition invalide : ${currentStep} → ${targetStep}`,
          currentStep,
        },
        { status: 400 },
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
      // Nothing to write — pure idempotent response
      return NextResponse.json({
        step: currentStep,
        data: currentData,
        changed: false,
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
      .updateOne(
        { _id: new ObjectId(session.user.id) },
        { $set: updateFields },
      );

    const finalStep = isSameStep ? currentStep : targetStep;
    const finalData = dataChanged ? mergedData : currentData;

    console.log(
      `✅ [ONBOARDING STEP] ${session.user.email}: ${currentStep} → ${finalStep}${dataChanged ? " (data updated)" : ""}`,
    );

    return NextResponse.json({
      step: finalStep,
      data: finalData,
      changed: true,
    });
  } catch (error) {
    console.error("❌ [ONBOARDING STEP] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
