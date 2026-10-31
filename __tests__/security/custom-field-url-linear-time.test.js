// Champ personnalisé de type lien : la vérification du format répond
// immédiatement, même pour une saisie longue ou mal formée.
import { describe, it, expect } from "vitest";
import { validateFieldValue } from "@/app/dashboard/clients/components/custom-fields-form";

const timed = (fn) => {
  const start = performance.now();
  const result = fn();
  return { result, ms: performance.now() - start };
};

describe("champ personnalisé de type lien", () => {
  it.each([
    "https://www.exemple.fr",
    "exemple.fr/cgv",
    "https://www.exemple.fr/mes conditions/CGV_2026.pdf",
    "http://exemple.com/",
  ])("accepte %s", (value) => {
    expect(validateFieldValue("URL", value)).toBeNull();
  });

  it.each(["pas une url", "https://exemple", "https://exemple.fr/cgv?x=1"])(
    "refuse %j",
    (value) => {
      expect(validateFieldValue("URL", value)).toBe("Format URL invalide");
    },
  );

  it.each([
    `a.fr/${"a".repeat(40)}!`,
    `https://www.exemple.fr/conditions-générales-${"a".repeat(30)}`,
    `${"a.".repeat(50000)}!`,
    `https://a.fr/${"a.".repeat(50000)}!`,
  ])("refuse vite une saisie mal formée (%#)", (value) => {
    const { result, ms } = timed(() => validateFieldValue("URL", value));
    expect(result).toBe("Format URL invalide");
    expect(ms).toBeLessThan(250);
  });
});
