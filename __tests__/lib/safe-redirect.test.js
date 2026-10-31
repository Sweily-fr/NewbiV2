import { describe, it, expect } from "vitest";
import { safeInternalPath } from "@/src/lib/safe-redirect";

const ORIGIN = "https://www.newbi.fr";

// Valeurs qui mènent hors du site ou exécutent du code : jamais suivies
const HOSTILE = [
  "https://evil.example",
  "https://evil.example/dashboard",
  "http://www.newbi.fr.evil.example/",
  "//evil.example",
  "//evil.example/dashboard",
  "/\\evil.example",
  "/\\/evil.example",
  "\\\\evil.example",
  "javascript:alert(1)",
  " javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "java\tscript:alert(1)",
  "\tjava\nscript:alert(1)",
  "/\t/evil.example",
  "/\n/evil.example",
  "data:text/html,<script>alert(1)</script>",
  "vbscript:msgbox(1)",
  "dashboard",
  " /dashboard",
  "",
  null,
  undefined,
  42,
  { pathname: "/dashboard" },
];

describe("safeInternalPath", () => {
  it.each(
    HOSTILE.map((value) => [JSON.stringify(value) ?? String(value), value]),
  )("refuse %s", (_label, value) => {
    expect(safeInternalPath(value, ORIGIN)).toBeNull();
  });

  it.each([
    ["/dashboard", "/dashboard"],
    ["/invitation-gestionnaire/abc?x=1", "/invitation-gestionnaire/abc?x=1"],
    [
      "/dashboard/outils/factures?id=1#detail",
      "/dashboard/outils/factures?id=1#detail",
    ],
    ["/dashboard/../onboarding", "/onboarding"],
    ["/recherche?q=https://exemple.fr", "/recherche?q=https://exemple.fr"],
  ])("garde le chemin interne %s", (value, expected) => {
    expect(safeInternalPath(value, ORIGIN)).toBe(expected);
  });

  it("utilise l'origine de la page par défaut", () => {
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
    expect(safeInternalPath("//evil.example")).toBeNull();
  });
});
