import { describe, it, expect } from "vitest";
import {
  isSecretLocation,
  isSecretUrl,
  SECRET_HISTORY_GUARD_SOURCE,
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
  "/rdv/gerer/jeton",
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

// Garde de l'historique du script du <head>, sur une fenêtre simulée : les
// appels qui atteignent l'historique du navigateur et les location.assign
// sont relevés.
const garde = new Function(
  `${SECRET_PAGE_INLINE_SOURCE}${SECRET_HISTORY_GUARD_SOURCE}; return __guardSecretNavigation;`,
)();

function fenetre(adresse = "https://www.newbi.fr/mentions-legales") {
  const ecouteurs = {};
  const releve = { assign: [], pushState: [], replaceState: [] };
  const w = {
    location: {
      href: adresse,
      origin: new URL(adresse).origin,
      assign: (url) => releve.assign.push(url),
    },
    history: {
      pushState: (state, title, url) => releve.pushState.push(url),
      replaceState: (state, title, url) => releve.replaceState.push(url),
    },
    addEventListener: (type, ecouteur) => {
      (ecouteurs[type] ||= []).push(ecouteur);
    },
  };
  garde(w);
  const evenement = (type, detail = {}) =>
    (ecouteurs[type] || []).forEach((ecouteur) => ecouteur(detail));
  return { history: w.history, releve, evenement };
}

const TRANSFERT = "/transfer/abc123?key=xyz";
const TRANSFERT_COMPLET = `https://www.newbi.fr${TRANSFERT}`;

describe("Navigation interne vers une page à secret : un seul rechargement", () => {
  it("pushState puis replaceState de Next.js vers la même adresse : un seul location.assign, rien dans l'historique", () => {
    const { history, releve } = fenetre();
    // pushState externe (lien, router.push), puis HistoryUpdater de Next.js
    // qui recopie l'adresse avec son état interne
    history.pushState({}, "", TRANSFERT);
    history.replaceState({ __NA: true }, "", TRANSFERT);
    history.replaceState({ __NA: true }, "", TRANSFERT_COMPLET);
    expect(releve.assign).toEqual([TRANSFERT_COMPLET]);
    expect(releve.pushState).toEqual([]);
    expect(releve.replaceState).toEqual([]);
  });

  it("adresse sans secret, adresse e-mail seule ou état sans adresse : l'historique du navigateur est appelé", () => {
    const { history, releve } = fenetre();
    history.pushState({}, "", "/tarifs");
    history.pushState({}, "", "/auth/login?invitation=x&email=a%40b.fr");
    history.replaceState({ a: 1 }, "");
    expect(releve.pushState).toEqual([
      "/tarifs",
      "/auth/login?invitation=x&email=a%40b.fr",
    ]);
    expect(releve.replaceState).toEqual([undefined]);
    expect(releve.assign).toEqual([]);
  });

  it("une autre adresse à secret : nouveau chargement", () => {
    const { history, releve } = fenetre();
    history.pushState({}, "", TRANSFERT);
    history.pushState({}, "", "/auth/reset-password?token=abc");
    expect(releve.assign).toEqual([
      TRANSFERT_COMPLET,
      "https://www.newbi.fr/auth/reset-password?token=abc",
    ]);
  });

  it.each(["pointerdown", "keydown"])(
    "nouvelle action de l'utilisateur (%s) : la même adresse se recharge de nouveau (chargement interrompu)",
    (type) => {
      const { history, releve, evenement } = fenetre();
      history.pushState({}, "", TRANSFERT);
      evenement(type);
      history.pushState({}, "", TRANSFERT);
      expect(releve.assign).toEqual([TRANSFERT_COMPLET, TRANSFERT_COMPLET]);
      expect(releve.pushState).toEqual([]);
    },
  );

  it("retour sur la page depuis le cache du navigateur : la même adresse se recharge de nouveau", () => {
    const { history, releve, evenement } = fenetre();
    history.pushState({}, "", TRANSFERT);
    evenement("pageshow", { persisted: false });
    history.pushState({}, "", TRANSFERT);
    expect(releve.assign).toEqual([TRANSFERT_COMPLET]);
    evenement("pageshow", { persisted: true });
    history.pushState({}, "", TRANSFERT);
    expect(releve.assign).toEqual([TRANSFERT_COMPLET, TRANSFERT_COMPLET]);
  });
});
