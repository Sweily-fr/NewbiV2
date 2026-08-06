import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  verifySiret,
  siretVerificationMessage,
  SIRET_VERIFICATION_ERRORS,
} from "@/src/lib/siret-verification";

/**
 * Ces tests couvrent la garantie sur laquelle repose la restriction B2B de
 * l'app : un compte ne peut être finalisé que derrière un SIRET réellement
 * immatriculé et en activité. Chaque cas de refus doit rester un refus.
 */

const VALID_SIRET = "12345678901234";

function registryResponse(body) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  };
}

/** Établissement actif appartenant à une unité légale active. */
function activeCompany(overrides = {}) {
  return {
    siren: "123456789",
    nom_complet: "SARL BOULANGERIE DUPONT",
    etat_administratif: "A",
    nature_juridique: "5499",
    date_creation: "2015-03-01",
    activite_principale: "10.71C",
    siege: {
      siret: VALID_SIRET,
      etat_administratif: "A",
      adresse: "12 RUE DES LILAS",
      libelle_commune: "MARSEILLE",
      code_postal: "13001",
      activite_principale: "10.71C",
    },
    ...overrides,
  };
}

describe("verifySiret", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("accepte un établissement actif et remonte les données du registre", async () => {
    fetch.mockResolvedValue(registryResponse({ results: [activeCompany()] }));

    const result = await verifySiret(VALID_SIRET);

    expect(result.ok).toBe(true);
    expect(result.company).toMatchObject({
      siret: VALID_SIRET,
      siren: "123456789",
      denominationUniteLegale: "SARL BOULANGERIE DUPONT",
      activitePrincipale: "10.71C",
      addressCity: "MARSEILLE",
      addressZipCode: "13001",
    });
  });

  it("accepte un établissement secondaire remonté par matching_etablissements", async () => {
    const company = activeCompany({
      siege: { siret: "99999999999999", etat_administratif: "A" },
      matching_etablissements: [
        {
          siret: VALID_SIRET,
          etat_administratif: "A",
          libelle_commune: "LYON",
          code_postal: "69002",
        },
      ],
    });
    fetch.mockResolvedValue(registryResponse({ results: [company] }));

    const result = await verifySiret(VALID_SIRET);

    expect(result.ok).toBe(true);
    expect(result.company.addressCity).toBe("LYON");
  });

  it("refuse un format invalide sans appeler le registre", async () => {
    const result = await verifySiret("123");

    expect(result).toEqual({
      ok: false,
      reason: SIRET_VERIFICATION_ERRORS.INVALID_FORMAT,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refuse un SIRET absent du registre", async () => {
    fetch.mockResolvedValue(registryResponse({ results: [] }));

    const result = await verifySiret(VALID_SIRET);

    expect(result.reason).toBe(SIRET_VERIFICATION_ERRORS.NOT_FOUND);
  });

  it("refuse un SIRET voisin qui ne correspond pas exactement", async () => {
    // La recherche plein texte peut renvoyer des établissements proches :
    // seule une égalité stricte doit être acceptée.
    const neighbour = activeCompany({
      siege: { siret: "12345678909999", etat_administratif: "A" },
    });
    fetch.mockResolvedValue(registryResponse({ results: [neighbour] }));

    const result = await verifySiret(VALID_SIRET);

    expect(result.reason).toBe(SIRET_VERIFICATION_ERRORS.NOT_FOUND);
  });

  it("refuse un établissement fermé", async () => {
    const closed = activeCompany();
    closed.siege.etat_administratif = "F";
    fetch.mockResolvedValue(registryResponse({ results: [closed] }));

    const result = await verifySiret(VALID_SIRET);

    expect(result.reason).toBe(SIRET_VERIFICATION_ERRORS.INACTIVE);
  });

  it("refuse un établissement ouvert dans une unité légale cessée", async () => {
    const ceased = activeCompany({ etat_administratif: "C" });
    fetch.mockResolvedValue(registryResponse({ results: [ceased] }));

    const result = await verifySiret(VALID_SIRET);

    expect(result.reason).toBe(SIRET_VERIFICATION_ERRORS.INACTIVE);
  });

  it("échoue en fermeture quand le registre est injoignable", async () => {
    // Fail-closed : une panne du registre ne doit jamais valider un SIRET
    // non vérifié.
    fetch.mockRejectedValue(new Error("network down"));

    const result = await verifySiret(VALID_SIRET);

    expect(result.reason).toBe(SIRET_VERIFICATION_ERRORS.SERVICE_UNAVAILABLE);
  });

  it("réessaie une fois sur erreur serveur puis abandonne", async () => {
    fetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });

    const result = await verifySiret(VALID_SIRET);

    expect(result.reason).toBe(SIRET_VERIFICATION_ERRORS.SERVICE_UNAVAILABLE);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("ne réessaie pas sur une erreur client définitive", async () => {
    fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });

    await verifySiret(VALID_SIRET);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("normalise les espaces avant vérification", async () => {
    fetch.mockResolvedValue(registryResponse({ results: [activeCompany()] }));

    const result = await verifySiret("123 456 789 01234");

    expect(result.ok).toBe(true);
    expect(result.company.siret).toBe(VALID_SIRET);
  });
});

describe("siretVerificationMessage", () => {
  it("donne un message distinct par cause de refus", () => {
    const messages = Object.values(SIRET_VERIFICATION_ERRORS).map(
      siretVerificationMessage,
    );

    expect(new Set(messages).size).toBe(messages.length);
    messages.forEach((message) => expect(message.length).toBeGreaterThan(0));
  });
});
