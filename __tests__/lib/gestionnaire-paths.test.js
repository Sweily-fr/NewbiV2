import { describe, it, expect } from "vitest";
import {
  isGestionnairePath,
  managerLandingRedirect,
} from "@/src/lib/gestionnaire-paths";

const HOME = "/dashboard/gestionnaire?espace=sans-abonnement";

// Cabinet dans son propre espace, sans abonnement, sur l'accueil
const base = {
  isManager: true,
  access: "readonly",
  managedClient: false,
  pathname: "/dashboard",
  search: "",
};

describe("isGestionnairePath", () => {
  it("reconnaît l'espace gestionnaire et ses pages, rien d'autre", () => {
    expect(isGestionnairePath("/dashboard/gestionnaire")).toBe(true);
    expect(isGestionnairePath("/dashboard/gestionnaire/factures")).toBe(true);
    expect(isGestionnairePath("/dashboard/gestionnaires")).toBe(false);
    expect(isGestionnairePath("/dashboard")).toBe(false);
  });
});

describe("managerLandingRedirect", () => {
  it("renvoie un cabinet sans abonnement vers son espace gestionnaire", () => {
    expect(managerLandingRedirect(base)).toBe(HOME);
    expect(managerLandingRedirect({ ...base, access: "none" })).toBe(HOME);
    expect(
      managerLandingRedirect({
        ...base,
        pathname: "/dashboard/outils/factures",
      }),
    ).toBe(HOME);
  });

  it("laisse un cabinet dans un espace abonné ou en essai", () => {
    expect(managerLandingRedirect({ ...base, access: "full" })).toBeNull();
  });

  it("laisse un cabinet dans le dossier d'un client qu'il suit", () => {
    expect(managerLandingRedirect({ ...base, managedClient: true })).toBeNull();
  });

  it("ne renvoie jamais en boucle depuis l'espace gestionnaire", () => {
    expect(
      managerLandingRedirect({ ...base, pathname: "/dashboard/gestionnaire" }),
    ).toBeNull();
    expect(
      managerLandingRedirect({
        ...base,
        pathname: "/dashboard/gestionnaire/devis",
      }),
    ).toBeNull();
  });

  it("ne fait rien sans page connue (préchargement, hors middleware)", () => {
    expect(managerLandingRedirect({ ...base, pathname: null })).toBeNull();
    expect(managerLandingRedirect({ ...base, pathname: "" })).toBeNull();
  });

  it("laisse finir un retour de paiement Stripe", () => {
    expect(
      managerLandingRedirect({ ...base, search: "?subscription_success=true" }),
    ).toBeNull();
  });

  it("ne concerne pas les autres utilisateurs", () => {
    expect(managerLandingRedirect({ ...base, isManager: false })).toBeNull();
  });
});
