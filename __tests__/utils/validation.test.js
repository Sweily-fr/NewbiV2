import { describe, it, expect } from "vitest";
import {
  validateField,
  sanitizeInput,
  VALIDATION_PATTERNS,
} from "@/src/lib/validation";

describe("validateField — address fields", () => {
  describe("street", () => {
    it.each([
      ["123 Rue de la Paix", true],
      ["7 bis, avenue des Champs", true],
      ["Saint-Étienne 12", true],
    ])("accepts valid street: %s", (value, expected) => {
      expect(validateField(value, "street", true).isValid).toBe(expected);
    });

    it.each([
      ["7/9 jojo", "slash not allowed"],
      ["ab", "too short (< 3 chars)"],
      ["@invalid", "special char not allowed"],
    ])("rejects invalid street: %s (%s)", (value) => {
      expect(validateField(value, "street", true).isValid).toBe(false);
    });
  });

  describe("city", () => {
    it.each([
      ["Paris", true],
      ["Saint-Étienne", true],
      ["L'Haÿ-les-Roses", true],
    ])("accepts valid city: %s", (value, expected) => {
      expect(validateField(value, "city", true).isValid).toBe(expected);
    });

    it.each([
      ["P@ris", "@ not allowed"],
      ["Paris123", "digits not allowed in city"],
      ["A", "too short"],
    ])("rejects invalid city: %s (%s)", (value) => {
      expect(validateField(value, "city", true).isValid).toBe(false);
    });
  });

  describe("postalCode (French format)", () => {
    it.each([
      ["75001", true],
      ["01000", true],
      ["98000", true],
    ])("accepts valid French postal code: %s", (value) => {
      expect(validateField(value, "postalCode", true).isValid).toBe(true);
    });

    it.each([
      ["00001", "department 00 does not exist"],
      ["99001", "department 99 does not exist"],
      ["7500", "too short"],
      ["750001", "too long"],
      ["ABCDE", "letters not allowed"],
    ])("rejects invalid postal code: %s (%s)", (value) => {
      expect(validateField(value, "postalCode", true).isValid).toBe(false);
    });
  });

  describe("country", () => {
    it.each([["France"], ["États-Unis"], ["Royaume-Uni"]])(
      "accepts valid country: %s",
      (value) => {
        expect(validateField(value, "country", true).isValid).toBe(true);
      },
    );
  });
});

describe("validateField — contact fields", () => {
  describe("email", () => {
    it.each([
      ["user@example.com", true],
      ["first.last+tag@sub.example.co.uk", true],
    ])("accepts valid email: %s", (value) => {
      expect(validateField(value, "email", true).isValid).toBe(true);
    });

    it.each([
      ["not-an-email", "missing @"],
      ["user@", "missing domain"],
      ["@example.com", "missing local part"],
      ["user@example", "missing TLD"],
    ])("rejects invalid email: %s (%s)", (value) => {
      expect(validateField(value, "email", true).isValid).toBe(false);
    });
  });

  describe("phone (French format)", () => {
    it.each([
      ["+33612345678", true],
      ["0612345678", true],
      ["06.12.34.56.78", true],
      ["06 12 34 56 78", true],
      ["0033612345678", true],
    ])("accepts valid French phone: %s", (value) => {
      expect(validateField(value, "phone", true).isValid).toBe(true);
    });

    it.each([
      ["123", "too short"],
      ["+1 555 123 4567", "non-French number"],
      ["0012345678", "starts with invalid prefix"],
    ])("rejects invalid phone: %s (%s)", (value) => {
      expect(validateField(value, "phone", true).isValid).toBe(false);
    });
  });
});

describe("validateField — legal fields", () => {
  it("accepts valid SIREN (9 digits)", () => {
    expect(validateField("123456789", "siren", true).isValid).toBe(true);
  });

  it("rejects SIREN with wrong length", () => {
    expect(validateField("12345678", "siren", true).isValid).toBe(false);
    expect(validateField("1234567890", "siren", true).isValid).toBe(false);
  });

  it("accepts valid SIRET (14 digits)", () => {
    expect(validateField("12345678901234", "siret", true).isValid).toBe(true);
  });

  it("rejects SIRET with letters", () => {
    expect(validateField("ABCDEFGHIJKLMN", "siret", true).isValid).toBe(false);
  });

  it.each([
    ["FR12345678901", true],
    ["DE123456789", true],
    ["FRABC", true],
  ])("accepts valid VAT number: %s", (value) => {
    expect(validateField(value, "vatNumber", true).isValid).toBe(true);
  });

  it("rejects VAT number with lowercase country code", () => {
    expect(validateField("fr12345678901", "vatNumber", true).isValid).toBe(
      false,
    );
  });
});

describe("validateField — banking fields", () => {
  it("accepts valid French IBAN", () => {
    expect(
      validateField("FR1420041010050500013M02606", "iban", true).isValid,
    ).toBe(true);
  });

  it("rejects IBAN with lowercase", () => {
    expect(
      validateField("fr1420041010050500013M02606", "iban", true).isValid,
    ).toBe(false);
  });

  it.each([
    ["BNPAFRPP", "8 chars"],
    ["BNPAFRPPXXX", "11 chars"],
  ])("accepts valid BIC: %s (%s)", (value) => {
    expect(validateField(value, "bic", true).isValid).toBe(true);
  });

  it("rejects BIC with wrong length", () => {
    expect(validateField("BNPA", "bic", true).isValid).toBe(false);
    expect(validateField("BNPAFRPPXXXX", "bic", true).isValid).toBe(false);
  });
});

describe("validateField — required vs optional", () => {
  it("rejects empty value when required", () => {
    const result = validateField("", "city", true);
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Ce champ est requis");
  });

  it("rejects whitespace-only value when required", () => {
    expect(validateField("   ", "city", true).isValid).toBe(false);
  });

  it("accepts empty value when not required", () => {
    expect(validateField("", "city", false).isValid).toBe(true);
  });

  it("accepts null when not required", () => {
    expect(validateField(null, "city", false).isValid).toBe(true);
  });
});

describe("validateField — security", () => {
  it("rejects values that exceed 1000 chars", () => {
    const huge = "a".repeat(1001);
    const result = validateField(huge, "description", true);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain("trop longue");
  });

  it("strips HTML before validating", () => {
    // companyName allows alphanumeric — sanitize removes <b> tags, leaves "Acme"
    const result = validateField("<b>Acme</b>", "companyName", true);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe("Acme");
  });
});

describe("sanitizeInput", () => {
  it("removes <script> tags entirely", () => {
    expect(sanitizeInput("<script>alert(1)</script>hello")).toBe("hello");
  });

  it("strips HTML tags but keeps inner text", () => {
    expect(sanitizeInput("<b>bold</b>")).toBe("bold");
  });

  it("removes javascript: protocol", () => {
    expect(sanitizeInput("javascript:alert(1)")).not.toContain("javascript:");
  });

  it("removes on* event handlers", () => {
    expect(sanitizeInput('onclick="alert(1)"')).not.toMatch(/onclick\s*=/i);
  });

  it("lowercases emails", () => {
    expect(sanitizeInput("USER@Example.COM", "email")).toBe("user@example.com");
  });

  it("strips spaces from phone numbers", () => {
    expect(sanitizeInput("06 12 34 56 78", "phone")).toBe("0612345678");
  });

  it("returns empty string for null/undefined input", () => {
    expect(sanitizeInput(null)).toBe("");
    expect(sanitizeInput(undefined)).toBe("");
    expect(sanitizeInput(123)).toBe("");
  });
});

describe("VALIDATION_PATTERNS", () => {
  it("exposes patterns for all expected fields", () => {
    const expected = [
      "companyName",
      "email",
      "phone",
      "website",
      "street",
      "city",
      "postalCode",
      "country",
      "iban",
      "bic",
      "siren",
      "siret",
      "vatNumber",
    ];
    for (const field of expected) {
      expect(VALIDATION_PATTERNS[field]).toBeDefined();
      expect(VALIDATION_PATTERNS[field].pattern).toBeInstanceOf(RegExp);
      expect(typeof VALIDATION_PATTERNS[field].message).toBe("string");
    }
  });
});
