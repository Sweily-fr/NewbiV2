import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

/**
 * Fenêtre « Configuration de votre entreprise » : tous les champs exigés
 * pour générer un document, avec la recherche au registre, enregistrés sans
 * passer par les paramètres.
 */

const m = vi.hoisted(() => ({ updateOrganization: vi.fn() }));

vi.mock("@/src/lib/organization-client", () => ({
  updateOrganization: (...args) => m.updateOrganization(...args),
}));
vi.mock("@/src/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { email: "jean@exemple.fr" } } }),
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { CompanyInfoForm } from "@/src/components/company-info-form";

const STUDIO = {
  nom_complet: "STUDIO DUPONT",
  siren: "123456789",
  nature_juridique: "5720",
  siege: {
    siret: "12345678900011",
    adresse: "12 RUE DE LA PAIX 75002 PARIS",
    code_postal: "75002",
    libelle_commune: "PARIS",
  },
};

function mockFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      const json = (body) => ({ ok: true, json: async () => body });
      if (url.startsWith("/api/search-companies")) {
        return json({ results: [STUDIO] });
      }
      if (url.startsWith("/api/check-siret")) return json({ available: true });
      throw new Error(`fetch inattendu : ${url}`);
    }),
  );
}

// Espace créé à l'inscription sans SIRET : seul le nom est connu.
const ORG = { id: "org1", companyName: "Jean Dupont" };

const renderForm = (props = {}) =>
  render(
    <CompanyInfoForm
      organization={ORG}
      onCancel={vi.fn()}
      onSaved={vi.fn()}
      {...props}
    />,
  );

describe("CompanyInfoForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch();
    m.updateOrganization.mockResolvedValue({});
  });

  it("pré-remplit le nom de l'espace et l'e-mail du compte", () => {
    renderForm();

    expect(screen.getByLabelText(/Raison sociale/)).toHaveValue("Jean Dupont");
    expect(screen.getByLabelText(/E-mail de contact/)).toHaveValue(
      "jean@exemple.fr",
    );
    // Forme juridique pas encore choisie : ni RCS ni capital demandés
    expect(screen.queryByLabelText(/Numéro RCS/)).toBeNull();
  });

  it("remplit tout depuis la recherche, demande RCS et capital d'une SASU, enregistre", async () => {
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSaved });

    await user.type(
      screen.getByPlaceholderText("Nom de l'entreprise, SIRET ou SIREN..."),
      "studio dupont",
    );
    await user.click(await screen.findByText("STUDIO DUPONT"));

    await waitFor(() =>
      expect(screen.getByLabelText(/Numéro SIRET/)).toHaveValue(
        "12345678900011",
      ),
    );
    expect(screen.getByLabelText(/Raison sociale/)).toHaveValue(
      "STUDIO DUPONT",
    );
    expect(screen.getByLabelText(/Adresse/)).toHaveValue("12 RUE DE LA PAIX");
    expect(screen.getByLabelText(/Code postal/)).toHaveValue("75002");
    expect(screen.getByLabelText(/Ville/)).toHaveValue("PARIS");

    // SASU : RCS et capital social exigés sur les documents
    await user.type(
      screen.getByLabelText(/Numéro RCS/),
      "RCS Paris 123 456 789",
    );
    await user.type(screen.getByLabelText(/Capital social/), "1000");

    await user.click(
      screen.getByRole("button", { name: "Enregistrer et continuer" }),
    );

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [orgId, payload] = m.updateOrganization.mock.calls[0];
    expect(orgId).toBe("org1");
    expect(payload).toEqual({
      name: "STUDIO DUPONT",
      companyName: "STUDIO DUPONT",
      companyEmail: "jean@exemple.fr",
      addressStreet: "12 RUE DE LA PAIX",
      addressZipCode: "75002",
      addressCity: "PARIS",
      addressCountry: "France",
      legalForm: "SASU",
      siret: "12345678900011",
      siren: "123456789",
      rcs: "RCS Paris 123 456 789",
      capitalSocial: "1000",
    });
  });

  it("n'enregistre rien tant qu'un champ requis manque", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(
      screen.getByRole("button", { name: "Enregistrer et continuer" }),
    );

    expect(
      await screen.findByText("Le numéro SIRET est requis"),
    ).toBeInTheDocument();
    expect(m.updateOrganization).not.toHaveBeenCalled();
  });

  it("affiche le motif quand le serveur refuse le SIRET", async () => {
    m.updateOrganization.mockImplementation(async (id, data, options) => {
      options.onError({
        code: "SIRET_REJECTED",
        message: "Ce numéro SIRET est introuvable au registre des entreprises.",
      });
      throw new Error("refusé");
    });
    const onSaved = vi.fn();
    const user = userEvent.setup();
    renderForm({
      onSaved,
      organization: {
        id: "org1",
        companyName: "Jean Dupont",
        companyEmail: "jean@exemple.fr",
        addressStreet: "1 rue de Paris",
        addressZipCode: "75001",
        addressCity: "Paris",
        legalForm: "EI",
      },
    });

    await user.type(screen.getByLabelText(/Numéro SIRET/), "12345678901234");
    await user.click(
      screen.getByRole("button", { name: "Enregistrer et continuer" }),
    );

    expect(
      await screen.findByText(
        "Ce numéro SIRET est introuvable au registre des entreprises.",
      ),
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
