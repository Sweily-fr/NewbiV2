import { describe, expect, it } from "vitest";
import { choisir } from "../../tests-e2e/choisir-tests.mjs";

const DOSSIERS = ["factures", "factures-achat", "rendez-vous", "kanban", "transferts", "clients"];

describe("choix des tests e2e d'une release", () => {
  it("seulement le dossier de la fonctionnalité touchée, plus le socle", () => {
    expect(choisir(["app/rdv/_components/event-confirmation.jsx", "src/hooks/useBooking.js"], DOSSIERS)).toEqual({
      fichiers: "rendez-vous socle.spec.mjs",
      machines: 1,
      tout: false,
    });
  });

  it("plusieurs fonctionnalités : un dossier chacune, une machine par dossier", () => {
    const choix = choisir(["app/dashboard/outils/kanban/page.jsx", "app/transfer/[shareLink]/page.jsx"], DOSSIERS);
    expect(choix.fichiers).toBe("kanban transferts socle.spec.mjs");
    expect(choix.machines).toBe(2);
  });

  it("un fichier de tests ou de ses données → son dossier", () => {
    expect(choisir(["tests-e2e/clients/liste.spec.mjs"], DOSSIERS).fichiers).toBe("clients socle.spec.mjs");
    expect(choisir(["tests-e2e/donnees/lot-rendez-vous.mjs"], DOSSIERS).fichiers).toBe("rendez-vous socle.spec.mjs");
  });

  it("un fichier du socle → toute la suite sur 16 machines", () => {
    for (const fichier of ["package.json", "next.config.js", "src/middleware.js", "tests-e2e/outils.mjs"]) {
      expect(choisir(["app/rdv/page.jsx", fichier], DOSSIERS)).toEqual({ fichiers: "", machines: 16, tout: true });
    }
  });

  it("un fichier partagé sans fonctionnalité → le socle seul", () => {
    expect(choisir(["src/components/ui/button.jsx", "public/logo.svg"], DOSSIERS)).toEqual({
      fichiers: "socle.spec.mjs",
      machines: 1,
      tout: false,
    });
  });
});
