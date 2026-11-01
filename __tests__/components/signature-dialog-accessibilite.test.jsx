/**
 * Fenêtre « Faire signer » et pad de réception d'un bon de livraison,
 * utilisables au lecteur d'écran et au clavier :
 *   - chaque signataire est un groupe nommé, chaque champ a son nom, le
 *     bouton de retrait dit quel signataire il retire ;
 *   - une adresse e-mail invalide est signalée (champ invalide, message
 *     annoncé) et l'envoi reste impossible ;
 *   - le pad de signature est nommé et décrit (signature facultative).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

vi.mock("@/src/hooks/useESignature", () => ({
  useRequestSignature: () => ({ requestSignature: vi.fn(), loading: false }),
  useEsignatureQuota: () => ({ quota: { unlimited: true } }),
}));
vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "w1" }),
}));
vi.mock("@apollo/client", async (original) => ({
  ...(await original()),
  useQuery: () => ({ data: null, loading: false }),
}));
vi.mock("@/src/components/pdf/UniversalPreviewPDF", () => ({
  default: () => null,
}));
vi.mock("@/src/utils/document-annex", () => ({
  appendAnnexInBrowser: vi.fn(),
  uint8ArrayToBase64: vi.fn(),
}));

import { SignatureDialog } from "@/src/components/esignature/signature-dialog";
import SignaturePad from "@/app/dashboard/outils/bons-de-livraison/components/signature-pad";

const ouvrir = () =>
  render(
    <SignatureDialog
      open
      onOpenChange={() => {}}
      document={{ id: "q1", number: "0001" }}
      documentType="quote"
      client={{ name: "Jeanne Dupont", email: "jeanne@exemple.fr" }}
    />,
  );

describe("Fenêtre « Faire signer »", () => {
  it("deux signataires : groupes et champs nommés, bouton de retrait nommé", () => {
    ouvrir();
    fireEvent.click(
      screen.getByRole("button", { name: /Ajouter un signataire/ }),
    );
    for (const n of [1, 2]) {
      const groupe = screen.getByRole("group", { name: `Signataire ${n}` });
      for (const champ of ["Prénom", "Nom", "E-mail", "Téléphone"]) {
        expect(
          within(groupe).getByRole("textbox", { name: champ }),
        ).toBeTruthy();
      }
    }
    fireEvent.click(
      screen.getByRole("button", { name: "Retirer le signataire 2" }),
    );
    expect(screen.queryByRole("group", { name: "Signataire 2" })).toBeNull();
  });

  it("adresse invalide : champ signalé, message annoncé, envoi impossible", () => {
    ouvrir();
    const email = within(
      screen.getByRole("group", { name: "Signataire 1" }),
    ).getByRole("textbox", { name: "E-mail" });
    fireEvent.change(email, { target: { value: "pas-un-email" } });
    fireEvent.blur(email);
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe(
      "Adresse e-mail invalide",
    );
    expect(
      screen.getByRole("button", { name: /Envoyer pour signature/ }).disabled,
    ).toBe(true);

    fireEvent.change(email, { target: { value: "jeanne@exemple.fr" } });
    expect(email.getAttribute("aria-invalid")).toBeNull();
    expect(
      screen.getByRole("button", { name: /Envoyer pour signature/ }).disabled,
    ).toBe(false);
  });
});

describe("Pad de signature de la réception", () => {
  it("nommé et décrit : signature facultative", () => {
    // happy-dom n'a pas de contexte 2D : un contexte qui ne dessine rien
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(
        () => new Proxy({}, { get: () => () => {}, set: () => true }),
      );
    render(<SignaturePad onChange={() => {}} />);
    getContext.mockRestore();
    const zone = screen.getByRole("img", {
      name: "Zone de signature du client",
    });
    const description = document.getElementById(
      zone.getAttribute("aria-describedby"),
    );
    expect(description.textContent).toMatch(/facultative/);
    expect(screen.getByRole("button", { name: /Effacer/ })).toBeTruthy();
  });
});
