import { describe, it, expect, vi, beforeEach } from "vitest";

// happy-dom ne fait pas tourner DOMPurify comme un navigateur (il retire le
// premier élément et saute la suite) : on vérifie ici la configuration
// transmise et le repli sans DOM ; le comportement réel est éprouvé dans
// Chromium par la suite tests-e2e (kanban/securite, clients/securite).
const purify = vi.hoisted(() => ({
  isSupported: true,
  sanitize: vi.fn((value) => `nettoyé:${value}`),
}));
vi.mock("dompurify", () => ({ default: purify }));

import { sanitizeRichText } from "@/src/utils/sanitize-html";

beforeEach(() => {
  purify.isSupported = true;
  purify.sanitize.mockClear();
});

describe("sanitizeRichText", () => {
  it("passe par DOMPurify avec la liste de la mise en forme seulement", () => {
    expect(sanitizeRichText("<b>gras</b>")).toBe("nettoyé:<b>gras</b>");
    const config = purify.sanitize.mock.calls[0][1];
    expect(config.ALLOWED_TAGS).toEqual(
      expect.arrayContaining(["b", "i", "u", "ul", "ol", "li", "a", "span"]),
    );
    for (const tag of ["img", "svg", "script", "style", "iframe", "form"]) {
      expect(config.ALLOWED_TAGS).not.toContain(tag);
    }
    expect(config.ALLOWED_ATTR).toEqual(
      expect.arrayContaining(["href", "data-mention-id", "data-mention-name"]),
    );
    for (const attr of ["style", "class", "src", "onerror"]) {
      expect(config.ALLOWED_ATTR).not.toContain(attr);
    }
    expect(config.ALLOW_DATA_ATTR).toBe(false);
  });

  it("sans DOM (rendu serveur) : texte seul, échappé", () => {
    purify.isSupported = false;
    expect(
      sanitizeRichText('<img src=x onerror="alert(1)">Prix "<b>5 €</b>" & co'),
    ).toBe("Prix &quot;5 €&quot; &amp; co");
    expect(purify.sanitize).not.toHaveBeenCalled();
  });

  it("valeurs vides", () => {
    expect(sanitizeRichText(null)).toBe("");
    expect(sanitizeRichText(undefined)).toBe("");
    expect(sanitizeRichText("")).toBe("");
    expect(purify.sanitize).not.toHaveBeenCalled();
  });
});
