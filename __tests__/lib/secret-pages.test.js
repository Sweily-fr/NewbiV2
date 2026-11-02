import { describe, it, expect } from "vitest";
import {
  isSecretLocation,
  isSecretUrl,
  SECRET_PAGE_INLINE_SOURCE,
} from "@/src/lib/secret-pages";

// Fonction du script du <head>, évaluée comme dans le navigateur

const inline = new Function(
  `${SECRET_PAGE_INLINE_SOURCE}; return __isSecretPage;`,
)();
const rechargement = new Function(
  `${SECRET_PAGE_INLINE_SOURCE}; return __needsFullReload;`,
)();

const SECRETES = [
  "/transfer/abc123?key=xyz",
  "/transfer/return?token=abc",
  "/public/kanban/jeton",
  "/pay/invoice/0123456789abcdef01234567/cancel?t=x",
  "/accept-invitation/0123456789abcdef01234567?email=a%40b.fr",
  "/invitation-gestionnaire/0123456789abcdef01234567",
  "/auth/reset-password?token=abc",
  "/auth/verify-email?token=abc",
  "/reactivate-account?email=a%40b.fr&token=abc",
  "/auth/login?invitation=abc&email=a%40b.fr",
  "/dashboard/outils/transferts-fichiers/abc?key=xyz",
];
const PUBLIQUES = [
  "/",
  "/tarifs",
  "/blog/facture?utm_source=google",
  "/auth/login",
  "/auth/signup",
  "/dashboard",
  "/dashboard/outils/transferts-fichiers",
  "/publications",
  "/transfert-de-fichiers",
];

describe("Pages à secret : aucune balise tierce", () => {
  it.each(SECRETES)("%s : page à secret", (adresse) => {
    const url = new URL(adresse, "https://www.newbi.fr");
    expect(isSecretLocation(url.pathname, url.search)).toBe(true);
    expect(isSecretUrl(`https://www.newbi.fr${adresse}`)).toBe(true);
    expect(inline(url)).toBe(true);
  });

  it.each(PUBLIQUES)("%s : balises permises", (adresse) => {
    const url = new URL(adresse, "https://www.newbi.fr");
    expect(isSecretLocation(url.pathname, url.search)).toBe(false);
    expect(inline(url)).toBe(false);
  });

  it("navigation interne : rechargement complet pour un lien secret, pas pour une adresse e-mail seule", () => {
    const u = (a) => new URL(a, "https://www.newbi.fr");
    expect(rechargement(u("/transfer/abc?key=x"))).toBe(true);
    expect(rechargement(u("/auth/reset-password?token=x"))).toBe(true);
    expect(rechargement(u("/auth/verify?email=a%40b.fr"))).toBe(false);
    expect(rechargement(u("/auth/login?invitation=x&email=a%40b.fr"))).toBe(
      false,
    );
    expect(rechargement(u("/tarifs"))).toBe(false);
  });

  it("adresse illisible : pas de plantage", () => {
    expect(isSecretUrl(undefined)).toBe(false);
    expect(isSecretLocation(undefined)).toBe(false);
  });
});
