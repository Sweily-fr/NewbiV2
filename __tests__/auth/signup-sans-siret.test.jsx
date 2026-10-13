import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

/**
 * Étape « Créez votre espace de travail » : une entreprise sans SIRET (en
 * cours d'immatriculation, hors de France, absente du registre) doit pouvoir
 * terminer l'inscription avec un nom saisi librement.
 */

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace, back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

let session;
const baseSession = {
  user: {
    id: "507f1f77bcf86cd799439011",
    email: "u@x.fr",
    onboardingStep: "workspace",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
};

vi.mock("@/src/lib/auth-client", () => ({
  signIn: { social: vi.fn() },
  performLogout: vi.fn(),
  useSession: () => ({ data: session, isPending: false, refetch: vi.fn() }),
  authClient: { getSession: vi.fn() },
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock("@/src/components/seo/seo-head", () => ({ default: () => null }));
vi.mock("@/src/components/seo/seo-metadata", () => ({ JsonLd: () => null }));
vi.mock("@/src/hooks/use-seo", () => ({ useAuthSEO: () => ({}) }));
vi.mock("@/src/utils/trackEvent", () => ({ trackSignupConversion: vi.fn() }));
vi.mock("@/src/lib/attribution", () => ({ sendAttribution: vi.fn() }));
vi.mock("@/app/auth/signup/registerForm", () => ({ default: () => null }));

import SignUpPage from "@/app/auth/signup/page";

function mockFetch({ results = [] } = {}) {
  const fetchMock = vi.fn(async (url) => {
    const json = (body) => ({ ok: true, json: async () => body });
    if (url.startsWith("/api/feature-flags")) {
      return json({ appTrialEnabled: true });
    }
    if (url.startsWith("/api/search-companies")) return json({ results });
    if (url.startsWith("/api/check-siret")) return json({ available: true });
    if (url.startsWith("/api/onboarding/step")) {
      return json({ step: "completed", changed: true });
    }
    throw new Error(`fetch inattendu : ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const onboardingCalls = (fetchMock) =>
  fetchMock.mock.calls.filter(([url]) => url === "/api/onboarding/step");

describe("Inscription sans SIRET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Inscription par e-mail : nom de la personne inconnu.
    session = { user: { ...baseSession.user, name: "" } };
  });

  it("termine l'inscription avec le nom saisi et la déclaration", async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.click(
      await screen.findByRole("button", { name: "Continuer sans SIRET" }),
    );
    expect(
      screen.getByText("Nom de votre entreprise ou vos prénom et nom"),
    ).toBeInTheDocument();

    const submit = screen.getByRole("button", { name: "Continuer" });
    expect(submit).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText("Ex. : Studio Dupont ou Jean Dupont"),
      "Studio Dupont",
    );
    // Plus de case à cocher : la déclaration est une phrase sous le bouton,
    // cliquer sur « Continuer » vaut acceptation.
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(
      screen.getByText(
        "En continuant, vous confirmez utiliser Newbi pour une activité professionnelle, existante ou en cours de création.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    await waitFor(() => expect(onboardingCalls(fetchMock)).toHaveLength(1));
    const [, init] = onboardingCalls(fetchMock)[0];
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      step: "completed",
      honorDeclarationAccepted: true,
      data: { companyName: "Studio Dupont", siret: "", siren: "" },
    });
    // Aucune recherche au registre en mode saisie libre.
    expect(
      fetchMock.mock.calls.some(([url]) => url.includes("search-companies")),
    ).toBe(false);
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/onboarding/success"),
    );
  });

  it("propose de continuer sans SIRET quand la recherche ne trouve rien", async () => {
    mockFetch();
    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(
      await screen.findByPlaceholderText(
        "Nom de l'entreprise, SIRET ou SIREN...",
      ),
      "Entreprise introuvable",
    );

    expect(
      await screen.findByText("Aucune entreprise trouvée"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: /Votre entreprise n'apparaît pas \?/,
      }),
    );

    // Le nom tapé est conservé comme nom de l'entreprise.
    expect(
      screen.getByPlaceholderText("Ex. : Studio Dupont ou Jean Dupont"),
    ).toHaveValue("Entreprise introuvable");
    expect(screen.queryByText("Aucune entreprise trouvée")).toBeNull();

    // Retour possible à la recherche.
    await user.click(
      screen.getByRole("button", { name: "Rechercher mon entreprise" }),
    );
    expect(
      screen.getByPlaceholderText("Nom de l'entreprise, SIRET ou SIREN..."),
    ).toBeInTheDocument();
  });

  it("part des prénom et nom connus (Google, Apple) sans rien tapé", async () => {
    session = { user: { ...baseSession.user, name: "Jean Dupont" } };
    mockFetch();
    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.click(
      await screen.findByRole("button", { name: "Continuer sans SIRET" }),
    );

    expect(
      screen.getByPlaceholderText("Ex. : Studio Dupont ou Jean Dupont"),
    ).toHaveValue("Jean Dupont");
  });

  it("enregistre une forme juridique de la liste (EI, pas « Entrepreneur individuel »)", async () => {
    const fetchMock = mockFetch({
      results: [
        {
          nom_complet: "JEAN DUPONT",
          siren: "123456789",
          nature_juridique: "1000",
          siege: {
            siret: "12345678900011",
            adresse: "1 RUE DE PARIS 75001 PARIS",
            code_postal: "75001",
            libelle_commune: "PARIS",
          },
        },
      ],
    });
    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(
      await screen.findByPlaceholderText(
        "Nom de l'entreprise, SIRET ou SIREN...",
      ),
      "jean dupont",
    );
    await user.click(await screen.findByText("JEAN DUPONT"));
    await user.click(screen.getByRole("button", { name: "Continuer" }));

    await waitFor(() => expect(onboardingCalls(fetchMock)).toHaveLength(1));
    const body = JSON.parse(onboardingCalls(fetchMock)[0][1].body);
    expect(body.data).toMatchObject({
      siret: "12345678900011",
      legalForm: "EI",
      addressCountry: "France",
    });
  });
});
