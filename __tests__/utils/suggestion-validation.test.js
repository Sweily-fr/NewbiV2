import { describe, it, expect } from "vitest";
import {
  validateTitle,
  validateDescription,
  validateStepsToReproduce,
  validateSeverity,
  validateSuggestionForm,
  SUGGESTION_ERRORS,
} from "@/src/utils/suggestionValidation";

describe("validateTitle", () => {
  it("rejects empty/whitespace title with required error", () => {
    expect(validateTitle("")).toEqual({
      valid: false,
      error: SUGGESTION_ERRORS.title.required,
    });
    expect(validateTitle("   ")).toEqual({
      valid: false,
      error: SUGGESTION_ERRORS.title.required,
    });
    expect(validateTitle(null)).toEqual({
      valid: false,
      error: SUGGESTION_ERRORS.title.required,
    });
  });

  it("rejects titles shorter than 3 chars with tooShort error", () => {
    expect(validateTitle("ab").error).toBe(SUGGESTION_ERRORS.title.tooShort);
  });

  it("rejects titles longer than 100 chars with tooLong error", () => {
    expect(validateTitle("a".repeat(101)).error).toBe(
      SUGGESTION_ERRORS.title.tooLong,
    );
  });

  it("rejects titles with disallowed characters (e.g. < >)", () => {
    expect(validateTitle("<script>").error).toBe(
      SUGGESTION_ERRORS.title.invalid,
    );
  });

  it.each([
    "Bug rapport",
    "Suggestion d'amélioration",
    "Problème (urgent) - 3eme jour",
  ])("accepts valid title: %s", (title) => {
    expect(validateTitle(title).valid).toBe(true);
  });
});

describe("validateDescription", () => {
  it("rejects empty/whitespace description", () => {
    expect(validateDescription("").error).toBe(
      SUGGESTION_ERRORS.description.required,
    );
  });

  it("rejects descriptions under 10 chars", () => {
    expect(validateDescription("court").error).toBe(
      SUGGESTION_ERRORS.description.tooShort,
    );
  });

  it("rejects descriptions over 1000 chars", () => {
    expect(validateDescription("a".repeat(1001)).error).toBe(
      SUGGESTION_ERRORS.description.tooLong,
    );
  });

  it("accepts descriptions with newlines (multi-line)", () => {
    const multiline = "Ligne 1\nLigne 2\nLigne 3 avec assez de contenu.";
    expect(validateDescription(multiline).valid).toBe(true);
  });
});

describe("validateStepsToReproduce", () => {
  it("returns valid when not required and empty", () => {
    expect(validateStepsToReproduce("", false)).toEqual({
      valid: true,
      error: null,
    });
  });

  it("returns required error when required and empty", () => {
    expect(validateStepsToReproduce("", true).error).toBe(
      SUGGESTION_ERRORS.stepsToReproduce.required,
    );
  });

  it("rejects steps under 10 chars when provided", () => {
    expect(validateStepsToReproduce("court").error).toBe(
      SUGGESTION_ERRORS.stepsToReproduce.tooShort,
    );
  });

  it("rejects steps over 500 chars", () => {
    expect(validateStepsToReproduce("a".repeat(501)).error).toBe(
      SUGGESTION_ERRORS.stepsToReproduce.tooLong,
    );
  });
});

describe("validateSeverity", () => {
  it.each([["low"], ["medium"], ["high"], ["critical"]])(
    "accepts valid severity: %s",
    (severity) => {
      expect(validateSeverity(severity).valid).toBe(true);
    },
  );

  it("rejects unknown severity", () => {
    expect(validateSeverity("urgent").error).toBe(
      SUGGESTION_ERRORS.severity.invalid,
    );
  });

  it("returns required error for empty when isRequired=true", () => {
    expect(validateSeverity(null, true).error).toBe(
      SUGGESTION_ERRORS.severity.required,
    );
  });

  it("returns valid for empty when not required", () => {
    expect(validateSeverity(null, false)).toEqual({
      valid: true,
      error: null,
    });
  });
});

describe("validateSuggestionForm", () => {
  const validBug = {
    title: "Bug critique",
    description: "Description avec assez de caractères pour valider.",
    stepsToReproduce: "1. Aller sur la page\n2. Cliquer sur le bouton",
    severity: "high",
  };

  it("validates a complete bug form", () => {
    expect(validateSuggestionForm(validBug, "bug")).toEqual({
      valid: true,
      errors: {},
    });
  });

  it("requires steps and severity for bugs", () => {
    const result = validateSuggestionForm(
      { title: validBug.title, description: validBug.description },
      "bug",
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({
      stepsToReproduce: SUGGESTION_ERRORS.stepsToReproduce.required,
      severity: SUGGESTION_ERRORS.severity.required,
    });
  });

  it("does not require steps/severity for non-bug types", () => {
    const result = validateSuggestionForm(
      { title: validBug.title, description: validBug.description },
      "feature",
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("collects multiple errors at once", () => {
    const result = validateSuggestionForm(
      { title: "ab", description: "court" },
      "feature",
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("title");
    expect(result.errors).toHaveProperty("description");
  });
});
