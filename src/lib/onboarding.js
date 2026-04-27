/**
 * Centralized onboarding step resolution.
 *
 * Handles three cases:
 * 1. New users with onboardingStep set → return its value
 * 2. Legacy users with hasSeenOnboarding=true but no onboardingStep → "completed"
 * 3. Legacy users with neither field → "workspace" (beginning of onboarding)
 *
 * Use this helper EVERYWHERE instead of reading user.onboardingStep directly.
 */

export const VALID_STEPS = ["workspace", "plan", "recap", "completed"];

/**
 * @param {Object} user - User object from session or DB (must have onboardingStep and/or hasSeenOnboarding)
 * @returns {"workspace" | "plan" | "recap" | "completed"}
 */
export function getOnboardingStep(user) {
  if (!user) return "workspace";

  // New field exists and has a valid value → use it
  if (user.onboardingStep && VALID_STEPS.includes(user.onboardingStep)) {
    return user.onboardingStep;
  }

  // Legacy fallback: field missing or invalid, derive from hasSeenOnboarding
  if (user.hasSeenOnboarding === true) {
    return "completed";
  }

  return "workspace";
}

/**
 * Parse onboardingData JSON string safely.
 * @param {string|null|undefined} raw - JSON string from user.onboardingData
 * @returns {Object|null} Parsed data or null if empty/corrupt
 */
export function parseOnboardingData(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    console.warn("⚠️ [ONBOARDING] Corrupt onboardingData, ignoring:", raw);
    return null;
  }
}

/**
 * Allowed step transitions (forward only).
 * Key = current step, value = set of allowed next steps.
 */
const ALLOWED_TRANSITIONS = {
  workspace: new Set(["plan"]),
  plan: new Set(["recap"]),
  recap: new Set(["completed"]),
};

/**
 * Validate that a step transition is allowed.
 * @param {string} currentStep
 * @param {string} nextStep
 * @returns {boolean}
 */
export function isValidTransition(currentStep, nextStep) {
  const currentIndex = VALID_STEPS.indexOf(currentStep);
  const nextIndex = VALID_STEPS.indexOf(nextStep);

  // Invalid step values
  if (currentIndex === -1 || nextIndex === -1) return false;

  // Cannot transition away from completed
  if (currentStep === "completed") return false;

  // Same step = idempotent (double-click, retry after network error)
  if (currentStep === nextStep) return true;

  // Forward: only to the immediate next step (no skipping)
  if (ALLOWED_TRANSITIONS[currentStep]?.has(nextStep)) return true;

  // Backward: allowed (user clicks dot to go back to a previous step)
  if (nextIndex < currentIndex) return true;

  return false;
}
