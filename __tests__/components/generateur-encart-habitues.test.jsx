/**
 * Générateur de facture gratuit : chaque téléchargement est compté sans la
 * saisie du visiteur, et à partir du 3e document l'encart des habitués
 * remplace l'encart habituel. Le téléchargement n'est jamais bloqué.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/src/utils/generatePDF", () => ({
  generatePDFFromElement: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
}));
vi.mock("@/src/components/pdf/UniversalPreviewPDF", () => ({
  default: () => <div data-testid="apercu" />,
}));
const capture = vi.fn();
vi.mock("@/src/lib/analytics", () => ({ capture: (...a) => capture(...a) }));

const { default: DocumentGenerator } =
  await import("@/app/outils/_components/DocumentGenerator");
const { FACTURE_CONFIG, DEVIS_CONFIG } =
  await import("@/app/outils/_components/configs");
const { _reinitialiserVisite } = await import("@/src/lib/outils-usage");

let fetchMock;

beforeEach(() => {
  localStorage.clear();
  _reinitialiserVisite();
  capture.mockClear();
  fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
  vi.stubGlobal("fetch", fetchMock);
  URL.createObjectURL = vi.fn(() => "blob:test");
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function telecharger() {
  fireEvent.click(
    screen.getByRole("button", { name: "Télécharger la facture en PDF" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Télécharger la facture en PDF" }),
    ).toBeEnabled(),
  );
}

describe("encart des habitués du générateur", () => {
  it("compte chaque document sans la saisie et passe à l'encart des habitués au 3e", async () => {
    render(<DocumentGenerator config={FACTURE_CONFIG} />);
    fireEvent.change(screen.getByPlaceholderText("Société Martin"), {
      target: { value: "Cœur d'Artichaut SARL" },
    });
    fireEvent.click(document.getElementById("consent"));

    await telecharger();
    await screen.findByText(/Votre facture est téléchargée/);
    expect(screen.queryByText(/Vous en êtes à votre/)).toBeNull();

    await telecharger();
    await telecharger();
    await screen.findByText(
      "Vous en êtes à votre 3e facture avec le générateur",
    );
    expect(screen.queryByText(/Votre facture est téléchargée/)).toBeNull();
    expect(
      screen.getByRole("link", { name: "Essayer Newbi 7 jours gratuits" }),
    ).toHaveAttribute("href", "/auth/signup");

    const envois = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/outils/documents",
    );
    expect(envois.map(([, o]) => JSON.parse(o.body))).toEqual([
      { outil: "facture", rang: 1, portee: "visite" },
      { outil: "facture", rang: 2, portee: "visite" },
      { outil: "facture", rang: 3, portee: "visite" },
    ]);
    for (const [, options] of envois) {
      expect(options.body).not.toContain("Artichaut");
    }
    expect(capture).toHaveBeenCalledWith(
      "generateur_document_telecharge",
      expect.objectContaining({ outil: "facture", rang: 3 }),
    );
  });

  it("les deux générateurs ont un encart des habitués avec le rang à remplir", () => {
    for (const config of [FACTURE_CONFIG, DEVIS_CONFIG]) {
      expect(config.regularUser.title).toContain("{n}");
      expect(config.regularUser.cta).toBeTruthy();
    }
  });
});
