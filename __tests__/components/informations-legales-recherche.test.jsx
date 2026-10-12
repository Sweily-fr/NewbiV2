import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import { InformationsLegalesSection } from "@/src/components/settings/informations-legales-section";

/**
 * Paramètres > Informations légales : la recherche au registre remplit le
 * SIRET, la forme juridique, la raison sociale et l'adresse, sans rien
 * enregistrer.
 */

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

let formApi;
function Harness() {
  const methods = useForm({
    defaultValues: {
      name: "Jean Dupont",
      address: { street: "", city: "", postalCode: "", country: "France" },
      legal: { siret: "", legalForm: "", regime: "", category: "" },
    },
  });
  formApi = methods;
  return (
    <TooltipProvider>
      <FormProvider {...methods}>
        <InformationsLegalesSection organization={{ id: "org" }} />
        {/* Comme le bouton Enregistrer du modal des paramètres */}
        <span data-testid="dirty">{String(methods.formState.isDirty)}</span>
      </FormProvider>
    </TooltipProvider>
  );
}

function mockFetch({ available = true } = {}) {
  const fetchMock = vi.fn(async (url) => {
    const json = (body) => ({ ok: true, json: async () => body });
    if (url.startsWith("/api/search-companies")) {
      return json({ results: [STUDIO] });
    }
    if (url.startsWith("/api/check-siret")) {
      return json(
        available
          ? { available: true }
          : {
              available: false,
              message:
                "Ce numéro SIRET est déjà associé à un compte existant sur Newbi.",
            },
      );
    }
    throw new Error(`fetch inattendu : ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function searchAndPick(user) {
  await user.type(
    screen.getByPlaceholderText("Nom de l'entreprise, SIRET ou SIREN..."),
    "studio dupont",
  );
  await user.click(await screen.findByText("STUDIO DUPONT"));
}

describe("Informations légales : recherche d'entreprise", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("remplit SIRET, forme juridique, raison sociale et adresse", async () => {
    mockFetch();
    const user = userEvent.setup();
    render(<Harness />);

    await searchAndPick(user);

    await waitFor(() =>
      expect(formApi.getValues("legal.siret")).toBe("12345678900011"),
    );
    expect(formApi.getValues("legal.legalForm")).toBe("SASU");
    // Le nom de l'espace provisoire (prénom et nom) laisse place à la
    // raison sociale.
    expect(formApi.getValues("name")).toBe("STUDIO DUPONT");
    expect(formApi.getValues("address")).toEqual({
      street: "12 RUE DE LA PAIX",
      city: "PARIS",
      postalCode: "75002",
      country: "France",
    });
    expect(screen.getByTestId("dirty")).toHaveTextContent("true");
    expect(
      screen.getByText(/reprises du registre.*Vérifiez-les puis enregistrez/),
    ).toBeInTheDocument();
  });

  it("ne remplit rien quand le SIRET appartient à un autre espace", async () => {
    mockFetch({ available: false });
    const user = userEvent.setup();
    render(<Harness />);

    await searchAndPick(user);

    expect(
      await screen.findByText(/Demandez une invitation à son administrateur/),
    ).toBeInTheDocument();
    expect(formApi.getValues("legal.siret")).toBe("");
    expect(formApi.getValues("name")).toBe("Jean Dupont");
  });
});
