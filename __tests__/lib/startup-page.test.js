// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { STARTUP_PAGE_ROUTES, startupPagePath } from "@/src/lib/startup-page";

describe("Page de démarrage après la connexion", () => {
  it("chaque page proposée existe dans l'application", () => {
    for (const [page, url] of Object.entries(STARTUP_PAGE_ROUTES)) {
      const chemin = new URL(url, "http://localhost").pathname;
      const fichier = path.join(process.cwd(), "app", chemin, "page.jsx");
      expect(fs.existsSync(fichier), `${page} → ${chemin}`).toBe(true);
    }
  });

  it("« Collaborateurs » ouvre les paramètres sur l'onglet des espaces", () => {
    expect(startupPagePath("collaborateurs")).toBe(
      "/dashboard?openSettings=true&settingsTab=espaces",
    );
  });

  it("dernière page, valeur absente ou inconnue : l'accueil", () => {
    expect(startupPagePath("last-page")).toBe("/dashboard");
    expect(startupPagePath(undefined)).toBe("/dashboard");
    expect(startupPagePath("page-disparue")).toBe("/dashboard");
  });
});
