import { describe, it, expect } from "vitest";
import {
  getOnboardingStep,
  parseOnboardingData,
  isValidTransition,
  VALID_STEPS,
} from "@/src/lib/onboarding";

describe("getOnboardingStep", () => {
  it("returns 'workspace' for null user", () => {
    expect(getOnboardingStep(null)).toBe("workspace");
  });

  it("returns the user's onboardingStep when valid", () => {
    expect(getOnboardingStep({ onboardingStep: "plan" })).toBe("plan");
    expect(getOnboardingStep({ onboardingStep: "completed" })).toBe(
      "completed",
    );
  });

  it("falls back to 'completed' when hasSeenOnboarding=true and no step", () => {
    expect(getOnboardingStep({ hasSeenOnboarding: true })).toBe("completed");
  });

  it("defaults to 'workspace' when nothing is set", () => {
    expect(getOnboardingStep({})).toBe("workspace");
  });
});

describe("parseOnboardingData", () => {
  it("returns null for empty input", () => {
    expect(parseOnboardingData("")).toBeNull();
    expect(parseOnboardingData(null)).toBeNull();
    expect(parseOnboardingData(undefined)).toBeNull();
  });

  it("parses valid JSON object", () => {
    expect(parseOnboardingData('{"companyName":"Acme"}')).toEqual({
      companyName: "Acme",
    });
  });

  it("returns null on corrupt JSON", () => {
    expect(parseOnboardingData("{not json")).toBeNull();
  });
});

describe("isValidTransition", () => {
  it("VALID_STEPS includes completed", () => {
    expect(VALID_STEPS).toContain("completed");
  });

  // Historical 3-step transitions (must continue to work — flag OFF)
  it("workspace → plan is valid", () => {
    expect(isValidTransition("workspace", "plan")).toBe(true);
  });

  it("plan → recap is valid", () => {
    expect(isValidTransition("plan", "recap")).toBe(true);
  });

  it("recap → completed is valid", () => {
    expect(isValidTransition("recap", "completed")).toBe(true);
  });

  // Lot 3 shortcut: app-managed trial flow
  it("workspace → completed is valid (app-trial signup shortcut)", () => {
    expect(isValidTransition("workspace", "completed")).toBe(true);
  });

  // Forbidden transitions
  it("workspace → recap is not valid", () => {
    expect(isValidTransition("workspace", "recap")).toBe(false);
  });

  it("plan → completed is not valid", () => {
    expect(isValidTransition("plan", "completed")).toBe(false);
  });

  it("completed → anything is not valid", () => {
    expect(isValidTransition("completed", "workspace")).toBe(false);
    expect(isValidTransition("completed", "plan")).toBe(false);
  });

  it("backward transitions are allowed", () => {
    expect(isValidTransition("plan", "workspace")).toBe(true);
    expect(isValidTransition("recap", "plan")).toBe(true);
  });

  it("same step is idempotent", () => {
    expect(isValidTransition("workspace", "workspace")).toBe(true);
    expect(isValidTransition("plan", "plan")).toBe(true);
  });

  it("unknown steps are rejected", () => {
    expect(isValidTransition("bogus", "plan")).toBe(false);
    expect(isValidTransition("plan", "bogus")).toBe(false);
  });
});
