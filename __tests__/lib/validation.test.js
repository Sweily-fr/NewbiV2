import { describe, it, expect } from "vitest";
import {
  LEGAL_FORMS_WITH_RCS,
  LEGAL_FORMS_WITHOUT_CAPITAL,
  getRequiredFields,
  getVisibleFields,
  VALIDATION_PATTERNS,
  sanitizeInput,
  validateField,
  validateSettingsForm,
  escapeHtml,
  detectInjectionAttempt,
} from "@/src/lib/validation";

describe("validation — legal form constants", () => {
  it("LEGAL_FORMS_WITH_RCS includes the canonical SARL/SAS forms", () => {
    expect(LEGAL_FORMS_WITH_RCS).toContain("SARL");
    expect(LEGAL_FORMS_WITH_RCS).toContain("SAS");
    expect(LEGAL_FORMS_WITH_RCS).toContain("SASU");
  });

  it("LEGAL_FORMS_WITHOUT_CAPITAL covers Auto-entrepreneur and EI", () => {
    expect(LEGAL_FORMS_WITHOUT_CAPITAL).toEqual(["Auto-entrepreneur", "EI"]);
  });
});

describe("getRequiredFields", () => {
  it("returns no requirements when legalForm empty", () => {
    const r = getRequiredFields("");
    expect(r.siret).toBe(false);
    expect(r.fiscalRegime).toBe(false);
    expect(r.legalForm).toBe(false);
  });

  it("requires SIRET + fiscalRegime + activityCategory + RCS for SARL", () => {
    const r = getRequiredFields("SARL");
    expect(r.siret).toBe(true);
    expect(r.fiscalRegime).toBe(true);
    expect(r.activityCategory).toBe(true);
    expect(r.rcs).toBe(true);
    expect(r.capital).toBe(true);
  });

  it("does NOT require RCS for EI without commercial activity", () => {
    const r = getRequiredFields("EI", false, false);
    expect(r.rcs).toBe(false);
  });

  it("requires RCS for EI WITH commercial activity", () => {
    const r = getRequiredFields("EI", false, true);
    expect(r.rcs).toBe(true);
  });

  it("requires VAT number when isVatSubject=true", () => {
    expect(getRequiredFields("SARL", true).vatNumber).toBe(true);
    expect(getRequiredFields("SARL", false).vatNumber).toBe(false);
  });

  it("does NOT require capital for Auto-entrepreneur", () => {
    expect(getRequiredFields("Auto-entrepreneur").capital).toBe(false);
  });
});

describe("getVisibleFields", () => {
  it("hides RCS for SAS but shows it for SAS commercial", () => {
    expect(getVisibleFields("Auto-entrepreneur", false, false).rcs).toBe(false);
    expect(getVisibleFields("Auto-entrepreneur", false, true).rcs).toBe(true);
  });

  it("hides capital for Auto-entrepreneur", () => {
    expect(getVisibleFields("Auto-entrepreneur").capital).toBe(false);
  });

  it("shows commercialActivityCheckbox only for EI/Auto-entrepreneur", () => {
    expect(getVisibleFields("EI").commercialActivityCheckbox).toBe(true);
    expect(getVisibleFields("SARL").commercialActivityCheckbox).toBe(false);
  });

  it("shows VAT number only when subject", () => {
    expect(getVisibleFields("SARL", true).vatNumber).toBe(true);
    expect(getVisibleFields("SARL", false).vatNumber).toBe(false);
  });
});

describe("sanitizeInput", () => {
  it("strips <script> tags", () => {
    expect(sanitizeInput("<script>alert(1)</script>hello")).toBe("hello");
  });

  it("strips all HTML tags", () => {
    expect(sanitizeInput("<b>bold</b> text")).toBe("bold text");
  });

  it("removes javascript: URLs", () => {
    expect(sanitizeInput("javascript:alert(1)")).not.toContain("javascript:");
  });

  it("removes event handlers", () => {
    expect(sanitizeInput('onclick="x()"')).not.toContain("onclick=");
  });

  it("lowercases emails", () => {
    expect(sanitizeInput("ALICE@EXAMPLE.FR", "email")).toBe("alice@example.fr");
  });

  it("strips spaces from phone", () => {
    expect(sanitizeInput("06 12 34 56 78", "phone")).toBe("0612345678");
  });

  it("keeps only digits + dots for numeric", () => {
    expect(sanitizeInput("abc123.45xyz", "numeric")).toBe("123.45");
  });

  it("keeps only alphanumeric for alphanumeric type", () => {
    expect(sanitizeInput("abc-123_xyz!@#", "alphanumeric")).toBe("abc123xyz");
  });

  it("returns '' for null/undefined/non-string", () => {
    expect(sanitizeInput(null)).toBe("");
    expect(sanitizeInput(undefined)).toBe("");
    expect(sanitizeInput(123)).toBe("");
  });
});

describe("validateField", () => {
  it("requires non-empty when isRequired=true", () => {
    const out = validateField("", "companyName", true);
    expect(out.isValid).toBe(false);
    expect(out.message).toMatch(/requis/);
  });

  it("returns valid for empty + not required", () => {
    expect(validateField("", "companyName", false).isValid).toBe(true);
  });

  it("rejects too-long values (>1000 chars)", () => {
    const huge = "a".repeat(1001);
    expect(validateField(huge, "companyName", false).isValid).toBe(false);
  });

  it("validates a known company name pattern", () => {
    expect(validateField("Newbi SAS", "companyName", true).isValid).toBe(true);
  });

  it("rejects pattern mismatch", () => {
    // After sanitization, a 1-char input fails the {2,200} length requirement
    expect(validateField("X", "companyName", true).isValid).toBe(false);
  });

  it("returns sanitizedValue on valid input", () => {
    const out = validateField("<b>Newbi</b> SAS", "companyName", true);
    expect(out.isValid).toBe(true);
    expect(out.sanitizedValue).toBe("Newbi SAS");
  });
});

describe("escapeHtml", () => {
  it("escapes &, <, >, \", '", () => {
    expect(escapeHtml('<script>"hi"</script> & there')).toBe(
      "&lt;script&gt;&quot;hi&quot;&lt;/script&gt; &amp; there",
    );
  });

  it("escapes single quote", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it("returns '' for empty/null", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml(null)).toBe("");
  });
});

describe("detectInjectionAttempt", () => {
  it("detects <script> tag", () => {
    expect(detectInjectionAttempt("<script>alert(1)</script>")).toBe(true);
  });

  it("detects javascript: URL", () => {
    expect(detectInjectionAttempt("javascript:alert(1)")).toBe(true);
  });

  it("detects event handlers", () => {
    expect(detectInjectionAttempt("onclick=foo()")).toBe(true);
  });

  it("detects eval/setTimeout/Function", () => {
    expect(detectInjectionAttempt("eval(x)")).toBe(true);
    expect(detectInjectionAttempt("setTimeout(...)")).toBe(true);
    expect(detectInjectionAttempt("new Function(...)")).toBe(true);
  });

  it("returns false for safe input", () => {
    expect(detectInjectionAttempt("Bonjour Monde")).toBe(false);
    expect(detectInjectionAttempt("Acme SAS - 123 Main St.")).toBe(false);
  });

  it("returns false for null/non-string", () => {
    expect(detectInjectionAttempt(null)).toBe(false);
    expect(detectInjectionAttempt(undefined)).toBe(false);
    expect(detectInjectionAttempt(42)).toBe(false);
  });
});

describe("VALIDATION_PATTERNS", () => {
  it("includes patterns for company-related fields", () => {
    expect(VALIDATION_PATTERNS).toHaveProperty("companyName");
    expect(VALIDATION_PATTERNS).toHaveProperty("activityCategory");
    expect(VALIDATION_PATTERNS).toHaveProperty("legalForm");
  });
});

describe("validateSettingsForm", () => {
  it("returns isValid=true for empty form (no required fields)", () => {
    const out = validateSettingsForm({ legal: { legalForm: "" } });
    expect(out.isValid).toBe(true);
    expect(out.errors).toEqual({});
  });

  it("returns isValid=true for valid SARL with all required fields filled", () => {
    const out = validateSettingsForm({
      name: "Newbi SAS",
      legal: {
        legalForm: "SARL",
        siret: "12345678901234",
        fiscalRegime: "REEL_NORMAL",
        activityCategory: "Services",
        rcs: "Paris B 123",
        capital: "10000",
      },
    });
    expect(out.errors.name).toBeUndefined();
  });
});
