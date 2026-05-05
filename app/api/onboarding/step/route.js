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

  const { step: targetStep, data: incomingData } = validation.data;

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
